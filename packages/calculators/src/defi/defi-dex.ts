import Decimal from 'decimal.js';
import { toDecimal, DecimalValue } from '../shared/primitives';
import { CalculationResult } from '../shared/types';

/** 1. DEX Swap Cost Calculator */
export function calculateDexSwapCost(
  swapAmountUsd: DecimalValue,
  lpFeePercent: DecimalValue = '0.3', // Uniswap standard 0.3%
  gasCostUsd: DecimalValue = '1.50',
): CalculationResult {
  const amount = toDecimal(swapAmountUsd);
  const lpFee = amount.times(toDecimal(lpFeePercent).dividedBy(100));
  const gas = toDecimal(gasCostUsd);
  const total = lpFee.plus(gas);

  return {
    inputs: { swapAmountUsd, lpFeePercent, gasCostUsd },
    outputs: {
      totalSwapCostUsd: total.toNumber(),
      protocolLpFeeUsd: lpFee.toNumber(),
      networkGasCostUsd: gas.toNumber(),
      costDragPercent: amount.isZero() ? 0 : total.dividedBy(amount).times(100).toNumber(),
    },
    formula: 'Total Cost = (Amount * LP_Fee%) + Gas_Cost',
    assumptions: ['Single-hop Uniswap/Raydium automated market maker trade'],
    warnings: [],
    breakdown: { lpFeeUsd: lpFee.toNumber(), gasUsd: gas.toNumber() },
    executedAt: Date.now(),
  };
}

/** 2. AMM Price Impact Calculator (Constant Product: x * y = k) */
export function calculateAmmPriceImpact(
  tokenInReserve: DecimalValue,
  tokenOutReserve: DecimalValue,
  tokenInAmount: DecimalValue,
  feePercent: DecimalValue = '0.3',
): CalculationResult {
  const x = toDecimal(tokenInReserve);
  const y = toDecimal(tokenOutReserve);
  const dx = toDecimal(tokenInAmount);
  const fee = toDecimal(feePercent).dividedBy(100);

  // Initial spot price: P0 = y / x
  const p0 = x.isZero() ? new Decimal(0) : y.dividedBy(x);

  // dy = (y * dx * (1 - fee)) / (x + dx * (1 - fee))
  const dxWithFee = dx.times(new Decimal(1).minus(fee));
  const denominator = x.plus(dxWithFee);
  const dy = denominator.isZero() ? new Decimal(0) : y.times(dxWithFee).dividedBy(denominator);

  // Effective execution price: P_exec = dy / dx
  const pExec = dx.isZero() ? new Decimal(0) : dy.dividedBy(dx);

  // Price impact = (P0 - P_exec) / P0 * 100%
  const priceImpactPercent = p0.isZero()
    ? new Decimal(0)
    : p0.minus(pExec).dividedBy(p0).times(100);

  return {
    inputs: { tokenInReserve, tokenOutReserve, tokenInAmount, feePercent },
    outputs: {
      initialSpotPrice: p0.toNumber(),
      effectiveExecutionPrice: pExec.toNumber(),
      tokensOutReceived: dy.toNumber(),
      priceImpactPercent: Math.max(0, priceImpactPercent.toNumber()),
    },
    formula:
      'dy = (y * dx * (1-fee)) / (x + dx*(1-fee)); Price Impact = (P_spot - P_exec) / P_spot',
    assumptions: ['Uniswap v2 / CPMM constant product invariant x * y = k'],
    warnings: priceImpactPercent.greaterThan(2) ? ['High AMM price impact (> 2%).'] : [],
    breakdown: { tokensOut: dy.toNumber() },
    executedAt: Date.now(),
  };
}

/** 3. LP Profit Calculator */
export function calculateLpProfit(
  initialDepositUsd: DecimalValue,
  feeIncomeUsd: DecimalValue,
  impermanentLossPercent: DecimalValue,
): CalculationResult {
  const initial = toDecimal(initialDepositUsd);
  const fees = toDecimal(feeIncomeUsd);
  const ilPct = toDecimal(impermanentLossPercent).dividedBy(100);

  // Value lost to IL = initial * ilPct
  const ilCostUsd = initial.times(ilPct);
  const netProfitUsd = fees.minus(ilCostUsd);
  const netYieldPercent = initial.isZero()
    ? new Decimal(0)
    : netProfitUsd.dividedBy(initial).times(100);

  return {
    inputs: { initialDepositUsd, feeIncomeUsd, impermanentLossPercent },
    outputs: {
      netLpProfitUsd: netProfitUsd.toNumber(),
      impermanentLossUsd: ilCostUsd.toNumber(),
      feeIncomeUsd: fees.toNumber(),
      netYieldPercent: netYieldPercent.toNumber(),
      isProfitable: netProfitUsd.greaterThan(0),
    },
    formula: 'Net LP Profit = Fee_Income - (Initial_Deposit * IL%)',
    assumptions: ['Trading fee yield offsets impermanent loss over the holding period'],
    warnings: netProfitUsd.lessThan(0)
      ? ['Impermanent loss exceeds collected LP trading fees.']
      : [],
    breakdown: { feeIncomeUsd: fees.toNumber(), ilCostUsd: ilCostUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 4. Impermanent Loss Calculator */
export function calculateImpermanentLoss(priceRatio: DecimalValue): CalculationResult {
  // Price ratio k = P_after / P_before
  const k = toDecimal(priceRatio);

  // Standard Uniswap IL formula: IL = (2 * sqrt(k)) / (1 + k) - 1
  if (k.isZero() || k.isNegative()) {
    return {
      inputs: { priceRatio },
      outputs: { impermanentLossPercent: 100 },
      formula: 'IL = (2 * sqrt(k)) / (1 + k) - 1',
      assumptions: ['50/50 weighted liquidity pool'],
      warnings: ['Asset price went to zero (100% loss).'],
      breakdown: {},
      executedAt: Date.now(),
    };
  }

  const sqrtK = k.sqrt();
  const numerator = sqrtK.times(2);
  const denominator = new Decimal(1).plus(k);
  const ilFraction = numerator.dividedBy(denominator).minus(1);
  const ilPercent = ilFraction.abs().times(100); // Expressed as positive % loss

  return {
    inputs: { priceRatio },
    outputs: {
      impermanentLossPercent: ilPercent.toNumber(),
      lpValueVersusHoldRatio: numerator.dividedBy(denominator).toNumber(),
    },
    formula: 'IL % = (1 - (2 * sqrt(k)) / (1 + k)) * 100%',
    assumptions: ['Standard 50/50 dual-token AMM without range concentration'],
    warnings: ilPercent.greaterThan(5.0) ? ['Significant divergence loss (> 5%).'] : [],
    breakdown: { priceRatio: k.toNumber() },
    executedAt: Date.now(),
  };
}

/** 5. Liquidity Provision Calculator */
export function calculateLiquidityProvision(
  tokenAAmount: DecimalValue,
  tokenAPriceUsd: DecimalValue,
  tokenBAmount: DecimalValue,
  tokenBPriceUsd: DecimalValue,
): CalculationResult {
  const aAmt = toDecimal(tokenAAmount);
  const aPrice = toDecimal(tokenAPriceUsd);
  const bAmt = toDecimal(tokenBAmount);
  const bPrice = toDecimal(tokenBPriceUsd);

  const aVal = aAmt.times(aPrice);
  const bVal = bAmt.times(bPrice);
  const totalVal = aVal.plus(bVal);

  return {
    inputs: { tokenAAmount, tokenAPriceUsd, tokenBAmount, tokenBPriceUsd },
    outputs: {
      totalLiquidityUsd: totalVal.toNumber(),
      tokenAValueUsd: aVal.toNumber(),
      tokenBValueUsd: bVal.toNumber(),
      ratioA: totalVal.isZero() ? 0 : aVal.dividedBy(totalVal).times(100).toNumber(),
      ratioB: totalVal.isZero() ? 0 : bVal.dividedBy(totalVal).times(100).toNumber(),
    },
    formula: 'Liquidity = (Amount_A * Price_A) + (Amount_B * Price_B)',
    assumptions: ['Dual-sided liquidity deposit'],
    warnings: aVal.minus(bVal).abs().greaterThan(totalVal.times('0.05'))
      ? ['Pool ratio is unbalanced (> 5% deviation from 50/50).']
      : [],
    breakdown: { aValUsd: aVal.toNumber(), bValUsd: bVal.toNumber() },
    executedAt: Date.now(),
  };
}

/** 6. LP Break-Even Calculator */
export function calculateLpBreakEven(
  poolAprPercent: DecimalValue, // e.g. 24% APR from swap fees
  expectedPriceChangePercent: DecimalValue, // e.g. 50% increase
): CalculationResult {
  const apr = toDecimal(poolAprPercent).dividedBy(100);
  const priceChange = toDecimal(expectedPriceChangePercent).dividedBy(100);
  const k = new Decimal(1).plus(priceChange);

  // IL = 1 - (2*sqrt(k))/(1+k)
  const ilFraction = new Decimal(1).minus(k.sqrt().times(2).dividedBy(new Decimal(1).plus(k)));
  const dailyFeeRate = apr.dividedBy(365);

  // Days to break even = IL / DailyFeeRate
  const daysToBreakEven = dailyFeeRate.isZero() ? 0 : ilFraction.dividedBy(dailyFeeRate).toNumber();

  return {
    inputs: { poolAprPercent, expectedPriceChangePercent },
    outputs: {
      impermanentLossPercent: ilFraction.times(100).toNumber(),
      daysToBreakEven: Math.max(0, daysToBreakEven),
      dailyYieldPercent: dailyFeeRate.times(100).toNumber(),
    },
    formula: 'BreakEven Days = IL_Fraction / (Pool_APR / 365)',
    assumptions: ['Continuous average trading volume generating consistent LP fee yield'],
    warnings: daysToBreakEven > 365 ? ['Break-even horizon exceeds 1 full year.'] : [],
    breakdown: { ilPercent: ilFraction.times(100).toNumber() },
    executedAt: Date.now(),
  };
}

/** 7. DEX Arbitrage Calculator */
export function calculateDexArbitrage(
  dex1PriceUsd: DecimalValue,
  dex2PriceUsd: DecimalValue,
  tradeVolumeUsd: DecimalValue,
  gas1Usd: DecimalValue = '1.0',
  gas2Usd: DecimalValue = '1.0',
  feeRate1Percent: DecimalValue = '0.3',
  feeRate2Percent: DecimalValue = '0.3',
): CalculationResult {
  const p1 = toDecimal(dex1PriceUsd);
  const p2 = toDecimal(dex2PriceUsd);
  const vol = toDecimal(tradeVolumeUsd);

  // Buy on lower, sell on higher
  const isBuyOn1 = p1.lessThan(p2);
  const pBuy = isBuyOn1 ? p1 : p2;
  const pSell = isBuyOn1 ? p2 : p1;

  const grossSpread = pBuy.isZero() ? new Decimal(0) : pSell.minus(pBuy).dividedBy(pBuy);
  const grossProfit = vol.times(grossSpread);

  const swapFee1 = vol.times(toDecimal(feeRate1Percent).dividedBy(100));
  const swapFee2 = vol.times(toDecimal(feeRate2Percent).dividedBy(100));
  const totalGas = toDecimal(gas1Usd).plus(toDecimal(gas2Usd));

  const totalCosts = swapFee1.plus(swapFee2).plus(totalGas);
  const netProfit = grossProfit.minus(totalCosts);

  return {
    inputs: { dex1PriceUsd, dex2PriceUsd, tradeVolumeUsd, gas1Usd, gas2Usd },
    outputs: {
      grossProfitUsd: grossProfit.toNumber(),
      totalCostsUsd: totalCosts.toNumber(),
      netProfitUsd: netProfit.toNumber(),
      netSpreadPercent: vol.isZero() ? 0 : netProfit.dividedBy(vol).times(100).toNumber(),
      isProfitable: netProfit.greaterThan(0),
    },
    formula: 'Net = (Volume * Spread) - (DEX1_Fee + DEX2_Fee + Total_Gas)',
    assumptions: ['Atomic multi-call or bundle execution within the same block'],
    warnings: netProfit.lessThanOrEqualTo(0)
      ? ['Dual DEX swap fees + gas exceed price spread.']
      : [],
    breakdown: { grossProfitUsd: grossProfit.toNumber(), totalGasUsd: totalGas.toNumber() },
    executedAt: Date.now(),
  };
}

/** 8. Pool Price Difference Calculator */
export function calculatePoolPriceDifference(
  poolAPrice: DecimalValue,
  poolBPrice: DecimalValue,
): CalculationResult {
  const a = toDecimal(poolAPrice);
  const b = toDecimal(poolBPrice);
  const diff = a.minus(b).abs();
  const base = Decimal.min(a, b);
  const diffPct = base.isZero() ? new Decimal(0) : diff.dividedBy(base).times(100);

  return {
    inputs: { poolAPrice, poolBPrice },
    outputs: {
      absoluteDifference: diff.toNumber(),
      percentageDifference: diffPct.toNumber(),
    },
    formula: 'Difference % = (|P_A - P_B| / Min(P_A, P_B)) * 100%',
    assumptions: ['Direct comparative pool quotation'],
    warnings: [],
    breakdown: { poolAPrice: a.toNumber(), poolBPrice: b.toNumber() },
    executedAt: Date.now(),
  };
}

/** 9. Gas + Swap Cost Calculator */
export function calculateGasPlusSwapCost(
  tradeAmountUsd: DecimalValue,
  poolFeePercent: DecimalValue,
  gasUnits: DecimalValue,
  gasPriceGwei: DecimalValue,
  nativeTokenPriceUsd: DecimalValue,
): CalculationResult {
  const amount = toDecimal(tradeAmountUsd);
  const feePct = toDecimal(poolFeePercent).dividedBy(100);
  const swapFeeUsd = amount.times(feePct);

  // Gas cost = Units * Gwei * 1e-9 * Price
  const gasCostUsd = toDecimal(gasUnits)
    .times(toDecimal(gasPriceGwei))
    .times('1e-9')
    .times(toDecimal(nativeTokenPriceUsd));

  const totalCostUsd = swapFeeUsd.plus(gasCostUsd);

  return {
    inputs: { tradeAmountUsd, poolFeePercent, gasUnits, gasPriceGwei, nativeTokenPriceUsd },
    outputs: {
      totalCostUsd: totalCostUsd.toNumber(),
      swapFeeUsd: swapFeeUsd.toNumber(),
      gasCostUsd: gasCostUsd.toNumber(),
    },
    formula: 'Cost = (Trade * PoolFee%) + (GasUnits * Gwei * 1e-9 * P_native)',
    assumptions: ['On-chain EVM contract swap execution'],
    warnings: [],
    breakdown: { swapFeeUsd: swapFeeUsd.toNumber(), gasCostUsd: gasCostUsd.toNumber() },
    executedAt: Date.now(),
  };
}

/** 10. DEX vs CEX Arbitrage Calculator */
export function calculateDexVsCexArbitrage(
  dexPriceUsd: DecimalValue,
  cexPriceUsd: DecimalValue,
  tradeQuantity: DecimalValue,
  dexSwapFeePercent: DecimalValue = '0.3',
  cexFeePercent: DecimalValue = '0.075',
  dexGasCostUsd: DecimalValue = '2.50',
  cexWithdrawalFeeUsd: DecimalValue = '1.0',
): CalculationResult {
  const pDex = toDecimal(dexPriceUsd);
  const pCex = toDecimal(cexPriceUsd);
  const qty = toDecimal(tradeQuantity);

  const isBuyOnDex = pDex.lessThan(pCex);
  const pBuy = isBuyOnDex ? pDex : pCex;
  const pSell = isBuyOnDex ? pCex : pDex;

  const buyCapital = qty.times(pBuy);
  const sellProceeds = qty.times(pSell);

  const dexFee = isBuyOnDex
    ? buyCapital.times(toDecimal(dexSwapFeePercent).dividedBy(100))
    : sellProceeds.times(toDecimal(dexSwapFeePercent).dividedBy(100));

  const cexFee = !isBuyOnDex
    ? buyCapital.times(toDecimal(cexFeePercent).dividedBy(100))
    : sellProceeds.times(toDecimal(cexFeePercent).dividedBy(100));

  const totalCosts = dexFee
    .plus(cexFee)
    .plus(toDecimal(dexGasCostUsd))
    .plus(toDecimal(cexWithdrawalFeeUsd));

  const grossProfit = sellProceeds.minus(buyCapital);
  const netProfit = grossProfit.minus(totalCosts);

  return {
    inputs: { dexPriceUsd, cexPriceUsd, tradeQuantity },
    outputs: {
      routeDirection: isBuyOnDex ? 'BUY_DEX_SELL_CEX' : 'BUY_CEX_SELL_DEX',
      grossProfitUsd: grossProfit.toNumber(),
      totalCostsUsd: totalCosts.toNumber(),
      netProfitUsd: netProfit.toNumber(),
      netRoiPercent: buyCapital.isZero()
        ? 0
        : netProfit.dividedBy(buyCapital).times(100).toNumber(),
      isProfitable: netProfit.greaterThan(0),
    },
    formula: 'Net = Sell_Proceeds - Buy_Cost - (DEX_Fee + CEX_Fee + Gas + Withdrawal)',
    assumptions: ['Inventory available on both venues for spatial non-transfer execution'],
    warnings: netProfit.lessThanOrEqualTo(0)
      ? ['Exchange fee disparity wipes out price divergence.']
      : [],
    breakdown: { dexFeeUsd: dexFee.toNumber(), cexFeeUsd: cexFee.toNumber() },
    executedAt: Date.now(),
  };
}
