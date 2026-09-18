import {
  Ticker,
  Trade,
  OrderBook,
  FundingRate,
  OpenInterestData,
  InstrumentMetadata,
} from './types';
import { SymbolNormalizer } from './symbol-normalizer';
import { FundingNormalizer } from './funding-normalizer';
import { ExchangeStatusTracker } from './exchange-status';

export interface CanonicalMarketEvent<T = any> {
  event_id: string;
  schema_version: string;
  source: string;
  timestamp: number;
  payload: T;
}

export type MarketDataSubscriber<T = any> = (event: CanonicalMarketEvent<T>) => void;

export class MarketDataRouter {
  private static instance: MarketDataRouter;
  private subscribers: Map<string, Set<MarketDataSubscriber>> = new Map();

  // In-memory cache for fast lookup / Valkey mirroring
  private latestTickers: Map<string, Ticker> = new Map(); // key: exchange:canonical:marketType
  private latestOrderBooks: Map<string, OrderBook> = new Map();
  private latestFunding: Map<string, FundingRate> = new Map();
  private latestOpenInterest: Map<string, OpenInterestData> = new Map();

  private constructor() {}

  public static getInstance(): MarketDataRouter {
    if (!MarketDataRouter.instance) {
      MarketDataRouter.instance = new MarketDataRouter();
    }
    return MarketDataRouter.instance;
  }

  public subscribe(subject: string, callback: MarketDataSubscriber): () => void {
    if (!this.subscribers.has(subject)) {
      this.subscribers.set(subject, new Set());
    }
    this.subscribers.get(subject)!.add(callback);

    return () => {
      this.subscribers.get(subject)?.delete(callback);
    };
  }

  private publish(subject: string, event: CanonicalMarketEvent): void {
    const listeners = this.subscribers.get(subject);
    if (listeners) {
      listeners.forEach((fn) => {
        try {
          fn(event);
        } catch (e) {
          console.error(`Error in subscriber for ${subject}:`, e);
        }
      });
    }
  }

  /**
   * Routes and normalizes raw ticker into canonical market.ticker event.
   */
  public routeTicker(exchange: string, rawSymbol: string, rawTicker: Partial<Ticker>): Ticker {
    const norm = SymbolNormalizer.normalize(exchange, rawSymbol);
    const now = Date.now();
    const exTimestamp = rawTicker.timestamp || now;
    const latency = now - exTimestamp;

    const canonicalTicker: Ticker = {
      exchange: exchange.toLowerCase(),
      symbol: norm.canonical,
      base_asset: norm.base,
      quote_asset: norm.quote,
      bid: rawTicker.bid || '0',
      bidVolume: rawTicker.bidVolume || rawTicker.bid_size || '1.0',
      bid_size: rawTicker.bid_size || rawTicker.bidVolume || '1.0',
      ask: rawTicker.ask || '0',
      askVolume: rawTicker.askVolume || rawTicker.ask_size || '1.0',
      ask_size: rawTicker.ask_size || rawTicker.askVolume || '1.0',
      last: rawTicker.last || rawTicker.ask || rawTicker.bid || '0',
      volume: rawTicker.volume || '1000',
      volume_24h: rawTicker.volume_24h || rawTicker.volume || '1000',
      timestamp: now,
      exchange_timestamp: exTimestamp,
      received_timestamp: now,
      latency_ms: Math.max(0, latency),
      sequence: rawTicker.sequence || Date.now(),
      data_quality: rawTicker.data_quality || 'VALID',
    };

    const cacheKey = `${exchange.toLowerCase()}:${norm.canonical}`;
    this.latestTickers.set(cacheKey, canonicalTicker);

    // Track latency & message count
    ExchangeStatusTracker.getInstance().recordMessage(exchange.toLowerCase(), latency);

    // Publish to NATS topic
    this.publish('market.ticker', {
      event_id: `evt-ticker-${now}-${Math.random().toString(36).substring(2, 7)}`,
      schema_version: '1.0.0',
      source: exchange.toLowerCase(),
      timestamp: now,
      payload: canonicalTicker,
    });

    return canonicalTicker;
  }

  /**
   * Routes and normalizes raw orderbook into canonical market.orderbook event.
   */
  public routeOrderBook(exchange: string, rawSymbol: string, rawBook: OrderBook): OrderBook {
    const norm = SymbolNormalizer.normalize(exchange, rawSymbol);
    const now = Date.now();
    const exTimestamp = rawBook.timestamp || now;
    const latency = now - exTimestamp;

    const canonicalBook: OrderBook = {
      ...rawBook,
      exchange: exchange.toLowerCase(),
      symbol: norm.canonical,
      exchange_timestamp: exTimestamp,
      received_timestamp: now,
      latency_ms: Math.max(0, latency),
      data_quality: rawBook.data_quality || 'VALID',
    };

    const cacheKey = `${exchange.toLowerCase()}:${norm.canonical}`;
    this.latestOrderBooks.set(cacheKey, canonicalBook);

    this.publish('market.orderbook', {
      event_id: `evt-ob-${now}-${Math.random().toString(36).substring(2, 7)}`,
      schema_version: '1.0.0',
      source: exchange.toLowerCase(),
      timestamp: now,
      payload: canonicalBook,
    });

    return canonicalBook;
  }

  /**
   * Routes and normalizes raw funding rate into canonical market.funding event.
   */
  public routeFunding(exchange: string, rawFunding: FundingRate): FundingRate {
    const norm = SymbolNormalizer.normalize(exchange, rawFunding.symbol);
    const normalizedFunding = FundingNormalizer.normalize({
      ...rawFunding,
      exchange: exchange.toLowerCase(),
      symbol: norm.canonical,
    });

    const now = Date.now();
    const cacheKey = `${exchange.toLowerCase()}:${norm.canonical}`;
    this.latestFunding.set(cacheKey, normalizedFunding);

    this.publish('market.funding', {
      event_id: `evt-funding-${now}-${Math.random().toString(36).substring(2, 7)}`,
      schema_version: '1.0.0',
      source: exchange.toLowerCase(),
      timestamp: now,
      payload: normalizedFunding,
    });

    return normalizedFunding;
  }

  public getCachedTicker(exchange: string, canonicalSymbol: string): Ticker | undefined {
    return this.latestTickers.get(`${exchange.toLowerCase()}:${canonicalSymbol}`);
  }

  public getAllCachedTickers(): Ticker[] {
    return Array.from(this.latestTickers.values());
  }

  public getCachedOrderBook(exchange: string, canonicalSymbol: string): OrderBook | undefined {
    return this.latestOrderBooks.get(`${exchange.toLowerCase()}:${canonicalSymbol}`);
  }

  public getCachedFunding(exchange: string, canonicalSymbol: string): FundingRate | undefined {
    return this.latestFunding.get(`${exchange.toLowerCase()}:${canonicalSymbol}`);
  }

  public getAllCachedFunding(): FundingRate[] {
    return Array.from(this.latestFunding.values());
  }
}
