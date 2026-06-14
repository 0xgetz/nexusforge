import { test, expect } from "bun:test";
import { EventBus, NexusEvents } from "../src/events.js";
import { definePlugin, createPluginContext } from "../src/plugin.js";

test("EventBus emits to subscribers", async () => {
  const bus = new EventBus();
  let received: unknown;
  bus.on("ping", (p) => { received = p; });
  await bus.emit("ping", 42);
  expect(received).toBe(42);
  expect(bus.listenerCount("ping")).toBe(1);
});

test("EventBus once() fires a single time", async () => {
  const bus = new EventBus();
  let count = 0;
  bus.once("x", () => { count++; });
  await bus.emit("x");
  await bus.emit("x");
  expect(count).toBe(1);
});

test("EventBus off() and unsubscribe handle removal", async () => {
  const bus = new EventBus();
  let count = 0;
  const unsub = bus.on("y", () => { count++; });
  unsub();
  await bus.emit("y");
  expect(count).toBe(0);
});

test("EventBus isolates handler errors", async () => {
  const bus = new EventBus();
  let second = false;
  bus.on("z", () => { throw new Error("boom"); });
  bus.on("z", () => { second = true; });
  await bus.emit("z");
  expect(second).toBe(true);
});

test("NexusEvents exposes canonical event names", () => {
  expect(NexusEvents.SCAN_COMPLETE).toBe("nexusforge:scan:complete");
});

test("definePlugin builds a manifest with commands", () => {
  const plugin = definePlugin({
    name: "demo",
    version: "1.0.0",
    description: "demo plugin",
    activate: () => {},
    commands: {
      hello: { description: "say hi", handler: (args) => `hi ${args.name ?? "world"}` },
    },
  });
  expect(plugin.manifest.name).toBe("demo");
  expect(plugin.manifest.commands?.[0].name).toBe("hello");
  expect(plugin.commands.hello({ name: "x" }, createPluginContext("/tmp", "demo"))).toBe("hi x");
});

test("createPluginContext provides a working store", () => {
  const ctx = createPluginContext("/tmp", "demo");
  ctx.store.set("k", 123);
  expect(ctx.store.get("k")).toBe(123);
  expect(ctx.store.has("k")).toBe(true);
  ctx.store.delete("k");
  expect(ctx.store.has("k")).toBe(false);
});
