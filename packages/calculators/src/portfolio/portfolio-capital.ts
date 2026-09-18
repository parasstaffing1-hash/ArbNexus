import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';

/** 1. Portfolio Allocation Calculator */
export function calculatePortfolioAllocation(
  totalPortfolioValueUsd: DecimalValue,
  targetWeightsPercent: Record<string, DecimalValue>,
): CalculationResult {
  const total = toDecimal(totalPortfolioValueUsd);
  const targetAllocationsUsd: Record<string, number> = {};
  let totalWeight = new Decimal(0);

  for (const [asset, weight] of Object.entries(targetWeightsPercent)) {
    const w = toDecimal(weight);
    totalWeight = totalWeight.plus(w);
    targetAllocationsUsd[asset] = total.times(w.dividedBy(100)).toNumber();
  }

  return {
    inputs: { totalPortfolioValueUsd, targetWeightsPercent },
    outputs: {
      totalAllocatedUsd: total.toNumber(),
      targetAllocationsUsd,
      sumOfWeightsPercent: totalWeight.toNumber(),
    },
    formula: 'Allocation_i = Total_Portfolio * (Weight_i% / 100)',
    assumptions: ['Static target portfolio weightings'],
    warnings: totalWeight.minus(100).abs().greaterThan('0.01')
      ? ['Sum of target weights does not equal 100%.']
      : [],
    breakdown: targetAllocationsUsd,
    executedAt: Date.now(),
  };
}

/** 2. Position Allocation Calculator */
export function calculatePositionAllocation(
  availableCapitalUsd: DecimalValue,
  riskTolerancePercent: DecimalValue = '2.0', // 2% portfolio risk
  stopLossDistancePercent: DecimalValue = '5.0', // 5% stop
): CalculationResult {
  const cap = toDecimal(availableCapitalUsd);
  const riskPct = toDecimal(riskTolerancePercent).dividedBy(100);
  const stopPct = toDecimal(stopLossDistancePercent).dividedBy(100);

  const maxRiskUsd = cap.times(riskPct);
  // Position = MaxRisk / StopLoss%
  const positionSizeUsd = stopPct.isZero() ? new Decimal(0) : maxRiskUsd.dividedBy(stopPct);

  return {
    inputs: { availableCapitalUsd, riskTolerancePercent, stopLossDistancePercent },
    outputs: {
      positionSizeUsd: positionSizeUsd.toNumber(),
      maxRiskUsd: maxRiskUsd.toNumber(),
      positionToCapitalRatio: cap.isZero() ? 0 : positionSizeUsd.dividedBy(cap).toNumber(),
    },
    formula: 'Position Size = (Capital * Risk%) / StopLoss%',
    assumptions: ['Fixed fractional position sizing risk framework'],
    warnings: positionSizeUsd.greaterThan(cap)
      ? ['Position size exceeds total equity; requires leverage.']
      : [],
    breakdown: { maxRiskUsd: maxRiskUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. Capital Requirement Calculator */
export function calculateCapitalRequirement(
  orderQuantity: DecimalValue,
  assetPriceUsd: DecimalValue,
  bufferMultiplier: DecimalValue = '1.1', // 10% liquidity buffer
): CalculationResult {
  const qty = toDecimal(orderQuantity);
  const price = toDecimal(assetPriceUsd);
  const mult = toDecimal(bufferMultiplier);

  const baseNotionalUsd = qty.times(price);
  const requiredCapitalUsd = baseNotionalUsd.times(mult);

  return {
    inputs: { orderQuantity, assetPriceUsd, bufferMultiplier },
    outputs: {
      baseNotionalUsd: baseNotionalUsd.toNumber(),
      requiredCapitalUsd: requiredCapitalUsd.toNumber(),
      bufferReserveUsd: requiredCapitalUsd.minus(baseNotionalUsd).toNumber(),
    },
    formula: 'Capital Required = (Quantity * Price) * BufferMultiplier',
    assumptions: ['Buffer protects against adverse price movement and slippage surges'],
    warnings: [],
    breakdown: { baseNotionalUsd: baseNotionalUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. Capital Efficiency Calculator */
export function calculateCapitalEfficiency(
  annualizedGrossProfitUsd: DecimalValue,
  totalCapitalCommittedUsd: DecimalValue,
): CalculationResult {
  const profit = toDecimal(annualizedGrossProfitUsd);
  const capital = toDecimal(totalCapitalCommittedUsd);
  const efficiencyRatio = capital.isZero() ? new Decimal(0) : profit.dividedBy(capital);

  return {
    inputs: { annualizedGrossProfitUsd, totalCapitalCommittedUsd },
    outputs: {
      capitalEfficiencyRatio: efficiencyRatio.toNumber(),
      annualizedReturnPercent: efficiencyRatio.times(100).toNumber(),
    },
    formula: 'Efficiency = Annualized Profit / Capital Committed',
    assumptions: ['Continuous capital utilization velocity throughout the fiscal year'],
    warnings: [],
    breakdown: { capitalCommittedUsd: capital.toNumber() },
    executedAt: Date.now(),
  };
}

/** 5. Rebalancing Calculator */
export function calculateRebalancing(
  currentHoldingsUsd: Record<string, DecimalValue>,
  targetWeightsPercent: Record<string, DecimalValue>,
): CalculationResult {
  let totalCurrent = new Decimal(0);
  for (const val of Object.values(currentHoldingsUsd)) {
    totalCurrent = totalCurrent.plus(toDecimal(val));
  }

  const adjustmentsUsd: Record<string, number> = {};
  const currentWeightsPercent: Record<string, number> = {};

  for (const [asset, val] of Object.entries(currentHoldingsUsd)) {
    const curVal = toDecimal(val);
    currentWeightsPercent[asset] = totalCurrent.isZero()
      ? 0
      : curVal.dividedBy(totalCurrent).times(100).toNumber();

    const targetPct = toDecimal(targetWeightsPercent[asset] || 0);
    const targetVal = totalCurrent.times(targetPct.dividedBy(100));
    // Positive adjustment = Buy, Negative adjustment = Sell
    adjustmentsUsd[asset] = targetVal.minus(curVal).toNumber();
  }

  return {
    inputs: { currentHoldingsUsd, targetWeightsPercent },
    outputs: {
      totalPortfolioUsd: totalCurrent.toNumber(),
      adjustmentsUsd,
      currentWeightsPercent,
    },
    formula: 'Adjustment_i = (Total_Portfolio * Target_Weight_i) - Current_Value_i',
    assumptions: ['Rebalancing executed with zero market impact'],
    warnings: [],
    breakdown: adjustmentsUsd,
    executedAt: Date.now(),
  };
}

/** 6. Exposure Calculator */
export function calculateExposure(
  positionsUsd: { asset: string; longUsd: DecimalValue; shortUsd: DecimalValue }[],
): CalculationResult {
  let totalLong = new Decimal(0);
  let totalShort = new Decimal(0);

  positionsUsd.forEach((p) => {
    totalLong = totalLong.plus(toDecimal(p.longUsd));
    totalShort = totalShort.plus(toDecimal(p.shortUsd));
  });

  const grossExposure = totalLong.plus(totalShort);
  const netExposure = totalLong.minus(totalShort);

  return {
    inputs: { positionsCount: positionsUsd.length },
    outputs: {
      totalGrossExposureUsd: grossExposure.toNumber(),
      totalNetExposureUsd: netExposure.toNumber(),
      totalLongUsd: totalLong.toNumber(),
      totalShortUsd: totalShort.toNumber(),
      netToGrossRatio: grossExposure.isZero() ? 0 : netExposure.dividedBy(grossExposure).toNumber(),
    },
    formula: 'Gross = Long + Short; Net = Long - Short',
    assumptions: ['Aggregate market risk exposure'],
    warnings: netExposure.abs().greaterThan(grossExposure.times('0.5'))
      ? ['Directional bias is high (> 50% net exposure).']
      : [],
    breakdown: { totalLongUsd: totalLong.toNumber(), totalShortUsd: totalShort.toNumber() },
    executedAt: Date.now(),
  };
}

/** 7. Chain Exposure Calculator */
export function calculateChainExposure(
  chainBalancesUsd: Record<string, DecimalValue>,
): CalculationResult {
  let total = new Decimal(0);
  for (const val of Object.values(chainBalancesUsd)) {
    total = total.plus(toDecimal(val));
  }

  const distributionPercent: Record<string, number> = {};
  for (const [chain, val] of Object.entries(chainBalancesUsd)) {
    distributionPercent[chain] = total.isZero()
      ? 0
      : toDecimal(val).dividedBy(total).times(100).toNumber();
  }

  return {
    inputs: { chainBalancesUsd },
    outputs: {
      totalAssetsUsd: total.toNumber(),
      distributionPercent,
    },
    formula: 'Chain Exposure % = (Chain_Assets / Total_Assets) * 100',
    assumptions: ['Multi-chain custody risk breakdown'],
    warnings: [],
    breakdown: distributionPercent,
    executedAt: Date.now(),
  };
}

/** 8. Exchange Exposure Calculator */
export function calculateExchangeExposure(
  exchangeBalancesUsd: Record<string, DecimalValue>,
): CalculationResult {
  let total = new Decimal(0);
  for (const val of Object.values(exchangeBalancesUsd)) {
    total = total.plus(toDecimal(val));
  }

  const distributionPercent: Record<string, number> = {};
  let maxExposurePercent = 0;
  let highestExposureExchange = '';

  for (const [ex, val] of Object.entries(exchangeBalancesUsd)) {
    const pct = total.isZero() ? 0 : toDecimal(val).dividedBy(total).times(100).toNumber();
    distributionPercent[ex] = pct;
    if (pct > maxExposurePercent) {
      maxExposurePercent = pct;
      highestExposureExchange = ex;
    }
  }

  return {
    inputs: { exchangeBalancesUsd },
    outputs: {
      totalCexAssetsUsd: total.toNumber(),
      highestExposureExchange,
      maxExposurePercent,
      distributionPercent,
    },
    formula: 'Exchange Exposure % = (Venue_Balance / Total_CEX_Balance) * 100',
    assumptions: ['Counterparty solvency risk concentration'],
    warnings:
      maxExposurePercent > 35
        ? [`Counterparty risk: ${highestExposureExchange} holds > 35% of assets.`]
        : [],
    breakdown: distributionPercent,
    executedAt: Date.now(),
  };
}

/** 9. Stablecoin Exposure Calculator */
export function calculateStablecoinExposure(
  stablecoinHoldingsUsd: Record<string, DecimalValue>,
): CalculationResult {
  let total = new Decimal(0);
  for (const val of Object.values(stablecoinHoldingsUsd)) {
    total = total.plus(toDecimal(val));
  }

  const distributionPercent: Record<string, number> = {};
  for (const [stable, val] of Object.entries(stablecoinHoldingsUsd)) {
    distributionPercent[stable] = total.isZero()
      ? 0
      : toDecimal(val).dividedBy(total).times(100).toNumber();
  }

  return {
    inputs: { stablecoinHoldingsUsd },
    outputs: {
      totalStablecoinsUsd: total.toNumber(),
      distributionPercent,
    },
    formula: 'Stablecoin Exposure % = (Stable_Balance / Total_Stables) * 100',
    assumptions: ['Depeg and issuer reserve concentration analysis'],
    warnings: [],
    breakdown: distributionPercent,
    executedAt: Date.now(),
  };
}

/** 10. Capital Rotation Calculator */
export function calculateCapitalRotation(
  currentVenueYieldAprPercent: DecimalValue,
  newVenueYieldAprPercent: DecimalValue,
  capitalUsd: DecimalValue,
  transferCostsUsd: DecimalValue,
): CalculationResult {
  const curYield = toDecimal(currentVenueYieldAprPercent).dividedBy(100);
  const newYield = toDecimal(newVenueYieldAprPercent).dividedBy(100);
  const cap = toDecimal(capitalUsd);
  const costs = toDecimal(transferCostsUsd);

  // Annual yield difference = capital * (newYield - curYield)
  const annualYieldDiffUsd = cap.times(newYield.minus(curYield));
  const daysToBreakEven = annualYieldDiffUsd.lessThanOrEqualTo(0)
    ? 9999
    : costs.dividedBy(annualYieldDiffUsd.dividedBy(365)).toNumber();

  const netAnnualBenefitUsd = annualYieldDiffUsd.minus(costs);

  return {
    inputs: { currentVenueYieldAprPercent, newVenueYieldAprPercent, capitalUsd, transferCostsUsd },
    outputs: {
      annualGrossYieldDifferenceUsd: annualYieldDiffUsd.toNumber(),
      transferCostsUsd: costs.toNumber(),
      daysToBreakEven: Math.max(0, daysToBreakEven),
      netFirstYearBenefitUsd: netAnnualBenefitUsd.toNumber(),
      shouldRotate: netAnnualBenefitUsd.greaterThan(0),
    },
    formula: 'Days = TransferCost / ((Cap * (Yield_new - Yield_cur)) / 365)',
    assumptions: ['Yield discrepancy persists long enough to exceed migration costs'],
    warnings: daysToBreakEven > 60 ? ['Rotation break-even exceeds 60 days.'] : [],
    breakdown: { netBenefitUsd: netAnnualBenefitUsd.toNumber() },
    executedAt: Date.now(),
  };
}
