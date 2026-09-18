import { ArbitrageDetector } from './detector.interface';
import { Opportunity } from '../types/opportunity.types';
import Decimal from 'decimal.js';
import { calculateCrossChainArbitrage } from '@arbitrage/calculators';

export class CrossChainDetector implements ArbitrageDetector {
  readonly detectorName = 'CrossChainDetector';

  async detect(context: {
    originChain?: string;
    targetChain?: string;
    originPrice?: Decimal;
    targetPrice?: Decimal;
    tradeCapitalUsd?: number;
  }): Promise<Opportunity[]> {
    const {
      originChain = 'ethereum',
      targetChain = 'arbitrum',
      originPrice = new Decimal('3515.00'),
      targetPrice = new Decimal('3542.00'),
      tradeCapitalUsd = 15000,
    } = context;

    const tradeAmount = new Decimal(tradeCapitalUsd).div(originPrice);

    const calc = calculateCrossChainArbitrage(
      originPrice,
      targetPrice,
      tradeAmount,
      new Decimal('8.50'), // sourceGasUsd
      new Decimal('12.00'), // bridgeFeeUsd
      new Decimal('0.35'), // destGasUsd
    );

    const netProfit = calc.outputs.netProfitUsd;
    if (netProfit <= 0) return [];

    const now = Date.now();
    return [
      {
        id: `opp-crosschain-ETH-${originChain}-${targetChain}-${now}`,
        strategy_type: 'CROSS_CHAIN',
        lifecycle_state: 'DETECTED',
        asset: 'ETH',
        venues: [`${originChain}-uniswap`, `${targetChain}-camelot`],
        chains: [originChain, targetChain],
        entry_price: originPrice.toString(),
        exit_price: targetPrice.toString(),
        gross_spread: targetPrice.minus(originPrice).div(originPrice).toFixed(4),
        gross_profit: calc.outputs.grossProfitUsd.toFixed(2),
        trading_fees: '30.00',
        withdrawal_fees: '0.00',
        gas_cost: '8.85',
        bridge_cost: '12.00',
        slippage: '5.00',
        expected_net_profit: netProfit.toFixed(2),
        expected_roi: calc.outputs.netRoiPercent.toFixed(2),
        required_capital: tradeCapitalUsd.toString(),
        max_executable_size: '50000',
        estimated_duration_ms: 180000, // 3 min bridge finality
        latency: {
          exchangeTimestamp: now - 150,
          receiveTimestamp: now,
          normalizationTimestamp: now,
          sourceLatencyMs: 150,
          pipelineLatencyMs: 150,
          totalLatencyMs: 150,
        },
        liquidity_score: 85,
        data_quality: 'VALID',
        execution_risk: 'MEDIUM',
        opportunity_score: 84,
        letter_grade: 'A',
        timestamp: now,
        expiration: now + 30000,
        route: [
          {
            venue: `${originChain}-uniswap`,
            chain: originChain,
            action: 'buy',
            fromAsset: 'USDC',
            toAsset: 'WETH',
            price: originPrice.toString(),
            amount: tradeAmount.toFixed(4),
            feeUsd: '15.00',
          },
          {
            venue: 'Across Bridge',
            chain: 'bridge',
            action: 'bridge',
            fromAsset: 'WETH',
            toAsset: 'WETH',
            price: '1.00',
            amount: tradeAmount.toFixed(4),
            feeUsd: '12.00',
          },
          {
            venue: `${targetChain}-camelot`,
            chain: targetChain,
            action: 'sell',
            fromAsset: 'WETH',
            toAsset: 'USDC',
            price: targetPrice.toString(),
            amount: tradeAmount.toFixed(4),
            feeUsd: '15.00',
          },
        ],
      },
    ];
  }
}
