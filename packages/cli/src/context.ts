import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, extname, relative } from "path";

const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "__pycache__",
  ".venv", "venv", ".cache", "coverage", ".turbo", ".vercel",
]);

const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go", ".java",
  ".c", ".cpp", ".h", ".hpp", ".cs", ".rb", ".php", ".swift",
  ".kt", ".scala", ".vue", ".svelte", ".astro", ".md", ".mdx",
  ".json", ".yaml", ".yml", ".toml", ".sql", ".graphql", ".prisma",
  ".css", ".scss", ".html", ".xml", ".sh", ".bash", ".zsh",
  ".dockerfile", ".tf", ".hcl",
]);

export interface ProjectContext {
  root: string;
  files: string[];
  structure: string;
  packageJson?: Record<string, unknown>;
  language: string;
  framework: string;
}

function detectLanguage(files: string[]): string {
  const extCounts: Record<string, number> = {};
  for (const file of files) {
    const ext = extname(file);
    extCounts[ext] = (extCounts[ext] || 0) + 1;
  }

  const sorted = Object.entries(extCounts).sort((a, b) => b[1] - a[1]);
  const top = sorted[0]?.[0] || "";

  const langMap: Record<string, string> = {
    ".ts": "TypeScript", ".tsx": "TypeScript",
    ".js": "JavaScript", ".jsx": "JavaScript",
    ".py": "Python", ".rs": "Rust", ".go": "Go",
    ".java": "Java", ".cs": "C#", ".rb": "Ruby",
    ".php": "PHP", ".swift": "Swift", ".kt": "Kotlin",
  };

  return langMap[top] || "Unknown";
}

function detectFramework(files: string[], packageJson?: Record<string, unknown>): string {
  const deps = {
    ...(packageJson?.dependencies as Record<string, string> || {}),
    ...(packageJson?.devDependencies as Record<string, string> || {}),
  };

  if (deps["next"]) return "Next.js";
  if (deps["react"]) return "React";
  if (deps["vue"]) return "Vue";
  if (deps["svelte"]) return "Svelte";
  if (deps["@angular/core"]) return "Angular";
  if (deps["express"]) return "Express";
  if (deps["fastify"]) return "Fastify";

  if (files.some(f => f.endsWith("Cargo.toml"))) return "Rust/Cargo";
  if (files.some(f => f.endsWith("go.mod"))) return "Go";
  if (files.some(f => f.endsWith("requirements.txt") || f.endsWith("pyproject.toml"))) return "Python";

  return "Unknown";
}

function walkDirectory(dir: string, maxDepth = 4, currentDepth = 0): string[] {
  if (currentDepth > maxDepth) return [];

  const files: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith(".") || IGNORE_DIRS.has(entry)) continue;

      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...walkDirectory(fullPath, maxDepth, currentDepth + 1));
      } else if (CODE_EXTENSIONS.has(extname(entry).toLowerCase())) {
        files.push(fullPath);
      }
    }
  } catch {
    // permission denied or other errors
  }
  return files;
}

function buildTreeString(dir: string, prefix = "", maxDepth = 3, currentDepth = 0): string {
  if (currentDepth > maxDepth) return "";

  let result = "";
  try {
    const entries = readdirSync(dir).filter(e => !e.startsWith(".") && !IGNORE_DIRS.has(e)).sort();
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const isLast = i === entries.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      result += `${prefix}${connector}${entry}\n`;

      if (stat.isDirectory()) {
        const nextPrefix = prefix + (isLast ? "    " : "│   ");
        result += buildTreeString(fullPath, nextPrefix, maxDepth, currentDepth + 1);
      }
    }
  } catch {
    // skip
  }
  return result;
}

export function scanProject(root: string): ProjectContext {
  const files = walkDirectory(root).map(f => relative(root, f));
  const structure = buildTreeString(root);

  let packageJson: Record<string, unknown> | undefined;
  const pkgPath = join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      packageJson = JSON.parse(readFileSync(pkgPath, "utf-8"));
    } catch {
      // invalid package.json
    }
  }

  const language = detectLanguage(files);
  const framework = detectFramework(files, packageJson);

  return { root, files, structure, packageJson, language, framework };
}

export function readFileContent(filePath: string): string {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return `[Error reading file: ${filePath}]`;
  }
}

export function buildContextPrompt(ctx: ProjectContext, additionalFiles?: string[]): string {
  let prompt = `## Project Context\n`;
  prompt += `- **Root**: ${ctx.root}\n`;
  prompt += `- **Language**: ${ctx.language}\n`;
  prompt += `- **Framework**: ${ctx.framework}\n`;
  prompt += `- **Files**: ${ctx.files.length} source files\n\n`;
  prompt += `### Project Structure\n\`\`\`\n${ctx.structure}\`\`\`\n\n`;

  if (additionalFiles && additionalFiles.length > 0) {
    prompt += `### File Contents\n`;
    for (const file of additionalFiles) {
      const fullPath = join(ctx.root, file);
      const content = readFileContent(fullPath);
      const ext = extname(file).slice(1);
      prompt += `\n**${file}**\n\`\`\`${ext}\n${content}\n\`\`\`\n`;
    }
  }

  return prompt;
}