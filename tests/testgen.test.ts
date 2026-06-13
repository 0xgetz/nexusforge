import { describe, test, expect } from "bun:test";
import { getMutatorDescriptions } from "../packages/testgen/src/mutator.js";
import { buildTestFileName } from "../packages/testgen/src/generator.js";
import { getFrameworkConfig } from "../packages/testgen/src/frameworks.js";

describe("testgen mutators", () => {
  test("exposes a description for every mutator type", () => {
    const descriptions = getMutatorDescriptions();
    expect(Object.keys(descriptions)).toContain("arithmetic");
    expect(Object.keys(descriptions)).toContain("conditional");
    for (const value of Object.values(descriptions)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

describe("testgen helpers", () => {
  test("buildTestFileName swaps the extension for the test extension", () => {
    expect(buildTestFileName("src/utils.ts", ".test.ts")).toBe("utils.test.ts");
    expect(buildTestFileName("/abs/path/auth.py", "_test.py")).toBe("auth_test.py");
  });

  test("getFrameworkConfig returns the matching framework metadata", () => {
    const vitest = getFrameworkConfig("vitest");
    expect(vitest.name).toBe("vitest");
    expect(vitest.testExtension).toBe(".test.ts");
  });
});
