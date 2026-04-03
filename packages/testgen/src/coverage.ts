import { resolve } from "path";
import { analyzeProject } from "./analyzer.js";
import type { CoverageResult, CoverageGap, UncoveredFile, CoverageOptions, FunctionSignature } from "./types.js";
import { glob } from "glob";
import { readFileSync, existsSync } from "fs";

const TEST_PATTERNS = [
  "**/*.test.{ts,tsx,js,jsx}",
  "**/*.spec.{ts,tsx,js,jsx}",
  "**/*_test.{py,go}",
  "**/test_*.py",
  "**/*Test.java",
];

const IGNORE_DIRS = [
  "node_modules", "dist", "build", ".next",
  "__pycache__", ".git", "coverage", "vendor",
];

export async function analyzeCoverage(options: CoverageOptions): Promise<CoverageResult> {
  const projectPath = resolve(options.path);
  const functions = await analyzeProject(projectPath);

  const testFiles = await findTestFiles(projectPath, options.testsPath);
  const testedFunctions = await extractTestedFunctions(testFiles);

  const coverageData = calculateCoverage(functions, testedFunctions);
  const uncoveredFiles = findUncoveredFiles(functions, testedFunctions);
  const gaps = findCoverageGaps(functions, testedFunctions);

  const threshold = options.threshold || 85;
  const testsNeeded = estimateTestsNeeded(coverageData.overall, threshold, functions.length);

  return {
    projectPath,
    timestamp: new Date().toISOString(),
    overall: coverageData.overall,
    statements: coverageData.statements,
    branches: coverageData.branches,
    functions: coverageData.functions,
    lines: coverageData.lines,
    uncoveredFiles,
    gaps,
    recommendation: buildRecommendation(coverageData.overall, threshold, testsNeeded, gaps),
    testsNeeded,
  };
}

async function findTestFiles(projectPath: string, testsPath?: string): Promise<string[]> {
  const searchPath = testsPath ? resolve(projectPath, testsPath) : projectPath;
  const files: string[] = [];

  for (const pattern of TEST_PATTERNS) {
    const found = await glob(pattern, {
      cwd: searchPath,
      absolute: true,
      ignore: IGNORE_DIRS.map((d) => `**/${d}/**`),
    });
    files.push(...found);
  }

  return files;
}

async function extractTestedFunctions(testFiles: string[]): Promise<Set<string>> {
  const tested = new Set<string>();

  for (const file of testFiles) {
    try {
      const content = readFileSync(file, "utf-8");

      const describeMatches = content.matchAll(/describe\s*\(\s*["'](\w+)["']/g);
      for (const match of describeMatches) {
        tested.add(match[1]);
      }

      const itMatches = content.matchAll(/it\s*\(\s*["'][^"']*?(\w+)/g);
      for (const match of itMatches) {
        tested.add(match[1]);
      }

      const testMatches = content.matchAll(/test\s*\(\s*["'][^"']*?(\w+)/g);
      for (const match of testMatches) {
        tested.add(match[1]);
      }

      const pyTestMatches = content.matchAll(/def\s+test_(\w+)/g);
      for (const match of pyTestMatches) {
        tested.add(match[1]);
      }

      const goTestMatches = content.matchAll(/func\s+Test(\w+)/g);
      for (const match of goTestMatches) {
        tested.add(match[1]);
      }

      const importMatches = content.matchAll(/import\s*\{([^}]+)\}/g);
      for (const match of importMatches) {
        const names = match[1].split(",").map((n) => n.trim());
        for (const name of names) {
          tested.add(name);
        }
      }
    } catch {
      // skip unreadable files
    }
  }

  return tested;
}

function calculateCoverage(
  functions: FunctionSignature[],
  testedFunctions: Set<string>
): { overall: number; statements: number; branches: number; functions: number; lines: number } {
  if (functions.length === 0) {
    return { overall: 100, statements: 100, branches: 100, functions: 100, lines: 100 };
  }

  let testedCount = 0;
  let totalComplexity = 0;
  let testedComplexity = 0;
  let totalLines = 0;
  let testedLines = 0;

  for (const fn of functions) {
    const isTested = testedFunctions.has(fn.name);
    const bodyLines = fn.body.split("\n").length;

    totalComplexity += fn.complexity;
    totalLines += bodyLines;

    if (isTested) {
      testedCount++;
      testedComplexity += fn.complexity;
      testedLines += bodyLines;
    }
  }

  const funcCoverage = (testedCount / functions.length) * 100;
  const branchCoverage = totalComplexity > 0 ? (testedComplexity / totalComplexity) * 100 : 100;
  const lineCoverage = totalLines > 0 ? (testedLines / totalLines) * 100 : 100;
  const stmtCoverage = (funcCoverage + lineCoverage) / 2;
  const overall = (funcCoverage * 0.3 + branchCoverage * 0.3 + lineCoverage * 0.2 + stmtCoverage * 0.2);

  return {
    overall: Math.round(overall * 10) / 10,
    statements: Math.round(stmtCoverage * 10) / 10,
    branches: Math.round(branchCoverage * 10) / 10,
    functions: Math.round(funcCoverage * 10) / 10,
    lines: Math.round(lineCoverage * 10) / 10,
  };
}

function findUncoveredFiles(
  functions: FunctionSignature[],
  testedFunctions: Set<string>
): UncoveredFile[] {
  const fileMap = new Map<string, { total: number; covered: number; uncoveredFns: string[]; uncoveredLines: number[] }>();

  for (const fn of functions) {
    if (!fileMap.has(fn.file)) {
      fileMap.set(fn.file, { total: 0, covered: 0, uncoveredFns: [], uncoveredLines: [] });
    }
    const entry = fileMap.get(fn.file)!;
    entry.total++;

    if (testedFunctions.has(fn.name)) {
      entry.covered++;
    } else {
      entry.uncoveredFns.push(fn.name);
      entry.uncoveredLines.push(fn.line);
    }
  }

  const uncovered: UncoveredFile[] = [];
  for (const [file, data] of fileMap) {
    const coverage = data.total > 0 ? (data.covered / data.total) * 100 : 100;
    if (coverage < 100) {
      const priority: UncoveredFile["priority"] =
        coverage === 0 ? "critical" :
        coverage < 30 ? "high" :
        coverage < 60 ? "medium" : "low";

      uncovered.push({
        file,
        coverage: Math.round(coverage * 10) / 10,
        uncoveredLines: data.uncoveredLines,
        uncoveredFunctions: data.uncoveredFns,
        priority,
      });
    }
  }

  return uncovered.sort((a, b) => a.coverage - b.coverage);
}

function findCoverageGaps(
  functions: FunctionSignature[],
  testedFunctions: Set<string>
): CoverageGap[] {
  const gaps: CoverageGap[] = [];

  for (const fn of functions) {
    if (!testedFunctions.has(fn.name)) {
      gaps.push({
        file: fn.file,
        functionName: fn.name,
        line: fn.line,
        type: "function",
        description: `Function "${fn.name}" has no test coverage`,
      });
    }

    if (fn.complexity > 3 && testedFunctions.has(fn.name)) {
      gaps.push({
        file: fn.file,
        functionName: fn.name,
        line: fn.line,
        type: "branch",
        description: `Function "${fn.name}" has complexity ${fn.complexity} — may need more branch tests`,
      });
    }
  }

  return gaps;
}

function estimateTestsNeeded(currentCoverage: number, threshold: number, totalFunctions: number): number {
  if (currentCoverage >= threshold) return 0;
  const gap = threshold - currentCoverage;
  return Math.ceil((gap / 100) * totalFunctions * 2);
}

function buildRecommendation(
  coverage: number,
  threshold: number,
  testsNeeded: number,
  gaps: CoverageGap[]
): string {
  if (coverage >= threshold) {
    return `Coverage of ${coverage}% meets the ${threshold}% threshold. Good job!`;
  }

  const criticalGaps = gaps.filter((g) => g.type === "function").length;
  const branchGaps = gaps.filter((g) => g.type === "branch").length;

  const parts = [
    `Coverage of ${coverage}% is below the ${threshold}% threshold.`,
    `Generate approximately ${testsNeeded} tests to reach the target.`,
  ];

  if (criticalGaps > 0) {
    parts.push(`${criticalGaps} functions have zero coverage — prioritize these.`);
  }
  if (branchGaps > 0) {
    parts.push(`${branchGaps} functions need additional branch testing.`);
  }

  return parts.join(" ");
}