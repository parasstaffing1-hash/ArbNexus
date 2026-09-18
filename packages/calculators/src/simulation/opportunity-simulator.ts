import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';

export interface SimulationParams {
  capitalUsd: DecimalValue; // total portfolio budget
  tradeSizeUsd: DecimalValue; // active simulated trade size
  buyPrice: DecimalValue;
  sellPrice: DecimalValue;
  tradingFeePercent?: DecimalValue; // default 0.1%
  withdrawalFeeUsd?: DecimalValue;
  gasCostUsd?: DecimalValue;
  bridgeFeeUsd?: DecimalValue;
  slippageFactor?: DecimalValue; // impact coefficient k (e.g. 0.0000002)
  fundingRatePercent?: DecimalValue;
  executionDelaySeconds?: DecimalValue;
}

export interface SimulationPoint {
  tradeSizeUsd: number;
  grossProfitUsd: number;
  totalFeesUsd: number;
  slippageCostUsd: number;
  netProfitUsd: number;
  netRoiPercent: number;
  isProfitable: boolean;
}

export interface SimulationOutput {
  currentNetProfitUsd: number;
  currentNetRoiPercent: number;
  optimalTradeSizeUsd: number;
  maxProfitUsd: number;
  breakEvenTradeSizeUsd: number;
  profitCurve: SimulationPoint[];
  roiCurve: { tradeSizeUsd: number; netRoiPercent: number }[];
}

/**
 * Interactive trade size vs net profit & ROI curve simulation engine.
 * Generates continuous sweeps from $500 up to max available capital.
 */
export function simulateOpportunity(
  params: SimulationParams,
  curveSteps = 15,
): CalculationResult<SimulationParams, SimulationOutput> {
  const cap = toDecimal(params.capitalUsd);
  const curSize = toDecimal(params.tradeSizeUsd);
  const pBuy = toDecimal(params.buyPrice);
  const pSell = toDecimal(params.sellPrice);
  const feePct = toDecimal(params.tradingFeePercent ?? '0.1').dividedBy(100);
  const wFee = toDecimal(params.withdrawalFeeUsd ?? '1.0');
  const gas = toDecimal(params.gasCostUsd ?? '1.5');
  const bridge = toDecimal(params.bridgeFeeUsd ?? '0');
  const k = toDecimal(params.slippageFactor ?? '0.00000005');
  const delay = toDecimal(params.executionDelaySeconds ?? '0');

  const grossSpreadRate = pBuy.isZero() ? new Decimal(0) : pSell.minus(pBuy).dividedBy(pBuy);
  // Delay penalty: 0.01% spread lost per second
  const delayPenaltyRate = delay.times('0.0001');
  const effectiveSpreadRate = Decimal.max(0, grossSpreadRate.minus(delayPenaltyRate));

  const fixedCosts = wFee.plus(gas).plus(bridge);

  const calculatePoint = (sizeUsd: Decimal): SimulationPoint => {
    const gross = sizeUsd.times(effectiveSpreadRate);
    const tradingFees = sizeUsd.times(feePct).times(2); // Buy + Sell commission
    // Slippage cost is quadratic: k * size^2
    const slippageCost = k.times(sizeUsd.pow(2));
    const totalCosts = tradingFees.plus(slippageCost).plus(fixedCosts);
    const net = gross.minus(totalCosts);
    const roi = sizeUsd.isZero() ? new Decimal(0) : net.dividedBy(sizeUsd).times(100);

    return {
      tradeSizeUsd: sizeUsd.toNumber(),
      grossProfitUsd: gross.toNumber(),
      totalFeesUsd: totalCosts.toNumber(),
      slippageCostUsd: slippageCost.toNumber(),
      netProfitUsd: net.toNumber(),
      netRoiPercent: roi.toNumber(),
      isProfitable: net.greaterThan(0),
    };
  };

  // Generate curve points
  const maxSweep = Decimal.max(cap, curSize.times(2));
  const stepSize = maxSweep.dividedBy(curveSteps);
  const profitCurve: SimulationPoint[] = [];

  for (let i = 1; i <= curveSteps; i++) {
    const size = stepSize.times(i);
    profitCurve.push(calculatePoint(size));
  }

  // Current selected point
  const currentPoint = calculatePoint(curSize);

  // Optimal size: d(Profit)/d(Size) = SpreadRate - 2*FeePct - 2*k*Size = 0
  // Optimal Size = (SpreadRate - 2*FeePct) / (2 * k)
  const netSpreadMargin = effectiveSpreadRate.minus(feePct.times(2));
  let optimalSize = new Decimal(0);
  let maxProf = 0;

  if (netSpreadMargin.greaterThan(0) && k.greaterThan(0)) {
    optimalSize = netSpreadMargin.dividedBy(k.times(2));
    if (optimalSize.greaterThan(cap)) optimalSize = cap;
    maxProf = calculatePoint(optimalSize).netProfitUsd;
  }

  // Find approximate break-even trade size
  const profitablePoint = profitCurve.find((p) => p.isProfitable);
  const breakEvenSize = profitablePoint ? profitablePoint.tradeSizeUsd : 0;

  const roiCurve = profitCurve.map((p) => ({
    tradeSizeUsd: p.tradeSizeUsd,
    netRoiPercent: p.netRoiPercent,
  }));

  return {
    inputs: params,
    outputs: {
      currentNetProfitUsd: currentPoint.netProfitUsd,
      currentNetRoiPercent: currentPoint.netRoiPercent,
      optimalTradeSizeUsd: optimalSize.toNumber(),
      maxProfitUsd: typeof maxProf === 'number' ? maxProf : (maxProf as any).toNumber(),
      breakEvenTradeSizeUsd: breakEvenSize,
      profitCurve,
      roiCurve,
    },
    formula: 'Net = Size * (Spread - 2*Fee%) - k * Size^2 - Fixed_Costs',
    assumptions: ['Quadratic market impact model with linear trade commissions'],
    warnings:
      currentPoint.netProfitUsd <= 0 ? ['Simulated trade size is currently non-profitable.'] : [],
    breakdown: { currentPoint },
    executedAt: Date.now(),
  };
}
