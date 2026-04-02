export { NexusPlugin, definePlugin, createPluginContext } from "./plugin.js";

export { EventBus, globalEventBus, NexusEvents } from "./events.js";
export type { NexusEventName } from "./events.js";

export {
  HookRegistry,
  globalHookRegistry,
  LifecycleHooks,
  ScanHooks,
  FixHooks,
  ChatHooks,
  FileHooks,
  CommandHooks,
} from "./hooks.js";

export { PluginLoader } from "./loader.js";

export { PluginRegistry, globalRegistry } from "./registry.js";

export type {
  PluginManifest,
  PluginPermission,
  PluginCommand,
  PluginContext,
  PluginLogger,
  PluginStore,
  HookName,
  HookHandler,
  PluginInstance,
} from "./types.js";

export const SDK_VERSION = "0.1.0";