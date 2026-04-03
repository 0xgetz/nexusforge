import { readFileSync } from "fs";
import { resolve, extname, relative } from "path";
import { glob } from "glob";
import { randomUUID } from "crypto";
import type { ReviewResult, ReviewIssue, ReviewSummary, ReviewSeverity, ReviewCategory, MetricGrade } from "./types.js";
import { getBuiltinRules } from "./rules.js";

const IGNORE_DIRS = ["node_modules", "dist", "build", ".next", "__pycache__", ".git", "coverage", "vendor"];
const SUPPORTED_EXTS = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java"];

export async function reviewProject(projectPath: string): Promise<ReviewResult> {
  const start = Date.now();
  const absPath = resolve(projectPath);
  const pattern = `**/*{${SUPPORTED_EXTS.join(",")}}`;

  const files = await glob(pattern, {
    cwd: absPath,
    absolute: true,
    ignore: IGNORE_DIRS.map((d) => `**/${d}/**`),
  });

  const issues: ReviewIssue[] = [];
  const rules = getBuiltinRules();

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf-8");
      const ext = extname(file);
      const relPath = relative(absPath, file);
      const fileIssues = analyzeFile(content, relPath, ext, rules);
      issues.push(...fileIssues);
    } catch { /* skip */ }
  }

  const summary = buildSummary(issues);
  const score = calculateScore(issues, files.length);
  const grade = scoreToGrade(score);

  return {
    projectPath: absPath,
    timestamp: new Date().toISOString(),
    filesReviewed: files.length,
    issuesFound: issues,
    score,
    grade,
    summary,
    duration: Date.now() - start,
  };
}

interface Rule {
  pattern: RegExp;
  severity: ReviewSeverity;
  category: ReviewCategory;
  message: string;
  suggestion?: string;
  languages?: string[];
}

function analyzeFile(content: string, file: string, ext: string, customRules: ReturnType<typeof getBuiltinRules>): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  const lines = content.split("\n");
  const rules = getAnalysisRules(ext);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        issues.push({
          id: randomUUID(),
          file,
          line: i + 1,
          severity: rule.severity,
          category: rule.category,
          message: rule.message,
          suggestion: rule.suggestion,
          code: line.trim(),
          confidence: 0.8,
        });
        rule.pattern.lastIndex = 0;
      }
    }

    if (line.length > 200) {
      issues.push({
        id: randomUUID(),
        file,
        line: i + 1,
        severity: "minor",
        category: "readability",
        message: `Line exceeds 200 characters (${line.length})`,
        suggestion: "Consider breaking this line into multiple lines",
        confidence: 0.9,
      });
    }
  }

  if (lines.length > 500) {
    issues.push({
      id: randomUUID(),
      file,
      line: 1,
      severity: "minor",
      category: "maintainability",
      message: `File has ${lines.length} lines — consider splitting into smaller modules`,
      suggestion: "Extract related functions into separate files",
      confidence: 0.7,
    });
  }

  let maxNesting = 0;
  let currentNesting = 0;
  let maxNestLine = 0;
  for (let i = 0; i < lines.length; i++) {
    for (const char of lines[i]) {
      if (char === "{") currentNesting++;
      if (char === "}") currentNesting--;
    }
    if (currentNesting > maxNesting) {
      maxNesting = currentNesting;
      maxNestLine = i + 1;
    }
  }

  if (maxNesting > 5) {
    issues.push({
      id: randomUUID(),
      file,
      line: maxNestLine,
      severity: "major",
      category: "maintainability",
      message: `Deep nesting detected (${maxNesting} levels)`,
      suggestion: "Flatten nesting with early returns or extract helper functions",
      confidence: 0.85,
    });
  }

  return issues;
}

function getAnalysisRules(ext: string): Rule[] {
  const common: Rule[] = [
    {
      pattern: /console\.log\(/g,
      severity: "minor",
      category: "best-practice",
      message: "console.log found — remove before production",
      suggestion: "Use a proper logging library instead",
    },
    {
      pattern: /TODO|FIXME|HACK|XXX/g,
      severity: "suggestion",
      category: "maintainability",
      message: "TODO/FIXME comment found",
      suggestion: "Address this technical debt or create a tracking issue",
    },
    {
      pattern: /password\s*=\s*["'][^"']+["']/gi,
      severity: "critical",
      category: "security",
      message: "Potential hardcoded password detected",
      suggestion: "Use environment variables for sensitive data",
    },
    {
      pattern: /api[_-]?key\s*=\s*["'][^"']+["']/gi,
      severity: "critical",
      category: "security",
      message: "Potential hardcoded API key detected",
      suggestion: "Use environment variables for API keys",
    },
  ];

  const tsRules: Rule[] = [
    {
      pattern: /\bany\b/g,
      severity: "minor",
      category: "best-practice",
      message: "Usage of 'any' type reduces type safety",
      suggestion: "Replace with a specific type or 'unknown'",
      languages: [".ts", ".tsx"],
    },
    {
      pattern: /\bas\s+any\b/g,
      severity: "major",
      category: "bug-risk",
      message: "Unsafe type assertion to 'any'",
      suggestion: "Use proper type narrowing instead of 'as any'",
      languages: [".ts", ".tsx"],
    },
    {
      pattern: /eval\s*\(/g,
      severity: "critical",
      category: "security",
      message: "eval() usage detected — potential code injection risk",
      suggestion: "Avoid eval(); use safer alternatives",
    },
    {
      pattern: /\.innerHTML\s*=/g,
      severity: "major",
      category: "security",
      message: "Direct innerHTML assignment — XSS risk",
      suggestion: "Use textContent or a sanitization library",
    },
  ];

  const pyRules: Rule[] = [
    {
      pattern: /except\s*:/g,
      severity: "major",
      category: "bug-risk",
      message: "Bare except clause catches all exceptions",
      suggestion: "Catch specific exception types",
      languages: [".py"],
    },
    {
      pattern: /import\s+\*/g,
      severity: "minor",
      category: "best-practice",
      message: "Wildcard import detected",
      suggestion: "Import specific names to avoid namespace pollution",
      languages: [".py"],
    },
  ];

  if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
    return [...common, ...tsRules];
  }
  if (ext === ".py") {
    return [...common, ...pyRules];
  }

  return common;
}

function buildSummary(issues: ReviewIssue[]): ReviewSummary {
  const summary: ReviewSummary = {
    critical: 0,
    major: 0,
    minor: 0,
    suggestions: 0,
    praises: 0,
    topCategories: [],
  };

  const catCount: Record<string, number> = {};

  for (const issue of issues) {
    if (issue.severity === "critical") summary.critical++;
    else if (issue.severity === "major") summary.major++;
    else if (issue.severity === "minor") summary.minor++;
    else if (issue.severity === "suggestion") summary.suggestions++;
    else if (issue.severity === "praise") summary.praises++;

    catCount[issue.category] = (catCount[issue.category] || 0) + 1;
  }

  summary.topCategories = Object.entries(catCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category: category as ReviewCategory, count }));

  return summary;
}

function calculateScore(issues: ReviewIssue[], filesCount: number): number {
  if (filesCount === 0) return 100;

  let deductions = 0;
  for (const issue of issues) {
    if (issue.severity === "critical") deductions += 10;
    else if (issue.severity === "major") deductions += 5;
    else if (issue.severity === "minor") deductions += 2;
    else if (issue.severity === "suggestion") deductions += 0.5;
  }

  const normalizedDeduction = Math.min(deductions / filesCount, 100);
  return Math.max(0, Math.round((100 - normalizedDeduction) * 10) / 10);
}

function scoreToGrade(score: number): MetricGrade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
