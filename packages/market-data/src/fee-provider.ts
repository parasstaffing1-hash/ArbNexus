import Decimal from 'decimal.js';

export type FeeStatus = 'LIVE' | 'CONFIGURED' | 'ESTIMATED' | 'UNKNOWN';

export interface FeeResult<T> {
  value: T;
  status: FeeStatus;
  lastUpdated: number;
}

export interface FeeProvider {
  getTradingFee(exchange: string, symbol: string, isMaker: boolean): FeeResult<Decimal>;
  getWithdrawalFee(exchange: string, currency: string, network?: string): FeeResult<Decimal>;
  getDepositFee(exchange: string, currency: string): FeeResult<Decimal>;
  getFeeTier(exchange: string): FeeResult<number>;
}

export class DefaultFeeProvider implements FeeProvider {
  // Configured default BPS per venue
  private exchangeFeeOverrides: Record<string, { maker: number; taker: number }> = {
    binance: { maker: 10, taker: 10 },
    bybit: { maker: 10, taker: 20 },
    okx: { maker: 8, taker: 15 },
    bitget: { maker: 10, taker: 20 },
    kucoin: { maker: 10, taker: 20 },
    gate: { maker: 15, taker: 20 },
    mexc: { maker: 0, taker: 10 },
    hyperliquid: { maker: 1, taker: 3.5 },
  };

  private withdrawalFees: Record<string, Record<string, Decimal>> = {
    binance: {
      USDT: new Decimal('1.00'),
      USDC: new Decimal('1.00'),
      BTC: new Decimal('0.0002'),
      ETH: new Decimal('0.002'),
      SOL: new Decimal('0.01'),
    },
    bybit: {
      USDT: new Decimal('1.00'),
      USDC: new Decimal('1.00'),
      BTC: new Decimal('0.0002'),
      ETH: new Decimal('0.002'),
      SOL: new Decimal('0.01'),
    },
    okx: {
      USDT: new Decimal('0.80'),
      USDC: new Decimal('0.80'),
      BTC: new Decimal('0.00018'),
      ETH: new Decimal('0.0018'),
      SOL: new Decimal('0.008'),
    },
    hyperliquid: {
      USDC: new Decimal('1.00'),
      USDT: new Decimal('1.00'),
      BTC: new Decimal('0.0001'),
      ETH: new Decimal('0.001'),
      SOL: new Decimal('0.005'),
    },
  };

  getTradingFee(exchange: string, _symbol: string, isMaker: boolean): FeeResult<Decimal> {
    const ex = exchange.toLowerCase();
    const config = this.exchangeFeeOverrides[ex];
    if (config) {
      const bps = isMaker ? config.maker : config.taker;
      return {
        value: new Decimal(bps),
        status: 'CONFIGURED',
        lastUpdated: Date.now(),
      };
    }

    return {
      value: isMaker ? new Decimal(10) : new Decimal(20),
      status: 'ESTIMATED',
      lastUpdated: Date.now(),
    };
  }

  getWithdrawalFee(exchange: string, currency: string): FeeResult<Decimal> {
    const ex = exchange.toLowerCase();
    const curr = currency.toUpperCase();
    const exMap = this.withdrawalFees[ex];

    if (exMap && exMap[curr]) {
      return {
        value: exMap[curr],
        status: 'CONFIGURED',
        lastUpdated: Date.now(),
      };
    }

    // Default fallback estimates
    const fallback =
      curr === 'BTC'
        ? new Decimal('0.0003')
        : curr === 'ETH'
          ? new Decimal('0.003')
          : new Decimal('2.0');
    return {
      value: fallback,
      status: 'ESTIMATED',
      lastUpdated: Date.now(),
    };
  }

  getDepositFee(_exchange: string, _currency: string): FeeResult<Decimal> {
    return {
      value: new Decimal(0), // Free deposits generally across all exchanges
      status: 'CONFIGURED',
      lastUpdated: Date.now(),
    };
  }

  getFeeTier(_exchange: string): FeeResult<number> {
    return {
      value: 0, // VIP 0 default tier
      status: 'CONFIGURED',
      lastUpdated: Date.now(),
    };
  }
}
