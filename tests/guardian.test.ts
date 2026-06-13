import { describe, test, expect } from "bun:test";
import { getBuiltinRules, filterRules, createRule } from "../packages/guardian/src/rules.js";

describe("guardian rules", () => {
  test("ships a non-empty set of built-in rules with unique ids", () => {
    const rules = getBuiltinRules();
    expect(rules.length).toBeGreaterThanOrEqual(14);
    const ids = rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("getBuiltinRules returns a fresh copy each call", () => {
    const a = getBuiltinRules();
    a.pop();
    expect(getBuiltinRules().length).toBeGreaterThan(a.length);
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

  test("filterRules excludes disabled rules unless asked", () => {
    const rules = [
      createRule({ id: "T1", name: "on", pattern: "a", message: "m", enabled: true }),
      createRule({ id: "T2", name: "off", pattern: "b", message: "m", enabled: false }),
    ];
    expect(filterRules(rules)).toHaveLength(1);
    expect(filterRules(rules, { enabledOnly: false })).toHaveLength(2);
  });

  test("createRule applies sensible defaults", () => {
    const rule = createRule({ id: "X1", name: "x", pattern: "p", message: "m" });
    expect(rule.severity).toBe("minor");
    expect(rule.category).toBe("best-practice");
    expect(rule.enabled).toBe(true);
  });
});
