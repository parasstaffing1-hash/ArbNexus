import { DataQualityEngine } from '@arbitrage/data-quality';
import { OpportunityLifecycleManager } from '../lifecycle/lifecycle-manager';
import { Opportunity } from '../types/opportunity.types';
import { Ticker, OrderBook } from '@arbitrage/market-data';
import { SpotSpatialDetector } from '../detectors/spot-spatial.detector';
import { TriangularDetector } from '../detectors/triangular.detector';
import { MultiHopArbitrageDetector } from '../detectors/multihop.detector';
import { FundingBasisDetector } from '../detectors/funding-basis.detector';
import { BasisOpportunityDetector } from '../detectors/futures-basis.detector';
import { CrossChainDetector } from '../detectors/cross-chain.detector';
import { StablecoinDetector } from '../detectors/stablecoin.detector';
import { StatisticalDetector } from '../detectors/statistical.detector';
import { LiquidationDetector } from '../detectors/liquidation.detector';
import { OnChainMEVDetector } from '../detectors/onchain-mev.detector';
import { MarketGraph } from '@arbitrage/graph-engine';
import Decimal from 'decimal.js';

export class ArbitragePipeline {
  private qualityEngine: DataQualityEngine;
  private lifecycleManager: OpportunityLifecycleManager;
  private spotDetector: SpotSpatialDetector;
  private triangularDetector: TriangularDetector;
  private multiHopDetector: MultiHopArbitrageDetector;
  private fundingDetector: FundingBasisDetector;
  private basisDetector: BasisOpportunityDetector;
  private crossChainDetector: CrossChainDetector;
  private stablecoinDetector: StablecoinDetector;
  private statisticalDetector: StatisticalDetector;
  private liquidationDetector: LiquidationDetector;
  private onChainMevDetector: OnChainMEVDetector;

  constructor() {
    this.qualityEngine = new DataQualityEngine();
    this.lifecycleManager = new OpportunityLifecycleManager();
    this.spotDetector = new SpotSpatialDetector();
    this.triangularDetector = new TriangularDetector();
    this.multiHopDetector = new MultiHopArbitrageDetector();
    this.fundingDetector = new FundingBasisDetector();
    this.basisDetector = new BasisOpportunityDetector();
    this.crossChainDetector = new CrossChainDetector();
    this.stablecoinDetector = new StablecoinDetector();
    this.statisticalDetector = new StatisticalDetector();
    this.liquidationDetector = new LiquidationDetector();
    this.onChainMevDetector = new OnChainMEVDetector();
  }

  getLifecycleManager(): OpportunityLifecycleManager {
    return this.lifecycleManager;
  }

  /**
   * Processes live or simulated market tickers through the entire arbitrage pipeline:
   * raw market data -> data quality checks -> candidate detection -> calculation validation -> lifecycle transition.
   */
  async processTickers(tickers: Ticker[], tradeCapitalUsd: number = 10000): Promise<Opportunity[]> {
    // 1. Data Quality Checks
    const validTickers: Ticker[] = [];
    for (const t of tickers) {
      const assessment = this.qualityEngine.validateTicker(t);
      if (assessment.isExecutable) {
        validTickers.push(t);
      }
    }

    if (validTickers.length < 2) return [];

    // 2. Candidate Detection
    const rawCandidates = await this.spotDetector.detect({
      tickers: validTickers,
      tradeCapitalUsd,
      minSpreadBps: 5,
    });

    const validated: Opportunity[] = [];

    // 3. Lifecycle Transition: DETECTED -> VALIDATING -> VALID
    for (const opp of rawCandidates) {
      this.lifecycleManager.registerDetected(opp);
      this.lifecycleManager.transitionToValidating(opp.id);

      // Verify positive net profit and non-stale data
      if (parseFloat(opp.expected_net_profit) > 0 && opp.data_quality === 'VALID') {
        const validOpp = this.lifecycleManager.transitionToValid(opp.id);
        if (validOpp) {
          validated.push(validOpp);
        }
      } else {
        this.lifecycleManager.transitionToRejected(
          opp.id,
          'Negative net profit or failed quality check',
        );
      }
    }

    return validated;
  }

  /**
   * Processes market graph for triangular cycles.
   */
  async processGraph(graph: MarketGraph, tradeCapitalUsd: number = 10000): Promise<Opportunity[]> {
    const cycles = await this.triangularDetector.detect({
      graph,
      tradeCapitalUsd,
    });

    const validated: Opportunity[] = [];
    for (const c of cycles) {
      this.lifecycleManager.registerDetected(c);
      this.lifecycleManager.transitionToValidating(c.id);
      const valid = this.lifecycleManager.transitionToValid(c.id);
      if (valid) validated.push(valid);
    }
    return validated;
  }

  /**
   * Processes market graph for multi-hop paths (4 or 5 hops).
   */
  async processMultiHop(
    graph: MarketGraph,
    tradeCapitalUsd: number = 10000,
  ): Promise<Opportunity[]> {
    const cycles = await this.multiHopDetector.detect({
      graph,
      maxHops: 4,
      tradeCapitalUsd,
    });

    const validated: Opportunity[] = [];
    for (const c of cycles) {
      this.lifecycleManager.registerDetected(c);
      this.lifecycleManager.transitionToValidating(c.id);
      const valid = this.lifecycleManager.transitionToValid(c.id);
      if (valid) validated.push(valid);
    }
    return validated;
  }

  /**
   * Generates cross-chain arbitrage opportunities.
   */
  async processCrossChain(): Promise<Opportunity[]> {
    const opps = await this.crossChainDetector.detect({});
    opps.forEach((o) => {
      this.lifecycleManager.registerDetected(o);
      this.lifecycleManager.transitionToValid(o.id);
    });
    return opps;
  }

  /**
   * Generates stablecoin depeg arbitrage opportunities.
   */
  async processStablecoins(): Promise<Opportunity[]> {
    const opps = await this.stablecoinDetector.detect({});
    opps.forEach((o) => {
      this.lifecycleManager.registerDetected(o);
      this.lifecycleManager.transitionToValid(o.id);
    });
    return opps;
  }

  /**
   * Generates statistical and pairs mean-reversion arbitrage opportunities.
   */
  async processStatistical(tradeCapitalUsd: number = 25000): Promise<Opportunity[]> {
    const opps = await this.statisticalDetector.detect({ tradeCapitalUsd });
    opps.forEach((o) => {
      this.lifecycleManager.registerDetected(o);
      this.lifecycleManager.transitionToValid(o.id);
    });
    return opps;
  }

  /**
   * Generates funding rate and perpetual differential opportunities.
   */
  async processFunding(notionalCapitalUsd: number = 20000): Promise<Opportunity[]> {
    const opps = await this.fundingDetector.detect({ notionalCapitalUsd });
    opps.forEach((o) => {
      this.lifecycleManager.registerDetected(o);
      this.lifecycleManager.transitionToValid(o.id);
    });
    return opps;
  }

  /**
   * Generates futures basis and term structure opportunities.
   */
  async processBasis(tradeCapitalUsd: number = 25000): Promise<Opportunity[]> {
    const now = Date.now();
    const opps = await this.basisDetector.detect({
      spotPrice: new Decimal('98500.00'),
      underlying: 'BTC',
      spotExchange: 'binance',
      contracts: [
        {
          symbol: 'BTC-27DEC26',
          underlying: 'BTC',
          exchange: 'deribit',
          futurePrice: new Decimal('100450.00'),
          expiryTimestamp: now + 90 * 86400 * 1000,
          openInterestUsd: new Decimal('450000000'),
        },
      ],
      tradeCapitalUsd,
    });
    opps.forEach((o) => {
      this.lifecycleManager.registerDetected(o);
      this.lifecycleManager.transitionToValid(o.id);
    });
    return opps;
  }

  /**
   * Generates lending liquidation intelligence opportunities.
   */
  async processLiquidation(tradeCapitalUsd: number = 50000): Promise<Opportunity[]> {
    const opps = await this.liquidationDetector.detect({ tradeCapitalUsd });
    opps.forEach((o) => {
      this.lifecycleManager.registerDetected(o);
      this.lifecycleManager.transitionToValid(o.id);
    });
    return opps;
  }

  /**
   * Generates on-chain DEX/AMM discrepancy and atomic MEV simulation opportunities.
   */
  async processOnChainMEV(tradeCapitalUsd: number = 50000): Promise<Opportunity[]> {
    const opps = await this.onChainMevDetector.detect({ tradeCapitalUsd });
    opps.forEach((o) => {
      this.lifecycleManager.registerDetected(o);
      this.lifecycleManager.transitionToValid(o.id);
    });
    return opps;
  }
}
