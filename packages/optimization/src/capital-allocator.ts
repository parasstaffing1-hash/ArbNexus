import Decimal from 'decimal.js';

export interface OpportunityAllocationCandidate {
  id: string;
  expectedRoiPercent: Decimal;
  executionRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  maxExecutableSize: Decimal;
  venue: string;
}

export interface AllocationResult {
  allocations: { id: string; allocatedUsd: Decimal; weightPercent: Decimal }[];
  totalAllocatedUsd: Decimal;
  idleCapitalUsd: Decimal;
}

export class CapitalAllocator {
  /**
   * Allocates available capital across opportunities weighted by ROI / Risk
   * subject to max size constraints and max per-venue limits.
   */
  static allocateCapital(
    totalTreasuryUsd: Decimal,
    candidates: OpportunityAllocationCandidate[],
    maxVenueConcentrationPercent: number = 40,
  ): AllocationResult {
    if (totalTreasuryUsd.lte(0) || candidates.length === 0) {
      return {
        allocations: [],
        totalAllocatedUsd: new Decimal(0),
        idleCapitalUsd: totalTreasuryUsd,
      };
    }

    const riskMultipliers: Record<string, number> = {
      LOW: 1.0,
      MEDIUM: 0.7,
      HIGH: 0.4,
      EXTREME: 0.1,
    };

    const maxPerVenue = totalTreasuryUsd.mul(maxVenueConcentrationPercent).div(100);

    // Compute raw weights: ROI * RiskFactor
    const weightedCandidates = candidates.map((c) => {
      const riskWeight = riskMultipliers[c.executionRisk] ?? 0.5;
      const score = c.expectedRoiPercent.mul(riskWeight);
      return { ...c, score: Decimal.max(0, score) };
    });

    const totalScore = weightedCandidates.reduce((acc, c) => acc.plus(c.score), new Decimal(0));

    if (totalScore.isZero()) {
      return {
        allocations: [],
        totalAllocatedUsd: new Decimal(0),
        idleCapitalUsd: totalTreasuryUsd,
      };
    }

    const venueTotals: Map<string, Decimal> = new Map();
    let totalAllocated = new Decimal(0);

    const allocations = weightedCandidates.map((c) => {
      const fraction = c.score.div(totalScore);
      let targetSize = totalTreasuryUsd.mul(fraction);

      // Bound by candidate max executable size
      targetSize = Decimal.min(targetSize, c.maxExecutableSize);

      // Bound by venue limit
      const currentVenueTotal = venueTotals.get(c.venue) ?? new Decimal(0);
      const remainingVenueCap = Decimal.max(0, maxPerVenue.minus(currentVenueTotal));
      targetSize = Decimal.min(targetSize, remainingVenueCap);

      venueTotals.set(c.venue, currentVenueTotal.plus(targetSize));
      totalAllocated = totalAllocated.plus(targetSize);

      return {
        id: c.id,
        allocatedUsd: targetSize,
        weightPercent: totalTreasuryUsd.isZero()
          ? new Decimal(0)
          : targetSize.div(totalTreasuryUsd).mul(100),
      };
    });

    return {
      allocations,
      totalAllocatedUsd: totalAllocated,
      idleCapitalUsd: totalTreasuryUsd.minus(totalAllocated),
    };
  }
}
