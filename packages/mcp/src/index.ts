#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { scan, toMarkdown, lookupCVE } from "@nexusforge/scanner";
import { analyze, generateReport } from "@nexusforge/healer";
import { reviewProject, analyzeMetrics, getAllRules, filterRules } from "@nexusforge/guardian";
import { detectProject, getRecommendedProvider } from "@nexusforge/deployer";

const VERSION = "0.1.0";

const server = new McpServer({
  name: "nexusforge",
  version: VERSION,
});

function text(body: string) {
  return { content: [{ type: "text" as const, text: body }] };
}

server.registerTool(
  "scan_dependencies",
  {
    title: "Scan dependencies for vulnerabilities",
    description:
      "Audit a project's dependencies (npm, pip, Cargo, Go) for known CVEs via the OSV.dev database. Returns a security score (0-100) and a Markdown vulnerability report.",
    inputSchema: {
      path: z.string().describe("Absolute path to the project directory to scan"),
      includeDev: z.boolean().default(false).describe("Include devDependencies in the scan"),
      offline: z.boolean().default(false).describe("Skip network CVE lookups"),
    },
  },
  async ({ path, includeDev, offline }) => {
    const result = await scan({ path, includeDev, offline });
    return text(toMarkdown(result));
  },
);

server.registerTool(
  "lookup_cve",
  {
    title: "Look up a CVE or advisory",
    description: "Fetch details for a specific vulnerability ID (CVE-…, GHSA-…) from OSV.dev.",
    inputSchema: {
      id: z.string().describe("The vulnerability identifier, e.g. CVE-2021-23337 or GHSA-xxxx-xxxx-xxxx"),
    },
  },
  async ({ id }) => {
    const vuln = await lookupCVE(id);
    if (!vuln) return text(`No record found for ${id}.`);
    return text(JSON.stringify(vuln, null, 2));
  },
);

server.registerTool(
  "diagnose_code",
  {
    title: "Detect bugs and security flaws",
    description:
      "Statically scan a codebase (TS/JS/Python/Rust/Go/Java) for bugs, security flaws, hardcoded secrets, and anti-patterns. Read-only — never modifies files. Returns a Markdown health report with a score.",
    inputSchema: {
      path: z.string().describe("Absolute path to the project directory to diagnose"),
      ignore: z.array(z.string()).optional().describe("Directory names to skip"),
    },
  },
  async ({ path, ignore }) => {
    const result = await analyze(path, { fix: false, ignore });
    return text(generateReport(result));
  },
);

server.registerTool(
  "review_code",
  {
    title: "AI-style code review",
    description:
      "Run a rule-based code review over a project and return an A–F grade, a score, and the issues found grouped by severity and category.",
    inputSchema: {
      path: z.string().describe("Absolute path to the source directory to review"),
    },
  },
  async ({ path }) => {
    const review = await reviewProject(path);
    return text(JSON.stringify(review, null, 2));
  },
);

server.registerTool(
  "quality_metrics",
  {
    title: "Code quality metrics",
    description:
      "Compute maintainability index, technical-debt estimate, duplication, and complexity hotspots for a project.",
    inputSchema: {
      path: z.string().describe("Absolute path to the project directory"),
    },
  },
  async ({ path }) => {
    const metrics = await analyzeMetrics(path);
    return text(JSON.stringify(metrics, null, 2));
  },
);

server.registerTool(
  "detect_project",
  {
    title: "Detect project type and deploy target",
    description:
      "Detect framework, runtime, build/start commands, and the recommended deployment provider for a project.",
    inputSchema: {
      path: z.string().describe("Absolute path to the project directory"),
    },
  },
  async ({ path }) => {
    const config = detectProject(path);
    const recommendedProvider = getRecommendedProvider(config);
    return text(JSON.stringify({ ...config, recommendedProvider }, null, 2));
  },
);

server.registerTool(
  "list_security_rules",
  {
    title: "List Guardian review rules",
    description: "List the built-in code-review rules, optionally filtered by severity or category.",
    inputSchema: {
      severity: z.enum(["critical", "major", "minor", "suggestion", "praise"]).optional(),
      category: z
        .enum(["bug-risk", "performance", "security", "maintainability", "readability", "style", "best-practice"])
        .optional(),
    },
  },
  async ({ severity, category }) => {
    const rules = filterRules(getAllRules(), { severity, category });
    return text(JSON.stringify(rules.map((r) => ({ id: r.id, name: r.name, severity: r.severity, category: r.category, description: r.description })), null, 2));
  },
);

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`NexusForge MCP server v${VERSION} running on stdio.`);
  } catch (error) {
    console.error("Failed to start NexusForge MCP server:", error);
    process.exit(1);
  }
}

main();
