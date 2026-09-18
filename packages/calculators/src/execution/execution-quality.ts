import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';

/** 1. VWAP Calculator (Volume-Weighted Average Price) */
export function calculateVwap(
  trades: { price: DecimalValue; volume: DecimalValue }[],
): CalculationResult {
  let totalNotional = new Decimal(0);
  let totalVolume = new Decimal(0);

  trades.forEach((t) => {
    const p = toDecimal(t.price);
    const v = toDecimal(t.volume);
    totalNotional = totalNotional.plus(p.times(v));
    totalVolume = totalVolume.plus(v);
  });

  const vwap = totalVolume.isZero() ? new Decimal(0) : totalNotional.dividedBy(totalVolume);

  return {
    inputs: { tradeCount: trades.length },
    outputs: {
      vwapPrice: vwap.toNumber(),
      totalVolume: totalVolume.toNumber(),
      totalNotionalUsd: totalNotional.toNumber(),
    },
    formula: 'VWAP = Sum(P_i * V_i) / Sum(V_i)',
    assumptions: ['Standard institutional benchmark weighted execution price'],
    warnings: trades.length === 0 ? ['No trade data supplied.'] : [],
    breakdown: { vwap: vwap.toNumber() },
    executedAt: Date.now(),
  };
}

/** 2. TWAP Calculator (Time-Weighted Average Price) */
export function calculateTwap(priceSnapshots: DecimalValue[]): CalculationResult {
  if (priceSnapshots.length === 0) {
    return {
      inputs: { snapshotCount: 0 },
      outputs: { twapPrice: 0 },
      formula: 'TWAP = Sum(P_t) / N',
      assumptions: ['Equal time interval sampling'],
      warnings: ['No snapshots provided.'],
      breakdown: {},
      executedAt: Date.now(),
    };
  }

  let sum = new Decimal(0);
  priceSnapshots.forEach((p) => {
    sum = sum.plus(toDecimal(p));
  });
  const twap = sum.dividedBy(priceSnapshots.length);

  return {
    inputs: { snapshotCount: priceSnapshots.length },
    outputs: { twapPrice: twap.toNumber() },
    formula: 'TWAP = (1 / N) * Sum_{t=1}^N P_t',
    assumptions: ['Uniform sampling intervals between execution slices'],
    warnings: [],
    breakdown: { twap: twap.toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. Average Execution Price Calculator (Multi-fill blending) */
export function calculateAverageExecutionPrice(
  fills: { price: DecimalValue; quantity: DecimalValue; feeUsd: DecimalValue }[],
): CalculationResult {
  let totalCost = new Decimal(0);
  let totalQty = new Decimal(0);
  let totalFees = new Decimal(0);

  fills.forEach((f) => {
    const p = toDecimal(f.price);
    const q = toDecimal(f.quantity);
    const fee = toDecimal(f.feeUsd);

    totalCost = totalCost.plus(p.times(q));
    totalQty = totalQty.plus(q);
    totalFees = totalFees.plus(fee);
  });

  const avgPriceExFee = totalQty.isZero() ? new Decimal(0) : totalCost.dividedBy(totalQty);
  const avgPriceIncFee = totalQty.isZero()
    ? new Decimal(0)
    : totalCost.plus(totalFees).dividedBy(totalQty);

  return {
    inputs: { fillsCount: fills.length },
    outputs: {
      averagePriceExcludingFees: avgPriceExFee.toNumber(),
      averagePriceIncludingFees: avgPriceIncFee.toNumber(),
      totalQuantityFilled: totalQty.toNumber(),
      totalFeesUsd: totalFees.toNumber(),
    },
    formula: 'AvgPrice = Sum(P_i * Q_i) / Sum(Q_i); NetAvg = (Sum(P_i * Q_i) + Fees) / Sum(Q_i)',
    assumptions: ['Multiple slice fills aggregated into unified trade ledger'],
    warnings: [],
    breakdown: { totalCostUsd: totalCost.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. Order Book Imbalance Calculator (OBL) */
export function calculateOrderBookImbalance(
  bidVolumeDepthUsd: DecimalValue,
  askVolumeDepthUsd: DecimalValue,
): CalculationResult {
  const bids = toDecimal(bidVolumeDepthUsd);
  const asks = toDecimal(askVolumeDepthUsd);

  const total = bids.plus(asks);
  // Imbalance = (Bids - Asks) / (Bids + Asks), range [-1, +1]
  const imbalance = total.isZero() ? new Decimal(0) : bids.minus(asks).dividedBy(total);

  return {
    inputs: { bidVolumeDepthUsd, askVolumeDepthUsd },
    outputs: {
      imbalanceRatio: imbalance.toNumber(),
      pressureDirection: imbalance.greaterThan('0.1')
        ? 'BUY_PRESSURE'
        : imbalance.lessThan('-0.1')
          ? 'SELL_PRESSURE'
          : 'NEUTRAL',
      bidRatioPercent: total.isZero() ? 50 : bids.dividedBy(total).times(100).toNumber(),
      askRatioPercent: total.isZero() ? 50 : asks.dividedBy(total).times(100).toNumber(),
    },
    formula: 'Imbalance = (Bids - Asks) / (Bids + Asks)',
    assumptions: ['Order book depth sampled across top 10 levels'],
    warnings: [],
    breakdown: { totalDepthUsd: total.toNumber() },
    executedAt: Date.now(),
  };
}

/** 5. Execution Cost Calculator */
export function calculateDetailedExecutionCost(
  spreadCostUsd: DecimalValue,
  marketImpactUsd: DecimalValue,
  commissionFeesUsd: DecimalValue,
  opportunityCostUsd: DecimalValue,
): CalculationResult {
  const spread = toDecimal(spreadCostUsd);
  const impact = toDecimal(marketImpactUsd);
  const comm = toDecimal(commissionFeesUsd);
  const opp = toDecimal(opportunityCostUsd);

  const totalExecutionCostUsd = spread.plus(impact).plus(comm).plus(opp);

  return {
    inputs: { spreadCostUsd, marketImpactUsd, commissionFeesUsd, opportunityCostUsd },
    outputs: {
      totalExecutionCostUsd: totalExecutionCostUsd.toNumber(),
      explicitCostsUsd: comm.toNumber(),
      implicitCostsUsd: spread.plus(impact).plus(opp).toNumber(),
    },
    formula: 'Total Cost = Half_Spread + Market_Impact + Commissions + Opportunity_Cost',
    assumptions: ['Implementation shortfall framework (Perold 1988)'],
    warnings: [],
    breakdown: {
      spreadUsd: spread.toNumber(),
      impactUsd: impact.toNumber(),
      commissionsUsd: comm.toNumber(),
      opportunityCostUsd: opp.toNumber(),
    },
    executedAt: Date.now(),
  };
}

/** 6. Execution Delay Impact Calculator */
export function calculateExecutionDelayImpact(
  spreadDriftRatePercentPerSecond: DecimalValue,
  delaySeconds: DecimalValue,
  initialSpreadPercent: DecimalValue,
): CalculationResult {
  const drift = toDecimal(spreadDriftRatePercentPerSecond);
  const delay = toDecimal(delaySeconds);
  const initial = toDecimal(initialSpreadPercent);

  // Spread reduction = drift * delay
  const lostSpreadPercent = drift.times(delay);
  const remainingSpreadPercent = Decimal.max(0, initial.minus(lostSpreadPercent));

  return {
    inputs: { spreadDriftRatePercentPerSecond, delaySeconds, initialSpreadPercent },
    outputs: {
      remainingSpreadPercent: remainingSpreadPercent.toNumber(),
      lostSpreadPercent: lostSpreadPercent.toNumber(),
      percentageOfSpreadEvaporated: initial.isZero()
        ? 0
        : lostSpreadPercent.dividedBy(initial).times(100).toNumber(),
    },
    formula: 'Remaining = Max(0, Initial_Spread - (Drift_Rate * Delay_Seconds))',
    assumptions: ['Linear market quote convergence due to taker discovery'],
    warnings: remainingSpreadPercent.isZero()
      ? ['Spread completely vanished during execution delay.']
      : [],
    breakdown: { lostSpread: lostSpreadPercent.toNumber() },
    executedAt: Date.now(),
  };
}

/** 7. Latency Impact Calculator */
export function calculateLatencyImpact(
  latencyMilliseconds: DecimalValue,
  averageAdverseSelectionBpsPerMs: DecimalValue = '0.05',
  orderNotionalUsd: DecimalValue = '10000',
): CalculationResult {
  const latency = toDecimal(latencyMilliseconds);
  const rate = toDecimal(averageAdverseSelectionBpsPerMs);
  const notional = toDecimal(orderNotionalUsd);

  // Cost in bps = latencyMs * rate
  const dragBps = latency.times(rate);
  const dragUsd = notional.times(dragBps.dividedBy(10000));

  return {
    inputs: { latencyMilliseconds, averageAdverseSelectionBpsPerMs, orderNotionalUsd },
    outputs: {
      latencyDragBps: dragBps.toNumber(),
      latencyCostUsd: dragUsd.toNumber(),
    },
    formula: 'Latency Drag = Latency_ms * Bps_per_ms; Cost = Notional * (Drag / 10000)',
    assumptions: ['Fast-lane high-frequency trader queue jumping model'],
    warnings: latency.greaterThan(250)
      ? ['Network latency exceeds 250ms (High slippage risk).']
      : [],
    breakdown: { dragUsd: dragUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 8. Partial Fill Calculator */
export function calculateExecutionPartialFill(
  requestedSizeTokens: DecimalValue,
  availableSizeTokens: DecimalValue,
  unitPriceUsd: DecimalValue,
): CalculationResult {
  const req = toDecimal(requestedSizeTokens);
  const avail = toDecimal(availableSizeTokens);
  const price = toDecimal(unitPriceUsd);

  const filled = Decimal.min(req, avail);
  const unfilled = Decimal.max(0, req.minus(avail));
  const fillRate = req.isZero() ? new Decimal(0) : filled.dividedBy(req).times(100);

  return {
    inputs: { requestedSizeTokens, availableSizeTokens, unitPriceUsd },
    outputs: {
      filledTokens: filled.toNumber(),
      unfilledTokens: unfilled.toNumber(),
      fillRatePercent: fillRate.toNumber(),
      filledValueUsd: filled.times(price).toNumber(),
      unfilledValueUsd: unfilled.times(price).toNumber(),
    },
    formula: 'Filled = Min(Req, Avail); FillRate = (Filled / Req) * 100%',
    assumptions: ['Immediate fill or kill / partial fill taker execution'],
    warnings: fillRate.lessThan(80) ? ['Partial fill below 80% capacity.'] : [],
    breakdown: { filled: filled.toNumber(), unfilled: unfilled.toNumber() },
    executedAt: Date.now(),
  };
}

/** 9. Fill Probability Estimator */
export function calculateFillProbability(
  spreadFromMidBps: DecimalValue,
  orderQueuePosition: number,
  averageCancellationRatePercent: DecimalValue = '15',
): CalculationResult {
  const spreadBps = toDecimal(spreadFromMidBps);
  const cancelRate = toDecimal(averageCancellationRatePercent).dividedBy(100);

  // Heuristic probability: P = max(0, min(1, 1 / (1 + 0.1 * spreadBps + 0.05 * queuePos))) * (1 - 0.5 * cancelRate)
  const denominator = new Decimal(1)
    .plus(spreadBps.times('0.08'))
    .plus(new Decimal(orderQueuePosition).times('0.04'));

  const rawProb = new Decimal(1).dividedBy(denominator);
  const finalProb = rawProb.times(new Decimal(1).minus(cancelRate.times('0.3'))).times(100);

  return {
    inputs: { spreadFromMidBps, orderQueuePosition, averageCancellationRatePercent },
    outputs: {
      fillProbabilityPercent: Math.min(100, Math.max(0, finalProb.toNumber())),
      queueRank: orderQueuePosition,
    },
    formula: 'P_fill = (1 / (1 + 0.08*Spread_bps + 0.04*Queue)) * (1 - 0.3*CancelRate)',
    assumptions: ['Empirical limit order book fill queue estimation'],
    warnings: finalProb.lessThan(30) ? ['Low execution fill probability (< 30%).'] : [],
    breakdown: { rawProb: rawProb.toNumber() },
    executedAt: Date.now(),
  };
}

/** 10. Opportunity Expiration Calculator */
export function calculateOpportunityExpiration(
  detectedTimestampMs: number,
  ttlMilliseconds: number,
  currentTimestampMs: number = Date.now(),
): CalculationResult {
  const elapsed = currentTimestampMs - detectedTimestampMs;
  const remaining = Math.max(0, ttlMilliseconds - elapsed);
  const isExpired = remaining === 0;

  return {
    inputs: { detectedTimestampMs, ttlMilliseconds, currentTimestampMs },
    outputs: {
      isExpired,
      elapsedMilliseconds: elapsed,
      remainingMilliseconds: remaining,
      remainingFraction: ttlMilliseconds === 0 ? 0 : remaining / ttlMilliseconds,
    },
    formula: 'Remaining = Max(0, TTL - (Now - DetectedAt))',
    assumptions: ['Hard TTL expiration for high-frequency pricing quotes'],
    warnings: isExpired ? ['Opportunity quote has expired.'] : [],
    breakdown: { elapsedMs: elapsed, remainingMs: remaining },
    executedAt: Date.now(),
  };
}
