import Decimal from 'decimal.js';

export interface FlashLoanSimulationParams {
  provider: 'AAVE_V3' | 'BALANCER' | 'UNISWAP_V3_FLASH';
  chain: string;
  borrowAsset: string;
  borrowAmountUsd: Decimal | number;
  expectedGrossReturnUsd: Decimal | number;
  dexSwapFeesUsd: Decimal | number;
  gasCostUsd: Decimal | number;
  priceImpactUsd: Decimal | number;
}

export interface FlashLoanSimulationResult {
  provider: string;
  borrowAmountUsd: Decimal;
  flashLoanFeeBps: number;
  flashLoanFeeUsd: Decimal;
  dexSwapFeesUsd: Decimal;
  gasCostUsd: Decimal;
  priceImpactUsd: Decimal;
  totalCostsUsd: Decimal;
  grossProfitUsd: Decimal;
  netProfitUsd: Decimal;
  netRoiPercent: Decimal;
  isProfitable: boolean;
  simulationStatus: 'SUCCESS' | 'REVERT_UNPROFITABLE' | 'EXCEEDS_CAPACITY';
  revertReason?: string;
}

export class FlashLoanSimulator {
  /**
   * Flash-loan protocol fee schedules:
   * Aave V3: 5 bps (0.05%)
   * Balancer: 0 bps (0.00%)
   * Uniswap V3 Flash: fee tier of pool (e.g. 5 bps or 30 bps)
   */
  static getProtocolFeeBps(provider: FlashLoanSimulationParams['provider']): number {
    switch (provider) {
      case 'BALANCER':
        return 0;
      case 'AAVE_V3':
        return 5; // 0.05%
      case 'UNISWAP_V3_FLASH':
        return 5; // 0.05%
    }
  }

  /**
   * Simulates Borrow -> Multi-DEX Arbitrage -> Repay flow in memory.
   */
  static simulate(params: FlashLoanSimulationParams): FlashLoanSimulationResult {
    const borrow = new Decimal(params.borrowAmountUsd);
    const grossReturn = new Decimal(params.expectedGrossReturnUsd);
    const feeBps = this.getProtocolFeeBps(params.provider);

    // Flash-loan fee
    const flashLoanFee = borrow.mul(feeBps).div(10000);

    const dexFees = new Decimal(params.dexSwapFeesUsd);
    const gas = new Decimal(params.gasCostUsd);
    const priceImpact = new Decimal(params.priceImpactUsd);

    const totalCosts = flashLoanFee.plus(dexFees).plus(gas).plus(priceImpact);
    const grossProfit = grossReturn.minus(borrow);
    const netProfit = grossProfit.minus(totalCosts);
    const netRoi = borrow.isZero() ? new Decimal(0) : netProfit.div(borrow).mul(100);

    const isProfitable = netProfit.gt(0);

    return {
      provider: params.provider,
      borrowAmountUsd: borrow,
      flashLoanFeeBps: feeBps,
      flashLoanFeeUsd: flashLoanFee,
      dexSwapFeesUsd: dexFees,
      gasCostUsd: gas,
      priceImpactUsd: priceImpact,
      totalCostsUsd: totalCosts,
      grossProfitUsd: grossProfit,
      netProfitUsd: netProfit,
      netRoiPercent: netRoi,
      isProfitable,
      simulationStatus: isProfitable ? 'SUCCESS' : 'REVERT_UNPROFITABLE',
      revertReason: isProfitable
        ? undefined
        : 'Flash-loan proceeds insufficient to cover principal and fees',
    };
  }
}
