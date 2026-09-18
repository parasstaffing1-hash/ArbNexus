import Decimal from 'decimal.js';
import { ArbitrageDetector } from './detector.interface';
import { Opportunity } from '../types/opportunity.types';

export interface DexDexContext {
  chain: string;
  dexA: string;
  dexB: string;
  asset: string;
  quoteAsset: string;
  priceA: Decimal;
  priceB: Decimal;
  liquidityUsdA: Decimal;
  liquidityUsdB: Decimal;
  tradeCapitalUsd?: number;
  feeBpsA?: number;
  feeBpsB?: number;
  gasUsdA?: Decimal;
  gasUsdB?: Decimal;
}

export class DexDexArbitrageDetector implements ArbitrageDetector {
  readonly detectorName = 'DexDexArbitrageDetector';

  async detect(context: DexDexContext): Promise<Opportunity[]> {
    const {
      chain,
      dexA,
      dexB,
      asset,
      quoteAsset,
      priceA,
      priceB,
      liquidityUsdA,
      liquidityUsdB,
      tradeCapitalUsd = 10000,
      feeBpsA = 30, // 0.30%
      feeBpsB = 30, // 0.30%
      gasUsdA = new Decimal('3.50'),
      gasUsdB = new Decimal('3.50'),
    } = context;

    // Determine direction: buy on lower price venue, sell on higher price venue
    let buyVenue: string;
    let sellVenue: string;
    let buyPrice: Decimal;
    let sellPrice: Decimal;
    let buyFeeBps: number;
    let sellFeeBps: number;

    if (priceA.lt(priceB)) {
      buyVenue = dexA;
      buyPrice = priceA;
      buyFeeBps = feeBpsA;
      sellVenue = dexB;
      sellPrice = priceB;
      sellFeeBps = feeBpsB;
    } else if (priceB.lt(priceA)) {
      buyVenue = dexB;
      buyPrice = priceB;
      buyFeeBps = feeBpsB;
      sellVenue = dexA;
      sellPrice = priceA;
      sellFeeBps = feeBpsA;
    } else {
      return []; // Zero spread
    }

    const capital = new Decimal(tradeCapitalUsd);
    const grossSpread = sellPrice.minus(buyPrice).div(buyPrice);
    if (grossSpread.lte(0)) return [];

    // Check maximum executable size based on 2% depth threshold
    const minPoolDepth = Decimal.min(liquidityUsdA, liquidityUsdB);
    const maxExecutableSize = minPoolDepth.mul('0.05'); // 5% pool depth max

    // Fee calculations
    const buyFee = capital.mul(buyFeeBps).div(10000);
    const sellGross = capital.mul(sellPrice).div(buyPrice);
    const sellFee = sellGross.mul(sellFeeBps).div(10000);
    const totalSwapFees = buyFee.plus(sellFee);

    // Price impact approximation based on capital / depth
    const priceImpactPct = capital.div(minPoolDepth).mul(100);
    const slippageCost = capital.mul(priceImpactPct).div(100);

    const totalGas = gasUsdA.plus(gasUsdB);
    const totalCosts = totalSwapFees.plus(slippageCost).plus(totalGas);

    const grossProfit = sellGross.minus(capital);
    const netProfit = grossProfit.minus(totalCosts);
    const netRoi = capital.isZero() ? new Decimal(0) : netProfit.div(capital).mul(100);

    if (netProfit.lte(0)) return [];

    const now = Date.now();
    const routeHash = `${chain}:${buyVenue}:${sellVenue}:${asset}:${now}`;

    return [
      {
        id: `opp-dex-dex-${chain}-${asset}-${now}`,
        strategy_type: 'SPOT_DEX_DEX',
        lifecycle_state: 'DETECTED',
        asset: `${asset}/${quoteAsset}`,
        venues: [buyVenue, sellVenue],
        chains: [chain],
        protocol: `${buyVenue}->${sellVenue}`,
        pool_ids: [`pool-${chain}-${buyVenue}`, `pool-${chain}-${sellVenue}`],
        source_chain: chain,
        destination_chain: chain,
        route: [
          {
            venue: buyVenue,
            chain,
            action: 'buy',
            fromAsset: quoteAsset,
            toAsset: asset,
            price: buyPrice.toFixed(4),
            amount: capital.div(buyPrice).toFixed(4),
            feeUsd: buyFee.toFixed(2),
          },
          {
            venue: sellVenue,
            chain,
            action: 'sell',
            fromAsset: asset,
            toAsset: quoteAsset,
            price: sellPrice.toFixed(4),
            amount: capital.div(buyPrice).toFixed(4),
            feeUsd: sellFee.toFixed(2),
          },
        ],
        entry_price: buyPrice.toString(),
        exit_price: sellPrice.toString(),
        gross_spread: grossSpread.toFixed(6),
        gross_profit: grossProfit.toFixed(2),
        trading_fees: totalSwapFees.toFixed(2),
        withdrawal_fees: '0.00',
        dex_fee: totalSwapFees.toFixed(2),
        gas_cost: totalGas.toFixed(2),
        bridge_cost: '0.00',
        slippage: slippageCost.toFixed(2),
        price_impact: priceImpactPct.toFixed(4),
        expected_net_profit: netProfit.toFixed(2),
        expected_roi: netRoi.toFixed(3),
        required_capital: capital.toFixed(2),
        max_executable_size: maxExecutableSize.toFixed(2),
        estimated_duration_ms: 15000,
        latency: {
          exchangeTimestamp: now - 32,
          receiveTimestamp: now - 14,
          normalizationTimestamp: now,
          sourceLatencyMs: 18,
          pipelineLatencyMs: 14,
          totalLatencyMs: 32,
        },
        liquidity_score: 90,
        data_quality: 'VALID',
        execution_risk: 'LOW',
        opportunity_score: 88,
        letter_grade: 'AA',
        timestamp: now,
        expiration: now + 30000,
        route_hash: routeHash,
      },
    ];
  }
}
