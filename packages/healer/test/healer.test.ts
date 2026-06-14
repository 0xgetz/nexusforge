import { test, expect, beforeEach } from "bun:test";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { detectBugs, scanDirectory, resetCounter } from "../src/detector.js";
import { generateFixes, applyFixes, generatePatchContent } from "../src/fixer.js";
import { analyze, generateReport } from "../src/analyzer.js";

beforeEach(() => resetCounter());

test("detects eval() as a critical security flaw", () => {
  const bugs = detectBugs("a.ts", "const r = eval(userInput);");
  const f = bugs.find((b) => b.category === "security-flaw");
  expect(f).toBeDefined();
  expect(f!.severity).toBe("critical");
});

test("detects hardcoded secret as critical", () => {
  const bugs = detectBugs("a.ts", `const apiKey = "abcdefghijklmnop1234";`);
  expect(bugs.some((b) => b.category === "hardcoded-secret" && b.severity === "critical")).toBe(true);
});

test("detects console.log as auto-fixable", () => {
  const bugs = detectBugs("a.ts", "console.log('debug');");
  expect(bugs.some((b) => b.autoFixable && b.category === "performance")).toBe(true);
});

test("detects var usage and loose equality", () => {
  const bugs = detectBugs("a.ts", "var x = 1;\nif (x == 2) {}");
  expect(bugs.some((b) => b.message.includes("'var'"))).toBe(true);
  expect(bugs.some((b) => b.message.includes("loose equality"))).toBe(true);
});

test("language filtering: python patterns do not fire on .ts", () => {
  const bugs = detectBugs("a.ts", "except:");
  expect(bugs.some((b) => b.message.includes("Bare except"))).toBe(false);
});

test("python bare-except fires on .py", () => {
  const bugs = detectBugs("a.py", "try:\n    pass\nexcept:\n    pass");
  expect(bugs.some((b) => b.message.includes("Bare except"))).toBe(true);
});

test("rust unwrap() flagged on .rs only", () => {
  expect(detectBugs("a.rs", "let v = x.unwrap();").some((b) => b.message.includes("unwrap"))).toBe(true);
  expect(detectBugs("a.ts", "let v = x.unwrap();").some((b) => b.message.includes("unwrap"))).toBe(false);
});

test("bug ids are stable and incrementing", () => {
  const bugs = detectBugs("a.ts", "var x=1;\nvar y=2;");
  expect(bugs[0].id).toMatch(/^NXF-\d{4}$/);
});

test("generateFixes + applyFixes rewrites var to const on disk", () => {
  const dir = mkdtempSync(join(tmpdir(), "nxf-heal-"));
  try {
    writeFileSync(join(dir, "f.ts"), "var x = 1;\n");
    const result = scanDirectory(dir);
    const bugs = result.flatMap((r) => r.bugs);
    const fixes = generateFixes(bugs, dir);
    const applied = applyFixes(fixes, dir);
    expect(applied).toBeGreaterThan(0);
    expect(readFileSync(join(dir, "f.ts"), "utf-8")).toContain("const x = 1;");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("analyze() lowers health score when bugs exist", async () => {
  const dir = mkdtempSync(join(tmpdir(), "nxf-heal2-"));
  try {
    writeFileSync(join(dir, "bad.ts"), "const k = eval(x);\nconsole.log(1);\n");
    const res = await analyze(dir);
    expect(res.summary.totalBugs).toBeGreaterThan(0);
    expect(res.summary.healthScore).toBeLessThan(100);
    expect(generateReport(res)).toContain("Health Score");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("generatePatchContent produces unified-diff markers", () => {
  const dir = mkdtempSync(join(tmpdir(), "nxf-heal3-"));
  try {
    writeFileSync(join(dir, "f.ts"), "var x = 1;\n");
    const bugs = scanDirectory(dir).flatMap((r) => r.bugs);
    const fixes = generateFixes(bugs, dir);
    const patch = generatePatchContent(fixes);
    expect(patch).toContain("--- a/");
    expect(patch).toContain("+++ b/");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
