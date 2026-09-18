import Decimal from 'decimal.js';

export interface CalculationResult<
  TInput = Record<string, any>,
  TOutput = Record<string, any>,
  TBreakdown = Record<string, any>,
> {
  inputs: TInput;
  outputs: TOutput;
  formula: string;
  assumptions: string[];
  warnings: string[];
  breakdown: TBreakdown;
  executedAt: number;
}

export type CalculatorCategory =
  | 'arbitrage'
  | 'fees'
  | 'slippage'
  | 'crosschain'
  | 'funding'
  | 'futures'
  | 'defi'
  | 'stablecoin'
  | 'portfolio'
  | 'risk'
  | 'yield'
  | 'execution'
  | 'gas'
  | 'currency'
  | 'tax'
  | 'scoring'
  | 'simulation';

export interface CalculatorParameter {
  name: string;
  label: string;
  type: 'number' | 'string' | 'select' | 'boolean';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
  options?: { label: string; value: any }[];
  isAdvanced?: boolean;
}

export interface CalculatorMeta {
  id: string;
  slug: string;
  category: CalculatorCategory;
  name: string;
  description: string;
  formulaDescription: string;
  icon?: string;
  parameters: CalculatorParameter[];
  supportedChains?: string[];
  supportedExchanges?: string[];
  status: 'ACTIVE' | 'BETA';
}

export class CalculatorError extends Error {
  readonly code: string;
  constructor(message: string, code = 'CALCULATION_ERROR') {
    super(message);
    this.name = 'CalculatorError';
    this.code = code;
  }
}
