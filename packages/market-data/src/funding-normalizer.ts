import Decimal from 'decimal.js';
import { FundingRate } from './types';

export interface NormalizedFundingData extends FundingRate {
  hourly_rate: string;
  daily_rate: string;
  weekly_rate: string;
  annualized_rate: string;
}

export class FundingNormalizer {
  /**
   * Normalizes a funding rate record and calculates hourly, daily, weekly, and annualized rates.
   */
  public static normalize(raw: FundingRate): NormalizedFundingData {
    const rawRate = new Decimal(raw.rate || raw.funding_rate || '0');
    const intervalHours = new Decimal(raw.intervalHours || raw.funding_interval || 8);

    // hourly rate = rate / intervalHours
    const hourlyRate = intervalHours.gt(0) ? rawRate.div(intervalHours) : new Decimal(0);
    const dailyRate = hourlyRate.mul(24);
    const weeklyRate = dailyRate.mul(7);
    const annualizedRate = dailyRate.mul(365);

    return {
      ...raw,
      rate: rawRate.toString(),
      funding_rate: rawRate.toString(),
      intervalHours: intervalHours.toNumber(),
      funding_interval: intervalHours.toNumber(),
      hourly_rate: hourlyRate.toFixed(8),
      daily_rate: dailyRate.toFixed(8),
      weekly_rate: weeklyRate.toFixed(8),
      annualized_rate: annualizedRate.toFixed(6),
    };
  }

  /**
   * Calculates the funding rate differential between two perpetual venues.
   */
  public static calculateDifferential(
    longRate: NormalizedFundingData,
    shortRate: NormalizedFundingData,
  ): {
    annualizedDiffPercent: Decimal;
    dailyDiffPercent: Decimal;
    isProfitable: boolean;
  } {
    const longAnnual = new Decimal(longRate.annualized_rate);
    const shortAnnual = new Decimal(shortRate.annualized_rate);

    // Long receives funding if rate is negative, pays if positive.
    // Short receives funding if rate is positive, pays if negative.
    // Net differential = shortRate - longRate
    const annualDiff = shortAnnual.sub(longAnnual).mul(100);
    const dailyDiff = new Decimal(shortRate.daily_rate)
      .sub(new Decimal(longRate.daily_rate))
      .mul(100);

    return {
      annualizedDiffPercent: annualDiff,
      dailyDiffPercent: dailyDiff,
      isProfitable: annualDiff.gt(0),
    };
  }
}
