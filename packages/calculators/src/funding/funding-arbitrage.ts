import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';

/** 1. Funding Rate Profit Calculator */
export function calculateFundingProfit(
  positionSizeUsd: DecimalValue,
  fundingRatePercent: DecimalValue, // e.g. 0.01%
  holdingPeriods: number = 1,
): CalculationResult {
  const pos = toDecimal(positionSizeUsd);
  const rate = toDecimal(fundingRatePercent).dividedBy(100);
  const periods = new Decimal(holdingPeriods);

  // Profit = Position * Rate * Periods (if short perp with positive rate)
  const payoutUsd = pos.times(rate).times(periods);

  return {
    inputs: { positionSizeUsd, fundingRatePercent, holdingPeriods },
    outputs: {
      fundingPayoutUsd: payoutUsd.toNumber(),
      effectivePeriodYieldPercent: rate.times(periods).times(100).toNumber(),
    },
    formula: 'Funding Payout = Position Size * Funding Rate * Periods',
    assumptions: ['Positive funding rate paid from longs to shorts'],
    warnings: [],
    breakdown: { perIntervalPayoutUsd: pos.times(rate).toNumber() },
    executedAt: Date.now(),
  };
}

/** 2. Funding APR Calculator (Simple annualized rate) */
export function calculateFundingApr(
  fundingRatePercent: DecimalValue, // e.g. 0.01% per 8h
  intervalHours = 8,
): CalculationResult {
  const rate = toDecimal(fundingRatePercent);
  const periodsPerDay = 24 / intervalHours;
  const periodsPerYear = periodsPerDay * 365;

  const aprPercent = rate.times(periodsPerYear);

  return {
    inputs: { fundingRatePercent, intervalHours },
    outputs: {
      annualizedAprPercent: aprPercent.toNumber(),
      dailyRatePercent: rate.times(periodsPerDay).toNumber(),
      intervalsPerYear: periodsPerYear,
    },
    formula: 'APR = Funding Rate % * (24 / Interval) * 365',
    assumptions: ['Rate remains constant without compounding over 365 days'],
    warnings: [],
    breakdown: { dailyYieldPercent: rate.times(periodsPerDay).toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. Funding APY Calculator (Compound annualized rate) */
export function calculateFundingApy(
  fundingRatePercent: DecimalValue,
  intervalHours = 8,
): CalculationResult {
  const rate = toDecimal(fundingRatePercent).dividedBy(100);
  const periodsPerYear = (24 / intervalHours) * 365;

  // APY = (1 + r)^n - 1
  const one = new Decimal(1);
  const base = one.plus(rate);
  const apyPercent = base.pow(periodsPerYear).minus(1).times(100);

  return {
    inputs: { fundingRatePercent, intervalHours },
    outputs: {
      annualizedApyPercent: apyPercent.toNumber(),
      compoundingPeriodsPerYear: periodsPerYear,
    },
    formula: 'APY = ((1 + Funding_Rate)^Periods - 1) * 100%',
    assumptions: ['All funding payouts are continuously reinvested at identical funding yields'],
    warnings: [],
    breakdown: { periodicRateFraction: rate.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. Delta-Neutral Calculator */
export function calculateDeltaNeutralFunding(
  spotCapitalUsd: DecimalValue,
  fundingRatePercent: DecimalValue,
  leverage = 1,
  roundTripFeePercent: DecimalValue = '0.1',
): CalculationResult {
  const capital = toDecimal(spotCapitalUsd);
  const rate = toDecimal(fundingRatePercent).dividedBy(100);
  const lev = new Decimal(leverage);
  const fees = toDecimal(roundTripFeePercent).dividedBy(100);

  // Position is hedged: Long spot + Short perp
  // Total exposure hedged = capital
  const dailyPayout = capital.times(rate).times(3); // 3 8h periods in a day
  const setupFeesUsd = capital.times(fees).times(2); // Spot fee + Perp fee

  const daysToBreakEven = dailyPayout.isZero() ? 0 : setupFeesUsd.dividedBy(dailyPayout).toNumber();
  const net30DayYieldUsd = dailyPayout.times(30).minus(setupFeesUsd);

  return {
    inputs: { spotCapitalUsd, fundingRatePercent, leverage, roundTripFeePercent },
    outputs: {
      dailyFundingYieldUsd: dailyPayout.toNumber(),
      totalEntryExitFeesUsd: setupFeesUsd.toNumber(),
      breakEvenDays: Math.max(0, daysToBreakEven),
      net30DayYieldUsd: net30DayYieldUsd.toNumber(),
      net30DayRoiPercent: capital.isZero()
        ? 0
        : net30DayYieldUsd.dividedBy(capital).times(100).toNumber(),
    },
    formula: 'Daily Payout = Capital * Rate * 3; BreakEven Days = TotalFees / DailyPayout',
    assumptions: ['Perfect delta hedge eliminating underlying asset market beta exposure'],
    warnings: dailyPayout.lessThanOrEqualTo(0)
      ? ['Funding rate is zero or negative; short position pays funding.']
      : [],
    breakdown: { setupFeesUsd: setupFeesUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 5. Spot + Perpetual Hedge Calculator */
export function calculateSpotPerpHedge(
  assetPriceUsd: DecimalValue,
  spotUnits: DecimalValue,
  perpNotionalUsd: DecimalValue,
  fundingRatePercent: DecimalValue,
): CalculationResult {
  const price = toDecimal(assetPriceUsd);
  const spotQty = toDecimal(spotUnits);
  const spotValue = spotQty.times(price);
  const perpVal = toDecimal(perpNotionalUsd);

  // Net delta = spotValue - perpVal
  const netDeltaUsd = spotValue.minus(perpVal);
  const isFullyHedged = netDeltaUsd.abs().lessThan(spotValue.times('0.005')); // within 0.5%
  const intervalPayout = perpVal.times(toDecimal(fundingRatePercent).dividedBy(100));

  return {
    inputs: { assetPriceUsd, spotUnits, perpNotionalUsd, fundingRatePercent },
    outputs: {
      spotValueUsd: spotValue.toNumber(),
      perpShortNotionalUsd: perpVal.toNumber(),
      netDeltaExposureUsd: netDeltaUsd.toNumber(),
      isDeltaNeutral: isFullyHedged,
      intervalFundingIncomeUsd: intervalPayout.toNumber(),
    },
    formula: 'Net Delta = Spot_Value - Perp_Notional; Payout = Perp_Notional * Funding_Rate',
    assumptions: ['Short perpetual contract notional balances spot holding value'],
    warnings: !isFullyHedged
      ? ['Position is not perfectly delta-neutral; residual market risk exists.']
      : [],
    breakdown: { netDeltaUsd: netDeltaUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 6. Long/Short Hedge Ratio Calculator */
export function calculateLongShortHedgeRatio(
  assetVolStdDev: DecimalValue,
  hedgeAssetVolStdDev: DecimalValue,
  correlationCoefficient: DecimalValue,
): CalculationResult {
  const std1 = toDecimal(assetVolStdDev);
  const std2 = toDecimal(hedgeAssetVolStdDev);
  const corr = toDecimal(correlationCoefficient);

  // Optimal hedge ratio h* = corr * (std1 / std2)
  const hedgeRatio = std2.isZero() ? new Decimal(1) : corr.times(std1.dividedBy(std2));

  return {
    inputs: { assetVolStdDev, hedgeAssetVolStdDev, correlationCoefficient },
    outputs: {
      optimalHedgeRatio: hedgeRatio.toNumber(),
      varianceReductionPercent: corr.pow(2).times(100).toNumber(),
    },
    formula: 'h* = Correlation * (StdDev_Spot / StdDev_Perp)',
    assumptions: ['Minimum-variance hedging framework'],
    warnings: corr.abs().lessThan('0.8') ? ['Correlation is weak (< 0.80); high basis risk.'] : [],
    breakdown: { correlation: corr.toNumber() },
    executedAt: Date.now(),
  };
}

/** 7. Funding Break-Even Calculator */
export function calculateFundingBreakEven(
  totalExecutionFeesUsd: DecimalValue,
  positionSizeUsd: DecimalValue,
  fundingRatePercent: DecimalValue,
  intervalHours = 8,
): CalculationResult {
  const fees = toDecimal(totalExecutionFeesUsd);
  const pos = toDecimal(positionSizeUsd);
  const rate = toDecimal(fundingRatePercent).dividedBy(100);

  const payoutPerInterval = pos.times(rate);
  const intervalsToBreakEven = payoutPerInterval.isZero()
    ? new Decimal(0)
    : fees.dividedBy(payoutPerInterval);

  const hoursToBreakEven = intervalsToBreakEven.times(intervalHours);
  const daysToBreakEven = hoursToBreakEven.dividedBy(24);

  return {
    inputs: { totalExecutionFeesUsd, positionSizeUsd, fundingRatePercent, intervalHours },
    outputs: {
      intervalsToBreakEven: intervalsToBreakEven.toNumber(),
      hoursToBreakEven: hoursToBreakEven.toNumber(),
      daysToBreakEven: daysToBreakEven.toNumber(),
      payoutPerIntervalUsd: payoutPerInterval.toNumber(),
    },
    formula: 'Intervals = Total_Fees / (Position_Size * Funding_Rate)',
    assumptions: ['Constant funding rate without adverse flips'],
    warnings: rate.lessThanOrEqualTo(0) ? ['Funding rate is zero or negative.'] : [],
    breakdown: { feesUsd: fees.toNumber() },
    executedAt: Date.now(),
  };
}

/** 8. Funding Rate Comparison Calculator */
export function calculateFundingRateComparison(
  rates: { exchange: string; ratePercent: DecimalValue }[],
): CalculationResult {
  if (rates.length < 2) {
    return {
      inputs: { ratesCount: rates.length },
      outputs: { bestLongExchange: null, bestShortExchange: null, rateDeltaPercent: 0 },
      formula: 'Delta = Max_Rate - Min_Rate',
      assumptions: ['Cross-exchange perpetual basis arbitrage'],
      warnings: ['At least 2 exchanges required.'],
      breakdown: {},
      executedAt: Date.now(),
    };
  }

  const parsed = rates.map((r) => ({
    exchange: r.exchange,
    rate: toDecimal(r.ratePercent),
  }));

  parsed.sort((a, b) => a.rate.comparedTo(b.rate));
  const minRate = parsed[0];
  const maxRate = parsed[parsed.length - 1];
  const delta = maxRate.rate.minus(minRate.rate);
  const annualApyDelta = delta.times(3 * 365); // simple 3 periods/day

  return {
    inputs: { ratesCount: rates.length },
    outputs: {
      bestLongExchange: minRate.exchange, // Long the venue with lowest funding rate
      bestShortExchange: maxRate.exchange, // Short the venue with highest funding rate
      lowestRatePercent: minRate.rate.toNumber(),
      highestRatePercent: maxRate.rate.toNumber(),
      rateDelta8hPercent: delta.toNumber(),
      annualizedYieldDeltaPercent: annualApyDelta.toNumber(),
    },
    formula: 'Yield Delta = Rate_max - Rate_min (Long Lowest, Short Highest)',
    assumptions: [
      'Holding long and short positions on opposing exchanges captures funding divergence',
    ],
    warnings: [],
    breakdown: { ratesCompared: parsed.length },
    executedAt: Date.now(),
  };
}

/** 9. Funding Carry Calculator */
export function calculateFundingCarry(
  positionSizeUsd: DecimalValue,
  fundingAprPercent: DecimalValue,
  borrowCostAprPercent: DecimalValue = '3.5',
): CalculationResult {
  const pos = toDecimal(positionSizeUsd);
  const fundingApr = toDecimal(fundingAprPercent).dividedBy(100);
  const borrowApr = toDecimal(borrowCostAprPercent).dividedBy(100);

  const netCarryApr = fundingApr.minus(borrowApr);
  const annualProfitUsd = pos.times(netCarryApr);

  return {
    inputs: { positionSizeUsd, fundingAprPercent, borrowCostAprPercent },
    outputs: {
      netCarryAprPercent: netCarryApr.times(100).toNumber(),
      annualProfitUsd: annualProfitUsd.toNumber(),
      dailyCarryProfitUsd: annualProfitUsd.dividedBy(365).toNumber(),
    },
    formula: 'Net Carry = Funding_APR - Borrow_Cost_APR',
    assumptions: ['Borrow cost accounts for margin leverage loan rate'],
    warnings: netCarryApr.lessThanOrEqualTo(0)
      ? ['Borrow cost exceeds funding yield (Negative Carry).']
      : [],
    breakdown: { annualProfitUsd: annualProfitUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 10. Funding Payout Projection (Hourly, Daily, Weekly, Monthly, Annualized) */
export function calculateFundingPayoutProjection(
  positionSizeUsd: DecimalValue,
  fundingRatePercent: DecimalValue, // 8-hour rate
  intervalHours = 8,
): CalculationResult {
  const pos = toDecimal(positionSizeUsd);
  const rate = toDecimal(fundingRatePercent).dividedBy(100);

  const perInterval = pos.times(rate);
  const intervalsPerDay = 24 / intervalHours;
  const daily = perInterval.times(intervalsPerDay);
  const hourly = daily.dividedBy(24);
  const weekly = daily.times(7);
  const monthly = daily.times(30);
  const annualized = daily.times(365);

  return {
    inputs: { positionSizeUsd, fundingRatePercent, intervalHours },
    outputs: {
      hourlyPayoutUsd: hourly.toNumber(),
      perIntervalPayoutUsd: perInterval.toNumber(),
      dailyPayoutUsd: daily.toNumber(),
      weeklyPayoutUsd: weekly.toNumber(),
      monthlyPayoutUsd: monthly.toNumber(),
      annualizedPayoutUsd: annualized.toNumber(),
    },
    formula: 'Projections scaled from interval funding rate without reinvestment compounding',
    assumptions: ['Perpetual contract funding rate remains static over projected horizons'],
    warnings: [],
    breakdown: { dailyUsd: daily.toNumber(), monthlyUsd: monthly.toNumber() },
    executedAt: Date.now(),
  };
}
