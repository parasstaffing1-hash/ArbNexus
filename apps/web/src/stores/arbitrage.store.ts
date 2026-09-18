import { create } from 'zustand';
import { ArbitrageOpportunity, Ticker } from '@arbitrage/shared';

export type DataMode = 'LIVE' | 'DEMO' | 'REPLAY' | 'BACKTEST';

export interface ExchangeHealthItem {
  exchange: string;
  status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'DEGRADED' | 'STALE' | 'ERROR';
  latencyMs: number;
  uptimeSeconds: number;
  messageRate: number;
}

export interface LatencyBreakdown {
  sourceLatencyMs: number;
  pipelineLatencyMs: number;
  totalLatencyMs: number;
}

interface ArbitrageState {
  dataMode: DataMode;
  opportunities: ArbitrageOpportunity[];
  tickers: Record<string, Ticker>;
  selectedStrategy: string;
  isScanning: boolean;
  minSpread: number;
  latency: LatencyBreakdown;
  dataQuality: 'VALID' | 'STALE' | 'DEGRADED';
  connectedExchanges: ExchangeHealthItem[];
  connectedFeedsCount: number;

  setDataMode: (mode: DataMode) => void;
  setOpportunities: (opps: ArbitrageOpportunity[]) => void;
  addOpportunity: (opp: ArbitrageOpportunity) => void;
  removeStaleOpportunities: (maxAgeMs?: number) => void;
  updateTicker: (symbol: string, ticker: Ticker) => void;
  setSelectedStrategy: (strategy: string) => void;
  setIsScanning: (scanning: boolean) => void;
  setMinSpread: (minSpread: number) => void;
  setLatency: (latency: Partial<LatencyBreakdown>) => void;
  setExchangeStatuses: (statuses: ExchangeHealthItem[]) => void;
}

export const useArbitrageStore = create<ArbitrageState>((set) => ({
  dataMode: 'LIVE',
  opportunities: [],
  tickers: {},
  selectedStrategy: 'ALL',
  isScanning: true,
  minSpread: 0.25,
  latency: {
    sourceLatencyMs: 12,
    pipelineLatencyMs: 4,
    totalLatencyMs: 16,
  },
  dataQuality: 'VALID',
  connectedFeedsCount: 24,
  connectedExchanges: [
    {
      exchange: 'binance',
      status: 'CONNECTED',
      latencyMs: 12,
      uptimeSeconds: 7200,
      messageRate: 42,
    },
    { exchange: 'bybit', status: 'CONNECTED', latencyMs: 15, uptimeSeconds: 7200, messageRate: 38 },
    { exchange: 'okx', status: 'CONNECTED', latencyMs: 14, uptimeSeconds: 7200, messageRate: 35 },
    {
      exchange: 'bitget',
      status: 'CONNECTED',
      latencyMs: 18,
      uptimeSeconds: 7200,
      messageRate: 26,
    },
    {
      exchange: 'kucoin',
      status: 'CONNECTED',
      latencyMs: 19,
      uptimeSeconds: 7200,
      messageRate: 24,
    },
    { exchange: 'gate', status: 'CONNECTED', latencyMs: 22, uptimeSeconds: 7200, messageRate: 22 },
    { exchange: 'mexc', status: 'CONNECTED', latencyMs: 16, uptimeSeconds: 7200, messageRate: 30 },
    {
      exchange: 'hyperliquid',
      status: 'CONNECTED',
      latencyMs: 9,
      uptimeSeconds: 7200,
      messageRate: 48,
    },
  ],

  setDataMode: (dataMode) => set({ dataMode }),
  setOpportunities: (opportunities) => set({ opportunities }),
  addOpportunity: (opp) =>
    set((state) => {
      // Avoid duplicates
      const filtered = state.opportunities.filter((o) => o.id !== opp.id);
      return {
        opportunities: [opp, ...filtered.slice(0, 99)],
      };
    }),
  removeStaleOpportunities: (maxAgeMs = 10000) =>
    set((state) => {
      const now = Date.now();
      return {
        opportunities: state.opportunities.filter((o) => {
          const timestamp = (o as any).timestamp || (o as any).detected_at || now;
          return now - timestamp < maxAgeMs;
        }),
      };
    }),
  updateTicker: (symbol, ticker) =>
    set((state) => ({
      tickers: { ...state.tickers, [symbol]: ticker },
    })),
  setSelectedStrategy: (selectedStrategy) => set({ selectedStrategy }),
  setIsScanning: (isScanning) => set({ isScanning }),
  setMinSpread: (minSpread) => set({ minSpread }),
  setLatency: (lat) =>
    set((state) => ({
      latency: { ...state.latency, ...lat },
    })),
  setExchangeStatuses: (connectedExchanges) => set({ connectedExchanges }),
}));
