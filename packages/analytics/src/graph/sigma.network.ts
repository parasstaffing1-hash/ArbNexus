import Graph from 'graphology';

export interface NetworkNode {
  id: string;
  label: string;
  type: 'TOKEN' | 'EXCHANGE';
  size?: number;
  color?: string;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  label?: string;
  color?: string;
}

export function buildArbitrageTopologyGraph(nodes: NetworkNode[], edges: NetworkEdge[]): Graph {
  const graph = new Graph();

  for (const node of nodes) {
    if (!graph.hasNode(node.id)) {
      graph.addNode(node.id, {
        label: node.label,
        size: node.size ?? (node.type === 'TOKEN' ? 12 : 8),
        color: node.color ?? (node.type === 'TOKEN' ? '#10b981' : '#3b82f6'),
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }
  }

  for (const edge of edges) {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.addEdge(edge.source, edge.target, {
        weight: edge.weight,
        label: edge.label,
        size: Math.max(1, Math.min(edge.weight * 5, 8)),
        color: edge.color ?? '#52525b',
      });
    }
  }

  return graph;
}
