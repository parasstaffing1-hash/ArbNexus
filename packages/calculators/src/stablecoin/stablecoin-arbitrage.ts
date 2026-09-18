import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';

/** 1. Stablecoin Depeg Calculator */
export function calculateStablecoinDepeg(
  marketPriceUsd: DecimalValue,
  pegTargetPriceUsd: DecimalValue = '1.0',
): CalculationResult {
  const pMarket = toDecimal(marketPriceUsd);
  const pPeg = toDecimal(pegTargetPriceUsd);

  const deviationUsd = pMarket.minus(pPeg);
  const deviationPercent = pPeg.isZero() ? new Decimal(0) : deviationUsd.dividedBy(pPeg).times(100);

  return {
    inputs: { marketPriceUsd, pegTargetPriceUsd },
    outputs: {
      deviationUsd: deviationUsd.toNumber(),
      deviationPercent: deviationPercent.toNumber(),
      deviationBps: deviationPercent.times(100).toNumber(),
      depegType: deviationUsd.isPositive()
        ? 'PREMIUM'
        : deviationUsd.isNegative()
          ? 'DISCOUNT'
          : 'AT_PAR',
    },
    formula: 'Deviation % = ((Market_Price - Peg_Price) / Peg_Price) * 100%',
    assumptions: ['Standard 1:1 USD fiat or reference asset peg'],
    warnings: deviationPercent.abs().greaterThan(1.0)
      ? ['Critical depeg detected (> 1% deviation from target).']
      : [],
    breakdown: { deviationUsd: deviationUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 2. Stablecoin Premium Calculator */
export function calculateStablecoinPremium(
  marketPriceUsd: DecimalValue,
  pegTargetPriceUsd: DecimalValue = '1.0',
): CalculationResult {
  const pMarket = toDecimal(marketPriceUsd);
  const pPeg = toDecimal(pegTargetPriceUsd);
  const premiumUsd = Decimal.max(0, pMarket.minus(pPeg));
  const premiumPercent = pPeg.isZero() ? new Decimal(0) : premiumUsd.dividedBy(pPeg).times(100);

  return {
    inputs: { marketPriceUsd, pegTargetPriceUsd },
    outputs: {
      premiumUsd: premiumUsd.toNumber(),
      premiumPercent: premiumPercent.toNumber(),
      isTradingAtPremium: premiumUsd.greaterThan(0),
    },
    formula: 'Premium = Max(0, P_market - P_peg)',
    assumptions: ['Price above peg creating mint-and-sell arbitrage opportunity'],
    warnings: [],
    breakdown: { premiumUsd: premiumUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. Stablecoin Discount Calculator */
export function calculateStablecoinDiscount(
  marketPriceUsd: DecimalValue,
  pegTargetPriceUsd: DecimalValue = '1.0',
): CalculationResult {
  const pMarket = toDecimal(marketPriceUsd);
  const pPeg = toDecimal(pegTargetPriceUsd);
  const discountUsd = Decimal.max(0, pPeg.minus(pMarket));
  const discountPercent = pPeg.isZero() ? new Decimal(0) : discountUsd.dividedBy(pPeg).times(100);

  return {
    inputs: { marketPriceUsd, pegTargetPriceUsd },
    outputs: {
      discountUsd: discountUsd.toNumber(),
      discountPercent: discountPercent.toNumber(),
      isTradingAtDiscount: discountUsd.greaterThan(0),
    },
    formula: 'Discount = Max(0, P_peg - P_market)',
    assumptions: ['Price below peg creating buy-and-redeem arbitrage opportunity'],
    warnings: discountPercent.greaterThan(2)
      ? ['Severe stablecoin discount (> 2%). Risk of insolvency.']
      : [],
    breakdown: { discountUsd: discountUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. Stablecoin Arbitrage Calculator */
export function calculateStablecoinArbitrage(
  discountMarketPriceUsd: DecimalValue, // e.g. Buy USDC at 0.992
  redemptionPriceUsd: DecimalValue = '1.0', // e.g. Redeem at 1.000
  tokenQuantity: DecimalValue,
  redemptionFeePercent: DecimalValue = '0.1', // e.g. 0.1% redemption fee
  gasCostUsd: DecimalValue = '5.0',
): CalculationResult {
  const pBuy = toDecimal(discountMarketPriceUsd);
  const pRedeem = toDecimal(redemptionPriceUsd);
  const qty = toDecimal(tokenQuantity);

  const buyCapitalUsd = qty.times(pBuy);
  const grossRedemptionUsd = qty.times(pRedeem);

  const redemptionFeeUsd = grossRedemptionUsd.times(toDecimal(redemptionFeePercent).dividedBy(100));
  const gasUsd = toDecimal(gasCostUsd);
  const totalCostsUsd = redemptionFeeUsd.plus(gasUsd);

  const grossProfitUsd = grossRedemptionUsd.minus(buyCapitalUsd);
  const netProfitUsd = grossProfitUsd.minus(totalCostsUsd);
  const netRoiPercent = buyCapitalUsd.isZero()
    ? new Decimal(0)
    : netProfitUsd.dividedBy(buyCapitalUsd).times(100);

  return {
    inputs: {
      discountMarketPriceUsd,
      redemptionPriceUsd,
      tokenQuantity,
      redemptionFeePercent,
      gasCostUsd,
    },
    outputs: {
      grossProfitUsd: grossProfitUsd.toNumber(),
      totalCostsUsd: totalCostsUsd.toNumber(),
      netProfitUsd: netProfitUsd.toNumber(),
      netRoiPercent: netRoiPercent.toNumber(),
      isProfitable: netProfitUsd.greaterThan(0),
    },
    formula: 'Net = (Qty * P_redeem) - (Qty * P_buy) - Redemption_Fee - Gas',
    assumptions: ['Issuer redemption window is open with 1:1 fiat conversion solvency'],
    warnings: netProfitUsd.lessThanOrEqualTo(0)
      ? ['Issuer fee + gas exceeds secondary market discount.']
      : [],
    breakdown: { redemptionFeeUsd: redemptionFeeUsd.toNumber(), gasUsd: gasUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 5. Depeg Break-Even Calculator */
export function calculateDepegBreakEven(
  fixedRedemptionAndGasFeeUsd: DecimalValue,
  variableFeePercent: DecimalValue,
  redemptionPriceUsd: DecimalValue = '1.0',
): CalculationResult {
  const fixed = toDecimal(fixedRedemptionAndGasFeeUsd);
  const varFee = toDecimal(variableFeePercent).dividedBy(100);
  const pRedeem = toDecimal(redemptionPriceUsd);

  // Profit = Qty * P_redeem * (1 - varFee) - Qty * P_buy - fixed = 0
  // P_buy_max = P_redeem * (1 - varFee) - (fixed / Qty)
  // For per-token break-even rate:
  const breakEvenDiscountPercent = varFee.times(100);

  return {
    inputs: { fixedRedemptionAndGasFeeUsd, variableFeePercent, redemptionPriceUsd },
    outputs: {
      minimumDiscountPercentToCoverFees: breakEvenDiscountPercent.toNumber(),
      maxEntryPriceForInfiniteVolume: pRedeem.times(new Decimal(1).minus(varFee)).toNumber(),
    },
    formula: 'BreakEven Discount % = Variable_Fee% + (Fixed_Fee / Capital)',
    assumptions: ['Represents minimum market discount threshold required before fees are overcome'],
    warnings: [],
    breakdown: { breakEvenDiscountPercent: breakEvenDiscountPercent.toNumber() },
    executedAt: Date.now(),
  };
}

/** 6. Redemption Profit Calculator */
export function calculateRedemptionProfit(
  redeemedUnits: DecimalValue,
  payoutPerUnitUsd: DecimalValue = '1.0',
  acquisitionCostUsd: DecimalValue,
  issuerProcessingFeeUsd: DecimalValue = '0',
): CalculationResult {
  const units = toDecimal(redeemedUnits);
  const payoutRate = toDecimal(payoutPerUnitUsd);
  const cost = toDecimal(acquisitionCostUsd);
  const fee = toDecimal(issuerProcessingFeeUsd);

  const grossPayout = units.times(payoutRate);
  const netProfit = grossPayout.minus(cost).minus(fee);
  const roi = cost.isZero() ? new Decimal(0) : netProfit.dividedBy(cost).times(100);

  return {
    inputs: { redeemedUnits, payoutPerUnitUsd, acquisitionCostUsd, issuerProcessingFeeUsd },
    outputs: {
      grossPayoutUsd: grossPayout.toNumber(),
      netProfitUsd: netProfit.toNumber(),
      roiPercent: roi.toNumber(),
      isProfitable: netProfit.greaterThan(0),
    },
    formula: 'Profit = (Units * PayoutRate) - AcquisitionCost - ProcessingFee',
    assumptions: ['Direct primary market issuer redemption without haircut discount'],
    warnings: [],
    breakdown: { grossPayoutUsd: grossPayout.toNumber(), feeUsd: fee.toNumber() },
    executedAt: Date.now(),
  };
}
