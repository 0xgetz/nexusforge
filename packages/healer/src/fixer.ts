import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Bug, Fix } from "./types.js";

interface FixRule {
  category: string;
  apply: (bug: Bug, content: string) => { fixed: string; description: string; confidence: number } | null;
}

const FIX_RULES: FixRule[] = [
  {
    category: "console-removal",
    apply: (bug, content) => {
      if (bug.message.includes("Console statement")) {
        const lines = content.split("\n");
        const line = lines[bug.line - 1];
        if (line && /console\.(log|debug|info)\s*\(/.test(line)) {
          const trimmedLine = line.trim();
          lines[bug.line - 1] = line.replace(trimmedLine, `// ${trimmedLine} // removed by NexusForge`);
          return {
            fixed: lines.join("\n"),
            description: "Commented out console statement",
            confidence: 0.95,
          };
        }
      }
      return null;
    },
  },
  {
    category: "empty-catch",
    apply: (bug, content) => {
      if (bug.category === "error-handling" && bug.message.includes("Empty catch")) {
        const lines = content.split("\n");
        const line = lines[bug.line - 1];
        if (line) {
          const fixed = content.replace(
            /catch\s*\((\w+)\)\s*\{\s*\}/g,
            "catch ($1) {\n    console.error($1);\n  }"
          );
          if (fixed !== content) {
            return {
              fixed,
              description: "Added error logging to empty catch block",
              confidence: 0.9,
            };
          }
        }
      }
      return null;
    },
  },
  {
    category: "var-to-const",
    apply: (bug, content) => {
      if (bug.message.includes("'var'")) {
        const lines = content.split("\n");
        const line = lines[bug.line - 1];
        if (line && /\bvar\s+/.test(line)) {
          lines[bug.line - 1] = line.replace(/\bvar\s+/, "const ");
          return {
            fixed: lines.join("\n"),
            description: "Replaced 'var' with 'const'",
            confidence: 0.85,
          };
        }
      }
      return null;
    },
  },
  {
    category: "strict-equality",
    apply: (bug, content) => {
      if (bug.message.includes("loose equality")) {
        const lines = content.split("\n");
        const line = lines[bug.line - 1];
        if (line) {
          lines[bug.line - 1] = line.replace(/([^!=<>])={2}([^=])/g, "$1===$2");
          return {
            fixed: lines.join("\n"),
            description: "Replaced == with === for strict equality",
            confidence: 0.9,
          };
        }
      }
      return null;
    },
  },
  {
    category: "bare-except",
    apply: (bug, content) => {
      if (bug.message.includes("Bare except")) {
        const fixed = content.replace(/except\s*:/g, "except Exception:");
        if (fixed !== content) {
          return {
            fixed,
            description: "Replaced bare 'except:' with 'except Exception:'",
            confidence: 0.95,
          };
        }
      }
      return null;
    },
  },
];

export function generateFixes(bugs: Bug[], projectPath: string): Fix[] {
  const fixes: Fix[] = [];
  const fixableBugs = bugs.filter((b) => b.autoFixable);
  const fileContents = new Map<string, string>();

  for (const bug of fixableBugs) {
    const filePath = join(projectPath, bug.file);

    if (!fileContents.has(bug.file)) {
      try {
        fileContents.set(bug.file, readFileSync(filePath, "utf-8"));
      } catch {
        continue;
      }
    }

    const content = fileContents.get(bug.file)!;

    for (const rule of FIX_RULES) {
      const result = rule.apply(bug, content);
      if (result) {
        fixes.push({
          bugId: bug.id,
          file: bug.file,
          original: getLineRange(content, bug.line),
          fixed: getLineRange(result.fixed, bug.line),
          description: result.description,
          confidence: result.confidence,
        });

        fileContents.set(bug.file, result.fixed);
        break;
      }
    }
  }

  return fixes;
}

export function applyFixes(fixes: Fix[], projectPath: string): number {
  const fileFixMap = new Map<string, Fix[]>();

  for (const fix of fixes) {
    if (!fileFixMap.has(fix.file)) fileFixMap.set(fix.file, []);
    fileFixMap.get(fix.file)!.push(fix);
  }

  let appliedCount = 0;

  for (const [file, fileFixes] of fileFixMap) {
    const filePath = join(projectPath, file);
    try {
      let content = readFileSync(filePath, "utf-8");

      for (const fix of fileFixes) {
        if (content.includes(fix.original.trim())) {
          content = content.replace(fix.original.trim(), fix.fixed.trim());
          appliedCount++;
        }
      }

      writeFileSync(filePath, content, "utf-8");
    } catch {
      // skip files that can't be read/written
    }
  }

  return appliedCount;
}

function getLineRange(content: string, centerLine: number, range = 2): string {
  const lines = content.split("\n");
  const start = Math.max(0, centerLine - range - 1);
  const end = Math.min(lines.length, centerLine + range);
  return lines.slice(start, end).join("\n");
}

export function generatePatchContent(fixes: Fix[]): string {
  let patch = "";

  for (const fix of fixes) {
    patch += `--- a/${fix.file}\n`;
    patch += `+++ b/${fix.file}\n`;
    patch += `@@ Fix: ${fix.bugId} — ${fix.description} @@\n`;

    const origLines = fix.original.split("\n");
    const fixedLines = fix.fixed.split("\n");

    for (const line of origLines) {
      patch += `-${line}\n`;
    }
    for (const line of fixedLines) {
      patch += `+${line}\n`;
    }
    patch += "\n";
  }

  return patch;
}