import { readFileSync, existsSync } from "fs";
import { resolve, join } from "path";
import type { GuardianRule, ReviewSeverity, ReviewCategory } from "./types.js";

const BUILTIN_RULES: GuardianRule[] = [
  {
    id: "SEC-001",
    name: "hardcoded-secret",
    description: "Detects hardcoded passwords, API keys, and tokens in source code",
    severity: "critical",
    category: "security",
    pattern: "(password|secret|api_key|apikey|token|auth)\\s*[=:]\\s*[\"'][^\"']{4,}[\"']",
    message: "Potential hardcoded secret detected",
    suggestion: "Use environment variables or a secrets manager",
    enabled: true,
  },
  {
    id: "SEC-002",
    name: "eval-usage",
    description: "Detects usage of eval() which can lead to code injection",
    severity: "critical",
    category: "security",
    pattern: "\\beval\\s*\\(",
    message: "eval() usage detected — code injection risk",
    suggestion: "Avoid eval(); use JSON.parse() or a safe parser",
    enabled: true,
  },
  {
    id: "SEC-003",
    name: "innerhtml-xss",
    description: "Detects direct innerHTML assignments that could enable XSS",
    severity: "major",
    category: "security",
    pattern: "\\.innerHTML\\s*=",
    message: "Direct innerHTML assignment — XSS risk",
    suggestion: "Use textContent, or a DOM sanitization library like DOMPurify",
    enabled: true,
  },
  {
    id: "BUG-001",
    name: "unsafe-any-cast",
    description: "Detects unsafe type assertions to 'any' in TypeScript",
    severity: "major",
    category: "bug-risk",
    pattern: "\\bas\\s+any\\b",
    message: "Unsafe type assertion to 'any' bypasses type safety",
    suggestion: "Use proper type narrowing or a more specific type",
    enabled: true,
  },
  {
    id: "BUG-002",
    name: "bare-except",
    description: "Detects bare except clauses in Python that catch all exceptions",
    severity: "major",
    category: "bug-risk",
    pattern: "except\\s*:",
    message: "Bare except clause catches all exceptions including SystemExit",
    suggestion: "Catch specific exception types",
    enabled: true,
  },
  {
    id: "BUG-003",
    name: "non-exhaustive-switch",
    description: "Detects switch statements without default cases",
    severity: "minor",
    category: "bug-risk",
    pattern: "switch\\s*\\([^)]+\\)\\s*\\{(?![\\s\\S]*default\\s*:)",
    message: "Switch statement without default case",
    suggestion: "Add a default case to handle unexpected values",
    enabled: true,
  },
  {
    id: "PERF-001",
    name: "sync-fs-call",
    description: "Detects synchronous filesystem calls that block the event loop",
    severity: "minor",
    category: "performance",
    pattern: "\\b(readFileSync|writeFileSync|mkdirSync|readdirSync|statSync|unlinkSync)\\b",
    message: "Synchronous filesystem call — may block the event loop",
    suggestion: "Use async/await versions (readFile, writeFile, etc.) from fs/promises",
    enabled: true,
  },
  {
    id: "PERF-002",
    name: "nested-loop",
    description: "Detects deeply nested loops that could have O(n^3+) complexity",
    severity: "minor",
    category: "performance",
    pattern: "for\\s*\\([^)]*\\)\\s*\\{[^}]*for\\s*\\([^)]*\\)\\s*\\{[^}]*for\\s*\\(",
    message: "Triple-nested loop detected — O(n³) complexity",
    suggestion: "Consider using hash maps, sets, or algorithmic optimizations",
    enabled: true,
  },
  {
    id: "MAINT-001",
    name: "console-log",
    description: "Detects console.log statements left in code",
    severity: "minor",
    category: "best-practice",
    pattern: "console\\.log\\s*\\(",
    message: "console.log statement found — remove before production",
    suggestion: "Use a structured logging library (winston, pino, etc.)",
    enabled: true,
  },
  {
    id: "MAINT-002",
    name: "todo-fixme",
    description: "Detects TODO, FIXME, HACK, and XXX comments",
    severity: "suggestion",
    category: "maintainability",
    pattern: "\\b(TODO|FIXME|HACK|XXX)\\b",
    message: "TODO/FIXME comment found — indicates unfinished work",
    suggestion: "Address this technical debt or create a tracking issue",
    enabled: true,
  },
  {
    id: "MAINT-003",
    name: "magic-number",
    description: "Detects magic numbers in conditionals and assignments",
    severity: "suggestion",
    category: "readability",
    pattern: "(?:===?|!==?|[<>]=?|\\+|-|\\*|/)\\s*\\d{3,}",
    message: "Magic number detected — reduces readability",
    suggestion: "Extract into a named constant with a descriptive name",
    enabled: true,
  },
  {
    id: "MAINT-004",
    name: "wildcard-import",
    description: "Detects wildcard imports that pollute the namespace",
    severity: "minor",
    category: "best-practice",
    pattern: "import\\s+\\*\\s+",
    message: "Wildcard import — pollutes namespace and hinders tree-shaking",
    suggestion: "Import specific named exports",
    enabled: true,
  },
  {
    id: "STYLE-001",
    name: "any-type-usage",
    description: "Detects usage of the 'any' type in TypeScript",
    severity: "minor",
    category: "best-practice",
    pattern: ":\\s*any\\b",
    message: "Usage of 'any' type reduces type safety",
    suggestion: "Replace with a specific type or 'unknown'",
    enabled: true,
  },
  {
    id: "STYLE-002",
    name: "non-null-assertion",
    description: "Detects non-null assertion operator usage in TypeScript",
    severity: "suggestion",
    category: "bug-risk",
    pattern: "[a-zA-Z_$]\\w*!\\.",
    message: "Non-null assertion (!) — can mask null/undefined errors",
    suggestion: "Use optional chaining (?.) or proper null checks",
    enabled: true,
  },
];

export function getBuiltinRules(): GuardianRule[] {
  return [...BUILTIN_RULES];
}

export function loadCustomRules(rulesDir: string): GuardianRule[] {
  const absDir = resolve(rulesDir);
  const customRules: GuardianRule[] = [];

  if (!existsSync(absDir)) return customRules;

  const rulesFile = join(absDir, "guardian-rules.json");

  if (existsSync(rulesFile)) {
    try {
      const raw = readFileSync(rulesFile, "utf-8");
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        for (const rule of parsed) {
          if (validateRule(rule)) {
            customRules.push(rule);
          }
        }
      }
    } catch {
      // silently skip malformed rules files
    }
  }

  return customRules;
}

export function getAllRules(customRulesDir?: string): GuardianRule[] {
  const builtin = getBuiltinRules();

  if (customRulesDir) {
    const custom = loadCustomRules(customRulesDir);
    return [...builtin, ...custom];
  }

  return builtin;
}

export function filterRules(
  rules: GuardianRule[],
  opts: {
    severity?: ReviewSeverity;
    category?: ReviewCategory;
    enabledOnly?: boolean;
  } = {}
): GuardianRule[] {
  let filtered = [...rules];

  if (opts.severity) {
    filtered = filtered.filter((r) => r.severity === opts.severity);
  }
  if (opts.category) {
    filtered = filtered.filter((r) => r.category === opts.category);
  }
  if (opts.enabledOnly !== false) {
    filtered = filtered.filter((r) => r.enabled);
  }

  return filtered;
}

function validateRule(rule: unknown): rule is GuardianRule {
  if (typeof rule !== "object" || rule === null) return false;
  const r = rule as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.name === "string" &&
    typeof r.description === "string" &&
    typeof r.severity === "string" &&
    typeof r.category === "string" &&
    typeof r.pattern === "string" &&
    typeof r.message === "string" &&
    typeof r.enabled === "boolean"
  );
}

export function createRule(overrides: Partial<GuardianRule> & { id: string; name: string; pattern: string; message: string }): GuardianRule {
  return {
    description: "",
    severity: "minor",
    category: "best-practice",
    suggestion: undefined,
    enabled: true,
    ...overrides,
  };
}