import { DataQualityStatus, LatencyMetrics } from '@arbitrage/market-data';

export interface QualityThresholds {
  maxStaleAgeMs: number; // e.g. 3000ms
  maxTimestampDriftMs: number; // e.g. 5000ms
  maxPriceJumpPercent: number; // e.g. 15%
  minTopBookDepthUsd: number; // e.g. $500
}

export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  maxStaleAgeMs: 3000,
  maxTimestampDriftMs: 5000,
  maxPriceJumpPercent: 15.0,
  minTopBookDepthUsd: 250.0,
};

export interface DataQualityAssessment {
  status: DataQualityStatus;
  isExecutable: boolean;
  dataAgeMs: number;
  sourceTimestamp: number;
  receivedTimestamp: number;
  latencyMs: number;
  reasons: string[];
  anomaliesDetected: {
    crossedBook?: boolean;
    stalePrice?: boolean;
    invalidPrice?: boolean;
    sequenceGap?: boolean;
    timestampDrift?: boolean;
    abnormalJump?: boolean;
    insufficientLiquidity?: boolean;
  };
}
