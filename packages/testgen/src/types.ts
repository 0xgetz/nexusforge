export type TestFramework =
  | "jest"
  | "vitest"
  | "mocha"
  | "pytest"
  | "unittest"
  | "go-test"
  | "cargo-test"
  | "junit";

export type TestStyle =
  | "describe-it"
  | "test-block"
  | "class-based"
  | "function-based";

export type MutatorType =
  | "arithmetic"
  | "conditional"
  | "boundary"
  | "negation"
  | "return-value"
  | "void-call"
  | "string"
  | "array";

export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: "unit" | "integration" | "edge-case" | "error-case" | "boundary";
  sourceFile: string;
  sourceFunction: string;
  code: string;
  assertions: number;
  confidence: number;
  framework: TestFramework;
}

export interface GenerateOptions {
  file?: string;
  path?: string;
  framework?: TestFramework;
  style?: TestStyle;
  model?: string;
  includeEdgeCases?: boolean;
  includeMocks?: boolean;
  includeIntegration?: boolean;
  maxTestsPerFunction?: number;
  outputDir?: string;
  interactive?: boolean;
}

export interface GenerateResult {
  projectPath: string;
  timestamp: string;
  filesAnalyzed: number;
  functionsFound: number;
  testsGenerated: TestCase[];
  duration: number;
  framework: TestFramework;
  outputFiles: string[];
}

export interface CoverageResult {
  projectPath: string;
  timestamp: string;
  overall: number;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  uncoveredFiles: UncoveredFile[];
  gaps: CoverageGap[];
  recommendation: string;
  testsNeeded: number;
}

export interface UncoveredFile {
  file: string;
  coverage: number;
  uncoveredLines: number[];
  uncoveredFunctions: string[];
  priority: "critical" | "high" | "medium" | "low";
}

export interface CoverageGap {
  file: string;
  functionName: string;
  line: number;
  type: "branch" | "statement" | "function";
  description: string;
}

export interface MutationResult {
  projectPath: string;
  timestamp: string;
  totalMutants: number;
  killed: number;
  survived: number;
  timeout: number;
  noCoverage: number;
  mutationScore: number;
  survivingMutants: SurvivingMutant[];
  duration: number;
}

export interface SurvivingMutant {
  file: string;
  line: number;
  original: string;
  mutated: string;
  mutator: MutatorType;
  description: string;
}

export interface FunctionSignature {
  name: string;
  file: string;
  line: number;
  params: ParamInfo[];
  returnType: string;
  isAsync: boolean;
  isExported: boolean;
  complexity: number;
  dependencies: string[];
  body: string;
}

export interface ParamInfo {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
}

export interface CoverageOptions {
  path: string;
  testsPath?: string;
  includeNodeModules?: boolean;
  threshold?: number;
}

export interface MutationOptions {
  path: string;
  testsPath: string;
  mutators?: MutatorType[];
  maxMutants?: number;
  timeout?: number;
}

export interface FrameworkConfig {
  name: TestFramework;
  displayName: string;
  language: string;
  extension: string;
  testExtension: string;
  runner: string;
  importStyle: "esm" | "cjs" | "python" | "go" | "rust" | "java";
  assertionLib: string;
}