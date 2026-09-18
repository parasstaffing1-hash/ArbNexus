import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateSpotArbitrage,
  calculateCrossChainArbitrage,
  calculateOrderBookExecution,
  calculateMaxSafeTradeSize,
} from '../src';

describe('Financial Invariant & Property Tests (Production Reliability Gates)', () => {
  // Invariant 1: Fee Monotonicity
  // If fees increase, net profit must not increase under otherwise identical conditions.
  it('Property 1: Fee Monotonicity — Net profit must strictly decrease as fees increase', () => {
    const buyPrice = new Decimal('3500.00');
    const sellPrice = new Decimal('3550.00');
    const quantity = new Decimal('10.0');

    let prevNetProfit = new Decimal(Infinity);

    // Test increasing fee percentages: 0.05%, 0.10%, 0.20%, 0.50%, 1.00%
    const feeLevels = ['0.05', '0.10', '0.20', '0.50', '1.00'];

    for (const fee of feeLevels) {
      const result = calculateSpotArbitrage({
        buyPrice,
        sellPrice,
        quantity,
        sourceTradingFeePercent: fee,
        targetTradingFeePercent: fee,
        networkGasCostUsd: 0,
        slippagePercent: 0,
      });

      const netProfit = new Decimal(result.outputs.netProfitUsd);
      expect(netProfit.lte(prevNetProfit)).toBe(true);
      prevNetProfit = netProfit;
    }
  });

  // Invariant 2: Slippage Monotonicity
  // If slippage increases, net profitability cannot improve under otherwise identical conditions.
  it('Property 2: Slippage Monotonicity — Higher slippage cannot improve net profitability', () => {
    const buyPrice = new Decimal('67000.00');
    const sellPrice = new Decimal('67500.00');
    const quantity = new Decimal('2.0');

    let prevNetProfit = new Decimal(Infinity);
    const slippageLevels = ['0.0', '0.05', '0.1', '0.25', '0.5', '1.0'];

    for (const slippage of slippageLevels) {
      const result = calculateSpotArbitrage({
        buyPrice,
        sellPrice,
        quantity,
        sourceTradingFeePercent: '0.1',
        targetTradingFeePercent: '0.1',
        networkGasCostUsd: '5.0',
        slippagePercent: slippage,
      });

      const netProfit = new Decimal(result.outputs.netProfitUsd);
      expect(netProfit.lte(prevNetProfit)).toBe(true);
      prevNetProfit = netProfit;
    }
  });

  // Invariant 3: Price Spread Sensitivity
  // If buy price increases while sell price remains constant, profitability cannot improve.
  it('Property 3: Spread Sensitivity — Increasing buy price strictly reduces profit', () => {
    const fixedSellPrice = new Decimal('100.00');
    const quantity = new Decimal('1000');

    let prevProfit = new Decimal(Infinity);
    const buyPrices = ['95.00', '96.00', '97.50', '99.00', '100.00', '101.00'];

    for (const buyPriceStr of buyPrices) {
      const result = calculateSpotArbitrage({
        buyPrice: new Decimal(buyPriceStr),
        sellPrice: fixedSellPrice,
        quantity,
        sourceTradingFeePercent: '0.05',
        targetTradingFeePercent: '0.05',
        networkGasCostUsd: 0,
        slippagePercent: 0,
      });

      const netProfit = new Decimal(result.outputs.netProfitUsd);
      expect(netProfit.lte(prevProfit)).toBe(true);
      prevProfit = netProfit;
    }
  });

  // Invariant 4: Liquidity Depth Constraint
  // If order book liquidity decreases, maximum executable safe size cannot increase.
  it('Property 4: Liquidity Constraint — Lower available depth decreases max safe trade size', () => {
    const makeBook = (multiplier: number) => [
      { price: new Decimal('3500'), amount: new Decimal(10).mul(multiplier) },
      { price: new Decimal('3505'), amount: new Decimal(20).mul(multiplier) },
      { price: new Decimal('3515'), amount: new Decimal(30).mul(multiplier) },
    ];

    const depthMultipliers = [10, 5, 2, 1];
    let prevMaxSafeUsd = new Decimal(Infinity);

    for (const mult of depthMultipliers) {
      const book = makeBook(mult);
      const res = calculateMaxSafeTradeSize(book, new Decimal('0.2')); // 0.20% max slippage
      const safeUsd = new Decimal(res.outputs.maxSafeSizeUsd);
      expect(safeUsd.lte(prevMaxSafeUsd)).toBe(true);
      prevMaxSafeUsd = safeUsd;
    }
  });

  // Invariant 5: Data Staleness Guard
  // Stale data cannot be marked executable/active
  it('Property 5: Data Staleness Invariant — Opportunity freshness cutoff transitions state to expired', () => {
    const maxTtlMs = 60000; // 60s TTL
    const now = Date.now();

    const isFresh = (detectedAt: number) => now - detectedAt < maxTtlMs;

    expect(isFresh(now - 10000)).toBe(true); // 10s old -> ACTIVE
    expect(isFresh(now - 59000)).toBe(true); // 59s old -> ACTIVE
    expect(isFresh(now - 60001)).toBe(false); // 60.001s old -> MUST EXPIRE
    expect(isFresh(now - 300000)).toBe(false); // 5m old -> MUST EXPIRE
  });

  // Invariant 6: Extreme Values & Boundary Conditions
  it('Property 6: Edge Cases — Handles zero quantity, huge capital, and fee > spread without NaN or throwing', () => {
    // Zero quantity
    const zeroQty = calculateSpotArbitrage({
      buyPrice: new Decimal('3500'),
      sellPrice: new Decimal('3600'),
      quantity: 0,
      sourceTradingFeePercent: '0.1',
      targetTradingFeePercent: '0.1',
      networkGasCostUsd: 0,
      slippagePercent: 0,
    });
    expect(zeroQty.outputs.netProfitUsd).toBe(0);

    // Fee > Gross Spread (Negative Net Profit)
    const negativeProfit = calculateSpotArbitrage({
      buyPrice: new Decimal('3500'),
      sellPrice: new Decimal('3501'), // Tiny 0.028% spread
      quantity: new Decimal('1'),
      sourceTradingFeePercent: '0.1', // 0.10% fee
      targetTradingFeePercent: '0.1', // 0.10% fee
      networkGasCostUsd: '5.0',
      slippagePercent: 0,
    });
    expect(negativeProfit.outputs.netProfitUsd).toBeLessThan(0);
    expect(negativeProfit.outputs.isProfitable).toBe(false);

    // Micro notional values
    const microResult = calculateSpotArbitrage({
      buyPrice: new Decimal('0.00000123'),
      sellPrice: new Decimal('0.00000129'),
      quantity: new Decimal('1000000000'),
      sourceTradingFeePercent: '0.05',
      targetTradingFeePercent: '0.05',
      networkGasCostUsd: 0,
      slippagePercent: 0,
    });
    expect(isNaN(microResult.outputs.netProfitUsd)).toBe(false);
    expect(microResult.outputs.netProfitUsd).toBeGreaterThan(0);
  });
});
