import * as ccxt from 'ccxt';
import { Ticker, OrderBook } from '@arbitrage/shared';

export interface ExchangeCredentials {
  apiKey?: string;
  secret?: string;
  password?: string;
  uid?: string;
  sandbox?: boolean;
}

export class CcxtService {
  private exchanges: Map<string, ccxt.Exchange> = new Map();

  public initializeExchange(exchangeId: string, credentials?: ExchangeCredentials): ccxt.Exchange {
    const ExchangeClass = (ccxt as unknown as Record<string, typeof ccxt.Exchange>)[exchangeId];
    if (!ExchangeClass || typeof ExchangeClass !== 'function') {
      throw new Error(`Unsupported CCXT exchange: ${exchangeId}`);
    }

    const instance = new ExchangeClass({
      apiKey: credentials?.apiKey,
      secret: credentials?.secret,
      password: credentials?.password,
      uid: credentials?.uid,
      enableRateLimit: true,
    });

    if (credentials?.sandbox && 'setSandboxMode' in instance) {
      (instance as unknown as { setSandboxMode: (val: boolean) => void }).setSandboxMode(true);
    }

    this.exchanges.set(exchangeId, instance);
    return instance;
  }

  public getExchange(exchangeId: string): ccxt.Exchange {
    const exchange = this.exchanges.get(exchangeId);
    if (!exchange) {
      return this.initializeExchange(exchangeId);
    }
    return exchange;
  }

  public async fetchTicker(exchangeId: string, symbol: string): Promise<Ticker> {
    const exchange = this.getExchange(exchangeId);
    const raw = await exchange.fetchTicker(symbol);
    return {
      exchange: exchangeId,
      symbol,
      bid: Number(raw.bid) || 0,
      ask: Number(raw.ask) || 0,
      last: Number(raw.last) || 0,
      volume24h: Number(raw.baseVolume) || 0,
      timestamp: raw.timestamp ?? Date.now(),
    };
  }

  public async fetchOrderBook(exchangeId: string, symbol: string, limit = 20): Promise<OrderBook> {
    const exchange = this.getExchange(exchangeId);
    const raw = await exchange.fetchOrderBook(symbol, limit);
    return {
      exchange: exchangeId,
      symbol,
      timestamp: raw.timestamp ?? Date.now(),
      bids: (raw.bids ?? []).map(([price, amount]) => ({
        price: Number(price) || 0,
        amount: Number(amount) || 0,
      })),
      asks: (raw.asks ?? []).map(([price, amount]) => ({
        price: Number(price) || 0,
        amount: Number(amount) || 0,
      })),
    };
  }
}
