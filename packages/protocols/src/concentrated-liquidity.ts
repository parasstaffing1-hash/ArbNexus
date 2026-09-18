import Decimal from 'decimal.js';

export class ConcentratedLiquidityMath {
  /**
   * Converts tick to price: P = 1.0001^tick
   */
  static tickToPrice(tick: number): Decimal {
    const base = new Decimal('1.0001');
    return base.pow(tick);
  }

  /**
   * Converts tick to sqrtPriceX96: sqrtPrice = sqrt(1.0001^tick) * 2^96
   */
  static tickToSqrtPriceX96(tick: number): Decimal {
    const price = this.tickToPrice(tick);
    const sqrtPrice = price.sqrt();
    const q96 = new Decimal(2).pow(96);
    return sqrtPrice.mul(q96).floor();
  }

  /**
   * Calculates liquidity amount for a given token0 delta within [sqrtRatioA, sqrtRatioB]:
   * L = deltaX * (sqrtA * sqrtB) / (sqrtB - sqrtA)
   */
  static getLiquidityForAmount0(
    sqrtRatioA: Decimal,
    sqrtRatioB: Decimal,
    amount0: Decimal,
  ): Decimal {
    let lower = sqrtRatioA;
    let upper = sqrtRatioB;
    if (lower.gt(upper)) {
      [lower, upper] = [upper, lower];
    }
    const numerator = amount0.mul(lower).mul(upper);
    const denominator = upper.minus(lower);
    return numerator.div(denominator);
  }

  /**
   * Calculates liquidity amount for a given token1 delta within [sqrtRatioA, sqrtRatioB]:
   * L = deltaY / (sqrtB - sqrtA)
   */
  static getLiquidityForAmount1(
    sqrtRatioA: Decimal,
    sqrtRatioB: Decimal,
    amount1: Decimal,
  ): Decimal {
    let lower = sqrtRatioA;
    let upper = sqrtRatioB;
    if (lower.gt(upper)) {
      [lower, upper] = [upper, lower];
    }
    return amount1.div(upper.minus(lower));
  }
}
