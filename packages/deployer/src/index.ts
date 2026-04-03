#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { resolve } from "path";
import { writeFileSync } from "fs";
import { detectProject, getRecommendedProvider } from "./detector.js";
import { generateDockerfile, generateDockerCompose, optimizeBuild, writeGeneratedFiles } from "./builder.js";
import { generateIaC, writeIaCFiles } from "./iac.js";
import { generatePipeline, writePipelineFiles } from "./pipeline.js";
import { rollback, getDeployHistory, recordDeployment } from "./rollback.js";
import { checkHealth, formatHealthReport } from "./health.js";
import type { DeployProvider, IaCProvider, CIProvider, DeployStage, IaCFeature, PipelineFeature } from "./types.js";

const VERSION = "0.1.0";
const ACCENT = "#f97316";

const program = new Command();

program
  .name("nxf-deploy")
  .description("NexusForge Smart Deployer — Multi-cloud deployment, IaC generation, CI/CD pipelines")
  .version(VERSION);

program
  .command("detect")
  .description("Detect project type, runtime, and configuration")
  .option("-p, --path <path>", "Project path", process.cwd())
  .action((options) => {
    console.log(chalk.hex(ACCENT).bold("\n🚀 NexusForge Smart Deployer\n"));

    const spinner = ora("Detecting project...").start();
    const config = detectProject(resolve(options.path));
    spinner.succeed("Project detected");

    console.log();
    console.log(chalk.white.bold("  📦 Project Configuration"));
    console.log(chalk.dim("  ─────────────────────────────────────"));
    console.log(`  Type:           ${chalk.cyan(config.type)}`);
    console.log(`  Framework:      ${chalk.cyan(config.framework)}`);
    console.log(`  Runtime:        ${chalk.cyan(config.runtime)} ${chalk.dim(config.runtimeVersion)}`);
    console.log(`  Package Manager:${chalk.cyan(" " + config.packageManager)}`);
    console.log(`  Build Command:  ${chalk.dim(config.buildCommand)}`);
    console.log(`  Start Command:  ${chalk.dim(config.startCommand)}`);
    console.log(`  Output Dir:     ${chalk.dim(config.outputDir)}`);
    console.log(`  Port:           ${chalk.yellow(config.port.toString())}`);
    console.log(`  Has Database:   ${config.hasDatabase ? chalk.green("Yes") : chalk.dim("No")}`);
    console.log(`  Has Docker:     ${config.hasDocker ? chalk.green("Yes") : chalk.dim("No")}`);
    console.log(`  Has CI/CD:      ${config.hasCICD ? chalk.green("Yes") : chalk.dim("No")}`);
    console.log();

    const recommended = getRecommendedProvider(config);
    console.log(`  💡 Recommended: ${chalk.green.bold(recommended)}`);

    if (config.envVars.length > 0) {
      console.log();
      console.log(chalk.white.bold("  🔐 Environment Variables"));
      for (const env of config.envVars) {
        console.log(`  · ${chalk.dim(env)}`);
      }
    }

    console.log();
  });

program
  .command("docker")
  .description("Generate Dockerfile and Docker Compose")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("-o, --output <dir>", "Output directory", ".")
  .option("--compose", "Also generate docker-compose.yml", false)
  .action((options) => {
    console.log(chalk.hex(ACCENT).bold("\n🐳 NexusForge Docker Generator\n"));

    const spinner = ora("Generating Docker configuration...").start();
    const config = detectProject(resolve(options.path));

    const files = [];
    const dockerfile = generateDockerfile(config, resolve(options.path));
    files.push(dockerfile);

    if (options.compose) {
      const compose = generateDockerCompose(config);
      files.push(compose);
    }

    writeGeneratedFiles(files, resolve(options.output));
    spinner.succeed(`Generated ${files.length} files`);

    console.log();
    for (const file of files) {
      console.log(`  ✓ ${chalk.green(file.path)} — ${chalk.dim(file.description)}`);
    }

    const { optimizations, savings } = optimizeBuild(config, resolve(options.path));
    if (optimizations.length > 0) {
      console.log();
      console.log(chalk.white.bold("  ⚡ Optimizations Applied"));
      for (const opt of optimizations) {
        console.log(`  · ${chalk.dim(opt)}`);
      }
      console.log(`  · Estimated: ${chalk.green(savings)}`);
    }

    console.log();
  });

program
  .command("iac")
  .description("Generate Infrastructure-as-Code files")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("--provider <provider>", "IaC provider (terraform, pulumi, docker-compose, kubernetes)", "terraform")
  .option("--cloud <cloud>", "Cloud provider (aws, gcp, docker)", "aws")
  .option("--stage <stage>", "Deployment stage", "production")
  .option("--features <list>", "Comma-separated features", "compute,networking")
  .option("-o, --output <dir>", "Output directory", ".")
  .action((options) => {
    console.log(chalk.hex(ACCENT).bold("\n🏗️  NexusForge IaC Generator\n"));

    const spinner = ora(`Generating ${options.provider} configuration...`).start();
    const config = detectProject(resolve(options.path));
    const features = options.features.split(",").map((f: string) => f.trim()) as IaCFeature[];

    const result = generateIaC({
      provider: options.provider as IaCProvider,
      cloudProvider: options.cloud as DeployProvider,
      project: config,
      stage: options.stage as DeployStage,
      features,
      outputDir: resolve(options.output),
    });

    writeIaCFiles(result, resolve(options.output));
    spinner.succeed(`Generated ${result.files.length} IaC files`);

    console.log();
    for (const file of result.files) {
      console.log(`  ✓ ${chalk.green(file.path)} — ${chalk.dim(file.description)}`);
    }

    console.log();
    console.log(chalk.white.bold("  📋 Apply Commands"));
    console.log(chalk.dim("  ─────────────────────────────────────"));
    for (const cmd of result.commands) {
      console.log(`  $ ${chalk.cyan(cmd)}`);
    }
    console.log();
  });

program
  .command("pipeline")
  .description("Generate CI/CD pipeline configuration")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("--ci <provider>", "CI provider (github-actions, gitlab-ci, jenkins, circleci)", "github-actions")
  .option("--features <list>", "Comma-separated features", "lint,test,build")
  .option("-o, --output <dir>", "Output directory", ".")
  .action((options) => {
    console.log(chalk.hex(ACCENT).bold("\n⚙️  NexusForge Pipeline Generator\n"));

    const spinner = ora(`Generating ${options.ci} pipeline...`).start();
    const config = detectProject(resolve(options.path));
    const features = options.features.split(",").map((f: string) => f.trim()) as PipelineFeature[];

    const result = generatePipeline({
      ciProvider: options.ci as CIProvider,
      project: config,
      stages: ["dev", "staging", "production"],
      features,
      outputDir: resolve(options.output),
    });

    writePipelineFiles(result, resolve(options.output));
    spinner.succeed(`Generated ${result.files.length} pipeline files`);

    console.log();
    for (const file of result.files) {
      console.log(`  ✓ ${chalk.green(file.path)} — ${chalk.dim(file.description)}`);
    }
    console.log();
  });

program
  .command("health")
  .description("Check health of a deployed application")
  .argument("<url>", "URL to check")
  .action(async (url: string) => {
    console.log(chalk.hex(ACCENT).bold("\n🏥 NexusForge Health Check\n"));

    const spinner = ora(`Checking ${url}...`).start();

    try {
      const result = await checkHealth(url);
      spinner.stop();
      console.log(formatHealthReport(result));
      console.log();
    } catch (err) {
      spinner.fail("Health check failed");
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\n  ✗ ${message}\n`));
    }
  });

program
  .command("history")
  .description("View deployment history")
  .option("-p, --path <path>", "Project path", process.cwd())
  .option("--stage <stage>", "Filter by stage")
  .action((options) => {
    console.log(chalk.hex(ACCENT).bold("\n📜 Deployment History\n"));

    const history = getDeployHistory(resolve(options.path), options.stage);

    if (history.length === 0) {
      console.log(chalk.dim("  No deployments recorded yet.\n"));
      return;
    }

    for (const entry of history.slice(-10).reverse()) {
      const statusColor =
        entry.status === "active" ? chalk.green :
        entry.status === "rolled-back" ? chalk.red : chalk.dim;

      console.log(`  ${statusColor("●")} ${chalk.bold(entry.version)}`);
      console.log(`    Stage: ${entry.stage} | Provider: ${entry.provider}`);
      console.log(`    Time: ${chalk.dim(entry.timestamp)}`);
      console.log(`    URL: ${chalk.cyan(entry.url)}`);
      console.log(`    Status: ${statusColor(entry.status)}`);
      console.log();
    }
  });

program.parse();

export { detectProject, getRecommendedProvider } from "./detector.js";
export { generateDockerfile, generateDockerCompose, optimizeBuild, writeGeneratedFiles } from "./builder.js";
export { generateIaC, writeIaCFiles } from "./iac.js";
export { generatePipeline, writePipelineFiles } from "./pipeline.js";
export { rollback, getDeployHistory, recordDeployment, getActiveDeployment } from "./rollback.js";
export { checkHealth, formatHealthReport } from "./health.js";
export type {
  DeployProvider, ProjectType, Runtime, IaCProvider, CIProvider, DeployStage,
  ProjectConfig, DeployConfig, DeployResult,
  IaCConfig, IaCFeature, IaCResult, GeneratedFile,
  PipelineConfig, PipelineFeature, PipelineResult,
  RollbackEntry, HealthCheck, HealthCheckItem,
} from "./types.js";
