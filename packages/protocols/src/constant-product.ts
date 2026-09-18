import Decimal from 'decimal.js';

export class ConstantProductMath {
  /**
   * Standard Uniswap v2 getAmountOut formula:
   * out = (dx * (1 - fee) * y) / (x + dx * (1 - fee))
   */
  static getAmountOut(
    amountIn: Decimal,
    reserveIn: Decimal,
    reserveOut: Decimal,
    feeBps: number = 30, // 0.30%
  ): Decimal {
    if (amountIn.lte(0) || reserveIn.lte(0) || reserveOut.lte(0)) {
      return new Decimal(0);
    }
    const feeMultiplier = new Decimal(10000 - feeBps);
    const amountInWithFee = amountIn.mul(feeMultiplier);
    const numerator = amountInWithFee.mul(reserveOut);
    const denominator = reserveIn.mul(10000).plus(amountInWithFee);
    return numerator.div(denominator);
  }

  /**
   * Computes spot price impact:
   * impact = 1 - (effectivePrice / spotPrice)
   */
  static getPriceImpact(
    amountIn: Decimal,
    amountOut: Decimal,
    reserveIn: Decimal,
    reserveOut: Decimal,
  ): Decimal {
    if (amountIn.lte(0) || reserveIn.lte(0) || reserveOut.lte(0)) {
      return new Decimal(0);
    }
    const spotPrice = reserveOut.div(reserveIn);
    const effectivePrice = amountOut.div(amountIn);
    const impact = new Decimal(1).minus(effectivePrice.div(spotPrice));
    return Decimal.max(0, impact);
  }
}
