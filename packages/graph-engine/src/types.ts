import Decimal from 'decimal.js';

export interface MarketNode {
  asset: string; // e.g. "BTC", "ETH", "USDT"
  chain?: string;
  decimals?: number;
}

export type SlippageModelType = 'LINEAR' | 'CONSTANT_PRODUCT' | 'DEPTH_BASED';

export interface MarketEdge {
  id: string;
  fromAsset: string;
  toAsset: string;
  venue: string; // e.g. "binance", "uniswap_v3"
  venueType: 'CEX' | 'DEX';
  chain?: string;
  instrument?: string;
  marketType?: 'SPOT' | 'PERP' | 'POOL';
  rate: Decimal; // exchange rate: 1 fromAsset = rate toAsset
  weight: number; // -ln(rate * (1 - fee)) for Bellman-Ford
  feeBps: number;
  availableLiquidityUsd: Decimal;
  orderbookDepthUsd?: Decimal;
  slippageModel?: SlippageModelType;
  gasUsd?: Decimal;
  estimatedLatencyMs: number;
  timestamp: number;
  dataQuality?: 'VALID' | 'STALE' | 'SUSPECT';
}

export interface GraphRouteLeg {
  fromAsset: string;
  toAsset: string;
  venue: string;
  chain?: string;
  instrument?: string;
  rate: Decimal;
  feeBps: number;
  expectedOutput: Decimal;
  feeUsd?: Decimal;
  slippageUsd?: Decimal;
  gasUsd?: Decimal;
  liquidityUsd?: Decimal;
}

export interface ProfitCheckpoint {
  capitalUsd: number;
  grossProfitUsd: number;
  netProfitUsd: number;
  roiPercent: number;
  isExecutable: boolean;
}

export interface GraphRoute {
  legs: GraphRouteLeg[];
  startAsset: string;
  endAsset: string;
  initialAmount: Decimal;
  finalAmount: Decimal;
  grossMultiplier: Decimal;
  netProfit: Decimal;
  roiPercent: Decimal;
  totalFeesUsd: Decimal;
  totalGasUsd: Decimal;
  totalSlippageUsd: Decimal;
  bottleneckLiquidityUsd: Decimal;
  maxExecutableCapitalUsd: Decimal;
  optimalSizeUsd: Decimal;
  profitCheckpoints: ProfitCheckpoint[];
  totalLatencyMs: number;
  routeHash: string;
  isExecutable: boolean;
  warnings: string[];
}

export interface CycleArbitrageCandidate {
  cyclePath: string[]; // e.g. ["USDT", "BTC", "ETH", "USDT"]
  venues: string[];
  chains?: string[];
  grossMultiplier: Decimal;
  netMultiplier: Decimal;
  estimatedProfitBps: Decimal;
  grossProfitUsd?: Decimal;
  netProfitUsd?: Decimal;
  totalFeesUsd?: Decimal;
  gasUsd?: Decimal;
  slippageUsd?: Decimal;
  bottleneckLiquidityUsd?: Decimal;
  maxExecutableCapitalUsd?: Decimal;
  optimalTradeSizeUsd?: Decimal;
  profitCheckpoints?: ProfitCheckpoint[];
  routeHash?: string;
  legs?: GraphRouteLeg[];
}

export interface RoutePruningConfig {
  maxHops: number; // 3, 4, 5
  minLiquidityUsd?: Decimal;
  maxFeeBps?: number;
  minNetProfitBps?: number;
  maxDataAgeMs?: number;
  allowedVenues?: string[];
  allowedChains?: string[];
}
