export interface NormalizedBlockchainEvent {
  id: string;
  chain: string; // 'ethereum', 'arbitrum', 'base', 'solana'
  blockNumber: number;
  txHash: string;
  contractAddress: string;
  eventType: 'SWAP' | 'MINT' | 'BURN' | 'TRANSFER' | 'LIQUIDATION' | 'POOL_STATE';
  timestamp: number;
  data: Record<string, any>;
}

export interface BlockchainIndexer {
  readonly indexerName: string;
  readonly supportedChains: string[];
  start(startBlock?: number): Promise<void>;
  stop(): Promise<void>;
  onEvent(handler: (event: NormalizedBlockchainEvent) => void | Promise<void>): () => void;
  getLatestBlock(chain: string): Promise<number>;
}
