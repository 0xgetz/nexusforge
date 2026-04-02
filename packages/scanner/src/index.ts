#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { scan } from "./scanner.js";
import { toJSON, toMarkdown, toHTML, toSARIF } from "./reporter.js";
import { lookupCVE } from "./cve.js";

const VERSION = "0.1.0";

const program = new Command();

program
  .name("nxf-scan")
  .description("NexusForge Security Scanner — Dependency auditing & vulnerability detection")
  .version(VERSION);

program
  .command("audit")
  .description("Scan project dependencies for vulnerabilities")
  .option("-p, --path <path>", "Project path to scan", process.cwd())
  .option("-f, --format <format>", "Output format: json, markdown, html, sarif", "markdown")
  .option("-o, --output <file>", "Write report to file")
  .option("--include-dev", "Include devDependencies in scan", false)
  .option("--offline", "Run in offline mode (skip CVE lookup)", false)
  .option("--deep", "Deep scan including transitive dependencies", false)
  .action(async (options) => {
    console.log(chalk.hex("#10b981").bold("\n⚡ NexusForge Security Scanner\n"));

    const spinner = ora("Scanning dependencies...").start();

    try {
      const result = await scan({
        path: resolve(options.path),
        includeDev: options.includeDev,
        offline: options.offline,
        deep: options.deep,
      });

      spinner.succeed(
        `Scanned ${result.totalDependencies} dependencies in ${result.duration}ms`
      );

      const scoreColor =
        result.summary.score >= 80 ? chalk.green :
        result.summary.score >= 60 ? chalk.yellow :
        result.summary.score >= 40 ? chalk.hex("#f97316") : chalk.red;

      console.log();
      console.log(chalk.white.bold("  Security Score: ") + scoreColor.bold(`${result.summary.score}/100`));
      console.log();

      const sev = result.summary;
      if (sev.critical > 0) console.log(chalk.red(`  🔴 Critical: ${sev.critical}`));
      if (sev.high > 0) console.log(chalk.hex("#f97316")(`  🟠 High:     ${sev.high}`));
      if (sev.medium > 0) console.log(chalk.yellow(`  🟡 Medium:   ${sev.medium}`));
      if (sev.low > 0) console.log(chalk.blue(`  🔵 Low:      ${sev.low}`));
      if (sev.total === 0) console.log(chalk.green(`  ✓  No vulnerabilities found!`));
      console.log();

      if (result.vulnerabilities.length > 0) {
        console.log(chalk.white.bold("  Vulnerabilities Found:"));
        console.log(chalk.dim("  ─────────────────────────"));
        for (const vuln of result.vulnerabilities.slice(0, 10)) {
          const sevColor =
            vuln.severity === "critical" ? chalk.red :
            vuln.severity === "high" ? chalk.hex("#f97316") :
            vuln.severity === "medium" ? chalk.yellow : chalk.blue;
          console.log(`  ${sevColor(`[${vuln.severity.toUpperCase()}]`)} ${chalk.white(vuln.id)}`);
          console.log(`    ${chalk.dim(vuln.package)}@${chalk.dim(vuln.version)}`);
          console.log(`    ${chalk.dim(vuln.title)}`);
          if (vuln.fixedIn) console.log(`    ${chalk.green(`Fix: upgrade to ${vuln.fixedIn}`)}`);
          console.log();
        }
        if (result.vulnerabilities.length > 10) {
          console.log(chalk.dim(`  ... and ${result.vulnerabilities.length - 10} more\n`));
        }
      }

      if (options.output) {
        let content: string;
        switch (options.format) {
          case "json": content = toJSON(result); break;
          case "html": content = toHTML(result); break;
          case "sarif": content = toSARIF(result); break;
          default: content = toMarkdown(result);
        }
        writeFileSync(options.output, content, "utf-8");
        console.log(chalk.green(`  ✓ Report saved to ${options.output}\n`));
      }
    } catch (err) {
      spinner.fail("Scan failed");
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\n  ✗ ${message}\n`));
      process.exit(1);
    }
  });

program
  .command("lookup <cve-id>")
  .description("Look up a specific CVE/vulnerability by ID")
  .action(async (cveId) => {
    const spinner = ora(`Looking up ${cveId}...`).start();

    try {
      const vuln = await lookupCVE(cveId);
      spinner.stop();

      if (!vuln) {
        console.log(chalk.yellow(`\n  No data found for ${cveId}\n`));
        return;
      }

      const sevColor =
        vuln.severity === "critical" ? chalk.red :
        vuln.severity === "high" ? chalk.hex("#f97316") :
        vuln.severity === "medium" ? chalk.yellow : chalk.blue;

      console.log(chalk.hex("#10b981").bold(`\n⚡ ${vuln.id}\n`));
      console.log(`  ${chalk.white.bold("Severity:")}  ${sevColor(vuln.severity.toUpperCase())}`);
      if (vuln.cvss) console.log(`  ${chalk.white.bold("CVSS:")}      ${vuln.cvss}`);
      console.log(`  ${chalk.white.bold("Title:")}     ${vuln.title}`);
      if (vuln.cwe?.length) console.log(`  ${chalk.white.bold("CWE:")}       ${vuln.cwe.join(", ")}`);
      if (vuln.fixedIn) console.log(`  ${chalk.white.bold("Fixed In:")}  ${chalk.green(vuln.fixedIn)}`);
      if (vuln.url) console.log(`  ${chalk.white.bold("Reference:")} ${chalk.cyan(vuln.url)}`);
      console.log(`\n  ${chalk.dim(vuln.description.slice(0, 300))}${vuln.description.length > 300 ? "..." : ""}\n`);
    } catch (err) {
      spinner.fail("Lookup failed");
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\n  ✗ ${message}\n`));
    }
  });

program.parse();

export { scan } from "./scanner.js";
export { toJSON, toMarkdown, toHTML, toSARIF } from "./reporter.js";
export { lookupCVE, queryOSV, batchQueryOSV } from "./cve.js";
export type { ScanResult, ScanOptions, Vulnerability, DependencyInfo } from "./types.js";