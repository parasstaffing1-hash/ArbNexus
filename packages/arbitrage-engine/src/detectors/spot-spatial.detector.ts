import { ArbitrageDetector } from './detector.interface';
import { Opportunity } from '../types/opportunity.types';
import { Ticker } from '@arbitrage/market-data';
import Decimal from 'decimal.js';
import { calculateSpotArbitrage } from '@arbitrage/calculators';

export class SpotSpatialDetector implements ArbitrageDetector {
  readonly detectorName = 'SpotSpatialDetector';

  async detect(context: {
    tickers: Ticker[];
    tradeCapitalUsd?: number;
    minSpreadBps?: number;
  }): Promise<Opportunity[]> {
    const { tickers, tradeCapitalUsd = 10000, minSpreadBps = 10 } = context;
    const opportunities: Opportunity[] = [];

    // Group tickers by symbol
    const bySymbol: Map<string, Ticker[]> = new Map();
    for (const t of tickers) {
      if (!bySymbol.has(t.symbol)) {
        bySymbol.set(t.symbol, []);
      }
      bySymbol.get(t.symbol)!.push(t);
    }

    for (const [symbol, group] of bySymbol.entries()) {
      if (group.length < 2) continue;

      // Check all pairwise combinations
      for (let i = 0; i < group.length; i++) {
        for (let j = 0; j < group.length; j++) {
          if (i === j) continue;

          const buyVenue = group[i];
          const sellVenue = group[j];

          const askPrice = new Decimal(buyVenue.ask);
          const bidPrice = new Decimal(sellVenue.bid);

          if (bidPrice.gt(askPrice)) {
            const spreadPercent = bidPrice.minus(askPrice).div(askPrice);
            const spreadBps = spreadPercent.mul(10000);

            if (spreadBps.gte(minSpreadBps)) {
              const quantity = new Decimal(tradeCapitalUsd).div(askPrice);

              // Run deterministic calculation engine
              const calc = calculateSpotArbitrage({
                buyPrice: askPrice,
                sellPrice: bidPrice,
                quantity,
                sourceTradingFeePercent: '0.1', // 0.10%
                targetTradingFeePercent: '0.1', // 0.10%
                networkGasCostUsd: '0.50',
                slippagePercent: '0.05',
              });

              const netProfit = calc.outputs.netProfitUsd;
              const roi = calc.outputs.returnOnCapitalPercent;

              if (netProfit > 0) {
                const now = Date.now();
                const latencyMs = Math.max(
                  0,
                  now - Math.min(buyVenue.timestamp, sellVenue.timestamp),
                );

                const isDexInvolved =
                  buyVenue.exchange.includes('uniswap') || sellVenue.exchange.includes('uniswap');
                const strategyType = isDexInvolved ? 'SPOT_CEX_DEX' : 'SPOT_CEX_CEX';

                opportunities.push({
                  id: `opp-${strategyType.toLowerCase()}-${symbol.replace('/', '')}-${buyVenue.exchange}-${sellVenue.exchange}-${now}`,
                  strategy_type: strategyType,
                  lifecycle_state: 'DETECTED',
                  asset: symbol,
                  venues: [buyVenue.exchange, sellVenue.exchange],
                  chains: ['ethereum'],
                  entry_price: askPrice.toString(),
                  exit_price: bidPrice.toString(),
                  gross_spread: spreadPercent.toFixed(4),
                  gross_profit: calc.outputs.grossProfitUsd.toFixed(2),
                  trading_fees: (calc.breakdown.sourceFeeUsd + calc.breakdown.targetFeeUsd).toFixed(
                    2,
                  ),
                  withdrawal_fees: '2.00',
                  gas_cost: '0.50',
                  bridge_cost: '0.00',
                  slippage: calc.breakdown.slippageCostUsd.toFixed(2),
                  expected_net_profit: netProfit.toFixed(2),
                  expected_roi: roi.toFixed(2),
                  required_capital: tradeCapitalUsd.toString(),
                  max_executable_size: '50000',
                  estimated_duration_ms: 120,
                  latency: {
                    exchangeTimestamp: Math.min(buyVenue.timestamp, sellVenue.timestamp),
                    receiveTimestamp: now,
                    normalizationTimestamp: now,
                    sourceLatencyMs: latencyMs,
                    pipelineLatencyMs: latencyMs,
                    totalLatencyMs: latencyMs,
                  },
                  liquidity_score: 92,
                  data_quality: 'VALID',
                  execution_risk: 'LOW',
                  opportunity_score: 88,
                  letter_grade: 'AA',
                  timestamp: now,
                  detected_at: now,
                  last_valid_at: now,
                  expires_at: now + 5000,
                  expiration: now + 5000,
                  route: [
                    {
                      venue: buyVenue.exchange,
                      action: 'buy',
                      fromAsset: symbol.split('/')[1] || 'USDT',
                      toAsset: symbol.split('/')[0] || 'BTC',
                      price: askPrice.toString(),
                      amount: quantity.toFixed(4),
                      feeUsd: (tradeCapitalUsd * 0.001).toFixed(2),
                    },
                    {
                      venue: sellVenue.exchange,
                      action: 'sell',
                      fromAsset: symbol.split('/')[0] || 'BTC',
                      toAsset: symbol.split('/')[1] || 'USDT',
                      price: bidPrice.toString(),
                      amount: quantity.toFixed(4),
                      feeUsd: (tradeCapitalUsd * 0.001).toFixed(2),
                    },
                  ],
                });
              }
            }
          }
        }
      }
    }

    return opportunities;
  }
}
