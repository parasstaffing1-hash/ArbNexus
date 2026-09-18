import Decimal from 'decimal.js';

export interface RiskBreakdown {
  marketRisk: number; // 0 (safe) - 100 (extreme)
  liquidityRisk: number;
  latencyRisk: number;
  venueRisk: number;
  fundingRisk: number;
  basisRisk: number;
  transferRisk: number;
  dataQualityRisk: number;
  compositeRiskScore: number; // 0 - 100
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  riskFactors: string[];
}

export interface RiskEvaluationInput {
  strategyType: string;
  venues: string[];
  chains?: string[];
  requiredCapitalUsd: number;
  bottleneckLiquidityUsd: number;
  estimatedDurationMs: number;
  latencyMs: number;
  dataQualityStatus?: string;
  fundingRatePercent?: number;
  basisBps?: number;
  isCrossChain?: boolean;
}

export class OpportunityRiskEngine {
  /**
   * Evaluates transparent 8-factor risk decomposition.
   * Returns individual dimensional scores (0-100) and composite category.
   */
  static evaluateRisk(input: RiskEvaluationInput): RiskBreakdown {
    const riskFactors: string[] = [];

    // 1. Liquidity Risk (capital required relative to bottleneck liquidity)
    const capital = input.requiredCapitalUsd;
    const depth = Math.max(1, input.bottleneckLiquidityUsd);
    const depthRatio = capital / depth;
    let liquidityRisk = Math.min(100, Math.round(depthRatio * 300));
    if (depthRatio > 0.15) {
      riskFactors.push(
        `Capital represents ${(depthRatio * 100).toFixed(1)}% of bottleneck pool depth`,
      );
    }

    // 2. Latency Risk (network and execution pipeline latency)
    let latencyRisk = Math.min(100, Math.round((input.latencyMs / 200) * 100));
    if (input.latencyMs > 100) {
      riskFactors.push(`High pipeline latency (${input.latencyMs}ms)`);
    }

    // 3. Market Risk (strategy duration exposure)
    let marketRisk = 10;
    if (input.estimatedDurationMs > 3600000) {
      // > 1 hour
      marketRisk = 65;
      riskFactors.push('Prolonged market exposure (> 1 hour holding duration)');
    } else if (input.estimatedDurationMs > 60000) {
      // > 1 minute
      marketRisk = 35;
    } else {
      marketRisk = 15;
    }

    // 4. Venue Risk (counterparty / exchange tier / DEX smart contract risk)
    let venueRisk = 15;
    const hasDex = input.venues.some(
      (v) => v.includes('uniswap') || v.includes('raydium') || v.includes('orca'),
    );
    if (hasDex) venueRisk += 15;
    if (input.venues.length >= 3) venueRisk += 20;

    // 5. Funding Risk (for derivatives / perpetuals)
    let fundingRisk = 0;
    if (input.strategyType === 'FUNDING' || input.strategyType === 'PERP_PERP') {
      const fr = Math.abs(input.fundingRatePercent ?? 0.01);
      fundingRisk = Math.min(100, Math.round(fr * 500));
      if (fr > 0.05) {
        riskFactors.push(`High funding rate volatility (${(fr * 100).toFixed(2)}%)`);
      }
    }

    // 6. Basis Risk (spot-perp or futures basis convergence)
    let basisRisk = 0;
    if (input.strategyType === 'BASIS' || input.strategyType === 'STATISTICAL') {
      const basis = Math.abs(input.basisBps ?? 20);
      basisRisk = Math.min(100, Math.round(basis * 1.5));
      if (basis > 50) {
        riskFactors.push(`Wide basis spread (${basis} bps) with convergence uncertainty`);
      }
    }

    // 7. Transfer & Bridge Risk (cross-chain finality / bridge lockup)
    let transferRisk = 0;
    if (input.isCrossChain || (input.chains && input.chains.length > 1)) {
      transferRisk = 60;
      riskFactors.push('Cross-chain bridge settlement delay and reorg risk');
    }

    // 8. Data Quality Risk
    let dataQualityRisk = 10;
    if (input.dataQualityStatus === 'STALE') {
      dataQualityRisk = 85;
      riskFactors.push('Market data is stale / delayed');
    } else if (input.dataQualityStatus === 'SUSPECT') {
      dataQualityRisk = 95;
      riskFactors.push('Anomalous ticker or orderbook spread detected');
    }

    // Composite Weighted Score
    const compositeRiskScore = Math.round(
      liquidityRisk * 0.25 +
        marketRisk * 0.15 +
        latencyRisk * 0.15 +
        venueRisk * 0.1 +
        fundingRisk * 0.1 +
        basisRisk * 0.1 +
        transferRisk * 0.1 +
        dataQualityRisk * 0.05,
    );

    let riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'LOW';
    if (compositeRiskScore >= 75 || dataQualityRisk >= 80) {
      riskCategory = 'EXTREME';
    } else if (compositeRiskScore >= 50) {
      riskCategory = 'HIGH';
    } else if (compositeRiskScore >= 25) {
      riskCategory = 'MEDIUM';
    }

    return {
      marketRisk,
      liquidityRisk,
      latencyRisk,
      venueRisk,
      fundingRisk,
      basisRisk,
      transferRisk,
      dataQualityRisk,
      compositeRiskScore,
      riskCategory,
      riskFactors,
    };
  }
}
