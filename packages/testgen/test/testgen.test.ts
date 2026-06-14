import { test, expect } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { detectFramework, FRAMEWORK_CONFIGS } from "../src/frameworks.js";

function withDir(files: Record<string, string>, fn: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "nxf-testgen-"));
  try {
    for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("FRAMEWORK_CONFIGS covers the documented frameworks", () => {
  for (const fw of ["jest", "vitest", "mocha", "pytest", "unittest", "go-test", "cargo-test", "junit"] as const) {
    expect(FRAMEWORK_CONFIGS[fw]).toBeDefined();
    expect(FRAMEWORK_CONFIGS[fw].runner.length).toBeGreaterThan(0);
  }
});

test("detectFramework picks vitest when present in devDependencies", () => {
  withDir({ "package.json": JSON.stringify({ devDependencies: { vitest: "^2.0.0" } }) }, (dir) => {
    expect(detectFramework(dir)).toBe("vitest");
  });
});

test("detectFramework picks jest over mocha", () => {
  withDir({ "package.json": JSON.stringify({ devDependencies: { jest: "^29", mocha: "^10" } }) }, (dir) => {
    expect(detectFramework(dir)).toBe("jest");
  });
});

test("detectFramework picks pytest for a python project", () => {
  withDir({ "pyproject.toml": "[project]\nname='x'\n" }, (dir) => {
    expect(detectFramework(dir)).toBe("pytest");
  });
});

test("detectFramework picks go-test for a go module", () => {
  withDir({ "go.mod": "module x\ngo 1.22\n" }, (dir) => {
    expect(detectFramework(dir)).toBe("go-test");
  });
});

test("detectFramework defaults to vitest for an unknown project", () => {
  withDir({ "readme.md": "hi" }, (dir) => {
    expect(detectFramework(dir)).toBe("vitest");
  });
});
