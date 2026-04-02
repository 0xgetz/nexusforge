#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { startChat } from "./chat.js";
import { getConfig, setConfig, setModelApiKey, addModel, listModels } from "./config.js";
import { scaffold, listTemplates, getTemplateNames } from "./scaffold.js";
import { scanProject } from "./context.js";
import type { ModelConfig } from "./config.js";

const VERSION = "0.1.0";

const LOGO = chalk.hex("#10b981")(`
  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
  ██║ ╚████║███████╗██╔╝ ╚██╗╚██████╔╝███████║
  ╚═╝  ╚═══╝╚══════╝╚═╝   ╚═╝ ╚═════╝ ╚══════╝
`) + chalk.hex("#a3e635")(`
  ███████╗ ██████╗ ██████╗  ██████╗ ███████╗
  ██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
  █████╗  ██║   ██║██████╔╝██║  ███╗█████╗
  ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝
  ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
  ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
`);

const program = new Command();

program
  .name("nexusforge")
  .description("NexusForge — AI-Powered Development Platform")
  .version(VERSION);

program
  .command("chat")
  .description("Start an interactive AI coding assistant session")
  .option("-d, --dir <path>", "Project directory for context", process.cwd())
  .action(async (options) => {
    await startChat({ projectDir: options.dir });
  });

program
  .command("init")
  .description("Scaffold a new project from templates")
  .argument("[name]", "Project name")
  .option("-t, --template <template>", "Template to use")
  .action(async (name, options) => {
    console.log(LOGO);

    const templates = listTemplates();

    let projectName = name;
    let templateName = options.template;

    if (!templateName) {
      const { selectedTemplate } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedTemplate",
          message: "Select a project template:",
          choices: templates.map((t) => ({
            name: `${chalk.white(t.name)} ${chalk.dim(`— ${t.description}`)}`,
            value: Object.keys(getTemplateNames()).find(
              (_, i) => templates[i].name === t.name
            ),
          })),
        },
      ]);
      templateName = getTemplateNames()[selectedTemplate] || getTemplateNames()[0];
    }

    if (!projectName) {
      const { inputName } = await inquirer.prompt([
        {
          type: "input",
          name: "inputName",
          message: "Project name:",
          default: "my-project",
          validate: (input: string) =>
            /^[a-z0-9-]+$/.test(input) || "Use lowercase letters, numbers, and hyphens only",
        },
      ]);
      projectName = inputName;
    }

    scaffold(templateName, projectName, process.cwd());
  });

program
  .command("scan")
  .description("Scan and analyze the current project")
  .option("-d, --dir <path>", "Project directory", process.cwd())
  .action((options) => {
    console.log(chalk.hex("#10b981").bold("\n⚡ NexusForge Project Scanner\n"));

    const ctx = scanProject(options.dir);

    console.log(chalk.white.bold("  Project Analysis"));
    console.log(chalk.dim("  ─────────────────────────"));
    console.log(`  ${chalk.dim("Root:")}       ${ctx.root}`);
    console.log(`  ${chalk.dim("Language:")}   ${chalk.cyan(ctx.language)}`);
    console.log(`  ${chalk.dim("Framework:")}  ${chalk.cyan(ctx.framework)}`);
    console.log(`  ${chalk.dim("Files:")}      ${ctx.files.length} source files`);
    console.log();

    if (ctx.packageJson) {
      const deps = Object.keys((ctx.packageJson.dependencies as Record<string, string>) || {});
      const devDeps = Object.keys((ctx.packageJson.devDependencies as Record<string, string>) || {});
      console.log(chalk.white.bold("  Dependencies"));
      console.log(chalk.dim("  ─────────────────────────"));
      console.log(`  ${chalk.dim("Production:")} ${deps.length}`);
      console.log(`  ${chalk.dim("Development:")} ${devDeps.length}`);
      console.log();
    }

    console.log(chalk.white.bold("  Structure"));
    console.log(chalk.dim("  ─────────────────────────"));
    const lines = ctx.structure.split("\n").slice(0, 30);
    lines.forEach((line) => console.log(`  ${chalk.dim(line)}`));
    if (ctx.structure.split("\n").length > 30) {
      console.log(chalk.dim("  ... (truncated)"));
    }
    console.log();
  });

const configCmd = program
  .command("config")
  .description("Manage NexusForge configuration");

configCmd
  .command("show")
  .description("Show current configuration")
  .action(() => {
    const cfg = getConfig();
    console.log(chalk.hex("#10b981").bold("\n⚡ NexusForge Configuration\n"));
    console.log(chalk.dim(JSON.stringify(cfg, null, 2)));
    console.log();
  });

configCmd
  .command("models")
  .description("List configured models")
  .action(() => {
    const models = listModels();
    console.log(chalk.hex("#10b981").bold("\n⚡ Configured Models\n"));
    for (const m of models) {
      const active = m.active ? chalk.green(" ◉ ACTIVE") : chalk.dim(" ○");
      console.log(`  ${active} ${chalk.white(m.name)}`);
      console.log(`     ${chalk.dim(`Provider: ${m.config.provider} | Model: ${m.config.model}`)}`);
      console.log(`     ${chalk.dim(`API Key: ${m.config.apiKey ? "✓ configured" : "✗ not set"}`)}`);
      console.log();
    }
  });

configCmd
  .command("use <model>")
  .description("Set the active model")
  .action((model) => {
    const models = listModels();
    const exists = models.find((m) => m.name === model);
    if (!exists) {
      console.log(chalk.red(`\n  ✗ Model "${model}" not found. Available: ${models.map(m => m.name).join(", ")}\n`));
      return;
    }
    setConfig("activeModel", model);
    console.log(chalk.green(`\n  ✓ Active model set to "${model}"\n`));
  });

configCmd
  .command("set-key <model> <apiKey>")
  .description("Set API key for a model")
  .action((model, apiKey) => {
    setModelApiKey(model, apiKey);
    console.log(chalk.green(`\n  ✓ API key set for "${model}"\n`));
  });

configCmd
  .command("add-model")
  .description("Add a new model configuration")
  .action(async () => {
    const answers = await inquirer.prompt([
      { type: "input", name: "name", message: "Model name (e.g., my-llama):" },
      {
        type: "list",
        name: "provider",
        message: "Provider:",
        choices: ["ollama", "openai", "anthropic", "custom"],
      },
      { type: "input", name: "model", message: "Model identifier:" },
      { type: "input", name: "baseUrl", message: "Base URL:" },
      { type: "input", name: "apiKey", message: "API Key (optional):" },
    ]);

    const modelConfig: ModelConfig = {
      provider: answers.provider,
      model: answers.model,
      baseUrl: answers.baseUrl || undefined,
      apiKey: answers.apiKey || undefined,
      temperature: 0.7,
      maxTokens: 4096,
    };

    addModel(answers.name, modelConfig);
    console.log(chalk.green(`\n  ✓ Model "${answers.name}" added\n`));
  });

program
  .command("version")
  .description("Show version")
  .action(() => {
    console.log(LOGO);
    console.log(chalk.dim(`  Version: ${VERSION}`));
    console.log(chalk.dim(`  License: MIT`));
    console.log(chalk.dim(`  https://github.com/0xgetz/nexusforge\n`));
  });

program.parse();