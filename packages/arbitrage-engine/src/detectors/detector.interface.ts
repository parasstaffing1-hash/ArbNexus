import { Opportunity } from '../types/opportunity.types';

export interface ArbitrageDetector {
  readonly detectorName: string;
  detect(context: Record<string, any>): Promise<Opportunity[]>;
}
