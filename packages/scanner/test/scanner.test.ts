import { test, expect } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { detectEcosystem, calculateSummary, cleanVersion } from "../src/scanner.js";
import { toJSON, toMarkdown, toHTML, toSARIF } from "../src/reporter.js";
import type { ScanResult, Vulnerability } from "../src/types.js";

function withDir(files: Record<string, string>, fn: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "nxf-scan-"));
  try {
    for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("detectEcosystem identifies each ecosystem", () => {
  withDir({ "package.json": "{}" }, (d) => expect(detectEcosystem(d)).toBe("npm"));
  withDir({ "requirements.txt": "" }, (d) => expect(detectEcosystem(d)).toBe("pip"));
  withDir({ "Cargo.toml": "" }, (d) => expect(detectEcosystem(d)).toBe("cargo"));
  withDir({ "go.mod": "" }, (d) => expect(detectEcosystem(d)).toBe("go"));
  withDir({ "readme.md": "" }, (d) => expect(detectEcosystem(d)).toBe("unknown"));
});

test("cleanVersion strips range operators", () => {
  expect(cleanVersion("^1.2.3")).toBe("1.2.3");
  expect(cleanVersion("~0.4.0")).toBe("0.4.0");
  expect(cleanVersion(">=2.0.0")).toBe("2.0.0");
  expect(cleanVersion("3.1.4")).toBe("3.1.4");
});

test("calculateSummary perfect score with no vulns", () => {
  const s = calculateSummary([]);
  expect(s.score).toBe(100);
  expect(s.total).toBe(0);
});

test("calculateSummary weights severities and floors at 0", () => {
  const v = (severity: Vulnerability["severity"]): Vulnerability => ({
    id: "X", package: "p", version: "1.0.0", severity, title: "t", description: "d",
  });
  expect(calculateSummary([v("critical")]).score).toBe(75);
  expect(calculateSummary([v("high")]).score).toBe(85);
  expect(calculateSummary([v("medium")]).score).toBe(95);
  expect(calculateSummary(Array(10).fill(v("critical"))).score).toBe(0);
});

const sample: ScanResult = {
  projectName: "demo",
  projectPath: "/tmp/demo",
  timestamp: new Date().toISOString(),
  duration: 12,
  ecosystem: "npm",
  totalDependencies: 1,
  vulnerablePackages: 1,
  vulnerabilities: [{
    id: "CVE-2024-0001", package: "lodash", version: "4.17.0", severity: "high",
    title: "Prototype pollution", description: "desc", fixedIn: "4.17.21", cvss: 7.5,
    url: "https://osv.dev/CVE-2024-0001",
  }],
  dependencies: [{ name: "lodash", version: "4.17.0", outdated: true, vulnerabilities: [] }],
  summary: { critical: 0, high: 1, medium: 0, low: 0, info: 0, total: 1, score: 85 },
};

test("reporter toJSON round-trips", () => {
  expect(JSON.parse(toJSON(sample)).projectName).toBe("demo");
});

test("reporter toMarkdown includes score and CVE", () => {
  const md = toMarkdown(sample);
  expect(md).toContain("85");
  expect(md).toContain("CVE-2024-0001");
});

test("reporter toHTML produces a document", () => {
  expect(toHTML(sample).toLowerCase()).toContain("<!doctype html");
});

test("reporter toSARIF is valid SARIF 2.1.0", () => {
  const sarif = JSON.parse(toSARIF(sample));
  expect(sarif.version).toBe("2.1.0");
  expect(Array.isArray(sarif.runs)).toBe(true);
});
