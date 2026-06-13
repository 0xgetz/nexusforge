import { describe, test, expect } from "bun:test";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { toJSON, toMarkdown, toSARIF } from "../packages/scanner/src/reporter.js";
import { detectEcosystem } from "../packages/scanner/src/scanner.js";
import type { ScanResult } from "../packages/scanner/src/types.js";

const sampleResult: ScanResult = {
  projectName: "demo",
  projectPath: "/tmp/demo",
  timestamp: new Date("2026-01-01T00:00:00Z").toISOString(),
  duration: 42,
  ecosystem: "npm",
  totalDependencies: 3,
  vulnerablePackages: 1,
  vulnerabilities: [
    {
      id: "GHSA-xxxx-yyyy-zzzz",
      package: "leftpad",
      version: "1.0.0",
      severity: "high",
      title: "Prototype pollution",
      description: "A prototype pollution vulnerability.",
      fixedIn: "1.0.1",
      url: "https://example.com/advisory",
    },
  ],
  dependencies: [],
  summary: { critical: 0, high: 1, medium: 0, low: 0, info: 0, total: 1, score: 85 },
};

describe("scanner reporters", () => {
  test("toJSON round-trips the result", () => {
    const parsed = JSON.parse(toJSON(sampleResult));
    expect(parsed.projectName).toBe("demo");
    expect(parsed.summary.score).toBe(85);
    expect(parsed.vulnerabilities).toHaveLength(1);
  });

  test("toMarkdown includes the score and vulnerability id", () => {
    const md = toMarkdown(sampleResult);
    expect(md).toContain("# NexusForge Security Report");
    expect(md).toContain("85/100");
    expect(md).toContain("GHSA-xxxx-yyyy-zzzz");
  });

  test("toSARIF emits valid SARIF 2.1.0 with one result", () => {
    const sarif = JSON.parse(toSARIF(sampleResult));
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0].tool.driver.name).toBe("NexusForge Scanner");
    expect(sarif.runs[0].results).toHaveLength(1);
    // high severity maps to an "error" level
    expect(sarif.runs[0].results[0].level).toBe("error");
    expect(sarif.runs[0].results[0].ruleId).toBe("GHSA-xxxx-yyyy-zzzz");
  });
});

describe("detectEcosystem", () => {
  test("detects npm from package.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "nxf-"));
    writeFileSync(join(dir, "package.json"), "{}");
    expect(detectEcosystem(dir)).toBe("npm");
  });

  test("detects cargo from Cargo.toml", () => {
    const dir = mkdtempSync(join(tmpdir(), "nxf-"));
    writeFileSync(join(dir, "Cargo.toml"), "");
    expect(detectEcosystem(dir)).toBe("cargo");
  });

  test("returns unknown for an empty directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "nxf-"));
    expect(detectEcosystem(dir)).toBe("unknown");
  });
});
