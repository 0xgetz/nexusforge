export type ReviewSeverity = "critical" | "major" | "minor" | "suggestion" | "praise";
export type ReviewCategory = "bug-risk" | "performance" | "security" | "maintainability" | "readability" | "style" | "best-practice";
export type MetricGrade = "A" | "B" | "C" | "D" | "F";

export interface ReviewIssue {
  id: string;
  file: string;
  line: number;
  endLine?: number;
  severity: ReviewSeverity;
  category: ReviewCategory;
  message: string;
  suggestion?: string;
  code?: string;
  confidence: number;
}

export interface ReviewResult {
  projectPath: string;
  timestamp: string;
  filesReviewed: number;
  issuesFound: ReviewIssue[];
  score: number;
  grade: MetricGrade;
  summary: ReviewSummary;
  duration: number;
}

export interface ReviewSummary {
  critical: number;
  major: number;
  minor: number;
  suggestions: number;
  praises: number;
  topCategories: { category: ReviewCategory; count: number }[];
}

export interface QualityMetrics {
  projectPath: string;
  timestamp: string;
  maintainabilityIndex: number;
  technicalDebt: TechnicalDebt;
  codeDuplication: DuplicationReport;
  complexity: ComplexityReport;
  linesOfCode: LOCReport;
  grade: MetricGrade;
}

export interface TechnicalDebt {
  totalHours: number;
  rating: MetricGrade;
  issues: DebtItem[];
}

export interface DebtItem {
  file: string;
  type: "complexity" | "duplication" | "long-method" | "large-file" | "deep-nesting" | "coupling";
  description: string;
  estimatedHours: number;
}

export interface DuplicationReport {
  percentage: number;
  duplicates: DuplicateBlock[];
  totalDuplicatedLines: number;
}

export interface DuplicateBlock {
  fileA: string;
  fileB: string;
  lineA: number;
  lineB: number;
  lines: number;
  similarity: number;
}

export interface ComplexityReport {
  average: number;
  max: number;
  hotspots: ComplexityHotspot[];
}

export interface ComplexityHotspot {
  file: string;
  function: string;
  line: number;
  complexity: number;
  risk: "low" | "medium" | "high" | "critical";
}

export interface LOCReport {
  total: number;
  source: number;
  comments: number;
  blank: number;
  byLanguage: Record<string, number>;
}

export interface ArchitectureAnalysis {
  projectPath: string;
  timestamp: string;
  modules: ModuleInfo[];
  dependencies: DependencyEdge[];
  circularDeps: CircularDependency[];
  layerViolations: LayerViolation[];
  coupling: CouplingMetric[];
}

export interface ModuleInfo {
  name: string;
  path: string;
  files: number;
  lines: number;
  exports: number;
  imports: number;
}

export interface DependencyEdge {
  from: string;
  to: string;
  weight: number;
  type: "import" | "require" | "dynamic";
}

export interface CircularDependency {
  cycle: string[];
  severity: "warning" | "error";
}

export interface LayerViolation {
  from: string;
  to: string;
  fromLayer: string;
  toLayer: string;
  message: string;
}

export interface CouplingMetric {
  module: string;
  afferentCoupling: number;
  efferentCoupling: number;
  instability: number;
  abstractness: number;
}

export interface DocEntry {
  name: string;
  type: "function" | "class" | "interface" | "type" | "variable" | "module";
  file: string;
  line: number;
  description: string;
  params?: { name: string; type: string; description: string }[];
  returns?: string;
  examples?: string[];
  isExported: boolean;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  added: string[];
  changed: string[];
  fixed: string[];
  removed: string[];
  deprecated: string[];
  security: string[];
}

export interface GuardianRule {
  id: string;
  name: string;
  description: string;
  severity: ReviewSeverity;
  category: ReviewCategory;
  pattern: string;
  message: string;
  suggestion?: string;
  enabled: boolean;
}
