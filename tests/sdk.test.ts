import { describe, test, expect } from "bun:test";
import {
  EventBus,
  HookRegistry,
  definePlugin,
  createPluginContext,
} from "../packages/sdk/src/index.js";

describe("EventBus", () => {
  test("delivers payloads to subscribers", async () => {
    const bus = new EventBus();
    const received: number[] = [];
    bus.on<number>("ping", (n) => received.push(n));

    await bus.emit("ping", 1);
    await bus.emit("ping", 2);

    expect(received).toEqual([1, 2]);
  });

  test("once() only fires a single time", async () => {
    const bus = new EventBus();
    let calls = 0;
    bus.once("boot", () => calls++);

    await bus.emit("boot");
    await bus.emit("boot");

    expect(calls).toBe(1);
    expect(bus.listenerCount("boot")).toBe(0);
  });

  test("the unsubscribe handle removes the listener", async () => {
    const bus = new EventBus();
    let calls = 0;
    const off = bus.on("tick", () => calls++);

    await bus.emit("tick");
    off();
    await bus.emit("tick");

    expect(calls).toBe(1);
  });

  test("a throwing handler does not block other handlers", async () => {
    const bus = new EventBus();
    let reached = false;
    bus.on("x", () => {
      throw new Error("boom");
    });
    bus.on("x", () => {
      reached = true;
    });

    await bus.emit("x");

    expect(reached).toBe(true);
  });
});

describe("HookRegistry", () => {
  test("executes handlers ordered by ascending priority", async () => {
    const registry = new HookRegistry();
    const order: string[] = [];
    const ctx = createPluginContext("/tmp", "test");

    registry.register("onInit", "late", () => void order.push("late"), 100);
    registry.register("onInit", "early", () => void order.push("early"), 1);

    await registry.execute("onInit", {}, ctx);

    expect(order).toEqual(["early", "late"]);
  });

  test("unregister removes a plugin's handlers", async () => {
    const registry = new HookRegistry();
    registry.register("onInit", "p1", () => {});

    expect(registry.hasListeners("onInit")).toBe(true);
    registry.unregister("onInit", "p1");
    expect(registry.hasListeners("onInit")).toBe(false);
  });
});

describe("definePlugin", () => {
  test("builds a manifest and exposes command handlers", () => {
    const plugin = definePlugin({
      name: "greeter",
      version: "1.0.0",
      description: "says hi",
      permissions: ["fs:read"],
      activate() {},
      commands: {
        hello: {
          description: "Say hello",
          handler: (args) => `Hello, ${args.name ?? "World"}!`,
        },
      },
    });

    expect(plugin.manifest.name).toBe("greeter");
    expect(plugin.manifest.permissions).toEqual(["fs:read"]);
    expect(plugin.manifest.commands?.[0]?.name).toBe("hello");

    const ctx = createPluginContext("/tmp", "greeter");
    expect(plugin.commands?.hello({ name: "Forge" }, ctx)).toBe("Hello, Forge!");
  });
});
