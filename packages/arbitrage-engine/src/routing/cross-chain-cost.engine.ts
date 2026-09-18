import Decimal from 'decimal.js';

export interface CrossChainCostBreakdown {
  source_swap_fee: Decimal;
  destination_swap_fee: Decimal;
  source_gas: Decimal;
  destination_gas: Decimal;
  bridge_fee: Decimal;
  slippage: Decimal;
  price_impact: Decimal;
  transfer_time_seconds: number;
  total_cost_usd: Decimal;
  is_valid: boolean;
  cost_status: 'CONFIRMED' | 'COST_UNKNOWN';
  missing_cost_reasons: string[];
}

export interface CostEvaluationInput {
  tradeCapitalUsd: Decimal | number;
  sourceChain: string;
  destChain: string;
  sourceSwapFeeUsd?: Decimal | number;
  destSwapFeeUsd?: Decimal | number;
  sourceGasUsd?: Decimal | number;
  destGasUsd?: Decimal | number;
  bridgeFeeUsd?: Decimal | number;
  slippageUsd?: Decimal | number;
  priceImpactUsd?: Decimal | number;
  transferTimeSeconds?: number;
}

export class CrossChainCostEngine {
  /**
   * Evaluates and aggregates all cross-chain costs.
   * Emits COST_UNKNOWN and marks is_valid = false if any mandatory component cannot be determined.
   */
  static evaluateCosts(input: CostEvaluationInput): CrossChainCostBreakdown {
    const missing: string[] = [];

    if (input.sourceGasUsd === undefined || input.sourceGasUsd === null) {
      missing.push('Source network gas cost is unknown');
    }
    if (input.destGasUsd === undefined || input.destGasUsd === null) {
      missing.push('Destination network gas cost is unknown');
    }
    if (input.bridgeFeeUsd === undefined || input.bridgeFeeUsd === null) {
      missing.push('Bridge protocol fee is unknown');
    }

    if (missing.length > 0) {
      return {
        source_swap_fee: new Decimal(0),
        destination_swap_fee: new Decimal(0),
        source_gas: new Decimal(0),
        destination_gas: new Decimal(0),
        bridge_fee: new Decimal(0),
        slippage: new Decimal(0),
        price_impact: new Decimal(0),
        transfer_time_seconds: 0,
        total_cost_usd: new Decimal(0),
        is_valid: false,
        cost_status: 'COST_UNKNOWN',
        missing_cost_reasons: missing,
      };
    }

    const srcSwapFee = new Decimal(input.sourceSwapFeeUsd ?? 0);
    const dstSwapFee = new Decimal(input.destSwapFeeUsd ?? 0);
    const srcGas = new Decimal(input.sourceGasUsd!);
    const dstGas = new Decimal(input.destGasUsd!);
    const bridgeFee = new Decimal(input.bridgeFeeUsd!);
    const slippage = new Decimal(input.slippageUsd ?? 0);
    const priceImpact = new Decimal(input.priceImpactUsd ?? 0);
    const transferTime = input.transferTimeSeconds ?? 180;

    const totalCost = srcSwapFee
      .plus(dstSwapFee)
      .plus(srcGas)
      .plus(dstGas)
      .plus(bridgeFee)
      .plus(slippage)
      .plus(priceImpact);

    return {
      source_swap_fee: srcSwapFee,
      destination_swap_fee: dstSwapFee,
      source_gas: srcGas,
      destination_gas: dstGas,
      bridge_fee: bridgeFee,
      slippage,
      price_impact: priceImpact,
      transfer_time_seconds: transferTime,
      total_cost_usd: totalCost,
      is_valid: true,
      cost_status: 'CONFIRMED',
      missing_cost_reasons: [],
    };
  }
}
