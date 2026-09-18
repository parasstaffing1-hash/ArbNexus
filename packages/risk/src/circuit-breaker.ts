import Decimal from 'decimal.js';
import { CircuitBreakerState } from './types';

export class CircuitBreaker {
  private state: CircuitBreakerState = {
    isTripped: false,
    cooldownSeconds: 300, // 5 min default cooldown
  };

  private peakEquityUsd: Decimal = new Decimal(100000);
  private currentEquityUsd: Decimal = new Decimal(100000);

  updateEquity(newEquityUsd: Decimal, maxDrawdownPercent: number = 5.0): boolean {
    this.currentEquityUsd = newEquityUsd;
    if (newEquityUsd.gt(this.peakEquityUsd)) {
      this.peakEquityUsd = newEquityUsd;
    }

    const drawdownPercent = this.peakEquityUsd.isZero()
      ? new Decimal(0)
      : this.peakEquityUsd.minus(this.currentEquityUsd).div(this.peakEquityUsd).mul(100);

    if (drawdownPercent.gte(maxDrawdownPercent)) {
      this.trip(`Max drawdown breach: ${drawdownPercent.toFixed(2)}% >= ${maxDrawdownPercent}%`);
      return false;
    }

    return !this.state.isTripped;
  }

  trip(reason: string): void {
    this.state.isTripped = true;
    this.state.tripReason = reason;
    this.state.trippedAt = Date.now();
  }

  reset(): void {
    this.state.isTripped = false;
    this.state.tripReason = undefined;
    this.state.trippedAt = undefined;
  }

  isOpen(): boolean {
    if (!this.state.isTripped) return false;
    // Check if cooldown expired
    if (
      this.state.trippedAt &&
      Date.now() - this.state.trippedAt > this.state.cooldownSeconds * 1000
    ) {
      this.reset();
      return false;
    }
    return true;
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }
}
