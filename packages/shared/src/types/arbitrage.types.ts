export type ExchangeType = 'CEX' | 'DEX';

export type CexExchange = 'binance' | 'okx' | 'bybit' | 'coinbase' | 'kraken';

export type DexProtocol = 'uniswap_v3' | 'oneinch' | 'lifi' | 'jupiter' | 'raydium';

export type ChainId = 1 | 137 | 42161 | 8453 | 999999; // 1: Eth, 137: Polygon, 42161: Arbitrum, 8453: Base, 999999: Solana

export interface OrderBookLevel {
  price: number;
  amount: number;
}

export interface OrderBook {
  exchange: string;
  symbol: string;
  timestamp: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface Ticker {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume24h: number;
  timestamp: number;
}

export type ArbitrageStrategy = 'SPATIAL' | 'TRIANGULAR' | 'CROSS_CHAIN' | 'DEX_CEX';

export interface ArbitrageLeg {
  action: 'BUY' | 'SELL';
  exchange: string;
  exchangeType: ExchangeType;
  symbol: string;
  price: number;
  expectedAmount: number;
  chainId?: ChainId;
  estimatedFeeUsd: number;
}

export interface ArbitrageOpportunity {
  id: string;
  strategy: ArbitrageStrategy;
  sourceExchange: string;
  targetExchange: string;
  pair: string;
  buyPrice: number;
  sellPrice: number;
  spreadPercent: number;
  grossProfitUsd: number;
  netProfitUsd: number;
  totalFeesUsd: number;
  minCapitalUsd: number;
  legs: ArbitrageLeg[];
  detectedAt: number;
  expiresAt: number;
  confidenceScore: number;
}

export type ExecutionStatus =
  'PENDING' | 'EXECUTING' | 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'EXPIRED';

export interface ExecutionResult {
  opportunityId: string;
  status: ExecutionStatus;
  realizedProfitUsd?: number;
  totalGasSpentUsd?: number;
  executionTimeMs: number;
  txHashes: string[];
  errorMessage?: string;
  timestamp: number;
}
