import { BlockchainIndexer, NormalizedBlockchainEvent } from '../interfaces/indexer.interface';

export class SolanaEventIndexer implements BlockchainIndexer {
  readonly indexerName = 'SolanaEventIndexer (Geyser / Substreams Compatible)';
  readonly supportedChains = ['solana'];
  private isRunning: boolean = false;
  private handlers: Set<(event: NormalizedBlockchainEvent) => void | Promise<void>> = new Set();
  private currentSlot: number = 280000000;

  async start(startSlot?: number): Promise<void> {
    this.currentSlot = startSlot ?? this.currentSlot;
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  onEvent(handler: (event: NormalizedBlockchainEvent) => void | Promise<void>): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async getLatestBlock(_chain: string): Promise<number> {
    return this.currentSlot;
  }
}

export class PoolEventIndexer {
  static normalizeSwapEvent(
    chain: string,
    poolAddress: string,
    data: {
      sender: string;
      amount0In: string;
      amount1In: string;
      amount0Out: string;
      amount1Out: string;
      txHash: string;
      blockNumber: number;
    },
  ): NormalizedBlockchainEvent {
    return {
      id: `${chain}-swap-${data.txHash}-${poolAddress.slice(0, 8)}`,
      chain,
      blockNumber: data.blockNumber,
      txHash: data.txHash,
      contractAddress: poolAddress,
      eventType: 'SWAP',
      timestamp: Date.now(),
      data,
    };
  }

  static normalizePoolStateUpdate(
    chain: string,
    poolAddress: string,
    data: {
      dex: string;
      sqrtPriceX96: string;
      tick: number;
      liquidity: string;
      currentPrice: string;
      token0: string;
      token1: string;
      blockNumber: number;
      txHash?: string;
    },
  ): NormalizedBlockchainEvent {
    const txHash = data.txHash || `0xstate${Date.now().toString(16)}`;
    return {
      id: `${chain}-poolstate-${poolAddress.slice(0, 8)}-${data.blockNumber}`,
      chain,
      blockNumber: data.blockNumber,
      txHash,
      contractAddress: poolAddress,
      eventType: 'POOL_STATE',
      timestamp: Date.now(),
      data,
    };
  }

  static normalizeRaydiumPoolState(
    poolAddress: string,
    data: {
      dex: string;
      slot: number;
      baseVaultReserve: string;
      quoteVaultReserve: string;
      currentPrice: string;
      tokenBase: string;
      tokenQuote: string;
      txHash?: string;
    },
  ): NormalizedBlockchainEvent {
    const txHash = data.txHash || `solstate${Date.now().toString(16)}`;
    return {
      id: `solana-raydium-pool-${poolAddress.slice(0, 8)}-${data.slot}`,
      chain: 'solana',
      blockNumber: data.slot,
      txHash,
      contractAddress: poolAddress,
      eventType: 'POOL_STATE',
      timestamp: Date.now(),
      data,
    };
  }
}

export class TokenTransferIndexer {
  static normalizeTransfer(
    chain: string,
    tokenAddress: string,
    data: {
      from: string;
      to: string;
      amount: string;
      txHash: string;
      blockNumber: number;
    },
  ): NormalizedBlockchainEvent {
    return {
      id: `${chain}-xfer-${data.txHash}-${tokenAddress.slice(0, 8)}`,
      chain,
      blockNumber: data.blockNumber,
      txHash: data.txHash,
      contractAddress: tokenAddress,
      eventType: 'TRANSFER',
      timestamp: Date.now(),
      data,
    };
  }
}

export class LiquidationIndexer {
  static normalizeLiquidation(
    chain: string,
    protocolAddress: string,
    data: {
      borrower: string;
      liquidator: string;
      collateralAsset: string;
      debtAsset: string;
      liquidatedCollateralAmount: string;
      repaidDebtAmount: string;
      txHash: string;
      blockNumber: number;
    },
  ): NormalizedBlockchainEvent {
    return {
      id: `${chain}-liq-${data.txHash}-${protocolAddress.slice(0, 8)}`,
      chain,
      blockNumber: data.blockNumber,
      txHash: data.txHash,
      contractAddress: protocolAddress,
      eventType: 'LIQUIDATION',
      timestamp: Date.now(),
      data,
    };
  }
}
