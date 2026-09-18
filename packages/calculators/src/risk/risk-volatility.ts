import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';
import {
  calculateMean,
  calculateStandardDeviation,
  calculateVariance,
  calculateCovariance,
  calculateCorrelation,
  calculateBeta,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateMaxDrawdown,
  calculateParametricVaR,
} from '../shared/math';

/** 1. Volatility Calculator */
export function calculateVolatility(
  periodicReturns: DecimalValue[],
  periodsPerYear = 365,
): CalculationResult {
  const std = calculateStandardDeviation(periodicReturns);
  const annualizedVol = std.times(new Decimal(periodsPerYear).sqrt()).times(100);

  return {
    inputs: { returnCount: periodicReturns.length, periodsPerYear },
    outputs: {
      periodicVolatilityPercent: std.times(100).toNumber(),
      annualizedVolatilityPercent: annualizedVol.toNumber(),
    },
    formula: 'sigma_annual = sigma_daily * sqrt(365)',
    assumptions: ['Returns are independent and identically distributed (i.i.d.)'],
    warnings: [],
    breakdown: { stdDev: std.toNumber() },
    executedAt: Date.now(),
  };
}

/** 2. Historical Volatility Calculator */
export function calculateHistoricalVolatility(
  priceSeries: DecimalValue[],
  tradingDays = 365,
): CalculationResult {
  if (priceSeries.length < 2) {
    return {
      inputs: { pricePoints: priceSeries.length },
      outputs: { annualizedHistoricalVolatilityPercent: 0 },
      formula: 'sigma = std(log(P_t / P_{t-1})) * sqrt(365)',
      assumptions: ['Log returns standard deviation'],
      warnings: ['Insufficient price series length.'],
      breakdown: {},
      executedAt: Date.now(),
    };
  }

  const logReturns: Decimal[] = [];
  for (let i = 1; i < priceSeries.length; i++) {
    const pPrev = toDecimal(priceSeries[i - 1]);
    const pCurr = toDecimal(priceSeries[i]);
    if (!pPrev.isZero() && !pCurr.isZero()) {
      const ratio = pCurr.dividedBy(pPrev).toNumber();
      logReturns.push(new Decimal(Math.log(ratio)));
    }
  }

  const std = calculateStandardDeviation(logReturns);
  const annualized = std.times(new Decimal(tradingDays).sqrt()).times(100);

  return {
    inputs: { pricePoints: priceSeries.length, tradingDays },
    outputs: {
      annualizedHistoricalVolatilityPercent: annualized.toNumber(),
      sampleCount: logReturns.length,
    },
    formula: 'HV = StdDev(ln(P_t / P_{t-1})) * sqrt(N)',
    assumptions: ['Continuous geometric Brownian motion log-returns model'],
    warnings: [],
    breakdown: { dailyStdDev: std.toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. Maximum Drawdown Calculator */
export function calculateMaximumDrawdown(priceSeries: DecimalValue[]): CalculationResult {
  const res = calculateMaxDrawdown(priceSeries);

  return {
    inputs: { pricePoints: priceSeries.length },
    outputs: {
      maxDrawdownPercent: res.maxDrawdownPercent.toNumber(),
      peakIndex: res.peakIndex,
      troughIndex: res.troughIndex,
    },
    formula: 'MDD = Max((Peak - Trough) / Peak) * 100%',
    assumptions: ['Evaluates absolute peak-to-trough drop over time series'],
    warnings: res.maxDrawdownPercent.greaterThan(25) ? ['High historical drawdown (> 25%).'] : [],
    breakdown: { maxDrawdownPercent: res.maxDrawdownPercent.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. Sharpe Ratio Calculator */
export function calculateSharpe(
  periodicReturns: DecimalValue[],
  riskFreeRateAnnual = '0.04',
  periodsPerYear = 365,
): CalculationResult {
  const sharpe = calculateSharpeRatio(periodicReturns, riskFreeRateAnnual, periodsPerYear);

  return {
    inputs: { returnCount: periodicReturns.length, riskFreeRateAnnual, periodsPerYear },
    outputs: {
      sharpeRatio: sharpe.toNumber(),
      isExcellent: sharpe.greaterThan(2.0),
    },
    formula: 'Sharpe = (Mean_Return - Rf) / StdDev * sqrt(N)',
    assumptions: ['Total risk quantified by full standard deviation'],
    warnings:
      periodicReturns.length < 30
        ? ['Sample size < 30 observations; statistical power is low.']
        : [],
    breakdown: { sharpe: sharpe.toNumber() },
    executedAt: Date.now(),
  };
}

/** 5. Sortino Ratio Calculator */
export function calculateSortino(
  periodicReturns: DecimalValue[],
  riskFreeRateAnnual = '0.04',
  periodsPerYear = 365,
): CalculationResult {
  const sortino = calculateSortinoRatio(periodicReturns, riskFreeRateAnnual, periodsPerYear);

  return {
    inputs: { returnCount: periodicReturns.length, riskFreeRateAnnual, periodsPerYear },
    outputs: { sortinoRatio: sortino.toNumber() },
    formula: 'Sortino = (Mean_Return - Rf) / Downside_StdDev * sqrt(N)',
    assumptions: ['Penalizes downside deviations exclusively'],
    warnings: [],
    breakdown: { sortino: sortino.toNumber() },
    executedAt: Date.now(),
  };
}

/** 6. Value at Risk Calculator */
export function calculateVaR(
  positionSizeUsd: DecimalValue,
  dailyReturns: DecimalValue[],
  confidenceLevel: 0.95 | 0.99 = 0.95,
  holdingPeriodDays = 1,
): CalculationResult {
  const varUsd = calculateParametricVaR(
    positionSizeUsd,
    dailyReturns,
    confidenceLevel,
    holdingPeriodDays,
  );
  const pos = toDecimal(positionSizeUsd);
  const varPct = pos.isZero() ? new Decimal(0) : varUsd.dividedBy(pos).times(100);

  return {
    inputs: { positionSizeUsd, confidenceLevel, holdingPeriodDays },
    outputs: {
      valueAtRiskUsd: varUsd.toNumber(),
      valueAtRiskPercent: varPct.toNumber(),
      confidenceLevel,
    },
    formula: 'VaR = Position * (Z_alpha * sigma - mu) * sqrt(Days)',
    assumptions: ['Parametric Gaussian distribution of periodic returns'],
    warnings: [],
    breakdown: { varUsd: varUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 7. Expected Shortfall Calculator (CVaR) */
export function calculateExpectedShortfall(
  positionSizeUsd: DecimalValue,
  dailyReturns: DecimalValue[],
  confidenceLevel: 0.95 | 0.99 = 0.95,
): CalculationResult {
  const pos = toDecimal(positionSizeUsd);
  if (dailyReturns.length < 2) {
    return {
      inputs: { positionSizeUsd, confidenceLevel },
      outputs: { expectedShortfallUsd: 0, cvarPercent: 0 },
      formula: 'CVaR = E[Loss | Loss > VaR]',
      assumptions: ['Average conditional loss in tail beyond VaR'],
      warnings: ['Insufficient return history.'],
      breakdown: {},
      executedAt: Date.now(),
    };
  }

  // Historical tail average beyond percentile
  const sorted = [...dailyReturns].map((r) => toDecimal(r)).sort((a, b) => a.comparedTo(b));
  const cutoffIndex = Math.max(1, Math.floor((1 - confidenceLevel) * sorted.length));
  const tailReturns = sorted.slice(0, cutoffIndex);
  const meanTailLoss = calculateMean(tailReturns).abs();

  const cvarUsd = pos.times(meanTailLoss);

  return {
    inputs: { positionSizeUsd, confidenceLevel, tailObservations: tailReturns.length },
    outputs: {
      expectedShortfallUsd: cvarUsd.toNumber(),
      cvarPercent: meanTailLoss.times(100).toNumber(),
    },
    formula: 'CVaR = Position * Mean(Tail Losses beyond alpha)',
    assumptions: ['Non-parametric historical simulation tail expectation'],
    warnings: [],
    breakdown: { cvarUsd: cvarUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 8. Correlation Calculator */
export function calculateAssetCorrelation(
  returnsA: DecimalValue[],
  returnsB: DecimalValue[],
): CalculationResult {
  const corr = calculateCorrelation(returnsA, returnsB);

  return {
    inputs: { seriesLengthA: returnsA.length, seriesLengthB: returnsB.length },
    outputs: {
      correlationCoefficient: corr.toNumber(),
      relationshipType: corr.greaterThan('0.7')
        ? 'STRONG_POSITIVE'
        : corr.lessThan('-0.7')
          ? 'STRONG_NEGATIVE'
          : 'MODERATE_OR_UNCORRELATED',
    },
    formula: 'Correlation = Cov(A, B) / (StdDev_A * StdDev_B)',
    assumptions: ['Pearson linear product-moment correlation'],
    warnings: [],
    breakdown: { correlation: corr.toNumber() },
    executedAt: Date.now(),
  };
}

/** 9. Beta Calculator */
export function calculateAssetBeta(
  assetReturns: DecimalValue[],
  benchmarkReturns: DecimalValue[],
): CalculationResult {
  const beta = calculateBeta(assetReturns, benchmarkReturns);

  return {
    inputs: { assetPoints: assetReturns.length, benchmarkPoints: benchmarkReturns.length },
    outputs: {
      beta: beta.toNumber(),
      volatilityVersusMarket: beta.greaterThan(1) ? 'HIGHER_VOLATILITY' : 'LOWER_VOLATILITY',
    },
    formula: 'Beta = Cov(Asset, Benchmark) / Var(Benchmark)',
    assumptions: ['Linear regression sensitivity of asset returns against market benchmark'],
    warnings: [],
    breakdown: { beta: beta.toNumber() },
    executedAt: Date.now(),
  };
}

/** 10. Portfolio Risk Calculator */
export function calculatePortfolioRisk(
  weights: DecimalValue[],
  volatilities: DecimalValue[],
  correlationMatrix: DecimalValue[][],
): CalculationResult {
  const n = weights.length;
  let portfolioVariance = new Decimal(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const wI = toDecimal(weights[i]);
      const wJ = toDecimal(weights[j]);
      const sigmaI = toDecimal(volatilities[i]);
      const sigmaJ = toDecimal(volatilities[j]);
      const rhoIJ = toDecimal(correlationMatrix[i]?.[j] ?? (i === j ? 1 : 0));

      const term = wI.times(wJ).times(sigmaI).times(sigmaJ).times(rhoIJ);
      portfolioVariance = portfolioVariance.plus(term);
    }
  }

  const portfolioVol = portfolioVariance.sqrt();

  return {
    inputs: { assetCount: n },
    outputs: {
      portfolioVolatilityPercent: portfolioVol.times(100).toNumber(),
      portfolioVariance: portfolioVariance.toNumber(),
    },
    formula: 'sigma_p = sqrt( Sum_i Sum_j (w_i * w_j * sigma_i * sigma_j * rho_ij) )',
    assumptions: ['Markowitz modern portfolio variance formulation'],
    warnings: [],
    breakdown: { portfolioVol: portfolioVol.toNumber() },
    executedAt: Date.now(),
  };
}
