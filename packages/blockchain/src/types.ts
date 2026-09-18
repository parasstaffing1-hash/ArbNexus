import Decimal from 'decimal.js';

export interface SimulatedTransaction {
  to: string;
  from: string;
  data: string;
  valueWei: string;
  gasLimit: number;
  maxFeePerGasGwei?: string;
  maxPriorityFeePerGasGwei?: string;
}

export interface SimulationResult {
  success: boolean;
  gasUsed: number;
  effectiveGasPriceGwei: string;
  gasCostUsd: string;
  revertReason?: string;
  returnValHex?: string;
  logs: { address: string; topics: string[]; data: string }[];
  stateDiffs?: Record<string, { before: string; after: string }>;
}

export interface BundleSimulationResult {
  bundleHash: string;
  blockNumber: number;
  allSuccess: boolean;
  totalGasUsed: number;
  totalGasCostUsd: string;
  builderRewardUsd: string;
  simulatedTransactions: SimulationResult[];
}

export interface MEVOpportunity {
  type: 'ATOMIC_ARB' | 'LIQUIDATION' | 'BACKRUN' | 'FLASH_LOAN';
  chain: string;
  targetPool: string;
  estimatedProfitUsd: Decimal;
  requiredGasUsd: Decimal;
  flashLoanFeeUsd: Decimal;
  netMevProfitUsd: Decimal;
  isSimulatedProfitable: boolean;
}
