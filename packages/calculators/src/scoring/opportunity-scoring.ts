import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';

export interface OpportunityScoringInput {
  netSpreadPercent: DecimalValue; // e.g. 1.25%
  netProfitUsd: DecimalValue; // e.g. $140
  orderBookLiquidityUsd: DecimalValue; // e.g. $50,000
  expectedSlippagePercent: DecimalValue; // e.g. 0.08%
  exchangeReliabilityScore: DecimalValue; // 0 to 1 scale (e.g. 0.98)
  withdrawalAvailability: boolean;
  networkCongestionScore: DecimalValue; // 0 (clear) to 1 (clogged)
  executionLatencyMs: DecimalValue; // e.g. 120ms
  historicalSpreadPersistenceSeconds: DecimalValue; // e.g. 45s
  transferTimeMinutes: DecimalValue; // e.g. 2m (0 for spatial)
  capitalRequirementUsd: DecimalValue; // e.g. $5,000
}

export interface OpportunityScoringOutput {
  opportunityScore: number; // 0 to 100 overall composite quality score
  profitabilityScore: number; // 0 to 100
  liquidityScore: number; // 0 to 100
  executionRiskScore: number; // 0 (safe) to 100 (high risk)
  transferRiskScore: number; // 0 (safe) to 100 (high risk)
  overallRiskScore: number; // 0 (safe) to 100 (high risk)
  grade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'D';
  recommendation: 'EXECUTE' | 'INVESTIGATE' | 'REJECT';
}

/**
 * Deterministic, auditable, multi-factor arbitrage opportunity scoring engine.
 * Transparent weight attribution with zero non-deterministic hallucinations.
 */
export function calculateOpportunityScore(
  input: OpportunityScoringInput,
): CalculationResult<OpportunityScoringInput, OpportunityScoringOutput> {
  const spread = toDecimal(input.netSpreadPercent);
  const profit = toDecimal(input.netProfitUsd);
  const liquidity = toDecimal(input.orderBookLiquidityUsd);
  const slippage = toDecimal(input.expectedSlippagePercent);
  const reliability = toDecimal(input.exchangeReliabilityScore);
  const congestion = toDecimal(input.networkCongestionScore);
  const latency = toDecimal(input.executionLatencyMs);
  const persistence = toDecimal(input.historicalSpreadPersistenceSeconds);
  const transfer = toDecimal(input.transferTimeMinutes);
  const capital = toDecimal(input.capitalRequirementUsd);

  // 1. Profitability Score (0-100)
  // Evaluates spread magnitude and net absolute dollars
  let profitScore = new Decimal(0);
  if (spread.greaterThan(0)) {
    // 0.5% = 50 pts, 1.0% = 75 pts, 2.0%+ = 100 pts
    const spreadPts = Decimal.min(100, spread.times(50));
    // Profit dollar scaling: $25 = 50 pts, $100 = 80 pts, $250+ = 100 pts
    const dollarPts = Decimal.min(100, profit.dividedBy('2.5'));
    profitScore = spreadPts.times('0.6').plus(dollarPts.times('0.4'));
  }

  // 2. Liquidity Score (0-100)
  // Evaluates depth relative to required capital
  const liquidityRatio = capital.isZero() ? new Decimal(0) : liquidity.dividedBy(capital);
  // 5x depth = 100 pts, 2x depth = 70 pts, 1x depth = 40 pts
  let liqScore = Decimal.min(100, liquidityRatio.times(20));
  if (liquidityRatio.lessThan(1)) liqScore = liqScore.times('0.5');

  // 3. Execution Risk Score (0-100, where higher is riskier)
  // Slips, latency, exchange downtime
  const slipRisk = Decimal.min(100, slippage.times(100)); // 1% slip = 100 risk
  const latencyRisk = Decimal.min(100, latency.dividedBy(5)); // 500ms = 100 risk
  const reliabilityRisk = new Decimal(1).minus(reliability).times(100);
  const execRisk = slipRisk
    .times('0.4')
    .plus(latencyRisk.times('0.3'))
    .plus(reliabilityRisk.times('0.3'));

  // 4. Transfer Risk Score (0-100)
  // Cross-chain delay, congestion, withdrawal shutdown
  let transRisk = new Decimal(0);
  if (!input.withdrawalAvailability) {
    transRisk = new Decimal(100); // Fatal failure if withdrawal halted
  } else {
    const timeRisk = Decimal.min(100, transfer.times(10)); // 10 min = 100 risk
    const congRisk = congestion.times(100);
    transRisk = timeRisk.times('0.6').plus(congRisk.times('0.4'));
  }

  // 5. Overall Risk Score (0-100)
  const overallRisk = execRisk.times('0.55').plus(transRisk.times('0.45'));

  // 6. Final Opportunity Score = Max(0, 0.45 * ProfitScore + 0.35 * LiqScore - 0.50 * OverallRisk)
  let compositeScore = profitScore
    .times('0.45')
    .plus(liqScore.times('0.35'))
    .minus(overallRisk.times('0.35'));

  // Penalty if withdrawal is disabled
  if (!input.withdrawalAvailability) {
    compositeScore = new Decimal(0);
  }

  const finalScore = Math.max(0, Math.min(100, compositeScore.toNumber()));

  // Assign rating grade
  let grade: OpportunityScoringOutput['grade'] = 'D';
  if (finalScore >= 90) grade = 'AAA';
  else if (finalScore >= 80) grade = 'AA';
  else if (finalScore >= 70) grade = 'A';
  else if (finalScore >= 60) grade = 'BBB';
  else if (finalScore >= 50) grade = 'BB';
  else if (finalScore >= 40) grade = 'B';

  const recommendation = finalScore >= 70 ? 'EXECUTE' : finalScore >= 45 ? 'INVESTIGATE' : 'REJECT';

  const warnings: string[] = [];
  if (!input.withdrawalAvailability)
    warnings.push('CRITICAL: Withdrawal is halted on source exchange.');
  if (overallRisk.greaterThan(60)) warnings.push('High execution or transfer risk (> 60).');
  if (liquidityRatio.lessThan(2))
    warnings.push('Order book depth is thin relative to capital (< 2x).');

  return {
    inputs: input,
    outputs: {
      opportunityScore: Math.round(finalScore * 10) / 10,
      profitabilityScore: Math.round(profitScore.toNumber() * 10) / 10,
      liquidityScore: Math.round(liqScore.toNumber() * 10) / 10,
      executionRiskScore: Math.round(execRisk.toNumber() * 10) / 10,
      transferRiskScore: Math.round(transRisk.toNumber() * 10) / 10,
      overallRiskScore: Math.round(overallRisk.toNumber() * 10) / 10,
      grade,
      recommendation,
    },
    formula: 'Score = 0.45*Profitability + 0.35*Liquidity - 0.35*OverallRisk',
    assumptions: [
      'Multi-factor linear score mapping normalized to [0, 100]',
      'Withdrawal availability acts as an absolute gating condition',
    ],
    warnings,
    breakdown: {
      profitScore: profitScore.toNumber(),
      liqScore: liqScore.toNumber(),
      overallRisk: overallRisk.toNumber(),
    },
    executedAt: Date.now(),
  };
}
