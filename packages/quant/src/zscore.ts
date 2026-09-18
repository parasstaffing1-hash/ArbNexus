import { QuantStatistics } from './statistics';

export class ZScoreEngine {
  /**
   * Computes Z-score of value relative to sample window.
   */
  static calculateZScore(
    value: number,
    history: number[],
  ): { zScore: number; mean: number; stdDev: number } {
    if (history.length < 2) {
      return { zScore: 0, mean: value, stdDev: 0 };
    }
    const mean = QuantStatistics.mean(history);
    const stdDev = QuantStatistics.stdDev(history);

    if (stdDev === 0) {
      return { zScore: 0, mean, stdDev: 0 };
    }

    const zScore = (value - mean) / stdDev;
    return { zScore, mean, stdDev };
  }

  /**
   * Calculates Bollinger Bands for given window.
   */
  static calculateBollingerBands(
    history: number[],
    numStdDev: number = 2,
  ): {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  } {
    const middle = QuantStatistics.mean(history);
    const stdDev = QuantStatistics.stdDev(history);

    const upper = middle + numStdDev * stdDev;
    const lower = middle - numStdDev * stdDev;
    const bandwidth = middle === 0 ? 0 : (upper - lower) / middle;

    return { upper, middle, lower, bandwidth };
  }
}
