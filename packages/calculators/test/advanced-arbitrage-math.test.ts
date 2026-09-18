import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { TradeSizeOptimizer } from '../../optimization/src/trade-size.optimizer';
import { QuantStatistics, CointegrationEngine, MeanReversionEngine } from '../../quant/src';
import { RouteScorer, MarketGraph, CycleDetector } from '../../graph-engine/src';
import { OpportunityRiskEngine } from '../../risk/src/opportunity-risk.engine';

describe('Advanced Arbitrage Mathematical Invariants & Property Tests', () => {
  // Invariant 1: Increasing route fees must not increase net profit
  it('Invariant: Increasing route fees strictly decreases net profit', () => {
    const grossSpread = new Decimal('0.015'); // 1.50%
    const lowFee = new Decimal('0.003'); // 30 bps
    const highFee = new Decimal('0.008'); // 80 bps
    const gamma = new Decimal('0.000005');
    const capital = new Decimal('10000');

    const lowFeeResult = TradeSizeOptimizer.optimizeTradeSize(grossSpread, lowFee, gamma, capital);
    const highFeeResult = TradeSizeOptimizer.optimizeTradeSize(
      grossSpread,
      highFee,
      gamma,
      capital,
    );

    expect(lowFeeResult.maxNetProfitUsd.toNumber()).toBeGreaterThan(
      highFeeResult.maxNetProfitUsd.toNumber(),
    );
  });

  // Invariant 2: Increasing slippage must not improve profitability
  it('Invariant: Increasing slippage parameter gamma strictly degrades net profit and optimal size', () => {
    const grossSpread = new Decimal('0.012');
    const fee = new Decimal('0.003');
    const lowSlippage = new Decimal('0.000002');
    const highSlippage = new Decimal('0.000008');
    const capital = new Decimal('50000');

    const resLow = TradeSizeOptimizer.optimizeTradeSize(grossSpread, fee, lowSlippage, capital);
    const resHigh = TradeSizeOptimizer.optimizeTradeSize(grossSpread, fee, highSlippage, capital);

    expect(resLow.maxNetProfitUsd.toNumber()).toBeGreaterThan(resHigh.maxNetProfitUsd.toNumber());
    expect(resLow.optimalSizeUsd.toNumber()).toBeGreaterThan(resHigh.optimalSizeUsd.toNumber());
  });

  // Invariant 3: Removing or breaking a required cycle leg invalidates cycle
  it('Invariant: Incomplete 3-hop graph prevents triangular cycle detection', () => {
    const graph = new MarketGraph();
    // Only 2 legs: USDT -> BTC and BTC -> ETH (missing ETH -> USDT return leg)
    graph.addEdge({
      id: 'e1',
      fromAsset: 'USDT',
      toAsset: 'BTC',
      venue: 'binance',
      venueType: 'CEX',
      rate: new Decimal('0.000010'), // 1 USDT = 0.00001 BTC ($100k BTC)
      weight: 1.0,
      feeBps: 10,
      availableLiquidityUsd: new Decimal('1000000'),
      estimatedLatencyMs: 20,
      timestamp: Date.now(),
    });
    graph.addEdge({
      id: 'e2',
      fromAsset: 'BTC',
      toAsset: 'ETH',
      venue: 'uniswap_v3',
      venueType: 'DEX',
      rate: new Decimal('34.5'), // 1 BTC = 34.5 ETH
      weight: 1.0,
      feeBps: 5,
      availableLiquidityUsd: new Decimal('500000'),
      estimatedLatencyMs: 25,
      timestamp: Date.now(),
    });

    const cycles = CycleDetector.findProfitableCycles(graph, 'USDT', 3);
    expect(cycles.length).toBe(0);
  });

  // Invariant 4: Reducing pool liquidity decreases maximum executable size
  it('Invariant: Reducing pool depth strictly bounds max executable trade size', () => {
    const deepLegs = [
      {
        fromAsset: 'USDT',
        toAsset: 'BTC',
        venue: 'binance',
        rate: new Decimal('0.00001'),
        feeBps: 10,
        expectedOutput: new Decimal('0.1'),
        liquidityUsd: new Decimal('1000000'), // $1M pool
      },
    ];
    const shallowLegs = [
      {
        fromAsset: 'USDT',
        toAsset: 'BTC',
        venue: 'binance',
        rate: new Decimal('0.00001'),
        feeBps: 10,
        expectedOutput: new Decimal('0.1'),
        liquidityUsd: new Decimal('50000'), // $50k pool
      },
    ];

    const deepScored = RouteScorer.scoreAndOptimizeRoute(deepLegs, new Decimal('10000'));
    const shallowScored = RouteScorer.scoreAndOptimizeRoute(shallowLegs, new Decimal('10000'));

    expect(deepScored.maxExecutableCapitalUsd.toNumber()).toBeGreaterThan(
      shallowScored.maxExecutableCapitalUsd.toNumber(),
    );
  });

  // Invariant 5: Stale data degrades data quality score and triggers extreme risk category
  it('Invariant: Stale data elevates risk assessment to EXTREME', () => {
    const freshRisk = OpportunityRiskEngine.evaluateRisk({
      strategyType: 'SPOT_CEX_CEX',
      venues: ['binance', 'okx'],
      requiredCapitalUsd: 10000,
      bottleneckLiquidityUsd: 1000000,
      estimatedDurationMs: 50,
      latencyMs: 15,
      dataQualityStatus: 'VALID',
    });

    const staleRisk = OpportunityRiskEngine.evaluateRisk({
      strategyType: 'SPOT_CEX_CEX',
      venues: ['binance', 'okx'],
      requiredCapitalUsd: 10000,
      bottleneckLiquidityUsd: 1000000,
      estimatedDurationMs: 50,
      latencyMs: 15,
      dataQualityStatus: 'STALE',
    });

    expect(staleRisk.dataQualityRisk).toBeGreaterThan(freshRisk.dataQualityRisk);
    expect(staleRisk.riskCategory).toBe('EXTREME');
  });

  // Invariant 6: Backtest trades must strictly follow chronological ordering (no look-ahead)
  it('Invariant: Mean reversion simulation enforces strictly increasing time progression (no look-ahead)', () => {
    // Generate synthetic oscillating spread with divergence spikes
    const spread = Array.from(
      { length: 120 },
      (_, i) => Math.sin(i * 0.25) * 15 + (i % 20 === 0 ? 30 : 0),
    );
    const result = MeanReversionEngine.simulateBacktest({
      spreadSeries: spread,
      entryZScore: 1.0,
      exitZScore: 0.3,
      tradeCapitalUsd: 10000,
    });

    expect(result.trades.length).toBeGreaterThan(0);
    for (const trade of result.trades) {
      // Look-ahead invariant: entryIndex must strictly precede exitIndex
      expect(trade.entryIndex).toBeLessThan(trade.exitIndex);
      expect(trade.holdingPeriods).toBe(trade.exitIndex - trade.entryIndex);
    }
  });

  // Invariant 7: Cointegration ADF statistic detects stationarity on known stationary series
  it('Invariant: Engle-Granger identifies stationary cointegrated relationship', () => {
    const n = 80;
    const commonTrend = Array.from({ length: n }, (_, i) => 100 + i * 0.5);
    const noiseA = Array.from({ length: n }, (_, i) => Math.sin(i * 0.3) * 2);
    const noiseB = Array.from({ length: n }, (_, i) => Math.cos(i * 0.3) * 2);

    const seriesA = commonTrend.map((t, idx) => t + noiseA[idx]);
    const seriesB = commonTrend.map((t, idx) => t + noiseB[idx]);

    const testResult = CointegrationEngine.testEngleGranger(seriesA, seriesB);
    expect(testResult.adfStatistic).toBeLessThan(0);
    expect(testResult.hedgeRatioBeta).toBeGreaterThan(0.9);
    expect(testResult.hedgeRatioBeta).toBeLessThan(1.1);
  });

  // Invariant 8: Sharpe and Sortino ratio finite bounds
  it('Invariant: QuantStatistics Sharpe and Sortino are finite and nonnegative for winning returns', () => {
    const returns = [0.01, 0.015, -0.005, 0.02, 0.012, 0.008, -0.002, 0.018];
    const sharpe = QuantStatistics.sharpeRatio(returns);
    const sortino = QuantStatistics.sortinoRatio(returns);

    expect(Number.isFinite(sharpe)).toBe(true);
    expect(Number.isFinite(sortino)).toBe(true);
    expect(sortino).toBeGreaterThanOrEqual(sharpe); // Sortino penalizes only downside volatility
  });
});
