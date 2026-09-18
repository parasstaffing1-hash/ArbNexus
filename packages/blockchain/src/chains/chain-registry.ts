import { ChainAdapter, ChainConfig } from './chain.interface';
import { EVMChainAdapter } from './evm-chain.adapter';
import { SolanaChainAdapter } from './solana-chain.adapter';

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    chain_id: 1,
    chain_name: 'Ethereum',
    native_asset: 'ETH',
    rpc_provider: process.env.ETH_RPC_URL || 'https://cloudflare-eth.com',
    block_time_ms: 12000,
    gas_model: 'EIP1559',
    status: 'ACTIVE',
    explorer_url: 'https://etherscan.io',
    is_l2: false,
  },
  {
    chain_id: 8453,
    chain_name: 'Base',
    native_asset: 'ETH',
    rpc_provider: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    block_time_ms: 2000,
    gas_model: 'L2_ROLLUP',
    status: 'ACTIVE',
    explorer_url: 'https://basescan.org',
    is_l2: true,
    l1_parent_chain_id: 1,
  },
  {
    chain_id: 42161,
    chain_name: 'Arbitrum',
    native_asset: 'ETH',
    rpc_provider: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    block_time_ms: 250,
    gas_model: 'L2_ROLLUP',
    status: 'ACTIVE',
    explorer_url: 'https://arbiscan.io',
    is_l2: true,
    l1_parent_chain_id: 1,
  },
  {
    chain_id: 10,
    chain_name: 'Optimism',
    native_asset: 'ETH',
    rpc_provider: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    block_time_ms: 2000,
    gas_model: 'L2_ROLLUP',
    status: 'ACTIVE',
    explorer_url: 'https://optimistic.etherscan.io',
    is_l2: true,
    l1_parent_chain_id: 1,
  },
  {
    chain_id: 137,
    chain_name: 'Polygon',
    native_asset: 'POL',
    rpc_provider: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    block_time_ms: 2000,
    gas_model: 'EIP1559',
    status: 'ACTIVE',
    explorer_url: 'https://polygonscan.com',
    is_l2: false,
  },
  {
    chain_id: 101,
    chain_name: 'Solana',
    native_asset: 'SOL',
    rpc_provider: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    block_time_ms: 400,
    gas_model: 'SOLANA_COMPUTE_UNIT',
    status: 'ACTIVE',
    explorer_url: 'https://solscan.io',
    is_l2: false,
  },
];

export class ChainRegistry {
  private static instance: ChainRegistry;
  private adapters: Map<string | number, ChainAdapter> = new Map();

  private constructor() {
    this.initializeDefaultAdapters();
  }

  public static getInstance(): ChainRegistry {
    if (!ChainRegistry.instance) {
      ChainRegistry.instance = new ChainRegistry();
    }
    return ChainRegistry.instance;
  }

  private initializeDefaultAdapters() {
    for (const config of SUPPORTED_CHAINS) {
      let adapter: ChainAdapter;
      if (config.chain_id === 101 || config.chain_name.toLowerCase() === 'solana') {
        adapter = new SolanaChainAdapter(config);
      } else {
        adapter = new EVMChainAdapter(config);
      }

      this.adapters.set(config.chain_id, adapter);
      this.adapters.set(config.chain_name.toLowerCase(), adapter);
    }
  }

  public getAdapter(identifier: string | number): ChainAdapter | undefined {
    if (typeof identifier === 'string') {
      return this.adapters.get(identifier.toLowerCase());
    }
    return this.adapters.get(identifier);
  }

  public getAllChains(): ChainConfig[] {
    return [...SUPPORTED_CHAINS];
  }

  public getSupportedChainNames(): string[] {
    return SUPPORTED_CHAINS.map((c) => c.chain_name);
  }
}
