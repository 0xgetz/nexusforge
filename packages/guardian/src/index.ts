#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { resolve } from "path";
import { writeFileSync } from "fs";
import { reviewProject } from "./reviewer.js";
import { analyzeMetrics } from "./metrics.js";
import { analyzeArchitecture } from "./architecture.js";
import { generateDocs, formatDocs } from "./docs.js";
import { generateChangelog } from "./changelog.js";
import { getAllRules, filterRules } from "./rules.js";
import type { MetricGrade, ReviewSeverity, ReviewCategory } from "./types.js";

const VERSION = "0.1.0";
const ACCENT = "#8b5cf6";

const program = new Command();

program
  .name("nxf-guard")
  .description("NexusForge Code Guardian — AI code review, quality metrics, architecture analysis")
  .version(VERSION);

program
  .command("review")
  .description("Run AI-powered code review")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("-o, --output <file>", "Save review report")
  .action(async (options) => {
    console.log(chalk.hex(ACCENT).bold("\n🛡️  NexusForge Code Guardian\n"));
    const spinner = ora("Reviewing code...").start();

    try {
      const result = await reviewProject(resolve(options.path));
      const gradeColor = getGradeColor(result.grade);

      spinner.succeed(`Reviewed ${result.filesReviewed} files in ${result.duration}ms`);

      console.log();
      console.log(chalk.white.bold("  📊 Code Review Report"));
      console.log(chalk.dim("  ─────────────────────────────────────"));
      console.log(`  Score:        ${gradeColor.bold(result.score + "/100")} (${gradeColor(result.grade)})`);
      console.log(`  Files:        ${chalk.cyan(result.filesReviewed.toString())}`);
      console.log(`  Issues:       ${result.issuesFound.length > 0 ? chalk.yellow(result.issuesFound.length.toString()) : chalk.green("0")}`);
      console.log();

      if (result.summary.critical > 0) console.log(chalk.red(`  🔴 Critical:    ${result.summary.critical}`));
      if (result.summary.major > 0) console.log(chalk.hex("#f97316")(`  🟠 Major:       ${result.summary.major}`));
      if (result.summary.minor > 0) console.log(chalk.yellow(`  🟡 Minor:       ${result.summary.minor}`));
      if (result.summary.suggestions > 0) console.log(chalk.blue(`  🔵 Suggestions: ${result.summary.suggestions}`));
      console.log();

      for (const issue of result.issuesFound.slice(0, 15)) {
        const sevColor = issue.severity === "critical" ? chalk.red :
          issue.severity === "major" ? chalk.hex("#f97316") :
          issue.severity === "minor" ? chalk.yellow : chalk.blue;

        console.log(`  ${sevColor(`[${issue.severity.toUpperCase()}]`)} ${chalk.dim(issue.file + ":" + issue.line)}`);
        console.log(`    ${issue.message}`);
        if (issue.suggestion) console.log(`    ${chalk.dim("→ " + issue.suggestion)}`);
        console.log();
      }

      if (result.issuesFound.length > 15) {
        console.log(chalk.dim(`  ... +${result.issuesFound.length - 15} more issues\n`));
      }

      if (options.output) {
        writeFileSync(options.output, JSON.stringify(result, null, 2), "utf-8");
        console.log(chalk.green(`  ✓ Report saved to ${options.output}\n`));
      }
    } catch (err) {
      spinner.fail("Review failed");
      console.log(chalk.red(`\n  ✗ ${err instanceof Error ? err.message : err}\n`));
      process.exit(1);
    }
  });

program
  .command("metrics")
  .description("Analyze code quality metrics")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("-o, --output <file>", "Save metrics report")
  .action(async (options) => {
    console.log(chalk.hex(ACCENT).bold("\n📊 NexusForge Quality Metrics\n"));
    const spinner = ora("Analyzing metrics...").start();

    try {
      const m = await analyzeMetrics(resolve(options.path));
      const gradeColor = getGradeColor(m.grade);
      spinner.succeed("Metrics analysis complete");

      console.log();
      console.log(chalk.white.bold("  Maintainability Index"));
      console.log(chalk.dim("  ─────────────────────────────────────"));
      console.log(`  Score:  ${gradeColor.bold(m.maintainabilityIndex + "/100")} (${gradeColor(m.grade)})`);
      console.log();

      console.log(chalk.white.bold("  Lines of Code"));
      console.log(`  Total:    ${chalk.cyan(m.linesOfCode.total.toString())}`);
      console.log(`  Source:   ${chalk.cyan(m.linesOfCode.source.toString())}`);
      console.log(`  Comments: ${chalk.dim(m.linesOfCode.comments.toString())}`);
      console.log(`  Blank:    ${chalk.dim(m.linesOfCode.blank.toString())}`);
      console.log();

      console.log(chalk.white.bold("  Complexity"));
      console.log(`  Average:  ${chalk.cyan(m.complexity.average.toString())}`);
      console.log(`  Max:      ${m.complexity.max > 15 ? chalk.red(m.complexity.max.toString()) : chalk.cyan(m.complexity.max.toString())}`);
      console.log(`  Hotspots: ${chalk.yellow(m.complexity.hotspots.length.toString())}`);
      console.log();

      console.log(chalk.white.bold("  Duplication"));
      const dupColor = m.codeDuplication.percentage > 10 ? chalk.red : m.codeDuplication.percentage > 5 ? chalk.yellow : chalk.green;
      console.log(`  Rate:     ${dupColor(m.codeDuplication.percentage + "%")}`);
      console.log(`  Lines:    ${chalk.dim(m.codeDuplication.totalDuplicatedLines.toString())}`);
      console.log();

      console.log(chalk.white.bold("  Technical Debt"));
      const debtColor = getGradeColor(m.technicalDebt.rating);
      console.log(`  Hours:    ${debtColor(m.technicalDebt.totalHours + "h")}`);
      console.log(`  Rating:   ${debtColor(m.technicalDebt.rating)}`);
      console.log();

      if (options.output) {
        writeFileSync(options.output, JSON.stringify(m, null, 2), "utf-8");
        console.log(chalk.green(`  ✓ Report saved to ${options.output}\n`));
      }
    } catch (err) {
      spinner.fail("Metrics analysis failed");
      console.log(chalk.red(`\n  ✗ ${err instanceof Error ? err.message : err}\n`));
      process.exit(1);
    }
  });

program
  .command("arch")
  .description("Analyze project architecture")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("-o, --output <file>", "Save architecture report")
  .action(async (options) => {
    console.log(chalk.hex(ACCENT).bold("\n🏛️  NexusForge Architecture Analysis\n"));
    const spinner = ora("Analyzing architecture...").start();

    try {
      const result = await analyzeArchitecture(resolve(options.path));
      spinner.succeed("Architecture analysis complete");

      console.log();
      console.log(chalk.white.bold("  📦 Modules"));
      console.log(chalk.dim("  ─────────────────────────────────────"));
      for (const mod of result.modules) {
        console.log(`  · ${chalk.cyan(mod.name)} — ${mod.files} files, ${mod.lines} lines`);
      }
      console.log();

      if (result.circularDeps.length > 0) {
        console.log(chalk.red.bold("  ⚠️  Circular Dependencies"));
        for (const cd of result.circularDeps) {
          console.log(`  ${chalk.red("✗")} ${cd.cycle.join(" → ")}`);
        }
        console.log();
      } else {
        console.log(chalk.green("  ✓ No circular dependencies\n"));
      }

      if (result.layerViolations.length > 0) {
        console.log(chalk.yellow.bold("  ⚠️  Layer Violations"));
        for (const v of result.layerViolations) {
          console.log(`  ${chalk.yellow("!")} ${v.message}`);
        }
        console.log();
      }

      if (result.coupling.length > 0) {
        console.log(chalk.white.bold("  📈 Coupling Metrics"));
        for (const c of result.coupling) {
          console.log(`  · ${chalk.cyan(c.module)} — I: ${c.instability} A: ${c.abstractness}`);
        }
        console.log();
      }

      if (options.output) {
        writeFileSync(options.output, JSON.stringify(result, null, 2), "utf-8");
        console.log(chalk.green(`  ✓ Report saved to ${options.output}\n`));
      }
    } catch (err) {
      spinner.fail("Architecture analysis failed");
      console.log(chalk.red(`\n  ✗ ${err instanceof Error ? err.message : err}\n`));
    }
  });

program
  .command("docs")
  .description("Generate API documentation")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("-o, --output <file>", "Output file", "API_DOCS.md")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    console.log(chalk.hex(ACCENT).bold("\n📝 NexusForge Doc Generator\n"));
    const spinner = ora("Generating documentation...").start();

    try {
      const entries = await generateDocs(resolve(options.path));
      const exported = entries.filter((e) => e.isExported);
      const documented = exported.filter((e) => e.description && !e.description.startsWith("Function ") && !e.description.startsWith("Arrow function ") && !e.description.startsWith("Interface ") && !e.description.startsWith("Type alias ") && !e.description.startsWith("Class "));
      const undocumented = exported.length - documented.length;
      const coveragePercent = exported.length > 0 ? Math.round((documented.length / exported.length) * 100) : 100;
      const markdown = formatDocs(entries);

      spinner.succeed(`Generated docs for ${exported.length} exports`);

      if (options.json) {
        console.log(JSON.stringify({ entries, stats: { totalExports: exported.length, documented: documented.length, undocumented, coveragePercent } }, null, 2));
        return;
      }

      console.log();
      console.log(`  Total exports:  ${exported.length}`);
      console.log(`  Documented:     ${chalk.green(String(documented.length))}`);
      console.log(`  Undocumented:   ${chalk.yellow(String(undocumented))}`);
      console.log(`  Coverage:       ${coveragePercent}%`);
      console.log();

      if (options.output) {
        writeFileSync(resolve(options.output), markdown, "utf-8");
        console.log(chalk.green(`  ✓ Saved to ${options.output}\n`));
      }
    } catch (err) {
      spinner.fail("Documentation generation failed");
      console.log(chalk.red(`\n  ✗ ${err instanceof Error ? err.message : err}\n`));
    }
  });

program
  .command("changelog")
  .description("Generate changelog from git history")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("-o, --output <file>", "Output file", "CHANGELOG.md")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    console.log(chalk.hex(ACCENT).bold("\n📋 NexusForge Changelog Generator\n"));
    const spinner = ora("Generating changelog...").start();

    try {
      const result = await generateChangelog(resolve(options.path));
      spinner.succeed(`Found ${result.entries.length} version(s)`);

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      if (options.output) {
        writeFileSync(resolve(options.output), result.markdown, "utf-8");
        console.log(chalk.green(`\n  ✓ Changelog written to ${options.output}\n`));
      } else {
        console.log(result.markdown);
      }
    } catch (err) {
      spinner.fail("Changelog generation failed");
      console.log(chalk.red(`\n  ✗ ${err instanceof Error ? err.message : err}\n`));
    }
  });

program
  .command("rules")
  .description("List all available review rules")
  .option("--severity <level>", "Filter by severity")
  .option("--category <cat>", "Filter by category")
  .option("--json", "Output as JSON")
  .action((options) => {
    let rules = getAllRules();

    rules = filterRules(rules, {
      severity: options.severity as ReviewSeverity | undefined,
      category: options.category as ReviewCategory | undefined,
    });

    if (options.json) {
      console.log(JSON.stringify(rules, null, 2));
      return;
    }

    console.log(chalk.hex(ACCENT).bold(`\n📏 Guardian Rules (${rules.length})\n`));

    for (const rule of rules) {
      const sevColor = rule.severity === "critical" ? chalk.red :
        rule.severity === "major" ? chalk.hex("#f97316") :
        rule.severity === "minor" ? chalk.yellow : chalk.blue;

      console.log(`  ${sevColor(rule.id)} ${chalk.white.bold(rule.name)}`);
      console.log(`    ${chalk.dim(rule.description)}`);
      console.log(`    ${chalk.dim(`Category: ${rule.category} | Severity: ${rule.severity}`)}`);
      console.log();
    }
  });

program.parse();

function getGradeColor(grade: MetricGrade) {
  if (grade === "A") return chalk.green;
  if (grade === "B") return chalk.cyan;
  if (grade === "C") return chalk.yellow;
  if (grade === "D") return chalk.hex("#f97316");
  return chalk.red;
}

export { reviewProject } from "./reviewer.js";
export { analyzeMetrics } from "./metrics.js";
export { analyzeArchitecture } from "./architecture.js";
export { generateDocs, formatDocs } from "./docs.js";
export { generateChangelog } from "./changelog.js";
export { getAllRules, filterRules, getBuiltinRules, loadCustomRules } from "./rules.js";
export type {
  ReviewIssue, ReviewResult, ReviewSummary, ReviewSeverity, ReviewCategory,
  QualityMetrics, MetricGrade, TechnicalDebt, DebtItem,
  DuplicationReport, DuplicateBlock, ComplexityReport, ComplexityHotspot, LOCReport,
  ArchitectureAnalysis, ModuleInfo, DependencyEdge, CircularDependency, LayerViolation, CouplingMetric,
  DocEntry, ChangelogEntry, GuardianRule,
} from "./types.js";
