import { Opportunity } from '@arbitrage/arbitrage-engine';
import { BacktestConfig, BacktestResult, SimulatedTradeFill } from './types';
import { QuantStatistics } from '@arbitrage/quant';

export class BacktestSimulator {
  /**
   * Simulates execution of detected historical opportunities under realistic latency, slippage, and fee drag.
   */
  static runBacktest(opportunities: Opportunity[], config: BacktestConfig): BacktestResult {
    let currentCapital = config.initialCapitalUsd;
    let totalFees = 0;
    let totalSlippage = 0;
    let profitableCount = 0;
    const returns: number[] = [];
    const fills: SimulatedTradeFill[] = [];

    let peakCapital = currentCapital;
    let maxDrawdown = 0;

    for (const opp of opportunities) {
      const oppSize = Math.min(parseFloat(opp.required_capital), currentCapital * 0.25);
      const grossSpread = parseFloat(opp.gross_spread);

      // Latency drag: 0.5 bps per 100ms
      const latencyDragPercent = (config.simulatedLatencyMs / 100) * 0.00005;

      // Fee calculations
      const entryFee = oppSize * (config.takerFeeBps / 10000);
      const exitFee = oppSize * (config.takerFeeBps / 10000);
      const tradeFees = entryFee + exitFee;

      // Slippage calculation
      const slippageRate = config.slippageModel === 'LINEAR' ? 0.0005 * (oppSize / 10000) : 0.0003;
      const slippage = oppSize * slippageRate;

      const grossProfit = oppSize * grossSpread;
      const netProfit = grossProfit - tradeFees - slippage - oppSize * latencyDragPercent;

      currentCapital += netProfit;
      totalFees += tradeFees;
      totalSlippage += slippage;

      if (netProfit > 0) profitableCount++;

      const periodReturn = oppSize > 0 ? netProfit / oppSize : 0;
      returns.push(periodReturn);

      // Track drawdown
      if (currentCapital > peakCapital) {
        peakCapital = currentCapital;
      }
      const dd = peakCapital > 0 ? (peakCapital - currentCapital) / peakCapital : 0;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }

      fills.push({
        tradeId: `sim-trade-${opp.id}`,
        opportunityId: opp.id,
        timestamp: opp.timestamp,
        strategyType: opp.strategy_type,
        asset: opp.asset,
        venues: opp.venues,
        sizeUsd: oppSize,
        entryPrice: parseFloat(opp.entry_price),
        exitPrice: parseFloat(opp.exit_price),
        grossProfitUsd: grossProfit,
        feesPaidUsd: tradeFees,
        slippagePaidUsd: slippage,
        netProfitUsd: netProfit,
        latencyMs: config.simulatedLatencyMs,
        status: 'FILLED',
      });
    }

    const netProfitUsd = currentCapital - config.initialCapitalUsd;
    const roiPercent = (netProfitUsd / config.initialCapitalUsd) * 100;
    const winRatePercent =
      opportunities.length > 0 ? (profitableCount / opportunities.length) * 100 : 0;

    const meanReturn = QuantStatistics.mean(returns);
    const stdReturn = QuantStatistics.stdDev(returns);
    const sharpe = stdReturn > 0 ? (meanReturn / stdReturn) * Math.sqrt(365 * 24) : 0;

    const downsideReturns = returns.filter((r) => r < 0);
    const downsideStd = QuantStatistics.stdDev(downsideReturns);
    const sortino = downsideStd > 0 ? (meanReturn / downsideStd) * Math.sqrt(365 * 24) : 0;

    return {
      backtestId: `bt-${config.strategyType}-${Date.now()}`,
      strategyType: config.strategyType,
      symbol: config.symbol,
      timeRange: { start: config.startTime, end: config.endTime },
      initialCapitalUsd: config.initialCapitalUsd,
      finalCapitalUsd: currentCapital,
      netProfitUsd,
      roiPercent,
      sharpeRatio: Math.max(0, sharpe),
      sortinoRatio: Math.max(0, sortino),
      maxDrawdownPercent: maxDrawdown * 100,
      winRatePercent,
      totalTrades: opportunities.length,
      profitableTrades: profitableCount,
      totalFeesPaidUsd: totalFees,
      totalSlippagePaidUsd: totalSlippage,
      assumptions: [
        `Taker fee: ${(config.takerFeeBps / 100).toFixed(2)}%`,
        `Simulated execution latency: ${config.simulatedLatencyMs}ms`,
        `Slippage model: ${config.slippageModel}`,
        'Zero live execution / simulation only',
      ],
      executedAt: Date.now(),
    };
  }
}
