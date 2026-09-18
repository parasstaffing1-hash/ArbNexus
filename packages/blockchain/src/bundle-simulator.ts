import Decimal from 'decimal.js';
import { SimulatedTransaction, BundleSimulationResult, SimulationResult } from './types';
import { TransactionSimulator } from './transaction-simulator';

export class BundleSimulator {
  /**
   * Simulates an atomic Flashbots-style bundle of transactions sequentially against state.
   */
  static simulateBundle(
    transactions: SimulatedTransaction[],
    blockNumber: number = 20500000,
    builderPaymentEth: Decimal = new Decimal('0.005'),
  ): BundleSimulationResult {
    const results: SimulationResult[] = [];
    let allSuccess = true;
    let totalGas = 0;
    let totalCostUsd = new Decimal(0);

    for (const tx of transactions) {
      const res = TransactionSimulator.simulateCall(tx);
      results.push(res);
      totalGas += res.gasUsed;
      totalCostUsd = totalCostUsd.plus(new Decimal(res.gasCostUsd));

      if (!res.success) {
        allSuccess = false;
        break;
      }
    }

    const builderRewardUsd = builderPaymentEth.mul(3500);

    return {
      bundleHash: `0x${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`,
      blockNumber,
      allSuccess,
      totalGasUsed: totalGas,
      totalGasCostUsd: totalCostUsd.toFixed(2),
      builderRewardUsd: builderRewardUsd.toFixed(2),
      simulatedTransactions: results,
    };
  }
}
