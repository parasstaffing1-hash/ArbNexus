import Bottleneck from 'bottleneck';
import CircuitBreaker from 'opossum';
import pRetry from 'p-retry';
import pTimeout from 'p-timeout';
import { LRUCache } from 'lru-cache';
import { EventEmitter } from 'events';

export interface ExchangeReliabilityConfig {
  exchangeId: string;
  requestsPerSecond?: number;
  maxConcurrent?: number;
  circuitBreakerTimeoutMs?: number;
  circuitBreakerErrorThresholdPercentage?: number;
  circuitBreakerResetTimeoutMs?: number;
  watchdogIntervalMs?: number;
  watchdogTimeoutMs?: number;
  cacheMaxItems?: number;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ExchangeReliabilityStatus {
  exchangeId: string;
  circuitBreakerState: CircuitState;
  rateLimiterQueued: number;
  rateLimiterRunning: number;
  cacheSize: number;
  isWatchdogAlive: boolean;
  lastHeartbeat: number;
  reconnectCount: number;
}

export class ExchangeConnectionManager extends EventEmitter {
  public readonly exchangeId: string;
  private limiter: Bottleneck;
  private circuitBreaker: CircuitBreaker;
  private cache: LRUCache<string, any>;
  private watchdogTimer: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = Date.now();
  private reconnectCount: number = 0;
  private isWatchdogActive: boolean = false;
  private config: Required<ExchangeReliabilityConfig>;

  constructor(config: ExchangeReliabilityConfig) {
    super();
    this.exchangeId = config.exchangeId;

    this.config = {
      exchangeId: config.exchangeId,
      requestsPerSecond: config.requestsPerSecond || 20,
      maxConcurrent: config.maxConcurrent || 5,
      circuitBreakerTimeoutMs: config.circuitBreakerTimeoutMs || 5000,
      circuitBreakerErrorThresholdPercentage: config.circuitBreakerErrorThresholdPercentage || 50,
      circuitBreakerResetTimeoutMs: config.circuitBreakerResetTimeoutMs || 10000,
      watchdogIntervalMs: config.watchdogIntervalMs || 15000,
      watchdogTimeoutMs: config.watchdogTimeoutMs || 30000,
      cacheMaxItems: config.cacheMaxItems || 500,
    };

    // 1. Bottleneck Rate Limiter
    this.limiter = new Bottleneck({
      minTime: Math.ceil(1000 / this.config.requestsPerSecond),
      maxConcurrent: this.config.maxConcurrent,
    });

    // 2. LRU Hot Cache
    this.cache = new LRUCache({
      max: this.config.cacheMaxItems,
      ttl: 1000 * 60 * 5, // 5 minutes TTL
    });

    // 3. Opossum Circuit Breaker
    const executeAction = async (fn: () => Promise<any>) => fn();
    this.circuitBreaker = new CircuitBreaker(executeAction, {
      timeout: this.config.circuitBreakerTimeoutMs,
      errorThresholdPercentage: this.config.circuitBreakerErrorThresholdPercentage,
      resetTimeout: this.config.circuitBreakerResetTimeoutMs,
    });

    this.circuitBreaker.on('open', () => {
      this.emit('circuit_open', { exchangeId: this.exchangeId, timestamp: Date.now() });
    });

    this.circuitBreaker.on('close', () => {
      this.emit('circuit_closed', { exchangeId: this.exchangeId, timestamp: Date.now() });
    });

    this.circuitBreaker.on('halfOpen', () => {
      this.emit('circuit_half_open', { exchangeId: this.exchangeId, timestamp: Date.now() });
    });
  }

  /**
   * Execute an exchange request protected by rate limiting, circuit breaker, timeout, and retries.
   */
  public async executeProtected<T>(
    action: () => Promise<T>,
    options: {
      timeoutMs?: number;
      retries?: number;
      cacheKey?: string;
    } = {},
  ): Promise<T> {
    // Check cache
    if (options.cacheKey) {
      const cached = this.cache.get(options.cacheKey);
      if (cached !== undefined) {
        return cached as T;
      }
    }

    const timeout = options.timeoutMs || this.config.circuitBreakerTimeoutMs;
    const retries = options.retries !== undefined ? options.retries : 2;

    const wrappedAction = async () => {
      return pRetry(
        async () => {
          return pTimeout(
            action(),
            timeout,
            `Request to ${this.exchangeId} timed out after ${timeout}ms`,
          );
        },
        {
          retries,
          factor: 1.5,
          minTimeout: 200,
        },
      );
    };

    // Execute through rate limiter & circuit breaker
    const result = await this.limiter.schedule(() => this.circuitBreaker.fire(wrappedAction));

    // Store in cache
    if (options.cacheKey) {
      this.cache.set(options.cacheKey, result);
    }

    return result as T;
  }

  /**
   * Start the WebSocket watchdog liveness ping loop
   */
  public startWatchdog(pingHandler: () => void | Promise<void>): void {
    this.stopWatchdog();
    this.isWatchdogActive = true;
    this.lastHeartbeat = Date.now();

    this.watchdogTimer = setInterval(async () => {
      const now = Date.now();
      if (now - this.lastHeartbeat > this.config.watchdogTimeoutMs) {
        this.emit('watchdog_timeout', {
          exchangeId: this.exchangeId,
          lastHeartbeat: this.lastHeartbeat,
          elapsedMs: now - this.lastHeartbeat,
        });
        this.reconnectCount++;
        return;
      }

      try {
        await pingHandler();
      } catch {
        // Ping failed
      }
    }, this.config.watchdogIntervalMs);
  }

  /**
   * Register an incoming heartbeat or data packet
   */
  public recordHeartbeat(): void {
    this.lastHeartbeat = Date.now();
  }

  /**
   * Stop the watchdog timer
   */
  public stopWatchdog(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    this.isWatchdogActive = false;
  }

  /**
   * Get current reliability and health status
   */
  public async getStatus(): Promise<ExchangeReliabilityStatus> {
    let circuitState: CircuitState = 'CLOSED';
    if (this.circuitBreaker.opened) circuitState = 'OPEN';
    else if (this.circuitBreaker.halfOpen) circuitState = 'HALF_OPEN';

    const running = await this.limiter.running();
    const queued = await this.limiter.queued();

    return {
      exchangeId: this.exchangeId,
      circuitBreakerState: circuitState,
      rateLimiterQueued: queued,
      rateLimiterRunning: running,
      cacheSize: this.cache.size,
      isWatchdogAlive:
        this.isWatchdogActive && Date.now() - this.lastHeartbeat < this.config.watchdogTimeoutMs,
      lastHeartbeat: this.lastHeartbeat,
      reconnectCount: this.reconnectCount,
    };
  }

  public clearCache(): void {
    this.cache.clear();
  }
}
