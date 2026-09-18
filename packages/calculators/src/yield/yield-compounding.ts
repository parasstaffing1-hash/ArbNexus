import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';

/** 1. APR Calculator (from periodic reward rate) */
export function calculateApr(
  periodicRatePercent: DecimalValue,
  periodsPerYear: number = 365,
): CalculationResult {
  const r = toDecimal(periodicRatePercent);
  const apr = r.times(periodsPerYear);

  return {
    inputs: { periodicRatePercent, periodsPerYear },
    outputs: { aprPercent: apr.toNumber() },
    formula: 'APR = Periodic_Rate% * Periods_Per_Year',
    assumptions: ['Simple uncompounded annualized reward rate'],
    warnings: [],
    breakdown: { periodicRatePercent: r.toNumber() },
    executedAt: Date.now(),
  };
}

/** 2. APY Calculator (with N compounding periods) */
export function calculateApyFromApr(
  aprPercent: DecimalValue,
  compoundingFrequency: 'DAILY' | 'HOURLY' | 'WEEKLY' | 'MONTHLY' | 'CONTINUOUS' = 'DAILY',
): CalculationResult {
  const apr = toDecimal(aprPercent).dividedBy(100);
  const freqMap = {
    DAILY: 365,
    HOURLY: 8760,
    WEEKLY: 52,
    MONTHLY: 12,
    CONTINUOUS: 100000,
  };
  const n = freqMap[compoundingFrequency] || 365;

  // APY = (1 + r/n)^n - 1
  const one = new Decimal(1);
  const periodic = apr.dividedBy(n);
  const apy = one.plus(periodic).pow(n).minus(1).times(100);

  return {
    inputs: { aprPercent, compoundingFrequency },
    outputs: {
      apyPercent: apy.toNumber(),
      compoundingPeriodsPerYear: n,
      compoundingBoostPercent: apy.minus(toDecimal(aprPercent)).toNumber(),
    },
    formula: 'APY % = ((1 + APR/n)^n - 1) * 100%',
    assumptions: ['Regular periodic compounding without withdrawal leakage'],
    warnings: [],
    breakdown: { apyPercent: apy.toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. Compound Yield Calculator */
export function calculateCompoundYield(
  principalUsd: DecimalValue,
  annualRatePercent: DecimalValue,
  durationDays: number,
  compoundingFrequencyPerYear: number = 365,
): CalculationResult {
  const p = toDecimal(principalUsd);
  const r = toDecimal(annualRatePercent).dividedBy(100);
  const n = new Decimal(compoundingFrequencyPerYear);
  const t = new Decimal(durationDays).dividedBy(365);

  // A = P * (1 + r/n)^(n*t)
  const base = new Decimal(1).plus(r.dividedBy(n));
  const exponent = n.times(t).toNumber();
  const futureValue = p.times(base.pow(exponent));
  const totalEarnedUsd = futureValue.minus(p);

  return {
    inputs: { principalUsd, annualRatePercent, durationDays, compoundingFrequencyPerYear },
    outputs: {
      futureValueUsd: futureValue.toNumber(),
      totalEarnedInterestUsd: totalEarnedUsd.toNumber(),
      effectivePeriodRoiPercent: p.isZero() ? 0 : totalEarnedUsd.dividedBy(p).times(100).toNumber(),
    },
    formula: 'A = P * (1 + r/n)^(n*t)',
    assumptions: ['Reinvestment at identical rate throughout duration'],
    warnings: [],
    breakdown: { earnedInterestUsd: totalEarnedUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. Staking Rewards Calculator */
export function calculateStakingRewards(
  stakedAmountTokens: DecimalValue,
  tokenPriceUsd: DecimalValue,
  stakingAprPercent: DecimalValue,
  durationDays: number = 30,
  slashingRiskBufferPercent: DecimalValue = '0',
): CalculationResult {
  const tokens = toDecimal(stakedAmountTokens);
  const price = toDecimal(tokenPriceUsd);
  const apr = toDecimal(stakingAprPercent).dividedBy(100);
  const days = new Decimal(durationDays);
  const slashBuffer = toDecimal(slashingRiskBufferPercent).dividedBy(100);

  const grossTokensEarned = tokens.times(apr).times(days.dividedBy(365));
  const netTokensEarned = grossTokensEarned.times(new Decimal(1).minus(slashBuffer));
  const netEarnedUsd = netTokensEarned.times(price);

  return {
    inputs: { stakedAmountTokens, tokenPriceUsd, stakingAprPercent, durationDays },
    outputs: {
      rewardsTokensEarned: netTokensEarned.toNumber(),
      rewardsUsdValue: netEarnedUsd.toNumber(),
      initialPrincipalUsd: tokens.times(price).toNumber(),
      dailyRewardTokens: netTokensEarned.dividedBy(days).toNumber(),
    },
    formula: 'Rewards = Staked_Tokens * APR * (Days / 365) * (1 - SlashingBuffer)',
    assumptions: ['Constant validator uptime without protocol unbonding lockup delays'],
    warnings: [],
    breakdown: { netRewardsUsd: netEarnedUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 5. Yield Farming Calculator */
export function calculateYieldFarming(
  capitalDepositedUsd: DecimalValue,
  baseLpAprPercent: DecimalValue,
  rewardTokenAprPercent: DecimalValue,
  harvestGasCostUsd: DecimalValue = '1.50',
  harvestFrequencyDays: number = 7,
): CalculationResult {
  const cap = toDecimal(capitalDepositedUsd);
  const lpApr = toDecimal(baseLpAprPercent).dividedBy(100);
  const rewardApr = toDecimal(rewardTokenAprPercent).dividedBy(100);
  const harvestGas = toDecimal(harvestGasCostUsd);

  const totalApr = lpApr.plus(rewardApr);
  const annualGrossUsd = cap.times(totalApr);

  const harvestsPerYear = 365 / harvestFrequencyDays;
  const annualGasCostUsd = harvestGas.times(harvestsPerYear);
  const netAnnualUsd = annualGrossUsd.minus(annualGasCostUsd);

  return {
    inputs: { capitalDepositedUsd, baseLpAprPercent, rewardTokenAprPercent, harvestFrequencyDays },
    outputs: {
      totalCombinedAprPercent: totalApr.times(100).toNumber(),
      annualGrossYieldUsd: annualGrossUsd.toNumber(),
      annualGasCostUsd: annualGasCostUsd.toNumber(),
      netAnnualYieldUsd: netAnnualUsd.toNumber(),
      netEffectiveApyPercent: cap.isZero() ? 0 : netAnnualUsd.dividedBy(cap).times(100).toNumber(),
    },
    formula: 'Net Yield = (Cap * Total_APR) - (HarvestGas * Harvests_Per_Year)',
    assumptions: ['Dual yield stream (Trading fees + protocol incentive token emissions)'],
    warnings: annualGasCostUsd.greaterThan(annualGrossUsd.times('0.2'))
      ? ['Gas costs consume > 20% of farming yield. Consider less frequent harvesting.']
      : [],
    breakdown: {
      grossYieldUsd: annualGrossUsd.toNumber(),
      gasCostUsd: annualGasCostUsd.toNumber(),
    },
    executedAt: Date.now(),
  };
}

/** 6. Auto-Compound Calculator */
export function calculateAutoCompoundBenefit(
  principalUsd: DecimalValue,
  aprPercent: DecimalValue,
  autoCompoundFeePercent: DecimalValue = '2.0', // e.g. Yearn/Beefy 2% performance fee
): CalculationResult {
  const p = toDecimal(principalUsd);
  const apr = toDecimal(aprPercent).dividedBy(100);
  const feeRate = toDecimal(autoCompoundFeePercent).dividedBy(100);

  // Daily compounded APY with performance fee deducted from earnings:
  // Net daily rate = (APR / 365) * (1 - fee)
  const netDailyRate = apr.dividedBy(365).times(new Decimal(1).minus(feeRate));
  const autoCompoundedApy = new Decimal(1).plus(netDailyRate).pow(365).minus(1).times(100);

  const manualSimpleReturn = apr.times(100);
  const netExtraGainPercent = autoCompoundedApy.minus(manualSimpleReturn);

  return {
    inputs: { principalUsd, aprPercent, autoCompoundFeePercent },
    outputs: {
      autoCompoundedApyPercent: autoCompoundedApy.toNumber(),
      simpleAprPercent: toDecimal(aprPercent).toNumber(),
      netExtraYieldPercent: netExtraGainPercent.toNumber(),
      annualGainUsd: p.times(autoCompoundedApy.dividedBy(100)).toNumber(),
    },
    formula: 'APY_vault = ((1 + (APR/365)*(1 - Fee))^365 - 1) * 100%',
    assumptions: ['Vault automates daily reinvestment batching at scale'],
    warnings: [],
    breakdown: { vaultApyPercent: autoCompoundedApy.toNumber() },
    executedAt: Date.now(),
  };
}

/** 7. Daily Yield Calculator */
export function calculateDailyYield(
  principalUsd: DecimalValue,
  aprPercent: DecimalValue,
): CalculationResult {
  const p = toDecimal(principalUsd);
  const apr = toDecimal(aprPercent).dividedBy(100);
  const dailyRate = apr.dividedBy(365);
  const dailyEarnedUsd = p.times(dailyRate);

  return {
    inputs: { principalUsd, aprPercent },
    outputs: {
      dailyYieldUsd: dailyEarnedUsd.toNumber(),
      dailyYieldPercent: dailyRate.times(100).toNumber(),
    },
    formula: 'Daily = Principal * (APR / 365)',
    assumptions: ['Standard 365-day simple linear accrual'],
    warnings: [],
    breakdown: { dailyEarnedUsd: dailyEarnedUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 8. Monthly Yield Calculator */
export function calculateMonthlyYield(
  principalUsd: DecimalValue,
  aprPercent: DecimalValue,
): CalculationResult {
  const p = toDecimal(principalUsd);
  const apr = toDecimal(aprPercent).dividedBy(100);
  const monthlyRate = apr.dividedBy(12);
  const monthlyEarnedUsd = p.times(monthlyRate);

  return {
    inputs: { principalUsd, aprPercent },
    outputs: {
      monthlyYieldUsd: monthlyEarnedUsd.toNumber(),
      monthlyYieldPercent: monthlyRate.times(100).toNumber(),
    },
    formula: 'Monthly = Principal * (APR / 12)',
    assumptions: ['Equal 30-day month convention'],
    warnings: [],
    breakdown: { monthlyEarnedUsd: monthlyEarnedUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 9. Annual Yield Calculator */
export function calculateAnnualYield(
  principalUsd: DecimalValue,
  aprPercent: DecimalValue,
): CalculationResult {
  const p = toDecimal(principalUsd);
  const apr = toDecimal(aprPercent).dividedBy(100);
  const annualEarnedUsd = p.times(apr);

  return {
    inputs: { principalUsd, aprPercent },
    outputs: {
      annualYieldUsd: annualEarnedUsd.toNumber(),
      annualYieldPercent: toDecimal(aprPercent).toNumber(),
    },
    formula: 'Annual = Principal * APR',
    assumptions: ['Simple annual interest accrual'],
    warnings: [],
    breakdown: { annualEarnedUsd: annualEarnedUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 10. Yield Break-Even Calculator */
export function calculateYieldBreakEven(
  gasAndEntryFeesUsd: DecimalValue,
  principalUsd: DecimalValue,
  aprPercent: DecimalValue,
): CalculationResult {
  const fees = toDecimal(gasAndEntryFeesUsd);
  const p = toDecimal(principalUsd);
  const dailyYield = p.times(toDecimal(aprPercent).dividedBy(100)).dividedBy(365);

  const daysToBreakEven = dailyYield.isZero() ? 9999 : fees.dividedBy(dailyYield).toNumber();

  return {
    inputs: { gasAndEntryFeesUsd, principalUsd, aprPercent },
    outputs: {
      daysToBreakEven: Math.max(0, daysToBreakEven),
      dailyYieldUsd: dailyYield.toNumber(),
      entryCostDragPercent: p.isZero() ? 0 : fees.dividedBy(p).times(100).toNumber(),
    },
    formula: 'Days = Total_Entry_Fees / (Principal * (APR / 365))',
    assumptions: ['Yield continues unabated until sunk setup fees are amortized'],
    warnings: daysToBreakEven > 180 ? ['Break-even duration exceeds 6 months.'] : [],
    breakdown: { feesUsd: fees.toNumber() },
    executedAt: Date.now(),
  };
}
