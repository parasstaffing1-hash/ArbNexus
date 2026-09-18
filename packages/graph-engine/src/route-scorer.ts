import Decimal from 'decimal.js';
import { GraphRoute, GraphRouteLeg, ProfitCheckpoint } from './types';

export class RouteScorer {
  public static readonly CAPITAL_CHECKPOINTS = [100, 500, 1000, 5000, 10000, 50000, 100000];

  /**
   * Evaluates end-to-end execution of a candidate path across trade sizes.
   * Simulates orderbook / DEX pool slippage per leg: slippage = 0.5 * (Capital / Liquidity)
   */
  static scoreAndOptimizeRoute(
    legs: GraphRouteLeg[],
    baseCapitalUsd: Decimal = new Decimal(10000),
  ): GraphRoute {
    if (legs.length === 0) {
      throw new Error('Cannot score route with empty legs');
    }

    const warnings: string[] = [];
    let bottleneckLiquidity = new Decimal(Infinity);
    let totalLatency = 0;
    let totalGas = new Decimal(0);

    for (const leg of legs) {
      const legLiq = leg.liquidityUsd ?? new Decimal(100000);
      if (legLiq.lt(bottleneckLiquidity)) {
        bottleneckLiquidity = legLiq;
      }
      if (leg.gasUsd) {
        totalGas = totalGas.plus(leg.gasUsd);
      }
      totalLatency += 20; // default 20ms per leg
    }

    // Evaluate standard checkpoints: $100, $500, $1k, $5k, $10k, $50k, $100k
    const profitCheckpoints: ProfitCheckpoint[] = this.CAPITAL_CHECKPOINTS.map((cap) => {
      const capDec = new Decimal(cap);
      const evalResult = this.simulateLegExecution(legs, capDec);
      const netProfit = evalResult.finalCapital.minus(capDec).minus(totalGas);
      const grossProfit = evalResult.grossFinalCapital.minus(capDec);
      const roiPercent = capDec.isZero() ? 0 : netProfit.div(capDec).mul(100).toNumber();
      const isExecutable = netProfit.gt(0) && capDec.lte(bottleneckLiquidity.mul('0.2')); // max 20% pool depth

      return {
        capitalUsd: cap,
        grossProfitUsd: grossProfit.toNumber(),
        netProfitUsd: netProfit.toNumber(),
        roiPercent,
        isExecutable,
      };
    });

    // Base capital execution
    const baseEval = this.simulateLegExecution(legs, baseCapitalUsd);
    const netProfit = baseEval.finalCapital.minus(baseCapitalUsd).minus(totalGas);
    const roiPercent = baseCapitalUsd.isZero()
      ? new Decimal(0)
      : netProfit.div(baseCapitalUsd).mul(100);
    const grossMultiplier = baseEval.grossFinalCapital.div(baseCapitalUsd);

    // Optimal trade size occurs where marginal net profit peaks before quadratic slippage dominates
    const optimalCheckpoint = profitCheckpoints
      .filter((c) => c.isExecutable)
      .sort((a, b) => b.netProfitUsd - a.netProfitUsd)[0];
    const optimalSizeUsd = optimalCheckpoint
      ? new Decimal(optimalCheckpoint.capitalUsd)
      : baseCapitalUsd;

    // Max executable capital is capped at 10% of bottleneck depth
    const maxExecutableCapitalUsd = bottleneckLiquidity.mul('0.10');

    const routeHash = `route-${legs.map((l) => `${l.fromAsset}->${l.toAsset}@${l.venue}`).join('|')}`;
    const isExecutable = netProfit.gt(0) && baseCapitalUsd.lte(maxExecutableCapitalUsd);

    if (baseCapitalUsd.gt(maxExecutableCapitalUsd)) {
      warnings.push(
        `Trade capital ($${baseCapitalUsd}) exceeds safe executable threshold ($${maxExecutableCapitalUsd.toFixed(2)})`,
      );
    }
    if (netProfit.lte(0)) {
      warnings.push('Net profit after fees, gas, and slippage is non-positive');
    }

    return {
      legs: baseEval.executedLegs,
      startAsset: legs[0].fromAsset,
      endAsset: legs[legs.length - 1].toAsset,
      initialAmount: baseCapitalUsd,
      finalAmount: baseEval.finalCapital,
      grossMultiplier,
      netProfit,
      roiPercent,
      totalFeesUsd: baseEval.totalFees,
      totalGasUsd: totalGas,
      totalSlippageUsd: baseEval.totalSlippage,
      bottleneckLiquidityUsd: bottleneckLiquidity,
      maxExecutableCapitalUsd,
      optimalSizeUsd,
      profitCheckpoints,
      totalLatencyMs: totalLatency,
      routeHash,
      isExecutable,
      warnings,
    };
  }

  private static simulateLegExecution(
    legs: GraphRouteLeg[],
    capitalUsd: Decimal,
  ): {
    finalCapital: Decimal;
    grossFinalCapital: Decimal;
    totalFees: Decimal;
    totalSlippage: Decimal;
    executedLegs: GraphRouteLeg[];
  } {
    let currentCapital = capitalUsd;
    let grossCapital = capitalUsd;
    let totalFees = new Decimal(0);
    let totalSlippage = new Decimal(0);
    const executedLegs: GraphRouteLeg[] = [];

    for (const leg of legs) {
      const legLiq = leg.liquidityUsd ?? new Decimal(100000);
      const feeRate = new Decimal(leg.feeBps).div(10000);
      const legFeeUsd = currentCapital.mul(feeRate);
      totalFees = totalFees.plus(legFeeUsd);

      // Slippage modeling: 0.5 * (Capital / Liquidity)
      const depthRatio = currentCapital.div(Decimal.max(1, legLiq));
      const slippageRate = depthRatio.mul('0.5'); // 50 bps slippage per 100% of depth
      const legSlippageUsd = currentCapital.mul(slippageRate);
      totalSlippage = totalSlippage.plus(legSlippageUsd);

      // Gross transformation: purely rate * capital
      grossCapital = grossCapital.mul(leg.rate);

      // Net transformation: rate * (1 - fee) * (1 - slippage) * capital
      const netMult = leg.rate
        .mul(new Decimal(1).minus(feeRate))
        .mul(new Decimal(1).minus(slippageRate));
      const legOutput = currentCapital.mul(netMult);

      executedLegs.push({
        ...leg,
        feeUsd: legFeeUsd,
        slippageUsd: legSlippageUsd,
        expectedOutput: legOutput,
      });

      currentCapital = legOutput;
    }

    return {
      finalCapital: currentCapital,
      grossFinalCapital: grossCapital,
      totalFees,
      totalSlippage,
      executedLegs,
    };
  }
}

export const RouteOptimizer = RouteScorer;
