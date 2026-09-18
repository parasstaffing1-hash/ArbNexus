import { z } from 'zod';
import Decimal from 'decimal.js';
import { DataQualityStatus, LatencyMetrics } from '@arbitrage/market-data';

export const StrategyTypeSchema = z.enum([
  'SPOT_CEX_CEX',
  'SPOT_CEX_DEX',
  'SPOT_DEX_DEX',
  'TRIANGULAR',
  'MULTI_HOP',
  'CROSS_CHAIN',
  'STABLECOIN',
  'FUNDING',
  'BASIS',
  'PERP_PERP',
  'STATISTICAL',
  'PAIRS',
  'LIQUIDATION',
  'ONCHAIN',
  'MEV',
  'FLASH_LOAN',
  'ONCHAIN_MEV',
]);
export type StrategyType = z.infer<typeof StrategyTypeSchema>;

export const OpportunityLifecycleStateSchema = z.enum([
  'DETECTED',
  'VALIDATING',
  'VALID',
  'STALE',
  'EXPIRED',
  'REJECTED',
]);
export type OpportunityLifecycleState = z.infer<typeof OpportunityLifecycleStateSchema>;

export interface OpportunityRouteLeg {
  venue: string;
  chain?: string;
  action: 'buy' | 'sell' | 'swap' | 'bridge' | 'lend';
  fromAsset: string;
  toAsset: string;
  price: string;
  amount: string;
  feeUsd: string;
}

export interface Opportunity {
  id: string;
  strategy_type: StrategyType;
  lifecycle_state: OpportunityLifecycleState;
  asset: string;
  route: OpportunityRouteLeg[];
  venues: string[];
  chains: string[];
  entry_price: string;
  exit_price: string;
  gross_spread: string; // e.g. "0.0085" for 0.85%
  gross_profit: string; // USD
  trading_fees: string; // USD
  withdrawal_fees: string; // USD
  gas_cost: string; // USD
  bridge_cost: string; // USD
  slippage: string; // USD
  expected_net_profit: string; // USD
  expected_roi: string; // percentage e.g. "0.45"
  required_capital: string; // USD
  max_executable_size: string; // USD
  estimated_duration_ms: number;
  latency: LatencyMetrics;
  liquidity_score: number; // 0 - 100
  data_quality: DataQualityStatus;
  execution_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  opportunity_score: number; // 0 - 100
  letter_grade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'D';
  timestamp: number;
  detected_at?: number;
  last_valid_at?: number;
  expires_at?: number;
  expiration: number;
  rejection_reason?: string;
  // Multi-Venue / DEX / Cross-Chain attributes
  protocol?: string;
  pool_ids?: string[];
  source_chain?: string;
  destination_chain?: string;
  bridge?: string;
  dex_fee?: string; // USD
  price_impact?: string; // percentage or bps
  block_number?: number;
  route_hash?: string;
  profit_checkpoints?: ProfitCheckpoint[];
  risk_breakdown?: any;
  score_breakdown?: ScoreBreakdown;
  strategy_metadata?: Record<string, any>;
}

export interface ProfitCheckpoint {
  capitalUsd: number;
  grossProfitUsd: number;
  netProfitUsd: number;
  roiPercent: number;
  isExecutable: boolean;
}

export interface ScoreBreakdown {
  profitabilityScore: number;
  liquidityScore: number;
  executionScore: number;
  dataQualityScore: number;
  durationScore: number;
  capitalEfficiencyScore: number;
  riskScore: number;
  compositeScore: number;
}
