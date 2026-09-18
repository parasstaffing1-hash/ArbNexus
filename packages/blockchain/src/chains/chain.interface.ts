import Decimal from 'decimal.js';

export type GasModelType = 'EIP1559' | 'LEGACY' | 'L2_ROLLUP' | 'SOLANA_COMPUTE_UNIT';
export type ChainStatus = 'ACTIVE' | 'DEGRADED' | 'HALTED' | 'MAINTENANCE';

export interface ChainConfig {
  chain_id: number;
  chain_name: string;
  native_asset: string;
  rpc_provider: string;
  block_time_ms: number;
  gas_model: GasModelType;
  status: ChainStatus;
  explorer_url?: string;
  is_l2?: boolean;
  l1_parent_chain_id?: number;
}

export interface BlockInfo {
  chain_id: number;
  block_number: number;
  block_hash: string;
  timestamp: number;
  base_fee_gwei?: string;
  parent_hash?: string;
}

export interface GasEstimate {
  chain_id: number;
  base_fee_gwei: string;
  priority_fee_gwei: string;
  l2_execution_fee_gwei?: string;
  l1_calldata_fee_gwei?: string;
  gas_price_gwei: string;
  native_token_price_usd: string;
  standard_tx_cost_usd: string;
  swap_tx_cost_usd: string;
  timestamp: number;
  data_quality: 'HIGH' | 'ESTIMATED' | 'STALE';
}

export interface RPCProvider {
  readonly endpointUrl: string;
  readonly chainId: number;
  call(method: string, params: unknown[]): Promise<unknown>;
  getHealth(): Promise<{ isHealthy: boolean; latencyMs: number }>;
}

export interface BlockProvider {
  getLatestBlock(): Promise<BlockInfo>;
  getBlockByNumber(blockNumber: number): Promise<BlockInfo | null>;
}

export interface GasProvider {
  getGasPrice(): Promise<GasEstimate>;
  estimateCostUsd(gasUnits: number, txType?: 'transfer' | 'swap' | 'bridge'): Promise<Decimal>;
}

export interface ChainAdapter {
  readonly config: ChainConfig;
  readonly rpcProvider: RPCProvider;
  readonly blockProvider: BlockProvider;
  readonly gasProvider: GasProvider;

  initialize(): Promise<void>;
  getStatus(): Promise<ChainStatus>;
  getLatestBlockNumber(): Promise<number>;
  estimateGasCostUsd(gasUnits: number, txType?: 'transfer' | 'swap' | 'bridge'): Promise<Decimal>;
}
