import Decimal from 'decimal.js';

// Configure default precision and rounding for institutional calculation
Decimal.set({
  precision: 36,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -18,
  toExpPos: 36,
});

export type DecimalValue = Decimal | number | string;

export function toDecimal(val: DecimalValue): Decimal {
  if (val instanceof Decimal) return val;
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) {
      throw new Error(`Invalid numeric value passed to toDecimal: ${val}`);
    }
    return new Decimal(val.toString());
  }
  return new Decimal(val || '0');
}

/**
 * Base wrapper for financial primitives
 */
export abstract class FinancialPrimitive {
  protected readonly _value: Decimal;

  constructor(value: DecimalValue) {
    this._value = toDecimal(value);
  }

  get value(): Decimal {
    return this._value;
  }

  toNumber(): number {
    return this._value.toNumber();
  }

  toString(): string {
    return this._value.toString();
  }

  toFixed(decimalPlaces = 2): string {
    return this._value.toFixed(decimalPlaces);
  }

  toDisplay(decimalPlaces = 2): string {
    return this._value.toFixed(decimalPlaces);
  }

  isZero(): boolean {
    return this._value.isZero();
  }

  isPositive(): boolean {
    return this._value.isPositive();
  }

  isNegative(): boolean {
    return this._value.isNegative();
  }
}

/** 1. Money primitive (USD or quote currency amount) */
export class Money extends FinancialPrimitive {
  readonly currency: string;

  constructor(value: DecimalValue, currency = 'USD') {
    super(value);
    this.currency = currency;
  }

  override toDisplay(decimalPlaces = 2): string {
    const prefix = this.currency === 'USD' ? '$' : '';
    const suffix = this.currency !== 'USD' ? ` ${this.currency}` : '';
    return `${prefix}${this._value.toFixed(decimalPlaces)}${suffix}`;
  }
}

/** 2. Price primitive (per-unit exchange rate) */
export class Price extends FinancialPrimitive {
  readonly quoteCurrency: string;

  constructor(value: DecimalValue, quoteCurrency = 'USDT') {
    super(value);
    this.quoteCurrency = quoteCurrency;
  }

  override toDisplay(decimalPlaces = 4): string {
    return `${this._value.toFixed(decimalPlaces)} ${this.quoteCurrency}`;
  }
}

/** 3. Quantity primitive (base asset units, e.g. 1.5 ETH) */
export class Quantity extends FinancialPrimitive {
  readonly asset: string;

  constructor(value: DecimalValue, asset = '') {
    super(value);
    this.asset = asset;
  }

  override toDisplay(decimalPlaces = 6): string {
    return `${this._value.toFixed(decimalPlaces)}${this.asset ? ` ${this.asset}` : ''}`;
  }
}

/** 4. Percentage primitive (e.g. 1.5% as Decimal(1.5)) */
export class Percentage extends FinancialPrimitive {
  constructor(value: DecimalValue) {
    super(value);
  }

  toFraction(): Decimal {
    return this._value.dividedBy(100);
  }

  toBps(): Decimal {
    return this._value.times(100);
  }

  override toDisplay(decimalPlaces = 2): string {
    return `${this._value.toFixed(decimalPlaces)}%`;
  }
}

/** 5. Fee primitive */
export class Fee extends FinancialPrimitive {
  readonly feeType: 'FIXED' | 'PERCENT';

  constructor(value: DecimalValue, feeType: 'FIXED' | 'PERCENT' = 'FIXED') {
    super(value);
    this.feeType = feeType;
  }

  override toDisplay(decimalPlaces = 4): string {
    if (this.feeType === 'PERCENT') {
      return `${this._value.toFixed(decimalPlaces)}%`;
    }
    return `$${this._value.toFixed(decimalPlaces)}`;
  }
}

/** 6. Spread primitive (gross/net basis spread in percentage) */
export class Spread extends Percentage {
  readonly isNet: boolean;

  constructor(value: DecimalValue, isNet = false) {
    super(value);
    this.isNet = isNet;
  }

  override toDisplay(decimalPlaces = 2): string {
    const sign = this._value.isPositive() ? '+' : '';
    return `${sign}${this._value.toFixed(decimalPlaces)}%`;
  }
}

/** 7. Slippage primitive (percentage difference from quote) */
export class Slippage extends Percentage {
  constructor(value: DecimalValue) {
    super(value);
  }

  override toDisplay(decimalPlaces = 3): string {
    return `${this._value.toFixed(decimalPlaces)}%`;
  }
}

/** 8. GasCost primitive (network fee in Gwei / native coin / USD) */
export class GasCost extends FinancialPrimitive {
  readonly gwei: Decimal;
  readonly usd: Decimal;

  constructor(usdValue: DecimalValue, gweiValue: DecimalValue = 0) {
    super(usdValue);
    this.usd = this._value;
    this.gwei = toDecimal(gweiValue);
  }

  override toDisplay(decimalPlaces = 2): string {
    return `$${this.usd.toFixed(decimalPlaces)} (${this.gwei.toFixed(1)} Gwei)`;
  }
}

/** 9. FundingRate primitive (8h or 1h rate percentage) */
export class FundingRate extends Percentage {
  readonly intervalHours: number;

  constructor(value: DecimalValue, intervalHours = 8) {
    super(value);
    this.intervalHours = intervalHours;
  }

  toAnnualizedApr(): Decimal {
    // intervalHours in day = 24 / intervalHours
    const periodsPerYear = new Decimal(365).times(24 / this.intervalHours);
    return this._value.times(periodsPerYear);
  }

  toAnnualizedApy(): Decimal {
    const periodsPerYear = new Decimal(365).times(24 / this.intervalHours).toNumber();
    const periodFraction = this._value.dividedBy(100);
    // (1 + r)^n - 1
    const one = new Decimal(1);
    const base = one.plus(periodFraction);
    return base.pow(periodsPerYear).minus(1).times(100);
  }

  override toDisplay(decimalPlaces = 4): string {
    const sign = this._value.isPositive() ? '+' : '';
    return `${sign}${this._value.toFixed(decimalPlaces)}% (${this.intervalHours}h)`;
  }
}

/** 10. APY primitive (Annual Percentage Yield with compounding) */
export class APY extends Percentage {
  constructor(value: DecimalValue) {
    super(value);
  }

  override toDisplay(decimalPlaces = 2): string {
    return `${this._value.toFixed(decimalPlaces)}% APY`;
  }
}

/** 11. APR primitive (Annual Percentage Rate simple interest) */
export class APR extends Percentage {
  constructor(value: DecimalValue) {
    super(value);
  }

  override toDisplay(decimalPlaces = 2): string {
    return `${this._value.toFixed(decimalPlaces)}% APR`;
  }
}

/** 12. Timestamp primitive (millisecond epoch) */
export class Timestamp {
  readonly epochMs: number;

  constructor(epochMs: number = Date.now()) {
    this.epochMs = epochMs;
  }

  toISOString(): string {
    return new Date(this.epochMs).toISOString();
  }

  toTimeString(): string {
    return new Date(this.epochMs).toLocaleTimeString();
  }
}

/** 13. Duration primitive (milliseconds, seconds, minutes) */
export class Duration {
  readonly ms: number;

  constructor(ms: number) {
    this.ms = ms;
  }

  get seconds(): number {
    return this.ms / 1000;
  }

  get minutes(): number {
    return this.ms / 60000;
  }

  toDisplay(): string {
    if (this.ms < 1000) return `${this.ms}ms`;
    if (this.ms < 60000) return `${(this.ms / 1000).toFixed(1)}s`;
    return `${(this.ms / 60000).toFixed(1)}m`;
  }
}
