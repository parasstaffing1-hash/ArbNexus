import { QuantStatistics } from './statistics';
import { ZScoreEngine } from './zscore';

export interface MeanReversionSimulationParams {
  spreadSeries: number[];
  entryZScore?: number; // default 2.0
  exitZScore?: number; // default 0.5
  stopLossZScore?: number; // default 3.5
  maxHoldingPeriods?: number; // default 30
  tradeCapitalUsd?: number; // default 10000
  feeBps?: number; // round-trip fees bps, default 10
}

export interface MeanReversionTrade {
  entryIndex: number;
  exitIndex: number;
  position: 'LONG' | 'SHORT';
  entrySpread: number;
  exitSpread: number;
  holdingPeriods: number;
  grossPnLUsd: number;
  netPnLUsd: number;
  roiPercent: number;
  exitReason: 'TARGET_REVERSION' | 'STOP_LOSS' | 'TIME_EXPIRY';
}

export interface MeanReversionBacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePercent: number;
  totalNetPnLUsd: number;
  totalRoiPercent: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  averageHoldingPeriod: number;
  halfLifePeriods: number;
  meanReversionSpeedTheta: number;
  trades: MeanReversionTrade[];
}

export class MeanReversionEngine {
  /**
   * Estimates Ornstein-Uhlenbeck mean-reversion parameters:
   * dX_t = theta * (mu - X_t) * dt + sigma * dW_t
   * Discretized as: X_t - X_{t-1} = a + b * X_{t-1} + e_t
   * where theta = -ln(1 + b) / dt and half-life tau = ln(2) / theta
   */
  static estimateHalfLife(
    series: number[],
    dt: number = 1,
  ): {
    halfLifePeriods: number;
    meanReversionSpeedTheta: number;
    equilibriumLevelMu: number;
  } {
    if (series.length < 5) {
      return { halfLifePeriods: 0, meanReversionSpeedTheta: 0, equilibriumLevelMu: 0 };
    }

    const y: number[] = [];
    const x: number[] = [];

    for (let i = 1; i < series.length; i++) {
      y.push(series[i] - series[i - 1]);
      x.push(series[i - 1]);
    }

    const meanX = QuantStatistics.mean(x);
    const meanY = QuantStatistics.mean(y);
    const covXY = QuantStatistics.covariance(x, y);
    const varX = QuantStatistics.variance(x);

    const b = varX === 0 ? 0 : covXY / varX;
    const a = meanY - b * meanX;

    // theta = -b / dt
    const theta = Math.max(1e-6, -b / dt);
    const halfLife = Math.log(2) / theta;
    const mu = b === 0 ? meanX : -a / b;

    return {
      halfLifePeriods: halfLife,
      meanReversionSpeedTheta: theta,
      equilibriumLevelMu: mu,
    };
  }

  /**
   * Simulates a chronological, look-ahead-free pairs mean-reversion backtest on spread series.
   */
  static simulateBacktest(params: MeanReversionSimulationParams): MeanReversionBacktestResult {
    const {
      spreadSeries,
      entryZScore = 2.0,
      exitZScore = 0.5,
      stopLossZScore = 3.5,
      maxHoldingPeriods = 30,
      tradeCapitalUsd = 10000,
      feeBps = 10,
    } = params;

    const { halfLifePeriods, meanReversionSpeedTheta } = this.estimateHalfLife(spreadSeries);
    const lookback = Math.max(15, Math.min(60, spreadSeries.length > 30 ? 30 : 15));

    const trades: MeanReversionTrade[] = [];
    let currentPosition: 'NONE' | 'LONG' | 'SHORT' = 'NONE';
    let entryIndex = 0;
    let entrySpread = 0;

    // Walk forward chronologically
    for (let i = lookback; i < spreadSeries.length; i++) {
      const window = spreadSeries.slice(i - lookback, i);
      const currentSpread = spreadSeries[i];
      const { zScore } = ZScoreEngine.calculateZScore(currentSpread, window);

      if (currentPosition === 'NONE') {
        if (zScore >= entryZScore) {
          // Spread is elevated: short the spread
          currentPosition = 'SHORT';
          entryIndex = i;
          entrySpread = currentSpread;
        } else if (zScore <= -entryZScore) {
          // Spread is depressed: long the spread
          currentPosition = 'LONG';
          entryIndex = i;
          entrySpread = currentSpread;
        }
      } else {
        // Holding position: check exit conditions
        const holding = i - entryIndex;
        let exitReason: MeanReversionTrade['exitReason'] | null = null;

        if (currentPosition === 'SHORT') {
          if (zScore <= exitZScore) {
            exitReason = 'TARGET_REVERSION';
          } else if (zScore >= stopLossZScore) {
            exitReason = 'STOP_LOSS';
          } else if (holding >= maxHoldingPeriods) {
            exitReason = 'TIME_EXPIRY';
          }
        } else if (currentPosition === 'LONG') {
          if (zScore >= -exitZScore) {
            exitReason = 'TARGET_REVERSION';
          } else if (zScore <= -stopLossZScore) {
            exitReason = 'STOP_LOSS';
          } else if (holding >= maxHoldingPeriods) {
            exitReason = 'TIME_EXPIRY';
          }
        }

        if (exitReason) {
          const spreadDiff =
            currentPosition === 'LONG' ? currentSpread - entrySpread : entrySpread - currentSpread;

          // Normalized PnL relative to initial spread level
          const spreadPct = entrySpread === 0 ? 0 : spreadDiff / Math.abs(entrySpread);
          const grossPnLUsd = tradeCapitalUsd * spreadPct;
          const feeCostUsd = tradeCapitalUsd * (feeBps / 10000);
          const netPnLUsd = grossPnLUsd - feeCostUsd;
          const roiPercent = (netPnLUsd / tradeCapitalUsd) * 100;

          trades.push({
            entryIndex,
            exitIndex: i,
            position: currentPosition,
            entrySpread,
            exitSpread: currentSpread,
            holdingPeriods: holding,
            grossPnLUsd,
            netPnLUsd,
            roiPercent,
            exitReason,
          });

          currentPosition = 'NONE';
        }
      }
    }

    const totalTrades = trades.length;
    const winningTrades = trades.filter((t) => t.netPnLUsd > 0).length;
    const losingTrades = totalTrades - winningTrades;
    const winRatePercent = totalTrades === 0 ? 0 : (winningTrades / totalTrades) * 100;
    const totalNetPnLUsd = trades.reduce((acc, t) => acc + t.netPnLUsd, 0);
    const totalRoiPercent = tradeCapitalUsd === 0 ? 0 : (totalNetPnLUsd / tradeCapitalUsd) * 100;

    const tradeReturns = trades.map((t) => t.roiPercent / 100);
    const sharpeRatio = QuantStatistics.sharpeRatio(tradeReturns);
    const sortinoRatio = QuantStatistics.sortinoRatio(tradeReturns);

    // Cumulative equity curve for max drawdown
    let cumEquity = tradeCapitalUsd;
    const equityCurve = [cumEquity];
    for (const t of trades) {
      cumEquity += t.netPnLUsd;
      equityCurve.push(cumEquity);
    }
    const { maxDrawdownPercent } = QuantStatistics.maxDrawdown(equityCurve);

    const averageHoldingPeriod =
      totalTrades === 0 ? 0 : trades.reduce((acc, t) => acc + t.holdingPeriods, 0) / totalTrades;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRatePercent,
      totalNetPnLUsd,
      totalRoiPercent,
      maxDrawdownPercent,
      sharpeRatio,
      sortinoRatio,
      averageHoldingPeriod,
      halfLifePeriods,
      meanReversionSpeedTheta,
      trades,
    };
  }
}
