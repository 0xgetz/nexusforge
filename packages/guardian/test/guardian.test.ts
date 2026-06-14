import { test, expect } from "bun:test";
import { getBuiltinRules, getAllRules, filterRules, createRule } from "../src/rules.js";
import { parseDiff, reviewDiff } from "../src/diff.js";

test("getBuiltinRules returns the documented catalogue", () => {
  const rules = getBuiltinRules();
  const ids = rules.map((r) => r.id);
  expect(ids).toContain("SEC-001");
  expect(ids).toContain("SEC-002");
  expect(ids).toContain("MAINT-001");
  expect(rules.length).toBeGreaterThanOrEqual(14);
});

test("getBuiltinRules returns a fresh copy each call", () => {
  const a = getBuiltinRules();
  a.pop();
  expect(getBuiltinRules().length).toBe(a.length + 1);
});

test("filterRules narrows by severity", () => {
  const critical = filterRules(getBuiltinRules(), { severity: "critical" });
  expect(critical.length).toBeGreaterThan(0);
  expect(critical.every((r) => r.severity === "critical")).toBe(true);
});

test("filterRules narrows by category", () => {
  const security = filterRules(getBuiltinRules(), { category: "security" });
  expect(security.every((r) => r.category === "security")).toBe(true);
});

test("createRule fills sane defaults", () => {
  const r = createRule({ id: "X-1", name: "n", pattern: "foo", message: "m" });
  expect(r.enabled).toBe(true);
  expect(r.severity).toBe("minor");
});

test("getAllRules without custom dir equals builtin", () => {
  expect(getAllRules().length).toBe(getBuiltinRules().length);
});

test("parseDiff extracts added/removed lines", () => {
  const raw = [
    "diff --git a/foo.ts b/foo.ts",
    "index 111..222 100644",
    "--- a/foo.ts",
    "+++ b/foo.ts",
    "@@ -1,2 +1,2 @@",
    "-const x = 1;",
    "+const x = 2;",
    " const y = 3;",
  ].join("\n");
  const summary = parseDiff(raw);
  expect(summary.filesChanged).toBeGreaterThan(0);
  expect(summary.additions).toBeGreaterThan(0);
  const issues = reviewDiff(summary);
  expect(Array.isArray(issues)).toBe(true);
});
