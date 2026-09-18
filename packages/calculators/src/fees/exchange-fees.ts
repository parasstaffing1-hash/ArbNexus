import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';

/** 1. Maker Fee Calculator */
export function calculateMakerFee(
  tradeVolumeUsd: DecimalValue,
  makerFeePercent: DecimalValue = '0.02',
): CalculationResult {
  const vol = toDecimal(tradeVolumeUsd);
  const feeRate = toDecimal(makerFeePercent).dividedBy(100);
  const feeUsd = vol.times(feeRate);

  return {
    inputs: { tradeVolumeUsd, makerFeePercent },
    outputs: {
      feeUsd: feeUsd.toNumber(),
      effectiveRatePercent: toDecimal(makerFeePercent).toNumber(),
    },
    formula: 'Maker Fee = Trade Volume * (Maker Fee Rate % / 100)',
    assumptions: ['Passive limit order that rests in the order book without immediate crossing'],
    warnings: [],
    breakdown: { volumeUsd: vol.toNumber(), feeRateBps: feeRate.times(10000).toNumber() },
    executedAt: Date.now(),
  };
}

/** 2. Taker Fee Calculator */
export function calculateTakerFee(
  tradeVolumeUsd: DecimalValue,
  takerFeePercent: DecimalValue = '0.05',
): CalculationResult {
  const vol = toDecimal(tradeVolumeUsd);
  const feeRate = toDecimal(takerFeePercent).dividedBy(100);
  const feeUsd = vol.times(feeRate);

  return {
    inputs: { tradeVolumeUsd, takerFeePercent },
    outputs: {
      feeUsd: feeUsd.toNumber(),
      effectiveRatePercent: toDecimal(takerFeePercent).toNumber(),
    },
    formula: 'Taker Fee = Trade Volume * (Taker Fee Rate % / 100)',
    assumptions: ['Aggressive market order or crossing limit order taking liquidity from the book'],
    warnings: [],
    breakdown: { volumeUsd: vol.toNumber(), feeRateBps: feeRate.times(10000).toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. Trading Fee Calculator (with native token discount e.g. BNB/HT 25%) */
export function calculateTradingFee(
  tradeVolumeUsd: DecimalValue,
  baseFeePercent: DecimalValue,
  hasTokenDiscount = false,
  discountPercent: DecimalValue = '25',
): CalculationResult {
  const vol = toDecimal(tradeVolumeUsd);
  let feeRate = toDecimal(baseFeePercent).dividedBy(100);
  let appliedDiscount = new Decimal(0);

  if (hasTokenDiscount) {
    appliedDiscount = toDecimal(discountPercent).dividedBy(100);
    feeRate = feeRate.times(new Decimal(1).minus(appliedDiscount));
  }

  const feeUsd = vol.times(feeRate);

  return {
    inputs: { tradeVolumeUsd, baseFeePercent, hasTokenDiscount, discountPercent },
    outputs: {
      finalFeeUsd: feeUsd.toNumber(),
      effectiveFeePercent: feeRate.times(100).toNumber(),
      savingsUsd: vol.times(toDecimal(baseFeePercent).dividedBy(100)).minus(feeUsd).toNumber(),
    },
    formula: 'Fee = Volume * BaseRate * (1 - Discount)',
    assumptions: ['Platform native token balance is sufficient to pay trade commissions'],
    warnings: [],
    breakdown: { feeUsd: feeUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. Withdrawal Fee Calculator */
export function calculateWithdrawalFee(
  tokenAmount: DecimalValue,
  tokenPriceUsd: DecimalValue,
  flatWithdrawalTokenAmount: DecimalValue,
): CalculationResult {
  const amount = toDecimal(tokenAmount);
  const price = toDecimal(tokenPriceUsd);
  const feeTokens = toDecimal(flatWithdrawalTokenAmount);

  const feeUsd = feeTokens.times(price);
  const totalValueUsd = amount.times(price);
  const feePercentOfValue = totalValueUsd.isZero()
    ? new Decimal(0)
    : feeUsd.dividedBy(totalValueUsd).times(100);

  return {
    inputs: { tokenAmount, tokenPriceUsd, flatWithdrawalTokenAmount },
    outputs: {
      feeUsd: feeUsd.toNumber(),
      feeTokens: feeTokens.toNumber(),
      feePercentOfTrade: feePercentOfValue.toNumber(),
      netReceivedAmount: amount.minus(feeTokens).toNumber(),
    },
    formula: 'Withdrawal Cost = Flat_Withdrawal_Tokens * Token_Price_USD',
    assumptions: ['Exchange applies fixed per-transaction withdrawal tariff on L1/L2 network'],
    warnings: feeTokens.greaterThan(amount) ? ['Withdrawal fee exceeds transferred balance.'] : [],
    breakdown: { feeUsd: feeUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 5. Deposit Fee Calculator */
export function calculateDepositFee(
  depositAmountUsd: DecimalValue,
  depositFeePercent: DecimalValue = '0',
  flatDepositFeeUsd: DecimalValue = '0',
): CalculationResult {
  const amount = toDecimal(depositAmountUsd);
  const pct = toDecimal(depositFeePercent).dividedBy(100);
  const flat = toDecimal(flatDepositFeeUsd);

  const totalFeeUsd = amount.times(pct).plus(flat);
  const netReceivedUsd = amount.minus(totalFeeUsd);

  return {
    inputs: { depositAmountUsd, depositFeePercent, flatDepositFeeUsd },
    outputs: {
      totalFeeUsd: totalFeeUsd.toNumber(),
      netReceivedUsd: netReceivedUsd.toNumber(),
      effectiveRatePercent: amount.isZero()
        ? 0
        : totalFeeUsd.dividedBy(amount).times(100).toNumber(),
    },
    formula: 'Deposit Fee = (Deposit * Rate%) + Flat_Fee',
    assumptions: [
      'Most crypto on-chain deposits are zero-fee from CEX perspective, but gateway fees may apply',
    ],
    warnings: [],
    breakdown: { variableFeeUsd: amount.times(pct).toNumber(), flatFeeUsd: flat.toNumber() },
    executedAt: Date.now(),
  };
}

/** 6. Total Exchange Cost Calculator */
export function calculateTotalExchangeCost(
  buyVolumeUsd: DecimalValue,
  buyTakerFeePercent: DecimalValue,
  sellVolumeUsd: DecimalValue,
  sellTakerFeePercent: DecimalValue,
  withdrawalFeeUsd: DecimalValue,
  depositFeeUsd: DecimalValue,
): CalculationResult {
  const bVol = toDecimal(buyVolumeUsd);
  const bFee = bVol.times(toDecimal(buyTakerFeePercent).dividedBy(100));
  const sVol = toDecimal(sellVolumeUsd);
  const sFee = sVol.times(toDecimal(sellTakerFeePercent).dividedBy(100));
  const wFee = toDecimal(withdrawalFeeUsd);
  const dFee = toDecimal(depositFeeUsd);

  const total = bFee.plus(sFee).plus(wFee).plus(dFee);
  const avgVol = bVol.plus(sVol).dividedBy(2);
  const dragPercent = avgVol.isZero() ? new Decimal(0) : total.dividedBy(avgVol).times(100);

  return {
    inputs: {
      buyVolumeUsd,
      buyTakerFeePercent,
      sellVolumeUsd,
      sellTakerFeePercent,
      withdrawalFeeUsd,
      depositFeeUsd,
    },
    outputs: {
      totalCostUsd: total.toNumber(),
      tradingFeesUsd: bFee.plus(sFee).toNumber(),
      transferFeesUsd: wFee.plus(dFee).toNumber(),
      dragPercentOnCapital: dragPercent.toNumber(),
    },
    formula: 'Total Cost = (V_buy * Fee_buy) + (V_sell * Fee_sell) + Withdrawal_Fee + Deposit_Fee',
    assumptions: ['Full round-trip execution through exchange accounts'],
    warnings: [],
    breakdown: {
      buyFeeUsd: bFee.toNumber(),
      sellFeeUsd: sFee.toNumber(),
      withdrawalFeeUsd: wFee.toNumber(),
      depositFeeUsd: dFee.toNumber(),
    },
    executedAt: Date.now(),
  };
}

/** 7. Fee-Break-Even Calculator */
export function calculateFeeBreakEven(
  tradeCapitalUsd: DecimalValue,
  roundTripTradingFeePercent: DecimalValue,
  fixedNetworkFeesUsd: DecimalValue,
): CalculationResult {
  const cap = toDecimal(tradeCapitalUsd);
  const feePct = toDecimal(roundTripTradingFeePercent).dividedBy(100);
  const fixed = toDecimal(fixedNetworkFeesUsd);

  // Total cost = cap * feePct + fixed
  const totalCost = cap.times(feePct).plus(fixed);
  const breakEvenSpreadPct = cap.isZero() ? new Decimal(0) : totalCost.dividedBy(cap).times(100);

  return {
    inputs: { tradeCapitalUsd, roundTripTradingFeePercent, fixedNetworkFeesUsd },
    outputs: {
      totalCostUsd: totalCost.toNumber(),
      breakEvenSpreadPercent: breakEvenSpreadPct.toNumber(),
    },
    formula: 'Break-Even Spread % = ((Trade Capital * Fee% + Fixed Costs) / Trade Capital) * 100',
    assumptions: ['Minimum price markup required across legs to generate 0 net loss'],
    warnings: [],
    breakdown: { variableCostUsd: cap.times(feePct).toNumber(), fixedCostUsd: fixed.toNumber() },
    executedAt: Date.now(),
  };
}

/** 8. Volume-Tier VIP Fee Calculator */
export function calculateVolumeTierFee(
  thirtyDayVolumeUsd: DecimalValue,
  vipTiers: {
    minVolumeUsd: DecimalValue;
    makerFeePercent: DecimalValue;
    takerFeePercent: DecimalValue;
  }[],
): CalculationResult {
  const vol = toDecimal(thirtyDayVolumeUsd);
  const sortedTiers = [...vipTiers].sort((a, b) =>
    toDecimal(b.minVolumeUsd).comparedTo(toDecimal(a.minVolumeUsd)),
  );

  let matchedTier = sortedTiers.find((t) => vol.greaterThanOrEqualTo(toDecimal(t.minVolumeUsd)));
  if (!matchedTier) {
    matchedTier = sortedTiers[sortedTiers.length - 1] || {
      minVolumeUsd: 0,
      makerFeePercent: '0.1',
      takerFeePercent: '0.1',
    };
  }

  const makerPct = toDecimal(matchedTier.makerFeePercent);
  const takerPct = toDecimal(matchedTier.takerFeePercent);

  return {
    inputs: { thirtyDayVolumeUsd, availableTiersCount: vipTiers.length },
    outputs: {
      activeTierVolumeThreshold: toDecimal(matchedTier.minVolumeUsd).toNumber(),
      makerFeePercent: makerPct.toNumber(),
      takerFeePercent: takerPct.toNumber(),
      makerFeeBps: makerPct.times(100).toNumber(),
      takerFeeBps: takerPct.times(100).toNumber(),
    },
    formula: 'Fee = Tier(Volume >= Min_Volume_Tier)',
    assumptions: ['Standard 30-day trailing volume tier schedules'],
    warnings: [],
    breakdown: { makerFeePercent: makerPct.toNumber(), takerFeePercent: takerPct.toNumber() },
    executedAt: Date.now(),
  };
}
