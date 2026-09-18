import Decimal from 'decimal.js';

export interface RouteCandidate {
  routeId: string;
  expectedNetProfitUsd: Decimal;
  latencyMs: number;
  gasCostUsd: Decimal;
  bridgeFeeUsd: Decimal;
  successProbability: number; // 0 - 1
}

export class RouteOptimizer {
  /**
   * Selects best route balancing Expected Profit against Latency Penalty and Failure Risk.
   * Objective = NetProfit * SuccessProb - LatencyDrag(ms)
   */
  static selectBestRoute(
    routes: RouteCandidate[],
    latencyCostPer100msUsd: Decimal = new Decimal('1.50'),
  ): RouteCandidate | null {
    if (routes.length === 0) return null;

    let bestRoute: RouteCandidate | null = null;
    let maxObjectiveScore = new Decimal(-Infinity);

    for (const r of routes) {
      const latencyPenalty = new Decimal(r.latencyMs).div(100).mul(latencyCostPer100msUsd);
      const expectedValue = r.expectedNetProfitUsd.mul(r.successProbability);
      const objectiveScore = expectedValue.minus(latencyPenalty);

      if (objectiveScore.gt(maxObjectiveScore)) {
        maxObjectiveScore = objectiveScore;
        bestRoute = r;
      }
    }

    return bestRoute;
  }
}
