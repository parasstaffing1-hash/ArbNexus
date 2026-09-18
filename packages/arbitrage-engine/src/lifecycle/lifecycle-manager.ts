import { Opportunity, OpportunityLifecycleState } from '../types/opportunity.types';

export class OpportunityLifecycleManager {
  private activeOpportunities: Map<string, Opportunity> = new Map();

  registerDetected(opportunity: Opportunity): Opportunity {
    opportunity.lifecycle_state = 'DETECTED';
    opportunity.detected_at = opportunity.detected_at || Date.now();
    opportunity.last_valid_at = Date.now();
    opportunity.expires_at = opportunity.expires_at || Date.now() + 5000;
    this.activeOpportunities.set(opportunity.id, opportunity);
    return opportunity;
  }

  transitionToValidating(id: string): Opportunity | null {
    const opp = this.activeOpportunities.get(id);
    if (!opp) return null;
    if (opp.lifecycle_state !== 'DETECTED') return opp;
    opp.lifecycle_state = 'VALIDATING';
    return opp;
  }

  transitionToValid(id: string): Opportunity | null {
    const opp = this.activeOpportunities.get(id);
    if (!opp) return null;
    opp.lifecycle_state = 'VALID';
    opp.last_valid_at = Date.now();
    return opp;
  }

  transitionToStale(id: string): Opportunity | null {
    const opp = this.activeOpportunities.get(id);
    if (!opp) return null;
    opp.lifecycle_state = 'STALE';
    return opp;
  }

  transitionToExpired(id: string): Opportunity | null {
    const opp = this.activeOpportunities.get(id);
    if (!opp) return null;
    opp.lifecycle_state = 'EXPIRED';
    return opp;
  }

  transitionToRejected(id: string, reason: string): Opportunity | null {
    const opp = this.activeOpportunities.get(id);
    if (!opp) return null;
    opp.lifecycle_state = 'REJECTED';
    opp.rejection_reason = reason;
    return opp;
  }

  /**
   * Automatically invalidates/expires an opportunity if prices are stale,
   * spread disappeared, or connected exchange went offline.
   */
  invalidateIfStaleOrUnprofitable(
    id: string,
    currentNetProfit?: number,
    isExchangeConnected: boolean = true,
  ): Opportunity | null {
    const opp = this.activeOpportunities.get(id);
    if (!opp) return null;

    const now = Date.now();
    if (!isExchangeConnected) {
      return this.transitionToRejected(id, 'Exchange disconnected');
    }

    if (currentNetProfit !== undefined && currentNetProfit <= 0) {
      return this.transitionToExpired(id);
    }

    const expirationTime = opp.expires_at || opp.expiration || now;
    if (now >= expirationTime) {
      return this.transitionToExpired(id);
    }

    return opp;
  }

  getOpportunity(id: string): Opportunity | undefined {
    return this.activeOpportunities.get(id);
  }

  getActiveValidOpportunities(): Opportunity[] {
    const now = Date.now();
    const validList: Opportunity[] = [];
    for (const opp of this.activeOpportunities.values()) {
      const expirationTime = opp.expires_at || opp.expiration;
      if (opp.lifecycle_state === 'VALID' && expirationTime > now) {
        validList.push(opp);
      } else if (expirationTime <= now && opp.lifecycle_state === 'VALID') {
        opp.lifecycle_state = 'EXPIRED';
      }
    }
    return validList;
  }

  purgeExpired(maxAgeMs: number = 300000): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [id, opp] of this.activeOpportunities.entries()) {
      if (opp.timestamp < cutoff) {
        this.activeOpportunities.delete(id);
      }
    }
  }
}
