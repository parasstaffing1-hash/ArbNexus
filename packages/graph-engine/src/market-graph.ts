import Graph from 'graphology';
import Decimal from 'decimal.js';
import { MarketNode, MarketEdge, RoutePruningConfig } from './types';

export class MarketGraph {
  private graph: Graph;

  constructor() {
    this.graph = new Graph({ multi: true, type: 'directed' });
  }

  addNode(asset: string, attributes?: Partial<MarketNode>): void {
    if (!this.graph.hasNode(asset)) {
      this.graph.addNode(asset, { asset, ...attributes });
    }
  }

  addEdge(edge: MarketEdge): void {
    this.addNode(edge.fromAsset);
    this.addNode(edge.toAsset);

    // Calculate negative log weight: -ln(rate * (1 - fee))
    const feeMult = new Decimal(10000 - edge.feeBps).div(10000);
    const effectiveRate = edge.rate.mul(feeMult);
    const weight = -Math.log(Math.max(1e-12, effectiveRate.toNumber()));

    if (this.graph.hasEdge(edge.id)) {
      this.graph.dropEdge(edge.id);
    }

    this.graph.addEdgeWithKey(edge.id, edge.fromAsset, edge.toAsset, {
      ...edge,
      weight,
    });
  }

  upsertEdge(edge: MarketEdge): void {
    this.addEdge(edge);
  }

  removeEdge(edgeId: string): boolean {
    if (this.graph.hasEdge(edgeId)) {
      this.graph.dropEdge(edgeId);
      return true;
    }
    return false;
  }

  removeStaleEdges(maxAgeMs: number = 60000): number {
    const now = Date.now();
    let removed = 0;
    this.graph.forEachEdge((edgeKey, attributes) => {
      const edge = attributes as MarketEdge;
      if (now - edge.timestamp > maxAgeMs) {
        this.graph.dropEdge(edgeKey);
        removed++;
      }
    });
    return removed;
  }

  getNodes(): string[] {
    return this.graph.nodes();
  }

  getEdges(): MarketEdge[] {
    const edges: MarketEdge[] = [];
    this.graph.forEachEdge((_key, attributes) => {
      edges.push(attributes as MarketEdge);
    });
    return edges;
  }

  nodeCount(): number {
    return this.graph.order;
  }

  edgeCount(): number {
    return this.graph.size;
  }

  getNeighbors(asset: string): string[] {
    if (!this.graph.hasNode(asset)) return [];
    return this.graph.outNeighbors(asset);
  }

  getOutEdges(asset: string): MarketEdge[] {
    if (!this.graph.hasNode(asset)) return [];
    const edges: MarketEdge[] = [];
    this.graph.forEachOutEdge(asset, (_key, attributes) => {
      edges.push(attributes as MarketEdge);
    });
    return edges;
  }

  getFilteredOutEdges(asset: string, config?: RoutePruningConfig): MarketEdge[] {
    const raw = this.getOutEdges(asset);
    if (!config) return raw;

    const now = Date.now();
    return raw.filter((edge) => {
      // 1. Freshness filter
      if (config.maxDataAgeMs && now - edge.timestamp > config.maxDataAgeMs) {
        return false;
      }
      // 2. Liquidity filter
      if (config.minLiquidityUsd && edge.availableLiquidityUsd.lt(config.minLiquidityUsd)) {
        return false;
      }
      // 3. Max fee hurdle
      if (config.maxFeeBps !== undefined && edge.feeBps > config.maxFeeBps) {
        return false;
      }
      // 4. Venue filter
      if (config.allowedVenues && !config.allowedVenues.includes(edge.venue)) {
        return false;
      }
      // 5. Chain filter
      if (config.allowedChains && edge.chain && !config.allowedChains.includes(edge.chain)) {
        return false;
      }
      return true;
    });
  }

  clear(): void {
    this.graph.clear();
  }
}

export const ArbitrageGraph = MarketGraph;
