export interface EventEnvelope<T = any> {
  event_id: string;
  timestamp: number;
  source: string; // e.g. "binance", "uniswap_v3", "data-engine"
  market: string; // e.g. "BTC/USDT", "ETH/USDC"
  sequence?: number;
  payload: T;
  schema_version: string; // e.g. "1.0.0"
  latency?: {
    exchange_ts: number;
    receive_ts: number;
    pipeline_latency_ms: number;
  };
}

export const TOPICS = {
  MARKET_TRADE: 'market.trade',
  MARKET_TICKER: 'market.ticker',
  MARKET_ORDERBOOK: 'market.orderbook',
  MARKET_ORDERBOOK_DELTA: 'market.orderbook.delta',
  MARKET_FUNDING: 'market.funding',
  MARKET_LIQUIDATION: 'market.liquidation',
  MARKET_STATUS: 'market.status',

  DEX_SWAP: 'dex.swap',
  DEX_POOL: 'dex.pool',
  DEX_LIQUIDITY: 'dex.liquidity',

  BLOCKCHAIN_BLOCK: 'blockchain.block',
  BLOCKCHAIN_TRANSACTION: 'blockchain.transaction',
  BLOCKCHAIN_EVENT: 'blockchain.event',

  ARBITRAGE_CANDIDATE: 'arbitrage.candidate',
  ARBITRAGE_VALIDATED: 'arbitrage.validated',
  ARBITRAGE_EXPIRED: 'arbitrage.expired',

  ALERTS_OPPORTUNITY: 'alerts.opportunity',
} as const;

export type EventTopic = (typeof TOPICS)[keyof typeof TOPICS];

export function createEnvelope<T>(
  source: string,
  market: string,
  payload: T,
  options?: {
    sequence?: number;
    exchangeTimestamp?: number;
    eventId?: string;
  },
): EventEnvelope<T> {
  const now = Date.now();
  const exchangeTs = options?.exchangeTimestamp ?? now;
  return {
    event_id:
      options?.eventId ??
      `${source}-${market}-${now}-${Math.random().toString(36).substring(2, 8)}`,
    timestamp: now,
    source,
    market,
    sequence: options?.sequence,
    payload,
    schema_version: '1.0.0',
    latency: {
      exchange_ts: exchangeTs,
      receive_ts: now,
      pipeline_latency_ms: Math.max(0, now - exchangeTs),
    },
  };
}
