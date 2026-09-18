import { ArbitrageDetector } from './detector.interface';
import { Opportunity } from '../types/opportunity.types';
import Decimal from 'decimal.js';
import { calculateStablecoinArbitrage } from '@arbitrage/calculators';

export class StablecoinDetector implements ArbitrageDetector {
  readonly detectorName = 'StablecoinDetector';

  async detect(context: {
    stableSymbol?: string;
    marketPrice?: Decimal;
    redemptionPrice?: Decimal;
    capitalUsd?: number;
  }): Promise<Opportunity[]> {
    const {
      stableSymbol = 'USDe',
      marketPrice = new Decimal('0.9965'),
      redemptionPrice = new Decimal('1.0000'),
      capitalUsd = 25000,
    } = context;

    const tokenQuantity = new Decimal(capitalUsd).div(marketPrice);

    const calc = calculateStablecoinArbitrage(
      marketPrice,
      redemptionPrice,
      tokenQuantity,
      new Decimal('0.1'), // 0.1% redemption fee
      new Decimal('3.50'), // gas cost
    );

    const netProfit = calc.outputs.netProfitUsd;
    if (netProfit <= 0) return [];

    const now = Date.now();
    return [
      {
        id: `opp-stablecoin-${stableSymbol}-${now}`,
        strategy_type: 'STABLECOIN',
        lifecycle_state: 'DETECTED',
        asset: stableSymbol,
        venues: ['curve_dex', 'issuer_redemption'],
        chains: ['ethereum'],
        entry_price: marketPrice.toString(),
        exit_price: redemptionPrice.toString(),
        gross_spread: redemptionPrice.minus(marketPrice).div(redemptionPrice).toFixed(4),
        gross_profit: calc.outputs.grossProfitUsd.toFixed(2),
        trading_fees: (capitalUsd * 0.0004).toFixed(2),
        withdrawal_fees: '0.00',
        gas_cost: '3.50',
        bridge_cost: '0.00',
        slippage: '2.00',
        expected_net_profit: netProfit.toFixed(2),
        expected_roi: calc.outputs.netRoiPercent.toFixed(2),
        required_capital: capitalUsd.toString(),
        max_executable_size: '250000',
        estimated_duration_ms: 60000,
        latency: {
          exchangeTimestamp: now - 80,
          receiveTimestamp: now,
          normalizationTimestamp: now,
          sourceLatencyMs: 80,
          pipelineLatencyMs: 80,
          totalLatencyMs: 80,
        },
        liquidity_score: 96,
        data_quality: 'VALID',
        execution_risk: 'LOW',
        opportunity_score: 93,
        letter_grade: 'AAA',
        timestamp: now,
        expiration: now + 60000,
        route: [
          {
            venue: 'Curve pool',
            chain: 'ethereum',
            action: 'buy',
            fromAsset: 'USDT',
            toAsset: stableSymbol,
            price: marketPrice.toString(),
            amount: capitalUsd.toString(),
            feeUsd: '10.00',
          },
          {
            venue: 'Protocol Mint/Redeem',
            chain: 'ethereum',
            action: 'swap',
            fromAsset: stableSymbol,
            toAsset: 'USDC',
            price: redemptionPrice.toString(),
            amount: capitalUsd.toString(),
            feeUsd: (capitalUsd * 0.001).toFixed(2),
          },
        ],
      },
    ];
  }
}
