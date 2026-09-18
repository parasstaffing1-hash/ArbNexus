import { z } from 'zod';
import Decimal from 'decimal.js';

export const DataQualityStatusSchema = z.enum([
  'VALID',
  'STALE',
  'SUSPICIOUS',
  'INVALID',
  'MISSING',
]);
export type DataQualityStatus = z.infer<typeof DataQualityStatusSchema>;

export type MarketType = 'SPOT' | 'PERPETUAL' | 'FUTURE' | 'OPTION';

export type ExchangeConnectionStatus =
  'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'DEGRADED' | 'STALE' | 'ERROR';

export interface LatencyMetrics {
  exchangeTimestamp: number;
  receiveTimestamp: number;
  normalizationTimestamp: number;
  detectionTimestamp?: number;
  calculationTimestamp?: number;
  broadcastTimestamp?: number;
  sourceLatencyMs: number;
  pipelineLatencyMs: number;
  calculationLatencyMs?: number;
  broadcastLatencyMs?: number;
  totalLatencyMs: number;
}

export interface Trade {
  id: string;
  trade_id?: string;
  exchange: string;
  symbol: string;
  price: string;
  amount: string;
  quantity?: string;
  cost: string;
  side: 'buy' | 'sell';
  timestamp: number;
  exchange_timestamp?: number;
  received_timestamp?: number;
  latency_ms?: number;
  sequence?: number;
  isMaker?: boolean;
  fee?: {
    cost: string;
    currency: string;
  };
}

export interface Ticker {
  exchange: string;
  symbol: string;
  base_asset?: string;
  quote_asset?: string;
  bid: string;
  bidVolume?: string;
  bid_size?: string;
  ask: string;
  askVolume?: string;
  ask_size?: string;
  last: string;
  high?: string;
  low?: string;
  volume: string;
  volume_24h?: string;
  quoteVolume?: string;
  timestamp: number;
  exchange_timestamp?: number;
  received_timestamp?: number;
  latency_ms?: number;
  sequence?: number;
  data_quality?: DataQualityStatus;
}

export interface OrderBookLevel {
  price: string;
  amount: string;
}

export interface OrderBook {
  exchange: string;
  symbol: string;
  timestamp: number;
  exchange_timestamp?: number;
  received_timestamp?: number;
  latency_ms?: number;
  nonce?: number;
  sequence?: number;
  checksum?: number;
  data_quality?: DataQualityStatus;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface OrderBookDelta {
  exchange: string;
  symbol: string;
  timestamp: number;
  sequence: number;
  previousSequence?: number;
  bids: [string, string][]; // [price, amount] (amount = '0' for removal)
  asks: [string, string][];
}

export interface FundingRate {
  exchange: string;
  symbol: string;
  rate: string; // e.g. "0.0001" for 0.01%
  funding_rate?: string;
  predictedRate?: string;
  predicted_rate?: string;
  intervalHours: number; // e.g. 8
  funding_interval?: number;
  nextFundingTime: number;
  next_funding_timestamp?: number;
  timestamp: number;
  exchange_timestamp?: number;
  received_timestamp?: number;
  hourly_rate?: string;
  daily_rate?: string;
  weekly_rate?: string;
  annualized_rate?: string;
  openInterest?: string;
  markPrice?: string;
  mark_price?: string;
  indexPrice?: string;
  index_price?: string;
  premium?: string;
}

export interface OpenInterestData {
  exchange: string;
  symbol: string;
  open_interest: string;
  open_interest_value_usd: string;
  timestamp: number;
}

export interface InstrumentMetadata {
  exchange: string;
  symbol: string;
  market_type: MarketType;
  base_asset: string;
  quote_asset: string;
  contract_size: string;
  tick_size: string;
  quantity_step: string;
  minimum_quantity: string;
  minimum_notional: string;
  maker_fee: string;
  taker_fee: string;
  settlement_asset: string;
  margin_asset: string;
  status: 'TRADING' | 'HALTED' | 'CLOSED' | 'MAINTENANCE';
}

export interface LiquidationEvent {
  id: string;
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: string;
  amount: string;
  notionalUsd: string;
  timestamp: number;
}

export interface GasMeasurement {
  chain: string;
  blockNumber: number;
  baseFeeGwei: string;
  priorityFeeGwei: string;
  standardGwei: string;
  fastGwei: string;
  instantGwei: string;
  usdCostEstimate: string;
  timestamp: number;
}

export interface BlockchainEvent {
  chain: string;
  blockNumber: number;
  txHash: string;
  contractAddress: string;
  eventName: string;
  params: Record<string, any>;
  timestamp: number;
}
