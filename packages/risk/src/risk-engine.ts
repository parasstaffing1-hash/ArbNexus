import Decimal from 'decimal.js';
import {
  RiskPolicy,
  DEFAULT_RISK_POLICY,
  RiskAssessmentResult,
  AssessableOpportunity,
} from './types';
import { CircuitBreaker } from './circuit-breaker';

export class RiskEngine {
  private policy: RiskPolicy;
  private circuitBreaker: CircuitBreaker;
  private venueAllocations: Map<string, Decimal> = new Map();

  constructor(policy: Partial<RiskPolicy> = {}) {
    this.policy = { ...DEFAULT_RISK_POLICY, ...policy };
    this.circuitBreaker = new CircuitBreaker();
  }

  getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker;
  }

  /**
   * Evaluates an Opportunity against safety policies.
   */
  assessOpportunity(opportunity: AssessableOpportunity): RiskAssessmentResult {
    const reasons: string[] = [];

    // 1. Circuit breaker check
    if (this.circuitBreaker.isOpen()) {
      return {
        isApproved: false,
        riskScore: 'EXTREME',
        reasons: [`System circuit breaker is open: ${this.circuitBreaker.getState().tripReason}`],
        adjustedMaxSizeUsd: new Decimal(0),
      };
    }

    // 2. Restricted assets / venues
    if (this.policy.restrictedAssets.includes(opportunity.asset)) {
      reasons.push(`Asset ${opportunity.asset} is restricted`);
    }

    for (const v of opportunity.venues) {
      if (this.policy.restrictedVenues.includes(v)) {
        reasons.push(`Venue ${v} is restricted`);
      }
    }

    // 3. Execution duration limit
    if (opportunity.estimated_duration_ms > this.policy.maxExecutionDurationMs) {
      reasons.push(
        `Estimated duration (${opportunity.estimated_duration_ms}ms) exceeds max limit (${this.policy.maxExecutionDurationMs}ms)`,
      );
    }

    // 4. Position size limit
    const oppSize = new Decimal(opportunity.required_capital);
    let adjustedSize = Decimal.min(oppSize, this.policy.maxPositionSizeUsd);

    // 5. Slippage check
    const slippageUsd = new Decimal(opportunity.slippage);
    const slippageBps = oppSize.isZero() ? 0 : slippageUsd.div(oppSize).mul(10000).toNumber();
    if (slippageBps > this.policy.maxSlippageBps) {
      reasons.push(
        `Estimated slippage (${slippageBps.toFixed(1)} bps) exceeds max policy limit (${this.policy.maxSlippageBps} bps)`,
      );
    }

    let riskScore: RiskAssessmentResult['riskScore'] = 'LOW';
    if (reasons.length > 0) {
      riskScore = 'HIGH';
    } else if (opportunity.execution_risk === 'MEDIUM') {
      riskScore = 'MEDIUM';
    }

    return {
      isApproved: reasons.length === 0,
      riskScore,
      reasons,
      adjustedMaxSizeUsd: adjustedSize,
    };
  }
}
