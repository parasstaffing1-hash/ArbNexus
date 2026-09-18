import { EventEmitter } from 'events';
import Decimal from 'decimal.js';
import { NormalizedBlockchainEvent } from '../interfaces/indexer.interface';
import { PoolEventIndexer } from './solana-event.indexer';

export interface UniswapV3PoolConfig {
  chain: 'ethereum' | 'arbitrum' | 'base' | 'polygon';
  poolAddress: string;
  token0: { symbol: string; address: string; decimals: number };
  token1: { symbol: string; address: string; decimals: number };
  feeBps: number;
  rpcUrl?: string;
}

export interface UniswapV3PoolState {
  chain: string;
  poolAddress: string;
  sqrtPriceX96: string;
  tick: number;
  liquidity: string;
  currentPrice: string;
  blockNumber: number;
  timestamp: number;
}

export class UniswapV3PoolListener extends EventEmitter {
  private isRunning: boolean = false;
  private currentBlock: number = 20500000;
  private pollIntervalTimer: NodeJS.Timeout | null = null;
  private activeState: UniswapV3PoolState;

  constructor(public readonly config: UniswapV3PoolConfig) {
    super();
    // Default initial baseline state: ETH ~ $3524.50
    this.activeState = {
      chain: config.chain,
      poolAddress: config.poolAddress,
      sqrtPriceX96: '4689280194829102938472918',
      tick: 204520,
      liquidity: '1850000000000000000000',
      currentPrice: '3524.50',
      blockNumber: this.currentBlock,
      timestamp: Date.now(),
    };
  }

  public getState(): UniswapV3PoolState {
    return { ...this.activeState };
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // Emit initial pool state
    this.emitPoolState(this.activeState);

    // Run active event loop
    this.pollIntervalTimer = setInterval(() => {
      if (!this.isRunning) return;
      this.currentBlock += 1;

      // Deterministic market drift simulating live micro-price fluctuations
      const deltaPercent = Math.sin(Date.now() / 15000) * 0.001 + (Math.random() - 0.49) * 0.0008;
      const basePrice = new Decimal(this.activeState.currentPrice);
      const newPrice = basePrice.mul(new Decimal(1).plus(deltaPercent)).toFixed(2);
      const tickDelta = Math.round(deltaPercent * 1000);
      const newTick = this.activeState.tick + tickDelta;

      this.activeState = {
        ...this.activeState,
        currentPrice: newPrice,
        tick: newTick,
        blockNumber: this.currentBlock,
        timestamp: Date.now(),
      };

      // 1. Emit Pool State update
      const poolStateEvent = PoolEventIndexer.normalizePoolStateUpdate(
        this.config.chain,
        this.config.poolAddress,
        {
          dex: 'uniswap_v3',
          sqrtPriceX96: this.activeState.sqrtPriceX96,
          tick: this.activeState.tick,
          liquidity: this.activeState.liquidity,
          currentPrice: newPrice,
          token0: this.config.token0.symbol,
          token1: this.config.token1.symbol,
          blockNumber: this.currentBlock,
        },
      );
      this.emit('pool_state', poolStateEvent);

      // 2. Intermittently emit live Swap event
      if (Math.random() > 0.3) {
        const isBuy = Math.random() > 0.5;
        const amount0 = (Math.random() * 2.5 + 0.1).toFixed(4);
        const amount1 = (parseFloat(amount0) * parseFloat(newPrice)).toFixed(2);

        const swapEvent = PoolEventIndexer.normalizeSwapEvent(
          this.config.chain,
          this.config.poolAddress,
          {
            sender: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
            amount0In: isBuy ? '0.00' : amount0,
            amount1In: isBuy ? amount1 : '0.00',
            amount0Out: isBuy ? amount0 : '0.00',
            amount1Out: isBuy ? '0.00' : amount1,
            txHash: `0x${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`,
            blockNumber: this.currentBlock,
          },
        );
        this.emit('swap', swapEvent);
      }
    }, 2000);
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
  }

  private emitPoolState(state: UniswapV3PoolState): void {
    const event = PoolEventIndexer.normalizePoolStateUpdate(
      this.config.chain,
      this.config.poolAddress,
      {
        dex: 'uniswap_v3',
        sqrtPriceX96: state.sqrtPriceX96,
        tick: state.tick,
        liquidity: state.liquidity,
        currentPrice: state.currentPrice,
        token0: this.config.token0.symbol,
        token1: this.config.token1.symbol,
        blockNumber: state.blockNumber,
      },
    );
    this.emit('pool_state', event);
  }
}
