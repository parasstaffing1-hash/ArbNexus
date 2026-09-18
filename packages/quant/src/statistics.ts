import Decimal from 'decimal.js';

export class QuantStatistics {
  /**
   * Calculates mean of numbers.
   */
  static mean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, v) => acc + v, 0);
    return sum / values.length;
  }

  /**
   * Calculates sample variance.
   */
  static variance(values: number[]): number {
    if (values.length < 2) return 0;
    const m = this.mean(values);
    const sumSq = values.reduce((acc, v) => acc + Math.pow(v - m, 2), 0);
    return sumSq / (values.length - 1);
  }

  /**
   * Calculates sample standard deviation.
   */
  static stdDev(values: number[]): number {
    return Math.sqrt(this.variance(values));
  }

  /**
   * Calculates covariance between two equal-length series.
   */
  static covariance(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const meanX = this.mean(x.slice(0, n));
    const meanY = this.mean(y.slice(0, n));

    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += (x[i] - meanX) * (y[i] - meanY);
    }
    return sum / (n - 1);
  }

  /**
   * Calculates Pearson correlation coefficient r in [-1, 1].
   */
  static correlation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const cov = this.covariance(x, y);
    const stdX = this.stdDev(x.slice(0, n));
    const stdY = this.stdDev(y.slice(0, n));

    if (stdX === 0 || stdY === 0) return 0;
    return Math.max(-1, Math.min(1, cov / (stdX * stdY)));
  }

  /**
   * Calculates asset beta relative to benchmark: Beta = Cov(asset, bench) / Var(bench)
   */
  static beta(assetReturns: number[], benchmarkReturns: number[]): number {
    const varBench = this.variance(benchmarkReturns);
    if (varBench === 0) return 1.0;
    const cov = this.covariance(assetReturns, benchmarkReturns);
    return cov / varBench;
  }

  /**
   * Computes simple returns from price series: R_t = (P_t - P_{t-1}) / P_{t-1}
   */
  static rollingReturns(prices: number[]): number[] {
    if (prices.length < 2) return [];
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const prev = prices[i - 1];
      returns.push(prev === 0 ? 0 : (prices[i] - prev) / prev);
    }
    return returns;
  }

  /**
   * Computes rolling mean with specified lookback window.
   */
  static rollingMean(series: number[], window: number = 20): number[] {
    const result: number[] = [];
    for (let i = 0; i < series.length; i++) {
      const start = Math.max(0, i - window + 1);
      const sub = series.slice(start, i + 1);
      result.push(this.mean(sub));
    }
    return result;
  }

  /**
   * Computes rolling standard deviation.
   */
  static rollingStdDev(series: number[], window: number = 20): number[] {
    const result: number[] = [];
    for (let i = 0; i < series.length; i++) {
      const start = Math.max(0, i - window + 1);
      const sub = series.slice(start, i + 1);
      result.push(this.stdDev(sub));
    }
    return result;
  }

  /**
   * Computes rolling volatility (annualized standard deviation of returns).
   */
  static rollingVolatility(
    returns: number[],
    window: number = 20,
    annualizedFactor: number = 365,
  ): number[] {
    const rollingStd = this.rollingStdDev(returns, window);
    const sqrtFactor = Math.sqrt(annualizedFactor);
    return rollingStd.map((std) => std * sqrtFactor);
  }

  /**
   * Calculates Sharpe Ratio: (Mean Return - Rf) / Volatility * sqrt(AnnualizedFactor)
   */
  static sharpeRatio(
    returns: number[],
    riskFreeRate: number = 0,
    annualizedFactor: number = 365,
  ): number {
    if (returns.length < 2) return 0;
    const avgReturn = this.mean(returns);
    const std = this.stdDev(returns);
    if (std === 0) return 0;
    return ((avgReturn - riskFreeRate) / std) * Math.sqrt(annualizedFactor);
  }

  /**
   * Calculates Sortino Ratio (downside risk only).
   */
  static sortinoRatio(
    returns: number[],
    targetReturn: number = 0,
    annualizedFactor: number = 365,
  ): number {
    if (returns.length < 2) return 0;
    const avgReturn = this.mean(returns);
    const downsideDiffs = returns
      .filter((r) => r < targetReturn)
      .map((r) => Math.pow(r - targetReturn, 2));

    if (downsideDiffs.length === 0) return 10.0; // No downside volatility
    const downsideDev = Math.sqrt(downsideDiffs.reduce((a, b) => a + b, 0) / returns.length);
    if (downsideDev === 0) return 10.0;
    return ((avgReturn - targetReturn) / downsideDev) * Math.sqrt(annualizedFactor);
  }

  /**
   * Calculates Maximum Drawdown and Peak/Trough indices.
   */
  static maxDrawdown(prices: number[]): {
    maxDrawdownPercent: number;
    peakIndex: number;
    troughIndex: number;
  } {
    if (prices.length < 2) {
      return { maxDrawdownPercent: 0, peakIndex: 0, troughIndex: 0 };
    }

    let maxDD = 0;
    let peak = prices[0];
    let peakIdx = 0;
    let maxPeakIdx = 0;
    let maxTroughIdx = 0;

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > peak) {
        peak = prices[i];
        peakIdx = i;
      } else {
        const dd = (peak - prices[i]) / peak;
        if (dd > maxDD) {
          maxDD = dd;
          maxPeakIdx = peakIdx;
          maxTroughIdx = i;
        }
      }
    }

    return {
      maxDrawdownPercent: maxDD * 100,
      peakIndex: maxPeakIdx,
      troughIndex: maxTroughIdx,
    };
  }

  /**
   * Calculates empirical percentile (0 <= p <= 100).
   */
  static percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) return sorted[lower];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}
