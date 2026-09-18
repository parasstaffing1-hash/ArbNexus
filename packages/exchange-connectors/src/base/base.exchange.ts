import {
  ExchangeAdapter,
  ExchangeConnector,
  ExchangeCapabilities,
  MarketDataConnector,
  MarketAdapter,
  OrderBookAdapter,
  FeeAdapter,
  FundingAdapter,
  MarketInfo,
  FeeSchedule,
  ExchangeStatusConnector,
  TickerConnector,
  TradeConnector,
  OrderBookConnector,
  FundingConnector,
  InstrumentConnector,
} from '../interfaces/exchange.interface';
import {
  Ticker,
  OrderBook,
  Trade,
  FundingRate,
  InstrumentMetadata,
  ExchangeConnectionStatus,
  MarketDataRouter,
  ExchangeStatusTracker,
  GlobalMarketCatalog,
} from '@arbitrage/market-data';
import Decimal from 'decimal.js';

export abstract class BaseExchangeAdapter implements ExchangeAdapter, ExchangeConnector {
  abstract readonly exchangeId: string;
  abstract readonly exchangeName: string;
  readonly isDEX: boolean = false;

  protected defaultMakerBps: number = 10;
  protected defaultTakerBps: number = 20;

  public capabilities: ExchangeCapabilities = {
    supportsSpot: true,
    supportsPerpetual: true,
    supportsFutures: false,
    supportsFunding: true,
    supportsOrderBook: true,
    supportsTrades: true,
    supportsWebSocket: true,
    supportsPublicREST: true,
  };

  markets: MarketAdapter;
  orderBooks: OrderBookAdapter;
  fees: FeeAdapter;
  funding: FundingAdapter;

  marketData!: MarketDataConnector;
  status!: ExchangeStatusConnector;

  protected isConnected: boolean = false;
  protected reconnectAttempts: number = 0;
  protected heartbeatTimer?: NodeJS.Timeout;
  protected subscriptions: Set<string> = new Set();

  constructor() {
    this.markets = this.createMarketAdapter();
    this.orderBooks = this.createOrderBookAdapter();
    this.fees = this.createFeeAdapter();
    this.funding = this.createFundingAdapter();
    this.initModularConnectors();
  }

  public getCapabilities(): ExchangeCapabilities {
    return this.capabilities;
  }

  async connect(): Promise<void> {
    this.isConnected = true;
    ExchangeStatusTracker.getInstance().register(this.exchangeId);
    ExchangeStatusTracker.getInstance().updateStatus(this.exchangeId, 'CONNECTED');

    // Start watchdog heartbeat
    this.heartbeatTimer = setInterval(async () => {
      try {
        const pingMs = await this.ping();
        ExchangeStatusTracker.getInstance().recordMessage(this.exchangeId, pingMs);
      } catch (err) {
        ExchangeStatusTracker.getInstance().updateStatus(this.exchangeId, 'DEGRADED');
      }
    }, 5000);
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    ExchangeStatusTracker.getInstance().updateStatus(this.exchangeId, 'DISCONNECTED');
  }

  async reconnect(): Promise<void> {
    this.reconnectAttempts++;
    ExchangeStatusTracker.getInstance().recordReconnect(this.exchangeId);
    ExchangeStatusTracker.getInstance().updateStatus(this.exchangeId, 'CONNECTING');

    await this.disconnect();
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    await new Promise((r) => setTimeout(r, delay));
    await this.connect();

    // Restore subscriptions
    for (const sub of Array.from(this.subscriptions)) {
      const [channel, symbol] = sub.split(':');
      await this.subscribe(channel, symbol, () => {});
    }
  }

  async subscribe(
    channel: string,
    symbol: string,
    callback: (data: any) => void,
  ): Promise<() => void> {
    const key = `${channel}:${symbol}`;
    this.subscriptions.add(key);

    // Initial snapshot via REST fallback / seeding
    if (channel === 'ticker') {
      const t = await this.markets.fetchTicker(symbol);
      MarketDataRouter.getInstance().routeTicker(this.exchangeId, symbol, t);
      callback(t);
    } else if (channel === 'orderbook') {
      const ob = await this.orderBooks.fetchOrderBook(symbol, 20);
      MarketDataRouter.getInstance().routeOrderBook(this.exchangeId, symbol, ob);
      callback(ob);
    } else if (channel === 'funding') {
      const f = await this.funding.fetchFundingRate(symbol);
      MarketDataRouter.getInstance().routeFunding(this.exchangeId, f);
      callback(f);
    }

    return () => {
      this.unsubscribe(channel, symbol);
    };
  }

  async unsubscribe(channel: string, symbol: string): Promise<void> {
    this.subscriptions.delete(`${channel}:${symbol}`);
  }

  async health(): Promise<{
    status: ExchangeConnectionStatus;
    latencyMs: number;
    lastMessageTime: number;
  }> {
    const s = ExchangeStatusTracker.getInstance().getStatus(this.exchangeId);
    return {
      status: s?.status ?? 'CONNECTED',
      latencyMs: s?.averageLatencyMs ?? 15,
      lastMessageTime: s?.lastMessageTimestamp ?? Date.now(),
    };
  }

  async ping(): Promise<number> {
    const start = Date.now();
    await new Promise((r) => setTimeout(r, 8 + Math.floor(Math.random() * 10)));
    return Date.now() - start;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  private initModularConnectors(): void {
    const self = this;

    const tickerConnector: TickerConnector = {
      fetchTicker: (s) => self.markets.fetchTicker(s),
      subscribeTicker: async (s, cb) => self.subscribe('ticker', s, cb),
    };

    const tradeConnector: TradeConnector = {
      fetchTrades: (s, l) => self.markets.fetchTrades(s, l),
      subscribeTrades: async (s, cb) => self.subscribe('trades', s, cb),
    };

    const orderBookConnector: OrderBookConnector = {
      fetchOrderBook: (s, d) => self.orderBooks.fetchOrderBook(s, d),
      subscribeOrderBook: async (s, cb) => self.subscribe('orderbook', s, cb),
    };

    const fundingConnector: FundingConnector = {
      fetchFundingRate: (s) => self.funding.fetchFundingRate(s),
      fetchFundingHistory: (s, l) => self.funding.fetchFundingHistory(s, l),
      subscribeFundingRate: async (s, cb) => self.subscribe('funding', s, cb),
    };

    const instrumentConnector: InstrumentConnector = {
      fetchInstruments: async () => GlobalMarketCatalog.getByExchange(self.exchangeId),
      fetchInstrument: async (s) => GlobalMarketCatalog.get(self.exchangeId, s) ?? null,
    };

    this.marketData = {
      connect: () => self.connect(),
      disconnect: () => self.disconnect(),
      subscribe: (c, s, cb) => self.subscribe(c, s, cb),
      unsubscribe: (c, s) => self.unsubscribe(c, s),
      health: () => self.health(),
      reconnect: () => self.reconnect(),
      getCapabilities: () => self.getCapabilities(),
      tickers: tickerConnector,
      trades: tradeConnector,
      orderBooks: orderBookConnector,
      funding: fundingConnector,
      instruments: instrumentConnector,
    };

    this.status = {
      getStatus: async () => {
        const s = ExchangeStatusTracker.getInstance().getStatus(self.exchangeId);
        return {
          exchange: self.exchangeId,
          status: s?.status ?? 'CONNECTED',
          uptimeSeconds: s?.uptimeSeconds ?? 100,
          latencyMs: s?.averageLatencyMs ?? 15,
          messageRate: s?.messageRatePerSecond ?? 24,
        };
      },
    };
  }

  protected createFeeAdapter(): FeeAdapter {
    const self = this;
    return {
      getFeeSchedule(_symbol?: string): FeeSchedule {
        return {
          makerBps: new Decimal(self.defaultMakerBps),
          takerBps: new Decimal(self.defaultTakerBps),
          withdrawalFees: {
            BTC: new Decimal('0.0002'),
            ETH: new Decimal('0.0025'),
            USDT: new Decimal('1.50'),
            SOL: new Decimal('0.01'),
          },
        };
      },
      calculateTradeFee(_symbol: string, amountUsd: Decimal, isMaker: boolean): Decimal {
        const bps = isMaker ? new Decimal(self.defaultMakerBps) : new Decimal(self.defaultTakerBps);
        return amountUsd.mul(bps).div(10000);
      },
      getWithdrawalFee(currency: string): Decimal {
        const schedule = this.getFeeSchedule();
        return schedule.withdrawalFees[currency.toUpperCase()] ?? new Decimal('2.0');
      },
    };
  }

  protected createFundingAdapter(): FundingAdapter {
    const self = this;
    return {
      async fetchFundingRate(symbol: string): Promise<FundingRate> {
        const now = Date.now();
        const hash = (self.exchangeId + symbol)
          .split('')
          .reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const rateBps = ((hash % 15) - 3) * 0.0001; // between -0.03% and +0.11%
        const normalized = {
          exchange: self.exchangeId,
          symbol,
          rate: rateBps.toFixed(6),
          predictedRate: (rateBps * 1.05).toFixed(6),
          intervalHours: 8,
          nextFundingTime: Math.ceil(now / (8 * 3600 * 1000)) * (8 * 3600 * 1000),
          timestamp: now,
        };
        MarketDataRouter.getInstance().routeFunding(self.exchangeId, normalized);
        return normalized;
      },
      async fetchFundingHistory(symbol: string, limit: number = 10): Promise<FundingRate[]> {
        const current = await this.fetchFundingRate(symbol);
        const history: FundingRate[] = [];
        for (let i = 0; i < limit; i++) {
          history.push({
            ...current,
            timestamp: current.timestamp - i * 8 * 3600 * 1000,
          });
        }
        return history;
      },
    };
  }

  protected createMarketAdapter(): MarketAdapter {
    const self = this;
    return {
      async fetchMarkets(): Promise<MarketInfo[]> {
        const list = GlobalMarketCatalog.getByExchange(self.exchangeId);
        return list.map((i) => ({
          id: `${i.exchange}:${i.symbol}`,
          symbol: i.symbol,
          base: i.base_asset,
          quote: i.quote_asset,
          active: i.status === 'TRADING',
          minTradeAmount: i.minimum_quantity,
          pricePrecision: 2,
          amountPrecision: 4,
          isSpot: i.market_type === 'SPOT',
          isPerp: i.market_type === 'PERPETUAL',
        }));
      },
      async fetchTicker(symbol: string): Promise<Ticker> {
        const now = Date.now();
        let mid = 67200;
        if (symbol.includes('ETH')) mid = 3520;
        if (symbol.includes('SOL')) mid = 188;

        const offsetBps = ((self.exchangeId.charCodeAt(0) % 7) - 3) * 0.0008;
        const adjustedMid = mid * (1 + offsetBps);
        const spreadHalf = adjustedMid * 0.0002;

        const t: Ticker = {
          exchange: self.exchangeId,
          symbol,
          bid: (adjustedMid - spreadHalf).toFixed(2),
          bidVolume: '15.40',
          ask: (adjustedMid + spreadHalf).toFixed(2),
          askVolume: '18.25',
          last: adjustedMid.toFixed(2),
          volume: '28500.00',
          timestamp: now,
        };

        MarketDataRouter.getInstance().routeTicker(self.exchangeId, symbol, t);
        return t;
      },
      async fetchTrades(symbol: string, limit: number = 20): Promise<Trade[]> {
        const ticker = await this.fetchTicker(symbol);
        const trades: Trade[] = [];
        for (let i = 0; i < limit; i++) {
          trades.push({
            id: `${self.exchangeId}-${Date.now()}-${i}`,
            exchange: self.exchangeId,
            symbol,
            price: ticker.last,
            amount: (0.1 + (i % 5) * 0.25).toFixed(4),
            cost: (parseFloat(ticker.last) * (0.1 + (i % 5) * 0.25)).toFixed(2),
            side: i % 2 === 0 ? 'buy' : 'sell',
            timestamp: Date.now() - i * 1500,
          });
        }
        return trades;
      },
    };
  }

  protected createOrderBookAdapter(): OrderBookAdapter {
    const self = this;
    return {
      async fetchOrderBook(symbol: string, depth: number = 20): Promise<OrderBook> {
        const ticker = await self.markets.fetchTicker(symbol);
        const bestBid = parseFloat(ticker.bid);
        const bestAsk = parseFloat(ticker.ask);
        const step = bestBid * 0.0001;

        const bids = [];
        const asks = [];

        for (let i = 0; i < depth; i++) {
          bids.push({
            price: (bestBid - i * step).toFixed(2),
            amount: (0.5 + i * 0.25).toFixed(4),
          });
          asks.push({
            price: (bestAsk + i * step).toFixed(2),
            amount: (0.45 + i * 0.28).toFixed(4),
          });
        }

        const ob: OrderBook = {
          exchange: self.exchangeId,
          symbol,
          timestamp: Date.now(),
          bids,
          asks,
        };

        MarketDataRouter.getInstance().routeOrderBook(self.exchangeId, symbol, ob);
        return ob;
      },
    };
  }
}
