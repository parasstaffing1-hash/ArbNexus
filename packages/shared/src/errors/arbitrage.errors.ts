export class ArbitrageBaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class InsufficientLiquidityError extends ArbitrageBaseError {
  constructor(
    message = 'Insufficient liquidity in order book or pool',
    details?: Record<string, unknown>,
  ) {
    super(message, 'INSUFFICIENT_LIQUIDITY', details);
  }
}

export class SlippageExceededError extends ArbitrageBaseError {
  constructor(
    message = 'Calculated slippage exceeds maximum allowed tolerance',
    details?: Record<string, unknown>,
  ) {
    super(message, 'SLIPPAGE_EXCEEDED', details);
  }
}

export class ExchangeConnectionError extends ArbitrageBaseError {
  constructor(
    exchange: string,
    message = 'Failed to connect to exchange endpoint',
    details?: Record<string, unknown>,
  ) {
    super(`[${exchange}] ${message}`, 'EXCHANGE_CONNECTION_ERROR', { exchange, ...details });
  }
}

export class ExecutionTimeoutError extends ArbitrageBaseError {
  constructor(message = 'Trade execution timed out', details?: Record<string, unknown>) {
    super(message, 'EXECUTION_TIMEOUT', details);
  }
}
