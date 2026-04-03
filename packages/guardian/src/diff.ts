import { execSync } from "child_process";
import { resolve } from "path";
import { randomUUID } from "crypto";
import type { ReviewIssue, ReviewSeverity, ReviewCategory } from "./types.js";

export interface DiffHunk {
  file: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  additions: string[];
  deletions: string[];
  context: string[];
}

export interface DiffSummary {
  filesChanged: number;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
  renamedFiles: string[];
  newFiles: string[];
  deletedFiles: string[];
}

export function getGitDiff(projectPath: string, ref?: string): string {
  const absPath = resolve(projectPath);
  const diffRef = ref || "HEAD~1";

  try {
    return execSync(`git diff ${diffRef}`, {
      cwd: absPath,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    try {
      return execSync("git diff --cached", {
        cwd: absPath,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch {
      return "";
    }
  }
}

export function parseDiff(rawDiff: string): DiffSummary {
  const hunks: DiffHunk[] = [];
  const newFiles: string[] = [];
  const deletedFiles: string[] = [];
  const renamedFiles: string[] = [];
  let totalAdditions = 0;
  let totalDeletions = 0;
  const changedFilesSet = new Set<string>();

  const fileBlocks = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const block of fileBlocks) {
    const fileMatch = block.match(/a\/(.+?)\s+b\/(.+)/);
    if (!fileMatch) continue;

    const oldFile = fileMatch[1];
    const newFile = fileMatch[2];

    changedFilesSet.add(newFile);

    if (block.includes("new file mode")) newFiles.push(newFile);
    if (block.includes("deleted file mode")) deletedFiles.push(oldFile);
    if (oldFile !== newFile) renamedFiles.push(`${oldFile} → ${newFile}`);

    const hunkPattern = /@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/g;
    let hunkMatch;

    while ((hunkMatch = hunkPattern.exec(block)) !== null) {
      const oldStart = parseInt(hunkMatch[1], 10);
      const oldLines = parseInt(hunkMatch[2] || "1", 10);
      const newStart = parseInt(hunkMatch[3], 10);
      const newLines = parseInt(hunkMatch[4] || "1", 10);

      const hunkIdx = hunkMatch.index;
      const nextHunkIdx = block.indexOf("@@", hunkIdx + hunkMatch[0].length);
      const hunkContent = nextHunkIdx > 0
        ? block.slice(hunkIdx + hunkMatch[0].length, nextHunkIdx)
        : block.slice(hunkIdx + hunkMatch[0].length);

      const hunkLines = hunkContent.split("\n");
      const additions: string[] = [];
      const deletions: string[] = [];
      const context: string[] = [];

      for (const line of hunkLines) {
        if (line.startsWith("+") && !line.startsWith("+++")) {
          additions.push(line.slice(1));
          totalAdditions++;
        } else if (line.startsWith("-") && !line.startsWith("---")) {
          deletions.push(line.slice(1));
          totalDeletions++;
        } else if (line.startsWith(" ")) {
          context.push(line.slice(1));
        }
      }

      hunks.push({
        file: newFile,
        oldStart, oldLines,
        newStart, newLines,
        additions, deletions, context,
      });
    }
  }

  return {
    filesChanged: changedFilesSet.size,
    additions: totalAdditions,
    deletions: totalDeletions,
    hunks,
    renamedFiles,
    newFiles,
    deletedFiles,
  };
}

export function reviewDiff(diff: DiffSummary): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  for (const hunk of diff.hunks) {
    for (let i = 0; i < hunk.additions.length; i++) {
      const line = hunk.additions[i];
      const lineNum = hunk.newStart + i;

      const checks = getDiffChecks();
      for (const check of checks) {
        if (check.pattern.test(line)) {
          issues.push({
            id: randomUUID(),
            file: hunk.file,
            line: lineNum,
            severity: check.severity,
            category: check.category,
            message: check.message,
            suggestion: check.suggestion,
            code: line.trim(),
            confidence: check.confidence,
          });
          check.pattern.lastIndex = 0;
        }
      }
    }
  }

  if (diff.filesChanged > 20) {
    issues.push({
      id: randomUUID(),
      file: "(diff)",
      line: 0,
      severity: "suggestion",
      category: "maintainability",
      message: `PR touches ${diff.filesChanged} files — consider breaking into smaller PRs`,
      confidence: 0.7,
    });
  }

  return issues;
}

interface DiffCheck {
  pattern: RegExp;
  severity: ReviewSeverity;
  category: ReviewCategory;
  message: string;
  suggestion?: string;
  confidence: number;
}

function getDiffChecks(): DiffCheck[] {
  return [
    {
      pattern: /console\.log\(/g,
      severity: "minor",
      category: "best-practice",
      message: "console.log added — should be removed before merge",
      suggestion: "Use a logger or remove debug output",
      confidence: 0.9,
    },
    {
      pattern: /debugger/g,
      severity: "major",
      category: "bug-risk",
      message: "debugger statement added",
      suggestion: "Remove debugger before merge",
      confidence: 0.95,
    },
    {
      pattern: /password\s*=\s*["'][^"']+["']/gi,
      severity: "critical",
      category: "security",
      message: "Hardcoded password in new code",
      suggestion: "Use environment variables",
      confidence: 0.9,
    },
    {
      pattern: /\beval\s*\(/g,
      severity: "critical",
      category: "security",
      message: "eval() in new code — code injection risk",
      suggestion: "Avoid eval(); use safer alternatives",
      confidence: 0.9,
    },
    {
      pattern: /\.innerHTML\s*=/g,
      severity: "major",
      category: "security",
      message: "innerHTML assignment in new code — XSS risk",
      suggestion: "Use textContent or a sanitization library",
      confidence: 0.85,
    },
  ];
}

export function formatDiffSummary(summary: DiffSummary): string {
  const lines: string[] = [];

  lines.push("┌──────────────────────────────────────────────────────────┐");
  lines.push("│              Diff Summary                                │");
  lines.push("├──────────────────────────────────────────────────────────┤");
  lines.push(`│  Files changed:  ${summary.filesChanged}`);
  lines.push(`│  Additions:      +${summary.additions}`);
  lines.push(`│  Deletions:      -${summary.deletions}`);

  if (summary.newFiles.length > 0) {
    lines.push(`│  New files:      ${summary.newFiles.length}`);
    for (const f of summary.newFiles.slice(0, 5)) {
      lines.push(`│    + ${f}`);
    }
  }

  if (summary.deletedFiles.length > 0) {
    lines.push(`│  Deleted files:  ${summary.deletedFiles.length}`);
  }

  lines.push("└──────────────────────────────────────────────────────────┘");
  return lines.join("\n");
}