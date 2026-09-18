import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';

/** 1. Crypto Currency Converter */
export function calculateCryptoConversion(
  amountFrom: DecimalValue,
  priceFromUsd: DecimalValue,
  priceToUsd: DecimalValue,
): CalculationResult {
  const amt = toDecimal(amountFrom);
  const pFrom = toDecimal(priceFromUsd);
  const pTo = toDecimal(priceToUsd);

  const totalUsd = amt.times(pFrom);
  const amountTo = pTo.isZero() ? new Decimal(0) : totalUsd.dividedBy(pTo);

  return {
    inputs: { amountFrom, priceFromUsd, priceToUsd },
    outputs: {
      convertedAmount: amountTo.toNumber(),
      totalValueUsd: totalUsd.toNumber(),
      exchangeRate: pTo.isZero() ? 0 : pFrom.dividedBy(pTo).toNumber(),
    },
    formula: 'Amount_To = (Amount_From * P_From_USD) / P_To_USD',
    assumptions: ['Mid-market zero-fee benchmark conversion'],
    warnings: [],
    breakdown: { totalUsd: totalUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 2. USD/USDT Converter */
export function calculateUsdUsdt(
  usdAmount: DecimalValue,
  usdtExchangeRate: DecimalValue = '1.0002',
): CalculationResult {
  const usd = toDecimal(usdAmount);
  const rate = toDecimal(usdtExchangeRate);
  const usdt = rate.isZero() ? new Decimal(0) : usd.dividedBy(rate);

  return {
    inputs: { usdAmount, usdtExchangeRate },
    outputs: {
      usdtReceived: usdt.toNumber(),
      rateDifferencePercent: rate.minus(1).times(100).toNumber(),
    },
    formula: 'USDT = USD / ExchangeRate',
    assumptions: ['Bank wire or OTC desk fiat gateway conversion'],
    warnings: [],
    breakdown: { usd: usd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. EUR/USDT Converter */
export function calculateEurUsdt(
  eurAmount: DecimalValue,
  eurUsdRate: DecimalValue = '1.085',
  usdtPeg: DecimalValue = '1.0',
): CalculationResult {
  const eur = toDecimal(eurAmount);
  const rate = toDecimal(eurUsdRate);
  const peg = toDecimal(usdtPeg);

  const usdtAmount = peg.isZero() ? new Decimal(0) : eur.times(rate).dividedBy(peg);

  return {
    inputs: { eurAmount, eurUsdRate, usdtPeg },
    outputs: {
      usdtReceived: usdtAmount.toNumber(),
      eurValueInUsd: eur.times(rate).toNumber(),
    },
    formula: 'USDT = EUR * EUR_USD_Rate / USDT_Peg',
    assumptions: ['Forex spot mid-rate conversion'],
    warnings: [],
    breakdown: { usdtReceived: usdtAmount.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. INR/USDT Converter */
export function calculateInrUsdt(
  inrAmount: DecimalValue,
  inrPerUsdtRate: DecimalValue = '89.5', // OTC / P2P premium rate
): CalculationResult {
  const inr = toDecimal(inrAmount);
  const rate = toDecimal(inrPerUsdtRate);
  const usdt = rate.isZero() ? new Decimal(0) : inr.dividedBy(rate);

  return {
    inputs: { inrAmount, inrPerUsdtRate },
    outputs: {
      usdtReceived: usdt.toNumber(),
      inrPerUsdt: rate.toNumber(),
    },
    formula: 'USDT = INR / INR_per_USDT',
    assumptions: ['Domestic P2P market clearing quotation'],
    warnings: [],
    breakdown: { inrAmount: inr.toNumber() },
    executedAt: Date.now(),
  };
}

/** 5. ROI Calculator (Return on Investment) */
export function calculateGeneralRoi(
  initialInvestmentUsd: DecimalValue,
  finalValueUsd: DecimalValue,
): CalculationResult {
  const init = toDecimal(initialInvestmentUsd);
  const fin = toDecimal(finalValueUsd);

  const netProfit = fin.minus(init);
  const roiPercent = init.isZero() ? new Decimal(0) : netProfit.dividedBy(init).times(100);

  return {
    inputs: { initialInvestmentUsd, finalValueUsd },
    outputs: {
      netProfitUsd: netProfit.toNumber(),
      roiPercent: roiPercent.toNumber(),
      isProfitable: netProfit.greaterThan(0),
    },
    formula: 'ROI % = ((Final - Initial) / Initial) * 100%',
    assumptions: ['Absolute total return'],
    warnings: [],
    breakdown: { netProfitUsd: netProfit.toNumber() },
    executedAt: Date.now(),
  };
}

/** 6. Profit Percentage Calculator */
export function calculateProfitPercentage(
  costPriceUsd: DecimalValue,
  sellingPriceUsd: DecimalValue,
): CalculationResult {
  const cost = toDecimal(costPriceUsd);
  const sell = toDecimal(sellingPriceUsd);

  const profitUsd = sell.minus(cost);
  const profitMarginPercent = sell.isZero() ? new Decimal(0) : profitUsd.dividedBy(sell).times(100);
  const markupPercent = cost.isZero() ? new Decimal(0) : profitUsd.dividedBy(cost).times(100);

  return {
    inputs: { costPriceUsd, sellingPriceUsd },
    outputs: {
      profitUsd: profitUsd.toNumber(),
      profitMarginPercent: profitMarginPercent.toNumber(),
      markupPercent: markupPercent.toNumber(),
    },
    formula: 'Markup % = (Profit / Cost) * 100; Margin % = (Profit / Sell) * 100',
    assumptions: ['Standard trade markup vs gross margin calculation'],
    warnings: [],
    breakdown: { profitUsd: profitUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 7. Compound Interest Calculator */
export function calculateGeneralCompoundInterest(
  principalUsd: DecimalValue,
  annualInterestRatePercent: DecimalValue,
  years: number,
  compoundsPerYear = 12,
): CalculationResult {
  const p = toDecimal(principalUsd);
  const r = toDecimal(annualInterestRatePercent).dividedBy(100);
  const n = new Decimal(compoundsPerYear);
  const t = new Decimal(years);

  // A = P * (1 + r/n)^(n*t)
  const base = new Decimal(1).plus(r.dividedBy(n));
  const exponent = n.times(t).toNumber();
  const futureValue = p.times(base.pow(exponent));
  const interestEarned = futureValue.minus(p);

  return {
    inputs: { principalUsd, annualInterestRatePercent, years, compoundsPerYear },
    outputs: {
      futureValueUsd: futureValue.toNumber(),
      totalInterestEarnedUsd: interestEarned.toNumber(),
      growthMultiplier: p.isZero() ? 0 : futureValue.dividedBy(p).toNumber(),
    },
    formula: 'A = P * (1 + r/n)^(n*t)',
    assumptions: ['Interest reinvested continuously according to compounding frequency'],
    warnings: [],
    breakdown: { interestEarned: interestEarned.toNumber() },
    executedAt: Date.now(),
  };
}

/** 8. Break-Even Calculator */
export function calculateGeneralBreakEven(
  fixedCostsUsd: DecimalValue,
  pricePerUnitUsd: DecimalValue,
  variableCostPerUnitUsd: DecimalValue,
): CalculationResult {
  const fixed = toDecimal(fixedCostsUsd);
  const price = toDecimal(pricePerUnitUsd);
  const varCost = toDecimal(variableCostPerUnitUsd);

  const contributionMargin = price.minus(varCost);
  const breakEvenUnits = contributionMargin.lessThanOrEqualTo(0)
    ? new Decimal(0)
    : fixed.dividedBy(contributionMargin);

  return {
    inputs: { fixedCostsUsd, pricePerUnitUsd, variableCostPerUnitUsd },
    outputs: {
      breakEvenUnits: breakEvenUnits.toNumber(),
      breakEvenRevenueUsd: breakEvenUnits.times(price).toNumber(),
      unitContributionMarginUsd: contributionMargin.toNumber(),
      isViable: contributionMargin.greaterThan(0),
    },
    formula: 'BreakEven Units = FixedCosts / (Price - VariableCost)',
    assumptions: ['Linear cost and revenue profiles'],
    warnings: contributionMargin.lessThanOrEqualTo(0)
      ? ['Price does not exceed variable cost.']
      : [],
    breakdown: { contributionMargin: contributionMargin.toNumber() },
    executedAt: Date.now(),
  };
}
