export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface Vulnerability {
  id: string;
  package: string;
  version: string;
  severity: Severity;
  title: string;
  description: string;
  fixedIn?: string;
  cwe?: string[];
  cvss?: number;
  url?: string;
}

export interface DependencyInfo {
  name: string;
  version: string;
  latest?: string;
  outdated: boolean;
  license?: string;
  deprecated?: boolean;
  vulnerabilities: Vulnerability[];
}

export interface ScanResult {
  projectName: string;
  projectPath: string;
  timestamp: string;
  duration: number;
  ecosystem: "npm" | "pip" | "cargo" | "go" | "unknown";
  totalDependencies: number;
  vulnerablePackages: number;
  vulnerabilities: Vulnerability[];
  dependencies: DependencyInfo[];
  summary: ScanSummary;
}

export interface ScanSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
  score: number;
}

export interface ScanOptions {
  path: string;
  deep?: boolean;
  includeDev?: boolean;
  offline?: boolean;
  format?: "json" | "markdown" | "html" | "sarif";
}