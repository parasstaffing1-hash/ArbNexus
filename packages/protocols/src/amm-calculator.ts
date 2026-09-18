import Decimal from 'decimal.js';

export interface SwapHop {
  reserveIn: Decimal;
  reserveOut: Decimal;
  feeBps: number;
}

export interface MultiHopResult {
  finalAmountOut: Decimal;
  intermediateAmounts: Decimal[];
  totalEffectiveFeeBps: number;
  cumulativePriceImpactBps: number;
}

/**
 * 1. Constant-Product AMM Calculator (x * y = k)
 */
export class AMMCalculator {
  /**
   * Calculates token output for a constant product swap:
   * out = (dx * (1 - fee) * y) / (x + dx * (1 - fee))
   */
  static getAmountOut(
    amountIn: Decimal,
    reserveIn: Decimal,
    reserveOut: Decimal,
    feeBps: number = 30,
  ): Decimal {
    if (amountIn.lte(0) || reserveIn.lte(0) || reserveOut.lte(0)) {
      return new Decimal(0);
    }
    const feeMult = new Decimal(10000 - feeBps);
    const amountInWithFee = amountIn.mul(feeMult);
    const numerator = amountInWithFee.mul(reserveOut);
    const denominator = reserveIn.mul(10000).plus(amountInWithFee);
    return numerator.div(denominator);
  }

  /**
   * Calculates required input token for an exact target output:
   * dx = (x * dy * 10000) / ((y - dy) * (10000 - fee)) + 1
   */
  static getAmountIn(
    amountOut: Decimal,
    reserveIn: Decimal,
    reserveOut: Decimal,
    feeBps: number = 30,
  ): Decimal {
    if (amountOut.lte(0) || reserveIn.lte(0) || reserveOut.lte(amountOut)) {
      return new Decimal(Infinity);
    }
    const numerator = reserveIn.mul(amountOut).mul(10000);
    const denominator = reserveOut.minus(amountOut).mul(10000 - feeBps);
    return numerator.div(denominator);
  }

  /**
   * Executes a deterministic multi-hop swap through sequential liquidity pools.
   */
  static calculateMultiHop(amountIn: Decimal, hops: SwapHop[]): MultiHopResult {
    let currentAmount = amountIn;
    const intermediate: Decimal[] = [currentAmount];
    let cumulativeFeeRate = new Decimal(1);

    for (const hop of hops) {
      currentAmount = this.getAmountOut(currentAmount, hop.reserveIn, hop.reserveOut, hop.feeBps);
      intermediate.push(currentAmount);
      cumulativeFeeRate = cumulativeFeeRate.mul(new Decimal(10000 - hop.feeBps).div(10000));
    }

    const totalFeeBps = new Decimal(1).minus(cumulativeFeeRate).mul(10000).toNumber();

    return {
      finalAmountOut: currentAmount,
      intermediateAmounts: intermediate,
      totalEffectiveFeeBps: totalFeeBps,
      cumulativePriceImpactBps: Math.min(500, hops.length * 5),
    };
  }

  /**
   * Instantaneous spot price (units of tokenOut per tokenIn).
   */
  static getSpotPrice(reserveIn: Decimal, reserveOut: Decimal): Decimal {
    if (reserveIn.lte(0)) return new Decimal(0);
    return reserveOut.div(reserveIn);
  }
}

/**
 * 2. Concentrated Liquidity Calculator (Uniswap V3 / Raydium CLMM)
 */
export class ConcentratedLiquidityCalculator {
  private static readonly Q96 = new Decimal(2).pow(96);
  private static readonly BASE_TICK = new Decimal('1.0001');

  /**
   * Converts tick index to price: P = 1.0001^tick
   */
  static tickToPrice(tick: number): Decimal {
    return this.BASE_TICK.pow(tick);
  }

  /**
   * Converts price to nearest integer tick: tick = floor(ln(P) / ln(1.0001))
   */
  static priceToTick(price: Decimal): number {
    if (price.lte(0)) return 0;
    const lnP = Decimal.ln(price);
    const lnBase = Decimal.ln(this.BASE_TICK);
    return lnP.div(lnBase).floor().toNumber();
  }

  /**
   * Converts tick to sqrtPriceX96: sqrtPriceX96 = sqrt(1.0001^tick) * 2^96
   */
  static tickToSqrtPriceX96(tick: number): Decimal {
    const price = this.tickToPrice(tick);
    return price.sqrt().mul(this.Q96).floor();
  }

  /**
   * Converts sqrtPriceX96 to price: P = (sqrtPriceX96 / 2^96)^2
   */
  static sqrtPriceX96ToPrice(sqrtPriceX96: Decimal): Decimal {
    const ratio = sqrtPriceX96.div(this.Q96);
    return ratio.pow(2);
  }

  /**
   * Calculates required liquidity L given amounts and price boundaries [sqrtRatioA, sqrtRatioB].
   */
  static getLiquidityForAmounts(
    sqrtPriceCurrent: Decimal,
    sqrtRatioA: Decimal,
    sqrtRatioB: Decimal,
    amount0: Decimal,
    amount1: Decimal,
  ): Decimal {
    let lower = sqrtRatioA;
    let upper = sqrtRatioB;
    if (lower.gt(upper)) [lower, upper] = [upper, lower];

    if (sqrtPriceCurrent.lte(lower)) {
      // Entire position is in token0
      return amount0.mul(lower).mul(upper).div(upper.minus(lower));
    } else if (sqrtPriceCurrent.lt(upper)) {
      // Position contains both token0 and token1
      const l0 = amount0.mul(sqrtPriceCurrent).mul(upper).div(upper.minus(sqrtPriceCurrent));
      const l1 = amount1.div(sqrtPriceCurrent.minus(lower));
      return Decimal.min(l0, l1);
    } else {
      // Entire position is in token1
      return amount1.div(upper.minus(lower));
    }
  }

  /**
   * Computes single swap step inside tick range.
   */
  static computeSwapStep(
    sqrtPriceCurrent: Decimal,
    sqrtPriceTarget: Decimal,
    liquidity: Decimal,
    amountRemaining: Decimal,
    feeBps: number = 30,
  ): { sqrtPriceNext: Decimal; amountIn: Decimal; amountOut: Decimal; feeAmount: Decimal } {
    const feeMult = new Decimal(10000 - feeBps).div(10000);
    const amountInWithFee = amountRemaining.mul(feeMult);

    // Simplified swap step: moves price toward target
    const deltaPrice = amountInWithFee.div(liquidity.plus(1));
    const sqrtPriceNext = Decimal.min(sqrtPriceTarget, sqrtPriceCurrent.plus(deltaPrice));

    const amountIn = sqrtPriceNext.minus(sqrtPriceCurrent).mul(liquidity);
    const amountOut = amountIn.mul('0.997');
    const feeAmount = amountIn.mul(feeBps).div(10000);

    return { sqrtPriceNext, amountIn, amountOut, feeAmount };
  }
}

/**
 * 3. Price Impact Calculator
 */
export class PriceImpactCalculator {
  /**
   * Constant product price impact = 1 - (effectivePrice / spotPrice)
   */
  static calculateConstantProductImpact(
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

  /**
   * Approximates depth-weighted impact for concentrated liquidity or aggregator quotes.
   */
  static calculateDepthWeightedImpact(
    tradeAmountUsd: Decimal,
    poolDepthUsd: Decimal,
    slopeFactor: number = 1.0,
  ): Decimal {
    if (poolDepthUsd.lte(0)) return new Decimal('1.0'); // 100% impact if empty
    const ratio = tradeAmountUsd.div(poolDepthUsd);
    const impact = ratio.mul(slopeFactor);
    return Decimal.min(1, impact);
  }
}

/**
 * 4. Swap Fee Calculator
 */
export class SwapFeeCalculator {
  static getStandardFeeBps(tier: 'ULTRA_STABLE' | 'STABLE' | 'STANDARD' | 'EXOTIC'): number {
    switch (tier) {
      case 'ULTRA_STABLE':
        return 1; // 0.01% (Curve / Uniswap 1 bps)
      case 'STABLE':
        return 5; // 0.05%
      case 'STANDARD':
        return 30; // 0.30%
      case 'EXOTIC':
        return 100; // 1.00%
    }
  }

  static calculateFee(amount: Decimal, feeBps: number): Decimal {
    return amount.mul(feeBps).div(10000);
  }

  static deductFee(amount: Decimal, feeBps: number): Decimal {
    return amount.mul(10000 - feeBps).div(10000);
  }
}
