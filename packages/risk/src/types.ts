import Decimal from 'decimal.js';

export interface RiskPolicy {
  maxPositionSizeUsd: Decimal;
  maxSlippageBps: number;
  maxExecutionDurationMs: number;
  maxVenueConcentrationPercent: number;
  maxDrawdownPercent: number;
  restrictedVenues: string[];
  restrictedAssets: string[];
}

export const DEFAULT_RISK_POLICY: RiskPolicy = {
  maxPositionSizeUsd: new Decimal('100000'),
  maxSlippageBps: 50, // 0.50%
  maxExecutionDurationMs: 60000, // 60s
  maxVenueConcentrationPercent: 40,
  maxDrawdownPercent: 5.0,
  restrictedVenues: [],
  restrictedAssets: [],
};

export interface RiskAssessmentResult {
  isApproved: boolean;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  reasons: string[];
  adjustedMaxSizeUsd: Decimal;
}

export interface CircuitBreakerState {
  isTripped: boolean;
  tripReason?: string;
  trippedAt?: number;
  cooldownSeconds: number;
}

export interface AssessableOpportunity {
  asset: string;
  venues: string[];
  required_capital: string;
  slippage: string;
  execution_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' | string;
  [key: string]: any;
}
