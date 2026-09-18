import { BlockchainIndexer, NormalizedBlockchainEvent } from '../interfaces/indexer.interface';

export class EVMEventIndexer implements BlockchainIndexer {
  readonly indexerName = 'EVMEventIndexer (Ponder / Subsquid Compatible)';
  readonly supportedChains = ['ethereum', 'arbitrum', 'base', 'polygon'];
  private isRunning: boolean = false;
  private handlers: Set<(event: NormalizedBlockchainEvent) => void | Promise<void>> = new Set();
  private currentBlock: number = 20500000;

  async start(startBlock?: number): Promise<void> {
    this.currentBlock = startBlock ?? this.currentBlock;
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
    return this.currentBlock;
  }

  async dispatchSimulatedEvent(event: NormalizedBlockchainEvent): Promise<void> {
    for (const h of this.handlers) {
      await h(event);
    }
  }
}
