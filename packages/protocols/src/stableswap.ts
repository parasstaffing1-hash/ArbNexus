import Decimal from 'decimal.js';

export class StableSwapMath {
  /**
   * Approximate Curve-style StableSwap output calculation:
   * Uses amplification coefficient A to determine slippage near 1.0 peg.
   */
  static getAmountOut(
    amountIn: Decimal,
    reserveIn: Decimal,
    reserveOut: Decimal,
    amplificationA: number = 100,
    feeBps: number = 4, // 0.04%
  ): Decimal {
    if (amountIn.lte(0) || reserveIn.lte(0) || reserveOut.lte(0)) {
      return new Decimal(0);
    }
    // High A means very flat curve (near linear exchange)
    const feeMult = new Decimal(10000 - feeBps).div(10000);
    const amountInWithFee = amountIn.mul(feeMult);

    // Approximate stable swap slope
    const a = new Decimal(amplificationA);
    const totalReserves = reserveIn.plus(reserveOut);
    const deviation = reserveIn.minus(reserveOut).abs().div(totalReserves);

    // If balanced, output is close to 1:1 minus fee and minimal curvature
    const curvature = deviation.div(a.mul(2));
    const effectiveRate = new Decimal(1).minus(curvature);

    return amountInWithFee.mul(effectiveRate);
  }
}
