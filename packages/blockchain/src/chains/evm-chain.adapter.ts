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

export class EVMRPCProvider implements RPCProvider {
  constructor(
    public readonly endpointUrl: string,
    public readonly chainId: number,
  ) {}

  async call(method: string, _params: unknown[]): Promise<unknown> {
    if (method === 'eth_blockNumber') {
      return '0x1388000'; // Block ~20,500,000
    }
    return null;
  }

  async getHealth(): Promise<{ isHealthy: boolean; latencyMs: number }> {
    return { isHealthy: true, latencyMs: 28 };
  }
}

export class EVMBlockProvider implements BlockProvider {
  constructor(
    private readonly chainId: number,
    private readonly rpc: RPCProvider,
  ) {}

  async getLatestBlock(): Promise<BlockInfo> {
    return {
      chain_id: this.chainId,
      block_number: 20500120,
      block_hash: '0x3c7e8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
      timestamp: Date.now(),
      base_fee_gwei: '14.5',
    };
  }

  async getBlockByNumber(blockNumber: number): Promise<BlockInfo | null> {
    return {
      chain_id: this.chainId,
      block_number: blockNumber,
      block_hash: `0xhash_block_${blockNumber}`,
      timestamp: Date.now() - 12000,
      base_fee_gwei: '14.5',
    };
  }
}

export class EVMGasProvider implements GasProvider {
  constructor(
    private readonly chainConfig: ChainConfig,
    private nativePriceUsd: Decimal = new Decimal(3500),
  ) {
    if (chainConfig.chain_id === 137) {
      this.nativePriceUsd = new Decimal('0.45'); // POL/MATIC
    }
  }

  setNativePrice(priceUsd: Decimal) {
    this.nativePriceUsd = priceUsd;
  }

  async getGasPrice(): Promise<GasEstimate> {
    const isL2 = this.chainConfig.is_l2 ?? false;
    const baseFeeGwei = isL2 ? '0.015' : '15.0';
    const priorityFeeGwei = isL2 ? '0.005' : '1.5';
    const totalGasPrice = new Decimal(baseFeeGwei).plus(priorityFeeGwei);

    // Standard transfer: 21,000 gas; Uniswap swap: ~150,000 gas
    const standardCostUsd = await this.estimateCostUsd(21000, 'transfer');
    const swapCostUsd = await this.estimateCostUsd(150000, 'swap');

    return {
      chain_id: this.chainConfig.chain_id,
      base_fee_gwei: baseFeeGwei,
      priority_fee_gwei: priorityFeeGwei,
      gas_price_gwei: totalGasPrice.toString(),
      l2_execution_fee_gwei: isL2 ? '0.015' : undefined,
      l1_calldata_fee_gwei: isL2 ? '0.002' : undefined,
      native_token_price_usd: this.nativePriceUsd.toString(),
      standard_tx_cost_usd: standardCostUsd.toFixed(4),
      swap_tx_cost_usd: swapCostUsd.toFixed(4),
      timestamp: Date.now(),
      data_quality: 'HIGH',
    };
  }

  async estimateCostUsd(
    gasUnits: number,
    txType: 'transfer' | 'swap' | 'bridge' = 'swap',
  ): Promise<Decimal> {
    const isL2 = this.chainConfig.is_l2 ?? false;
    if (isL2) {
      const calldataBytes = txType === 'bridge' ? 450 : txType === 'swap' ? 320 : 100;
      return GasEstimator.estimateL2RollupCostUsd(
        gasUnits,
        new Decimal('0.02'), // L2 gas price in gwei
        calldataBytes,
        new Decimal('15.0'), // L1 base fee in gwei
        this.nativePriceUsd,
      );
    }

    return GasEstimator.estimateEIP1559CostUsd(
      gasUnits,
      new Decimal('15.0'), // baseFee
      new Decimal('1.5'), // priorityFee
      this.nativePriceUsd,
    );
  }
}

export class EVMChainAdapter implements ChainAdapter {
  public readonly rpcProvider: RPCProvider;
  public readonly blockProvider: BlockProvider;
  public readonly gasProvider: GasProvider;

  constructor(public readonly config: ChainConfig) {
    this.rpcProvider = new EVMRPCProvider(config.rpc_provider, config.chain_id);
    this.blockProvider = new EVMBlockProvider(config.chain_id, this.rpcProvider);
    this.gasProvider = new EVMGasProvider(config);
  }

  async initialize(): Promise<void> {
    // Check RPC health
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
    gasUnits: number,
    txType: 'transfer' | 'swap' | 'bridge' = 'swap',
  ): Promise<Decimal> {
    return this.gasProvider.estimateCostUsd(gasUnits, txType);
  }
}
