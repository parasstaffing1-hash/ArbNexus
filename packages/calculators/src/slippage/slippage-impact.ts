import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';
import { OrderBookLevel } from '../adapters/provider.interface';

/** 1. Slippage Calculator */
export function calculateSlippage(
  expectedPrice: DecimalValue,
  executedPrice: DecimalValue,
  isBuyOrder = true,
): CalculationResult {
  const exp = toDecimal(expectedPrice);
  const exec = toDecimal(executedPrice);

  // For buy order: slippage is (exec - exp) / exp * 100%
  // For sell order: slippage is (exp - exec) / exp * 100%
  const priceDiff = isBuyOrder ? exec.minus(exp) : exp.minus(exec);
  const slippagePercent = exp.isZero() ? new Decimal(0) : priceDiff.dividedBy(exp).times(100);

  return {
    inputs: { expectedPrice, executedPrice, isBuyOrder },
    outputs: {
      slippagePercent: slippagePercent.toNumber(),
      priceDifference: priceDiff.toNumber(),
      isAdverse: slippagePercent.greaterThan(0),
    },
    formula: isBuyOrder
      ? 'Slippage = ((P_exec - P_expected) / P_expected) * 100%'
      : 'Slippage = ((P_expected - P_exec) / P_expected) * 100%',
    assumptions: ['Measures actual fill price divergence against initial quote'],
    warnings: slippagePercent.greaterThan(1.0) ? ['High execution slippage (> 1%).'] : [],
    breakdown: { expectedPrice: exp.toNumber(), executedPrice: exec.toNumber() },
    executedAt: Date.now(),
  };
}

/** 2. Expected Slippage Calculator */
export function calculateExpectedSlippage(
  tradeSizeUsd: DecimalValue,
  marketLiquidityDepthUsd: DecimalValue,
  baseVolatilityPercent: DecimalValue = '1.0',
): CalculationResult {
  const size = toDecimal(tradeSizeUsd);
  const depth = toDecimal(marketLiquidityDepthUsd);
  const vol = toDecimal(baseVolatilityPercent);

  // Expected slippage models Kyle's lambda: Slippage = alpha * (Size / Depth) * Vol
  const ratio = depth.isZero() ? new Decimal(1) : size.dividedBy(depth);
  const expectedSlippagePercent = ratio.times(vol).times('0.5');

  return {
    inputs: { tradeSizeUsd, marketLiquidityDepthUsd, baseVolatilityPercent },
    outputs: {
      expectedSlippagePercent: expectedSlippagePercent.toNumber(),
      sizeToDepthRatio: ratio.toNumber(),
    },
    formula: 'Expected Slippage % = 0.5 * (Trade Size / Liquidity Depth) * Volatility %',
    assumptions: ['Uniform order-book depth density within 2% band'],
    warnings: ratio.greaterThan('0.2')
      ? ['Trade size consumes > 20% of available book depth.']
      : [],
    breakdown: { tradeSizeUsd: size.toNumber(), depthUsd: depth.toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. Price Impact Calculator (AMM / Order-book) */
export function calculatePriceImpact(
  spotPriceBefore: DecimalValue,
  marginalPriceAfter: DecimalValue,
): CalculationResult {
  const p0 = toDecimal(spotPriceBefore);
  const p1 = toDecimal(marginalPriceAfter);
  const impactPercent = p0.isZero() ? new Decimal(0) : p1.minus(p0).abs().dividedBy(p0).times(100);

  return {
    inputs: { spotPriceBefore, marginalPriceAfter },
    outputs: { priceImpactPercent: impactPercent.toNumber() },
    formula: 'Price Impact % = (|P_post - P_pre| / P_pre) * 100%',
    assumptions: ['Price deviation resulting strictly from consumer liquidity removal'],
    warnings: impactPercent.greaterThan('2.0') ? ['Severe price impact detected (> 2%).'] : [],
    breakdown: { initialPrice: p0.toNumber(), finalPrice: p1.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. Liquidity Impact Calculator */
export function calculateLiquidityImpact(
  tradeAmountUsd: DecimalValue,
  poolReservesUsd: DecimalValue,
): CalculationResult {
  const trade = toDecimal(tradeAmountUsd);
  const reserves = toDecimal(poolReservesUsd);

  // Impact approx = Trade / (2 * Reserves + Trade)
  const denominator = reserves.times(2).plus(trade);
  const impactRatio = denominator.isZero() ? new Decimal(0) : trade.dividedBy(denominator);
  const impactPercent = impactRatio.times(100);

  return {
    inputs: { tradeAmountUsd, poolReservesUsd },
    outputs: { liquidityImpactPercent: impactPercent.toNumber() },
    formula: 'Impact % = (Trade / (2 * Reserves + Trade)) * 100%',
    assumptions: ['Constant product AMM invariant (x * y = k)'],
    warnings: trade.greaterThan(reserves.times('0.1'))
      ? ['Trade size exceeds 10% of total pool reserves.']
      : [],
    breakdown: { poolReservesUsd: reserves.toNumber() },
    executedAt: Date.now(),
  };
}

/** 5. Order Book Execution Calculator with Depth Simulation ($1k to $500k) */
export function calculateOrderBookExecution(
  targetSizeUsd: DecimalValue,
  bookLevels: OrderBookLevel[], // bids or asks
  isBuyOrder = true,
): CalculationResult {
  const target = toDecimal(targetSizeUsd);
  let remainingUsd = target;
  let totalBaseAmount = new Decimal(0);
  let totalSpentUsd = new Decimal(0);
  const levelsConsumed: { price: number; filledUsd: number; filledAmount: number }[] = [];

  for (const level of bookLevels) {
    if (remainingUsd.isZero()) break;
    const levelMaxUsd = level.price.times(level.amount);
    const fillUsd = Decimal.min(remainingUsd, levelMaxUsd);
    const fillAmount = fillUsd.dividedBy(level.price);

    totalSpentUsd = totalSpentUsd.plus(fillUsd);
    totalBaseAmount = totalBaseAmount.plus(fillAmount);
    remainingUsd = remainingUsd.minus(fillUsd);

    levelsConsumed.push({
      price: level.price.toNumber(),
      filledUsd: fillUsd.toNumber(),
      filledAmount: fillAmount.toNumber(),
    });
  }

  const vwap = totalBaseAmount.isZero() ? new Decimal(0) : totalSpentUsd.dividedBy(totalBaseAmount);
  const topPrice = bookLevels.length > 0 ? bookLevels[0].price : vwap;
  const slippagePercent = topPrice.isZero()
    ? new Decimal(0)
    : vwap.minus(topPrice).abs().dividedBy(topPrice).times(100);

  // Multi-tier simulation curve: $1k, $5k, $10k, $50k, $100k, $500k
  const simulationTiers = [1000, 5000, 10000, 50000, 100000, 500000].map((tierUsd) => {
    let rem = new Decimal(tierUsd);
    let spent = new Decimal(0);
    let baseFilled = new Decimal(0);
    for (const lvl of bookLevels) {
      if (rem.isZero()) break;
      const lvlUsd = lvl.price.times(lvl.amount);
      const fUsd = Decimal.min(rem, lvlUsd);
      spent = spent.plus(fUsd);
      baseFilled = baseFilled.plus(fUsd.dividedBy(lvl.price));
      rem = rem.minus(fUsd);
    }
    const tierVwap = baseFilled.isZero() ? topPrice : spent.dividedBy(baseFilled);
    const tierSlippage = topPrice.isZero()
      ? 0
      : tierVwap.minus(topPrice).abs().dividedBy(topPrice).times(100).toNumber();

    return {
      tierUsd,
      isFullyFilled: rem.isZero(),
      vwapPrice: tierVwap.toNumber(),
      slippagePercent: tierSlippage,
    };
  });

  return {
    inputs: { targetSizeUsd, isBuyOrder, levelsCount: bookLevels.length },
    outputs: {
      averageExecutionPrice: vwap.toNumber(),
      totalFilledUsd: totalSpentUsd.toNumber(),
      unfilledUsd: remainingUsd.toNumber(),
      isFullyFilled: remainingUsd.isZero(),
      slippagePercent: slippagePercent.toNumber(),
      simulationTiers,
    },
    formula: 'VWAP = Sum(P_i * Q_i) / Sum(Q_i); Slippage = (|VWAP - P_top| / P_top) * 100%',
    assumptions: ['Static order book snapshot with no replenishment during sweep'],
    warnings: remainingUsd.greaterThan(0)
      ? ['Insufficient order book depth to complete entire order size.']
      : [],
    breakdown: { levelsConsumed, simulationTiers },
    executedAt: Date.now(),
  };
}

/** 6. Market Impact Calculator (Almgren-Chriss temporary vs permanent impact) */
export function calculateMarketImpact(
  orderSizeUsd: DecimalValue,
  dailyVolumeUsd: DecimalValue,
  dailyVolatilityPercent: DecimalValue = '3.0',
): CalculationResult {
  const size = toDecimal(orderSizeUsd);
  const adv = toDecimal(dailyVolumeUsd);
  const sigma = toDecimal(dailyVolatilityPercent).dividedBy(100);

  // Permanent impact: I_perm = gamma * sigma * (Size / ADV)^0.5
  // Temporary impact: I_temp = eta * sigma * (Size / ADV)
  const participation = adv.isZero() ? new Decimal(0) : size.dividedBy(adv);
  const permanentImpact = participation.sqrt().times(sigma).times('0.25').times(100);
  const temporaryImpact = participation.times(sigma).times('0.50').times(100);
  const totalImpact = permanentImpact.plus(temporaryImpact);

  return {
    inputs: { orderSizeUsd, dailyVolumeUsd, dailyVolatilityPercent },
    outputs: {
      permanentImpactPercent: permanentImpact.toNumber(),
      temporaryImpactPercent: temporaryImpact.toNumber(),
      totalMarketImpactPercent: totalImpact.toNumber(),
      advParticipationRate: participation.toNumber(),
    },
    formula: 'I_total = 0.25 * sigma * (Size/ADV)^0.5 + 0.50 * sigma * (Size/ADV)',
    assumptions: ['Almgren-Chriss institutional market impact formulation'],
    warnings: participation.greaterThan('0.05')
      ? ['Order exceeds 5% of average daily volume (High Impact).']
      : [],
    breakdown: {
      permanentImpactPercent: permanentImpact.toNumber(),
      temporaryImpactPercent: temporaryImpact.toNumber(),
    },
    executedAt: Date.now(),
  };
}

/** 7. Maximum Safe Trade Size Calculator */
export function calculateMaxSafeTradeSize(
  bookLevels: OrderBookLevel[],
  maxAllowedSlippagePercent: DecimalValue = '0.5',
): CalculationResult {
  const maxSlip = toDecimal(maxAllowedSlippagePercent);
  if (bookLevels.length === 0) {
    return {
      inputs: { maxAllowedSlippagePercent },
      outputs: { maxSafeSizeUsd: 0 },
      formula: 'Max Size = Cumulative depth where VWAP slippage <= Threshold',
      assumptions: ['Continuous depth curve traversal'],
      warnings: ['Empty order book.'],
      breakdown: {},
      executedAt: Date.now(),
    };
  }

  const topPrice = bookLevels[0].price;
  let cumulativeUsd = new Decimal(0);
  let cumulativeBase = new Decimal(0);
  let safeSizeUsd = new Decimal(0);

  for (const level of bookLevels) {
    const levelUsd = level.price.times(level.amount);
    const testUsd = cumulativeUsd.plus(levelUsd);
    const testBase = cumulativeBase.plus(level.amount);
    const testVwap = testUsd.dividedBy(testBase);
    const testSlippage = testVwap.minus(topPrice).abs().dividedBy(topPrice).times(100);

    if (testSlippage.greaterThan(maxSlip)) {
      // Find boundary within this level
      safeSizeUsd = cumulativeUsd;
      break;
    }
    cumulativeUsd = testUsd;
    cumulativeBase = testBase;
    safeSizeUsd = cumulativeUsd;
  }

  return {
    inputs: { maxAllowedSlippagePercent, levelsEvaluated: bookLevels.length },
    outputs: { maxSafeSizeUsd: safeSizeUsd.toNumber() },
    formula:
      'Max Safe Size = Sum(Price_i * Amount_i) such that Slippage(VWAP) <= Max_Allowed_Slippage',
    assumptions: ['Liquidity levels remain available during fill attempt'],
    warnings: safeSizeUsd.isZero()
      ? ['Top of book price already violates slippage allowance.']
      : [],
    breakdown: { topPrice: topPrice.toNumber() },
    executedAt: Date.now(),
  };
}

/** 8. Partial Fill Calculator */
export function calculatePartialFill(
  requestedQuantity: DecimalValue,
  filledQuantity: DecimalValue,
  executionPrice: DecimalValue,
  fixedCostsUsd: DecimalValue = '0',
): CalculationResult {
  const req = toDecimal(requestedQuantity);
  const fill = toDecimal(filledQuantity);
  const price = toDecimal(executionPrice);
  const fixed = toDecimal(fixedCostsUsd);

  const fillRatio = req.isZero() ? new Decimal(0) : fill.dividedBy(req);
  const filledUsd = fill.times(price);
  const fixedCostDragPerFilledUnit = fill.isZero() ? new Decimal(0) : fixed.dividedBy(fill);

  return {
    inputs: { requestedQuantity, filledQuantity, executionPrice, fixedCostsUsd },
    outputs: {
      fillRatePercent: fillRatio.times(100).toNumber(),
      filledUsd: filledUsd.toNumber(),
      unfilledQuantity: req.minus(fill).toNumber(),
      fixedCostDragPerFilledUnit: fixedCostDragPerFilledUnit.toNumber(),
    },
    formula: 'Fill Rate = (Filled_Qty / Requested_Qty) * 100',
    assumptions: ['Residual quantity is cancelled with immediate-or-cancel (IOC) behavior'],
    warnings: fillRatio.lessThan('0.5')
      ? ['Fill rate was lower than 50% (severe partial fill drag).']
      : [],
    breakdown: { filledUsd: filledUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 9. Execution Cost Calculator */
export function calculateExecutionCost(
  expectedTradeValueUsd: DecimalValue,
  slippagePercent: DecimalValue,
  tradingFeePercent: DecimalValue,
  gasCostUsd: DecimalValue,
): CalculationResult {
  const val = toDecimal(expectedTradeValueUsd);
  const slipCost = val.times(toDecimal(slippagePercent).dividedBy(100));
  const feeCost = val.times(toDecimal(tradingFeePercent).dividedBy(100));
  const gas = toDecimal(gasCostUsd);

  const totalCost = slipCost.plus(feeCost).plus(gas);
  const totalDragBps = val.isZero() ? new Decimal(0) : totalCost.dividedBy(val).times(10000);

  return {
    inputs: { expectedTradeValueUsd, slippagePercent, tradingFeePercent, gasCostUsd },
    outputs: {
      totalExecutionCostUsd: totalCost.toNumber(),
      slippageCostUsd: slipCost.toNumber(),
      tradingFeeCostUsd: feeCost.toNumber(),
      gasCostUsd: gas.toNumber(),
      totalDragBps: totalDragBps.toNumber(),
    },
    formula: 'Cost = (Value * Slippage%) + (Value * Fee%) + Gas',
    assumptions: ['Comprehensive sum of price impact, exchange commission, and on-chain gas'],
    warnings: [],
    breakdown: {
      slippageCostUsd: slipCost.toNumber(),
      tradingFeeCostUsd: feeCost.toNumber(),
      gasCostUsd: gas.toNumber(),
    },
    executedAt: Date.now(),
  };
}
