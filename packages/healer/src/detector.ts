import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname, relative } from "path";
import type { Bug, BugCategory, BugSeverity } from "./types.js";

interface Pattern {
  regex: RegExp;
  category: BugCategory;
  severity: BugSeverity;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
  languages: string[];
}

const PATTERNS: Pattern[] = [
  // Null/undefined references
  {
    regex: /(\w+)\s*===?\s*null\s*\?\s*\w+\.\w+/g,
    category: "null-reference",
    severity: "error",
    message: "Potential null reference: accessing property after null check in same expression",
    suggestion: "Use optional chaining (?.) or nullish coalescing (??)",
    autoFixable: false,
    languages: [".ts", ".tsx", ".js", ".jsx"],
  },
  // console.log left in production code
  {
    regex: /console\.(log|debug|info)\s*\(/g,
    category: "performance",
    severity: "warning",
    message: "Console statement found — should be removed in production",
    suggestion: "Remove or replace with a proper logging library",
    autoFixable: true,
    languages: [".ts", ".tsx", ".js", ".jsx"],
  },
  // Hardcoded secrets
  {
    regex: /(api[_-]?key|secret|password|token|auth)\s*[:=]\s*["'][a-zA-Z0-9]{16,}["']/gi,
    category: "hardcoded-secret",
    severity: "critical",
    message: "Potential hardcoded secret detected",
    suggestion: "Move to environment variables or a secrets manager",
    autoFixable: false,
    languages: [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java"],
  },
  // SQL injection
  {
    regex: /(?:query|execute|exec)\s*\(\s*[`"'].*?\$\{.*?\}.*?[`"']/g,
    category: "sql-injection",
    severity: "critical",
    message: "Potential SQL injection: string interpolation in query",
    suggestion: "Use parameterized queries or prepared statements",
    autoFixable: false,
    languages: [".ts", ".tsx", ".js", ".jsx", ".py"],
  },
  // XSS via innerHTML
  {
    regex: /\.innerHTML\s*=\s*(?!['"]<)/g,
    category: "xss",
    severity: "critical",
    message: "Potential XSS: dynamic content assigned to innerHTML",
    suggestion: "Use textContent or sanitize HTML with DOMPurify",
    autoFixable: false,
    languages: [".ts", ".tsx", ".js", ".jsx"],
  },
  // dangerouslySetInnerHTML
  {
    regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/g,
    category: "xss",
    severity: "warning",
    message: "dangerouslySetInnerHTML used — ensure content is sanitized",
    suggestion: "Sanitize HTML input or use a safe rendering library",
    autoFixable: false,
    languages: [".tsx", ".jsx"],
  },
  // Empty catch blocks
  {
    regex: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    category: "error-handling",
    severity: "warning",
    message: "Empty catch block — errors are silently swallowed",
    suggestion: "Log the error or handle it appropriately",
    autoFixable: true,
    languages: [".ts", ".tsx", ".js", ".jsx", ".java"],
  },
  // eval() usage
  {
    regex: /\beval\s*\(/g,
    category: "security-flaw",
    severity: "critical",
    message: "eval() detected — potential code injection vulnerability",
    suggestion: "Avoid eval(). Use JSON.parse() for JSON, or Function constructor for dynamic code",
    autoFixable: false,
    languages: [".ts", ".tsx", ".js", ".jsx"],
  },
  // TODO/FIXME/HACK comments
  {
    regex: /\/\/\s*(TODO|FIXME|HACK|XXX|BUG)\b[: ]*(.*)/gi,
    category: "info" as BugCategory,
    severity: "info",
    message: "Developer note found",
    autoFixable: false,
    languages: [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java"],
  },
  // Deprecated API usage - var
  {
    regex: /\bvar\s+\w+\s*=/g,
    category: "deprecated-api",
    severity: "warning",
    message: "Using 'var' — prefer 'const' or 'let' for block scoping",
    suggestion: "Replace 'var' with 'const' (if not reassigned) or 'let'",
    autoFixable: true,
    languages: [".ts", ".tsx", ".js", ".jsx"],
  },
  // == instead of ===
  {
    regex: /[^!=<>]==[^=]/g,
    category: "logic-error",
    severity: "warning",
    message: "Using loose equality (==) instead of strict equality (===)",
    suggestion: "Use === for strict type-safe comparison",
    autoFixable: true,
    languages: [".ts", ".tsx", ".js", ".jsx"],
  },
  // Async without await
  {
    regex: /async\s+(?:function\s+\w+|\w+\s*=\s*async)\s*\([^)]*\)\s*\{[^}]*\}/g,
    category: "performance",
    severity: "info",
    message: "Async function may not need async keyword if no await is used",
    autoFixable: false,
    languages: [".ts", ".tsx", ".js", ".jsx"],
  },
  // Python: bare except
  {
    regex: /except\s*:/g,
    category: "error-handling",
    severity: "warning",
    message: "Bare except catches all exceptions including SystemExit and KeyboardInterrupt",
    suggestion: "Use 'except Exception:' or catch specific exceptions",
    autoFixable: true,
    languages: [".py"],
  },
  // Python: mutable default argument
  {
    regex: /def\s+\w+\s*\([^)]*(?:=\s*\[\]|=\s*\{\}|=\s*set\(\))/g,
    category: "logic-error",
    severity: "error",
    message: "Mutable default argument — shared across all calls",
    suggestion: "Use None as default and initialize inside the function",
    autoFixable: false,
    languages: [".py"],
  },
  // Rust: unwrap()
  {
    regex: /\.unwrap\(\)/g,
    category: "error-handling",
    severity: "warning",
    message: "Using .unwrap() can panic at runtime",
    suggestion: "Use pattern matching, .unwrap_or(), .expect(), or the ? operator",
    autoFixable: false,
    languages: [".rs"],
  },
];

const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "__pycache__",
  "venv", ".venv", "target", ".cache", "coverage",
]);

let bugCounter = 0;

function generateBugId(): string {
  return `NXF-${String(++bugCounter).padStart(4, "0")}`;
}

function getSnippet(lines: string[], lineNum: number, contextLines = 2): string {
  const start = Math.max(0, lineNum - contextLines - 1);
  const end = Math.min(lines.length, lineNum + contextLines);
  return lines
    .slice(start, end)
    .map((line, i) => {
      const num = start + i + 1;
      const marker = num === lineNum ? "→" : " ";
      return `${marker} ${String(num).padStart(4)} │ ${line}`;
    })
    .join("\n");
}

export function detectBugs(filePath: string, content: string): Bug[] {
  const ext = extname(filePath).toLowerCase();
  const lines = content.split("\n");
  const bugs: Bug[] = [];
  const seenPositions = new Set<string>();

  for (const pattern of PATTERNS) {
    if (!pattern.languages.includes(ext)) continue;

    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

    while ((match = regex.exec(content)) !== null) {
      const upToMatch = content.slice(0, match.index);
      const lineNum = upToMatch.split("\n").length;
      const posKey = `${pattern.category}:${lineNum}`;

      if (seenPositions.has(posKey)) continue;
      seenPositions.add(posKey);

      const message = pattern.category === ("info" as BugCategory)
        ? `${pattern.message}: ${match[2] || match[0]}`
        : pattern.message;

      bugs.push({
        id: generateBugId(),
        file: filePath,
        line: lineNum,
        severity: pattern.severity,
        category: pattern.category,
        message,
        snippet: getSnippet(lines, lineNum),
        suggestion: pattern.suggestion,
        autoFixable: pattern.autoFixable,
      });
    }
  }

  return bugs;
}

export function scanDirectory(
  dir: string,
  ignore: string[] = []
): { file: string; bugs: Bug[] }[] {
  const results: { file: string; bugs: Bug[] }[] = [];
  const ignoreSet = new Set([...IGNORE_DIRS, ...ignore]);

  function walk(currentDir: string) {
    try {
      const entries = readdirSync(currentDir);
      for (const entry of entries) {
        if (entry.startsWith(".") || ignoreSet.has(entry)) continue;

        const fullPath = join(currentDir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          walk(fullPath);
        } else {
          const ext = extname(entry).toLowerCase();
          const supportedExts = new Set(PATTERNS.flatMap((p) => p.languages));
          if (!supportedExts.has(ext)) continue;

          try {
            const content = readFileSync(fullPath, "utf-8");
            const bugs = detectBugs(relative(dir, fullPath), content);
            if (bugs.length > 0) {
              results.push({ file: relative(dir, fullPath), bugs });
            }
          } catch {
            // skip unreadable files
          }
        }
      }
    } catch {
      // skip inaccessible directories
    }
  }

  bugCounter = 0;
  walk(dir);
  return results;
}

export function resetCounter(): void {
  bugCounter = 0;
}