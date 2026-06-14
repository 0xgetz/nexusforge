#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { analyze, generateReport } from "./analyzer.js";
import { applyFixes, generatePatchContent } from "./fixer.js";
import { startMonitor } from "./monitor.js";
import { createFixPR } from "./pr.js";

const VERSION = "0.1.0";

const program = new Command();

program
  .name("nxf-heal")
  .description("NexusForge Self-Healing Engine — Bug detection, analysis, and auto-repair")
  .version(VERSION);

program
  .command("diagnose")
  .description("Scan project for bugs and code issues")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("-o, --output <file>", "Save report to file")
  .option("--fix", "Auto-fix issues where possible", false)
  .option("--ignore <dirs>", "Comma-separated directories to ignore", "")
  .action(async (options) => {
    console.log(chalk.hex("#10b981").bold("\n⚡ NexusForge Self-Healing Engine\n"));

    const spinner = ora("Analyzing project...").start();

    try {
      const ignore = options.ignore ? options.ignore.split(",").map((s: string) => s.trim()) : [];
      const result = await analyze(resolve(options.path), {
        fix: options.fix,
        ignore,
      });

      spinner.succeed(`Analyzed ${result.filesScanned} files in ${result.duration}ms`);

      const scoreColor =
        result.summary.healthScore >= 80 ? chalk.green :
        result.summary.healthScore >= 60 ? chalk.yellow :
        result.summary.healthScore >= 40 ? chalk.hex("#f97316") : chalk.red;

      console.log();
      console.log(chalk.white.bold("  Health Score: ") + scoreColor.bold(`${result.summary.healthScore}/100`));
      console.log();

      if (result.summary.critical > 0) console.log(chalk.red(`  🔴 Critical: ${result.summary.critical}`));
      if (result.summary.errors > 0) console.log(chalk.hex("#f97316")(`  🟠 Errors:   ${result.summary.errors}`));
      if (result.summary.warnings > 0) console.log(chalk.yellow(`  🟡 Warnings: ${result.summary.warnings}`));
      if (result.summary.infos > 0) console.log(chalk.blue(`  🔵 Info:     ${result.summary.infos}`));
      if (result.summary.autoFixable > 0) {
        console.log(chalk.cyan(`  🔧 Fixable:  ${result.summary.autoFixable}`));
      }
      console.log();

      if (result.bugs.length > 0) {
        const grouped: Record<string, typeof result.bugs> = {};
        for (const bug of result.bugs) {
          if (!grouped[bug.file]) grouped[bug.file] = [];
          grouped[bug.file].push(bug);
        }

        for (const [file, bugs] of Object.entries(grouped)) {
          console.log(chalk.white.bold(`  📄 ${file}`));
          for (const bug of bugs.slice(0, 5)) {
            const sevColor =
              bug.severity === "critical" ? chalk.red :
              bug.severity === "error" ? chalk.hex("#f97316") :
              bug.severity === "warning" ? chalk.yellow : chalk.blue;

            console.log(`    ${sevColor(`[${bug.severity.toUpperCase()}]`)} ${chalk.dim(`L${bug.line}`)} ${bug.message}`);
            if (bug.suggestion) console.log(`      ${chalk.dim(`→ ${bug.suggestion}`)}`);
          }
          if (bugs.length > 5) {
            console.log(chalk.dim(`      ... +${bugs.length - 5} more`));
          }
          console.log();
        }
      } else {
        console.log(chalk.green("  ✓ No issues detected!\n"));
      }

      if (options.fix && result.fixes.length > 0) {
        const applied = applyFixes(result.fixes, resolve(options.path));
        console.log(chalk.green(`  🔧 Applied ${applied} auto-fixes\n`));
      }

      if (options.output) {
        const report = generateReport(result);
        writeFileSync(options.output, report, "utf-8");
        console.log(chalk.green(`  ✓ Report saved to ${options.output}\n`));
      }
    } catch (err) {
      spinner.fail("Analysis failed");
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\n  ✗ ${message}\n`));
      process.exit(1);
    }
  });

program
  .command("watch")
  .description("Monitor project for real-time bug detection")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("--ignore <dirs>", "Comma-separated directories to ignore", "")
  .action((options) => {
    const ignore = options.ignore ? options.ignore.split(",").map((s: string) => s.trim()) : [];
    const monitor = startMonitor(resolve(options.path), { ignore });

    process.on("SIGINT", () => {
      monitor.stop();
      process.exit(0);
    });
  });

program
  .command("patch")
  .description("Generate a patch file with all auto-fixes")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("-o, --output <file>", "Patch output file", "nexusforge-fixes.patch")
  .action(async (options) => {
    const spinner = ora("Generating patch...").start();

    try {
      const result = await analyze(resolve(options.path), { fix: true });

      if (result.fixes.length === 0) {
        spinner.info("No auto-fixable issues found");
        return;
      }

      const patch = generatePatchContent(result.fixes);
      writeFileSync(options.output, patch, "utf-8");

      spinner.succeed(`Generated patch with ${result.fixes.length} fixes`);
      console.log(chalk.green(`\n  ✓ Patch saved to ${options.output}`));
      console.log(chalk.dim(`    Apply with: git apply ${options.output}\n`));
    } catch (err) {
      spinner.fail("Patch generation failed");
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\n  ✗ ${message}\n`));
    }
  });

program
  .command("pr")
  .description("Scan, auto-fix, and open a GitHub pull request with the fixes")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("-b, --base <branch>", "Base branch for the PR (default: current branch)")
  .option("--branch <name>", "Name for the fix branch")
  .option("--token <token>", "GitHub token (or set GITHUB_TOKEN)")
  .option("--ignore <dirs>", "Comma-separated directories to ignore", "")
  .option("--draft", "Open the PR as a draft", false)
  .option("--dry-run", "Apply + commit on a branch but do not push or open a PR", false)
  .action(async (options) => {
    console.log(chalk.hex("#10b981").bold("\n\u26a1 NexusForge Self-Healing \u2014 Auto-Fix PR\n"));
    const token = options.token || process.env.GITHUB_TOKEN;
    if (!token && !options.dryRun) {
      console.log(chalk.red("  \u2717 No GitHub token. Pass --token or set GITHUB_TOKEN (or use --dry-run).\n"));
      process.exit(1);
    }

    const spinner = ora("Scanning, fixing, and preparing a PR...").start();
    try {
      const ignore = options.ignore ? options.ignore.split(",").map((s: string) => s.trim()) : [];
      const r = await createFixPR({
        path: resolve(options.path),
        token,
        base: options.base,
        branch: options.branch,
        ignore,
        draft: options.draft,
        dryRun: options.dryRun,
      });

      if (r.applied === 0) {
        spinner.info("No auto-fixable issues found \u2014 nothing to open a PR for.");
        return;
      }

      if (r.dryRun) {
        spinner.succeed(`Applied ${r.applied} fixes and committed to ${r.branch} (dry run \u2014 not pushed)`);
        console.log(chalk.dim(`\n  Push it yourself with: git push -u origin ${r.branch}\n`));
        return;
      }

      spinner.succeed(`Opened PR #${r.prNumber} with ${r.applied} fixes (${r.branch} \u2192 ${r.base})`);
      console.log(chalk.green(`\n  \u2713 ${r.prUrl}\n`));
    } catch (err) {
      spinner.fail("Auto-fix PR failed");
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\n  \u2717 ${message}\n`));
      process.exit(1);
    }
  });


program.parse();

export { analyze, generateReport } from "./analyzer.js";
export { detectBugs, scanDirectory } from "./detector.js";
export { generateFixes, applyFixes, generatePatchContent } from "./fixer.js";
export { startMonitor } from "./monitor.js";
export { createFixPR, parseGitHubRemote, buildBranchName, buildPRBody } from "./pr.js";
export type { CreateFixPROptions, CreateFixPRResult } from "./pr.js";
export type { Bug, Fix, AnalysisResult, HealerOptions } from "./types.js";