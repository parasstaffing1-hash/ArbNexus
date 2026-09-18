import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  MOCK_OPPORTUNITIES,
  MOCK_FUNDING_RATES,
  MOCK_EXCHANGES,
  LiveOpportunity,
  FundingRateData,
  ExchangeStatus,
} from '../lib/mock-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function useOpportunities(): UseQueryResult<LiveOpportunity[]> {
  return useQuery<LiveOpportunity[]>({
    queryKey: ['arbitrage-opportunities'],
    queryFn: async (): Promise<LiveOpportunity[]> => {
      try {
        const response = await fetch(`${API_BASE_URL}/opportunities`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((opp: any, idx: number): LiveOpportunity => {
            const pair = opp.pair || `${opp.asset || 'ETH'}/USDT`;
            const token = pair.split('/')[0] || 'ETH';
            const grossSpread = parseFloat(opp.spreadPercent || opp.gross_spread || '0.008');
            const netSpread = Math.max(0.001, grossSpread - 0.002);

            return {
              id: opp.id || `opp-${idx}`,
              token,
              pair,
              sourceExchange: opp.sourceVenue || opp.venues?.[0] || 'Binance',
              sourceExchangeType: 'CEX',
              targetExchange: opp.targetVenue || opp.venues?.[1] || 'Bybit',
              targetExchangeType: 'CEX',
              network: opp.chains?.[0] || 'ETH',
              buyPrice: parseFloat(opp.buyPrice || opp.entry_price || '3500'),
              sellPrice: parseFloat(opp.sellPrice || opp.exit_price || '3528'),
              grossSpreadPercent: grossSpread * 100,
              netSpreadPercent: netSpread * 100,
              estimatedFeesUsd: parseFloat(opp.totalFeesUsd || opp.trading_fees || '12.50'),
              netProfitUsd: parseFloat(opp.netProfitUsd || opp.expected_net_profit || '45.00'),
              minCapitalUsd: parseFloat(opp.minCapitalUsd || opp.required_capital || '10000'),
              confidenceScore: parseFloat(opp.confidenceScore || '0.94'),
              executionDurationMs: opp.estimated_duration_ms || 450,
              strategy: (opp.strategy || opp.strategy_type || 'SPATIAL') as any,
              status: 'ACTIVE',
              detectedAt: typeof opp.detectedAt === 'number' ? opp.detectedAt : Date.now(),
            };
          });
        }
        return MOCK_OPPORTUNITIES;
      } catch {
        return MOCK_OPPORTUNITIES;
      }
    },
    initialData: MOCK_OPPORTUNITIES,
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useFundingRates(): UseQueryResult<FundingRateData[]> {
  return useQuery<FundingRateData[]>({
    queryKey: ['funding-rates'],
    queryFn: async (): Promise<FundingRateData[]> => {
      try {
        const response = await fetch(`${API_BASE_URL}/funding`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return Array.isArray(data) && data.length > 0 ? data : MOCK_FUNDING_RATES;
      } catch {
        return MOCK_FUNDING_RATES;
      }
    },
    initialData: MOCK_FUNDING_RATES,
    refetchInterval: 10000,
  });
}

export function useExchanges(): UseQueryResult<ExchangeStatus[]> {
  return useQuery<ExchangeStatus[]>({
    queryKey: ['exchange-statuses'],
    queryFn: async (): Promise<ExchangeStatus[]> => {
      try {
        const response = await fetch(`${API_BASE_URL}/exchanges`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return Array.isArray(data) && data.length > 0 ? data : MOCK_EXCHANGES;
      } catch {
        return MOCK_EXCHANGES;
      }
    },
    initialData: MOCK_EXCHANGES,
    refetchInterval: 15000,
  });
}

export function useGasPrices() {
  return useQuery({
    queryKey: ['gas-prices'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/gas-prices`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch {
        return {
          ethereum: { slow: '12', standard: '15', fast: '18' },
          arbitrum: { slow: '0.1', standard: '0.1', fast: '0.15' },
          solana: { slow: '0.000005', standard: '0.00001', fast: '0.00005' },
        };
      }
    },
    refetchInterval: 8000,
  });
}
