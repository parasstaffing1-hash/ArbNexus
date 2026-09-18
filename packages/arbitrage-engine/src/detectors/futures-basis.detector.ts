import Decimal from 'decimal.js';
import { ArbitrageDetector } from './detector.interface';
import { Opportunity } from '../types/opportunity.types';
import { OpportunityRiskEngine } from '@arbitrage/risk';
import { AdvancedOpportunityScorer } from '../scoring/opportunity-scorer';

export interface DatedFutureContract {
  symbol: string; // e.g. "BTC-27DEC26"
  underlying: string; // "BTC"
  exchange: string;
  futurePrice: Decimal;
  expiryTimestamp: number;
  openInterestUsd?: Decimal;
}

export interface BasisDetectorContext {
  spotPrice: Decimal;
  underlying: string; // "BTC"
  spotExchange: string;
  contracts: DatedFutureContract[];
  tradeCapitalUsd?: number;
  minAnnualizedBasisPercent?: number;
}

export interface TermStructurePoint {
  tenor: string; // "Spot", "Perp", "1M", "3M", "6M"
  daysToExpiry: number;
  price: number;
  basisBps: number;
  annualizedBasisPercent: number;
  openInterestUsd: number;
}

export class BasisOpportunityDetector implements ArbitrageDetector {
  readonly detectorName = 'BasisOpportunityDetector';

  async detect(context: BasisDetectorContext): Promise<Opportunity[]> {
    const {
      spotPrice,
      underlying,
      spotExchange,
      contracts,
      tradeCapitalUsd = 25000,
      minAnnualizedBasisPercent = 6.0,
    } = context;

    const opportunities: Opportunity[] = [];
    const now = Date.now();

    for (const contract of contracts) {
      const daysToExpiry = Math.max(1, (contract.expiryTimestamp - now) / (1000 * 86400));
      const basis = contract.futurePrice.minus(spotPrice).div(spotPrice);
      const basisBps = basis.mul(10000);
      const annualizedBasisPercent = basis.mul(365 / daysToExpiry).mul(100);

      if (annualizedBasisPercent.abs().gte(minAnnualizedBasisPercent)) {
        const isContango = contract.futurePrice.gt(spotPrice);
        const grossProfitUsd = new Decimal(tradeCapitalUsd).mul(basis.abs()).toNumber();

        // Taker fees on spot (10 bps) + futures (5 bps) = 15 bps round-trip
        const feesUsd = tradeCapitalUsd * 0.0015;
        const netProfitUsd = grossProfitUsd - feesUsd;

        if (netProfitUsd > 0) {
          const riskBreakdown = OpportunityRiskEngine.evaluateRisk({
            strategyType: 'BASIS',
            venues: [spotExchange, contract.exchange],
            requiredCapitalUsd: tradeCapitalUsd,
            bottleneckLiquidityUsd: 15000000,
            estimatedDurationMs: daysToExpiry * 86400 * 1000,
            latencyMs: 15,
            dataQualityStatus: 'VALID',
            basisBps: basisBps.toNumber(),
          });

          const { opportunityScore, letterGrade, scoreBreakdown } =
            AdvancedOpportunityScorer.calculateScore({
              netProfitUsd,
              expectedRoiPercent: annualizedBasisPercent.abs().toNumber(),
              liquidityUsd: 15000000,
              tradeCapitalUsd,
              totalFeesUsd: feesUsd,
              slippageUsd: 1.5,
              estimatedDurationMs: daysToExpiry * 86400 * 1000,
              latencyMs: 15,
              dataQualityStatus: 'VALID',
              compositeRiskScore: riskBreakdown.compositeRiskScore,
            });

          const routeHash = `basis-${underlying}-${contract.symbol}-${spotExchange}-${contract.exchange}`;

          opportunities.push({
            id: `opp-basis-${underlying}-${contract.symbol}-${now}`,
            strategy_type: 'BASIS',
            lifecycle_state: 'DETECTED',
            asset: `${underlying} (${contract.symbol})`,
            venues: [spotExchange, contract.exchange],
            chains: ['off-chain'],
            entry_price: spotPrice.toFixed(2),
            exit_price: contract.futurePrice.toFixed(2),
            gross_spread: `${annualizedBasisPercent.toFixed(2)}% Ann. (${basisBps.toFixed(1)} bps)`,
            gross_profit: grossProfitUsd.toFixed(2),
            trading_fees: feesUsd.toFixed(2),
            withdrawal_fees: '0.00',
            gas_cost: '0.00',
            bridge_cost: '0.00',
            slippage: '1.50',
            expected_net_profit: netProfitUsd.toFixed(2),
            expected_roi: annualizedBasisPercent.abs().toFixed(2),
            required_capital: tradeCapitalUsd.toString(),
            max_executable_size: '500000',
            estimated_duration_ms: Math.round(daysToExpiry * 86400 * 1000),
            latency: {
              exchangeTimestamp: now - 15,
              receiveTimestamp: now,
              normalizationTimestamp: now,
              sourceLatencyMs: 15,
              pipelineLatencyMs: 2,
              totalLatencyMs: 17,
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
                venue: spotExchange,
                action: isContango ? 'buy' : 'sell',
                fromAsset: 'USDT',
                toAsset: underlying,
                price: spotPrice.toFixed(2),
                amount: (tradeCapitalUsd / 2).toString(),
                feeUsd: (tradeCapitalUsd * 0.0005).toFixed(2),
              },
              {
                venue: contract.exchange,
                action: isContango ? 'sell' : 'buy',
                fromAsset: underlying,
                toAsset: 'USDT',
                price: contract.futurePrice.toFixed(2),
                amount: (tradeCapitalUsd / 2).toString(),
                feeUsd: (tradeCapitalUsd * 0.00025).toFixed(2),
              },
            ],
            risk_breakdown: riskBreakdown,
            score_breakdown: scoreBreakdown,
            strategy_metadata: {
              contractSymbol: contract.symbol,
              daysToExpiry: Math.round(daysToExpiry),
              basisBps: basisBps.toNumber(),
              annualizedBasisPercent: annualizedBasisPercent.toNumber(),
              isContango,
              spotPrice: spotPrice.toNumber(),
              futurePrice: contract.futurePrice.toNumber(),
            },
          });
        }
      }
    }

    return opportunities;
  }

  /**
   * Generates basis term structure curve points for visualization.
   */
  static generateTermStructure(
    spotPrice: Decimal,
    contracts: DatedFutureContract[],
  ): TermStructurePoint[] {
    const now = Date.now();
    const curve: TermStructurePoint[] = [
      {
        tenor: 'Spot',
        daysToExpiry: 0,
        price: spotPrice.toNumber(),
        basisBps: 0,
        annualizedBasisPercent: 0,
        openInterestUsd: 0,
      },
    ];

    for (const c of contracts) {
      const days = Math.max(1, (c.expiryTimestamp - now) / (1000 * 86400));
      const basis = c.futurePrice.minus(spotPrice).div(spotPrice);
      const basisBps = basis.mul(10000).toNumber();
      const annBasis = basis
        .mul(365 / days)
        .mul(100)
        .toNumber();

      let tenor = `${Math.round(days)}D`;
      if (days > 25 && days < 45) tenor = '1M';
      else if (days >= 80 && days <= 105) tenor = '3M';
      else if (days >= 160 && days <= 200) tenor = '6M';

      curve.push({
        tenor,
        daysToExpiry: Math.round(days),
        price: c.futurePrice.toNumber(),
        basisBps,
        annualizedBasisPercent: annBasis,
        openInterestUsd: c.openInterestUsd ? c.openInterestUsd.toNumber() : 10000000,
      });
    }

    return curve.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }
}
