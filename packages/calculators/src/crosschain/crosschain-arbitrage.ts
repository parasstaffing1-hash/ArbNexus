import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';
import { BridgeQuote } from '../adapters/provider.interface';

/** 1. Cross-Chain Arbitrage Calculator */
export function calculateCrossChainArbitrage(
  sourcePrice: DecimalValue,
  destPrice: DecimalValue,
  tradeAmount: DecimalValue,
  sourceGasUsd: DecimalValue,
  bridgeFeeUsd: DecimalValue,
  destGasUsd: DecimalValue,
  sourceSwapFeePercent: DecimalValue = '0.05',
  destSwapFeePercent: DecimalValue = '0.05',
  estimatedBridgeDurationSeconds: DecimalValue = 120,
): CalculationResult {
  const pSrc = toDecimal(sourcePrice);
  const pDst = toDecimal(destPrice);
  const amount = toDecimal(tradeAmount);

  const initialCapitalUsd = amount.times(pSrc);
  const destGrossUsd = amount.times(pDst);

  const srcSwapFee = initialCapitalUsd.times(toDecimal(sourceSwapFeePercent).dividedBy(100));
  const dstSwapFee = destGrossUsd.times(toDecimal(destSwapFeePercent).dividedBy(100));
  const bridgeFee = toDecimal(bridgeFeeUsd);
  const totalGas = toDecimal(sourceGasUsd).plus(toDecimal(destGasUsd));

  const totalCostsUsd = srcSwapFee.plus(dstSwapFee).plus(bridgeFee).plus(totalGas);
  const grossProfitUsd = destGrossUsd.minus(initialCapitalUsd);
  const netProfitUsd = grossProfitUsd.minus(totalCostsUsd);
  const netRoiPercent = initialCapitalUsd.isZero()
    ? new Decimal(0)
    : netProfitUsd.dividedBy(initialCapitalUsd).times(100);

  return {
    inputs: { sourcePrice, destPrice, tradeAmount, sourceGasUsd, bridgeFeeUsd, destGasUsd },
    outputs: {
      grossProfitUsd: grossProfitUsd.toNumber(),
      totalCostsUsd: totalCostsUsd.toNumber(),
      netProfitUsd: netProfitUsd.toNumber(),
      netRoiPercent: netRoiPercent.toNumber(),
      isProfitable: netProfitUsd.greaterThan(0),
      durationMinutes: toDecimal(estimatedBridgeDurationSeconds).dividedBy(60).toNumber(),
    },
    formula:
      'Net = (Amount * P_dst) - (Amount * P_src) - (BridgeFee + Gas_src + Gas_dst + SwapFees)',
    assumptions: ['Price holds across the bridge transit duration'],
    warnings: toDecimal(estimatedBridgeDurationSeconds).greaterThan(600)
      ? ['Bridge transit exceeds 10 minutes; significant price divergence risk.']
      : [],
    breakdown: {
      bridgeFeeUsd: bridgeFee.toNumber(),
      totalGasUsd: totalGas.toNumber(),
      swapFeesUsd: srcSwapFee.plus(dstSwapFee).toNumber(),
    },
    executedAt: Date.now(),
  };
}

/** 2. Bridge Fee Calculator */
export function calculateBridgeFee(
  transferAmountUsd: DecimalValue,
  protocolFeePercent: DecimalValue = '0.04',
  relayerGasUsd: DecimalValue = '2.50',
): CalculationResult {
  const amount = toDecimal(transferAmountUsd);
  const pctFee = amount.times(toDecimal(protocolFeePercent).dividedBy(100));
  const relayer = toDecimal(relayerGasUsd);
  const totalFeeUsd = pctFee.plus(relayer);

  return {
    inputs: { transferAmountUsd, protocolFeePercent, relayerGasUsd },
    outputs: {
      totalBridgeFeeUsd: totalFeeUsd.toNumber(),
      variableFeeUsd: pctFee.toNumber(),
      fixedRelayerGasUsd: relayer.toNumber(),
      effectiveFeePercent: amount.isZero()
        ? 0
        : totalFeeUsd.dividedBy(amount).times(100).toNumber(),
    },
    formula: 'Bridge Fee = (Amount * ProtocolFee%) + RelayerGas',
    assumptions: ['Standard bridge relayer reimbursement tariff'],
    warnings: [],
    breakdown: { protocolFeeUsd: pctFee.toNumber(), relayerFeeUsd: relayer.toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. Bridge Route Cost Calculator */
export function calculateBridgeRouteCost(
  hopFeesUsd: DecimalValue[],
  originNetworkGasUsd: DecimalValue,
  destinationNetworkGasUsd: DecimalValue,
): CalculationResult {
  let bridgeHopsTotal = new Decimal(0);
  hopFeesUsd.forEach((f) => {
    bridgeHopsTotal = bridgeHopsTotal.plus(toDecimal(f));
  });
  const originGas = toDecimal(originNetworkGasUsd);
  const destGas = toDecimal(destinationNetworkGasUsd);
  const totalCostUsd = bridgeHopsTotal.plus(originGas).plus(destGas);

  return {
    inputs: { hopFeesCount: hopFeesUsd.length, originNetworkGasUsd, destinationNetworkGasUsd },
    outputs: {
      totalCostUsd: totalCostUsd.toNumber(),
      bridgeProtocolCostUsd: bridgeHopsTotal.toNumber(),
      totalNetworkGasUsd: originGas.plus(destGas).toNumber(),
    },
    formula: 'Total Route Cost = Sum(Hop_Fees) + Gas_Origin + Gas_Dest',
    assumptions: ['All intermediate hops settle without liquidity shortage'],
    warnings: [],
    breakdown: { bridgeFeesUsd: bridgeHopsTotal.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. Bridge Time Calculator */
export function calculateBridgeTime(
  sourceBlockConfirmations: number,
  sourceBlockTimeSeconds: number,
  relayerConsensusSeconds: number,
  destinationFinalitySeconds: number,
): CalculationResult {
  const srcTime = sourceBlockConfirmations * sourceBlockTimeSeconds;
  const totalSeconds = srcTime + relayerConsensusSeconds + destinationFinalitySeconds;

  return {
    inputs: {
      sourceBlockConfirmations,
      sourceBlockTimeSeconds,
      relayerConsensusSeconds,
      destinationFinalitySeconds,
    },
    outputs: {
      totalDurationSeconds: totalSeconds,
      totalDurationMinutes: totalSeconds / 60,
      sourceConfirmationSeconds: srcTime,
      consensusSeconds: relayerConsensusSeconds,
      destinationFinalitySeconds,
    },
    formula: 'Total Time = (Confirmations * BlockTime) + ConsensusTime + DestFinality',
    assumptions: ['Network block production continues without reorganization delays'],
    warnings:
      totalSeconds > 900 ? ['Transfer time exceeds 15 minutes; high inventory freeze.'] : [],
    breakdown: { sourceConfirmationSeconds: srcTime },
    executedAt: Date.now(),
  };
}

/** 5. Gas Cost Calculator */
export function calculateCrossChainGasCost(
  originGasUnits: DecimalValue,
  originGwei: DecimalValue,
  originNativePriceUsd: DecimalValue,
  destGasUnits: DecimalValue,
  destGwei: DecimalValue,
  destNativePriceUsd: DecimalValue,
): CalculationResult {
  // GasCostUSD = Units * Gwei * 1e-9 * Price
  const originCost = toDecimal(originGasUnits)
    .times(toDecimal(originGwei))
    .times('1e-9')
    .times(toDecimal(originNativePriceUsd));

  const destCost = toDecimal(destGasUnits)
    .times(toDecimal(destGwei))
    .times('1e-9')
    .times(toDecimal(destNativePriceUsd));

  const totalGasUsd = originCost.plus(destCost);

  return {
    inputs: {
      originGasUnits,
      originGwei,
      originNativePriceUsd,
      destGasUnits,
      destGwei,
      destNativePriceUsd,
    },
    outputs: {
      totalGasCostUsd: totalGasUsd.toNumber(),
      originGasCostUsd: originCost.toNumber(),
      destinationGasCostUsd: destCost.toNumber(),
    },
    formula: 'Gas = (Units_src * Gwei_src * 1e-9 * P_src) + (Units_dst * Gwei_dst * 1e-9 * P_dst)',
    assumptions: ['EIP-1559 base fee + priority tip estimates at time of broadcast'],
    warnings: [],
    breakdown: { originCostUsd: originCost.toNumber(), destCostUsd: destCost.toNumber() },
    executedAt: Date.now(),
  };
}

/** 6. Cross-Chain Profit Calculator */
export function calculateCrossChainProfit(
  grossSpreadUsd: DecimalValue,
  bridgeCostUsd: DecimalValue,
  slippageBufferUsd: DecimalValue,
): CalculationResult {
  const gross = toDecimal(grossSpreadUsd);
  const bridge = toDecimal(bridgeCostUsd);
  const slip = toDecimal(slippageBufferUsd);
  const net = gross.minus(bridge).minus(slip);

  return {
    inputs: { grossSpreadUsd, bridgeCostUsd, slippageBufferUsd },
    outputs: { netProfitUsd: net.toNumber(), isProfitable: net.greaterThan(0) },
    formula: 'Net = Gross Spread - Bridge Costs - Slippage Buffer',
    assumptions: ['Deterministic slippage cap enforced on destination swap contract'],
    warnings: net.lessThanOrEqualTo(0) ? ['Bridge overhead exceeds cross-chain price spread.'] : [],
    breakdown: { bridgeCostUsd: bridge.toNumber(), slippageBufferUsd: slip.toNumber() },
    executedAt: Date.now(),
  };
}

/** 7. Cross-Chain Break-Even Calculator */
export function calculateCrossChainBreakEven(
  totalBridgeAndGasCostUsd: DecimalValue,
  tradeAmountTokens: DecimalValue,
  sourceTokenPriceUsd: DecimalValue,
): CalculationResult {
  const costs = toDecimal(totalBridgeAndGasCostUsd);
  const tokens = toDecimal(tradeAmountTokens);
  const pSrc = toDecimal(sourceTokenPriceUsd);

  const capital = tokens.times(pSrc);
  const requiredSpreadPercent = capital.isZero()
    ? new Decimal(0)
    : costs.dividedBy(capital).times(100);
  const minDestPrice = pSrc.times(new Decimal(1).plus(requiredSpreadPercent.dividedBy(100)));

  return {
    inputs: { totalBridgeAndGasCostUsd, tradeAmountTokens, sourceTokenPriceUsd },
    outputs: {
      breakEvenSpreadPercent: requiredSpreadPercent.toNumber(),
      minimumDestinationPriceUsd: minDestPrice.toNumber(),
    },
    formula:
      'BreakEven% = (TotalBridgeCost / TradeCapital) * 100; P_dst_min = P_src * (1 + BreakEven%)',
    assumptions: ['Zero slippage on final destination fill'],
    warnings: [],
    breakdown: { tradeCapitalUsd: capital.toNumber() },
    executedAt: Date.now(),
  };
}

/** 8. Cheapest Route Calculator */
export function calculateCheapestRoute(quotes: BridgeQuote[]): CalculationResult {
  if (quotes.length === 0) {
    return {
      inputs: { quotesCount: 0 },
      outputs: { cheapestBridge: null, totalCostUsd: 0 },
      formula: 'Min(BridgeFee + GasCost)',
      assumptions: ['Comparative relayer pricing snapshot'],
      warnings: ['No bridge quotes available.'],
      breakdown: {},
      executedAt: Date.now(),
    };
  }

  const evaluated = quotes.map((q) => ({
    ...q,
    totalCost: q.feeUsd.plus(q.gasCostUsd),
  }));

  evaluated.sort((a, b) => a.totalCost.comparedTo(b.totalCost));
  const cheapest = evaluated[0];

  return {
    inputs: { quotesCount: quotes.length },
    outputs: {
      cheapestBridgeId: cheapest.bridgeId,
      cheapestBridgeName: cheapest.bridgeName,
      totalCostUsd: cheapest.totalCost.toNumber(),
      feeUsd: cheapest.feeUsd.toNumber(),
      gasCostUsd: cheapest.gasCostUsd.toNumber(),
      durationSeconds: cheapest.estimatedDurationSeconds,
    },
    formula: 'Cheapest = ArgMin(Fee_i + Gas_i)',
    assumptions: ['All bridge routes have sufficient liquidity for the quoted volume'],
    warnings: [],
    breakdown: { quotesEvaluated: quotes.length },
    executedAt: Date.now(),
  };
}

/** 9. Fastest Route Calculator */
export function calculateFastestRoute(quotes: BridgeQuote[]): CalculationResult {
  if (quotes.length === 0) {
    return {
      inputs: { quotesCount: 0 },
      outputs: { fastestBridge: null, durationSeconds: 0 },
      formula: 'Min(Duration)',
      assumptions: ['Consensus latency bounds'],
      warnings: ['No bridge quotes available.'],
      breakdown: {},
      executedAt: Date.now(),
    };
  }

  const sorted = [...quotes].sort(
    (a, b) => a.estimatedDurationSeconds - b.estimatedDurationSeconds,
  );
  const fastest = sorted[0];

  return {
    inputs: { quotesCount: quotes.length },
    outputs: {
      fastestBridgeId: fastest.bridgeId,
      fastestBridgeName: fastest.bridgeName,
      durationSeconds: fastest.estimatedDurationSeconds,
      durationMinutes: fastest.estimatedDurationSeconds / 60,
      totalCostUsd: fastest.feeUsd.plus(fastest.gasCostUsd).toNumber(),
    },
    formula: 'Fastest = ArgMin(Duration_i)',
    assumptions: ['Optimistic relayer fill execution'],
    warnings: [],
    breakdown: { quotesEvaluated: quotes.length },
    executedAt: Date.now(),
  };
}

/** 10. Route Profitability Simulator */
export function calculateRouteProfitabilitySimulation(
  quotes: BridgeQuote[],
  sourcePrice: DecimalValue,
  destPrice: DecimalValue,
  tradeAmount: DecimalValue,
): CalculationResult {
  const pSrc = toDecimal(sourcePrice);
  const pDst = toDecimal(destPrice);
  const amt = toDecimal(tradeAmount);
  const grossProfit = amt.times(pDst).minus(amt.times(pSrc));

  const simulation = quotes.map((q) => {
    const totalCost = q.feeUsd.plus(q.gasCostUsd);
    const netProfit = grossProfit.minus(totalCost);
    return {
      bridgeName: q.bridgeName,
      totalCostUsd: totalCost.toNumber(),
      durationMinutes: q.estimatedDurationSeconds / 60,
      securityScore: q.securityScore,
      netProfitUsd: netProfit.toNumber(),
      isProfitable: netProfit.greaterThan(0),
    };
  });

  return {
    inputs: { quotesCount: quotes.length, tradeAmount, sourcePrice, destPrice },
    outputs: {
      grossSpreadProfitUsd: grossProfit.toNumber(),
      simulation,
    },
    formula: 'Net_i = GrossSpread - (Fee_i + Gas_i)',
    assumptions: ['Simultaneous comparison of multi-relayer bridge pipelines'],
    warnings: [],
    breakdown: { simulation },
    executedAt: Date.now(),
  };
}
