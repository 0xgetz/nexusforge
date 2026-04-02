/**
 * Example NexusForge Plugin
 *
 * This demonstrates how to build a simple plugin using the NexusForge SDK.
 *
 * Usage:
 *   import { definePlugin } from "@nexusforge/sdk";
 *
 *   const plugin = definePlugin({ ... });
 *   export default plugin;
 */

import { definePlugin } from "../src/plugin.js";

const helloPlugin = definePlugin({
  name: "nexusforge-plugin-hello",
  version: "1.0.0",
  description: "A simple example plugin that greets users",
  author: "NexusForge Team",
  permissions: ["fs:read"],

  activate(context) {
    context.logger.info("Hello Plugin activated!");
    context.store.set("greetCount", 0);
  },

  deactivate() {
    console.log("Hello Plugin deactivated. Goodbye!");
  },

  hooks: {
    onInit: async (_payload, context) => {
      context.logger.info("Project initialized — Hello Plugin is ready!");
    },

    onBeforeScan: async (_payload, context) => {
      context.logger.info("Scan starting — Hello Plugin is watching...");
    },

    onAfterScan: async (payload, context) => {
      const result = payload as { totalBugs: number };
      if (result.totalBugs === 0) {
        context.logger.info("Clean scan! Great job! 🎉");
      } else {
        context.logger.warn(`Found ${result.totalBugs} issues to fix`);
      }
    },
  },

  commands: {
    greet: {
      description: "Send a greeting message",
      args: [
        { name: "name", description: "Name to greet", required: false, type: "string", default: "World" },
      ],
      handler: (args, context) => {
        const name = (args.name as string) || "World";
        const count = (context.store.get<number>("greetCount") || 0) + 1;
        context.store.set("greetCount", count);
        return `Hello, ${name}! (Greeting #${count})`;
      },
    },

    stats: {
      description: "Show plugin stats",
      handler: (_args, context) => {
        const count = context.store.get<number>("greetCount") || 0;
        return { totalGreetings: count, pluginName: "hello" };
      },
    },
  },
});

export default helloPlugin;