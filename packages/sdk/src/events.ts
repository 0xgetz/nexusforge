type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

interface EventSubscription {
  id: string;
  event: string;
  handler: EventHandler;
  once: boolean;
}

export class EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private idCounter = 0;

  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    return this.subscribe(event, handler as EventHandler, false);
  }

  once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    return this.subscribe(event, handler as EventHandler, true);
  }

  off(event: string, handlerId?: string): void {
    if (!handlerId) {
      this.subscriptions.delete(event);
      return;
    }

    const subs = this.subscriptions.get(event);
    if (subs) {
      this.subscriptions.set(
        event,
        subs.filter((s) => s.id !== handlerId)
      );
    }
  }

  async emit<T = unknown>(event: string, payload?: T): Promise<void> {
    const subs = this.subscriptions.get(event);
    if (!subs) return;

    const toRemove: string[] = [];

    for (const sub of subs) {
      try {
        await sub.handler(payload);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }

      if (sub.once) {
        toRemove.push(sub.id);
      }
    }

    if (toRemove.length > 0) {
      this.subscriptions.set(
        event,
        subs.filter((s) => !toRemove.includes(s.id))
      );
    }
  }

  listEvents(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  listenerCount(event: string): number {
    return this.subscriptions.get(event)?.length || 0;
  }

  removeAllListeners(): void {
    this.subscriptions.clear();
  }

  private subscribe(event: string, handler: EventHandler, once: boolean): () => void {
    const id = `evt_${++this.idCounter}`;
    const sub: EventSubscription = { id, event, handler, once };

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }
    this.subscriptions.get(event)!.push(sub);

    return () => this.off(event, id);
  }
}

export const globalEventBus = new EventBus();

export const NexusEvents = {
  INIT: "nexusforge:init",
  SHUTDOWN: "nexusforge:shutdown",
  SCAN_START: "nexusforge:scan:start",
  SCAN_COMPLETE: "nexusforge:scan:complete",
  SCAN_ERROR: "nexusforge:scan:error",
  FIX_START: "nexusforge:fix:start",
  FIX_COMPLETE: "nexusforge:fix:complete",
  FIX_ERROR: "nexusforge:fix:error",
  CHAT_MESSAGE: "nexusforge:chat:message",
  CHAT_RESPONSE: "nexusforge:chat:response",
  FILE_CHANGE: "nexusforge:file:change",
  FILE_ADD: "nexusforge:file:add",
  FILE_DELETE: "nexusforge:file:delete",
  PLUGIN_LOADED: "nexusforge:plugin:loaded",
  PLUGIN_ERROR: "nexusforge:plugin:error",
  COMMAND_EXECUTE: "nexusforge:command:execute",
  ERROR: "nexusforge:error",
} as const;

export type NexusEventName = (typeof NexusEvents)[keyof typeof NexusEvents];