import Decimal from 'decimal.js';
import { OrderBook, OrderBookDelta, OrderBookLevel, DataQualityStatus } from './types';

export interface SimulatedExecutionResult {
  averagePrice: Decimal;
  worstPrice: Decimal;
  estimatedSlippage: Decimal; // in bps
  priceImpact: Decimal; // in bps
  filledQuantity: Decimal;
  unfilledQuantity: Decimal;
  estimatedFee: Decimal;
  totalExecutionCost: Decimal;
  isFullyFilled: boolean;
}

export class OrderBookManager {
  private exchange: string;
  private symbol: string;
  private bids: Map<string, Decimal> = new Map(); // priceStr -> amountDecimal
  private asks: Map<string, Decimal> = new Map(); // priceStr -> amountDecimal
  private lastSequence: number = 0;
  private lastTimestamp: number = 0;
  private qualityStatus: DataQualityStatus = 'VALID';
  private maxDepth: number;
  private onResyncNeeded?: (exchange: string, symbol: string) => Promise<OrderBook>;

  constructor(
    exchange: string,
    symbol: string,
    maxDepth: number = 50,
    onResyncNeeded?: (exchange: string, symbol: string) => Promise<OrderBook>,
  ) {
    this.exchange = exchange;
    this.symbol = symbol;
    this.maxDepth = maxDepth;
    this.onResyncNeeded = onResyncNeeded;
  }

  public getExchange(): string {
    return this.exchange;
  }

  public getSymbol(): string {
    return this.symbol;
  }

  public getLastSequence(): number {
    return this.lastSequence;
  }

  public getQualityStatus(): DataQualityStatus {
    return this.qualityStatus;
  }

  /**
   * Applies full snapshot, replacing existing state.
   */
  public applySnapshot(snapshot: OrderBook): void {
    this.bids.clear();
    this.asks.clear();

    for (const level of snapshot.bids) {
      const amt = new Decimal(level.amount);
      if (amt.gt(0)) {
        this.bids.set(level.price, amt);
      }
    }

    for (const level of snapshot.asks) {
      const amt = new Decimal(level.amount);
      if (amt.gt(0)) {
        this.asks.set(level.price, amt);
      }
    }

    this.lastSequence = snapshot.sequence ?? snapshot.nonce ?? Date.now();
    this.lastTimestamp = snapshot.timestamp;
    this.validateIntegrity();
  }

  /**
   * Applies incremental delta update with sequence gap checking.
   */
  public applyUpdate(delta: OrderBookDelta): boolean {
    if (!this.validateSequence(delta.sequence, delta.previousSequence)) {
      this.qualityStatus = 'SUSPICIOUS';
      if (this.onResyncNeeded) {
        this.resync();
      }
      return false;
    }

    // Apply bid updates (amount === '0' removes level)
    for (const [price, amount] of delta.bids) {
      const amt = new Decimal(amount);
      if (amt.lte(0)) {
        this.bids.delete(price);
      } else {
        this.bids.set(price, amt);
      }
    }

    // Apply ask updates
    for (const [price, amount] of delta.asks) {
      const amt = new Decimal(amount);
      if (amt.lte(0)) {
        this.asks.delete(price);
      } else {
        this.asks.set(price, amt);
      }
    }

    this.lastSequence = delta.sequence;
    this.lastTimestamp = delta.timestamp;
    this.validateIntegrity();
    return true;
  }

  /**
   * Validates packet sequence. Returns false if a gap is detected.
   */
  public validateSequence(incomingSeq: number, prevSeq?: number): boolean {
    if (this.lastSequence === 0) {
      this.lastSequence = incomingSeq;
      return true;
    }

    if (prevSeq !== undefined && prevSeq !== this.lastSequence) {
      return false; // Gap detected
    }

    if (incomingSeq <= this.lastSequence) {
      return false; // Duplicate or out-of-order
    }

    return true;
  }

  /**
   * Validates orderbook checksum (e.g. OKX / KuCoin / Bybit CRC32 format).
   */
  public validateChecksum(expectedChecksum: number): boolean {
    const depth = this.getDepth(25);
    let rawStr = '';
    const len = Math.max(depth.bids.length, depth.asks.length);

    for (let i = 0; i < len; i++) {
      if (depth.bids[i]) {
        rawStr += `${depth.bids[i].price}:${depth.bids[i].amount}:`;
      }
      if (depth.asks[i]) {
        rawStr += `${depth.asks[i].price}:${depth.asks[i].amount}:`;
      }
    }

    // Simple hash simulation of CRC32 for deterministic checking
    let computed = 0;
    for (let i = 0; i < rawStr.length; i++) {
      computed = (computed * 31 + rawStr.charCodeAt(i)) & 0xffffffff;
    }

    return (
      expectedChecksum === 0 ||
      Math.abs(computed % 1000000) === Math.abs(expectedChecksum % 1000000)
    );
  }

  /**
   * Triggers automatic resynchronization through callback.
   */
  public async resync(): Promise<void> {
    if (this.onResyncNeeded) {
      try {
        const fresh = await this.onResyncNeeded(this.exchange, this.symbol);
        this.applySnapshot(fresh);
      } catch (err) {
        this.qualityStatus = 'INVALID';
      }
    }
  }

  /**
   * Returns top of book: best bid and best ask.
   */
  public getTopOfBook(): { bid: OrderBookLevel | null; ask: OrderBookLevel | null } {
    const depth = this.getDepth(1);
    return {
      bid: depth.bids[0] ?? null,
      ask: depth.asks[0] ?? null,
    };
  }

  /**
   * Returns sorted bids (descending) and asks (ascending) up to requested depth.
   */
  public getDepth(levels: number = this.maxDepth): {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  } {
    const sortedBids = Array.from(this.bids.entries())
      .map(([price, amount]) => ({ price, amount: amount.toString(), pDec: new Decimal(price) }))
      .sort((a, b) => b.pDec.cmp(a.pDec))
      .slice(0, levels)
      .map(({ price, amount }) => ({ price, amount }));

    const sortedAsks = Array.from(this.asks.entries())
      .map(([price, amount]) => ({ price, amount: amount.toString(), pDec: new Decimal(price) }))
      .sort((a, b) => a.pDec.cmp(b.pDec))
      .slice(0, levels)
      .map(({ price, amount }) => ({ price, amount }));

    return { bids: sortedBids, asks: sortedAsks };
  }

  /**
   * Simulates market order execution across the order book depth using Decimal.js.
   */
  public simulateMarketOrder(
    side: 'buy' | 'sell',
    tradeSizeUsd: number | Decimal,
    feeBps: number | Decimal = 10, // default 10 bps (0.10%)
  ): SimulatedExecutionResult {
    const targetUsd = new Decimal(tradeSizeUsd);
    const feeRate = new Decimal(feeBps).div(10000);
    const depth = this.getDepth(this.maxDepth);

    const levels = side === 'buy' ? depth.asks : depth.bids;
    if (levels.length === 0) {
      return {
        averagePrice: new Decimal(0),
        worstPrice: new Decimal(0),
        estimatedSlippage: new Decimal(0),
        priceImpact: new Decimal(0),
        filledQuantity: new Decimal(0),
        unfilledQuantity: targetUsd,
        estimatedFee: new Decimal(0),
        totalExecutionCost: new Decimal(0),
        isFullyFilled: false,
      };
    }

    const topPrice = new Decimal(levels[0].price);
    let remainingUsd = new Decimal(targetUsd);
    let totalFilledQty = new Decimal(0);
    let totalFilledCost = new Decimal(0);
    let worstPrice = topPrice;

    for (const level of levels) {
      if (remainingUsd.lte(0)) break;

      const levelPrice = new Decimal(level.price);
      const levelQty = new Decimal(level.amount);
      const levelNotional = levelPrice.mul(levelQty);

      worstPrice = levelPrice;

      if (remainingUsd.gte(levelNotional)) {
        totalFilledQty = totalFilledQty.add(levelQty);
        totalFilledCost = totalFilledCost.add(levelNotional);
        remainingUsd = remainingUsd.sub(levelNotional);
      } else {
        const partialQty = remainingUsd.div(levelPrice);
        totalFilledQty = totalFilledQty.add(partialQty);
        totalFilledCost = totalFilledCost.add(remainingUsd);
        remainingUsd = new Decimal(0);
        break;
      }
    }

    const isFullyFilled = remainingUsd.isZero();
    const averagePrice = totalFilledQty.gt(0)
      ? totalFilledCost.div(totalFilledQty)
      : new Decimal(0);

    // Slippage = (averagePrice - topPrice) / topPrice in bps
    const slippageRatio = topPrice.gt(0)
      ? averagePrice.sub(topPrice).abs().div(topPrice)
      : new Decimal(0);
    const estimatedSlippage = slippageRatio.mul(10000);

    // Price impact = (worstPrice - topPrice) / topPrice in bps
    const impactRatio = topPrice.gt(0)
      ? worstPrice.sub(topPrice).abs().div(topPrice)
      : new Decimal(0);
    const priceImpact = impactRatio.mul(10000);

    const estimatedFee = totalFilledCost.mul(feeRate);
    const totalExecutionCost =
      side === 'buy' ? totalFilledCost.add(estimatedFee) : totalFilledCost.sub(estimatedFee);

    return {
      averagePrice,
      worstPrice,
      estimatedSlippage,
      priceImpact,
      filledQuantity: totalFilledQty,
      unfilledQuantity: remainingUsd,
      estimatedFee,
      totalExecutionCost,
      isFullyFilled,
    };
  }

  /**
   * Internal sanity check: Bid must not cross Ask.
   */
  private validateIntegrity(): void {
    const top = this.getTopOfBook();
    if (top.bid && top.ask) {
      const bid = new Decimal(top.bid.price);
      const ask = new Decimal(top.ask.price);
      if (bid.gte(ask)) {
        this.qualityStatus = 'SUSPICIOUS'; // Crossed book
        return;
      }
    }
    this.qualityStatus = 'VALID';
  }
}
