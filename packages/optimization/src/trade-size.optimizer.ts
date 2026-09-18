import Decimal from 'decimal.js';

export interface ProfitCurvePoint {
  sizeUsd: number;
  grossProfitUsd: number;
  feeUsd: number;
  slippageUsd: number;
  netProfitUsd: number;
  roiPercent: number;
}

export class TradeSizeOptimizer {
  /**
   * Finds the trade size that maximizes Net Profit = Size * (Spread - Fee) - Slippage(Size)
   * With linear slippage model: Slippage(Size) = gamma * Size^2
   * Max profit occurs at Size* = (Spread - Fee) / (2 * gamma)
   */
  static optimizeTradeSize(
    grossSpreadPercent: Decimal,
    totalFeePercent: Decimal,
    slippageFactorGamma: Decimal = new Decimal('0.000005'),
    maxLiquidityUsd: Decimal = new Decimal('100000'),
    minOrderSizeUsd: Decimal = new Decimal('10'),
  ): {
    optimalSizeUsd: Decimal;
    maxNetProfitUsd: Decimal;
    expectedRoiPercent: Decimal;
    profitCurve: ProfitCurvePoint[];
  } {
    const netMargin = grossSpreadPercent.minus(totalFeePercent);

    if (netMargin.lte(0)) {
      return {
        optimalSizeUsd: new Decimal(0),
        maxNetProfitUsd: new Decimal(0),
        expectedRoiPercent: new Decimal(0),
        profitCurve: [],
      };
    }

    // Derivative d(Profit)/d(Size) = netMargin - 2 * gamma * Size = 0
    const rawOptimalSize = netMargin.div(slippageFactorGamma.mul(2));
    const cappedOptimal = Decimal.min(rawOptimalSize, maxLiquidityUsd);
    const optimalSizeUsd = Decimal.max(minOrderSizeUsd, cappedOptimal);

    const slippageCost = slippageFactorGamma.mul(optimalSizeUsd.pow(2));
    const grossProfit = optimalSizeUsd.mul(grossSpreadPercent);
    const totalFeeCost = optimalSizeUsd.mul(totalFeePercent);
    const maxNetProfitUsd = grossProfit.minus(totalFeeCost).minus(slippageCost);
    const expectedRoiPercent = optimalSizeUsd.isZero()
      ? new Decimal(0)
      : maxNetProfitUsd.div(optimalSizeUsd).mul(100);

    // Generate analytical profit curve across 10 capital checkpoints
    const profitCurve = this.generateProfitCurve(
      grossSpreadPercent,
      totalFeePercent,
      slippageFactorGamma,
      maxLiquidityUsd,
    );

    return {
      optimalSizeUsd,
      maxNetProfitUsd,
      expectedRoiPercent,
      profitCurve,
    };
  }

  /**
   * Generates a discrete trade size vs. net profit curve for chart visualization.
   */
  static generateProfitCurve(
    grossSpreadPercent: Decimal,
    totalFeePercent: Decimal,
    slippageFactorGamma: Decimal,
    maxLiquidityUsd: Decimal,
    steps: number = 10,
  ): ProfitCurvePoint[] {
    const points: ProfitCurvePoint[] = [];
    const stepSize = maxLiquidityUsd.div(steps);

    for (let i = 1; i <= steps; i++) {
      const size = stepSize.mul(i);
      const grossProfit = size.mul(grossSpreadPercent);
      const feeCost = size.mul(totalFeePercent);
      const slippage = slippageFactorGamma.mul(size.pow(2));
      const netProfit = grossProfit.minus(feeCost).minus(slippage);
      const roi = size.isZero() ? 0 : netProfit.div(size).mul(100).toNumber();

      points.push({
        sizeUsd: size.toNumber(),
        grossProfitUsd: grossProfit.toNumber(),
        feeUsd: feeCost.toNumber(),
        slippageUsd: slippage.toNumber(),
        netProfitUsd: netProfit.toNumber(),
        roiPercent: roi,
      });
    }

    return points;
  }
}
