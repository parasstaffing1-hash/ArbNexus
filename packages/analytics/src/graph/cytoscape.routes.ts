import type { ElementsDefinition, CytoscapeOptions } from 'cytoscape';

export interface RouteHop {
  fromToken: string;
  toToken: string;
  exchange: string;
  rate: number;
}

export function buildCytoscapeRouteElements(hops: RouteHop[]): ElementsDefinition {
  const nodeSet = new Set<string>();
  hops.forEach((hop) => {
    nodeSet.add(hop.fromToken);
    nodeSet.add(hop.toToken);
  });

  const nodes = Array.from(nodeSet).map((token) => ({
    data: { id: token, label: token },
  }));

  const edges = hops.map((hop, idx) => ({
    data: {
      id: `hop-${idx}`,
      source: hop.fromToken,
      target: hop.toToken,
      label: `${hop.exchange} (${hop.rate.toFixed(4)})`,
    },
  }));

  return { nodes, edges };
}

export function getCytoscapeArbitrageOptions(elements: ElementsDefinition): CytoscapeOptions {
  return {
    elements,
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#10b981',
          label: 'data(label)',
          color: '#ffffff',
          'font-size': '12px',
          'text-valign': 'center',
          'text-halign': 'center',
          width: 40,
          height: 40,
        },
      },
      {
        selector: 'edge',
        style: {
          width: 2,
          'line-color': '#3b82f6',
          'target-arrow-color': '#3b82f6',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          label: 'data(label)',
          color: '#a1a1aa',
          'font-size': '10px',
        },
      },
    ],
    layout: {
      name: 'circle',
    },
  };
}
