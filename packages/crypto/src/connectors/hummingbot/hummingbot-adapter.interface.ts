import {
  HummingbotGatewayConfig,
  HummingbotOrderCandidate,
  HummingbotTradeType,
} from './hummingbot.types';

export interface HummingbotOrderResult {
  orderId: string;
  clientOrderId: string;
  tradingPair: string;
  tradeType: HummingbotTradeType;
  price: number;
  amount: number;
  status: 'SUBMITTED' | 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  txHash?: string;
  timestamp: number;
}

export interface IHummingbotConnectorAdapter {
  readonly connectorName: string;
  readonly isReady: boolean;
  initialize(config: HummingbotGatewayConfig): Promise<void>;
  submitOrder(candidate: HummingbotOrderCandidate): Promise<HummingbotOrderResult>;
  cancelOrder(orderId: string, tradingPair: string): Promise<boolean>;
  getQuote(
    tradingPair: string,
    isBuy: boolean,
    amount: number,
  ): Promise<{ price: number; estimatedGas: number }>;
}
