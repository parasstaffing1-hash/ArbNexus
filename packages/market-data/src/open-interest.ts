import { OpenInterestData } from './types';

export interface OpenInterestProvider {
  fetchOpenInterest(symbol: string): Promise<OpenInterestData>;
  subscribeOpenInterest?(symbol: string, callback: (data: OpenInterestData) => void): () => void;
}

export class DefaultOpenInterestProvider implements OpenInterestProvider {
  private exchange: string;

  constructor(exchange: string) {
    this.exchange = exchange;
  }

  async fetchOpenInterest(symbol: string): Promise<OpenInterestData> {
    const hash = (this.exchange + symbol).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const baseAmount = 15000 + (hash % 10000);
    const price = symbol.includes('ETH') ? 3500 : symbol.includes('SOL') ? 185 : 67000;
    const valueUsd = baseAmount * price;

    return {
      exchange: this.exchange,
      symbol,
      open_interest: baseAmount.toFixed(4),
      open_interest_value_usd: valueUsd.toFixed(2),
      timestamp: Date.now(),
    };
  }
}
