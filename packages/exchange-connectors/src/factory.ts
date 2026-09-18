import { ExchangeAdapter } from './interfaces/exchange.interface';
import { BinanceAdapter } from './adapters/binance.adapter';
import { BybitAdapter } from './adapters/bybit.adapter';
import { OKXAdapter } from './adapters/okx.adapter';
import { BitgetAdapter } from './adapters/bitget.adapter';
import { KuCoinAdapter } from './adapters/kucoin.adapter';
import { GateAdapter } from './adapters/gate.adapter';
import { MEXCAdapter } from './adapters/mexc.adapter';
import { HyperliquidAdapter } from './adapters/hyperliquid.adapter';

export class ExchangeAdapterFactory {
  private static adapters: Map<string, ExchangeAdapter> = new Map();

  static initialize(): void {
    if (this.adapters.size > 0) return;

    const list: ExchangeAdapter[] = [
      new BinanceAdapter(),
      new BybitAdapter(),
      new OKXAdapter(),
      new BitgetAdapter(),
      new KuCoinAdapter(),
      new GateAdapter(),
      new MEXCAdapter(),
      new HyperliquidAdapter(),
    ];

    for (const a of list) {
      this.adapters.set(a.exchangeId.toLowerCase(), a);
    }
  }

  static getAdapter(exchangeId: string): ExchangeAdapter {
    this.initialize();
    const adapter = this.adapters.get(exchangeId.toLowerCase());
    if (!adapter) {
      throw new Error(`Exchange adapter not found for: ${exchangeId}`);
    }
    return adapter;
  }

  static getAllAdapters(): ExchangeAdapter[] {
    this.initialize();
    return Array.from(this.adapters.values());
  }

  static getSupportedExchangeIds(): string[] {
    this.initialize();
    return Array.from(this.adapters.keys());
  }
}
