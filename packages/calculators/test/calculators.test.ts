import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  // Primitives
  toDecimal,
  Money,
  Price,
  Quantity,
  Percentage,
  FundingRate,
  // Arbitrage
  calculateSpotArbitrage,
  calculateGrossSpread,
  calculateNetSpread,
  calculateNetProfit,
  calculateReturnOnCapital,
  calculateBreakEvenSpread,
  calculateMultiExchangeComparison,
  calculateThreeLegArbitrage,
  calculateCircularArbitrage,
  calculateCapitalAllocation,
  calculateOpportunityRoi,
  calculateOpportunityDecay,
  calculateRouteProfit,
  calculateMinimumTradeSize,
  calculateMaxProfitableTradeSize,
  // Fees
  calculateMakerFee,
  calculateTakerFee,
  calculateTradingFee,
  calculateWithdrawalFee,
  calculateDepositFee,
  calculateTotalExchangeCost,
  calculateFeeBreakEven,
  calculateVolumeTierFee,
  // Slippage
  calculateSlippage,
  calculateExpectedSlippage,
  calculatePriceImpact,
  calculateLiquidityImpact,
  calculateOrderBookExecution,
  calculateMarketImpact,
  calculateMaxSafeTradeSize,
  calculatePartialFill,
  calculateExecutionCost,
  // Cross-Chain
  calculateCrossChainArbitrage,
  calculateBridgeFee,
  calculateBridgeRouteCost,
  calculateBridgeTime,
  calculateCrossChainGasCost,
  calculateCrossChainProfit,
  calculateCrossChainBreakEven,
  calculateCheapestRoute,
  calculateFastestRoute,
  calculateRouteProfitabilitySimulation,
  // Funding
  calculateFundingProfit,
  calculateFundingApr,
  calculateFundingApy,
  calculateDeltaNeutralFunding,
  calculateSpotPerpHedge,
  calculateLongShortHedgeRatio,
  calculateFundingBreakEven,
  calculateFundingRateComparison,
  calculateFundingCarry,
  calculateFundingPayoutProjection,
  // Futures
  calculateFuturesPositionSize,
  calculateEffectiveLeverage,
  calculateMarginRequired,
  calculateInitialMargin,
  calculateMaintenanceMargin,
  calculateLiquidationPrice,
  calculateFuturesPnl,
  calculateRoe,
  calculateFuturesBreakEvenPrice,
  calculateRiskRewardRatio,
  calculateStopLossLevel,
  calculateTakeProfitLevel,
  calculateFuturesFundingImpact,
  // DeFi
  calculateDexSwapCost,
  calculateAmmPriceImpact,
  calculateLpProfit,
  calculateImpermanentLoss,
  calculateLiquidityProvision,
  calculateLpBreakEven,
  calculateDexArbitrage,
  calculatePoolPriceDifference,
  calculateGasPlusSwapCost,
  calculateDexVsCexArbitrage,
  // Stablecoin
  calculateStablecoinDepeg,
  calculateStablecoinPremium,
  calculateStablecoinDiscount,
  calculateStablecoinArbitrage,
  calculateDepegBreakEven,
  calculateRedemptionProfit,
  // Portfolio
  calculatePortfolioAllocation,
  calculatePositionAllocation,
  calculateCapitalRequirement,
  calculateCapitalEfficiency,
  calculateRebalancing,
  calculateExposure,
  calculateChainExposure,
  calculateExchangeExposure,
  calculateStablecoinExposure,
  calculateCapitalRotation,
  // Risk
  calculateVolatility,
  calculateHistoricalVolatility,
  calculateMaximumDrawdown,
  calculateSharpe,
  calculateSortino,
  calculateVaR,
  calculateExpectedShortfall,
  calculateAssetCorrelation,
  calculateAssetBeta,
  calculatePortfolioRisk,
  // Yield
  calculateApr,
  calculateApyFromApr,
  calculateCompoundYield,
  calculateStakingRewards,
  calculateYieldFarming,
  calculateAutoCompoundBenefit,
  calculateDailyYield,
  calculateMonthlyYield,
  calculateAnnualYield,
  calculateYieldBreakEven,
  // Execution
  calculateVwap,
  calculateTwap,
  calculateAverageExecutionPrice,
  calculateOrderBookImbalance,
  calculateDetailedExecutionCost,
  calculateExecutionDelayImpact,
  calculateLatencyImpact,
  calculateExecutionPartialFill,
  calculateFillProbability,
  calculateOpportunityExpiration,
  // Gas
  calculateEthereumGas,
  calculateL2Gas,
  calculateTransactionCost,
  calculateGasBreakEven,
  calculateGasVsArbProfit,
  calculateNetworkCostComparison,
  // Currency
  calculateCryptoConversion,
  calculateUsdUsdt,
  calculateEurUsdt,
  calculateInrUsdt,
  calculateGeneralRoi,
  calculateProfitPercentage,
  calculateGeneralCompoundInterest,
  calculateGeneralBreakEven,
  // Tax
  calculateCostBasis,
  calculateRealizedGain,
  calculateUnrealizedGain,
  calculateFifoGain,
  calculateLifoGain,
  calculateAverageCostBasis,
  calculateTransactionPnl,
  // Scoring & Simulation
  calculateOpportunityScore,
  simulateOpportunity,
} from '../src/index';

describe('Financial Primitives & Precision', () => {
  it('prevents standard JavaScript floating point drift (0.1 + 0.2)', () => {
    const a = toDecimal('0.1');
    const b = toDecimal('0.2');
    expect(a.plus(b).toString()).toBe('0.3');
    expect(0.1 + 0.2).not.toBe(0.3); // Demonstrates why Decimal.js is necessary
  });

  it('correctly calculates annualized APR vs APY on FundingRate primitive', () => {
    const rate = new FundingRate('0.01', 8); // 0.01% per 8 hours
    const apr = rate.toAnnualizedApr();
    expect(apr.toNumber()).toBeCloseTo(10.95, 2); // 0.01% * 3 * 365 = 10.95%

    const apy = rate.toAnnualizedApy();
    expect(apy.toNumber()).toBeGreaterThan(apr.toNumber()); // Compounding effect
  });
});

describe('1. Spot Arbitrage Calculators', () => {
  it('calculates master spot arbitrage with positive spread and net profit', () => {
    const res = calculateSpotArbitrage({
      buyPrice: 2840,
      sellPrice: 2870,
      quantity: 2,
      sourceTradingFeePercent: 0.1,
      targetTradingFeePercent: 0.075,
      networkGasCostUsd: 2.5,
      withdrawalFeeUsd: 1.0,
      slippagePercent: 0.05,
    });

    expect(res.outputs.grossProfitUsd).toBe(60); // (2870 - 2840) * 2
    expect(res.outputs.isProfitable).toBe(true);
    expect(res.outputs.netProfitUsd).toBeCloseTo(43.645, 2);
    expect(res.outputs.grossSpreadPercent).toBeCloseTo(1.056, 3);
  });

  it('handles fee > gross spread scenario correctly', () => {
    const res = calculateSpotArbitrage({
      buyPrice: 100,
      sellPrice: 100.1, // tiny 0.1% spread
      quantity: 1,
      sourceTradingFeePercent: 0.1,
      targetTradingFeePercent: 0.1,
      networkGasCostUsd: 5.0, // large gas
    });

    expect(res.outputs.isProfitable).toBe(false);
    expect(res.outputs.netProfitUsd).toBeLessThan(0);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it('handles zero quantity and zero prices gracefully', () => {
    const res = calculateSpotArbitrage({
      buyPrice: 0,
      sellPrice: 0,
      quantity: 0,
    });
    expect(res.outputs.netProfitUsd).toBe(0);
    expect(res.outputs.grossSpreadPercent).toBe(0);
    expect(res.warnings).toContain(
      'Trade quantity or buy price is zero; capital required is zero.',
    );
  });

  it('calculates triangular arbitrage cycle', () => {
    const res = calculateThreeLegArbitrage(68500, 0.00035, 0.042, '0.1');
    expect(res.outputs.grossMultiplier).toBeGreaterThan(0);
    expect(res.formula).toBeDefined();
  });

  it('calculates minimum trade size required to cover fixed fees', () => {
    const res = calculateMinimumTradeSize('15.0', '1.0', '0.2', '10.0');
    expect(res.outputs.isFeasible).toBe(true);
    // Net margin = 0.8% = 0.008. Min size = 25 / 0.008 = 3125 USD
    expect(res.outputs.minTradeSizeUsd).toBeCloseTo(3125, 0);
  });

  it('calculates maximum profitable trade size under quadratic impact', () => {
    const res = calculateMaxProfitableTradeSize('1.5', '10.0', '0.2', '0.0000002');
    expect(res.outputs.optimalTradeSizeUsd).toBeGreaterThan(0);
    expect(res.outputs.maxEstimatedProfitUsd).toBeGreaterThan(0);
  });
});

describe('2. Exchange Fee Calculators', () => {
  it('calculates maker vs taker fee', () => {
    const maker = calculateMakerFee('10000', '0.02');
    const taker = calculateTakerFee('10000', '0.05');
    expect(maker.outputs.feeUsd).toBe(2);
    expect(taker.outputs.feeUsd).toBe(5);
  });

  it('calculates VIP volume tier fees', () => {
    const tiers = [
      { minVolumeUsd: '0', makerFeePercent: '0.1', takerFeePercent: '0.1' },
      { minVolumeUsd: '50000', makerFeePercent: '0.08', takerFeePercent: '0.09' },
      { minVolumeUsd: '250000', makerFeePercent: '0.04', takerFeePercent: '0.06' },
    ];
    const res = calculateVolumeTierFee('300000', tiers);
    expect(res.outputs.makerFeePercent).toBe(0.04);
    expect(res.outputs.takerFeePercent).toBe(0.06);
  });
});

describe('3. Slippage & Order Book Depth Calculators', () => {
  it('calculates actual slippage on buy order', () => {
    const res = calculateSlippage('2840', '2845', true);
    expect(res.outputs.slippagePercent).toBeCloseTo(0.176, 3);
    expect(res.outputs.isAdverse).toBe(true);
  });

  it('simulates order book depth sweep across tranches', () => {
    const book = [
      { price: new Decimal(2840), amount: new Decimal(2.0), totalUsd: new Decimal(5680) },
      { price: new Decimal(2842), amount: new Decimal(5.0), totalUsd: new Decimal(14210) },
      { price: new Decimal(2846), amount: new Decimal(10.0), totalUsd: new Decimal(28460) },
    ];
    const res = calculateOrderBookExecution('10000', book, true);
    expect(res.outputs.isFullyFilled).toBe(true);
    expect(res.outputs.averageExecutionPrice).toBeGreaterThan(2840);
    expect(res.outputs.simulationTiers.length).toBe(6);
  });
});

describe('4. Cross-Chain Arbitrage Calculators', () => {
  it('calculates cross-chain arbitrage profit with dual gas and bridge', () => {
    const res = calculateCrossChainArbitrage(2840, 2875, 2.0, 2.5, 4.0, 0.5, 0.05, 0.05, 120);
    expect(res.outputs.grossProfitUsd).toBe(70);
    expect(res.outputs.isProfitable).toBe(true);
    expect(res.outputs.durationMinutes).toBe(2);
  });

  it('identifies cheapest bridge route among competing quotes', () => {
    const quotes = [
      {
        bridgeId: 'b1',
        bridgeName: 'Bridge 1',
        sourceChain: 'Eth',
        destChain: 'Arb',
        token: 'USDC',
        amount: new Decimal(1000),
        feeUsd: new Decimal(5),
        gasCostUsd: new Decimal(3),
        estimatedDurationSeconds: 120,
        securityScore: 0.95,
      },
      {
        bridgeId: 'b2',
        bridgeName: 'Bridge 2',
        sourceChain: 'Eth',
        destChain: 'Arb',
        token: 'USDC',
        amount: new Decimal(1000),
        feeUsd: new Decimal(2),
        gasCostUsd: new Decimal(2),
        estimatedDurationSeconds: 90,
        securityScore: 0.97,
      },
    ];
    const res = calculateCheapestRoute(quotes);
    expect(res.outputs.cheapestBridgeId).toBe('b2');
    expect(res.outputs.totalCostUsd).toBe(4);
  });
});

describe('5. Funding Rate Arbitrage Calculators', () => {
  it('calculates funding rate periodic payout and APR', () => {
    const profit = calculateFundingProfit(10000, 0.015, 3);
    expect(profit.outputs.fundingPayoutUsd).toBe(4.5); // 10000 * 0.00015 * 3

    const apr = calculateFundingApr(0.015, 8);
    expect(apr.outputs.annualizedAprPercent).toBeCloseTo(16.425, 2);
  });

  it('calculates delta-neutral break-even duration', () => {
    const res = calculateDeltaNeutralFunding(10000, 0.02, 1, 0.075);
    expect(res.outputs.dailyFundingYieldUsd).toBe(6); // 10000 * 0.0002 * 3
    expect(res.outputs.breakEvenDays).toBeCloseTo(2.5, 1);
  });
});

describe('6. Futures & Margin Calculators', () => {
  it('calculates liquidation price for long position', () => {
    // Entry 68500, 10x leverage (IMR=10%), MMR=0.5%
    const res = calculateLiquidationPrice(68500, 10, 0.5, true);
    // P_liq = 68500 * (1 - 0.10 + 0.005) = 68500 * 0.905 = 61992.5
    expect(res.outputs.liquidationPrice).toBe(61992.5);
  });

  it('calculates liquidation price for short position', () => {
    // Entry 68500, 10x leverage (IMR=10%), MMR=0.5%
    const res = calculateLiquidationPrice(68500, 10, 0.5, false);
    // P_liq = 68500 * (1 + 0.10 - 0.005) = 68500 * 1.095 = 75007.5
    expect(res.outputs.liquidationPrice).toBe(75007.5);
  });

  it('calculates ROE and PnL correctly', () => {
    const pnl = calculateFuturesPnl(68000, 71400, 1.0, true, 20);
    expect(pnl.outputs.grossPnlUsd).toBe(3400);
    expect(pnl.outputs.netPnlUsd).toBe(3380);

    const roe = calculateRoe(3380, 6800); // 10x margin on 68,000 = 6,800
    expect(roe.outputs.roePercent).toBeCloseTo(49.7, 1);
  });
});

describe('7. DeFi & AMM Calculators', () => {
  it('calculates constant-product impermanent loss', () => {
    // 1.25x price change
    const res = calculateImpermanentLoss(1.25);
    expect(res.outputs.impermanentLossPercent).toBeCloseTo(0.619, 2);

    // 2.0x price change
    const res2 = calculateImpermanentLoss(2.0);
    expect(res2.outputs.impermanentLossPercent).toBeCloseTo(5.719, 2);
  });

  it('calculates AMM price impact on constant-product swap', () => {
    const res = calculateAmmPriceImpact(1000, 2000000, 50, 0.3);
    expect(res.outputs.priceImpactPercent).toBeGreaterThan(0);
    expect(res.outputs.tokensOutReceived).toBeGreaterThan(0);
  });
});

describe('8. Stablecoin Arbitrage Calculators', () => {
  it('identifies discount and calculates redemption profit', () => {
    const depeg = calculateStablecoinDepeg(0.992, 1.0);
    expect(depeg.outputs.depegType).toBe('DISCOUNT');
    expect(depeg.outputs.deviationPercent).toBeCloseTo(-0.8, 2);

    const arb = calculateStablecoinArbitrage(0.992, 1.0, 10000, 0.1, 5.0);
    expect(arb.outputs.grossProfitUsd).toBe(80); // (1.0 - 0.992) * 10000
    expect(arb.outputs.isProfitable).toBe(true);
    expect(arb.outputs.netProfitUsd).toBe(65); // 80 - 10 (fee) - 5 (gas)
  });
});

describe('9. Risk & Volatility Calculators', () => {
  it('calculates Sharpe ratio and parametric VaR', () => {
    const returns = [0.01, -0.005, 0.02, 0.015, -0.01, 0.03, 0.005, -0.02, 0.018, 0.008];
    const sharpe = calculateSharpe(returns, 0.04, 365);
    expect(sharpe.outputs.sharpeRatio).toBeDefined();

    const varRes = calculateVaR(100000, returns, 0.95, 1);
    expect(varRes.outputs.valueAtRiskUsd).toBeGreaterThan(0);
  });

  it('calculates maximum drawdown on a price sequence', () => {
    const prices = [100, 120, 150, 130, 90, 110, 140];
    const mdd = calculateMaximumDrawdown(prices);
    // Peak 150 -> Trough 90 = 60 / 150 = 40%
    expect(mdd.outputs.maxDrawdownPercent).toBe(40);
  });
});

describe('10. Tax & Accounting Calculators', () => {
  it('calculates FIFO vs LIFO lot disposition', () => {
    const lots = [
      { amount: 1.0, priceUsd: 2000, timestamp: 1000 },
      { amount: 1.0, priceUsd: 3000, timestamp: 2000 },
    ];

    // Sell 1 unit at 3500
    const fifo = calculateFifoGain(1.0, 3500, lots);
    // FIFO sells the 2000 lot -> Gain = 3500 - 2000 = 1500
    expect(fifo.outputs.realizedGainUsd).toBe(1500);

    const lifo = calculateLifoGain(1.0, 3500, lots);
    // LIFO sells the 3000 lot -> Gain = 3500 - 3000 = 500
    expect(lifo.outputs.realizedGainUsd).toBe(500);
  });
});

describe('11. Deterministic Opportunity Scoring Engine', () => {
  it('assigns high score to liquid, profitable, low-latency opportunity', () => {
    const res = calculateOpportunityScore({
      netSpreadPercent: 2.2,
      netProfitUsd: 350,
      orderBookLiquidityUsd: 50000,
      expectedSlippagePercent: 0.05,
      exchangeReliabilityScore: 0.99,
      withdrawalAvailability: true,
      networkCongestionScore: 0.1,
      executionLatencyMs: 85,
      historicalSpreadPersistenceSeconds: 30,
      transferTimeMinutes: 0,
      capitalRequirementUsd: 5000,
    });

    expect(res.outputs.opportunityScore).toBeGreaterThan(75);
    expect(['AAA', 'AA', 'A']).toContain(res.outputs.grade);
    expect(res.outputs.recommendation).toBe('EXECUTE');
  });

  it('rejects opportunity when withdrawal is halted', () => {
    const res = calculateOpportunityScore({
      netSpreadPercent: 5.0, // High spread trap
      netProfitUsd: 500,
      orderBookLiquidityUsd: 50000,
      expectedSlippagePercent: 0.05,
      exchangeReliabilityScore: 0.99,
      withdrawalAvailability: false, // Halted
      networkCongestionScore: 0.1,
      executionLatencyMs: 85,
      historicalSpreadPersistenceSeconds: 30,
      transferTimeMinutes: 0,
      capitalRequirementUsd: 5000,
    });

    expect(res.outputs.opportunityScore).toBe(0);
    expect(res.outputs.recommendation).toBe('REJECT');
    expect(res.warnings).toContain('CRITICAL: Withdrawal is halted on source exchange.');
  });
});

describe('12. Opportunity Simulator & Profit Curve', () => {
  it('generates non-linear trade size vs profit curve with optimal trade size', () => {
    const res = simulateOpportunity({
      capitalUsd: 50000,
      tradeSizeUsd: 10000,
      buyPrice: 2840,
      sellPrice: 2875,
      tradingFeePercent: 0.075,
      withdrawalFeeUsd: 1.0,
      gasCostUsd: 2.5,
      slippageFactor: '0.0000001',
    });

    expect(res.outputs.profitCurve.length).toBe(15);
    expect(res.outputs.optimalTradeSizeUsd).toBeGreaterThan(0);
    expect(res.outputs.maxProfitUsd).toBeGreaterThan(0);
    expect(res.outputs.roiCurve.length).toBe(15);
  });
});
