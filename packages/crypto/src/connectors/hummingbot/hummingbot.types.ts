export type HummingbotOrderType = 'LIMIT' | 'MARKET' | 'LIMIT_MAKER';

export type HummingbotTradeType = 'BUY' | 'SELL';

export interface HummingbotOrderCandidate {
  tradingPair: string;
  isBuy: boolean;
  orderType: HummingbotOrderType;
  amount: number;
  price?: number;
}

export interface HummingbotGatewayConfig {
  gatewayUrl: string;
  passphrase?: string;
  network: string;
  chain: string;
  connector: string;
}

export interface HummingbotOrderBookDiff {
  tradingPair: string;
  bids: Array<{ price: number; amount: number }>;
  asks: Array<{ price: number; amount: number }>;
  updateId: number;
  timestamp: number;
}
