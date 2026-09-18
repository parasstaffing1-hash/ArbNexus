import { QuantStatistics } from './statistics';
import { ZScoreEngine } from './zscore';

export interface PairsSignal {
  hedgeRatioBeta: number;
  interceptAlpha: number;
  spread: number[];
  latestZScore: number;
  isStationaryCandidate: boolean;
  action: 'LONG_SPREAD' | 'SHORT_SPREAD' | 'NEUTRAL';
}

export interface CointegrationTestResult {
  isCointegrated: boolean;
  adfStatistic: number;
  pValue: number;
  criticalValue5Pct: number;
  criticalValue1Pct: number;
  hedgeRatioBeta: number;
  interceptAlpha: number;
  residuals: number[];
}

export class CointegrationEngine {
  // MacKinnon (1991, 2010) asymptotic critical values for cointegration test with constant (N=2)
  private static readonly CRITICAL_1_PCT = -3.9;
  private static readonly CRITICAL_5_PCT = -3.34;
  private static readonly CRITICAL_10_PCT = -3.04;

  /**
   * Computes synthetic spread: Spread = AssetA - (Alpha + Beta * AssetB)
   * and generates statistical arbitrage signal based on Z-score deviation.
   */
  static analyzePairsSpread(
    pricesA: number[],
    pricesB: number[],
    zScoreThreshold: number = 2.0,
  ): PairsSignal {
    const n = Math.min(pricesA.length, pricesB.length);
    if (n < 10) {
      return {
        hedgeRatioBeta: 1.0,
        interceptAlpha: 0,
        spread: [],
        latestZScore: 0,
        isStationaryCandidate: false,
        action: 'NEUTRAL',
      };
    }

    const subA = pricesA.slice(0, n);
    const subB = pricesB.slice(0, n);

    // OLS regression of A on B to get hedge ratio Beta and intercept Alpha
    const meanA = QuantStatistics.mean(subA);
    const meanB = QuantStatistics.mean(subB);
    const cov = QuantStatistics.covariance(subA, subB);
    const varB = QuantStatistics.variance(subB);
    const beta = varB === 0 ? 1.0 : cov / varB;
    const alpha = meanA - beta * meanB;

    const spread: number[] = [];
    for (let i = 0; i < n; i++) {
      spread.push(subA[i] - (alpha + beta * subB[i]));
    }

    const latestSpread = spread[spread.length - 1];
    const { zScore } = ZScoreEngine.calculateZScore(latestSpread, spread);

    let action: PairsSignal['action'] = 'NEUTRAL';
    if (zScore > zScoreThreshold) {
      // Spread is unusually high -> short spread (sell A, buy B)
      action = 'SHORT_SPREAD';
    } else if (zScore < -zScoreThreshold) {
      // Spread is unusually low -> long spread (buy A, sell B)
      action = 'LONG_SPREAD';
    }

    return {
      hedgeRatioBeta: beta,
      interceptAlpha: alpha,
      spread,
      latestZScore: zScore,
      isStationaryCandidate: Math.abs(zScore) < 4.0,
      action,
    };
  }

  /**
   * Engle-Granger Two-Step Cointegration Test.
   * Step 1: OLS regression of pricesA on pricesB to extract residuals e_t.
   * Step 2: Test residuals for stationarity via Dickey-Fuller regression: Delta e_t = gamma * e_{t-1} + u_t
   * Test statistic t = gamma_hat / SE(gamma_hat).
   */
  static testEngleGranger(pricesA: number[], pricesB: number[]): CointegrationTestResult {
    const n = Math.min(pricesA.length, pricesB.length);
    if (n < 15) {
      return {
        isCointegrated: false,
        adfStatistic: 0,
        pValue: 1.0,
        criticalValue5Pct: this.CRITICAL_5_PCT,
        criticalValue1Pct: this.CRITICAL_1_PCT,
        hedgeRatioBeta: 1.0,
        interceptAlpha: 0,
        residuals: [],
      };
    }

    const subA = pricesA.slice(0, n);
    const subB = pricesB.slice(0, n);

    // Step 1: OLS
    const meanA = QuantStatistics.mean(subA);
    const meanB = QuantStatistics.mean(subB);
    const cov = QuantStatistics.covariance(subA, subB);
    const varB = QuantStatistics.variance(subB);
    const beta = varB === 0 ? 1.0 : cov / varB;
    const alpha = meanA - beta * meanB;

    const residuals: number[] = [];
    for (let i = 0; i < n; i++) {
      residuals.push(subA[i] - (alpha + beta * subB[i]));
    }

    // Step 2: DF test on residuals: delta_e[t] = gamma * e[t-1]
    const deltaE: number[] = [];
    const lagE: number[] = [];
    for (let i = 1; i < residuals.length; i++) {
      deltaE.push(residuals[i] - residuals[i - 1]);
      lagE.push(residuals[i - 1]);
    }

    const covDF = QuantStatistics.covariance(deltaE, lagE);
    const varLag = QuantStatistics.variance(lagE);
    const gamma = varLag === 0 ? 0 : covDF / varLag;

    // Residual sum of squares of DF regression
    let sse = 0;
    for (let i = 0; i < deltaE.length; i++) {
      const err = deltaE[i] - gamma * lagE[i];
      sse += err * err;
    }
    const dfCount = deltaE.length - 1;
    const sigmaSq = dfCount > 0 ? sse / dfCount : 0;
    const sumLagSq = lagE.reduce((acc, v) => acc + v * v, 0);
    const seGamma = sumLagSq > 0 ? Math.sqrt(sigmaSq / sumLagSq) : 1e-6;

    const adfStatistic = seGamma === 0 ? 0 : gamma / seGamma;

    // Approximate p-value from t-stat relative to MacKinnon distribution
    let pValue = 1.0;
    if (adfStatistic < this.CRITICAL_1_PCT) {
      pValue = 0.008;
    } else if (adfStatistic < this.CRITICAL_5_PCT) {
      pValue = 0.035;
    } else if (adfStatistic < this.CRITICAL_10_PCT) {
      pValue = 0.082;
    } else {
      pValue = Math.min(1.0, 0.15 + Math.max(0, (adfStatistic - this.CRITICAL_10_PCT) * 0.2));
    }

    const isCointegrated = adfStatistic < this.CRITICAL_5_PCT;

    return {
      isCointegrated,
      adfStatistic,
      pValue,
      criticalValue5Pct: this.CRITICAL_5_PCT,
      criticalValue1Pct: this.CRITICAL_1_PCT,
      hedgeRatioBeta: beta,
      interceptAlpha: alpha,
      residuals,
    };
  }
}
