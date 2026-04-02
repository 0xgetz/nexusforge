import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import type { PluginInstance, PluginManifest, PluginContext } from "./types.js";
import { createPluginContext } from "./plugin.js";
import { globalHookRegistry } from "./hooks.js";
import { globalEventBus, NexusEvents } from "./events.js";

interface LoadedPlugin {
  instance: PluginInstance;
  context: PluginContext;
  active: boolean;
}

export class PluginLoader {
  private plugins: Map<string, LoadedPlugin> = new Map();
  private pluginPaths: string[] = [];

  constructor(private projectPath: string) {
    this.pluginPaths = [
      join(projectPath, ".nexusforge", "plugins"),
      join(projectPath, "node_modules"),
    ];
  }

  async discover(): Promise<PluginManifest[]> {
    const manifests: PluginManifest[] = [];

    for (const searchPath of this.pluginPaths) {
      if (!existsSync(searchPath)) continue;

      try {
        const entries = readdirSync(searchPath);
        for (const entry of entries) {
          if (!entry.startsWith("nexusforge-plugin-") && !entry.startsWith("@nexusforge/plugin-")) {
            continue;
          }

          const manifestPath = join(searchPath, entry, "nexusforge.json");
          const packagePath = join(searchPath, entry, "package.json");

          if (existsSync(manifestPath)) {
            try {
              const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as PluginManifest;
              manifests.push(manifest);
            } catch {
              continue;
            }
          } else if (existsSync(packagePath)) {
            try {
              const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));
              if (pkg.nexusforge) {
                manifests.push(pkg.nexusforge as PluginManifest);
              }
            } catch {
              continue;
            }
          }
        }
      } catch {
        continue;
      }
    }

    return manifests;
  }

  async load(pluginPath: string): Promise<PluginInstance | null> {
    try {
      const resolvedPath = resolve(pluginPath);
      const module = await import(resolvedPath);

      const plugin: PluginInstance = module.default || module;

      if (!plugin.manifest || !plugin.activate) {
        console.error(`[PluginLoader] Invalid plugin at ${pluginPath}: missing manifest or activate`);
        return null;
      }

      const context = createPluginContext(this.projectPath, plugin.manifest.name);
      const loaded: LoadedPlugin = { instance: plugin, context, active: false };

      this.plugins.set(plugin.manifest.name, loaded);

      if (plugin.hooks) {
        for (const [hookName, handler] of Object.entries(plugin.hooks)) {
          if (handler) {
            globalHookRegistry.register(hookName as any, plugin.manifest.name, handler);
          }
        }
      }

      await globalEventBus.emit(NexusEvents.PLUGIN_LOADED, {
        name: plugin.manifest.name,
        version: plugin.manifest.version,
      });

      return plugin;
    } catch (err) {
      await globalEventBus.emit(NexusEvents.PLUGIN_ERROR, {
        path: pluginPath,
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  async activate(pluginName: string): Promise<boolean> {
    const loaded = this.plugins.get(pluginName);
    if (!loaded) {
      console.error(`[PluginLoader] Plugin "${pluginName}" not found`);
      return false;
    }

    if (loaded.active) return true;

    try {
      await loaded.instance.activate(loaded.context);
      loaded.active = true;
      return true;
    } catch (err) {
      console.error(`[PluginLoader] Failed to activate "${pluginName}":`, err);
      return false;
    }
  }

  async deactivate(pluginName: string): Promise<boolean> {
    const loaded = this.plugins.get(pluginName);
    if (!loaded || !loaded.active) return false;

    try {
      await loaded.instance.deactivate?.();
      loaded.active = false;
      globalHookRegistry.unregisterAll(pluginName);
      return true;
    } catch (err) {
      console.error(`[PluginLoader] Failed to deactivate "${pluginName}":`, err);
      return false;
    }
  }

  async activateAll(): Promise<void> {
    for (const [name] of this.plugins) {
      await this.activate(name);
    }
  }

  async deactivateAll(): Promise<void> {
    for (const [name] of this.plugins) {
      await this.deactivate(name);
    }
  }

  getPlugin(name: string): PluginInstance | undefined {
    return this.plugins.get(name)?.instance;
  }

  listPlugins(): Array<{ name: string; version: string; active: boolean }> {
    return Array.from(this.plugins.entries()).map(([name, loaded]) => ({
      name,
      version: loaded.instance.manifest.version,
      active: loaded.active,
    }));
  }

  async executeCommand(
    pluginName: string,
    commandName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const loaded = this.plugins.get(pluginName);
    if (!loaded?.active) throw new Error(`Plugin "${pluginName}" is not active`);

    const handler = loaded.instance.commands?.[commandName];
    if (!handler) throw new Error(`Command "${commandName}" not found in plugin "${pluginName}"`);

    return handler(args, loaded.context);
  }
}