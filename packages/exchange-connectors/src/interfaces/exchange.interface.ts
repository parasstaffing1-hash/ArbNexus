import {
  Ticker,
  OrderBook,
  Trade,
  FundingRate,
  InstrumentMetadata,
  OpenInterestData,
  ExchangeConnectionStatus,
} from '@arbitrage/market-data';
import Decimal from 'decimal.js';

export interface ExchangeCapabilities {
  supportsSpot: boolean;
  supportsPerpetual: boolean;
  supportsFutures: boolean;
  supportsFunding: boolean;
  supportsOrderBook: boolean;
  supportsTrades: boolean;
  supportsWebSocket: boolean;
  supportsPublicREST: boolean;
}

export interface MarketInfo {
  id: string;
  symbol: string;
  base: string;
  quote: string;
  active: boolean;
  minTradeAmount: string;
  maxTradeAmount?: string;
  pricePrecision: number;
  amountPrecision: number;
  isSpot: boolean;
  isPerp: boolean;
}

export interface FeeSchedule {
  makerBps: Decimal; // e.g. 10 bps = 0.10%
  takerBps: Decimal; // e.g. 20 bps = 0.20%
  nativeDiscountBps?: Decimal;
  vipTier?: number;
  withdrawalFees: Record<string, Decimal>; // currency -> fee in native tokens
}

export interface BaseConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(channel: string, symbol: string, callback: (data: any) => void): Promise<() => void>;
  unsubscribe(channel: string, symbol: string): Promise<void>;
  health(): Promise<{
    status: ExchangeConnectionStatus;
    latencyMs: number;
    lastMessageTime: number;
  }>;
  reconnect(): Promise<void>;
  getCapabilities(): ExchangeCapabilities;
}

export interface TickerConnector {
  fetchTicker(symbol: string): Promise<Ticker>;
  subscribeTicker(symbol: string, callback: (ticker: Ticker) => void): Promise<() => void>;
}

export interface TradeConnector {
  fetchTrades(symbol: string, limit?: number): Promise<Trade[]>;
  subscribeTrades(symbol: string, callback: (trade: Trade) => void): Promise<() => void>;
}

export interface OrderBookConnector {
  fetchOrderBook(symbol: string, depth?: number): Promise<OrderBook>;
  subscribeOrderBook(symbol: string, callback: (book: OrderBook) => void): Promise<() => void>;
}

export interface FundingConnector {
  fetchFundingRate(symbol: string): Promise<FundingRate>;
  fetchFundingHistory(symbol: string, limit?: number): Promise<FundingRate[]>;
  subscribeFundingRate(symbol: string, callback: (rate: FundingRate) => void): Promise<() => void>;
}

export interface InstrumentConnector {
  fetchInstruments(): Promise<InstrumentMetadata[]>;
  fetchInstrument(symbol: string): Promise<InstrumentMetadata | null>;
}

export interface ExchangeStatusConnector {
  getStatus(): Promise<{
    exchange: string;
    status: ExchangeConnectionStatus;
    uptimeSeconds: number;
    latencyMs: number;
    messageRate: number;
  }>;
}

export interface MarketDataConnector extends BaseConnector {
  readonly tickers: TickerConnector;
  readonly trades: TradeConnector;
  readonly orderBooks: OrderBookConnector;
  readonly funding: FundingConnector;
  readonly instruments: InstrumentConnector;
}

export interface MarketAdapter {
  fetchMarkets(): Promise<MarketInfo[]>;
  fetchTicker(symbol: string): Promise<Ticker>;
  fetchTrades(symbol: string, limit?: number): Promise<Trade[]>;
}

export interface OrderBookAdapter {
  fetchOrderBook(symbol: string, depth?: number): Promise<OrderBook>;
  subscribeOrderBook?(symbol: string, callback: (book: OrderBook) => void): () => void;
}

export interface FeeAdapter {
  getFeeSchedule(symbol?: string): FeeSchedule;
  calculateTradeFee(symbol: string, amountUsd: Decimal, isMaker: boolean): Decimal;
  getWithdrawalFee(currency: string, network?: string): Decimal;
}

export interface FundingAdapter {
  fetchFundingRate(symbol: string): Promise<FundingRate>;
  fetchFundingHistory(symbol: string, limit?: number): Promise<FundingRate[]>;
  subscribeFundingRate?(symbol: string, callback: (rate: FundingRate) => void): () => void;
}

export interface ExchangeConnector extends BaseConnector {
  readonly exchangeId: string;
  readonly exchangeName: string;
  readonly isDEX: boolean;
  readonly capabilities: ExchangeCapabilities;

  readonly marketData: MarketDataConnector;
  readonly fees: FeeAdapter;
  readonly status: ExchangeStatusConnector;
}

export interface ExchangeAdapter {
  readonly exchangeId: string;
  readonly exchangeName: string;
  readonly isDEX: boolean;

  readonly markets: MarketAdapter;
  readonly orderBooks: OrderBookAdapter;
  readonly fees: FeeAdapter;
  readonly funding: FundingAdapter;

  ping(): Promise<number>; // returns roundtrip latency in ms
  isAvailable(): Promise<boolean>;
}
