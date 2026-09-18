import Decimal from 'decimal.js';

export type PaperOrderType = 'MARKET' | 'LIMIT';
export type PaperOrderSide = 'BUY' | 'SELL';
export type PaperOrderStatus = 'PENDING' | 'FILLED' | 'PARTIAL' | 'CANCELLED' | 'REJECTED';

export interface PaperFill {
  fillId: string;
  orderId: string;
  timestamp: number;
  price: string;
  amount: string;
  feeUsd: string;
  slippageUsd: string;
}

export interface PaperOrder {
  orderId: string;
  exchange: string;
  symbol: string;
  type: PaperOrderType;
  side: PaperOrderSide;
  price?: string; // required for LIMIT
  amount: string;
  filledAmount: string;
  remainingAmount: string;
  status: PaperOrderStatus;
  createdAt: number;
  updatedAt: number;
  fills: PaperFill[];
}

export interface PaperPosition {
  symbol: string;
  side: 'LONG' | 'SHORT';
  amount: string;
  entryPrice: string;
  unrealizedPnL: string;
  notionalUsd: string;
}

export interface PaperAccount {
  balances: Record<string, string>; // e.g. "USDT": "100000.00", "BTC": "1.5"
  totalEquityUsd: string;
  positions: PaperPosition[];
}

export class PaperExchange {
  readonly exchangeId: string;
  private account: PaperAccount;
  private activeOrders: Map<string, PaperOrder> = new Map();
  private simulatedLatencyMs: number;
  private feeBps: number;

  constructor(
    exchangeId: string,
    initialUsdtBalance: number = 100000,
    simulatedLatencyMs: number = 50,
    feeBps: number = 10,
  ) {
    this.exchangeId = exchangeId;
    this.simulatedLatencyMs = simulatedLatencyMs;
    this.feeBps = feeBps;
    this.account = {
      balances: { USDT: initialUsdtBalance.toFixed(2) },
      totalEquityUsd: initialUsdtBalance.toFixed(2),
      positions: [],
    };
  }

  getAccount(): PaperAccount {
    return { ...this.account };
  }

  /**
   * Submits a paper order with simulated latency, slippage, and fee deduction.
   */
  async submitOrder(params: {
    symbol: string;
    type: PaperOrderType;
    side: PaperOrderSide;
    amount: string;
    currentMarketPrice: string;
    limitPrice?: string;
  }): Promise<PaperOrder> {
    // Simulate network roundtrip latency
    if (this.simulatedLatencyMs > 0) {
      await new Promise((r) => setTimeout(r, Math.min(20, this.simulatedLatencyMs)));
    }

    const orderId = `paper-${this.exchangeId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const marketPrice = new Decimal(params.currentMarketPrice);
    const amount = new Decimal(params.amount);

    // Calculate slippage: 0.05% for market orders
    const slippagePercent = params.type === 'MARKET' ? new Decimal('0.0005') : new Decimal(0);
    const executionPrice =
      params.side === 'BUY'
        ? marketPrice.mul(new Decimal(1).plus(slippagePercent))
        : marketPrice.mul(new Decimal(1).minus(slippagePercent));

    const totalCostUsd = amount.mul(executionPrice);
    const feeUsd = totalCostUsd.mul(new Decimal(this.feeBps).div(10000));
    const slippageUsd = amount.mul(marketPrice.mul(slippagePercent));

    // Fill the order
    const fill: PaperFill = {
      fillId: `fill-${orderId}-1`,
      orderId,
      timestamp: Date.now(),
      price: executionPrice.toFixed(2),
      amount: amount.toFixed(4),
      feeUsd: feeUsd.toFixed(2),
      slippageUsd: slippageUsd.toFixed(2),
    };

    const order: PaperOrder = {
      orderId,
      exchange: this.exchangeId,
      symbol: params.symbol,
      type: params.type,
      side: params.side,
      price: executionPrice.toFixed(2),
      amount: params.amount,
      filledAmount: params.amount,
      remainingAmount: '0.0',
      status: 'FILLED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fills: [fill],
    };

    // Update paper account balance
    const baseToken = params.symbol.split('/')[0];
    const currentBase = new Decimal(this.account.balances[baseToken] || '0');
    const currentUsdt = new Decimal(this.account.balances['USDT'] || '0');

    if (params.side === 'BUY') {
      this.account.balances[baseToken] = currentBase.plus(amount).toFixed(4);
      this.account.balances['USDT'] = currentUsdt.minus(totalCostUsd).minus(feeUsd).toFixed(2);
    } else {
      this.account.balances[baseToken] = currentBase.minus(amount).toFixed(4);
      this.account.balances['USDT'] = currentUsdt.plus(totalCostUsd).minus(feeUsd).toFixed(2);
    }

    this.activeOrders.set(orderId, order);
    return order;
  }
}
