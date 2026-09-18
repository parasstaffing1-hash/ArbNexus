import Decimal from 'decimal.js';
import { ArbitrageDetector } from './detector.interface';
import { Opportunity } from '../types/opportunity.types';
import { MarketGraph, CycleDetector, RouteScorer } from '@arbitrage/graph-engine';
import { OpportunityRiskEngine } from '@arbitrage/risk';
import { AdvancedOpportunityScorer } from '../scoring/opportunity-scorer';

export interface TriangularDetectorContext {
  graph: MarketGraph;
  rootAsset?: string;
  tradeCapitalUsd?: number;
  minProfitBps?: number;
}

export class TriangularDetector implements ArbitrageDetector {
  readonly detectorName = 'TriangularDetector';

  async detect(context: TriangularDetectorContext): Promise<Opportunity[]> {
    const { graph, rootAsset = 'USDT', tradeCapitalUsd = 10000, minProfitBps = 5 } = context;

    const opportunities: Opportunity[] = [];
    const cycles = CycleDetector.findProfitableCycles(graph, rootAsset, 3, minProfitBps);

    for (const c of cycles) {
      if (!c.legs || c.legs.length < 3) continue;

      const now = Date.now();
      const scoredRoute = RouteScorer.scoreAndOptimizeRoute(c.legs, new Decimal(tradeCapitalUsd));

      if (scoredRoute.netProfit.lte(0)) continue;

      // 8-factor risk evaluation
      const riskBreakdown = OpportunityRiskEngine.evaluateRisk({
        strategyType: 'TRIANGULAR',
        venues: c.venues,
        chains: c.chains,
        requiredCapitalUsd: tradeCapitalUsd,
        bottleneckLiquidityUsd: scoredRoute.bottleneckLiquidityUsd.toNumber(),
        estimatedDurationMs: 45,
        latencyMs: 35,
        dataQualityStatus: 'VALID',
      });

      // Explainable multi-factor scoring
      const { opportunityScore, letterGrade, scoreBreakdown } =
        AdvancedOpportunityScorer.calculateScore({
          netProfitUsd: scoredRoute.netProfit.toNumber(),
          expectedRoiPercent: scoredRoute.roiPercent.toNumber(),
          liquidityUsd: scoredRoute.bottleneckLiquidityUsd.toNumber(),
          tradeCapitalUsd,
          totalFeesUsd: scoredRoute.totalFeesUsd.toNumber(),
          slippageUsd: scoredRoute.totalSlippageUsd.toNumber(),
          estimatedDurationMs: 45,
          latencyMs: 35,
          dataQualityStatus: 'VALID',
          compositeRiskScore: riskBreakdown.compositeRiskScore,
        });

      const routeHash = `triangular-${c.cyclePath.join('-')}-${c.venues.join('-')}`;

      opportunities.push({
        id: `opp-triangular-${c.cyclePath.join('-')}-${now}`,
        strategy_type: 'TRIANGULAR',
        lifecycle_state: 'DETECTED',
        asset: c.cyclePath.join(' -> '),
        venues: Array.from(new Set(c.venues)),
        chains: Array.from(new Set(c.chains && c.chains.length > 0 ? c.chains : ['off-chain'])),
        entry_price: '1.0000',
        exit_price: scoredRoute.grossMultiplier.toFixed(6),
        gross_spread: scoredRoute.grossMultiplier.minus(1).toFixed(6),
        gross_profit: scoredRoute.finalAmount
          .minus(tradeCapitalUsd)
          .plus(scoredRoute.totalFeesUsd)
          .toFixed(2),
        trading_fees: scoredRoute.totalFeesUsd.toFixed(2),
        withdrawal_fees: '0.00',
        gas_cost: scoredRoute.totalGasUsd.toFixed(2),
        bridge_cost: '0.00',
        slippage: scoredRoute.totalSlippageUsd.toFixed(2),
        expected_net_profit: scoredRoute.netProfit.toFixed(2),
        expected_roi: scoredRoute.roiPercent.toFixed(3),
        required_capital: tradeCapitalUsd.toString(),
        max_executable_size: scoredRoute.maxExecutableCapitalUsd.toFixed(2),
        estimated_duration_ms: scoredRoute.totalLatencyMs,
        latency: {
          exchangeTimestamp: now - 35,
          receiveTimestamp: now - 15,
          normalizationTimestamp: now,
          sourceLatencyMs: 20,
          pipelineLatencyMs: 15,
          totalLatencyMs: 35,
        },
        liquidity_score: scoreBreakdown.liquidityScore,
        data_quality: 'VALID',
        execution_risk: riskBreakdown.riskCategory,
        opportunity_score: opportunityScore,
        letter_grade: letterGrade,
        timestamp: now,
        detected_at: now,
        last_valid_at: now,
        expires_at: now + 5000,
        expiration: now + 5000,
        route_hash: routeHash,
        route: scoredRoute.legs.map((l) => ({
          venue: l.venue,
          chain: l.chain,
          action: 'swap',
          fromAsset: l.fromAsset,
          toAsset: l.toAsset,
          price: l.rate.toFixed(6),
          amount: l.expectedOutput.toFixed(4),
          feeUsd: l.feeUsd ? l.feeUsd.toFixed(2) : '0.00',
        })),
        profit_checkpoints: scoredRoute.profitCheckpoints,
        risk_breakdown: riskBreakdown,
        score_breakdown: scoreBreakdown,
        strategy_metadata: {
          optimalTradeSizeUsd: scoredRoute.optimalSizeUsd.toNumber(),
          cycleHops: 3,
          startAsset: c.cyclePath[0],
          cycleAssets: c.cyclePath,
        },
      });
    }

    return opportunities;
  }
}
