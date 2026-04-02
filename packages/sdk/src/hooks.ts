import type { HookName, HookHandler, PluginContext } from "./types.js";

interface HookRegistration {
  pluginName: string;
  handler: HookHandler;
  priority: number;
}

export class HookRegistry {
  private hooks: Map<HookName, HookRegistration[]> = new Map();

  register(
    hookName: HookName,
    pluginName: string,
    handler: HookHandler,
    priority = 10
  ): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName)!.push({ pluginName, handler, priority });
    this.hooks.get(hookName)!.sort((a, b) => a.priority - b.priority);
  }

  unregister(hookName: HookName, pluginName: string): void {
    const registrations = this.hooks.get(hookName);
    if (registrations) {
      this.hooks.set(
        hookName,
        registrations.filter((r) => r.pluginName !== pluginName)
      );
    }
  }

  unregisterAll(pluginName: string): void {
    for (const [hookName, registrations] of this.hooks) {
      this.hooks.set(
        hookName,
        registrations.filter((r) => r.pluginName !== pluginName)
      );
    }
  }

  async execute<T = unknown>(
    hookName: HookName,
    payload: T,
    context: PluginContext
  ): Promise<void> {
    const registrations = this.hooks.get(hookName);
    if (!registrations || registrations.length === 0) return;

    for (const registration of registrations) {
      try {
        await registration.handler(payload, context);
      } catch (err) {
        console.error(
          `[Hook] Error in "${hookName}" handler from "${registration.pluginName}":`,
          err
        );
      }
    }
  }

  listHooks(): Map<string, string[]> {
    const result = new Map<string, string[]>();
    for (const [hookName, registrations] of this.hooks) {
      result.set(hookName, registrations.map((r) => r.pluginName));
    }
    return result;
  }

  hasListeners(hookName: HookName): boolean {
    return (this.hooks.get(hookName)?.length ?? 0) > 0;
  }
}

export const globalHookRegistry = new HookRegistry();

export const LifecycleHooks = {
  onInit: "onInit" as HookName,
  onShutdown: "onShutdown" as HookName,
  onError: "onError" as HookName,
} as const;

export const ScanHooks = {
  onBeforeScan: "onBeforeScan" as HookName,
  onAfterScan: "onAfterScan" as HookName,
} as const;

export const FixHooks = {
  onBeforeFix: "onBeforeFix" as HookName,
  onAfterFix: "onAfterFix" as HookName,
} as const;

export const ChatHooks = {
  onBeforeChat: "onBeforeChat" as HookName,
  onAfterChat: "onAfterChat" as HookName,
} as const;

export const FileHooks = {
  onFileChange: "onFileChange" as HookName,
} as const;

export const CommandHooks = {
  onCommand: "onCommand" as HookName,
} as const;