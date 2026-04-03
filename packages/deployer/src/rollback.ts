import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import type { RollbackEntry, DeployProvider, DeployStage } from "./types.js";

const HISTORY_FILE = ".nexusforge/deploy-history.json";

export function recordDeployment(
  projectPath: string,
  entry: Omit<RollbackEntry, "status">
): void {
  const historyPath = resolve(projectPath, HISTORY_FILE);
  const dir = join(historyPath, "..");

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const history = loadHistory(projectPath);

  for (const h of history) {
    if (h.status === "active" && h.stage === entry.stage) {
      h.status = "superseded";
    }
  }

  history.push({ ...entry, status: "active" });
  writeFileSync(historyPath, JSON.stringify(history, null, 2), "utf-8");
}

export function rollback(
  projectPath: string,
  stage: DeployStage,
  targetVersion?: string
): RollbackEntry | null {
  const history = loadHistory(projectPath);

  const stageHistory = history
    .filter((h) => h.stage === stage)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (stageHistory.length < 2) return null;

  const current = stageHistory.find((h) => h.status === "active");
  if (current) {
    current.status = "rolled-back";
  }

  let target: RollbackEntry | undefined;
  if (targetVersion) {
    target = stageHistory.find((h) => h.version === targetVersion);
  } else {
    target = stageHistory.find((h) => h.status === "superseded");
  }

  if (!target) return null;

  target.status = "active";

  const historyPath = resolve(projectPath, HISTORY_FILE);
  writeFileSync(historyPath, JSON.stringify(history, null, 2), "utf-8");

  return target;
}

export function getDeployHistory(
  projectPath: string,
  stage?: DeployStage
): RollbackEntry[] {
  const history = loadHistory(projectPath);
  if (stage) {
    return history.filter((h) => h.stage === stage);
  }
  return history;
}

export function getActiveDeployment(
  projectPath: string,
  stage: DeployStage
): RollbackEntry | undefined {
  const history = loadHistory(projectPath);
  return history.find((h) => h.stage === stage && h.status === "active");
}

function loadHistory(projectPath: string): RollbackEntry[] {
  const historyPath = resolve(projectPath, HISTORY_FILE);
  if (!existsSync(historyPath)) return [];

  try {
    return JSON.parse(readFileSync(historyPath, "utf-8"));
  } catch {
    return [];
  }
}
