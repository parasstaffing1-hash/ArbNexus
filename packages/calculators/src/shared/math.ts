import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from './primitives';

/**
 * High-precision statistical & mathematical calculation library built on Decimal.js
 */

export function calculateMean(values: DecimalValue[]): Decimal {
  if (values.length === 0) return new Decimal(0);
  const sum = values.reduce<Decimal>((acc, val) => acc.plus(toDecimal(val)), new Decimal(0));
  return sum.dividedBy(values.length);
}

export function calculateVariance(values: DecimalValue[], isSample = true): Decimal {
  if (values.length <= 1) return new Decimal(0);
  const mean = calculateMean(values);
  const squaredDiffs = values.reduce<Decimal>((acc, val) => {
    const diff = toDecimal(val).minus(mean);
    return acc.plus(diff.times(diff));
  }, new Decimal(0));

  const denominator = isSample ? values.length - 1 : values.length;
  return squaredDiffs.dividedBy(denominator);
}

export function calculateStandardDeviation(values: DecimalValue[], isSample = true): Decimal {
  const variance = calculateVariance(values, isSample);
  return variance.sqrt();
}

export function calculateCovariance(
  xValues: DecimalValue[],
  yValues: DecimalValue[],
  isSample = true,
): Decimal {
  const n = Math.min(xValues.length, yValues.length);
  if (n <= 1) return new Decimal(0);

  const xSubset = xValues.slice(0, n);
  const ySubset = yValues.slice(0, n);
  const meanX = calculateMean(xSubset);
  const meanY = calculateMean(ySubset);

  let crossSum = new Decimal(0);
  for (let i = 0; i < n; i++) {
    const diffX = toDecimal(xSubset[i]).minus(meanX);
    const diffY = toDecimal(ySubset[i]).minus(meanY);
    crossSum = crossSum.plus(diffX.times(diffY));
  }

  const denominator = isSample ? n - 1 : n;
  return crossSum.dividedBy(denominator);
}

export function calculateCorrelation(xValues: DecimalValue[], yValues: DecimalValue[]): Decimal {
  const cov = calculateCovariance(xValues, yValues);
  const stdX = calculateStandardDeviation(xValues);
  const stdY = calculateStandardDeviation(yValues);

  if (stdX.isZero() || stdY.isZero()) return new Decimal(0);
  return cov.dividedBy(stdX.times(stdY));
}

export function calculateBeta(
  assetReturns: DecimalValue[],
  benchmarkReturns: DecimalValue[],
): Decimal {
  const cov = calculateCovariance(assetReturns, benchmarkReturns);
  const benchmarkVar = calculateVariance(benchmarkReturns);

  if (benchmarkVar.isZero()) return new Decimal(1);
  return cov.dividedBy(benchmarkVar);
}

export function calculateSharpeRatio(
  returns: DecimalValue[],
  riskFreeRateAnnual: DecimalValue = '0.04',
  periodsPerYear = 365,
): Decimal {
  if (returns.length < 2) return new Decimal(0);
  const meanReturn = calculateMean(returns);
  const rfPeriod = toDecimal(riskFreeRateAnnual).dividedBy(periodsPerYear);
  const excessReturn = meanReturn.minus(rfPeriod);
  const stdDev = calculateStandardDeviation(returns);

  if (stdDev.isZero()) return new Decimal(0);
  return excessReturn.dividedBy(stdDev).times(new Decimal(periodsPerYear).sqrt());
}

export function calculateSortinoRatio(
  returns: DecimalValue[],
  riskFreeRateAnnual: DecimalValue = '0.04',
  periodsPerYear = 365,
): Decimal {
  if (returns.length < 2) return new Decimal(0);
  const meanReturn = calculateMean(returns);
  const rfPeriod = toDecimal(riskFreeRateAnnual).dividedBy(periodsPerYear);
  const excessReturn = meanReturn.minus(rfPeriod);

  // Downside deviation only
  const downsideSquaredSum = returns.reduce<Decimal>((acc, val) => {
    const dVal = toDecimal(val);
    if (dVal.lessThan(rfPeriod)) {
      const diff = dVal.minus(rfPeriod);
      return acc.plus(diff.times(diff));
    }
    return acc;
  }, new Decimal(0));

  const downsideDev = downsideSquaredSum.dividedBy(returns.length).sqrt();
  if (downsideDev.isZero()) return new Decimal(0);

  return excessReturn.dividedBy(downsideDev).times(new Decimal(periodsPerYear).sqrt());
}

export function calculateMaxDrawdown(priceSeries: DecimalValue[]): {
  maxDrawdownPercent: Decimal;
  peakIndex: number;
  troughIndex: number;
} {
  if (priceSeries.length === 0) {
    return { maxDrawdownPercent: new Decimal(0), peakIndex: 0, troughIndex: 0 };
  }

  let peak = toDecimal(priceSeries[0]);
  let peakIdx = 0;
  let maxDD = new Decimal(0);
  let bestPeakIdx = 0;
  let bestTroughIdx = 0;

  for (let i = 0; i < priceSeries.length; i++) {
    const current = toDecimal(priceSeries[i]);
    if (current.greaterThan(peak)) {
      peak = current;
      peakIdx = i;
    } else if (peak.greaterThan(0)) {
      const drawdown = peak.minus(current).dividedBy(peak).times(100);
      if (drawdown.greaterThan(maxDD)) {
        maxDD = drawdown;
        bestPeakIdx = peakIdx;
        bestTroughIdx = i;
      }
    }
  }

  return {
    maxDrawdownPercent: maxDD,
    peakIndex: bestPeakIdx,
    troughIndex: bestTroughIdx,
  };
}

/**
 * Abramowitz and Stegun approximation of standard normal cumulative distribution function (CDF)
 */
export function normalCDF(z: DecimalValue): Decimal {
  const zNum = toDecimal(z).toNumber();
  const sign = zNum < 0 ? -1 : 1;
  const absZ = Math.abs(zNum) / Math.sqrt(2.0);

  // erf approximation
  const t = 1.0 / (1.0 + 0.3275911 * absZ);
  const erf =
    1.0 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-absZ * absZ);

  const cdf = 0.5 * (1.0 + sign * erf);
  return new Decimal(cdf);
}

/**
 * Parametric Value at Risk (VaR)
 * VaR = Position * (Z_alpha * StdDev - Mean)
 */
export function calculateParametricVaR(
  positionSizeUsd: DecimalValue,
  returns: DecimalValue[],
  confidenceLevel: 0.95 | 0.99 = 0.95,
  holdingPeriodDays = 1,
): Decimal {
  if (returns.length < 2) return new Decimal(0);
  const mean = calculateMean(returns);
  const std = calculateStandardDeviation(returns);
  const pos = toDecimal(positionSizeUsd);

  // Z-scores: 95% = 1.64485, 99% = 2.32635
  const zScore = confidenceLevel === 0.99 ? new Decimal('2.32635') : new Decimal('1.64485');
  const periodScaling = new Decimal(holdingPeriodDays).sqrt();

  const varFraction = zScore.times(std).minus(mean).times(periodScaling);
  return pos.times(Decimal.max(varFraction, new Decimal(0)));
}
