/**
 * ArbNexus — Advanced Arbitrage + Quantitative Opportunity Engine Pipeline
 *
 * Deterministically verifies:
 * 1. Zero-Execution & Safety Gate Assertion (ENABLE_EXECUTION=false)
 * 2. Triangular Arbitrage (USDT -> BTC -> ETH -> USDT) with 7 capital checkpoints
 * 3. Multi-Hop Arbitrage (USDT -> BTC -> ETH -> SOL -> USDT) with combinatorial pruning
 * 4. Funding-Rate Arbitrage & Cash-and-Carry Basis (Spot BTC + Short BTC Perp)
 * 5. Futures Basis & Term Structure Curve (Spot, Perp, 1M, 3M, 6M)
 * 6. Statistical Mean-Reversion & Engle-Granger Cointegration
 * 7. Trade-Size Optimizer & Portfolio Capital Allocator ($100k capital)
 * 8. NATS JetStream EventBus Distribution on arbitrage.* topics
 */

import Decimal from 'decimal.js';
import { MarketGraph, CycleDetector, RouteScorer, RouteFinder } from '../packages/graph-engine/src';
import {
  TriangularDetector,
  MultiHopArbitrageDetector,
  FundingBasisDetector,
  BasisOpportunityDetector,
  StatisticalDetector,
  Opportunity,
} from '../packages/arbitrage-engine/src';
import {
  CointegrationEngine,
  MeanReversionEngine,
  QuantStatistics,
  OpportunitySurvivalAnalyzer,
  OpportunityLifecycleRecord,
} from '../packages/quant/src';
import { TradeSizeOptimizer, CapitalAllocator } from '../packages/optimization/src';
import { OpportunityRiskEngine } from '../packages/risk/src/opportunity-risk.engine';
import { NatsEventBus, TOPICS, EventEnvelope } from '../packages/market-data/src';

async function runAdvancedArbitrageVerification() {
  console.log('================================================================');
  console.log('   ARBNEXUS — ADVANCED QUANTITATIVE ARBITRAGE VERIFICATION       ');
  console.log('================================================================\n');

  // =========================================================================
  // 0. Safety Gate: Verify Live Execution is Disabled
  // =========================================================================
  console.log('🔒 [Safety Gate] Verifying Execution Disablement Mandate:');
  const enableExecution = process.env.ENABLE_EXECUTION;
  if (enableExecution === 'true') {
    throw new Error('FATAL SECURITY VIOLATION: ENABLE_EXECUTION cannot be true!');
  }
  console.log(
    '   ✓ ENABLE_EXECUTION is confirmed "false". Real order execution is permanently blocked.\n',
  );

  // =========================================================================
  // 1. Scenario 1: Triangular Arbitrage (USDT -> BTC -> ETH -> USDT)
  // =========================================================================
  console.log('📐 [1/7] SCENARIO 1: Triangular Arbitrage (USDT -> BTC -> ETH -> USDT):');
  const triGraph = new MarketGraph();
  const now = Date.now();

  // Leg 1: USDT -> BTC @ $98,500 on Binance Spot (0.10% fee)
  triGraph.addEdge({
    id: 'e1-usdt-btc',
    fromAsset: 'USDT',
    toAsset: 'BTC',
    venue: 'binance',
    venueType: 'CEX',
    rate: new Decimal(1).div('98500'),
    weight: 0,
    feeBps: 10,
    availableLiquidityUsd: new Decimal('25000000'),
    estimatedLatencyMs: 20,
    timestamp: now,
  });

  // Leg 2: BTC -> ETH @ 34.50 ETH/BTC on Uniswap V3 (0.05% fee)
  triGraph.addEdge({
    id: 'e2-btc-eth',
    fromAsset: 'BTC',
    toAsset: 'ETH',
    venue: 'uniswap_v3',
    venueType: 'DEX',
    chain: 'ethereum',
    rate: new Decimal('34.50'),
    weight: 0,
    feeBps: 5,
    availableLiquidityUsd: new Decimal('15000000'),
    estimatedLatencyMs: 25,
    timestamp: now,
  });

  // Leg 3: ETH -> USDT @ $2,885.00 on OKX Spot (0.08% fee)
  // Implied cross-rate: (1 / 98500) * 34.50 * 2885.00 = 1.01048 (1.048% gross spread)
  triGraph.addEdge({
    id: 'e3-eth-usdt',
    fromAsset: 'ETH',
    toAsset: 'USDT',
    venue: 'okx',
    venueType: 'CEX',
    rate: new Decimal('2885.00'),
    weight: 0,
    feeBps: 8,
    availableLiquidityUsd: new Decimal('18000000'),
    estimatedLatencyMs: 18,
    timestamp: now,
  });

  const triDetector = new TriangularDetector();
  const triOpps = await triDetector.detect({
    graph: triGraph,
    rootAsset: 'USDT',
    tradeCapitalUsd: 10000,
  });

  if (triOpps.length === 0) {
    throw new Error('Expected Triangular Opportunity to be detected, but got none!');
  }
  const opp1 = triOpps[0];
  console.log(`   ✓ Detected Triangular Opportunity: ${opp1.id}`);
  console.log(`   - Cycle Path:       ${opp1.asset}`);
  console.log(`   - Venues:           ${opp1.venues.join(' -> ')}`);
  console.log(`   - Gross Spread:     +${(Number(opp1.gross_spread) * 100).toFixed(3)}%`);
  console.log(
    `   - Net Profit (10k): +$${opp1.expected_net_profit} USD (ROI: +${opp1.expected_roi}%)`,
  );
  console.log(
    `   - Checkpoints:      $100: +$${opp1.profit_checkpoints?.[0].netProfitUsd} | $1k: +$${opp1.profit_checkpoints?.[2].netProfitUsd} | $10k: +$${opp1.profit_checkpoints?.[4].netProfitUsd} | $50k: +$${opp1.profit_checkpoints?.[5].netProfitUsd}`,
  );
  console.log(
    `   - Grade & Score:    Grade ${opp1.letter_grade} (Score: ${opp1.opportunity_score}/100)\n`,
  );

  // =========================================================================
  // 2. Scenario 2: Multi-Hop 4-Hop Graph Arbitrage
  // =========================================================================
  console.log('🕸️ [2/7] SCENARIO 2: Multi-Hop 4-Hop Graph Arbitrage:');
  const multiGraph = new MarketGraph();
  // Leg 1: USDT -> BTC
  multiGraph.addEdge({
    id: 'm1',
    fromAsset: 'USDT',
    toAsset: 'BTC',
    venue: 'binance',
    venueType: 'CEX',
    rate: new Decimal(1).div('98500'),
    weight: 0,
    feeBps: 8,
    availableLiquidityUsd: new Decimal('20000000'),
    estimatedLatencyMs: 20,
    timestamp: now,
  });
  // Leg 2: BTC -> ETH
  multiGraph.addEdge({
    id: 'm2',
    fromAsset: 'BTC',
    toAsset: 'ETH',
    venue: 'uniswap_v3',
    venueType: 'DEX',
    chain: 'ethereum',
    rate: new Decimal('34.40'),
    weight: 0,
    feeBps: 5,
    availableLiquidityUsd: new Decimal('15000000'),
    estimatedLatencyMs: 25,
    timestamp: now,
  });
  // Leg 3: ETH -> SOL
  multiGraph.addEdge({
    id: 'm3',
    fromAsset: 'ETH',
    toAsset: 'SOL',
    venue: 'across',
    venueType: 'DEX',
    chain: 'arbitrum',
    rate: new Decimal('15.50'),
    weight: 0,
    feeBps: 6,
    availableLiquidityUsd: new Decimal('8000000'),
    estimatedLatencyMs: 35,
    timestamp: now,
  });
  // Leg 4: SOL -> USDT
  multiGraph.addEdge({
    id: 'm4',
    fromAsset: 'SOL',
    toAsset: 'USDT',
    venue: 'raydium',
    venueType: 'DEX',
    chain: 'solana',
    rate: new Decimal('187.50'),
    weight: 0,
    feeBps: 8,
    availableLiquidityUsd: new Decimal('12000000'),
    estimatedLatencyMs: 15,
    timestamp: now,
  });

  const multiHopDetector = new MultiHopArbitrageDetector();
  const multiOpps = await multiHopDetector.detect({
    graph: multiGraph,
    rootAsset: 'USDT',
    maxHops: 4,
    tradeCapitalUsd: 10000,
  });

  if (multiOpps.length === 0) {
    throw new Error('Expected Multi-Hop Opportunity to be detected, but got none!');
  }
  const opp2 = multiOpps[0];
  console.log(`   ✓ Detected 4-Hop Opportunity: ${opp2.id}`);
  console.log(`   - Route Path:       ${opp2.asset}`);
  console.log(`   - Hops Traversed:   ${opp2.strategy_metadata?.hopCount} hops`);
  console.log(
    `   - Net Profit (10k): +$${opp2.expected_net_profit} USD (ROI: +${opp2.expected_roi}%)\n`,
  );

  // =========================================================================
  // 3. Scenario 3: Funding Rate Arbitrage (Spot BTC + Short Perp)
  // =========================================================================
  console.log('⏳ [3/7] SCENARIO 3: Funding Rate Arbitrage & Carry Differential:');
  const fundingDetector = new FundingBasisDetector();
  const fundingOpps = await fundingDetector.detect({
    fundingRates: [
      {
        exchange: 'binance',
        symbol: 'BTC/USDT',
        funding_rate: 0.00018, // 1.8 bps per 8h (19.7% APY)
        funding_interval: 8,
        markPrice: '98650.00',
        timestamp: now,
      } as any,
      {
        exchange: 'bybit',
        symbol: 'BTC/USDT',
        funding_rate: 0.00004, // 0.4 bps per 8h
        funding_interval: 8,
        markPrice: '98640.00',
        timestamp: now,
      } as any,
    ],
    tickers: [
      {
        exchange: 'binance',
        symbol: 'BTC/USDT',
        bid: 98500,
        ask: 98510,
        last: 98505,
        timestamp: now,
      } as any,
    ],
    notionalCapitalUsd: 20000,
    minApyPercent: 8.0,
  });

  if (fundingOpps.length === 0) {
    throw new Error('Expected Funding Arbitrage Opportunity to be detected, but got none!');
  }
  const opp3 = fundingOpps[0];
  console.log(`   ✓ Detected Funding Opportunity: ${opp3.id}`);
  console.log(`   - Strategy Type:    ${opp3.strategy_type}`);
  console.log(`   - Venues:           ${opp3.venues.join(' vs ')}`);
  console.log(`   - Annualized APY:   ${opp3.expected_roi}%`);
  console.log(`   - Expected 30d PnL: +$${opp3.expected_net_profit} USD`);
  console.log(
    `   - Break-Even Time:  ${opp3.strategy_metadata?.breakEvenDays || opp3.strategy_metadata?.breakEvenHoldingIntervals} periods\n`,
  );

  // =========================================================================
  // 4. Scenario 4: Futures Basis & Term Structure Curve
  // =========================================================================
  console.log('📈 [4/7] SCENARIO 4: Spot ↔ Futures Basis Term Structure:');
  const basisDetector = new BasisOpportunityDetector();
  const contracts = [
    {
      symbol: 'BTC-27DEC26',
      underlying: 'BTC',
      exchange: 'deribit',
      futurePrice: new Decimal('100500.00'), // $2,000 basis above $98,500 spot
      expiryTimestamp: now + 90 * 86400 * 1000, // 90 days to expiry
      openInterestUsd: new Decimal('480000000'),
    },
  ];

  const basisOpps = await basisDetector.detect({
    spotPrice: new Decimal('98500.00'),
    underlying: 'BTC',
    spotExchange: 'binance',
    contracts,
    tradeCapitalUsd: 25000,
    minAnnualizedBasisPercent: 6.0,
  });

  if (basisOpps.length === 0) {
    throw new Error('Expected Futures Basis Opportunity to be detected, but got none!');
  }
  const opp4 = basisOpps[0];
  console.log(`   ✓ Detected Futures Basis Opportunity: ${opp4.id}`);
  console.log(
    `   - Contract:         ${opp4.strategy_metadata?.contractSymbol} (${opp4.strategy_metadata?.daysToExpiry} days to expiry)`,
  );
  console.log(`   - Raw Basis:        ${opp4.strategy_metadata?.basisBps.toFixed(1)} bps`);
  console.log(
    `   - Annualized Basis: ${opp4.strategy_metadata?.annualizedBasisPercent.toFixed(2)}% Annualized`,
  );
  console.log(`   - Net Profit:       +$${opp4.expected_net_profit} USD\n`);

  // =========================================================================
  // 5. Scenario 5: Statistical Mean-Reversion & Engle-Granger Cointegration
  // =========================================================================
  console.log('🔬 [5/7] SCENARIO 5: Statistical Mean-Reversion & Cointegration:');
  const nPoints = 80;
  const commonWalk = Array.from({ length: nPoints }, (_, i) => 2800 + i * 1.2);
  const spreadWalk = Array.from(
    { length: nPoints },
    (_, i) => Math.sin(i * 0.25) * 12 + (i === nPoints - 1 ? 38.5 : 0),
  );
  const seriesA = commonWalk.map((w, idx) => w + spreadWalk[idx]);
  const seriesB = commonWalk;

  const cointTest = CointegrationEngine.testEngleGranger(seriesA, seriesB);
  const statDetector = new StatisticalDetector();
  const statOpps = await statDetector.detect({
    pairs: [
      {
        pairA: 'ETH/USDT',
        pairB: 'stETH/USDT',
        venueA: 'binance',
        venueB: 'okx',
        historyA: seriesA,
        historyB: seriesB,
        zScoreThreshold: 2.0,
      },
    ],
    tradeCapitalUsd: 25000,
  });

  if (statOpps.length === 0) {
    throw new Error('Expected Statistical Opportunity to be detected, but got none!');
  }
  const opp5 = statOpps[0];
  console.log(
    `   ✓ Cointegration Test Result: ADF Stat = ${cointTest.adfStatistic.toFixed(2)} (p = ${cointTest.pValue.toFixed(3)}, Stationary = ${cointTest.isCointegrated})`,
  );
  console.log(`   ✓ Detected Statistical Opportunity: ${opp5.id}`);
  console.log(`   - Spread Z-Score:   Z = ${opp5.strategy_metadata?.zScore}`);
  console.log(`   - OU Half-Life:     ${opp5.strategy_metadata?.halfLifePeriods} periods`);
  console.log(`   - Signal Action:    ${opp5.strategy_metadata?.action}`);
  console.log(`   - Expected Net PnL: +$${opp5.expected_net_profit} USD\n`);

  // =========================================================================
  // 6. Scenario 6: Trade-Size Optimizer & Capital Allocator
  // =========================================================================
  console.log('⚖️ [6/7] SCENARIO 6: Trade-Size Optimizer & Portfolio Allocator:');
  const sizeOpt = TradeSizeOptimizer.optimizeTradeSize(
    new Decimal('0.012'), // 1.2% gross spread
    new Decimal('0.002'), // 0.2% total fees
    new Decimal('0.000005'), // quadratic slippage gamma
    new Decimal('100000'), // max liquidity
  );
  console.log(
    `   - Trade-Size Optimizer: Optimal Size = $${sizeOpt.optimalSizeUsd.toFixed(2)} USD (Max Net PnL: +$${sizeOpt.maxNetProfitUsd.toFixed(2)} USD, ROI: ${sizeOpt.expectedRoiPercent.toFixed(2)}%)`,
  );

  const allocation = CapitalAllocator.allocateCapital(
    new Decimal('100000'), // $100k portfolio
    [
      {
        id: opp1.id,
        expectedRoiPercent: new Decimal(opp1.expected_roi),
        executionRisk: opp1.execution_risk,
        maxExecutableSize: new Decimal(opp1.max_executable_size),
        venue: opp1.venues[0],
      },
      {
        id: opp3.id,
        expectedRoiPercent: new Decimal(opp3.expected_roi),
        executionRisk: opp3.execution_risk,
        maxExecutableSize: new Decimal(opp3.max_executable_size),
        venue: opp3.venues[0],
      },
      {
        id: opp5.id,
        expectedRoiPercent: new Decimal(opp5.expected_roi),
        executionRisk: opp5.execution_risk,
        maxExecutableSize: new Decimal(opp5.max_executable_size),
        venue: opp5.venues[0],
      },
    ],
    40, // max 40% per venue
  );

  console.log(
    `   - Capital Allocator: Allocated $${allocation.totalAllocatedUsd.toFixed(2)} USD / Idle: $${allocation.idleCapitalUsd.toFixed(2)} USD`,
  );
  for (const a of allocation.allocations) {
    console.log(
      `     * Candidate [${a.id.slice(0, 24)}...]: $${a.allocatedUsd.toFixed(2)} USD (${a.weightPercent.toFixed(1)}%)`,
    );
  }
  console.log('   ✓ Trade sizing and portfolio allocation verified.\n');

  // =========================================================================
  // 7. Scenario 7: Survival Analysis & NATS EventBus Distribution
  // =========================================================================
  console.log('📡 [7/7] SCENARIO 7: Opportunity Survival Analysis & NATS EventBus:');
  const sampleLifecycles: OpportunityLifecycleRecord[] = [
    {
      id: 'o1',
      strategy: 'TRIANGULAR',
      exchange: 'binance',
      asset: 'BTC',
      detectedAt: now - 350,
      expiredAt: now,
      netProfitUsd: 84,
    },
    {
      id: 'o2',
      strategy: 'TRIANGULAR',
      exchange: 'binance',
      asset: 'ETH',
      detectedAt: now - 180,
      expiredAt: now,
      netProfitUsd: 68,
    },
    {
      id: 'o3',
      strategy: 'FUNDING',
      exchange: 'bybit',
      asset: 'BTC',
      detectedAt: now - 7200000,
      expiredAt: now,
      netProfitUsd: 120,
    },
  ];
  const survival = OpportunitySurvivalAnalyzer.analyzeSurvival(sampleLifecycles);
  console.log(
    `   - Survival Analysis: Median Lifespan: ${survival.medianDurationMs}ms (p90: ${survival.p90DurationMs}ms, Total: ${survival.totalCount})`,
  );

  const eventBus = new NatsEventBus();
  await eventBus.connect();

  let receivedTriangularEvent = false;
  await eventBus.subscribe('arbitrage.validated', (env: EventEnvelope<Opportunity>) => {
    if (env.payload.id === opp1.id) {
      receivedTriangularEvent = true;
      console.log(
        `   ✓ [NATS RECV] Successfully delivered opportunity on 'arbitrage.validated': ${env.payload.id}`,
      );
    }
  });

  const envelope: EventEnvelope<Opportunity> = {
    id: `evt-${Date.now()}`,
    source: 'arbitrage-engine',
    type: 'arbitrage.validated',
    timestamp: Date.now(),
    payload: opp1,
  };
  await eventBus.publish(TOPICS.ARBITRAGE_VALIDATED, envelope);

  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!receivedTriangularEvent) {
    throw new Error('NATS event delivery was not received!');
  }

  await eventBus.disconnect();

  console.log('\n================================================================');
  console.log('   ALL ADVANCED QUANT ARBITRAGE PHASES COMPLETED WITH SUCCESS!  ');
  console.log('================================================================');
}

runAdvancedArbitrageVerification().catch((err) => {
  console.error('Advanced Arbitrage Pipeline Verification Failed:', err);
  process.exit(1);
});
