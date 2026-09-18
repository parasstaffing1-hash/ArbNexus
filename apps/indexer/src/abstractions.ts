import { EventEmitter } from 'events';

export interface NormalizedBlockEvent {
  chain: string;
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  baseFeePerGas?: string;
}

export interface NormalizedSwapEvent {
  chain: string;
  dex: string;
  poolAddress: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  sender: string;
  recipient: string;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  timestamp: number;
}

export interface NormalizedLiquidationEvent {
  chain: string;
  protocol: string; // e.g. 'aave_v3' | 'compound_v3'
  liquidator: string;
  borrower: string;
  collateralAsset: string;
  debtAsset: string;
  debtToCover: string;
  liquidatedCollateralAmount: string;
  bonusPercent: number;
  txHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface BlockchainIndexer {
  readonly chain: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  isHealthy(): boolean;
  on(event: 'block', listener: (block: NormalizedBlockEvent) => void): this;
  on(event: 'swap', listener: (swap: NormalizedSwapEvent) => void): this;
  on(event: 'liquidation', listener: (liq: NormalizedLiquidationEvent) => void): this;
}

export class EVMIndexer extends EventEmitter implements BlockchainIndexer {
  public readonly chain: string;
  private isRunning: boolean = false;

  constructor(chain: string = 'ethereum') {
    super();
    this.chain = chain;
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    this.emit('started', { chain: this.chain, timestamp: Date.now() });
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    this.emit('stopped', { chain: this.chain, timestamp: Date.now() });
  }

  public isHealthy(): boolean {
    return this.isRunning;
  }
}

export class SolanaIndexer extends EventEmitter implements BlockchainIndexer {
  public readonly chain: string = 'solana';
  private isRunning: boolean = false;

  public async start(): Promise<void> {
    this.isRunning = true;
    this.emit('started', { chain: this.chain, timestamp: Date.now() });
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    this.emit('stopped', { chain: this.chain, timestamp: Date.now() });
  }

  public isHealthy(): boolean {
    return this.isRunning;
  }
}

export class PoolEventIndexer {
  constructor(private indexer: BlockchainIndexer) {}

  public subscribePoolSwaps(
    poolAddress: string,
    handler: (swap: NormalizedSwapEvent) => void,
  ): void {
    this.indexer.on('swap', (swap) => {
      if (swap.poolAddress.toLowerCase() === poolAddress.toLowerCase()) {
        handler(swap);
      }
    });
  }
}

export class LiquidationIndexer {
  constructor(private indexer: BlockchainIndexer) {}

  public subscribeLiquidations(
    protocol: string,
    handler: (liq: NormalizedLiquidationEvent) => void,
  ): void {
    this.indexer.on('liquidation', (liq) => {
      if (liq.protocol.toLowerCase() === protocol.toLowerCase()) {
        handler(liq);
      }
    });
  }
}
