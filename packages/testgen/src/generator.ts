import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname, basename, extname, join } from "path";
import { analyzeProject, analyzeFile } from "./analyzer.js";
import { generateTestCode, FRAMEWORK_CONFIGS, detectFramework } from "./frameworks.js";
import { buildGeneratePrompt } from "./prompts.js";
import type { GenerateOptions, GenerateResult, TestCase, TestFramework } from "./types.js";

export async function generateTests(options: GenerateOptions): Promise<GenerateResult> {
  const start = Date.now();
  const framework = options.framework || detectFramework(options.path || process.cwd());
  const config = FRAMEWORK_CONFIGS[framework];

  let functions;
  if (options.file) {
    functions = await analyzeFile(resolve(options.file));
  } else if (options.path) {
    functions = await analyzeProject(resolve(options.path));
  } else {
    functions = await analyzeProject(process.cwd());
  }

  const allTests: TestCase[] = [];
  const outputFiles: string[] = [];

  for (const fn of functions) {
    if (!fn.isExported && !options.file) continue;

    const tests = generateTestCode(fn, framework);

    const maxTests = options.maxTestsPerFunction || 10;
    const limited = tests.slice(0, maxTests);
    allTests.push(...limited);

    if (options.outputDir) {
      const testFileName = buildTestFileName(fn.file, config.testExtension);
      const outPath = resolve(options.outputDir, testFileName);

      if (!existsSync(dirname(outPath))) {
        mkdirSync(dirname(outPath), { recursive: true });
      }

      const testContent = limited.map((t) => t.code).join("\n\n");
      writeFileSync(outPath, testContent, "utf-8");
      outputFiles.push(outPath);
    }
  }

  const projectPath = options.path || options.file || process.cwd();

  return {
    projectPath: resolve(projectPath),
    timestamp: new Date().toISOString(),
    filesAnalyzed: options.file ? 1 : functions.length,
    functionsFound: functions.length,
    testsGenerated: allTests,
    duration: Date.now() - start,
    framework,
    outputFiles,
  };
}

export function buildTestFileName(sourceFile: string, testExtension: string): string {
  const base = basename(sourceFile);
  const ext = extname(base);
  const name = base.replace(ext, "");
  return `${name}${testExtension}`;
}

export function formatTestOutput(tests: TestCase[], framework: TestFramework): string {
  const config = FRAMEWORK_CONFIGS[framework];
  const sections: string[] = [];

  const grouped = new Map<string, TestCase[]>();
  for (const test of tests) {
    const key = test.sourceFunction;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(test);
  }

  if (config.importStyle === "esm" || config.importStyle === "cjs") {
    const imports = new Set<string>();
    for (const test of tests) {
      const sourceName = basename(test.sourceFile).replace(extname(test.sourceFile), "");
      imports.add(`import { ${test.sourceFunction} } from "./${sourceName}";`);
    }

    if (framework === "vitest") {
      sections.push(`import { describe, it, expect } from "vitest";`);
    }
    for (const imp of imports) {
      sections.push(imp);
    }
    sections.push("");
  }

  for (const [fnName, fnTests] of grouped) {
    if (config.importStyle === "esm" || config.importStyle === "cjs") {
      sections.push(`describe("${fnName}", () => {`);
      for (const test of fnTests) {
        sections.push(`  it("${test.name}", () => {`);
        sections.push(`    // ${test.description}`);
        sections.push(`    // Confidence: ${(test.confidence * 100).toFixed(0)}%`);
        sections.push(`  });`);
        sections.push("");
      }
      sections.push(`});`);
      sections.push("");
    } else {
      for (const test of fnTests) {
        sections.push(test.code);
        sections.push("");
      }
    }
  }

  return sections.join("\n");
}

export { buildGeneratePrompt };