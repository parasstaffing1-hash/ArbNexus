import { DEXAdapter } from './interfaces/dex.interface';
import { UniswapAdapter } from './adapters/uniswap.adapter';
import { JupiterAdapter } from './adapters/jupiter.adapter';
import { OneInchAdapter } from './adapters/oneinch.adapter';
import { RaydiumAdapter } from './adapters/raydium.adapter';
import { OrcaAdapter } from './adapters/orca.adapter';
import { LiFiAdapter } from './adapters/lifi.adapter';

export class DEXAdapterFactory {
  private static adapters: Map<string, DEXAdapter> = new Map();

  static initialize(): void {
    if (this.adapters.size > 0) return;

    const list: DEXAdapter[] = [
      new UniswapAdapter(),
      new JupiterAdapter(),
      new OneInchAdapter(),
      new RaydiumAdapter(),
      new OrcaAdapter(),
      new LiFiAdapter(),
    ];

    for (const a of list) {
      this.adapters.set(a.dexId.toLowerCase(), a);
    }
  }

  static getAdapter(dexId: string): DEXAdapter {
    this.initialize();
    const adapter = this.adapters.get(dexId.toLowerCase());
    if (!adapter) {
      throw new Error(`DEX adapter not found for: ${dexId}`);
    }
    return adapter;
  }

  static getAllAdapters(): DEXAdapter[] {
    this.initialize();
    return Array.from(this.adapters.values());
  }

  static getSupportedDEXIds(): string[] {
    this.initialize();
    return Array.from(this.adapters.keys());
  }
}
