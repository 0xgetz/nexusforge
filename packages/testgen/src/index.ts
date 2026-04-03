#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { resolve } from "path";
import { writeFileSync } from "fs";
import { generateTests, formatTestOutput } from "./generator.js";
import { analyzeCoverage } from "./coverage.js";
import { mutationTest, getMutatorDescriptions } from "./mutator.js";
import { detectFramework, FRAMEWORK_CONFIGS } from "./frameworks.js";
import type { TestFramework, MutatorType } from "./types.js";

const VERSION = "0.1.0";
const ACCENT = "#6366f1";

const program = new Command();

program
  .name("nxf-test")
  .description("NexusForge AI Test Generator — Smart test generation, coverage analysis, mutation testing")
  .version(VERSION);

program
  .command("generate")
  .description("Generate tests for source files")
  .option("-f, --file <file>", "Generate tests for a single file")
  .option("-p, --path <path>", "Generate tests for all files in path", process.cwd())
  .option("--framework <framework>", "Test framework (jest, vitest, mocha, pytest, go-test, cargo-test, junit)")
  .option("--style <style>", "Test style (describe-it, test-block, class-based, function-based)", "describe-it")
  .option("--edge-cases", "Include edge case tests", true)
  .option("--mocks", "Include mock generation", false)
  .option("--max <n>", "Max tests per function", "10")
  .option("-o, --output <dir>", "Output directory for generated tests")
  .option("--interactive", "Review and approve tests interactively", false)
  .action(async (options) => {
    console.log(chalk.hex(ACCENT).bold("\n⚡ NexusForge AI Test Generator\n"));

    const spinner = ora("Analyzing source code...").start();

    try {
      const framework = (options.framework as TestFramework) || detectFramework(options.path);
      const config = FRAMEWORK_CONFIGS[framework];

      spinner.text = `Generating ${config.displayName} tests...`;

      const result = await generateTests({
        file: options.file,
        path: options.path,
        framework,
        style: options.style,
        includeEdgeCases: options.edgeCases,
        includeMocks: options.mocks,
        maxTestsPerFunction: parseInt(options.max, 10),
        outputDir: options.output,
      });

      spinner.succeed(`Generated ${result.testsGenerated.length} tests in ${result.duration}ms`);

      console.log();
      console.log(chalk.white.bold("  📊 Generation Summary"));
      console.log(chalk.dim("  ─────────────────────────────────────"));
      console.log(`  Files analyzed:     ${chalk.cyan(result.filesAnalyzed.toString())}`);
      console.log(`  Functions found:    ${chalk.cyan(result.functionsFound.toString())}`);
      console.log(`  Tests generated:    ${chalk.green.bold(result.testsGenerated.length.toString())}`);
      console.log(`  Framework:          ${chalk.yellow(config.displayName)}`);
      console.log(`  Duration:           ${chalk.dim(`${result.duration}ms`)}`);
      console.log();

      const typeCount: Record<string, number> = {};
      for (const test of result.testsGenerated) {
        typeCount[test.type] = (typeCount[test.type] || 0) + 1;
      }

      console.log(chalk.white.bold("  📋 Test Breakdown"));
      console.log(chalk.dim("  ─────────────────────────────────────"));
      for (const [type, count] of Object.entries(typeCount)) {
        const icon =
          type === "unit" ? "🔹" :
          type === "edge-case" ? "🔸" :
          type === "error-case" ? "🔴" :
          type === "boundary" ? "🔶" : "🔹";
        console.log(`  ${icon} ${type}: ${chalk.bold(count.toString())}`);
      }
      console.log();

      if (result.outputFiles.length > 0) {
        console.log(chalk.green.bold("  📁 Output Files"));
        console.log(chalk.dim("  ─────────────────────────────────────"));
        for (const file of result.outputFiles) {
          console.log(`  ✓ ${chalk.dim(file)}`);
        }
        console.log();
      }

      if (!options.output) {
        console.log(chalk.dim("  💡 Use --output <dir> to save generated tests to files\n"));
      }
    } catch (err) {
      spinner.fail("Test generation failed");
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\n  ✗ ${message}\n`));
      process.exit(1);
    }
  });

program
  .command("coverage")
  .description("Analyze test coverage and find gaps")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("-t, --tests <path>", "Tests directory")
  .option("--threshold <n>", "Coverage threshold percentage", "85")
  .option("-o, --output <file>", "Save coverage report to file")
  .action(async (options) => {
    console.log(chalk.hex(ACCENT).bold("\n⚡ NexusForge Coverage Analyzer\n"));

    const spinner = ora("Analyzing coverage...").start();

    try {
      const result = await analyzeCoverage({
        path: resolve(options.path),
        testsPath: options.tests,
        threshold: parseInt(options.threshold, 10),
      });

      spinner.succeed("Coverage analysis complete");

      console.log();
      console.log(chalk.white.bold("  📊 Coverage Report"));
      console.log(chalk.dim("  ─────────────────────────────────────"));

      const colorize = (val: number) =>
        val >= 80 ? chalk.green :
        val >= 60 ? chalk.yellow :
        val >= 40 ? chalk.hex("#f97316") : chalk.red;

      console.log(`  Overall:     ${colorize(result.overall)(result.overall.toFixed(1) + "%")}`);
      console.log(`  Statements:  ${colorize(result.statements)(result.statements.toFixed(1) + "%")}`);
      console.log(`  Branches:    ${colorize(result.branches)(result.branches.toFixed(1) + "%")}${result.branches < 50 ? chalk.red(" ← LOW") : ""}`);
      console.log(`  Functions:   ${colorize(result.functions)(result.functions.toFixed(1) + "%")}`);
      console.log(`  Lines:       ${colorize(result.lines)(result.lines.toFixed(1) + "%")}`);
      console.log();

      if (result.uncoveredFiles.length > 0) {
        console.log(chalk.white.bold("  ⚠️  Uncovered Files"));
        console.log(chalk.dim("  ─────────────────────────────────────"));
        for (const file of result.uncoveredFiles.slice(0, 10)) {
          const prioColor =
            file.priority === "critical" ? chalk.red :
            file.priority === "high" ? chalk.hex("#f97316") :
            file.priority === "medium" ? chalk.yellow : chalk.dim;

          console.log(`  ${prioColor("✗")} ${chalk.dim(file.file)}`);
          console.log(`    Coverage: ${colorize(file.coverage)(file.coverage + "%")} · Priority: ${prioColor(file.priority.toUpperCase())}`);
          if (file.uncoveredFunctions.length > 0) {
            console.log(`    Functions: ${chalk.dim(file.uncoveredFunctions.slice(0, 5).join(", "))}`);
          }
        }
        console.log();
      }

      console.log(chalk.white.bold("  💡 Recommendation"));
      console.log(chalk.dim("  ─────────────────────────────────────"));
      console.log(`  ${result.recommendation}`);
      if (result.testsNeeded > 0) {
        console.log(`  ${chalk.cyan(`→ Run: nxf-test fill --target ${options.threshold} to auto-generate missing tests`)}`);
      }
      console.log();

      if (options.output) {
        writeFileSync(options.output, JSON.stringify(result, null, 2), "utf-8");
        console.log(chalk.green(`  ✓ Report saved to ${options.output}\n`));
      }
    } catch (err) {
      spinner.fail("Coverage analysis failed");
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\n  ✗ ${message}\n`));
      process.exit(1);
    }
  });

program
  .command("mutate")
  .description("Run mutation testing to evaluate test quality")
  .option("-p, --path <path>", "Source path", process.cwd())
  .option("-t, --tests <path>", "Tests directory", "./tests")
  .option("--mutators <list>", "Comma-separated mutator types", "arithmetic,conditional,boundary")
  .option("--max <n>", "Maximum mutations to test", "100")
  .option("-o, --output <file>", "Save mutation report to file")
  .action(async (options) => {
    console.log(chalk.hex(ACCENT).bold("\n⚡ NexusForge Mutation Tester\n"));

    const spinner = ora("Running mutation tests...").start();

    try {
      const mutators = options.mutators.split(",").map((m: string) => m.trim()) as MutatorType[];

      const result = await mutationTest({
        path: resolve(options.path),
        testsPath: resolve(options.tests),
        mutators,
        maxMutants: parseInt(options.max, 10),
      });

      const scoreColor =
        result.mutationScore >= 80 ? chalk.green :
        result.mutationScore >= 60 ? chalk.yellow :
        result.mutationScore >= 40 ? chalk.hex("#f97316") : chalk.red;

      spinner.succeed(`Mutation testing complete in ${result.duration}ms`);

      console.log();
      console.log(chalk.white.bold("  🧬 Mutation Report"));
      console.log(chalk.dim("  ─────────────────────────────────────"));
      console.log(`  Mutation Score:   ${scoreColor.bold(result.mutationScore.toFixed(1) + "%")}`);
      console.log(`  Total Mutants:    ${chalk.cyan(result.totalMutants.toString())}`);
      console.log(`  Killed:           ${chalk.green(result.killed.toString())}`);
      console.log(`  Survived:         ${result.survived > 0 ? chalk.red(result.survived.toString()) : chalk.green("0")}`);
      console.log();

      if (result.survivingMutants.length > 0) {
        console.log(chalk.white.bold("  🪲 Surviving Mutants (test gaps)"));
        console.log(chalk.dim("  ─────────────────────────────────────"));

        for (const mutant of result.survivingMutants.slice(0, 15)) {
          const mutColor =
            mutant.mutator === "conditional" ? chalk.red :
            mutant.mutator === "arithmetic" ? chalk.hex("#f97316") :
            mutant.mutator === "boundary" ? chalk.yellow : chalk.dim;

          console.log(`  ${mutColor("✗")} ${chalk.dim(`L${mutant.line}`)} ${mutant.description}`);
          console.log(`    ${chalk.dim(mutant.file)}`);
          console.log(`    ${chalk.red("- " + mutant.original)}`);
          console.log(`    ${chalk.green("+ " + mutant.mutated)}`);
          console.log();
        }

        if (result.survivingMutants.length > 15) {
          console.log(chalk.dim(`  ... +${result.survivingMutants.length - 15} more surviving mutants\n`));
        }
      } else {
        console.log(chalk.green("  ✓ All mutations killed! Your tests are solid.\n"));
      }

      if (options.output) {
        writeFileSync(options.output, JSON.stringify(result, null, 2), "utf-8");
        console.log(chalk.green(`  ✓ Report saved to ${options.output}\n`));
      }
    } catch (err) {
      spinner.fail("Mutation testing failed");
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\n  ✗ ${message}\n`));
      process.exit(1);
    }
  });

program
  .command("fill")
  .description("Auto-generate tests to reach target coverage")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("--target <n>", "Target coverage percentage", "85")
  .option("-o, --output <dir>", "Output directory for generated tests", "./tests/generated")
  .option("--framework <framework>", "Test framework")
  .action(async (options) => {
    console.log(chalk.hex(ACCENT).bold("\n⚡ NexusForge Coverage Fill\n"));

    const spinner = ora("Analyzing coverage gaps...").start();

    try {
      const coverage = await analyzeCoverage({
        path: resolve(options.path),
        threshold: parseInt(options.target, 10),
      });

      if (coverage.testsNeeded === 0) {
        spinner.succeed(`Coverage already meets ${options.target}% target!`);
        return;
      }

      spinner.text = `Generating ${coverage.testsNeeded} tests for uncovered functions...`;

      const framework = options.framework || detectFramework(options.path);
      const uncoveredFunctions = coverage.gaps
        .filter((g) => g.type === "function")
        .map((g) => g.functionName);

      const result = await generateTests({
        path: resolve(options.path),
        framework,
        outputDir: resolve(options.output),
        includeEdgeCases: true,
        includeMocks: true,
      });

      spinner.succeed(`Generated ${result.testsGenerated.length} tests`);

      console.log();
      console.log(`  Coverage: ${chalk.red(coverage.overall.toFixed(1) + "%")} → ${chalk.green("~" + options.target + "%")} (estimated)`);
      console.log(`  Tests generated: ${chalk.cyan(result.testsGenerated.length.toString())}`);
      console.log(`  Output: ${chalk.dim(resolve(options.output))}`);
      console.log();

      if (result.outputFiles.length > 0) {
        console.log(chalk.white.bold("  📁 Generated Files"));
        for (const file of result.outputFiles) {
          console.log(`  ✓ ${chalk.dim(file)}`);
        }
        console.log();
      }
    } catch (err) {
      spinner.fail("Coverage fill failed");
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\n  ✗ ${message}\n`));
      process.exit(1);
    }
  });

program.parse();

export { generateTests, formatTestOutput, buildTestFileName } from "./generator.js";
export { analyzeCoverage } from "./coverage.js";
export { mutationTest, getMutatorDescriptions } from "./mutator.js";
export { detectFramework, getFrameworkConfig, FRAMEWORK_CONFIGS } from "./frameworks.js";
export { analyzeProject, analyzeFile, getProjectLanguage } from "./analyzer.js";
export type {
  TestCase,
  TestFramework,
  TestStyle,
  GenerateOptions,
  GenerateResult,
  CoverageResult,
  CoverageGap,
  UncoveredFile,
  MutationResult,
  SurvivingMutant,
  MutatorType,
  FunctionSignature,
  ParamInfo,
  FrameworkConfig,
} from "./types.js";