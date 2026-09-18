import * as d3 from 'd3';

export function calculateDepthScales(
  prices: number[],
  volumes: number[],
  width: number,
  height: number,
) {
  const minPrice = d3.min(prices) ?? 0;
  const maxPrice = d3.max(prices) ?? 1;
  const maxVolume = d3.max(volumes) ?? 1;

  const xScale = d3.scaleLinear().domain([minPrice, maxPrice]).range([0, width]);
  const yScale = d3.scaleLinear().domain([0, maxVolume]).range([height, 0]);

  return { xScale, yScale };
}

export function generateCumulativeDepth(levels: Array<{ price: number; amount: number }>) {
  let cumulative = 0;
  return levels.map((lvl) => {
    cumulative += lvl.amount;
    return {
      price: lvl.price,
      amount: lvl.amount,
      cumulative,
    };
  });
}
