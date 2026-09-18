import Decimal from 'decimal.js';

export class HedgeOptimizer {
  /**
   * Calculates exact hedge size to achieve Delta-Neutral exposure (Delta = 0).
   * Given spot asset quantity and perpetual beta / contract multiplier:
   * Short Notional = Spot Notional * Beta
   */
  static calculateHedgeSize(
    spotQuantity: Decimal,
    spotPrice: Decimal,
    perpContractSize: Decimal = new Decimal(1),
    assetBeta: Decimal = new Decimal(1),
  ): {
    spotNotionalUsd: Decimal;
    requiredPerpShortContracts: Decimal;
    hedgeNotionalUsd: Decimal;
    netDeltaUsd: Decimal;
  } {
    const spotNotional = spotQuantity.mul(spotPrice);
    const hedgeNotional = spotNotional.mul(assetBeta);
    const requiredContracts = hedgeNotional.div(spotPrice.mul(perpContractSize));

    return {
      spotNotionalUsd: spotNotional,
      requiredPerpShortContracts: requiredContracts,
      hedgeNotionalUsd: hedgeNotional,
      netDeltaUsd: spotNotional.minus(hedgeNotional),
    };
  }
}
