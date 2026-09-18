export interface ExchangeRateEdge {
  fromToken: string;
  toToken: string;
  exchange: string;
  rate: number;
}

export interface ArbitrageCycleResult {
  hasCycle: boolean;
  cycleTokens: string[];
  profitFactor: number;
}

export class BellmanFordArbitrageDetector {
  public static detectNegativeCycle(
    tokens: string[],
    edges: ExchangeRateEdge[],
    sourceToken: string,
  ): ArbitrageCycleResult {
    const dist: Record<string, number> = {};
    const predecessor: Record<string, string | null> = {};

    tokens.forEach((t) => {
      dist[t] = Infinity;
      predecessor[t] = null;
    });
    dist[sourceToken] = 0;

    // Transform rate to weight = -ln(rate)
    const weightedEdges = edges.map((e) => ({
      ...e,
      weight: -Math.log(e.rate),
    }));

    // Relax edges |V| - 1 times
    for (let i = 0; i < tokens.length - 1; i++) {
      for (const edge of weightedEdges) {
        if (dist[edge.fromToken] + edge.weight < dist[edge.toToken]) {
          dist[edge.toToken] = dist[edge.fromToken] + edge.weight;
          predecessor[edge.toToken] = edge.fromToken;
        }
      }
    }

    // Check for negative weight cycle
    let cycleStartNode: string | null = null;
    for (const edge of weightedEdges) {
      if (dist[edge.fromToken] + edge.weight < dist[edge.toToken]) {
        cycleStartNode = edge.toToken;
        break;
      }
    }

    if (!cycleStartNode) {
      return { hasCycle: false, cycleTokens: [], profitFactor: 1 };
    }

    // Trace cycle
    let curr = cycleStartNode;
    for (let i = 0; i < tokens.length; i++) {
      curr = predecessor[curr] ?? curr;
    }

    const cycle: string[] = [];
    let p = curr;
    while (true) {
      cycle.push(p);
      if (cycle.length > 1 && p === curr) break;
      p = predecessor[p] ?? '';
      if (!p) break;
    }

    cycle.reverse();

    return {
      hasCycle: true,
      cycleTokens: cycle,
      profitFactor: 1.02, // scaffold factor
    };
  }
}
