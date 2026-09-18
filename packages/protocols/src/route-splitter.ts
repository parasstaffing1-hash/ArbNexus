import Decimal from 'decimal.js';
import { ConstantProductMath } from './constant-product';

export interface PoolRouteOption {
  poolId: string;
  reserveIn: Decimal;
  reserveOut: Decimal;
  feeBps: number;
}

export class RouteSplitter {
  /**
   * Splits a total input amount across N parallel pools proportional to sqrt(reserveIn * reserveOut)
   * to minimize overall price impact.
   */
  static splitRoute(
    totalAmountIn: Decimal,
    pools: PoolRouteOption[],
  ): { poolId: string; amountIn: Decimal; expectedOut: Decimal }[] {
    if (pools.length === 0 || totalAmountIn.lte(0)) return [];

    if (pools.length === 1) {
      const out = ConstantProductMath.getAmountOut(
        totalAmountIn,
        pools[0].reserveIn,
        pools[0].reserveOut,
        pools[0].feeBps,
      );
      return [{ poolId: pools[0].poolId, amountIn: totalAmountIn, expectedOut: out }];
    }

    // Weight by depth = sqrt(reserveIn * reserveOut)
    const weights = pools.map((p) => p.reserveIn.mul(p.reserveOut).sqrt());
    const totalWeight = weights.reduce((acc, w) => acc.plus(w), new Decimal(0));

    return pools.map((p, idx) => {
      const fraction = weights[idx].div(totalWeight);
      const splitAmount = totalAmountIn.mul(fraction);
      const expectedOut = ConstantProductMath.getAmountOut(
        splitAmount,
        p.reserveIn,
        p.reserveOut,
        p.feeBps,
      );
      return {
        poolId: p.poolId,
        amountIn: splitAmount,
        expectedOut,
      };
    });
  }
}
