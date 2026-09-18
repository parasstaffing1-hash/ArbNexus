import Decimal from 'decimal.js';
import { Opportunity } from '../types/opportunity.types';

export interface OpportunityRanking {
  rank: number;
  opportunity: Opportunity;
  netProfitUsd: number;
  netRoiPercent: number;
  capitalEfficiencyScore: number;
  overallScore: number;
}

export class OpportunityComparisonEngine {
  /**
   * Compares opportunities across all strategy types (CEX-CEX, CEX-DEX, DEX-DEX, Cross-Chain,
   * Triangular, Funding, Basis) using normalized financial and risk dimensions.
   */
  static rankOpportunities(opportunities: Opportunity[]): OpportunityRanking[] {
    const validOnly = opportunities.filter(
      (opp) => opp.lifecycle_state === 'VALID' || opp.lifecycle_state === 'DETECTED',
    );

    const scored = validOnly.map((opp) => {
      const netProfit = new Decimal(opp.expected_net_profit);
      const capital = new Decimal(opp.required_capital || 1);
      const roi = new Decimal(opp.expected_roi);

      // Capital efficiency: profit generated per $1,000 of capital
      const capitalEfficiency = capital.isZero() ? 0 : netProfit.div(capital).mul(1000).toNumber();

      // Risk discount
      let riskMultiplier = 1.0;
      if (opp.execution_risk === 'MEDIUM') riskMultiplier = 0.85;
      else if (opp.execution_risk === 'HIGH') riskMultiplier = 0.65;
      else if (opp.execution_risk === 'EXTREME') riskMultiplier = 0.35;

      const baseScore = opp.opportunity_score || 50;
      const overallScore = Math.min(100, Math.round(baseScore * riskMultiplier));

      return {
        opportunity: opp,
        netProfitUsd: netProfit.toNumber(),
        netRoiPercent: roi.toNumber(),
        capitalEfficiencyScore: capitalEfficiency,
        overallScore,
      };
    });

    // Sort descending by netProfitUsd and overallScore
    scored.sort((a, b) => {
      if (b.overallScore !== a.overallScore) {
        return b.overallScore - a.overallScore;
      }
      return b.netProfitUsd - a.netProfitUsd;
    });

    return scored.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
  }
}
