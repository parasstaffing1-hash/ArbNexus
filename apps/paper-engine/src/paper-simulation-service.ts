import Decimal from 'decimal.js';
import {
  PaperExchange,
  PaperAccount,
  PaperOrder,
  PaperPosition,
  PaperFill,
} from '@arbitrage/arbitrage-engine';
import { Opportunity } from '@arbitrage/arbitrage-engine';

export interface PaperTradeExecutionPlan {
  opportunityId: string;
  strategy: string;
  legs: {
    venue: string;
    action: 'BUY' | 'SELL';
    symbol: string;
    amount: string;
    expectedPrice: string;
  }[];
  timestamp: number;
}

export interface PaperExecutionReport {
  executionId: string;
  opportunityId: string;
  status: 'FILLED' | 'PARTIAL' | 'REJECTED';
  grossProfitUsd: string;
  netProfitUsd: string;
  totalFeesUsd: string;
  totalSlippageUsd: string;
  executedAt: number;
  orders: PaperOrder[];
}

export class PaperSimulationService {
  private exchanges: Map<string, PaperExchange> = new Map();
  private executionReports: PaperExecutionReport[] = [];
  public readonly isLiveExecutionAllowed: boolean = false; // Hard server-side enforcement

  constructor(venues: string[] = ['binance', 'bybit', 'okx', 'uniswap_v3', 'raydium']) {
    // Strictly enforce NO LIVE EXECUTION rule
    if (process.env.ENABLE_EXECUTION === 'true') {
      console.warn('[SECURITY] Real execution requested but blocked by Master Architecture Rule.');
    }

    venues.forEach((venue) => {
      this.exchanges.set(venue.toLowerCase(), new PaperExchange(venue, 250000, 35, 10));
    });
  }

  getExchange(venue: string): PaperExchange {
    const key = venue.toLowerCase();
    if (!this.exchanges.has(key)) {
      this.exchanges.set(key, new PaperExchange(venue, 100000, 40, 10));
    }
    return this.exchanges.get(key)!;
  }

  getAllAccounts(): Record<string, PaperAccount> {
    const res: Record<string, PaperAccount> = {};
    for (const [venue, exchange] of this.exchanges.entries()) {
      res[venue] = exchange.getAccount();
    }
    return res;
  }

  getTotalEquityUsd(): string {
    let total = new Decimal(0);
    for (const exchange of this.exchanges.values()) {
      total = total.plus(exchange.getAccount().totalEquityUsd);
    }
    return total.toFixed(2);
  }

  /**
   * Simulates execution of a multi-leg arbitrage opportunity in isolated paper mode.
   */
  async executeOpportunityPaper(opportunity: Opportunity): Promise<PaperExecutionReport> {
    const executionId = `paper-exec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const orders: PaperOrder[] = [];
    let totalFees = new Decimal(0);
    let totalSlippage = new Decimal(0);

    for (const leg of opportunity.route) {
      const exchange = this.getExchange(leg.venue);
      const order = await exchange.submitOrder({
        symbol: `${leg.fromAsset}/${leg.toAsset}`,
        type: 'MARKET',
        side: leg.action === 'buy' ? 'BUY' : 'SELL',
        amount: leg.amount,
        currentMarketPrice: leg.price,
      });

      orders.push(order);
      order.fills.forEach((f) => {
        totalFees = totalFees.plus(f.feeUsd);
        totalSlippage = totalSlippage.plus(f.slippageUsd);
      });
    }

    const grossProfit = new Decimal(opportunity.gross_profit || '0');
    const netProfit = grossProfit.minus(totalFees).minus(totalSlippage);

    const report: PaperExecutionReport = {
      executionId,
      opportunityId: opportunity.id,
      status: orders.every((o) => o.status === 'FILLED') ? 'FILLED' : 'PARTIAL',
      grossProfitUsd: grossProfit.toFixed(2),
      netProfitUsd: netProfit.toFixed(2),
      totalFeesUsd: totalFees.toFixed(2),
      totalSlippageUsd: totalSlippage.toFixed(2),
      executedAt: Date.now(),
      orders,
    };

    this.executionReports.push(report);
    return report;
  }

  getExecutionHistory(): PaperExecutionReport[] {
    return [...this.executionReports];
  }
}
