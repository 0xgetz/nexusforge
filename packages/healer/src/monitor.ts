import { watch } from "chokidar";
import { readFileSync } from "fs";
import { extname, relative } from "path";
import chalk from "chalk";
import { detectBugs, resetCounter } from "./detector.js";
import type { MonitorEvent, Bug } from "./types.js";

const WATCH_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java",
]);

export function startMonitor(
  projectPath: string,
  options: { ignore?: string[]; onEvent?: (event: MonitorEvent) => void } = {}
): { stop: () => void } {
  const eventLog: MonitorEvent[] = [];

  const log = (event: MonitorEvent) => {
    eventLog.push(event);
    options.onEvent?.(event);
  };

  console.log(chalk.hex("#10b981").bold("\n⚡ NexusForge Self-Healing Monitor\n"));
  console.log(chalk.dim(`  Watching: ${projectPath}`));
  console.log(chalk.dim(`  Press Ctrl+C to stop\n`));

  const ignored = [
    "**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**",
    "**/.next/**", "**/__pycache__/**", "**/target/**",
    ...(options.ignore || []),
  ];

  const watcher = watch(projectPath, {
    ignored,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
  });

  watcher.on("change", (filePath: string) => {
    const ext = extname(filePath).toLowerCase();
    if (!WATCH_EXTENSIONS.has(ext)) return;

    const relPath = relative(projectPath, filePath);

    log({
      type: "file-changed",
      timestamp: new Date().toISOString(),
      file: relPath,
      details: `File modified: ${relPath}`,
    });

    console.log(chalk.dim(`  [${new Date().toLocaleTimeString()}] `) + chalk.cyan(`Changed: ${relPath}`));

    try {
      const content = readFileSync(filePath, "utf-8");
      resetCounter();
      const bugs = detectBugs(relPath, content);

      if (bugs.length > 0) {
        log({
          type: "error-detected",
          timestamp: new Date().toISOString(),
          file: relPath,
          details: `Found ${bugs.length} issue(s)`,
        });

        console.log(chalk.yellow(`  ⚠  Found ${bugs.length} issue(s) in ${relPath}:`));
        for (const bug of bugs) {
          const color = bug.severity === "critical" ? chalk.red :
            bug.severity === "error" ? chalk.hex("#f97316") :
            bug.severity === "warning" ? chalk.yellow : chalk.blue;
          console.log(`     ${color(`[${bug.severity.toUpperCase()}]`)} ${bug.message} ${chalk.dim(`(line ${bug.line})`)}`);
          if (bug.suggestion) {
            console.log(`     ${chalk.dim(`→ ${bug.suggestion}`)}`);
          }
        }
        console.log();
      } else {
        console.log(chalk.green(`  ✓  No issues found`));
      }
    } catch {
      // skip unreadable files
    }
  });

  watcher.on("add", (filePath: string) => {
    const ext = extname(filePath).toLowerCase();
    if (!WATCH_EXTENSIONS.has(ext)) return;
    const relPath = relative(projectPath, filePath);
    console.log(chalk.dim(`  [${new Date().toLocaleTimeString()}] `) + chalk.green(`Added: ${relPath}`));
  });

  watcher.on("unlink", (filePath: string) => {
    const relPath = relative(projectPath, filePath);
    console.log(chalk.dim(`  [${new Date().toLocaleTimeString()}] `) + chalk.red(`Deleted: ${relPath}`));
  });

  return {
    stop: () => {
      watcher.close();
      console.log(chalk.dim("\n  Monitor stopped.\n"));
    },
  };
}