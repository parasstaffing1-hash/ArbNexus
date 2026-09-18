import { ChartOptions, DeepPartial, ColorType } from 'lightweight-charts';

export function getTradingViewDefaultOptions(): DeepPartial<ChartOptions> {
  return {
    layout: {
      background: { type: ColorType.Solid, color: '#09090b' },
      textColor: '#a1a1aa',
    },
    grid: {
      vertLines: { color: '#18181b' },
      horzLines: { color: '#18181b' },
    },
    crosshair: {
      vertLine: { color: '#10b981', width: 1, style: 2 },
      horzLine: { color: '#10b981', width: 1, style: 2 },
    },
    timeScale: {
      borderColor: '#27272a',
      timeVisible: true,
      secondsVisible: false,
    },
  };
}
