import Decimal from 'decimal.js';
import { MarketGraph } from './market-graph';
import { GraphRouteLeg, MarketEdge, RoutePruningConfig } from './types';

export interface RouteFinderPath {
  pathId: string;
  assets: string[];
  venues: string[];
  chains: string[];
  legs: GraphRouteLeg[];
  grossRate: Decimal;
  effectiveRate: Decimal;
  totalFeeBps: number;
  bottleneckLiquidityUsd: Decimal;
  totalLatencyMs: number;
}

export class RouteFinder {
  /**
   * Discovers paths from sourceAsset to targetAsset across multiple venues (CEX, DEX, Bridges).
   * Supports maximum hops (2 to 5) with pruning on fees, liquidity, and latency.
   */
  static findPaths(
    graph: MarketGraph,
    sourceAsset: string,
    targetAsset: string,
    config?: RoutePruningConfig,
  ): RouteFinderPath[] {
    const maxHops = config?.maxHops ?? 4;
    const paths: RouteFinderPath[] = [];

    const dfs = (
      currentAsset: string,
      visited: Set<string>,
      currentLegs: GraphRouteLeg[],
      currentMultiplier: Decimal,
      totalFeeBps: number,
      minLiquidity: Decimal,
      totalLatency: number,
    ) => {
      if (currentLegs.length > maxHops) return;

      if (currentAsset === targetAsset && currentLegs.length > 0) {
        const pathId = `route-${currentLegs.map((l) => `${l.fromAsset}_${l.venue}`).join('-')}-${targetAsset}`;
        paths.push({
          pathId,
          assets: [currentLegs[0].fromAsset, ...currentLegs.map((l) => l.toAsset)],
          venues: currentLegs.map((l) => l.venue),
          chains: currentLegs.map((l) => l.chain || 'off-chain'),
          legs: [...currentLegs],
          grossRate: currentMultiplier,
          effectiveRate: currentMultiplier,
          totalFeeBps,
          bottleneckLiquidityUsd: minLiquidity,
          totalLatencyMs: totalLatency,
        });
        return;
      }

      if (currentLegs.length === maxHops) return;

      const outEdges = graph.getFilteredOutEdges(currentAsset, config);
      for (const edge of outEdges) {
        if (visited.has(edge.toAsset)) continue;

        const feeMult = new Decimal(10000 - edge.feeBps).div(10000);
        const nextMultiplier = currentMultiplier.mul(edge.rate).mul(feeMult);
        const nextMinLiquidity = Decimal.min(minLiquidity, edge.availableLiquidityUsd);

        const leg: GraphRouteLeg = {
          fromAsset: edge.fromAsset,
          toAsset: edge.toAsset,
          venue: edge.venue,
          chain: edge.chain,
          instrument: edge.instrument,
          rate: edge.rate,
          feeBps: edge.feeBps,
          expectedOutput: nextMultiplier,
          liquidityUsd: edge.availableLiquidityUsd,
          gasUsd: edge.gasUsd,
        };

        visited.add(edge.toAsset);
        dfs(
          edge.toAsset,
          visited,
          [...currentLegs, leg],
          nextMultiplier,
          totalFeeBps + edge.feeBps,
          nextMinLiquidity,
          totalLatency + edge.estimatedLatencyMs,
        );
        visited.delete(edge.toAsset);
      }
    };

    const visited = new Set<string>([sourceAsset]);
    dfs(sourceAsset, visited, [], new Decimal(1), 0, new Decimal(Infinity), 0);

    return paths.sort((a, b) => b.effectiveRate.minus(a.effectiveRate).toNumber());
  }

  /**
   * Deterministic route hash for path deduplication.
   */
  static generateRouteHash(path: RouteFinderPath): string {
    const routeSignature = path.legs
      .map((l) => `${l.fromAsset}:${l.toAsset}:${l.venue}:${l.chain || 'off-chain'}`)
      .join('->');
    return `hash-${routeSignature}`;
  }
}
