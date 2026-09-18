import { Ticker, Trade, EventEnvelope, createEnvelope, TOPICS } from '@arbitrage/market-data';
import { ReplayConfig } from './types';

export class MarketDataReplayEngine {
  private config: ReplayConfig;
  private isReplaying: boolean = false;

  constructor(config: Partial<ReplayConfig> = {}) {
    this.config = {
      replaySpeedMultiplier: 1.0,
      ...config,
    };
  }

  /**
   * Replays historical tickers through the event consumer stream.
   */
  async replayTickers(
    historicalTickers: Ticker[],
    onEvent: (envelope: EventEnvelope<Ticker>) => void | Promise<void>,
  ): Promise<{ replayedCount: number; durationMs: number }> {
    this.isReplaying = true;
    const startReplay = Date.now();
    let count = 0;

    for (let i = 0; i < historicalTickers.length; i++) {
      if (!this.isReplaying) break;

      const current = historicalTickers[i];
      const envelope = createEnvelope(current.exchange, current.symbol, current, {
        exchangeTimestamp: current.timestamp,
      });

      await onEvent(envelope);
      count++;

      if (this.config.replaySpeedMultiplier > 0 && i < historicalTickers.length - 1) {
        const timeDiff = Math.max(0, historicalTickers[i + 1].timestamp - current.timestamp);
        const sleepMs = Math.min(100, Math.floor(timeDiff / this.config.replaySpeedMultiplier));
        if (sleepMs > 0) {
          await new Promise((r) => setTimeout(r, sleepMs));
        }
      }
    }

    this.isReplaying = false;
    return {
      replayedCount: count,
      durationMs: Date.now() - startReplay,
    };
  }

  stop(): void {
    this.isReplaying = false;
  }
}
