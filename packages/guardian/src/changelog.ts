import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve, basename } from "path";
import type { ChangelogEntry } from "./types.js";

export interface ChangelogResult {
  projectPath: string;
  timestamp: string;
  entries: ChangelogEntry[];
  markdown: string;
}

interface CommitInfo {
  hash: string;
  date: string;
  subject: string;
  body: string;
  tags: string[];
}

const COMMIT_TYPES: Record<string, keyof Pick<ChangelogEntry, "added" | "changed" | "fixed" | "removed" | "deprecated" | "security">> = {
  feat: "added",
  feature: "added",
  add: "added",
  fix: "fixed",
  bugfix: "fixed",
  patch: "fixed",
  change: "changed",
  refactor: "changed",
  perf: "changed",
  update: "changed",
  remove: "removed",
  delete: "removed",
  deprecate: "deprecated",
  deprecated: "deprecated",
  security: "security",
  sec: "security",
};

export async function generateChangelog(projectPath: string): Promise<ChangelogResult> {
  const absPath = resolve(projectPath);

  const isGitRepo = existsSync(resolve(absPath, ".git"));
  if (!isGitRepo) {
    return {
      projectPath: absPath,
      timestamp: new Date().toISOString(),
      entries: [],
      markdown: "# Changelog\n\nNo git repository found.\n",
    };
  }

  const commits = getGitCommits(absPath);
  const tags = getGitTags(absPath);
  const entries = buildChangelogEntries(commits, tags);
  const markdown = formatChangelog(entries, basename(absPath));

  return {
    projectPath: absPath,
    timestamp: new Date().toISOString(),
    entries,
    markdown,
  };
}

function getGitCommits(cwd: string): CommitInfo[] {
  try {
    const raw = execSync(
      'git log --pretty=format:"%H||%aI||%s||%b||%D" --no-merges -200',
      { cwd, encoding: "utf-8", timeout: 10000 }
    );

    return raw
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split("||");
        const tagRefs = (parts[4] || "")
          .split(",")
          .map((r) => r.trim())
          .filter((r) => r.startsWith("tag:"))
          .map((r) => r.replace("tag: ", "").trim());

        return {
          hash: parts[0],
          date: parts[1],
          subject: parts[2],
          body: parts[3] || "",
          tags: tagRefs,
        };
      });
  } catch {
    return [];
  }
}

function getGitTags(cwd: string): { tag: string; date: string }[] {
  try {
    const raw = execSync(
      'git tag -l --sort=-creatordate --format="%(refname:short)||%(creatordate:iso)"',
      { cwd, encoding: "utf-8", timeout: 5000 }
    );

    return raw
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => {
        const [tag, date] = l.split("||");
        return { tag, date };
      });
  } catch {
    return [];
  }
}

function buildChangelogEntries(commits: CommitInfo[], tags: { tag: string; date: string }[]): ChangelogEntry[] {
  const tagMap = new Map<string, string>();
  for (const { tag, date } of tags) {
    tagMap.set(tag, date);
  }

  const versionBuckets = new Map<string, CommitInfo[]>();
  let currentVersion = "Unreleased";

  for (const commit of commits) {
    if (commit.tags.length > 0) {
      const versionTag = commit.tags.find((t) => /^v?\d+\.\d+/.test(t));
      if (versionTag) {
        currentVersion = versionTag;
      }
    }

    if (!versionBuckets.has(currentVersion)) {
      versionBuckets.set(currentVersion, []);
    }
    versionBuckets.get(currentVersion)!.push(commit);
  }

  const entries: ChangelogEntry[] = [];

  for (const [version, vCommits] of versionBuckets) {
    const entry: ChangelogEntry = {
      version,
      date: vCommits[0]?.date?.split("T")[0] || new Date().toISOString().split("T")[0],
      added: [],
      changed: [],
      fixed: [],
      removed: [],
      deprecated: [],
      security: [],
    };

    for (const commit of vCommits) {
      const { type, message } = parseConventionalCommit(commit.subject);
      const category = COMMIT_TYPES[type] || "changed";
      entry[category].push(message);
    }

    entries.push(entry);
  }

  return entries;
}

function parseConventionalCommit(subject: string): { type: string; message: string } {
  const conventionalMatch = subject.match(/^(\w+)(?:\([^)]*\))?[!]?:\s*(.+)/);
  if (conventionalMatch) {
    return {
      type: conventionalMatch[1].toLowerCase(),
      message: conventionalMatch[2],
    };
  }

  const subjectLower = subject.toLowerCase();
  if (subjectLower.startsWith("fix")) return { type: "fix", message: subject };
  if (subjectLower.startsWith("add")) return { type: "feat", message: subject };
  if (subjectLower.startsWith("remove") || subjectLower.startsWith("delete")) return { type: "remove", message: subject };
  if (subjectLower.startsWith("update") || subjectLower.startsWith("refactor")) return { type: "change", message: subject };

  return { type: "change", message: subject };
}

function formatChangelog(entries: ChangelogEntry[], projectName: string): string {
  const sections: string[] = [];

  sections.push(`# ${projectName} — Changelog\n`);
  sections.push(`> Auto-generated by @nexusforge/guardian\n`);
  sections.push("All notable changes to this project will be documented in this file.\n");
  sections.push("This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).\n");

  for (const entry of entries) {
    sections.push(`---\n`);
    sections.push(`## [${entry.version}] — ${entry.date}\n`);

    if (entry.added.length > 0) {
      sections.push("### Added\n");
      for (const item of entry.added) sections.push(`- ${item}`);
      sections.push("");
    }

    if (entry.changed.length > 0) {
      sections.push("### Changed\n");
      for (const item of entry.changed) sections.push(`- ${item}`);
      sections.push("");
    }

    if (entry.fixed.length > 0) {
      sections.push("### Fixed\n");
      for (const item of entry.fixed) sections.push(`- ${item}`);
      sections.push("");
    }

    if (entry.removed.length > 0) {
      sections.push("### Removed\n");
      for (const item of entry.removed) sections.push(`- ${item}`);
      sections.push("");
    }

    if (entry.deprecated.length > 0) {
      sections.push("### Deprecated\n");
      for (const item of entry.deprecated) sections.push(`- ${item}`);
      sections.push("");
    }

    if (entry.security.length > 0) {
      sections.push("### Security\n");
      for (const item of entry.security) sections.push(`- ${item}`);
      sections.push("");
    }
  }

  return sections.join("\n");
}
