import Decimal from 'decimal.js';
import { StrategyType } from '@arbitrage/arbitrage-engine';

export interface SimulatedTradeFill {
  tradeId: string;
  opportunityId: string;
  timestamp: number;
  strategyType: StrategyType;
  asset: string;
  venues: string[];
  sizeUsd: number;
  entryPrice: number;
  exitPrice: number;
  grossProfitUsd: number;
  feesPaidUsd: number;
  slippagePaidUsd: number;
  netProfitUsd: number;
  latencyMs: number;
  status: 'FILLED' | 'PARTIAL' | 'EXPIRED' | 'REJECTED';
}

export interface BacktestConfig {
  strategyType: StrategyType;
  symbol: string;
  startTime: number;
  endTime: number;
  initialCapitalUsd: number;
  makerFeeBps: number;
  takerFeeBps: number;
  slippageModel: 'CONSTANT' | 'LINEAR' | 'SQUARE_ROOT';
  simulatedLatencyMs: number;
  maxDrawdownTolerancePercent: number;
}

export interface BacktestResult {
  backtestId: string;
  strategyType: StrategyType;
  symbol: string;
  timeRange: { start: number; end: number };
  initialCapitalUsd: number;
  finalCapitalUsd: number;
  netProfitUsd: number;
  roiPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdownPercent: number;
  winRatePercent: number;
  totalTrades: number;
  profitableTrades: number;
  totalFeesPaidUsd: number;
  totalSlippagePaidUsd: number;
  assumptions: string[];
  executedAt: number;
}

export interface ReplayConfig {
  replaySpeedMultiplier: number; // 1x, 5x, 10x, or 0 for max speed
  exchange?: string;
  symbol?: string;
  startTime?: number;
  endTime?: number;
}
