export type DeployProvider = "vercel" | "netlify" | "aws" | "gcp" | "docker" | "custom";
export type ProjectType = "nextjs" | "react" | "vue" | "svelte" | "astro" | "express" | "fastapi" | "django" | "go" | "rust" | "static";
export type Runtime = "node" | "python" | "go" | "rust" | "java" | "ruby" | "php" | "static";
export type IaCProvider = "terraform" | "pulumi" | "docker-compose" | "kubernetes";
export type CIProvider = "github-actions" | "gitlab-ci" | "jenkins" | "circleci";
export type DeployStage = "dev" | "staging" | "production";

export interface ProjectConfig {
  type: ProjectType;
  runtime: Runtime;
  runtimeVersion: string;
  framework: string;
  buildCommand: string;
  startCommand: string;
  outputDir: string;
  port: number;
  envVars: string[];
  hasDatabase: boolean;
  hasDocker: boolean;
  hasCICD: boolean;
  packageManager: "npm" | "yarn" | "pnpm" | "bun" | "pip" | "go" | "cargo";
}

export interface DeployConfig {
  provider: DeployProvider;
  project: ProjectConfig;
  stage: DeployStage;
  region?: string;
  domain?: string;
  envFile?: string;
  dryRun?: boolean;
}

export interface DeployResult {
  success: boolean;
  provider: DeployProvider;
  url?: string;
  previewUrl?: string;
  buildTime: number;
  deployTime: number;
  totalTime: number;
  stage: DeployStage;
  version: string;
  logs: string[];
  errors: string[];
}

export interface IaCConfig {
  provider: IaCProvider;
  cloudProvider: DeployProvider;
  project: ProjectConfig;
  stage: DeployStage;
  features: IaCFeature[];
  outputDir: string;
}

export type IaCFeature =
  | "compute"
  | "database"
  | "storage"
  | "cdn"
  | "dns"
  | "ssl"
  | "monitoring"
  | "logging"
  | "secrets"
  | "networking"
  | "container-registry";

export interface IaCResult {
  files: GeneratedFile[];
  provider: IaCProvider;
  cloudProvider: DeployProvider;
  commands: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  description: string;
}

export interface PipelineConfig {
  ciProvider: CIProvider;
  project: ProjectConfig;
  stages: DeployStage[];
  features: PipelineFeature[];
  outputDir: string;
}

export type PipelineFeature =
  | "lint"
  | "test"
  | "build"
  | "security-scan"
  | "docker-build"
  | "deploy-preview"
  | "deploy-staging"
  | "deploy-production"
  | "notify"
  | "rollback";

export interface PipelineResult {
  files: GeneratedFile[];
  ciProvider: CIProvider;
  stages: string[];
}

export interface RollbackEntry {
  version: string;
  timestamp: string;
  provider: DeployProvider;
  stage: DeployStage;
  commitSha: string;
  url: string;
  status: "active" | "rolled-back" | "superseded";
}

export interface HealthCheck {
  url: string;
  status: number;
  responseTime: number;
  healthy: boolean;
  timestamp: string;
  checks: HealthCheckItem[];
}

export interface HealthCheckItem {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  responseTime?: number;
}