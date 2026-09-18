import { Trade, Ticker, OrderBook, FundingRate, LiquidationEvent } from './types';

export interface MarketDataRepository {
  saveTrades(trades: Trade[]): Promise<void>;
  getRecentTrades(exchange: string, symbol: string, limit?: number): Promise<Trade[]>;
  saveTicker(ticker: Ticker): Promise<void>;
  getLatestTicker(exchange: string, symbol: string): Promise<Ticker | null>;
  saveLiquidation(event: LiquidationEvent): Promise<void>;
}

export interface OrderBookRepository {
  saveSnapshot(orderBook: OrderBook): Promise<void>;
  getLatestSnapshot(exchange: string, symbol: string): Promise<OrderBook | null>;
  getDepthAtPrice(
    exchange: string,
    symbol: string,
    maxSlippageBps: number,
  ): Promise<{
    availableBidVolume: string;
    availableAskVolume: string;
    weightedBidPrice: string;
    weightedAskPrice: string;
  } | null>;
}

export interface FundingRepository {
  saveFundingRate(rate: FundingRate): Promise<void>;
  getLatestFundingRate(exchange: string, symbol: string): Promise<FundingRate | null>;
  getFundingRateHistory(exchange: string, symbol: string, limit?: number): Promise<FundingRate[]>;
  getAllCurrentFundingRates(): Promise<FundingRate[]>;
}

export interface OpportunityRepository {
  saveOpportunity(opportunity: any): Promise<void>;
  getOpportunityById(id: string): Promise<any | null>;
  getActiveOpportunities(filter?: {
    strategyType?: string;
    minNetProfit?: string;
    minRoi?: string;
  }): Promise<any[]>;
  markExpired(id: string): Promise<void>;
}

export interface HistoricalDataQuery {
  exchange: string;
  symbol: string;
  dataType: 'trades' | 'orderbook' | 'funding' | 'opportunities';
  startTime: number;
  endTime: number;
  limit?: number;
}

export interface HistoricalDataRepository {
  queryTrades(query: HistoricalDataQuery): Promise<Trade[]>;
  queryFunding(query: HistoricalDataQuery): Promise<FundingRate[]>;
  exportToParquet(query: HistoricalDataQuery, destinationPath: string): Promise<string>;
  readFromParquet(filePath: string): Promise<any[]>;
}

export class InMemoryOpportunityRepository implements OpportunityRepository {
  private items: Map<string, any> = new Map();

  async saveOpportunity(opportunity: any): Promise<void> {
    this.items.set(opportunity.id, opportunity);
  }

  async getOpportunityById(id: string): Promise<any | null> {
    return this.items.get(id) ?? null;
  }

  async getActiveOpportunities(filter?: {
    strategyType?: string;
    minNetProfit?: string;
    minRoi?: string;
  }): Promise<any[]> {
    let list = Array.from(this.items.values());
    if (filter?.strategyType) {
      list = list.filter((o) => o.strategy_type === filter.strategyType);
    }
    return list;
  }

  async markExpired(id: string): Promise<void> {
    const item = this.items.get(id);
    if (item) {
      item.lifecycle_state = 'EXPIRED';
    }
  }
}
