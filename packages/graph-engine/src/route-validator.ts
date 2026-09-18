import Decimal from 'decimal.js';
import { GraphRoute, GraphRouteLeg } from './types';
import { RouteScorer } from './route-scorer';

export class GraphRouteValidator {
  /**
   * Evaluates end-to-end execution of a candidate cycle or multi-hop path
   * considering trade capital, liquidity bottlenecks, and slippage.
   */
  static validateAndSizeRoute(
    legs: {
      fromAsset: string;
      toAsset: string;
      venue: string;
      rate: Decimal;
      feeBps: number;
      availableLiquidityUsd: Decimal;
      latencyMs: number;
    }[],
    tradeCapitalUsd: Decimal = new Decimal(10000),
  ): GraphRoute {
    const convertedLegs: GraphRouteLeg[] = legs.map((l) => ({
      fromAsset: l.fromAsset,
      toAsset: l.toAsset,
      venue: l.venue,
      rate: l.rate,
      feeBps: l.feeBps,
      expectedOutput: l.rate.mul(tradeCapitalUsd),
      liquidityUsd: l.availableLiquidityUsd,
    }));

    return RouteScorer.scoreAndOptimizeRoute(convertedLegs, tradeCapitalUsd);
  }
}
