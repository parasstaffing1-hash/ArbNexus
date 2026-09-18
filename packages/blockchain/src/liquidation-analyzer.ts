import Decimal from 'decimal.js';

export interface LiquidationOpportunity {
  protocol: 'Aave V3' | 'Compound V3' | 'MakerDAO / Spark' | 'Morpho' | 'Solend';
  chain: string;
  userAddress: string;
  collateralAsset: string;
  debtAsset: string;
  healthFactor: string; // < 1.0 indicates liquidation eligible
  collateralAmount: string;
  debtToCover: string;
  liquidationBonusPercent: string; // e.g. 5% = 0.05
  estimatedGrossProfitUsd: string;
  estimatedGasCostUsd: string;
  estimatedNetProfitUsd: string;
  isExecutable: boolean;
}

export class LiquidationAnalyzer {
  /**
   * Analyzes a lending market liquidation candidate in simulation mode strictly.
   */
  static evaluateLiquidation(params: {
    protocol: LiquidationOpportunity['protocol'];
    chain: string;
    userAddress: string;
    collateralAsset: string;
    debtAsset: string;
    healthFactor: number;
    collateralUsd: number;
    debtUsd: number;
    bonusPercent: number; // e.g. 0.05 for 5% liquidation incentive
    gasCostUsd: number;
  }): LiquidationOpportunity {
    const isEligible = params.healthFactor < 1.0;
    const debtToCover = new Decimal(params.debtUsd).mul('0.5'); // Close factor typically 50%
    const bonus = new Decimal(params.bonusPercent);
    const grossProfitUsd = isEligible ? debtToCover.mul(bonus) : new Decimal(0);
    const gasUsd = new Decimal(params.gasCostUsd);
    const netProfitUsd = grossProfitUsd.minus(gasUsd);

    return {
      protocol: params.protocol,
      chain: params.chain,
      userAddress: params.userAddress,
      collateralAsset: params.collateralAsset,
      debtAsset: params.debtAsset,
      healthFactor: params.healthFactor.toFixed(4),
      collateralAmount: params.collateralUsd.toFixed(2),
      debtToCover: debtToCover.toFixed(2),
      liquidationBonusPercent: (params.bonusPercent * 100).toFixed(2) + '%',
      estimatedGrossProfitUsd: grossProfitUsd.toFixed(2),
      estimatedGasCostUsd: gasUsd.toFixed(2),
      estimatedNetProfitUsd: netProfitUsd.toFixed(2),
      isExecutable: isEligible && netProfitUsd.gt(0),
    };
  }
}
