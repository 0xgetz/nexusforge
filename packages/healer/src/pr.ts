import { execSync } from "child_process";
import { resolve } from "path";
import { analyze } from "./analyzer.js";
import { applyFixes } from "./fixer.js";
import type { Fix } from "./types.js";

export interface CreateFixPROptions {
  path: string;
  /** GitHub token with `repo` scope. Falls back to GITHUB_TOKEN in the CLI. */
  token?: string;
  /** Base branch to merge into. Defaults to the currently checked-out branch. */
  base?: string;
  /** Override the generated fix-branch name. */
  branch?: string;
  /** Directory names to skip while scanning. */
  ignore?: string[];
  /** Open the PR as a draft. */
  draft?: boolean;
  /** Apply + commit on a branch but do not push or open a PR. */
  dryRun?: boolean;
  /** Git remote to read the GitHub slug from. Defaults to "origin". */
  remote?: string;
}

export interface CreateFixPRResult {
  applied: number;
  branch: string;
  base: string;
  prUrl?: string;
  prNumber?: number;
  fixes: Fix[];
  dryRun: boolean;
}

const GITHUB_REMOTE_PATTERNS = [
  /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/,
  /^ssh:\/\/git@github\.com\/([^/]+)\/(.+?)(?:\.git)?$/,
  /^https?:\/\/(?:[^@/]+@)?github\.com\/([^/]+)\/(.+?)(?:\.git)?$/,
];

export function parseGitHubRemote(remoteUrl: string): { owner: string; repo: string } | null {
  const s = remoteUrl.trim();
  for (const re of GITHUB_REMOTE_PATTERNS) {
    const m = s.match(re);
    if (m) return { owner: m[1], repo: m[2] };
  }
  return null;
}

export function buildBranchName(prefix = "nexusforge/auto-fix"): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `-${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
  return `${prefix}-${stamp}`;
}

export function buildPRBody(fixes: Fix[]): string {
  const byFile = new Map<string, Fix[]>();
  for (const f of fixes) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file)!.push(f);
  }

  const plural = (n: number) => (n === 1 ? "" : "s");
  let body = `## 🔧 NexusForge automated fixes\n\n`;
  body += `Opened by [NexusForge Healer](https://github.com/0xgetz/nexusforge). `;
  body += `Applies **${fixes.length}** safe, auto-fixable change${plural(fixes.length)} `;
  body += `across **${byFile.size}** file${plural(byFile.size)}.\n\n`;

  for (const [file, fileFixes] of byFile) {
    body += `### \`${file}\`\n\n`;
    for (const f of fileFixes) {
      body += `- **${f.bugId}** — ${f.description} _(confidence ${Math.round(f.confidence * 100)}%)_\n`;
    }
    body += `\n`;
  }

  body += `---\n`;
  body += `> Review each change before merging — these fixes are generated automatically and runtime behaviour has not been verified.\n`;
  return body;
}

function git(args: string, cwd: string): string {
  return execSync(`git ${args}`, {
    cwd,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export async function createFixPR(options: CreateFixPROptions): Promise<CreateFixPRResult> {
  const cwd = resolve(options.path);
  const remoteName = options.remote || "origin";

  let remoteUrl: string;
  try {
    git("rev-parse --is-inside-work-tree", cwd);
    remoteUrl = git(`remote get-url ${remoteName}`, cwd);
  } catch {
    throw new Error(`Not a git repository with a "${remoteName}" remote: ${cwd}`);
  }

  const gh = parseGitHubRemote(remoteUrl);
  if (!gh) throw new Error(`Remote "${remoteName}" is not a GitHub URL: ${remoteUrl}`);

  const base = options.base || git("rev-parse --abbrev-ref HEAD", cwd);

  const result = await analyze(cwd, { fix: true, ignore: options.ignore });
  if (result.fixes.length === 0) {
    return { applied: 0, branch: "", base, fixes: [], dryRun: !!options.dryRun };
  }

  const branch = options.branch || buildBranchName();
  git(`checkout -b ${branch}`, cwd);

  const applied = applyFixes(result.fixes, cwd);
  if (applied === 0) {
    git(`checkout ${base}`, cwd);
    git(`branch -D ${branch}`, cwd);
    return { applied: 0, branch, base, fixes: result.fixes, dryRun: !!options.dryRun };
  }

  git("add -A", cwd);
  execSync(`git commit -m "fix: apply ${applied} NexusForge automated fix${applied === 1 ? "" : "es"}"`, {
    cwd,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (options.dryRun) {
    return { applied, branch, base, fixes: result.fixes, dryRun: true };
  }

  const token = options.token;
  if (!token) throw new Error("A GitHub token is required to push and open a PR (pass token or set GITHUB_TOKEN).");

  // Push via a token-authenticated URL so nothing is written to the repo config.
  execSync(`git push https://x-access-token:${token}@github.com/${gh.owner}/${gh.repo}.git ${branch}:${branch}`, {
    cwd,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const res = await fetch(`https://api.github.com/repos/${gh.owner}/${gh.repo}/pulls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "nexusforge-healer",
    },
    body: JSON.stringify({
      title: `🔧 NexusForge: ${applied} automated fix${applied === 1 ? "" : "es"}`,
      head: branch,
      base,
      body: buildPRBody(result.fixes),
      draft: !!options.draft,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub PR creation failed (${res.status}): ${text}`);
  }

  const pr = (await res.json()) as { html_url: string; number: number };
  return { applied, branch, base, prUrl: pr.html_url, prNumber: pr.number, fixes: result.fixes, dryRun: false };
}
