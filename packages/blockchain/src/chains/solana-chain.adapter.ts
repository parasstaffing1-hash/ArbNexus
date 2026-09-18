import Decimal from 'decimal.js';
import {
  BlockInfo,
  BlockProvider,
  ChainAdapter,
  ChainConfig,
  ChainStatus,
  GasEstimate,
  GasProvider,
  RPCProvider,
} from './chain.interface';
import { GasEstimator } from '../gas-estimator';

export class SolanaChainRPCProvider implements RPCProvider {
  constructor(
    public readonly endpointUrl: string,
    public readonly chainId: number = 101,
  ) {}

  async call(method: string, _params: unknown[]): Promise<unknown> {
    if (method === 'getSlot') {
      return 280010050;
    }
    return null;
  }

  async getHealth(): Promise<{ isHealthy: boolean; latencyMs: number }> {
    return { isHealthy: true, latencyMs: 32 };
  }
}

export class SolanaBlockProvider implements BlockProvider {
  constructor(
    private readonly chainId: number,
    private readonly rpc: RPCProvider,
  ) {}

  async getLatestBlock(): Promise<BlockInfo> {
    return {
      chain_id: this.chainId,
      block_number: 280010050, // slot number
      block_hash: '5EYkt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
      timestamp: Date.now(),
    };
  }

  async getBlockByNumber(blockNumber: number): Promise<BlockInfo | null> {
    return {
      chain_id: this.chainId,
      block_number: blockNumber,
      block_hash: `solana_slot_hash_${blockNumber}`,
      timestamp: Date.now() - 400, // ~400ms slot time
    };
  }
}

export class SolanaGasProvider implements GasProvider {
  constructor(
    private readonly chainConfig: ChainConfig,
    private solPriceUsd: Decimal = new Decimal(188),
  ) {}

  setSolPrice(priceUsd: Decimal) {
    this.solPriceUsd = priceUsd;
  }

  async getGasPrice(): Promise<GasEstimate> {
    const standardCost = await this.estimateCostUsd(200000, 'swap');
    const transferCost = await this.estimateCostUsd(50000, 'transfer');

    return {
      chain_id: this.chainConfig.chain_id,
      base_fee_gwei: '0.005', // 5000 lamports base fee in gwei equivalent
      priority_fee_gwei: '0.001',
      gas_price_gwei: '0.006',
      native_token_price_usd: this.solPriceUsd.toString(),
      standard_tx_cost_usd: transferCost.toFixed(5),
      swap_tx_cost_usd: standardCost.toFixed(5),
      timestamp: Date.now(),
      data_quality: 'HIGH',
    };
  }

  async estimateCostUsd(
    computeUnits: number = 200000,
    txType: 'transfer' | 'swap' | 'bridge' = 'swap',
  ): Promise<Decimal> {
    const microLamports = txType === 'bridge' ? 2500 : txType === 'swap' ? 1000 : 500;
    return GasEstimator.estimateSolanaCostUsd(computeUnits, microLamports, this.solPriceUsd);
  }
}

export class SolanaChainAdapter implements ChainAdapter {
  public readonly rpcProvider: RPCProvider;
  public readonly blockProvider: BlockProvider;
  public readonly gasProvider: GasProvider;

  constructor(public readonly config: ChainConfig) {
    this.rpcProvider = new SolanaChainRPCProvider(config.rpc_provider, config.chain_id);
    this.blockProvider = new SolanaBlockProvider(config.chain_id, this.rpcProvider);
    this.gasProvider = new SolanaGasProvider(config);
  }

  async initialize(): Promise<void> {
    await this.rpcProvider.getHealth();
  }

  async getStatus(): Promise<ChainStatus> {
    const health = await this.rpcProvider.getHealth();
    return health.isHealthy ? this.config.status : 'DEGRADED';
  }

  async getLatestBlockNumber(): Promise<number> {
    const block = await this.blockProvider.getLatestBlock();
    return block.block_number;
  }

  async estimateGasCostUsd(
    computeUnits: number = 200000,
    txType: 'transfer' | 'swap' | 'bridge' = 'swap',
  ): Promise<Decimal> {
    return this.gasProvider.estimateCostUsd(computeUnits, txType);
  }
}
