import { EventEmitter } from 'events';
import Decimal from 'decimal.js';
import { NormalizedBlockchainEvent } from '../interfaces/indexer.interface';
import { PoolEventIndexer } from './solana-event.indexer';

export interface RaydiumPoolConfig {
  poolAddress: string;
  tokenBase: { symbol: string; mint: string; decimals: number };
  tokenQuote: { symbol: string; mint: string; decimals: number };
  rpcEndpoint?: string;
}

export interface RaydiumPoolState {
  poolAddress: string;
  slot: number;
  baseVaultReserve: string;
  quoteVaultReserve: string;
  currentPrice: string;
  timestamp: number;
}

export class RaydiumPoolListener extends EventEmitter {
  private isRunning: boolean = false;
  private currentSlot: number = 280000000;
  private pollIntervalTimer: NodeJS.Timeout | null = null;
  private activeState: RaydiumPoolState;

  constructor(public readonly config: RaydiumPoolConfig) {
    super();
    // Default initial baseline: SOL ~ $188.00 with 350,000 SOL and 65,800,000 USDC reserves
    this.activeState = {
      poolAddress: config.poolAddress,
      slot: this.currentSlot,
      baseVaultReserve: '350000',
      quoteVaultReserve: '65800000',
      currentPrice: '188.00',
      timestamp: Date.now(),
    };
  }

  public getState(): RaydiumPoolState {
    return { ...this.activeState };
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // Emit initial pool state
    this.emitPoolState(this.activeState);

    // Active block/slot loop
    this.pollIntervalTimer = setInterval(() => {
      if (!this.isRunning) return;
      this.currentSlot += 2; // Solana slots advance ~400ms

      // Simulated micro-price fluctuations on Solana order flow
      const deltaPercent = Math.cos(Date.now() / 12000) * 0.0012 + (Math.random() - 0.48) * 0.001;
      const basePrice = new Decimal(this.activeState.currentPrice);
      const newPrice = basePrice.mul(new Decimal(1).plus(deltaPercent)).toFixed(2);

      // Adjust reserves according to x * y = k invariant
      const newBaseReserve = new Decimal(this.activeState.baseVaultReserve)
        .mul(new Decimal(1).minus(deltaPercent / 2))
        .toFixed(2);
      const newQuoteReserve = new Decimal(newBaseReserve).mul(newPrice).toFixed(2);

      this.activeState = {
        ...this.activeState,
        currentPrice: newPrice,
        baseVaultReserve: newBaseReserve,
        quoteVaultReserve: newQuoteReserve,
        slot: this.currentSlot,
        timestamp: Date.now(),
      };

      // 1. Emit Raydium Pool State update
      const poolStateEvent = PoolEventIndexer.normalizeRaydiumPoolState(this.config.poolAddress, {
        dex: 'raydium_clmm',
        slot: this.currentSlot,
        baseVaultReserve: newBaseReserve,
        quoteVaultReserve: newQuoteReserve,
        currentPrice: newPrice,
        tokenBase: this.config.tokenBase.symbol,
        tokenQuote: this.config.tokenQuote.symbol,
      });
      this.emit('pool_state', poolStateEvent);

      // 2. Intermittently emit live Swap event
      if (Math.random() > 0.35) {
        const isSolBuy = Math.random() > 0.5;
        const amountSol = (Math.random() * 45 + 5).toFixed(3);
        const amountUsdc = (parseFloat(amountSol) * parseFloat(newPrice)).toFixed(2);

        const swapEvent = PoolEventIndexer.normalizeSwapEvent('solana', this.config.poolAddress, {
          sender: '7YttLkHvw99pM47qK2YqK169Z6r2yqR16789abcdef1',
          amount0In: isSolBuy ? '0.00' : amountSol,
          amount1In: isSolBuy ? amountUsdc : '0.00',
          amount0Out: isSolBuy ? amountSol : '0.00',
          amount1Out: isSolBuy ? '0.00' : amountUsdc,
          txHash: `soltx${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`,
          blockNumber: this.currentSlot,
        });
        this.emit('swap', swapEvent);
      }
    }, 1800);
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
  }

  private emitPoolState(state: RaydiumPoolState): void {
    const event = PoolEventIndexer.normalizeRaydiumPoolState(this.config.poolAddress, {
      dex: 'raydium_clmm',
      slot: state.slot,
      baseVaultReserve: state.baseVaultReserve,
      quoteVaultReserve: state.quoteVaultReserve,
      currentPrice: state.currentPrice,
      tokenBase: this.config.tokenBase.symbol,
      tokenQuote: this.config.tokenQuote.symbol,
    });
    this.emit('pool_state', event);
  }
}
