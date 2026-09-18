import Decimal from 'decimal.js';
import { SimulatedTransaction, SimulationResult } from './types';
import { GasEstimator } from './gas-estimator';

export class TransactionSimulator {
  /**
   * Simulates an EVM call or contract execution locally without sending a transaction to the network.
   */
  static simulateCall(tx: SimulatedTransaction): SimulationResult {
    // Deterministic simulation based on calldata payload
    const isFlashLoan = tx.data.includes('flashLoan') || tx.data.includes('0xab');
    const isReverting = tx.data.includes('revert') || tx.gasLimit < 21000;

    if (isReverting) {
      return {
        success: false,
        gasUsed: tx.gasLimit,
        effectiveGasPriceGwei: tx.maxFeePerGasGwei || '15.0',
        gasCostUsd: '1.20',
        revertReason: 'Execution reverted: INSUFFICIENT_OUTPUT_AMOUNT',
        logs: [],
      };
    }

    const gasUsed = isFlashLoan ? 185000 : 92000;
    const gasPrice = new Decimal(tx.maxFeePerGasGwei || '15.0');
    const gasCost = GasEstimator.estimateEIP1559CostUsd(gasUsed, gasPrice, new Decimal('1.5'));

    return {
      success: true,
      gasUsed,
      effectiveGasPriceGwei: gasPrice.toString(),
      gasCostUsd: gasCost.toFixed(2),
      returnValHex: '0x0000000000000000000000000000000000000000000000000000000000000001',
      logs: [
        {
          address: tx.to,
          topics: ['0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'], // Swap topic
          data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        },
      ],
    };
  }
}
