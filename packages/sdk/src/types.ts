export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  keywords?: string[];
  engines?: {
    nexusforge?: string;
    node?: string;
  };
  permissions?: PluginPermission[];
  hooks?: string[];
  commands?: PluginCommand[];
}

export type PluginPermission =
  | "fs:read"
  | "fs:write"
  | "network"
  | "env"
  | "exec"
  | "git"
  | "ui";

export interface PluginCommand {
  name: string;
  description: string;
  args?: Array<{
    name: string;
    description: string;
    required?: boolean;
    type?: "string" | "number" | "boolean";
    default?: unknown;
  }>;
}

export interface PluginContext {
  projectPath: string;
  config: Record<string, unknown>;
  logger: PluginLogger;
  store: PluginStore;
}

export interface PluginLogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

export interface PluginStore {
  get<T = unknown>(key: string): T | undefined;
  set<T = unknown>(key: string, value: T): void;
  delete(key: string): void;
  has(key: string): boolean;
  clear(): void;
}

export type HookName =
  | "onInit"
  | "onBeforeScan"
  | "onAfterScan"
  | "onBeforeFix"
  | "onAfterFix"
  | "onBeforeChat"
  | "onAfterChat"
  | "onFileChange"
  | "onError"
  | "onShutdown"
  | "onCommand";

export type HookHandler<T = unknown> = (payload: T, context: PluginContext) => Promise<void> | void;

export interface PluginInstance {
  manifest: PluginManifest;
  activate(context: PluginContext): Promise<void> | void;
  deactivate?(): Promise<void> | void;
  hooks?: Partial<Record<HookName, HookHandler>>;
  commands?: Record<string, (args: Record<string, unknown>, context: PluginContext) => Promise<unknown> | unknown>;
}