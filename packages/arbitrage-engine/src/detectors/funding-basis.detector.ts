import Decimal from 'decimal.js';
import { ArbitrageDetector } from './detector.interface';
import { Opportunity } from '../types/opportunity.types';
import { FundingRate, Ticker, FundingNormalizer } from '@arbitrage/market-data';
import { OpportunityRiskEngine } from '@arbitrage/risk';
import { AdvancedOpportunityScorer } from '../scoring/opportunity-scorer';

export interface FundingDetectorContext {
  fundingRates?: FundingRate[];
  tickers?: Ticker[];
  notionalCapitalUsd?: number;
  minApyPercent?: number;
}

export class FundingBasisDetector implements ArbitrageDetector {
  readonly detectorName = 'FundingBasisDetector';

  async detect(context: FundingDetectorContext): Promise<Opportunity[]> {
    const {
      fundingRates = [],
      tickers = [],
      notionalCapitalUsd = 20000,
      minApyPercent = 8.0,
    } = context;

    const opportunities: Opportunity[] = [];

    // Group funding rates by symbol
    const ratesBySymbol: Map<string, FundingRate[]> = new Map();
    for (const f of fundingRates) {
      if (!ratesBySymbol.has(f.symbol)) {
        ratesBySymbol.set(f.symbol, []);
      }
      ratesBySymbol.get(f.symbol)!.push(f);
    }

    // 1. Perpetual ↔ Perpetual Funding Differential
    for (const [symbol, group] of ratesBySymbol.entries()) {
      if (group.length >= 2) {
        for (let i = 0; i < group.length; i++) {
          for (let j = 0; j < group.length; j++) {
            if (i === j) continue;

            const venueA = FundingNormalizer.normalize(group[i]);
            const venueB = FundingNormalizer.normalize(group[j]);

            // Strategy: Long lower funding rate venue, Short higher funding rate venue
            const diff = FundingNormalizer.calculateDifferential(venueA, venueB);

            if (diff.annualizedDiffPercent.gte(minApyPercent)) {
              const now = Date.now();
              const halfCapital = notionalCapitalUsd / 2;
              const expectedDailyProfitUsd = new Decimal(halfCapital)
                .mul(diff.dailyDiffPercent)
                .div(100)
                .toNumber();

              // Roundtrip taker fees on both perps (~4 bps each side = 8 bps total)
              const feesUsd = notionalCapitalUsd * 0.0008;
              const netProfitUsd = expectedDailyProfitUsd - feesUsd;

              if (netProfitUsd > 0) {
                // Break-even intervals = fees / per-interval net funding payout
                const perIntervalPayout = new Decimal(halfCapital)
                  .mul(diff.dailyDiffPercent.div(3))
                  .div(100)
                  .toNumber();
                const breakEvenIntervals =
                  perIntervalPayout > 0 ? Math.ceil(feesUsd / perIntervalPayout) : 1;

                const riskBreakdown = OpportunityRiskEngine.evaluateRisk({
                  strategyType: 'PERP_PERP',
                  venues: [venueA.exchange, venueB.exchange],
                  requiredCapitalUsd: notionalCapitalUsd,
                  bottleneckLiquidityUsd: 5000000,
                  estimatedDurationMs: 86400000, // 24 hours
                  latencyMs: 25,
                  dataQualityStatus: 'VALID',
                  fundingRatePercent: diff.dailyDiffPercent.toNumber(),
                });

                const { opportunityScore, letterGrade, scoreBreakdown } =
                  AdvancedOpportunityScorer.calculateScore({
                    netProfitUsd,
                    expectedRoiPercent: diff.annualizedDiffPercent.toNumber(),
                    liquidityUsd: 5000000,
                    tradeCapitalUsd: notionalCapitalUsd,
                    totalFeesUsd: feesUsd,
                    slippageUsd: 0,
                    estimatedDurationMs: 86400000,
                    latencyMs: 25,
                    dataQualityStatus: 'VALID',
                    compositeRiskScore: riskBreakdown.compositeRiskScore,
                  });

                const routeHash = `perp-perp-${symbol}-${venueA.exchange}-${venueB.exchange}`;

                opportunities.push({
                  id: `opp-funding-diff-${symbol.replace('/', '')}-${venueA.exchange}-${venueB.exchange}-${now}`,
                  strategy_type: 'PERP_PERP',
                  lifecycle_state: 'DETECTED',
                  asset: symbol,
                  venues: [venueA.exchange, venueB.exchange],
                  chains: ['off-chain'],
                  entry_price: venueA.markPrice || '1.00',
                  exit_price: venueB.markPrice || '1.00',
                  gross_spread: `${diff.annualizedDiffPercent.toFixed(2)}% APY (${diff.dailyDiffPercent.toFixed(4)}%/day)`,
                  gross_profit: expectedDailyProfitUsd.toFixed(2),
                  trading_fees: feesUsd.toFixed(2),
                  withdrawal_fees: '0.00',
                  gas_cost: '0.00',
                  bridge_cost: '0.00',
                  slippage: '0.00',
                  expected_net_profit: netProfitUsd.toFixed(2),
                  expected_roi: diff.annualizedDiffPercent.toFixed(2),
                  required_capital: notionalCapitalUsd.toString(),
                  max_executable_size: '250000',
                  estimated_duration_ms: 86400000,
                  latency: {
                    exchangeTimestamp: Math.min(venueA.timestamp, venueB.timestamp),
                    receiveTimestamp: now,
                    normalizationTimestamp: now,
                    sourceLatencyMs: 20,
                    pipelineLatencyMs: 5,
                    totalLatencyMs: 25,
                  },
                  liquidity_score: scoreBreakdown.liquidityScore,
                  data_quality: 'VALID',
                  execution_risk: riskBreakdown.riskCategory,
                  opportunity_score: opportunityScore,
                  letter_grade: letterGrade,
                  timestamp: now,
                  detected_at: now,
                  last_valid_at: now,
                  expires_at: now + 3600000,
                  expiration: now + 3600000,
                  route_hash: routeHash,
                  route: [
                    {
                      venue: venueA.exchange,
                      action: 'buy',
                      fromAsset: 'USDT',
                      toAsset: `${symbol} PERP LONG`,
                      price: venueA.markPrice || '1.00',
                      amount: halfCapital.toString(),
                      feeUsd: (halfCapital * 0.0004).toFixed(2),
                    },
                    {
                      venue: venueB.exchange,
                      action: 'sell',
                      fromAsset: 'USDT',
                      toAsset: `${symbol} PERP SHORT`,
                      price: venueB.markPrice || '1.00',
                      amount: halfCapital.toString(),
                      feeUsd: (halfCapital * 0.0004).toFixed(2),
                    },
                  ],
                  risk_breakdown: riskBreakdown,
                  score_breakdown: scoreBreakdown,
                  strategy_metadata: {
                    annualizedApyPercent: diff.annualizedDiffPercent.toNumber(),
                    dailyRatePercent: diff.dailyDiffPercent.toNumber(),
                    breakEvenHoldingIntervals: breakEvenIntervals,
                    longVenue: venueA.exchange,
                    shortVenue: venueB.exchange,
                    rateA: venueA.funding_rate,
                    rateB: venueB.funding_rate,
                  },
                });
              }
            }
          }
        }
      }
    }

    // 2. Spot ↔ Perpetual Cash-and-Carry Basis
    if (tickers.length > 0 && fundingRates.length > 0) {
      for (const t of tickers) {
        const matchingPerps = fundingRates.filter((f) => f.symbol === t.symbol);
        for (const perp of matchingPerps) {
          if (!perp.markPrice) continue;

          const spotMid = new Decimal(t.bid).add(new Decimal(t.ask)).div(2);
          const perpPrice = new Decimal(perp.markPrice);

          if (spotMid.gt(0)) {
            // Basis = (Perp - Spot) / Spot
            const basisBps = perpPrice.sub(spotMid).div(spotMid).mul(10000);
            const rawRate = new Decimal(
              perp.funding_rate !== undefined ? perp.funding_rate : '0.0001',
            );
            const ratePercent = rawRate.mul(100);

            // Contango (positive funding): Long Spot + Short Perp
            // Backwardation (negative funding): Short Spot + Long Perp
            const isContango = ratePercent.gte(0);

            // Annualized funding carry (3 periods/day * 365)
            const annualFundingApy = ratePercent.abs().mul(3 * 365);

            if (annualFundingApy.gte(minApyPercent)) {
              const now = Date.now();
              const halfCapital = notionalCapitalUsd / 2;
              const dailyFundingIncomeUsd = new Decimal(halfCapital)
                .mul(ratePercent.abs().mul(3))
                .div(100)
                .toNumber();

              // Spot taker fee (10 bps) + Perp taker fee (4 bps)
              const entryFeesUsd = halfCapital * 0.001 + halfCapital * 0.0004;
              const roundTripFeesUsd = entryFeesUsd * 2;
              const projected30dNetUsd = dailyFundingIncomeUsd * 30 - roundTripFeesUsd;

              if (projected30dNetUsd > 0) {
                const breakEvenDays =
                  dailyFundingIncomeUsd > 0
                    ? Math.ceil(roundTripFeesUsd / dailyFundingIncomeUsd)
                    : 1;

                const riskBreakdown = OpportunityRiskEngine.evaluateRisk({
                  strategyType: 'FUNDING',
                  venues: [t.exchange, perp.exchange],
                  requiredCapitalUsd: notionalCapitalUsd,
                  bottleneckLiquidityUsd: 10000000,
                  estimatedDurationMs: 86400000 * 30, // 30 days carry
                  latencyMs: 20,
                  dataQualityStatus: 'VALID',
                  fundingRatePercent: ratePercent.toNumber(),
                  basisBps: basisBps.toNumber(),
                });

                const { opportunityScore, letterGrade, scoreBreakdown } =
                  AdvancedOpportunityScorer.calculateScore({
                    netProfitUsd: projected30dNetUsd,
                    expectedRoiPercent: annualFundingApy.toNumber(),
                    liquidityUsd: 10000000,
                    tradeCapitalUsd: notionalCapitalUsd,
                    totalFeesUsd: roundTripFeesUsd,
                    slippageUsd: 2.0,
                    estimatedDurationMs: 86400000 * 30,
                    latencyMs: 20,
                    dataQualityStatus: 'VALID',
                    compositeRiskScore: riskBreakdown.compositeRiskScore,
                  });

                const routeHash = `spot-perp-${t.symbol}-${t.exchange}-${perp.exchange}`;

                opportunities.push({
                  id: `opp-funding-basis-${t.symbol.replace('/', '')}-${t.exchange}-${perp.exchange}-${now}`,
                  strategy_type: 'FUNDING',
                  lifecycle_state: 'DETECTED',
                  asset: t.symbol,
                  venues: [t.exchange, perp.exchange],
                  chains: ['off-chain'],
                  entry_price: spotMid.toFixed(2),
                  exit_price: perpPrice.toFixed(2),
                  gross_spread: `${annualFundingApy.toFixed(2)}% APY (${basisBps.toFixed(1)} bps basis)`,
                  gross_profit: (dailyFundingIncomeUsd * 30).toFixed(2),
                  trading_fees: roundTripFeesUsd.toFixed(2),
                  withdrawal_fees: '0.00',
                  gas_cost: '0.00',
                  bridge_cost: '0.00',
                  slippage: '2.00',
                  expected_net_profit: projected30dNetUsd.toFixed(2),
                  expected_roi: annualFundingApy.toFixed(2),
                  required_capital: notionalCapitalUsd.toString(),
                  max_executable_size: '500000',
                  estimated_duration_ms: 86400000 * 30,
                  latency: {
                    exchangeTimestamp: Math.min(t.timestamp, perp.timestamp),
                    receiveTimestamp: now,
                    normalizationTimestamp: now,
                    sourceLatencyMs: 15,
                    pipelineLatencyMs: 5,
                    totalLatencyMs: 20,
                  },
                  liquidity_score: scoreBreakdown.liquidityScore,
                  data_quality: 'VALID',
                  execution_risk: riskBreakdown.riskCategory,
                  opportunity_score: opportunityScore,
                  letter_grade: letterGrade,
                  timestamp: now,
                  detected_at: now,
                  last_valid_at: now,
                  expires_at: now + 3600000,
                  expiration: now + 3600000,
                  route_hash: routeHash,
                  route: [
                    {
                      venue: t.exchange,
                      action: isContango ? 'buy' : 'sell',
                      fromAsset: 'USDT',
                      toAsset: t.symbol.split('/')[0],
                      price: spotMid.toFixed(2),
                      amount: halfCapital.toString(),
                      feeUsd: (halfCapital * 0.001).toFixed(2),
                    },
                    {
                      venue: perp.exchange,
                      action: isContango ? 'sell' : 'buy',
                      fromAsset: t.symbol.split('/')[0],
                      toAsset: 'USDT',
                      price: perpPrice.toFixed(2),
                      amount: halfCapital.toString(),
                      feeUsd: (halfCapital * 0.0004).toFixed(2),
                    },
                  ],
                  risk_breakdown: riskBreakdown,
                  score_breakdown: scoreBreakdown,
                  strategy_metadata: {
                    strategyStructure: isContango
                      ? 'CASH_AND_CARRY_CONTANGO'
                      : 'REVERSE_CASH_AND_CARRY',
                    annualFundingApy: annualFundingApy.toNumber(),
                    dailyFundingIncomeUsd,
                    breakEvenDays,
                    basisBps: basisBps.toNumber(),
                    spotPrice: spotMid.toNumber(),
                    perpPrice: perpPrice.toNumber(),
                  },
                });
              }
            }
          }
        }
      }
    }

    return opportunities;
  }
}
