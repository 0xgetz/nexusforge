import type {
  PluginManifest,
  PluginInstance,
  PluginContext,
  PluginLogger,
  PluginStore,
  HookName,
  HookHandler,
  PluginCommand,
} from "./types.js";

export abstract class NexusPlugin implements PluginInstance {
  abstract manifest: PluginManifest;

  hooks: Partial<Record<HookName, HookHandler>> = {};
  commands: Record<string, (args: Record<string, unknown>, context: PluginContext) => Promise<unknown> | unknown> = {};

  abstract activate(context: PluginContext): Promise<void> | void;

  deactivate?(): Promise<void> | void;

  protected registerHook<T = unknown>(name: HookName, handler: HookHandler<T>): void {
    this.hooks[name] = handler as HookHandler;
  }

  protected registerCommand(
    name: string,
    description: string,
    handler: (args: Record<string, unknown>, context: PluginContext) => Promise<unknown> | unknown,
    args?: PluginCommand["args"]
  ): void {
    this.commands[name] = handler;

    if (!this.manifest.commands) this.manifest.commands = [];
    this.manifest.commands.push({ name, description, args });
  }
}

export function definePlugin(config: {
  name: string;
  version: string;
  description: string;
  author?: string;
  permissions?: PluginManifest["permissions"];
  activate: (context: PluginContext) => Promise<void> | void;
  deactivate?: () => Promise<void> | void;
  hooks?: Partial<Record<HookName, HookHandler>>;
  commands?: Record<string, {
    description: string;
    handler: (args: Record<string, unknown>, context: PluginContext) => Promise<unknown> | unknown;
    args?: PluginCommand["args"];
  }>;
}): PluginInstance {
  const manifest: PluginManifest = {
    name: config.name,
    version: config.version,
    description: config.description,
    author: config.author,
    permissions: config.permissions,
    commands: config.commands
      ? Object.entries(config.commands).map(([name, cmd]) => ({
          name,
          description: cmd.description,
          args: cmd.args,
        }))
      : undefined,
  };

  const commandHandlers: Record<string, (args: Record<string, unknown>, context: PluginContext) => Promise<unknown> | unknown> = {};
  if (config.commands) {
    for (const [name, cmd] of Object.entries(config.commands)) {
      commandHandlers[name] = cmd.handler;
    }
  }

  return {
    manifest,
    activate: config.activate,
    deactivate: config.deactivate,
    hooks: config.hooks,
    commands: commandHandlers,
  };
}

export function createPluginContext(
  projectPath: string,
  pluginName: string,
  globalConfig: Record<string, unknown> = {}
): PluginContext {
  return {
    projectPath,
    config: globalConfig,
    logger: createLogger(pluginName),
    store: createStore(),
  };
}

function createLogger(prefix: string): PluginLogger {
  return {
    info: (msg, ...args) => console.log(`[${prefix}] ℹ ${msg}`, ...args),
    warn: (msg, ...args) => console.warn(`[${prefix}] ⚠ ${msg}`, ...args),
    error: (msg, ...args) => console.error(`[${prefix}] ✗ ${msg}`, ...args),
    debug: (msg, ...args) => console.debug(`[${prefix}] 🔍 ${msg}`, ...args),
  };
}

function createStore(): PluginStore {
  const data = new Map<string, unknown>();
  return {
    get: <T = unknown>(key: string) => data.get(key) as T | undefined,
    set: <T = unknown>(key: string, value: T) => { data.set(key, value); },
    delete: (key: string) => { data.delete(key); },
    has: (key: string) => data.has(key),
    clear: () => data.clear(),
  };
}