import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';

export interface TaxLot {
  id: string;
  timestamp: number;
  amount: Decimal;
  costBasisPerUnitUsd: Decimal;
  totalCostUsd: Decimal;
}

export interface JurisdictionTaxRules {
  jurisdictionCode: string; // e.g. 'GENERIC', 'US', 'DE', 'UK'
  shortTermCapitalGainsRatePercent: Decimal;
  longTermCapitalGainsRatePercent: Decimal;
  longTermHoldingPeriodDays: number;
}

export const DEFAULT_TAX_RULES: JurisdictionTaxRules = {
  jurisdictionCode: 'GENERIC',
  shortTermCapitalGainsRatePercent: new Decimal('20.0'),
  longTermCapitalGainsRatePercent: new Decimal('10.0'),
  longTermHoldingPeriodDays: 365,
};

/** 1. Cost Basis Calculator */
export function calculateCostBasis(
  purchaseAmount: DecimalValue,
  purchasePriceUsd: DecimalValue,
  acquisitionFeesUsd: DecimalValue = '0',
): CalculationResult {
  const amt = toDecimal(purchaseAmount);
  const p = toDecimal(purchasePriceUsd);
  const fees = toDecimal(acquisitionFeesUsd);

  const totalCost = amt.times(p).plus(fees);
  const perUnitCost = amt.isZero() ? new Decimal(0) : totalCost.dividedBy(amt);

  return {
    inputs: { purchaseAmount, purchasePriceUsd, acquisitionFeesUsd },
    outputs: {
      totalCostBasisUsd: totalCost.toNumber(),
      costBasisPerUnitUsd: perUnitCost.toNumber(),
      capitalizedFeesUsd: fees.toNumber(),
    },
    formula: 'Cost Basis = (Amount * Price) + Acquisition_Fees',
    assumptions: ['Brokerage and gas fees capitalized into asset cost basis'],
    warnings: [],
    breakdown: { totalCostUsd: totalCost.toNumber() },
    executedAt: Date.now(),
  };
}

/** 2. Realized Gain Calculator (with Jurisdiction Adapter) */
export function calculateRealizedGain(
  proceedsUsd: DecimalValue,
  costBasisUsd: DecimalValue,
  disposalFeesUsd: DecimalValue = '0',
  holdingPeriodDays: number = 180,
  rules: JurisdictionTaxRules = DEFAULT_TAX_RULES,
): CalculationResult {
  const proceeds = toDecimal(proceedsUsd);
  const cost = toDecimal(costBasisUsd);
  const fees = toDecimal(disposalFeesUsd);

  // Net Proceeds = proceeds - fees
  const netProceeds = proceeds.minus(fees);
  const realizedGainUsd = netProceeds.minus(cost);

  const isLongTerm = holdingPeriodDays >= rules.longTermHoldingPeriodDays;
  const applicableRate = isLongTerm
    ? rules.longTermCapitalGainsRatePercent
    : rules.shortTermCapitalGainsRatePercent;

  const estimatedTaxLiabilityUsd = realizedGainUsd.isPositive()
    ? realizedGainUsd.times(applicableRate.dividedBy(100))
    : new Decimal(0);

  return {
    inputs: {
      proceedsUsd,
      costBasisUsd,
      disposalFeesUsd,
      holdingPeriodDays,
      jurisdiction: rules.jurisdictionCode,
    },
    outputs: {
      realizedGainUsd: realizedGainUsd.toNumber(),
      isGain: realizedGainUsd.isPositive(),
      isLongTerm,
      applicableTaxRatePercent: applicableRate.toNumber(),
      estimatedTaxLiabilityUsd: estimatedTaxLiabilityUsd.toNumber(),
      netAfterTaxProceedsUsd: netProceeds.minus(estimatedTaxLiabilityUsd).toNumber(),
    },
    formula: 'Realized Gain = (Proceeds - Disposal_Fees) - Cost_Basis',
    assumptions: [
      `Applied ${rules.jurisdictionCode} tax profile (${isLongTerm ? 'Long-Term' : 'Short-Term'})`,
    ],
    warnings: realizedGainUsd.isNegative()
      ? ['Realized capital loss incurred. May offset capital gains.']
      : [],
    breakdown: {
      realizedGainUsd: realizedGainUsd.toNumber(),
      taxUsd: estimatedTaxLiabilityUsd.toNumber(),
    },
    executedAt: Date.now(),
  };
}

/** 3. Unrealized Gain Calculator */
export function calculateUnrealizedGain(
  currentPriceUsd: DecimalValue,
  tokenHoldingAmount: DecimalValue,
  totalCostBasisUsd: DecimalValue,
): CalculationResult {
  const price = toDecimal(currentPriceUsd);
  const amount = toDecimal(tokenHoldingAmount);
  const cost = toDecimal(totalCostBasisUsd);

  const currentValue = amount.times(price);
  const unrealizedGainUsd = currentValue.minus(cost);
  const unrealizedGainPercent = cost.isZero()
    ? new Decimal(0)
    : unrealizedGainUsd.dividedBy(cost).times(100);

  return {
    inputs: { currentPriceUsd, tokenHoldingAmount, totalCostBasisUsd },
    outputs: {
      currentMarketValueUsd: currentValue.toNumber(),
      unrealizedGainUsd: unrealizedGainUsd.toNumber(),
      unrealizedGainPercent: unrealizedGainPercent.toNumber(),
      isPaperProfit: unrealizedGainUsd.isPositive(),
    },
    formula: 'Unrealized Gain = (Current_Price * Amount) - Total_Cost_Basis',
    assumptions: ['Mark-to-market valuation at current price snapshot'],
    warnings: [],
    breakdown: { currentValueUsd: currentValue.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. FIFO Calculator (First-In, First-Out lot disposition) */
export function calculateFifoGain(
  sellAmount: DecimalValue,
  sellPriceUsd: DecimalValue,
  inventoryLots: { amount: DecimalValue; priceUsd: DecimalValue; timestamp: number }[],
): CalculationResult {
  let remainingToSell = toDecimal(sellAmount);
  const pSell = toDecimal(sellPriceUsd);

  // Sort lots oldest first
  const sortedLots = [...inventoryLots]
    .map((l, idx) => ({
      id: `lot-${idx}`,
      amount: toDecimal(l.amount),
      price: toDecimal(l.priceUsd),
      timestamp: l.timestamp,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  let totalCostBasis = new Decimal(0);
  let totalSold = new Decimal(0);
  const matchedLots: { lotTimestamp: number; amountUsed: number; costBasisPerUnit: number }[] = [];

  for (const lot of sortedLots) {
    if (remainingToSell.isZero()) break;
    const fillAmt = Decimal.min(remainingToSell, lot.amount);
    totalCostBasis = totalCostBasis.plus(fillAmt.times(lot.price));
    totalSold = totalSold.plus(fillAmt);
    remainingToSell = remainingToSell.minus(fillAmt);

    matchedLots.push({
      lotTimestamp: lot.timestamp,
      amountUsed: fillAmt.toNumber(),
      costBasisPerUnit: lot.price.toNumber(),
    });
  }

  const proceeds = totalSold.times(pSell);
  const realizedGainUsd = proceeds.minus(totalCostBasis);

  return {
    inputs: { sellAmount, sellPriceUsd, lotsCount: inventoryLots.length },
    outputs: {
      totalSoldAmount: totalSold.toNumber(),
      grossProceedsUsd: proceeds.toNumber(),
      totalFifoCostBasisUsd: totalCostBasis.toNumber(),
      realizedGainUsd: realizedGainUsd.toNumber(),
      unmatchedAmount: remainingToSell.toNumber(),
    },
    formula: 'FIFO: Dispose oldest acquisition lots first',
    assumptions: ['Chronological lot queue consumption'],
    warnings: remainingToSell.greaterThan(0)
      ? ['Insufficient historical lot inventory to cover sold quantity.']
      : [],
    breakdown: { matchedLots },
    executedAt: Date.now(),
  };
}

/** 5. LIFO Calculator (Last-In, First-Out lot disposition) */
export function calculateLifoGain(
  sellAmount: DecimalValue,
  sellPriceUsd: DecimalValue,
  inventoryLots: { amount: DecimalValue; priceUsd: DecimalValue; timestamp: number }[],
): CalculationResult {
  let remainingToSell = toDecimal(sellAmount);
  const pSell = toDecimal(sellPriceUsd);

  // Sort lots newest first
  const sortedLots = [...inventoryLots]
    .map((l, idx) => ({
      id: `lot-${idx}`,
      amount: toDecimal(l.amount),
      price: toDecimal(l.priceUsd),
      timestamp: l.timestamp,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  let totalCostBasis = new Decimal(0);
  let totalSold = new Decimal(0);
  const matchedLots: { lotTimestamp: number; amountUsed: number; costBasisPerUnit: number }[] = [];

  for (const lot of sortedLots) {
    if (remainingToSell.isZero()) break;
    const fillAmt = Decimal.min(remainingToSell, lot.amount);
    totalCostBasis = totalCostBasis.plus(fillAmt.times(lot.price));
    totalSold = totalSold.plus(fillAmt);
    remainingToSell = remainingToSell.minus(fillAmt);

    matchedLots.push({
      lotTimestamp: lot.timestamp,
      amountUsed: fillAmt.toNumber(),
      costBasisPerUnit: lot.price.toNumber(),
    });
  }

  const proceeds = totalSold.times(pSell);
  const realizedGainUsd = proceeds.minus(totalCostBasis);

  return {
    inputs: { sellAmount, sellPriceUsd, lotsCount: inventoryLots.length },
    outputs: {
      totalSoldAmount: totalSold.toNumber(),
      grossProceedsUsd: proceeds.toNumber(),
      totalLifoCostBasisUsd: totalCostBasis.toNumber(),
      realizedGainUsd: realizedGainUsd.toNumber(),
      unmatchedAmount: remainingToSell.toNumber(),
    },
    formula: 'LIFO: Dispose newest acquisition lots first',
    assumptions: ['Reverse chronological lot consumption'],
    warnings: remainingToSell.greaterThan(0)
      ? ['Insufficient historical inventory to cover sold quantity.']
      : [],
    breakdown: { matchedLots },
    executedAt: Date.now(),
  };
}

/** 6. Average Cost Calculator (ACB / AVCO) */
export function calculateAverageCostBasis(
  totalAcquisitionCostUsd: DecimalValue,
  totalUnitsAcquired: DecimalValue,
  unitsToSell: DecimalValue,
  sellPriceUsd: DecimalValue,
): CalculationResult {
  const totalCost = toDecimal(totalAcquisitionCostUsd);
  const totalUnits = toDecimal(totalUnitsAcquired);
  const sellUnits = toDecimal(unitsToSell);
  const pSell = toDecimal(sellPriceUsd);

  const avgCostPerUnit = totalUnits.isZero() ? new Decimal(0) : totalCost.dividedBy(totalUnits);
  const costOfSoldUnits = sellUnits.times(avgCostPerUnit);
  const grossProceeds = sellUnits.times(pSell);
  const realizedGainUsd = grossProceeds.minus(costOfSoldUnits);

  return {
    inputs: { totalAcquisitionCostUsd, totalUnitsAcquired, unitsToSell, sellPriceUsd },
    outputs: {
      averageCostPerUnitUsd: avgCostPerUnit.toNumber(),
      costBasisOfSoldUnitsUsd: costOfSoldUnits.toNumber(),
      grossProceedsUsd: grossProceeds.toNumber(),
      realizedGainUsd: realizedGainUsd.toNumber(),
      remainingUnits: totalUnits.minus(sellUnits).toNumber(),
      remainingCostBasisUsd: totalCost.minus(costOfSoldUnits).toNumber(),
    },
    formula:
      'Avg Cost = Total_Cost / Total_Units; Realized = (Sell_Units * P_sell) - (Sell_Units * Avg_Cost)',
    assumptions: ['Weighted average cost pool convention'],
    warnings: sellUnits.greaterThan(totalUnits)
      ? ['Sell quantity exceeds available pool inventory.']
      : [],
    breakdown: { avgCostPerUnitUsd: avgCostPerUnit.toNumber() },
    executedAt: Date.now(),
  };
}

/** 7. Transaction PnL Calculator */
export function calculateTransactionPnl(
  buyPriceUsd: DecimalValue,
  buyQuantity: DecimalValue,
  buyFeeUsd: DecimalValue,
  sellPriceUsd: DecimalValue,
  sellQuantity: DecimalValue,
  sellFeeUsd: DecimalValue,
): CalculationResult {
  const pBuy = toDecimal(buyPriceUsd);
  const qBuy = toDecimal(buyQuantity);
  const fBuy = toDecimal(buyFeeUsd);
  const pSell = toDecimal(sellPriceUsd);
  const qSell = toDecimal(sellQuantity);
  const fSell = toDecimal(sellFeeUsd);

  const totalBuyCost = pBuy.times(qBuy).plus(fBuy);
  const matchedQty = Decimal.min(qBuy, qSell);
  const grossProceeds = pSell.times(matchedQty);
  const allocatedCost = matchedQty.times(pBuy).plus(fBuy.times(matchedQty.dividedBy(qBuy || 1)));

  const netPnlUsd = grossProceeds.minus(allocatedCost).minus(fSell);
  const netRoiPercent = allocatedCost.isZero()
    ? new Decimal(0)
    : netPnlUsd.dividedBy(allocatedCost).times(100);

  return {
    inputs: { buyPriceUsd, buyQuantity, buyFeeUsd, sellPriceUsd, sellQuantity, sellFeeUsd },
    outputs: {
      netPnlUsd: netPnlUsd.toNumber(),
      netRoiPercent: netRoiPercent.toNumber(),
      totalTradingFeesUsd: fBuy.plus(fSell).toNumber(),
      isProfitable: netPnlUsd.greaterThan(0),
    },
    formula: 'Net PnL = (MatchedQty * P_sell) - (MatchedQty * P_buy + Fees_buy) - Fees_sell',
    assumptions: ['Exact transaction match accounting'],
    warnings: [],
    breakdown: { netPnlUsd: netPnlUsd.toNumber() },
    executedAt: Date.now(),
  };
}
