import { QuantStatistics } from './statistics';

export interface OpportunityLifecycleRecord {
  id: string;
  strategy: string;
  exchange: string;
  asset: string;
  chain?: string;
  detectedAt: number;
  validatedAt?: number;
  expiredAt: number;
  netProfitUsd: number;
  timeOfDayHour?: number; // 0 - 23
}

export interface SurvivalMetrics {
  totalCount: number;
  medianDurationMs: number;
  meanDurationMs: number;
  p50DurationMs: number;
  p90DurationMs: number;
  p99DurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
}

export interface SurvivalCohortAnalysis {
  cohortKey: string;
  metrics: SurvivalMetrics;
}

export class OpportunitySurvivalAnalyzer {
  /**
   * Analyzes an array of opportunity lifecycles to calculate duration metrics and percentiles.
   */
  static analyzeSurvival(records: OpportunityLifecycleRecord[]): SurvivalMetrics {
    if (records.length === 0) {
      return {
        totalCount: 0,
        medianDurationMs: 0,
        meanDurationMs: 0,
        p50DurationMs: 0,
        p90DurationMs: 0,
        p99DurationMs: 0,
        minDurationMs: 0,
        maxDurationMs: 0,
      };
    }

    const durations = records.map((r) => Math.max(0, r.expiredAt - r.detectedAt));
    const meanDuration = QuantStatistics.mean(durations);
    const p50 = QuantStatistics.percentile(durations, 50);
    const p90 = QuantStatistics.percentile(durations, 90);
    const p99 = QuantStatistics.percentile(durations, 99);
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      totalCount: records.length,
      medianDurationMs: p50,
      meanDurationMs: meanDuration,
      p50DurationMs: p50,
      p90DurationMs: p90,
      p99DurationMs: p99,
      minDurationMs: min,
      maxDurationMs: max,
    };
  }

  /**
   * Partitions opportunities into cohorts (e.g. by strategy, venue, asset, or chain).
   */
  static analyzeByCohort(
    records: OpportunityLifecycleRecord[],
    groupBy: 'strategy' | 'exchange' | 'asset' | 'chain',
  ): SurvivalCohortAnalysis[] {
    const groups: Map<string, OpportunityLifecycleRecord[]> = new Map();

    for (const r of records) {
      let key = 'unknown';
      if (groupBy === 'strategy') key = r.strategy;
      else if (groupBy === 'exchange') key = r.exchange;
      else if (groupBy === 'asset') key = r.asset;
      else if (groupBy === 'chain') key = r.chain || 'off-chain';

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(r);
    }

    const results: SurvivalCohortAnalysis[] = [];
    for (const [key, groupRecords] of groups.entries()) {
      results.push({
        cohortKey: key,
        metrics: this.analyzeSurvival(groupRecords),
      });
    }

    return results.sort((a, b) => b.metrics.medianDurationMs - a.metrics.medianDurationMs);
  }
}
