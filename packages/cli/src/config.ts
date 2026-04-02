import Conf from "conf";
import { homedir } from "os";
import { join } from "path";

export interface ModelConfig {
  provider: "ollama" | "openai" | "anthropic" | "custom";
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface NexusConfig {
  activeModel: string;
  models: Record<string, ModelConfig>;
  theme: "dark" | "light" | "auto";
  historySize: number;
  projectRoot?: string;
}

const defaults: NexusConfig = {
  activeModel: "ollama-default",
  models: {
    "ollama-default": {
      provider: "ollama",
      model: "codellama",
      baseUrl: "http://localhost:11434",
      temperature: 0.7,
      maxTokens: 4096,
    },
    "openai-gpt4": {
      provider: "openai",
      model: "gpt-4o",
      baseUrl: "https://api.openai.com/v1",
      temperature: 0.7,
      maxTokens: 4096,
    },
    "anthropic-claude": {
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      baseUrl: "https://api.anthropic.com/v1",
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
  theme: "dark",
  historySize: 100,
};

const config = new Conf<NexusConfig>({
  projectName: "nexusforge",
  defaults,
  cwd: join(homedir(), ".nexusforge"),
});

export function getConfig(): NexusConfig {
  return config.store;
}

export function setConfig(key: keyof NexusConfig, value: unknown): void {
  config.set(key, value);
}

export function getActiveModel(): ModelConfig {
  const cfg = getConfig();
  return cfg.models[cfg.activeModel] ?? Object.values(cfg.models)[0];
}

export function setModelApiKey(modelName: string, apiKey: string): void {
  const cfg = getConfig();
  if (cfg.models[modelName]) {
    cfg.models[modelName].apiKey = apiKey;
    config.set("models", cfg.models);
  }
}

export function addModel(name: string, model: ModelConfig): void {
  const cfg = getConfig();
  cfg.models[name] = model;
  config.set("models", cfg.models);
}

export function listModels(): Array<{ name: string; config: ModelConfig; active: boolean }> {
  const cfg = getConfig();
  return Object.entries(cfg.models).map(([name, modelCfg]) => ({
    name,
    config: modelCfg,
    active: name === cfg.activeModel,
  }));
}

export { config };