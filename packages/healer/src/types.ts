export type BugSeverity = "critical" | "error" | "warning" | "info";
export type BugCategory =
  | "null-reference"
  | "type-mismatch"
  | "unused-variable"
  | "unreachable-code"
  | "memory-leak"
  | "race-condition"
  | "security-flaw"
  | "error-handling"
  | "performance"
  | "logic-error"
  | "syntax-error"
  | "import-error"
  | "deprecated-api"
  | "hardcoded-secret"
  | "sql-injection"
  | "xss"
  | "custom";

export interface Bug {
  id: string;
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  severity: BugSeverity;
  category: BugCategory;
  message: string;
  snippet: string;
  suggestion?: string;
  autoFixable: boolean;
}

export interface Fix {
  bugId: string;
  file: string;
  original: string;
  fixed: string;
  description: string;
  confidence: number;
}

export interface AnalysisResult {
  projectPath: string;
  timestamp: string;
  duration: number;
  filesScanned: number;
  bugs: Bug[];
  fixes: Fix[];
  summary: AnalysisSummary;
}

export interface AnalysisSummary {
  totalBugs: number;
  critical: number;
  errors: number;
  warnings: number;
  infos: number;
  autoFixable: number;
  healthScore: number;
}

export interface MonitorEvent {
  type: "file-changed" | "error-detected" | "fix-applied" | "health-check";
  timestamp: string;
  file?: string;
  details: string;
}

export interface HealerOptions {
  path: string;
  fix?: boolean;
  watch?: boolean;
  ignore?: string[];
  severity?: BugSeverity;
}