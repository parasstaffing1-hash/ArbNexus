import type { EChartsOption } from 'echarts';

export function buildOrderBookDepthOptions(
  bids: Array<[number, number]>,
  asks: Array<[number, number]>,
): EChartsOption {
  return {
    backgroundColor: '#09090b',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#18181b',
      borderColor: '#27272a',
      textStyle: { color: '#fafafa' },
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#3f3f46' } },
      splitLine: { lineStyle: { color: '#27272a' } },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#3f3f46' } },
      splitLine: { lineStyle: { color: '#27272a' } },
    },
    series: [
      {
        name: 'Bids',
        type: 'line',
        step: 'start',
        data: bids,
        areaStyle: { color: 'rgba(16, 185, 129, 0.2)' },
        lineStyle: { color: '#10b981', width: 2 },
      },
      {
        name: 'Asks',
        type: 'line',
        step: 'start',
        data: asks,
        areaStyle: { color: 'rgba(244, 63, 94, 0.2)' },
        lineStyle: { color: '#f43f5e', width: 2 },
      },
    ],
  };
}
