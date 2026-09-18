import Decimal from 'decimal.js';
import { ScoreBreakdown } from '../types/opportunity.types';

export interface OpportunityScoringInput {
  netProfitUsd: number;
  expectedRoiPercent: number;
  liquidityUsd: number;
  tradeCapitalUsd: number;
  totalFeesUsd: number;
  slippageUsd: number;
  estimatedDurationMs: number;
  latencyMs: number;
  dataQualityStatus: string;
  compositeRiskScore: number; // 0 - 100
}

export type LetterGrade = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'D';

export class AdvancedOpportunityScorer {
  /**
   * Deterministic multi-dimensional opportunity scorer.
   * Uses explainable weights without black-box ML/LLM calculation.
   */
  static calculateScore(input: OpportunityScoringInput): {
    opportunityScore: number;
    letterGrade: LetterGrade;
    scoreBreakdown: ScoreBreakdown;
  } {
    // 1. Profitability Score (based on ROI and Net Profit)
    let profitabilityScore = 50;
    if (input.netProfitUsd <= 0) {
      profitabilityScore = 0;
    } else {
      const roiFactor = Math.min(60, input.expectedRoiPercent * 25);
      const absFactor = Math.min(40, Math.log10(Math.max(1, input.netProfitUsd)) * 12);
      profitabilityScore = Math.min(100, Math.round(roiFactor + absFactor));
    }

    // 2. Liquidity Score (depth relative to capital)
    const depthRatio = input.tradeCapitalUsd / Math.max(1, input.liquidityUsd);
    let liquidityScore = 100;
    if (depthRatio > 0.2) {
      liquidityScore = 20;
    } else if (depthRatio > 0.1) {
      liquidityScore = 55;
    } else if (depthRatio > 0.05) {
      liquidityScore = 80;
    } else {
      liquidityScore = 95;
    }

    // 3. Execution Score (slippage and fees impact)
    const costRatio = (input.totalFeesUsd + input.slippageUsd) / Math.max(1, input.tradeCapitalUsd);
    let executionScore = Math.max(0, Math.min(100, Math.round((1 - costRatio * 5) * 100)));
    if (input.latencyMs > 100) executionScore = Math.max(0, executionScore - 20);

    // 4. Data Quality Score
    let dataQualityScore = 95;
    if (input.dataQualityStatus === 'STALE') dataQualityScore = 30;
    else if (input.dataQualityStatus === 'SUSPECT') dataQualityScore = 10;
    else if (input.dataQualityStatus === 'INVALID') dataQualityScore = 0;

    // 5. Duration Score (faster execution / turnover = higher capital velocity)
    let durationScore = 90;
    if (input.estimatedDurationMs > 86400000) {
      // > 24 hours
      durationScore = 40;
    } else if (input.estimatedDurationMs > 3600000) {
      // > 1 hour
      durationScore = 65;
    } else if (input.estimatedDurationMs > 60000) {
      // > 1 minute
      durationScore = 80;
    }

    // 6. Capital Efficiency Score (ROI relative to duration)
    let capitalEfficiencyScore = Math.min(100, Math.round(input.expectedRoiPercent * 30 + 40));

    // 7. Risk Inverted Score (100 - risk)
    const riskScore = Math.max(0, 100 - input.compositeRiskScore);

    // Weights: Profitability (25%), Liquidity (20%), Execution (15%), Data Quality (15%), Duration (10%), Capital Efficiency (10%), Risk (5%)
    const compositeScore = Math.round(
      profitabilityScore * 0.25 +
        liquidityScore * 0.2 +
        executionScore * 0.15 +
        dataQualityScore * 0.15 +
        durationScore * 0.1 +
        capitalEfficiencyScore * 0.1 +
        riskScore * 0.05,
    );

    const boundedScore = Math.max(0, Math.min(100, compositeScore));

    let letterGrade: LetterGrade = 'BBB';
    if (boundedScore >= 95) letterGrade = 'AAA';
    else if (boundedScore >= 88) letterGrade = 'AA';
    else if (boundedScore >= 80) letterGrade = 'A';
    else if (boundedScore >= 70) letterGrade = 'BBB';
    else if (boundedScore >= 60) letterGrade = 'BB';
    else if (boundedScore >= 50) letterGrade = 'B';
    else if (boundedScore >= 40) letterGrade = 'CCC';
    else letterGrade = 'D';

    const scoreBreakdown: ScoreBreakdown = {
      profitabilityScore,
      liquidityScore,
      executionScore,
      dataQualityScore,
      durationScore,
      capitalEfficiencyScore,
      riskScore,
      compositeScore: boundedScore,
    };

    return {
      opportunityScore: boundedScore,
      letterGrade,
      scoreBreakdown,
    };
  }
}
