import { Ticker, OrderBook, Trade, LatencyMetrics } from '@arbitrage/market-data';
import { QualityThresholds, DEFAULT_QUALITY_THRESHOLDS, DataQualityAssessment } from './types';
import Decimal from 'decimal.js';

export class DataQualityEngine {
  private thresholds: QualityThresholds;
  private sequenceTracker: Map<string, number> = new Map();
  private lastKnownPrices: Map<string, number> = new Map();

  constructor(thresholds: Partial<QualityThresholds> = {}) {
    this.thresholds = { ...DEFAULT_QUALITY_THRESHOLDS, ...thresholds };
  }

  /**
   * Tracks and measures latency pipeline.
   */
  calculateLatency(
    exchangeTimestamp: number,
    receiveTimestamp: number = Date.now(),
  ): LatencyMetrics {
    const sourceLatencyMs = Math.max(0, receiveTimestamp - exchangeTimestamp);
    return {
      exchangeTimestamp,
      receiveTimestamp,
      normalizationTimestamp: receiveTimestamp,
      sourceLatencyMs,
      pipelineLatencyMs: sourceLatencyMs,
      totalLatencyMs: sourceLatencyMs,
    };
  }

  /**
   * Evaluates Ticker data quality against anomalies.
   */
  validateTicker(ticker: Ticker, receivedTimestamp: number = Date.now()): DataQualityAssessment {
    const reasons: string[] = [];
    const anomalies: DataQualityAssessment['anomaliesDetected'] = {};
    const age = Math.max(0, receivedTimestamp - ticker.timestamp);
    const drift = Math.abs(receivedTimestamp - ticker.timestamp);

    let bid: Decimal;
    let ask: Decimal;
    let last: Decimal;

    try {
      bid = new Decimal(ticker.bid);
      ask = new Decimal(ticker.ask);
      last = new Decimal(ticker.last);
    } catch {
      return {
        status: 'INVALID',
        isExecutable: false,
        dataAgeMs: age,
        sourceTimestamp: ticker.timestamp,
        receivedTimestamp,
        latencyMs: age,
        reasons: ['Malformed numerical values in ticker'],
        anomaliesDetected: { invalidPrice: true },
      };
    }

    // 1. Zero or negative price check
    if (bid.lte(0) || ask.lte(0) || last.lte(0)) {
      anomalies.invalidPrice = true;
      reasons.push('Bid, ask, or last price is zero or negative');
    }

    // 2. Crossed book check (bid >= ask)
    if (bid.gte(ask)) {
      anomalies.crossedBook = true;
      reasons.push(`Crossed book detected: bid (${bid}) >= ask (${ask})`);
    }

    // 3. Stale data check
    if (age > this.thresholds.maxStaleAgeMs) {
      anomalies.stalePrice = true;
      reasons.push(
        `Data is stale: age ${age}ms exceeds threshold of ${this.thresholds.maxStaleAgeMs}ms`,
      );
    }

    // 4. Timestamp drift check
    if (drift > this.thresholds.maxTimestampDriftMs) {
      anomalies.timestampDrift = true;
      reasons.push(`Significant timestamp drift detected: ${drift}ms`);
    }

    // 5. Abnormal price jump check
    const key = `${ticker.exchange}:${ticker.symbol}`;
    const previousPrice = this.lastKnownPrices.get(key);
    if (previousPrice && previousPrice > 0) {
      const priceDiffPercent = Math.abs((last.toNumber() - previousPrice) / previousPrice) * 100;
      if (priceDiffPercent > this.thresholds.maxPriceJumpPercent) {
        anomalies.abnormalJump = true;
        reasons.push(
          `Abnormal price jump of ${priceDiffPercent.toFixed(2)}% exceeds max limit of ${this.thresholds.maxPriceJumpPercent}%`,
        );
      }
    }
    this.lastKnownPrices.set(key, last.toNumber());

    // 6. Sequence gap check
    if (ticker.sequence !== undefined) {
      const lastSeq = this.sequenceTracker.get(key);
      if (lastSeq !== undefined && ticker.sequence > lastSeq + 1) {
        anomalies.sequenceGap = true;
        reasons.push(`Sequence gap detected: expected ${lastSeq + 1}, received ${ticker.sequence}`);
      }
      this.sequenceTracker.set(key, ticker.sequence);
    }

    // Determine final status
    let status: DataQualityAssessment['status'] = 'VALID';
    if (anomalies.invalidPrice || anomalies.crossedBook) {
      status = 'INVALID';
    } else if (anomalies.stalePrice) {
      status = 'STALE';
    } else if (anomalies.abnormalJump || anomalies.timestampDrift || anomalies.sequenceGap) {
      status = 'SUSPICIOUS';
    }

    return {
      status,
      isExecutable: status === 'VALID',
      dataAgeMs: age,
      sourceTimestamp: ticker.timestamp,
      receivedTimestamp,
      latencyMs: age,
      reasons,
      anomaliesDetected: anomalies,
    };
  }

  /**
   * Validates OrderBook snapshot structure and integrity.
   */
  validateOrderBook(
    book: OrderBook,
    receivedTimestamp: number = Date.now(),
  ): DataQualityAssessment {
    const reasons: string[] = [];
    const anomalies: DataQualityAssessment['anomaliesDetected'] = {};
    const age = Math.max(0, receivedTimestamp - book.timestamp);

    if (!book.bids || book.bids.length === 0 || !book.asks || book.asks.length === 0) {
      return {
        status: 'INVALID',
        isExecutable: false,
        dataAgeMs: age,
        sourceTimestamp: book.timestamp,
        receivedTimestamp,
        latencyMs: age,
        reasons: ['Order book missing bids or asks'],
        anomaliesDetected: { insufficientLiquidity: true },
      };
    }

    const bestBid = new Decimal(book.bids[0].price);
    const bestAsk = new Decimal(book.asks[0].price);

    if (bestBid.lte(0) || bestAsk.lte(0)) {
      anomalies.invalidPrice = true;
      reasons.push('Best bid or ask is zero or negative');
    }

    if (bestBid.gte(bestAsk)) {
      anomalies.crossedBook = true;
      reasons.push(`Order book crossed: best bid (${bestBid}) >= best ask (${bestAsk})`);
    }

    if (age > this.thresholds.maxStaleAgeMs) {
      anomalies.stalePrice = true;
      reasons.push(`Order book is stale: age ${age}ms exceeds ${this.thresholds.maxStaleAgeMs}ms`);
    }

    // Check top of book liquidity
    const topBidLiquidity = bestBid.mul(new Decimal(book.bids[0].amount)).toNumber();
    const topAskLiquidity = bestAsk.mul(new Decimal(book.asks[0].amount)).toNumber();
    if (
      topBidLiquidity < this.thresholds.minTopBookDepthUsd ||
      topAskLiquidity < this.thresholds.minTopBookDepthUsd
    ) {
      anomalies.insufficientLiquidity = true;
      reasons.push(
        `Insufficient top-of-book liquidity: Bid $${topBidLiquidity.toFixed(2)}, Ask $${topAskLiquidity.toFixed(2)}`,
      );
    }

    let status: DataQualityAssessment['status'] = 'VALID';
    if (anomalies.invalidPrice || anomalies.crossedBook) {
      status = 'INVALID';
    } else if (anomalies.stalePrice) {
      status = 'STALE';
    } else if (anomalies.insufficientLiquidity) {
      status = 'SUSPICIOUS';
    }

    return {
      status,
      isExecutable: status === 'VALID',
      dataAgeMs: age,
      sourceTimestamp: book.timestamp,
      receivedTimestamp,
      latencyMs: age,
      reasons,
      anomaliesDetected: anomalies,
    };
  }

  /**
   * Validates individual trade fill.
   */
  validateTrade(trade: Trade, receivedTimestamp: number = Date.now()): DataQualityAssessment {
    const reasons: string[] = [];
    const anomalies: DataQualityAssessment['anomaliesDetected'] = {};
    const age = Math.max(0, receivedTimestamp - trade.timestamp);

    const price = new Decimal(trade.price);
    const amount = new Decimal(trade.amount);

    if (price.lte(0) || amount.lte(0)) {
      anomalies.invalidPrice = true;
      reasons.push('Trade price or amount is non-positive');
    }

    let status: DataQualityAssessment['status'] = anomalies.invalidPrice ? 'INVALID' : 'VALID';

    return {
      status,
      isExecutable: status === 'VALID',
      dataAgeMs: age,
      sourceTimestamp: trade.timestamp,
      receivedTimestamp,
      latencyMs: age,
      reasons,
      anomaliesDetected: anomalies,
    };
  }
}
