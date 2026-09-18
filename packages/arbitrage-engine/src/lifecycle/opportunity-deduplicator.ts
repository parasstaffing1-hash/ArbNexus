import * as crypto from 'crypto';
import { Opportunity } from '../types/opportunity.types';

export class OpportunityDeduplicator {
  private seenFingerprints: Map<string, number> = new Map(); // fingerprint -> timestamp
  private readonly deduplicationWindowMs: number;

  constructor(deduplicationWindowMs: number = 5000) {
    this.deduplicationWindowMs = deduplicationWindowMs;
  }

  /**
   * Computes a deterministic SHA-256 fingerprint for the opportunity based on:
   * strategy_type, asset, venues, chains, entry_price, exit_price.
   */
  public generateFingerprint(opp: Opportunity): string {
    const sortedVenues = [...opp.venues].sort().join('|');
    const sortedChains = [...opp.chains].sort().join('|');
    const payload = `${opp.strategy_type}:${opp.asset}:${sortedVenues}:${sortedChains}:${Number(opp.entry_price).toFixed(2)}:${Number(opp.exit_price).toFixed(2)}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Checks if the opportunity is a duplicate within the rolling time window.
   * If not a duplicate, records it and returns false. If duplicate, returns true.
   */
  public isDuplicate(opp: Opportunity, now: number = Date.now()): boolean {
    this.pruneExpired(now);

    const fingerprint = opp.route_hash || this.generateFingerprint(opp);
    const lastSeen = this.seenFingerprints.get(fingerprint);

    if (lastSeen !== undefined && now - lastSeen < this.deduplicationWindowMs) {
      return true; // Duplicate detected
    }

    this.seenFingerprints.set(fingerprint, now);
    return false;
  }

  /**
   * Filters an array of opportunities, returning only unique non-duplicate instances.
   */
  public deduplicate(opportunities: Opportunity[], now: number = Date.now()): Opportunity[] {
    return opportunities.filter((opp) => !this.isDuplicate(opp, now));
  }

  private pruneExpired(now: number): void {
    for (const [fingerprint, timestamp] of this.seenFingerprints.entries()) {
      if (now - timestamp > this.deduplicationWindowMs * 2) {
        this.seenFingerprints.delete(fingerprint);
      }
    }
  }
}
