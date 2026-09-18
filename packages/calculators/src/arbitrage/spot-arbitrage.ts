import Decimal from 'decimal.js';
import {
  toDecimal,
  DecimalValue,
  Money,
  Price,
  Quantity,
  Spread,
  Percentage,
} from '../shared/primitives';
import { CalculationResult } from '../shared/types';

export interface SpotArbitrageInput {
  buyPrice: DecimalValue;
  sellPrice: DecimalValue;
  quantity: DecimalValue;
  sourceTradingFeePercent?: DecimalValue; // e.g. 0.1%
  targetTradingFeePercent?: DecimalValue; // e.g. 0.075%
  withdrawalFeeUsd?: DecimalValue;
  depositFeeUsd?: DecimalValue;
  networkGasCostUsd?: DecimalValue;
  bridgeFeeUsd?: DecimalValue;
  slippagePercent?: DecimalValue; // e.g. 0.05%
}

export interface SpotArbitrageOutput {
  grossSpreadPercent: number;
  netSpreadPercent: number;
  grossProfitUsd: number;
  totalCostsUsd: number;
  netProfitUsd: number;
  returnOnCapitalPercent: number;
  breakEvenSpreadPercent: number;
  isProfitable: boolean;
}

export interface SpotArbitrageBreakdown {
  buyCostUsd: number;
  sellGrossUsd: number;
  sourceFeeUsd: number;
  targetFeeUsd: number;
  slippageCostUsd: number;
  networkGasUsd: number;
  transferFeesUsd: number;
}

/**
 * 1. Master Spot Arbitrage Calculator
 * Strictly calculates gross spread, itemized fees, slippage buffer, net spread, and net profit.
 */
export function calculateSpotArbitrage(
  input: SpotArbitrageInput,
): CalculationResult<SpotArbitrageInput, SpotArbitrageOutput, SpotArbitrageBreakdown> {
  const buyPrice = toDecimal(input.buyPrice);
  const sellPrice = toDecimal(input.sellPrice);
  const quantity = toDecimal(input.quantity);
  const sourceFeePct = toDecimal(input.sourceTradingFeePercent ?? '0.1').dividedBy(100);
  const targetFeePct = toDecimal(input.targetTradingFeePercent ?? '0.075').dividedBy(100);
  const withdrawalFee = toDecimal(input.withdrawalFeeUsd ?? '0');
  const depositFee = toDecimal(input.depositFeeUsd ?? '0');
  const gasCost = toDecimal(input.networkGasCostUsd ?? '0');
  const bridgeFee = toDecimal(input.bridgeFeeUsd ?? '0');
  const slippagePct = toDecimal(input.slippagePercent ?? '0').dividedBy(100);

  const buyCost = buyPrice.times(quantity);
  const sellGross = sellPrice.times(quantity);

  const sourceTradingFee = buyCost.times(sourceFeePct);
  const targetTradingFee = sellGross.times(targetFeePct);
  const slippageCost = sellGross.times(slippagePct);
  const transferFees = withdrawalFee.plus(depositFee).plus(bridgeFee);

  const totalCosts = sourceTradingFee
    .plus(targetTradingFee)
    .plus(slippageCost)
    .plus(gasCost)
    .plus(transferFees);

  const grossProfit = sellGross.minus(buyCost);
  const netProfit = grossProfit.minus(totalCosts);

  // Gross spread: (sellPrice - buyPrice) / buyPrice * 100
  const grossSpread = buyPrice.isZero()
    ? new Decimal(0)
    : sellPrice.minus(buyPrice).dividedBy(buyPrice).times(100);

  // Net spread: (netProfit / buyCost) * 100
  const netSpread = buyCost.isZero() ? new Decimal(0) : netProfit.dividedBy(buyCost).times(100);

  // Break-even spread: totalCosts / buyCost * 100
  const breakEvenSpread = buyCost.isZero()
    ? new Decimal(0)
    : totalCosts.dividedBy(buyCost).times(100);

  // ROC: netProfit / buyCost * 100
  const roc = netSpread;

  const warnings: string[] = [];
  if (buyCost.isZero())
    warnings.push('Trade quantity or buy price is zero; capital required is zero.');
  if (sellPrice.lessThanOrEqualTo(buyPrice))
    warnings.push('Sell price is lower than or equal to buy price: negative gross spread.');
  if (totalCosts.greaterThan(grossProfit) && grossProfit.greaterThan(0)) {
    warnings.push(
      'Gross spread is positive, but total execution fees exceed profit (Negative Net Yield).',
    );
  }

  return {
    inputs: input,
    outputs: {
      grossSpreadPercent: grossSpread.toNumber(),
      netSpreadPercent: netSpread.toNumber(),
      grossProfitUsd: grossProfit.toNumber(),
      totalCostsUsd: totalCosts.toNumber(),
      netProfitUsd: netProfit.toNumber(),
      returnOnCapitalPercent: roc.toNumber(),
      breakEvenSpreadPercent: breakEvenSpread.toNumber(),
      isProfitable: netProfit.greaterThan(0),
    },
    formula:
      'Net Profit = (P_sell * Q) - (P_buy * Q) - (Fees_src + Fees_dst + Slippage + Gas + Bridge + Withdrawal)',
    assumptions: [
      'Order execution succeeds in a single atomic/near-atomic block window',
      'Exchange trading fee discounts (if applicable) are reflected in the input percentages',
      'Gas costs and slippage estimates reflect worst-case bound within the fill duration',
    ],
    warnings,
    breakdown: {
      buyCostUsd: buyCost.toNumber(),
      sellGrossUsd: sellGross.toNumber(),
      sourceFeeUsd: sourceTradingFee.toNumber(),
      targetFeeUsd: targetTradingFee.toNumber(),
      slippageCostUsd: slippageCost.toNumber(),
      networkGasUsd: gasCost.toNumber(),
      transferFeesUsd: transferFees.toNumber(),
    },
    executedAt: Date.now(),
  };
}

/** 2. Gross Spread Calculator */
export function calculateGrossSpread(
  buyPrice: DecimalValue,
  sellPrice: DecimalValue,
): CalculationResult {
  const pBuy = toDecimal(buyPrice);
  const pSell = toDecimal(sellPrice);
  const spread = pBuy.isZero() ? new Decimal(0) : pSell.minus(pBuy).dividedBy(pBuy).times(100);

  return {
    inputs: { buyPrice, sellPrice },
    outputs: { grossSpreadPercent: spread.toNumber() },
    formula: 'Gross Spread = ((P_sell - P_buy) / P_buy) * 100%',
    assumptions: ['Excludes all trading, withdrawal, and gas fees'],
    warnings: pSell.lessThan(pBuy) ? ['Inverted price: Buy price exceeds Sell price.'] : [],
    breakdown: { priceDifference: pSell.minus(pBuy).toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. Net Spread Calculator */
export function calculateNetSpread(
  buyPrice: DecimalValue,
  sellPrice: DecimalValue,
  totalFeeRatePercent: DecimalValue,
): CalculationResult {
  const pBuy = toDecimal(buyPrice);
  const pSell = toDecimal(sellPrice);
  const feePct = toDecimal(totalFeeRatePercent);
  const gross = pBuy.isZero() ? new Decimal(0) : pSell.minus(pBuy).dividedBy(pBuy).times(100);
  const net = gross.minus(feePct);

  return {
    inputs: { buyPrice, sellPrice, totalFeeRatePercent },
    outputs: { grossSpreadPercent: gross.toNumber(), netSpreadPercent: net.toNumber() },
    formula: 'Net Spread = Gross Spread - Total Fee Rate %',
    assumptions: ['Proportional trading and network fees scaled by trade volume'],
    warnings: net.lessThanOrEqualTo(0) ? ['Net spread is non-profitable after fee deduction.'] : [],
    breakdown: { feeDeductionPercent: feePct.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. Net Profit Calculator */
export function calculateNetProfit(
  grossProfitUsd: DecimalValue,
  feesUsd: DecimalValue,
): CalculationResult {
  const gross = toDecimal(grossProfitUsd);
  const fees = toDecimal(feesUsd);
  const net = gross.minus(fees);

  return {
    inputs: { grossProfitUsd, feesUsd },
    outputs: { netProfitUsd: net.toNumber(), isProfitable: net.greaterThan(0) },
    formula: 'Net Profit = Gross Profit - Total Fees',
    assumptions: ['All fees accounted in USD currency equivalents'],
    warnings: net.lessThanOrEqualTo(0) ? ['Total fees exceed gross earnings.'] : [],
    breakdown: { feeRatio: gross.isZero() ? 0 : fees.dividedBy(gross).times(100).toNumber() },
    executedAt: Date.now(),
  };
}

/** 5. Return on Capital (ROC) Calculator */
export function calculateReturnOnCapital(
  netProfitUsd: DecimalValue,
  capitalRequiredUsd: DecimalValue,
): CalculationResult {
  const net = toDecimal(netProfitUsd);
  const cap = toDecimal(capitalRequiredUsd);
  const roc = cap.isZero() ? new Decimal(0) : net.dividedBy(cap).times(100);

  return {
    inputs: { netProfitUsd, capitalRequiredUsd },
    outputs: { returnOnCapitalPercent: roc.toNumber() },
    formula: 'ROC = (Net Profit / Capital Required) * 100%',
    assumptions: ['Capital required includes full inventory commitment across legs'],
    warnings: cap.isZero() ? ['Capital required is zero.'] : [],
    breakdown: { netProfitUsd: net.toNumber(), capitalRequiredUsd: cap.toNumber() },
    executedAt: Date.now(),
  };
}

/** 6. Break-Even Spread Calculator */
export function calculateBreakEvenSpread(
  totalCostsUsd: DecimalValue,
  tradeCapitalUsd: DecimalValue,
): CalculationResult {
  const costs = toDecimal(totalCostsUsd);
  const cap = toDecimal(tradeCapitalUsd);
  const breakEven = cap.isZero() ? new Decimal(0) : costs.dividedBy(cap).times(100);

  return {
    inputs: { totalCostsUsd, tradeCapitalUsd },
    outputs: { breakEvenSpreadPercent: breakEven.toNumber() },
    formula: 'Break-Even Spread = (Total Fixed + Variable Costs / Trade Capital) * 100%',
    assumptions: ['Represents minimum market discrepancy needed to avoid a net loss'],
    warnings: [],
    breakdown: { requiredMinimumYieldUsd: costs.toNumber() },
    executedAt: Date.now(),
  };
}

/** 7. Multi-Exchange Comparison Calculator */
export function calculateMultiExchangeComparison(
  exchanges: { name: string; price: DecimalValue; feePercent: DecimalValue }[],
): CalculationResult {
  if (exchanges.length < 2) {
    return {
      inputs: { exchanges },
      outputs: { bestBuy: null, bestSell: null, maxGrossSpread: 0 },
      formula: 'Max Spread = (Max Price - Min Price) / Min Price',
      assumptions: ['Compares best ask with best bid across sorted venues'],
      warnings: ['At least 2 exchanges required for comparison'],
      breakdown: {},
      executedAt: Date.now(),
    };
  }

  const parsed = exchanges.map((e) => ({
    name: e.name,
    price: toDecimal(e.price),
    feePercent: toDecimal(e.feePercent),
  }));

  parsed.sort((a, b) => a.price.comparedTo(b.price));
  const cheapest = parsed[0];
  const mostExpensive = parsed[parsed.length - 1];

  const spread = cheapest.price.isZero()
    ? new Decimal(0)
    : mostExpensive.price.minus(cheapest.price).dividedBy(cheapest.price).times(100);

  return {
    inputs: { exchanges },
    outputs: {
      bestBuyExchange: cheapest.name,
      bestBuyPrice: cheapest.price.toNumber(),
      bestSellExchange: mostExpensive.name,
      bestSellPrice: mostExpensive.price.toNumber(),
      maxGrossSpreadPercent: spread.toNumber(),
    },
    formula: 'Spread = ((Max_Venue_Price - Min_Venue_Price) / Min_Venue_Price) * 100',
    assumptions: ['Instant execution possible across both sorted venues simultaneously'],
    warnings: [],
    breakdown: { venuesCompared: parsed.length },
    executedAt: Date.now(),
  };
}

/** 8. Three-Leg (Triangular) Arbitrage Calculator */
export function calculateThreeLegArbitrage(
  pair1Rate: DecimalValue, // e.g. A -> B rate (e.g. BTC -> USDT)
  pair2Rate: DecimalValue, // e.g. B -> C rate (e.g. USDT -> ETH)
  pair3Rate: DecimalValue, // e.g. C -> A rate (e.g. ETH -> BTC)
  feeRatePerLegPercent = '0.1',
): CalculationResult {
  const r1 = toDecimal(pair1Rate);
  const r2 = toDecimal(pair2Rate);
  const r3 = toDecimal(pair3Rate);
  const feeFactor = new Decimal(1).minus(toDecimal(feeRatePerLegPercent).dividedBy(100));

  // End quantity from 1 unit of A: 1 * r1 * fee * r2 * fee * r3 * fee
  const grossProduct = r1.times(r2).times(r3);
  const netProduct = grossProduct.times(feeFactor.pow(3));

  const grossReturnPercent = grossProduct.minus(1).times(100);
  const netReturnPercent = netProduct.minus(1).times(100);

  return {
    inputs: { pair1Rate, pair2Rate, pair3Rate, feeRatePerLegPercent },
    outputs: {
      grossMultiplier: grossProduct.toNumber(),
      netMultiplier: netProduct.toNumber(),
      grossReturnPercent: grossReturnPercent.toNumber(),
      netReturnPercent: netReturnPercent.toNumber(),
      isProfitable: netReturnPercent.greaterThan(0),
    },
    formula: 'Net Return = (R_AB * R_BC * R_CA * (1 - fee)^3 - 1) * 100%',
    assumptions: [
      'All 3 pairs trade within the same exchange orderbook without balance transfer latency',
    ],
    warnings: netReturnPercent.lessThanOrEqualTo(0)
      ? ['Triangular route is not profitable after 3 legs of fees.']
      : [],
    breakdown: {
      feeDeductionTotalPercent: new Decimal(1).minus(feeFactor.pow(3)).times(100).toNumber(),
    },
    executedAt: Date.now(),
  };
}

/** 9. Circular Arbitrage Calculator */
export function calculateCircularArbitrage(
  rates: DecimalValue[],
  feePercentPerHop: DecimalValue = '0.075',
): CalculationResult {
  const hopFee = new Decimal(1).minus(toDecimal(feePercentPerHop).dividedBy(100));
  let grossCycle = new Decimal(1);

  rates.forEach((r) => {
    grossCycle = grossCycle.times(toDecimal(r));
  });

  const totalFeeMultiplier = hopFee.pow(rates.length);
  const netCycle = grossCycle.times(totalFeeMultiplier);

  const netProfitPercent = netCycle.minus(1).times(100);

  return {
    inputs: { rates, feePercentPerHop },
    outputs: {
      totalHops: rates.length,
      netMultiplier: netCycle.toNumber(),
      netProfitPercent: netProfitPercent.toNumber(),
      isProfitable: netProfitPercent.greaterThan(0),
    },
    formula: 'Net Cycle = Prod(Rate_i * (1 - fee_i)) - 1',
    assumptions: ['Sequential execution across N cyclical pairs without price slippage'],
    warnings: rates.length < 3 ? ['Circular arbitrage typically requires at least 3 hops.'] : [],
    breakdown: { grossMultiplier: grossCycle.toNumber() },
    executedAt: Date.now(),
  };
}

/** 10. Capital Allocation Calculator */
export function calculateCapitalAllocation(
  totalPortfolioCapitalUsd: DecimalValue,
  opportunities: { id: string; netSpreadPercent: DecimalValue; maxCapacityUsd: DecimalValue }[],
): CalculationResult {
  const totalCap = toDecimal(totalPortfolioCapitalUsd);
  const sorted = [...opportunities]
    .map((o) => ({
      id: o.id,
      spread: toDecimal(o.netSpreadPercent),
      capacity: toDecimal(o.maxCapacityUsd),
    }))
    .filter((o) => o.spread.greaterThan(0))
    .sort((a, b) => b.spread.comparedTo(a.spread));

  let remaining = totalCap;
  const allocations: Record<string, number> = {};
  let totalAllocated = new Decimal(0);
  let weightedReturn = new Decimal(0);

  for (const opp of sorted) {
    if (remaining.isZero()) break;
    const alloc = Decimal.min(remaining, opp.capacity);
    allocations[opp.id] = alloc.toNumber();
    totalAllocated = totalAllocated.plus(alloc);
    weightedReturn = weightedReturn.plus(alloc.times(opp.spread));
    remaining = remaining.minus(alloc);
  }

  const avgSpread = totalAllocated.isZero()
    ? 0
    : weightedReturn.dividedBy(totalAllocated).toNumber();

  return {
    inputs: { totalPortfolioCapitalUsd, opportunitiesCount: opportunities.length },
    outputs: {
      allocatedCapitalUsd: totalAllocated.toNumber(),
      unallocatedCapitalUsd: remaining.toNumber(),
      weightedAverageNetSpreadPercent: avgSpread,
      allocations,
    },
    formula: 'Greedy allocation ordered by highest net spread up to venue liquidity capacity',
    assumptions: [
      'Higher spread opportunities filled first without cross-asset liquidity contention',
    ],
    warnings: remaining.greaterThan(0)
      ? ['Capital capacity was lower than available portfolio size.']
      : [],
    breakdown: allocations,
    executedAt: Date.now(),
  };
}

/** 11. Opportunity ROI Calculator */
export function calculateOpportunityRoi(
  netProfitUsd: DecimalValue,
  capitalUsd: DecimalValue,
  turnoverPeriodMinutes: DecimalValue = 10,
): CalculationResult {
  const net = toDecimal(netProfitUsd);
  const cap = toDecimal(capitalUsd);
  const period = toDecimal(turnoverPeriodMinutes);

  const cycleRoi = cap.isZero() ? new Decimal(0) : net.dividedBy(cap).times(100);
  // Annualized compounding cycles per year = (365 * 24 * 60) / turnoverPeriodMinutes
  const cyclesPerYear = period.isZero() ? 0 : new Decimal(525600).dividedBy(period).toNumber();
  const annualizedSimpleApr = cycleRoi.times(cyclesPerYear);

  return {
    inputs: { netProfitUsd, capitalUsd, turnoverPeriodMinutes },
    outputs: {
      perCycleRoiPercent: cycleRoi.toNumber(),
      cyclesPerYear,
      annualizedAprPercent: annualizedSimpleApr.toNumber(),
    },
    formula: 'Cycle ROI = (Net / Capital) * 100; APR = Cycle ROI * Cycles_per_year',
    assumptions: ['Immediate capital redeployment after cycle turnover'],
    warnings: [],
    breakdown: { netProfitPerCycleUsd: net.toNumber() },
    executedAt: Date.now(),
  };
}

/** 12. Opportunity Decay Calculator */
export function calculateOpportunityDecay(
  initialSpreadPercent: DecimalValue,
  halfLifeSeconds: DecimalValue,
  elapsedSeconds: DecimalValue,
): CalculationResult {
  const s0 = toDecimal(initialSpreadPercent);
  const tHalf = toDecimal(halfLifeSeconds);
  const t = toDecimal(elapsedSeconds);

  // S(t) = S0 * 2^(-t / tHalf)
  const exponent = tHalf.isZero() ? 0 : t.dividedBy(tHalf).negated().toNumber();
  const decayedSpread = s0.times(Math.pow(2, exponent));

  return {
    inputs: { initialSpreadPercent, halfLifeSeconds, elapsedSeconds },
    outputs: {
      remainingSpreadPercent: decayedSpread.toNumber(),
      decayPercentage: s0.isZero()
        ? 0
        : s0.minus(decayedSpread).dividedBy(s0).times(100).toNumber(),
    },
    formula: 'S(t) = S_0 * 2^(-t / t_half)',
    assumptions: ['Exponential quote reconciliation driven by competing taker flow'],
    warnings: decayedSpread.lessThan('0.1')
      ? ['Spread decayed below typical execution threshold.']
      : [],
    breakdown: { elapsedRatio: tHalf.isZero() ? 0 : t.dividedBy(tHalf).toNumber() },
    executedAt: Date.now(),
  };
}

/** 13. Arbitrage Route Profit Calculator */
export function calculateRouteProfit(
  legs: { action: 'BUY' | 'SELL'; price: DecimalValue; feeUsd: DecimalValue }[],
  tradeQuantity: DecimalValue,
): CalculationResult {
  const qty = toDecimal(tradeQuantity);
  let cashFlow = new Decimal(0);
  let totalFees = new Decimal(0);

  legs.forEach((leg) => {
    const fee = toDecimal(leg.feeUsd);
    totalFees = totalFees.plus(fee);
    const legAmount = toDecimal(leg.price).times(qty);
    if (leg.action === 'BUY') {
      cashFlow = cashFlow.minus(legAmount);
    } else {
      cashFlow = cashFlow.plus(legAmount);
    }
  });

  const netProfit = cashFlow.minus(totalFees);

  return {
    inputs: { legCount: legs.length, tradeQuantity },
    outputs: {
      grossProfitUsd: cashFlow.toNumber(),
      totalFeesUsd: totalFees.toNumber(),
      netProfitUsd: netProfit.toNumber(),
      isProfitable: netProfit.greaterThan(0),
    },
    formula: 'Net = Sum(CashFlow_legs) - Sum(Fees_legs)',
    assumptions: ['All route legs execute without partial fill slippage'],
    warnings: netProfit.lessThanOrEqualTo(0) ? ['Route yields zero or negative net proceeds.'] : [],
    breakdown: { totalFeesUsd: totalFees.toNumber() },
    executedAt: Date.now(),
  };
}

/** 14. Minimum Trade Size Calculator */
export function calculateMinimumTradeSize(
  fixedCostsUsd: DecimalValue, // Gas + Bridge + Withdrawal
  grossSpreadPercent: DecimalValue,
  variableFeePercent: DecimalValue, // trading fees
  targetNetProfitUsd: DecimalValue = '10',
): CalculationResult {
  const fixed = toDecimal(fixedCostsUsd);
  const spread = toDecimal(grossSpreadPercent).dividedBy(100);
  const varFee = toDecimal(variableFeePercent).dividedBy(100);
  const targetProfit = toDecimal(targetNetProfitUsd);

  // Net Profit = (spread - varFee) * TradeSize - fixed
  // TradeSize = (fixed + targetProfit) / (spread - varFee)
  const netMargin = spread.minus(varFee);

  if (netMargin.lessThanOrEqualTo(0)) {
    return {
      inputs: { fixedCostsUsd, grossSpreadPercent, variableFeePercent, targetNetProfitUsd },
      outputs: { minTradeSizeUsd: 0, isFeasible: false },
      formula: 'Size = (Fixed + Target) / (Spread - VariableFees)',
      assumptions: ['Target net profit per transaction'],
      warnings: ['Gross spread is smaller than variable fees; no trade size can be profitable.'],
      breakdown: { netMarginRate: netMargin.toNumber() },
      executedAt: Date.now(),
    };
  }

  const minSize = fixed.plus(targetProfit).dividedBy(netMargin);

  return {
    inputs: { fixedCostsUsd, grossSpreadPercent, variableFeePercent, targetNetProfitUsd },
    outputs: { minTradeSizeUsd: minSize.toNumber(), isFeasible: true },
    formula:
      'Min Trade Size = (Fixed_Costs + Target_Profit) / (Gross_Spread_Rate - Variable_Fee_Rate)',
    assumptions: ['Constant slippage up to the calculated minimum volume'],
    warnings: [],
    breakdown: { netMarginRate: netMargin.toNumber() },
    executedAt: Date.now(),
  };
}

/** 15. Maximum Profitable Trade Size Calculator */
export function calculateMaxProfitableTradeSize(
  grossSpreadPercent: DecimalValue,
  fixedCostsUsd: DecimalValue,
  tradingFeePercent: DecimalValue,
  slippageFactor: DecimalValue, // quadratic or linear price impact slope: slippage = k * volume
): CalculationResult {
  const s = toDecimal(grossSpreadPercent).dividedBy(100);
  const fixed = toDecimal(fixedCostsUsd);
  const fee = toDecimal(tradingFeePercent).dividedBy(100);
  const k = toDecimal(slippageFactor); // e.g. 0.0000001 per dollar

  // Net Profit = (s - fee) * V - k * V^2 - fixed
  // Marginal Profit = 0 -> (s - fee) - 2 * k * V = 0
  // Optimal V = (s - fee) / (2 * k)
  const margin = s.minus(fee);

  if (margin.lessThanOrEqualTo(0) || k.isZero()) {
    return {
      inputs: { grossSpreadPercent, fixedCostsUsd, tradingFeePercent, slippageFactor },
      outputs: { optimalTradeSizeUsd: 0, maxProfitableSizeUsd: 0, maxProfitUsd: 0 },
      formula: 'V_optimal = (Spread - Fee) / (2 * k)',
      assumptions: ['Linear marginal market impact: Impact = k * Volume'],
      warnings: ['Non-positive base margin or zero impact slope.'],
      breakdown: {},
      executedAt: Date.now(),
    };
  }

  const optimalSize = margin.dividedBy(k.times(2));
  const maxProfit = margin
    .times(optimalSize)
    .minus(k.times(optimalSize.pow(2)))
    .minus(fixed);

  // Maximum break-even volume (V where profit = 0): k*V^2 - margin*V + fixed = 0
  // V = (margin + sqrt(margin^2 - 4*k*fixed)) / (2*k)
  const discriminant = margin.pow(2).minus(k.times(fixed).times(4));
  let maxBreakEven = new Decimal(0);
  if (discriminant.greaterThanOrEqualTo(0)) {
    maxBreakEven = margin.plus(discriminant.sqrt()).dividedBy(k.times(2));
  }

  return {
    inputs: { grossSpreadPercent, fixedCostsUsd, tradingFeePercent, slippageFactor },
    outputs: {
      optimalTradeSizeUsd: optimalSize.toNumber(),
      maxProfitableSizeUsd: maxBreakEven.toNumber(),
      maxEstimatedProfitUsd: maxProfit.toNumber(),
    },
    formula:
      'V_opt = (Spread - Fee) / (2 * k); V_max = (Margin + sqrt(Margin^2 - 4*k*Fixed)) / (2*k)',
    assumptions: ['Order book depth exhibits quadratic impact on executed tranche size'],
    warnings: maxProfit.lessThanOrEqualTo(0)
      ? ['Fixed fees exceed maximum attainable slippage-adjusted profit.']
      : [],
    breakdown: {
      optimalSizeUsd: optimalSize.toNumber(),
      maxBreakEvenSizeUsd: maxBreakEven.toNumber(),
    },
    executedAt: Date.now(),
  };
}
