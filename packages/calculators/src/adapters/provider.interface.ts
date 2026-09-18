import Decimal from 'decimal.js';

export interface OrderBookLevel {
  price: Decimal;
  amount: Decimal;
  totalUsd: Decimal;
}

export interface OrderBookData {
  symbol: string;
  exchange: string;
  timestamp: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface FeeSchedule {
  exchange: string;
  makerFeePercent: Decimal;
  takerFeePercent: Decimal;
  withdrawalFees: Record<string, Decimal>; // token -> flat fee
  depositFeePercent: Decimal;
  vipTier: number;
}

export interface FundingRatePoint {
  symbol: string;
  exchange: string;
  fundingRate: Decimal;
  intervalHours: number;
  predictedNextRate: Decimal;
  nextFundingTimestamp: number;
}

export interface BridgeQuote {
  bridgeId: string;
  bridgeName: string;
  sourceChain: string;
  destChain: string;
  token: string;
  amount: Decimal;
  feeUsd: Decimal;
  gasCostUsd: Decimal;
  estimatedDurationSeconds: number;
  securityScore: number;
}

export interface GasQuote {
  chain: string;
  slowGwei: Decimal;
  standardGwei: Decimal;
  fastGwei: Decimal;
  nativePriceUsd: Decimal;
  typicalSwapUsd: Decimal;
}

export interface MarketDataProvider {
  getOrderBook(symbol: string, exchange: string): Promise<OrderBookData>;
  getPrice(symbol: string, exchange: string): Promise<Decimal>;
}

export interface FeeProvider {
  getFeeSchedule(exchange: string, vipTier?: number): Promise<FeeSchedule>;
}

export interface FundingProvider {
  getFundingRates(symbol: string): Promise<FundingRatePoint[]>;
}

export interface BridgeProvider {
  getBridgeQuotes(
    sourceChain: string,
    destChain: string,
    token: string,
    amount: Decimal,
  ): Promise<BridgeQuote[]>;
}

export interface GasProvider {
  getGasQuote(chain: string): Promise<GasQuote>;
}
