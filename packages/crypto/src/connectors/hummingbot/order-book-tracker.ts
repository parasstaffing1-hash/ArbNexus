import { HummingbotOrderBookDiff } from './hummingbot.types';

export class HummingbotOrderBookTracker {
  private bids: Map<number, number> = new Map();
  private asks: Map<number, number> = new Map();
  private lastUpdateId = 0;

  constructor(public readonly tradingPair: string) {}

  public applyDiff(diff: HummingbotOrderBookDiff): void {
    if (diff.updateId <= this.lastUpdateId) {
      return;
    }
    this.lastUpdateId = diff.updateId;

    for (const bid of diff.bids) {
      if (bid.amount === 0) {
        this.bids.delete(bid.price);
      } else {
        this.bids.set(bid.price, bid.amount);
      }
    }

    for (const ask of diff.asks) {
      if (ask.amount === 0) {
        this.asks.delete(ask.price);
      } else {
        this.asks.set(ask.price, ask.amount);
      }
    }
  }

  public getBestBid(): { price: number; amount: number } | null {
    if (this.bids.size === 0) return null;
    const bestPrice = Math.max(...Array.from(this.bids.keys()));
    return { price: bestPrice, amount: this.bids.get(bestPrice) || 0 };
  }

  public getBestAsk(): { price: number; amount: number } | null {
    if (this.asks.size === 0) return null;
    const bestPrice = Math.min(...Array.from(this.asks.keys()));
    return { price: bestPrice, amount: this.asks.get(bestPrice) || 0 };
  }
}
