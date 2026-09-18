import Decimal from 'decimal.js';

export class GasEstimator {
  /**
   * Estimates EIP-1559 transaction cost in USD:
   * GasCost = GasUnits * (BaseFee + PriorityFee) * ETH_Price
   */
  static estimateEIP1559CostUsd(
    gasUnits: number,
    baseFeeGwei: Decimal,
    priorityFeeGwei: Decimal,
    ethPriceUsd: Decimal = new Decimal(3500),
  ): Decimal {
    const totalGwei = baseFeeGwei.plus(priorityFeeGwei);
    const costEth = new Decimal(gasUnits).mul(totalGwei).div(1e9);
    return costEth.mul(ethPriceUsd);
  }

  /**
   * Estimates L2 Rollup transaction cost (L2 execution gas + L1 blob/calldata compression overhead):
   */
  static estimateL2RollupCostUsd(
    l2GasUnits: number,
    l2GasPriceGwei: Decimal,
    calldataBytes: number,
    l1BaseFeeGwei: Decimal,
    ethPriceUsd: Decimal = new Decimal(3500),
  ): Decimal {
    const l2CostEth = new Decimal(l2GasUnits).mul(l2GasPriceGwei).div(1e9);
    // Typical OP/Arbitrum calldata scalar
    const l1CalldataGas = new Decimal(calldataBytes).mul(16);
    const l1CostEth = l1CalldataGas.mul(l1BaseFeeGwei).div(1e9).mul('0.6'); // compression savings

    return l2CostEth.plus(l1CostEth).mul(ethPriceUsd);
  }

  /**
   * Estimates Solana compute unit cost in USD.
   */
  static estimateSolanaCostUsd(
    computeUnits: number = 200000,
    microLamportsPerCu: number = 1000,
    solPriceUsd: Decimal = new Decimal(188),
  ): Decimal {
    const baseFeeLamports = 5000;
    const priorityLamports = (computeUnits * microLamportsPerCu) / 1000000;
    const totalSol = new Decimal(baseFeeLamports + priorityLamports).div(1e9);
    return totalSol.mul(solPriceUsd);
  }
}
