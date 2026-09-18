import Decimal from 'decimal.js';
import { CrossChainCostEngine, CrossChainCostBreakdown } from './cross-chain-cost.engine';

export interface CrossChainRouteCandidate {
  routeId: string;
  sourceChain: string;
  sourceDex: string;
  bridge: string;
  destinationChain: string;
  destinationDex: string;
  asset: string;
  sourcePrice: Decimal;
  destinationPrice: Decimal;
  tradeCapitalUsd: Decimal;
  costs: CrossChainCostBreakdown;
  grossProfitUsd: Decimal;
  netProfitUsd: Decimal;
  netRoiPercent: Decimal;
  liquidityDepthUsd: Decimal;
  estimatedDurationSeconds: number;
}

export interface CrossChainRouteAnalysis {
  best_profit_route: CrossChainRouteCandidate | null;
  lowest_cost_route: CrossChainRouteCandidate | null;
  fastest_route: CrossChainRouteCandidate | null;
  most_liquid_route: CrossChainRouteCandidate | null;
  all_routes: CrossChainRouteCandidate[];
}

export class CrossChainRouteEngine {
  /**
   * Evaluates alternative routes across source DEX, bridge, and destination DEX.
   */
  static evaluateRoutes(candidates: CrossChainRouteCandidate[]): CrossChainRouteAnalysis {
    const validCandidates = candidates.filter((c) => c.costs.is_valid);
    if (validCandidates.length === 0) {
      return {
        best_profit_route: null,
        lowest_cost_route: null,
        fastest_route: null,
        most_liquid_route: null,
        all_routes: candidates,
      };
    }

    const bestProfit = validCandidates
      .slice()
      .sort((a, b) => b.netProfitUsd.minus(a.netProfitUsd).toNumber())[0];
    const lowestCost = validCandidates
      .slice()
      .sort((a, b) => a.costs.total_cost_usd.minus(b.costs.total_cost_usd).toNumber())[0];
    const fastest = validCandidates
      .slice()
      .sort((a, b) => a.estimatedDurationSeconds - b.estimatedDurationSeconds)[0];
    const mostLiquid = validCandidates
      .slice()
      .sort((a, b) => b.liquidityDepthUsd.minus(a.liquidityDepthUsd).toNumber())[0];

    return {
      best_profit_route: bestProfit,
      lowest_cost_route: lowestCost,
      fastest_route: fastest,
      most_liquid_route: mostLiquid,
      all_routes: candidates,
    };
  }
}
