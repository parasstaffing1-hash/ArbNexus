import Decimal from 'decimal.js';
import { MarketGraph } from './market-graph';
import { CycleArbitrageCandidate, MarketEdge, RoutePruningConfig, GraphRouteLeg } from './types';

export class CycleDetector {
  /**
   * Finds triangular and multi-hop profitable arbitrage cycles starting and ending at rootAsset.
   * Uses depth-limited DFS up to maxHops (3, 4, or 5) with combinatorial route pruning.
   */
  static findProfitableCycles(
    graph: MarketGraph,
    rootAsset: string = 'USDT',
    maxHops: number = 3,
    minNetProfitBps: number = 5, // at least 0.05% profit after fees
    pruningConfig?: RoutePruningConfig,
  ): CycleArbitrageCandidate[] {
    const candidates: CycleArbitrageCandidate[] = [];
    const effectiveMaxHops = pruningConfig?.maxHops ?? maxHops;
    const minProfit = pruningConfig?.minNetProfitBps ?? minNetProfitBps;

    const dfs = (
      currentAsset: string,
      path: string[],
      venues: string[],
      chains: string[],
      legs: GraphRouteLeg[],
      currentMultiplier: Decimal,
      visited: Set<string>,
    ) => {
      const currentHops = path.length - 1;
      if (currentHops > effectiveMaxHops) return;

      if (currentHops >= 2 && currentAsset === rootAsset) {
        // Closed cycle found!
        const profitBps = currentMultiplier.minus(1).mul(10000);
        if (profitBps.gte(minProfit)) {
          candidates.push({
            cyclePath: [...path],
            venues: [...venues],
            chains: [...chains],
            grossMultiplier: currentMultiplier,
            netMultiplier: currentMultiplier,
            estimatedProfitBps: profitBps,
            legs: [...legs],
          });
        }
        return;
      }

      if (currentHops === effectiveMaxHops) return;

      const outEdges = graph.getFilteredOutEdges(currentAsset, pruningConfig);
      for (const edge of outEdges) {
        const nextAsset = edge.toAsset;

        // Allow closing cycle to rootAsset, but prevent cycles revisiting other nodes
        if (nextAsset !== rootAsset && visited.has(nextAsset)) continue;

        const feeMult = new Decimal(10000 - edge.feeBps).div(10000);
        const nextMultiplier = currentMultiplier.mul(edge.rate).mul(feeMult);

        const leg: GraphRouteLeg = {
          fromAsset: edge.fromAsset,
          toAsset: edge.toAsset,
          venue: edge.venue,
          chain: edge.chain,
          rate: edge.rate,
          feeBps: edge.feeBps,
          expectedOutput: nextMultiplier,
          liquidityUsd: edge.availableLiquidityUsd,
          gasUsd: edge.gasUsd,
        };

        visited.add(nextAsset);
        dfs(
          nextAsset,
          [...path, nextAsset],
          [...venues, edge.venue],
          [...chains, edge.chain || 'off-chain'],
          [...legs, leg],
          nextMultiplier,
          visited,
        );
        visited.delete(nextAsset);
      }
    };

    const visited = new Set<string>([rootAsset]);
    dfs(rootAsset, [rootAsset], [], [], [], new Decimal(1), visited);

    return candidates.sort((a, b) => b.estimatedProfitBps.minus(a.estimatedProfitBps).toNumber());
  }

  /**
   * Bellman-Ford Negative Cycle Detection across all assets.
   * Since edge weights are -ln(rate * (1 - fee)), a negative cycle corresponds to product > 1.
   */
  static detectNegativeCycles(graph: MarketGraph, source: string = 'USDT'): string[][] {
    const nodes = graph.getNodes();
    const edges = graph.getEdges();
    if (nodes.length === 0 || edges.length === 0) return [];

    const dist: Record<string, number> = {};
    const pred: Record<string, string | null> = {};

    for (const node of nodes) {
      dist[node] = Infinity;
      pred[node] = null;
    }
    dist[source] = 0;

    // Relax edges |V| - 1 times
    for (let i = 0; i < nodes.length - 1; i++) {
      for (const edge of edges) {
        if (dist[edge.fromAsset] !== Infinity) {
          if (dist[edge.fromAsset] + edge.weight < dist[edge.toAsset]) {
            dist[edge.toAsset] = dist[edge.fromAsset] + edge.weight;
            pred[edge.toAsset] = edge.fromAsset;
          }
        }
      }
    }

    // Check for negative weight cycles
    const cycles: string[][] = [];
    for (const edge of edges) {
      if (dist[edge.fromAsset] !== Infinity) {
        if (dist[edge.fromAsset] + edge.weight < dist[edge.toAsset] - 1e-6) {
          // Negative cycle detected! Trace back
          let curr = edge.toAsset;
          const cycle: string[] = [];
          const seen = new Set<string>();

          while (curr && !seen.has(curr)) {
            seen.add(curr);
            curr = pred[curr] ?? '';
          }

          if (curr) {
            const startNode = curr;
            cycle.push(startNode);
            let trace = pred[startNode];
            while (trace && trace !== startNode) {
              cycle.push(trace);
              trace = pred[trace];
            }
            cycle.push(startNode);
            cycles.push(cycle.reverse());
          }
          break;
        }
      }
    }

    return cycles;
  }
}
