import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';

/** 1. Position Size Calculator */
export function calculateFuturesPositionSize(
  marginUsd: DecimalValue,
  leverage: DecimalValue,
  entryPrice: DecimalValue,
): CalculationResult {
  const m = toDecimal(marginUsd);
  const lev = toDecimal(leverage);
  const price = toDecimal(entryPrice);

  const notionalUsd = m.times(lev);
  const contractQuantity = price.isZero() ? new Decimal(0) : notionalUsd.dividedBy(price);

  return {
    inputs: { marginUsd, leverage, entryPrice },
    outputs: {
      positionNotionalUsd: notionalUsd.toNumber(),
      contractQuantity: contractQuantity.toNumber(),
    },
    formula: 'Notional = Margin * Leverage; Qty = Notional / Price',
    assumptions: ['Isolated margin position sizing'],
    warnings: lev.greaterThan(20)
      ? ['High leverage (> 20x); elevated liquidation sensitivity.']
      : [],
    breakdown: { notionalUsd: notionalUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 2. Leverage Calculator */
export function calculateEffectiveLeverage(
  positionNotionalUsd: DecimalValue,
  collateralUsd: DecimalValue,
): CalculationResult {
  const notional = toDecimal(positionNotionalUsd);
  const col = toDecimal(collateralUsd);
  const lev = col.isZero() ? new Decimal(0) : notional.dividedBy(col);

  return {
    inputs: { positionNotionalUsd, collateralUsd },
    outputs: { effectiveLeverage: lev.toNumber() },
    formula: 'Effective Leverage = Position Notional / Total Collateral',
    assumptions: ['Includes unrealized PnL and active cross collateral'],
    warnings: lev.greaterThan(50) ? ['Extreme leverage (> 50x).'] : [],
    breakdown: { notionalUsd: notional.toNumber(), collateralUsd: col.toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. Margin Calculator */
export function calculateMarginRequired(
  positionNotionalUsd: DecimalValue,
  leverage: DecimalValue,
): CalculationResult {
  const notional = toDecimal(positionNotionalUsd);
  const lev = toDecimal(leverage);
  const margin = lev.isZero() ? new Decimal(0) : notional.dividedBy(lev);

  return {
    inputs: { positionNotionalUsd, leverage },
    outputs: { marginRequiredUsd: margin.toNumber() },
    formula: 'Margin = Notional / Leverage',
    assumptions: ['Base initial margin allocation before order placement'],
    warnings: [],
    breakdown: { marginUsd: margin.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. Initial Margin Calculator */
export function calculateInitialMargin(
  entryPrice: DecimalValue,
  quantity: DecimalValue,
  initialMarginRatePercent: DecimalValue = '10', // 10% = 10x
): CalculationResult {
  const price = toDecimal(entryPrice);
  const qty = toDecimal(quantity);
  const imr = toDecimal(initialMarginRatePercent).dividedBy(100);

  const notional = price.times(qty);
  const initialMargin = notional.times(imr);

  return {
    inputs: { entryPrice, quantity, initialMarginRatePercent },
    outputs: {
      initialMarginUsd: initialMargin.toNumber(),
      positionNotionalUsd: notional.toNumber(),
    },
    formula: 'Initial Margin = (Price * Quantity) * Initial_Margin_Rate',
    assumptions: ['Standard exchange risk bracket initial margin rate'],
    warnings: [],
    breakdown: { initialMarginUsd: initialMargin.toNumber() },
    executedAt: Date.now(),
  };
}

/** 5. Maintenance Margin Calculator */
export function calculateMaintenanceMargin(
  positionNotionalUsd: DecimalValue,
  maintenanceMarginRatePercent: DecimalValue = '0.5', // 0.5% default
): CalculationResult {
  const notional = toDecimal(positionNotionalUsd);
  const mmr = toDecimal(maintenanceMarginRatePercent).dividedBy(100);
  const mmUsd = notional.times(mmr);

  return {
    inputs: { positionNotionalUsd, maintenanceMarginRatePercent },
    outputs: {
      maintenanceMarginUsd: mmUsd.toNumber(),
      maintenanceMarginRatePercent: toDecimal(maintenanceMarginRatePercent).toNumber(),
    },
    formula: 'Maintenance Margin = Notional * Maintenance_Margin_Rate',
    assumptions: ['Threshold below which liquidation protocol triggers'],
    warnings: [],
    breakdown: { mmUsd: mmUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 6. Liquidation Price Calculator (Long and Short) */
export function calculateLiquidationPrice(
  entryPrice: DecimalValue,
  leverage: DecimalValue,
  maintenanceMarginRatePercent: DecimalValue = '0.5',
  isLong = true,
): CalculationResult {
  const pEntry = toDecimal(entryPrice);
  const lev = toDecimal(leverage);
  const mmr = toDecimal(maintenanceMarginRatePercent).dividedBy(100);

  // Initial margin rate IMR = 1 / Leverage
  const imr = lev.isZero() ? new Decimal(1) : new Decimal(1).dividedBy(lev);

  // For Long: P_liq = P_entry * (1 - IMR + MMR)
  // For Short: P_liq = P_entry * (1 + IMR - MMR)
  let pLiq: Decimal;
  if (isLong) {
    pLiq = pEntry.times(new Decimal(1).minus(imr).plus(mmr));
  } else {
    pLiq = pEntry.times(new Decimal(1).plus(imr).minus(mmr));
  }

  const distancePercent = pEntry.isZero()
    ? new Decimal(0)
    : pLiq.minus(pEntry).abs().dividedBy(pEntry).times(100);

  return {
    inputs: { entryPrice, leverage, maintenanceMarginRatePercent, isLong },
    outputs: {
      liquidationPrice: pLiq.toNumber(),
      distancePercent: distancePercent.toNumber(),
      isLongPosition: isLong,
    },
    formula: isLong
      ? 'P_liq = P_entry * (1 - (1/Lev) + MMR)'
      : 'P_liq = P_entry * (1 + (1/Lev) - MMR)',
    assumptions: ['Isolated margin position without fee slippage penalty deduction'],
    warnings: distancePercent.lessThan('2.0')
      ? ['Liquidation price is within 2% of entry price (Extreme Risk).']
      : [],
    breakdown: { entryPrice: pEntry.toNumber(), liquidationPrice: pLiq.toNumber() },
    executedAt: Date.now(),
  };
}

/** 7. PnL Calculator */
export function calculateFuturesPnl(
  entryPrice: DecimalValue,
  exitPrice: DecimalValue,
  quantity: DecimalValue,
  isLong = true,
  feeUsd: DecimalValue = '0',
): CalculationResult {
  const pEntry = toDecimal(entryPrice);
  const pExit = toDecimal(exitPrice);
  const qty = toDecimal(quantity);
  const fees = toDecimal(feeUsd);

  // Long: (P_exit - P_entry) * Qty
  // Short: (P_entry - P_exit) * Qty
  const grossPnl = isLong ? pExit.minus(pEntry).times(qty) : pEntry.minus(pExit).times(qty);
  const netPnl = grossPnl.minus(fees);

  const priceChangePct = pEntry.isZero()
    ? new Decimal(0)
    : pExit.minus(pEntry).dividedBy(pEntry).times(100);

  return {
    inputs: { entryPrice, exitPrice, quantity, isLong, feeUsd },
    outputs: {
      grossPnlUsd: grossPnl.toNumber(),
      netPnlUsd: netPnl.toNumber(),
      priceChangePercent: priceChangePct.toNumber(),
      isProfitable: netPnl.greaterThan(0),
    },
    formula: isLong
      ? 'PnL = (P_exit - P_entry) * Qty - Fees'
      : 'PnL = (P_entry - P_exit) * Qty - Fees',
    assumptions: ['Linear USD-settled contracts'],
    warnings: [],
    breakdown: { grossPnlUsd: grossPnl.toNumber(), feeDeductionUsd: fees.toNumber() },
    executedAt: Date.now(),
  };
}

/** 8. ROE Calculator (Return on Equity) */
export function calculateRoe(netPnlUsd: DecimalValue, marginUsd: DecimalValue): CalculationResult {
  const pnl = toDecimal(netPnlUsd);
  const margin = toDecimal(marginUsd);
  const roePercent = margin.isZero() ? new Decimal(0) : pnl.dividedBy(margin).times(100);

  return {
    inputs: { netPnlUsd, marginUsd },
    outputs: { roePercent: roePercent.toNumber() },
    formula: 'ROE % = (Net PnL / Initial Margin) * 100%',
    assumptions: ['Leverage magnified return against committed margin capital'],
    warnings: [],
    breakdown: { netPnlUsd: pnl.toNumber(), marginUsd: margin.toNumber() },
    executedAt: Date.now(),
  };
}

/** 9. Break-Even Price Calculator */
export function calculateFuturesBreakEvenPrice(
  entryPrice: DecimalValue,
  takerFeePercent: DecimalValue = '0.05',
  isLong = true,
): CalculationResult {
  const pEntry = toDecimal(entryPrice);
  const feePct = toDecimal(takerFeePercent).dividedBy(100);

  // Round-trip fee ~ 2 * feePct
  // Long break-even: P_be = P_entry * (1 + 2*feePct)
  // Short break-even: P_be = P_entry * (1 - 2*feePct)
  const roundTripFeeFactor = feePct.times(2);
  const bePrice = isLong
    ? pEntry.times(new Decimal(1).plus(roundTripFeeFactor))
    : pEntry.times(new Decimal(1).minus(roundTripFeeFactor));

  return {
    inputs: { entryPrice, takerFeePercent, isLong },
    outputs: { breakEvenPrice: bePrice.toNumber() },
    formula: isLong
      ? 'BreakEven = P_entry * (1 + 2 * Fee%)'
      : 'BreakEven = P_entry * (1 - 2 * Fee%)',
    assumptions: ['Two taker orders (entry and exit)'],
    warnings: [],
    breakdown: { feeOffsetUsd: bePrice.minus(pEntry).abs().toNumber() },
    executedAt: Date.now(),
  };
}

/** 10. Risk/Reward Calculator */
export function calculateRiskRewardRatio(
  entryPrice: DecimalValue,
  stopLossPrice: DecimalValue,
  takeProfitPrice: DecimalValue,
): CalculationResult {
  const pEntry = toDecimal(entryPrice);
  const pStop = toDecimal(stopLossPrice);
  const pTake = toDecimal(takeProfitPrice);

  const risk = pEntry.minus(pStop).abs();
  const reward = pTake.minus(pEntry).abs();
  const ratio = risk.isZero() ? new Decimal(0) : reward.dividedBy(risk);

  return {
    inputs: { entryPrice, stopLossPrice, takeProfitPrice },
    outputs: {
      riskRewardRatio: ratio.toNumber(),
      riskUsdPerUnit: risk.toNumber(),
      rewardUsdPerUnit: reward.toNumber(),
    },
    formula: 'R/R = |TakeProfit - Entry| / |Entry - StopLoss|',
    assumptions: ['Static stop loss and take profit orders without trailing shifts'],
    warnings: ratio.lessThan('1.0') ? ['Risk exceeds potential reward (< 1.0 R/R).'] : [],
    breakdown: { risk: risk.toNumber(), reward: reward.toNumber() },
    executedAt: Date.now(),
  };
}

/** 11. Stop-Loss Calculator */
export function calculateStopLossLevel(
  entryPrice: DecimalValue,
  maxLossUsd: DecimalValue,
  positionQuantity: DecimalValue,
  isLong = true,
): CalculationResult {
  const pEntry = toDecimal(entryPrice);
  const maxLoss = toDecimal(maxLossUsd);
  const qty = toDecimal(positionQuantity);

  const priceDrop = qty.isZero() ? new Decimal(0) : maxLoss.dividedBy(qty);
  const stopPrice = isLong ? pEntry.minus(priceDrop) : pEntry.plus(priceDrop);

  return {
    inputs: { entryPrice, maxLossUsd, positionQuantity, isLong },
    outputs: {
      stopLossPrice: stopPrice.toNumber(),
      allowedPriceDrop: priceDrop.toNumber(),
    },
    formula: isLong ? 'Stop = Entry - (MaxLoss / Qty)' : 'Stop = Entry + (MaxLoss / Qty)',
    assumptions: ['Zero slippage on stop-loss market order trigger'],
    warnings: stopPrice.lessThanOrEqualTo(0) ? ['Calculated stop-loss price is non-positive.'] : [],
    breakdown: { maxLossUsd: maxLoss.toNumber() },
    executedAt: Date.now(),
  };
}

/** 12. Take-Profit Calculator */
export function calculateTakeProfitLevel(
  entryPrice: DecimalValue,
  targetProfitUsd: DecimalValue,
  positionQuantity: DecimalValue,
  isLong = true,
): CalculationResult {
  const pEntry = toDecimal(entryPrice);
  const targetProfit = toDecimal(targetProfitUsd);
  const qty = toDecimal(positionQuantity);

  const priceRise = qty.isZero() ? new Decimal(0) : targetProfit.dividedBy(qty);
  const takePrice = isLong ? pEntry.plus(priceRise) : pEntry.minus(priceRise);

  return {
    inputs: { entryPrice, targetProfitUsd, positionQuantity, isLong },
    outputs: {
      takeProfitPrice: takePrice.toNumber(),
      targetPriceDistance: priceRise.toNumber(),
    },
    formula: isLong ? 'Target = Entry + (Profit / Qty)' : 'Target = Entry - (Profit / Qty)',
    assumptions: ['Limit order fill at the exact target price'],
    warnings: takePrice.lessThanOrEqualTo(0) ? ['Calculated target price is non-positive.'] : [],
    breakdown: { targetProfitUsd: targetProfit.toNumber() },
    executedAt: Date.now(),
  };
}

/** 13. Funding Impact Calculator */
export function calculateFuturesFundingImpact(
  positionNotionalUsd: DecimalValue,
  fundingRatePercent: DecimalValue,
  isLong = true,
): CalculationResult {
  const notional = toDecimal(positionNotionalUsd);
  const rate = toDecimal(fundingRatePercent).dividedBy(100);

  // Positive rate: Long pays short
  // Negative rate: Short pays long
  const rawCost = notional.times(rate);
  const netImpactUsd = isLong ? rawCost.negated() : rawCost;

  return {
    inputs: { positionNotionalUsd, fundingRatePercent, isLong },
    outputs: {
      fundingImpactUsd: netImpactUsd.toNumber(),
      isPayingFunding: netImpactUsd.isNegative(),
      notionalUsd: notional.toNumber(),
    },
    formula: 'Cost = Notional * FundingRate * (isLong ? -1 : +1)',
    assumptions: ['Single funding settlement interval snapshot'],
    warnings: [],
    breakdown: { rawIntervalCostUsd: rawCost.toNumber() },
    executedAt: Date.now(),
  };
}
