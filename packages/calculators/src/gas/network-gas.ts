import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';

/** 1. Ethereum Gas Calculator (EIP-1559) */
export function calculateEthereumGas(
  gasLimitUnits: DecimalValue,
  baseFeeGwei: DecimalValue,
  priorityFeeGwei: DecimalValue,
  ethPriceUsd: DecimalValue,
): CalculationResult {
  const units = toDecimal(gasLimitUnits);
  const base = toDecimal(baseFeeGwei);
  const priority = toDecimal(priorityFeeGwei);
  const ethPrice = toDecimal(ethPriceUsd);

  const totalGweiPerGas = base.plus(priority);
  // Total ETH = units * totalGwei * 1e-9
  const totalEth = units.times(totalGweiPerGas).times('1e-9');
  const totalUsd = totalEth.times(ethPrice);

  return {
    inputs: { gasLimitUnits, baseFeeGwei, priorityFeeGwei, ethPriceUsd },
    outputs: {
      totalGasCostUsd: totalUsd.toNumber(),
      totalCostEth: totalEth.toNumber(),
      effectiveGwei: totalGweiPerGas.toNumber(),
      baseFeeCostUsd: units.times(base).times('1e-9').times(ethPrice).toNumber(),
      priorityFeeCostUsd: units.times(priority).times('1e-9').times(ethPrice).toNumber(),
    },
    formula: 'Cost_USD = GasUnits * (BaseFee + PriorityFee) * 1e-9 * ETH_USD',
    assumptions: ['EIP-1559 dynamic fee mechanism'],
    warnings: [],
    breakdown: { baseCostUsd: units.times(base).times('1e-9').times(ethPrice).toNumber() },
    executedAt: Date.now(),
  };
}

/** 2. L2 Gas Calculator (Arbitrum / Base / Optimism Rollup) */
export function calculateL2Gas(
  l2ExecutionGasUnits: DecimalValue,
  l2GasPriceGwei: DecimalValue,
  l1CalldataBytes: number,
  l1BaseFeeGwei: DecimalValue,
  ethPriceUsd: DecimalValue,
): CalculationResult {
  const l2Units = toDecimal(l2ExecutionGasUnits);
  const l2Price = toDecimal(l2GasPriceGwei);
  const l1Bytes = new Decimal(l1CalldataBytes);
  const l1Base = toDecimal(l1BaseFeeGwei);
  const ethPrice = toDecimal(ethPriceUsd);

  // L2 execution cost = l2Units * l2Price * 1e-9 * ethPrice
  const l2CostUsd = l2Units.times(l2Price).times('1e-9').times(ethPrice);

  // L1 data publication fee ~ 16 gas units per non-zero byte * L1 Base Fee
  const l1DataGasUnits = l1Bytes.times(16);
  const l1CostUsd = l1DataGasUnits.times(l1Base).times('1e-9').times(ethPrice);

  const totalCostUsd = l2CostUsd.plus(l1CostUsd);

  return {
    inputs: { l2ExecutionGasUnits, l2GasPriceGwei, l1CalldataBytes, l1BaseFeeGwei, ethPriceUsd },
    outputs: {
      totalL2CostUsd: totalCostUsd.toNumber(),
      l2ExecutionCostUsd: l2CostUsd.toNumber(),
      l1RollupDataCostUsd: l1CostUsd.toNumber(),
      l1CostSharePercent: totalCostUsd.isZero()
        ? 0
        : l1CostUsd.dividedBy(totalCostUsd).times(100).toNumber(),
    },
    formula: 'Cost = (L2_Gas * L2_Price) + (L1_Bytes * 16 * L1_BaseFee) in USD',
    assumptions: ['Standard optimistic/ZK rollup L1 batch posting cost model'],
    warnings: [],
    breakdown: { l2ExecutionUsd: l2CostUsd.toNumber(), l1DataUsd: l1CostUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. Transaction Cost Calculator */
export function calculateTransactionCost(
  gasCostUsd: DecimalValue,
  relayerFeeUsd: DecimalValue = '0',
  protocolFeeUsd: DecimalValue = '0',
): CalculationResult {
  const gas = toDecimal(gasCostUsd);
  const relayer = toDecimal(relayerFeeUsd);
  const protocol = toDecimal(protocolFeeUsd);

  const totalCostUsd = gas.plus(relayer).plus(protocol);

  return {
    inputs: { gasCostUsd, relayerFeeUsd, protocolFeeUsd },
    outputs: {
      totalTransactionCostUsd: totalCostUsd.toNumber(),
      gasCostUsd: gas.toNumber(),
      serviceFeesUsd: relayer.plus(protocol).toNumber(),
    },
    formula: 'Total = GasCost + RelayerFee + ProtocolFee',
    assumptions: ['Comprehensive end-to-end on-chain dispatch cost'],
    warnings: [],
    breakdown: { gasUsd: gas.toNumber(), serviceUsd: relayer.plus(protocol).toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. Gas Break-Even Calculator */
export function calculateGasBreakEven(
  gasCostUsd: DecimalValue,
  grossSpreadPercent: DecimalValue,
  exchangeTradingFeePercent: DecimalValue = '0.1',
): CalculationResult {
  const gas = toDecimal(gasCostUsd);
  const spread = toDecimal(grossSpreadPercent).dividedBy(100);
  const fee = toDecimal(exchangeTradingFeePercent).dividedBy(100);

  const netSpreadRate = spread.minus(fee);
  const minTradeSizeToCoverGas = netSpreadRate.lessThanOrEqualTo(0)
    ? new Decimal(0)
    : gas.dividedBy(netSpreadRate);

  return {
    inputs: { gasCostUsd, grossSpreadPercent, exchangeTradingFeePercent },
    outputs: {
      minTradeCapitalToCoverGasUsd: minTradeSizeToCoverGas.toNumber(),
      isViable: netSpreadRate.greaterThan(0),
    },
    formula: 'Min_Size = Gas_Cost / (Gross_Spread_Rate - Trading_Fee_Rate)',
    assumptions: ['Trade size necessary for profit margin to strictly amortize on-chain gas'],
    warnings: netSpreadRate.lessThanOrEqualTo(0)
      ? ['Gross spread does not exceed exchange trading fees.']
      : [],
    breakdown: { netSpreadRate: netSpreadRate.toNumber() },
    executedAt: Date.now(),
  };
}

/** 5. Gas vs Arbitrage Profit Calculator */
export function calculateGasVsArbProfit(
  grossProfitUsd: DecimalValue,
  gasCostUsd: DecimalValue,
): CalculationResult {
  const gross = toDecimal(grossProfitUsd);
  const gas = toDecimal(gasCostUsd);

  const netProfit = gross.minus(gas);
  const gasEfficiencyRatio = gross.isZero() ? new Decimal(0) : gas.dividedBy(gross).times(100);

  return {
    inputs: { grossProfitUsd, gasCostUsd },
    outputs: {
      netProfitAfterGasUsd: netProfit.toNumber(),
      gasToProfitRatioPercent: gasEfficiencyRatio.toNumber(),
      isProfitable: netProfit.greaterThan(0),
    },
    formula: 'Net = Gross Profit - Gas Cost; Gas% = (Gas / Gross) * 100',
    assumptions: ['Single on-chain execution cycle'],
    warnings: gasEfficiencyRatio.greaterThan(50)
      ? ['Gas consumes over 50% of gross arbitrage profits.']
      : [],
    breakdown: { netProfitUsd: netProfit.toNumber(), gasRatio: gasEfficiencyRatio.toNumber() },
    executedAt: Date.now(),
  };
}

/** 6. Network Cost Comparison Calculator */
export function calculateNetworkCostComparison(
  networks: {
    network: string;
    swapGasUnits: DecimalValue;
    gwei: DecimalValue;
    nativePriceUsd: DecimalValue;
  }[],
): CalculationResult {
  const results = networks.map((net) => {
    const units = toDecimal(net.swapGasUnits);
    const gwei = toDecimal(net.gwei);
    const price = toDecimal(net.nativePriceUsd);
    const costUsd = units.times(gwei).times('1e-9').times(price);

    return {
      network: net.network,
      costUsd: costUsd.toNumber(),
      gwei: gwei.toNumber(),
    };
  });

  results.sort((a, b) => a.costUsd - b.costUsd);

  return {
    inputs: { networksCount: networks.length },
    outputs: {
      cheapestNetwork: results[0]?.network || null,
      cheapestCostUsd: results[0]?.costUsd || 0,
      mostExpensiveNetwork: results[results.length - 1]?.network || null,
      mostExpensiveCostUsd: results[results.length - 1]?.costUsd || 0,
      comparison: results,
    },
    formula: 'Cost_i = GasUnits_i * Gwei_i * 1e-9 * Price_i',
    assumptions: ['Typical standard DEX token swap gas consumption'],
    warnings: [],
    breakdown: { comparison: results },
    executedAt: Date.now(),
  };
}
