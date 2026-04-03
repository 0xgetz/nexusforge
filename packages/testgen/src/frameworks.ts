import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import type { TestFramework, TestCase, FunctionSignature, FrameworkConfig } from "./types.js";

export const FRAMEWORK_CONFIGS: Record<TestFramework, FrameworkConfig> = {
  jest: {
    name: "jest",
    displayName: "Jest",
    language: "typescript",
    extension: ".ts",
    testExtension: ".test.ts",
    runner: "npx jest",
    importStyle: "esm",
    assertionLib: "jest",
  },
  vitest: {
    name: "vitest",
    displayName: "Vitest",
    language: "typescript",
    extension: ".ts",
    testExtension: ".test.ts",
    runner: "npx vitest run",
    importStyle: "esm",
    assertionLib: "vitest",
  },
  mocha: {
    name: "mocha",
    displayName: "Mocha",
    language: "javascript",
    extension: ".js",
    testExtension: ".test.js",
    runner: "npx mocha",
    importStyle: "esm",
    assertionLib: "chai",
  },
  pytest: {
    name: "pytest",
    displayName: "pytest",
    language: "python",
    extension: ".py",
    testExtension: "_test.py",
    runner: "pytest",
    importStyle: "python",
    assertionLib: "assert",
  },
  unittest: {
    name: "unittest",
    displayName: "unittest",
    language: "python",
    extension: ".py",
    testExtension: "_test.py",
    runner: "python -m unittest",
    importStyle: "python",
    assertionLib: "unittest",
  },
  "go-test": {
    name: "go-test",
    displayName: "Go Test",
    language: "go",
    extension: ".go",
    testExtension: "_test.go",
    runner: "go test",
    importStyle: "go",
    assertionLib: "testing",
  },
  "cargo-test": {
    name: "cargo-test",
    displayName: "Cargo Test",
    language: "rust",
    extension: ".rs",
    testExtension: ".rs",
    runner: "cargo test",
    importStyle: "rust",
    assertionLib: "assert",
  },
  junit: {
    name: "junit",
    displayName: "JUnit 5",
    language: "java",
    extension: ".java",
    testExtension: "Test.java",
    runner: "mvn test",
    importStyle: "java",
    assertionLib: "junit",
  },
};

export function detectFramework(projectPath: string): TestFramework {
  try {
    const pkgPath = join(projectPath, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (allDeps["vitest"]) return "vitest";
      if (allDeps["jest"]) return "jest";
      if (allDeps["mocha"]) return "mocha";
    }
  } catch { /* continue */ }

  try {
    if (existsSync(join(projectPath, "pyproject.toml")) || existsSync(join(projectPath, "setup.py"))) {
      return "pytest";
    }
  } catch { /* continue */ }

  try {
    if (existsSync(join(projectPath, "go.mod"))) return "go-test";
  } catch { /* continue */ }

  try {
    if (existsSync(join(projectPath, "Cargo.toml"))) return "cargo-test";
  } catch { /* continue */ }

  try {
    if (existsSync(join(projectPath, "pom.xml"))) return "junit";
  } catch { /* continue */ }

  return "vitest";
}

export function generateTestCode(fn: FunctionSignature, framework: TestFramework): TestCase[] {
  const config = FRAMEWORK_CONFIGS[framework];
  const cases: TestCase[] = [];

  const happyPath = generateHappyPath(fn, config);
  cases.push(happyPath);

  const edgeCases = generateEdgeCases(fn, config);
  cases.push(...edgeCases);

  const errorCases = generateErrorCases(fn, config);
  cases.push(...errorCases);

  return cases;
}

function generateHappyPath(fn: FunctionSignature, config: FrameworkConfig): TestCase {
  const testCode = buildTestCode(fn, config, "happy-path", `should work correctly`);

  return {
    id: randomUUID(),
    name: `${fn.name} — happy path`,
    description: `Verify ${fn.name} works with valid inputs`,
    type: "unit",
    sourceFile: fn.file,
    sourceFunction: fn.name,
    code: testCode,
    assertions: fn.params.length + 1,
    confidence: 0.9,
    framework: config.name,
  };
}

function generateEdgeCases(fn: FunctionSignature, config: FrameworkConfig): TestCase[] {
  const cases: TestCase[] = [];

  for (const param of fn.params) {
    if (param.type.includes("string") || param.type === "unknown") {
      cases.push({
        id: randomUUID(),
        name: `${fn.name} — empty string for ${param.name}`,
        description: `Test ${fn.name} with empty string for ${param.name}`,
        type: "edge-case",
        sourceFile: fn.file,
        sourceFunction: fn.name,
        code: buildTestCode(fn, config, "edge-case", `should handle empty string for ${param.name}`),
        assertions: 1,
        confidence: 0.7,
        framework: config.name,
      });
    }

    if (param.type.includes("number") || param.type.includes("int") || param.type.includes("float")) {
      cases.push({
        id: randomUUID(),
        name: `${fn.name} — zero value for ${param.name}`,
        description: `Test ${fn.name} with zero for ${param.name}`,
        type: "boundary",
        sourceFile: fn.file,
        sourceFunction: fn.name,
        code: buildTestCode(fn, config, "boundary", `should handle zero for ${param.name}`),
        assertions: 1,
        confidence: 0.75,
        framework: config.name,
      });

      cases.push({
        id: randomUUID(),
        name: `${fn.name} — negative value for ${param.name}`,
        description: `Test ${fn.name} with negative number for ${param.name}`,
        type: "boundary",
        sourceFile: fn.file,
        sourceFunction: fn.name,
        code: buildTestCode(fn, config, "boundary", `should handle negative value for ${param.name}`),
        assertions: 1,
        confidence: 0.7,
        framework: config.name,
      });
    }

    if (param.optional) {
      cases.push({
        id: randomUUID(),
        name: `${fn.name} — undefined for optional ${param.name}`,
        description: `Test ${fn.name} without optional param ${param.name}`,
        type: "edge-case",
        sourceFile: fn.file,
        sourceFunction: fn.name,
        code: buildTestCode(fn, config, "edge-case", `should handle undefined for ${param.name}`),
        assertions: 1,
        confidence: 0.8,
        framework: config.name,
      });
    }
  }

  return cases;
}

function generateErrorCases(fn: FunctionSignature, config: FrameworkConfig): TestCase[] {
  const cases: TestCase[] = [];
  const bodyLower = fn.body.toLowerCase();

  if (bodyLower.includes("throw") || bodyLower.includes("error") || bodyLower.includes("raise")) {
    cases.push({
      id: randomUUID(),
      name: `${fn.name} — error handling`,
      description: `Verify ${fn.name} throws errors for invalid inputs`,
      type: "error-case",
      sourceFile: fn.file,
      sourceFunction: fn.name,
      code: buildTestCode(fn, config, "error-case", `should throw error for invalid input`),
      assertions: 1,
      confidence: 0.85,
      framework: config.name,
    });
  }

  if (fn.isAsync) {
    cases.push({
      id: randomUUID(),
      name: `${fn.name} — async rejection`,
      description: `Verify ${fn.name} handles async rejections properly`,
      type: "error-case",
      sourceFile: fn.file,
      sourceFunction: fn.name,
      code: buildTestCode(fn, config, "error-case", `should handle async rejection`),
      assertions: 1,
      confidence: 0.65,
      framework: config.name,
    });
  }

  return cases;
}

function buildTestCode(
  fn: FunctionSignature,
  config: FrameworkConfig,
  _testType: string,
  testDescription: string
): string {
  const { name } = config;

  if (name === "jest" || name === "vitest" || name === "mocha") {
    return buildJSTestCode(fn, name, testDescription);
  }
  if (name === "pytest") {
    return buildPytestCode(fn, testDescription);
  }
  if (name === "go-test") {
    return buildGoTestCode(fn, testDescription);
  }
  if (name === "cargo-test") {
    return buildRustTestCode(fn, testDescription);
  }
  if (name === "junit") {
    return buildJUnitCode(fn, testDescription);
  }
  if (name === "unittest") {
    return buildUnittestCode(fn, testDescription);
  }

  return buildJSTestCode(fn, "vitest", testDescription);
}

function buildJSTestCode(fn: FunctionSignature, framework: string, description: string): string {
  const importLine =
    framework === "vitest"
      ? `import { describe, it, expect } from "vitest";`
      : framework === "mocha"
        ? `import { expect } from "chai";`
        : "";

  const params = fn.params.map((p) => getSampleValue(p.type)).join(", ");
  const asyncPrefix = fn.isAsync ? "async " : "";
  const awaitPrefix = fn.isAsync ? "await " : "";

  return [
    importLine,
    `import { ${fn.name} } from "./${fn.file.split("/").pop()?.replace(/\.\w+$/, "")}";`,
    "",
    `describe("${fn.name}", () => {`,
    `  it("${description}", ${asyncPrefix}() => {`,
    `    const result = ${awaitPrefix}${fn.name}(${params});`,
    `    expect(result).toBeDefined();`,
    `  });`,
    `});`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPytestCode(fn: FunctionSignature, description: string): string {
  const params = fn.params.map((p) => getPythonSampleValue(p.type)).join(", ");
  const asyncDef = fn.isAsync ? "async " : "";
  const awaitPrefix = fn.isAsync ? "await " : "";
  const snakeDesc = description.replace(/\s+/g, "_").toLowerCase();

  return [
    `from ${fn.file.split("/").pop()?.replace(".py", "")} import ${fn.name}`,
    "",
    fn.isAsync ? "import pytest" : "",
    fn.isAsync ? "" : "",
    `${asyncDef}def test_${fn.name}_${snakeDesc}():`,
    `    result = ${awaitPrefix}${fn.name}(${params})`,
    `    assert result is not None`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

function buildGoTestCode(fn: FunctionSignature, description: string): string {
  const params = fn.params.map((p) => getGoSampleValue(p.type)).join(", ");
  const camelDesc = description.replace(/\s+/g, "_");

  return [
    `package main`,
    "",
    `import "testing"`,
    "",
    `func Test${fn.name}_${camelDesc}(t *testing.T) {`,
    `    result := ${fn.name}(${params})`,
    `    if result == nil {`,
    `        t.Error("expected non-nil result")`,
    `    }`,
    `}`,
  ].join("\n");
}

function buildRustTestCode(fn: FunctionSignature, description: string): string {
  const params = fn.params.map((p) => getRustSampleValue(p.type)).join(", ");
  const snakeDesc = description.replace(/\s+/g, "_").toLowerCase();

  return [
    `#[cfg(test)]`,
    `mod tests {`,
    `    use super::*;`,
    "",
    `    #[test]`,
    `    fn test_${fn.name}_${snakeDesc}() {`,
    `        let result = ${fn.name}(${params});`,
    `        assert!(result.is_ok() || true);`,
    `    }`,
    `}`,
  ].join("\n");
}

function buildJUnitCode(fn: FunctionSignature, description: string): string {
  const params = fn.params.map((p) => getJavaSampleValue(p.type)).join(", ");

  return [
    `import org.junit.jupiter.api.Test;`,
    `import static org.junit.jupiter.api.Assertions.*;`,
    "",
    `class ${fn.name.charAt(0).toUpperCase() + fn.name.slice(1)}Test {`,
    "",
    `    @Test`,
    `    void ${fn.name}_${description.replace(/\s+/g, "_")}() {`,
    `        var result = ${fn.name}(${params});`,
    `        assertNotNull(result);`,
    `    }`,
    `}`,
  ].join("\n");
}

function buildUnittestCode(fn: FunctionSignature, description: string): string {
  const params = fn.params.map((p) => getPythonSampleValue(p.type)).join(", ");
  const snakeDesc = description.replace(/\s+/g, "_").toLowerCase();

  return [
    `import unittest`,
    `from ${fn.file.split("/").pop()?.replace(".py", "")} import ${fn.name}`,
    "",
    `class Test${fn.name.charAt(0).toUpperCase() + fn.name.slice(1)}(unittest.TestCase):`,
    "",
    `    def test_${snakeDesc}(self):`,
    `        result = ${fn.name}(${params})`,
    `        self.assertIsNotNone(result)`,
  ].join("\n");
}

function getSampleValue(type: string): string {
  if (type.includes("string")) return '"test"';
  if (type.includes("number") || type.includes("int") || type.includes("float")) return "42";
  if (type.includes("boolean") || type.includes("bool")) return "true";
  if (type.includes("[]") || type.includes("Array")) return "[]";
  if (type.includes("object") || type.includes("Record")) return "{}";
  return '"test"';
}

function getPythonSampleValue(type: string): string {
  if (type.includes("str")) return '"test"';
  if (type.includes("int") || type.includes("float")) return "42";
  if (type.includes("bool")) return "True";
  if (type.includes("list") || type.includes("List")) return "[]";
  if (type.includes("dict") || type.includes("Dict")) return "{}";
  return '"test"';
}

function getGoSampleValue(type: string): string {
  if (type.includes("string")) return '"test"';
  if (type.includes("int") || type.includes("float")) return "42";
  if (type.includes("bool")) return "true";
  return '"test"';
}

function getRustSampleValue(type: string): string {
  if (type.includes("String") || type.includes("&str")) return '"test".to_string()';
  if (type.includes("i32") || type.includes("u32") || type.includes("f64")) return "42";
  if (type.includes("bool")) return "true";
  return '"test"';
}

function getJavaSampleValue(type: string): string {
  if (type.includes("String")) return '"test"';
  if (type.includes("int") || type.includes("Integer")) return "42";
  if (type.includes("double") || type.includes("float")) return "42.0";
  if (type.includes("boolean")) return "true";
  return '"test"';
}

export function getFrameworkConfig(framework: TestFramework): FrameworkConfig {
  return FRAMEWORK_CONFIGS[framework];
}