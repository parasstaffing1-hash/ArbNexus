import Decimal from 'decimal.js';
import { MEVOpportunity } from './types';

export class MEVOpportunityAnalyzer {
  /**
   * Analyzes an on-chain MEV opportunity (e.g. AMM discrepancy, liquidation, atomic arb)
   * in simulation mode strictly.
   */
  static analyzeMevOpportunity(
    type: MEVOpportunity['type'],
    chain: string,
    targetPool: string,
    grossProfitUsd: Decimal,
    gasUnitsNeeded: number = 180000,
    gasPriceGwei: Decimal = new Decimal(20),
    flashLoanBorrowUsd: Decimal = new Decimal(50000),
  ): MEVOpportunity {
    // Flash loan fee (e.g. Aave v3 = 0.05% = 0.0005)
    const flashLoanFeeUsd = flashLoanBorrowUsd.mul('0.0005');

    // Gas in USD (assuming ETH = $3500)
    const gasEth = new Decimal(gasUnitsNeeded).mul(gasPriceGwei).div(1e9);
    const gasCostUsd = gasEth.mul(3500);

    const totalCostUsd = gasCostUsd.plus(flashLoanFeeUsd);
    const netMevProfitUsd = grossProfitUsd.minus(totalCostUsd);

    return {
      type,
      chain,
      targetPool,
      estimatedProfitUsd: grossProfitUsd,
      requiredGasUsd: gasCostUsd,
      flashLoanFeeUsd,
      netMevProfitUsd,
      isSimulatedProfitable: netMevProfitUsd.gt(0),
    };
  }
}
