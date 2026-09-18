import { EventEnvelope, EventTopic } from '@arbitrage/market-data';

export type EventHandler<T = any> = (event: EventEnvelope<T>) => void | Promise<void>;

export interface EventBus {
  publish<T>(topic: EventTopic | string, event: EventEnvelope<T>): Promise<void>;
  subscribe<T>(topic: EventTopic | string, handler: EventHandler<T>): () => void;
  isReady(): boolean;
}

export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  async publish<T>(topic: EventTopic | string, event: EventEnvelope<T>): Promise<void> {
    const topicHandlers = this.handlers.get(topic);
    if (topicHandlers) {
      for (const h of topicHandlers) {
        try {
          await h(event);
        } catch (err) {
          console.error(`[EventBus] Error in subscriber for topic ${topic}:`, err);
        }
      }
    }
  }

  subscribe<T>(topic: EventTopic | string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)!.add(handler as EventHandler);

    return () => {
      this.handlers.get(topic)?.delete(handler as EventHandler);
    };
  }

  isReady(): boolean {
    return true;
  }
}
