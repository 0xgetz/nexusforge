import chalk from "chalk";
import ora from "ora";
import { createInterface } from "readline";
import { getActiveModel } from "./config.js";
import { createProvider, type ChatMessage } from "./providers.js";
import { scanProject, buildContextPrompt } from "./context.js";

const BANNER = `
${chalk.hex("#10b981").bold("╔══════════════════════════════════════════╗")}
${chalk.hex("#10b981").bold("║")}  ${chalk.hex("#34d399").bold("⚡ NexusForge AI")} ${chalk.dim("— Coding Assistant")}     ${chalk.hex("#10b981").bold("║")}
${chalk.hex("#10b981").bold("╚══════════════════════════════════════════╝")}
`;

const COMMANDS: Record<string, string> = {
  "/help": "Show available commands",
  "/clear": "Clear conversation history",
  "/context": "Show current project context",
  "/file <path>": "Add file content to context",
  "/model": "Show active model info",
  "/exit": "Exit the chat",
};

export async function startChat(options: { projectDir?: string }): Promise<void> {
  console.log(BANNER);

  const modelConfig = getActiveModel();
  const provider = createProvider(modelConfig);

  console.log(chalk.dim(`  Model: ${modelConfig.provider}/${modelConfig.model}`));

  let projectContext = options.projectDir ? scanProject(options.projectDir) : null;
  if (projectContext) {
    console.log(chalk.dim(`  Project: ${projectContext.language} / ${projectContext.framework}`));
    console.log(chalk.dim(`  Files: ${projectContext.files.length} source files`));
  }

  console.log(chalk.dim(`  Type ${chalk.white("/help")} for commands\n`));

  const history: ChatMessage[] = [];
  const contextFiles: string[] = [];

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.hex("#10b981")("❯ "),
  });

  rl.prompt();

  rl.on("line", async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      rl.prompt();
      return;
    }

    if (trimmed.startsWith("/")) {
      handleCommand(trimmed, history, projectContext, contextFiles);
      rl.prompt();
      return;
    }

    let userMessage = trimmed;
    if (projectContext && history.length === 0) {
      userMessage = buildContextPrompt(projectContext, contextFiles) + "\n\n" + trimmed;
    }

    history.push({ role: "user", content: userMessage });

    const spinner = ora({ text: chalk.dim("Thinking..."), spinner: "dots" }).start();

    try {
      let response = "";
      let started = false;

      response = await provider.chat(history, (chunk) => {
        if (!started) {
          spinner.stop();
          process.stdout.write(chalk.hex("#a3e635")("\n⚡ "));
          started = true;
        }
        process.stdout.write(chunk.content);
      });

      if (!started) {
        spinner.stop();
        console.log(chalk.hex("#a3e635")("\n⚡ ") + response);
      } else {
        console.log();
      }

      history.push({ role: "assistant", content: response });
    } catch (err) {
      spinner.stop();
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\n✗ Error: ${message}`));
    }

    console.log();
    rl.prompt();
  });

  rl.on("close", () => {
    console.log(chalk.dim("\n  Goodbye! 👋\n"));
    process.exit(0);
  });
}

function handleCommand(
  cmd: string,
  history: ChatMessage[],
  context: ReturnType<typeof scanProject> | null,
  contextFiles: string[]
): void {
  const [command, ...args] = cmd.split(" ");

  switch (command) {
    case "/help":
      console.log(chalk.hex("#10b981").bold("\n  Available Commands:\n"));
      for (const [key, desc] of Object.entries(COMMANDS)) {
        console.log(`  ${chalk.white(key.padEnd(20))} ${chalk.dim(desc)}`);
      }
      console.log();
      break;

    case "/clear":
      history.length = 0;
      contextFiles.length = 0;
      console.log(chalk.green("  ✓ Conversation history cleared\n"));
      break;

    case "/context":
      if (context) {
        console.log(chalk.hex("#10b981").bold("\n  Project Context:\n"));
        console.log(chalk.dim(`  Root:      ${context.root}`));
        console.log(chalk.dim(`  Language:  ${context.language}`));
        console.log(chalk.dim(`  Framework: ${context.framework}`));
        console.log(chalk.dim(`  Files:     ${context.files.length}`));
        if (contextFiles.length > 0) {
          console.log(chalk.dim(`  Loaded:    ${contextFiles.join(", ")}`));
        }
        console.log();
      } else {
        console.log(chalk.yellow("  No project context. Run from a project directory.\n"));
      }
      break;

    case "/file":
      if (args.length === 0) {
        console.log(chalk.yellow("  Usage: /file <path>\n"));
      } else {
        const filePath = args.join(" ");
        contextFiles.push(filePath);
        console.log(chalk.green(`  ✓ Added "${filePath}" to context\n`));
      }
      break;

    case "/model":
      const modelConfig = getActiveModel();
      console.log(chalk.hex("#10b981").bold("\n  Active Model:\n"));
      console.log(chalk.dim(`  Provider:    ${modelConfig.provider}`));
      console.log(chalk.dim(`  Model:       ${modelConfig.model}`));
      console.log(chalk.dim(`  Temperature: ${modelConfig.temperature}`));
      console.log(chalk.dim(`  Max Tokens:  ${modelConfig.maxTokens}`));
      console.log();
      break;

    case "/exit":
      console.log(chalk.dim("\n  Goodbye! 👋\n"));
      process.exit(0);
      break;

    default:
      console.log(chalk.yellow(`  Unknown command: ${command}. Type /help for commands.\n`));
  }
}