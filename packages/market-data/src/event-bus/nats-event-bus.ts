import {
  connect,
  NatsConnection,
  JetStreamClient,
  JetStreamManager,
  StringCodec,
  JSONCodec,
  Subscription,
  RetentionPolicy,
} from 'nats';
import { EventEmitter } from 'events';

export type EventSubject =
  | 'market.ticker'
  | 'market.orderbook'
  | 'market.trade'
  | 'market.funding'
  | 'dex.swap'
  | 'dex.pool'
  | 'blockchain.block'
  | 'blockchain.event'
  | 'arbitrage.candidate'
  | 'arbitrage.validated'
  | 'arbitrage.expired'
  | 'alerts.opportunity'
  | 'system.heartbeat'
  | string;

export interface EventPublisher {
  publish<T>(subject: EventSubject, data: T): Promise<void>;
}

export interface EventSubscriber {
  subscribe<T>(
    subject: EventSubject,
    handler: (data: T) => void | Promise<void>,
  ): Promise<() => void>;
}

export interface StreamManager {
  ensureStream(streamName: string, subjects: string[]): Promise<void>;
}

export class NatsEventBus implements EventPublisher, EventSubscriber, StreamManager {
  private nc: NatsConnection | null = null;
  private js: JetStreamClient | null = null;
  private jsm: JetStreamManager | null = null;
  private inMemoryFallback = new EventEmitter();
  private jsonCodec = JSONCodec();
  private isConnected = false;
  private natsUrl: string;

  constructor(natsUrl: string = process.env.NATS_URL || 'nats://localhost:4222') {
    this.natsUrl = natsUrl;
    this.inMemoryFallback.setMaxListeners(200);
  }

  public async connect(): Promise<boolean> {
    try {
      this.nc = await connect({
        servers: [this.natsUrl],
        timeout: 2000,
        reconnect: true,
        maxReconnectAttempts: 5,
        reconnectTimeWait: 1000,
      });

      this.js = this.nc.jetstream();
      this.jsm = await this.nc.jetstreamManager();
      this.isConnected = true;
      return true;
    } catch {
      // In-memory fallback mode for local demo without Docker
      this.isConnected = false;
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.nc) {
      await this.nc.drain();
      await this.nc.close();
      this.nc = null;
      this.js = null;
      this.jsm = null;
      this.isConnected = false;
    }
  }

  public async ensureStream(streamName: string, subjects: string[]): Promise<void> {
    if (!this.isConnected || !this.jsm) {
      return;
    }

    try {
      await this.jsm.streams.add({
        name: streamName,
        subjects,
        retention: RetentionPolicy.Limits,
      });
    } catch (err: unknown) {
      // Stream might already exist; update subjects if needed
      try {
        await this.jsm.streams.update(streamName, { subjects });
      } catch {
        // Ignored if already up-to-date
      }
    }
  }

  public async publish<T>(subject: EventSubject, data: T): Promise<void> {
    if (this.isConnected && this.js) {
      try {
        const payload = this.jsonCodec.encode(data);
        await this.js.publish(subject, payload);
        return;
      } catch {
        // Fallback to in-memory emit if publish fails
      }
    }

    // In-memory distribution
    this.inMemoryFallback.emit(subject, data);
  }

  public async subscribe<T>(
    subject: EventSubject,
    handler: (data: T) => void | Promise<void>,
  ): Promise<() => void> {
    if (this.isConnected && this.nc) {
      try {
        const sub = this.nc.subscribe(subject);
        (async () => {
          for await (const m of sub) {
            try {
              const data = this.jsonCodec.decode(m.data) as T;
              await handler(data);
            } catch (err) {
              // Ignore decoding errors
            }
          }
        })();

        return () => sub.unsubscribe();
      } catch {
        // Fall back to in-memory subscription
      }
    }

    const listener = async (data: T) => {
      try {
        await handler(data);
      } catch {
        // Error handler
      }
    };

    this.inMemoryFallback.on(subject, listener);
    return () => {
      this.inMemoryFallback.off(subject, listener);
    };
  }

  public isLiveConnection(): boolean {
    return this.isConnected;
  }
}
