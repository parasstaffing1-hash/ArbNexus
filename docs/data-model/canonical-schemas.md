# ArbNexus Canonical Schemas & Data Model

## 1. Design Principles

All raw payloads received from centralized exchanges, decentralized AMMs, and blockchain RPC nodes are immediately mapped to uniform canonical representations before entering the event pipeline:

1. **Strong Typing & Numeric Safety**: Prices, quantities, rates, and spreads are represented as high-precision strings or `Decimal` objects to completely prevent IEEE-754 floating-point errors.
2. **Canonical Symbols**: Instruments are unified as `<BASE>/<QUOTE>` (e.g., `BTC/USDT`, `ETH/USDC`).
3. **Traceability**: Every record carries native exchange timestamp, ingest timestamp, and latency metrics.

---

## 2. Core Market Schemas

### 2.1 Ticker

Top-of-book snapshot and 24-hour summary statistics:

```typescript
export interface Ticker {
  exchange: string; // e.g. "binance", "bybit", "hyperliquid"
  symbol: string; // Canonical symbol e.g. "BTC/USDT"
  base_asset?: string; // "BTC"
  quote_asset?: string; // "USDT"
  bid: string; // Best bid price
  bid_size?: string; // Quantity available at best bid
  ask: string; // Best ask price
  ask_size?: string; // Quantity available at best ask
  last: string; // Last traded price
  volume_24h?: string; // Rolling 24-hour trading volume
  timestamp: number; // Venue epoch timestamp in ms
  exchange_timestamp?: number; // Raw venue exchange timestamp
  received_timestamp?: number; // Ingest engine timestamp in ms
  latency_ms?: number; // (received_timestamp - exchange_timestamp)
  sequence?: number; // Venue sequence / update counter
  data_quality?: DataQualityStatus; // "VALID" | "STALE" | "SUSPICIOUS" | "INVALID"
}
```

### 2.2 Trade

Executed market trade event:

```typescript
export interface Trade {
  id: string; // Unique trade ID from venue
  exchange: string;
  symbol: string;
  price: string;
  size: string;
  side: 'BUY' | 'SELL';
  timestamp: number;
  cost?: string; // price * size
}
```

### 2.3 OrderBook & PriceLevel

Full L2 aggregated order-book snapshot and delta representations:

```typescript
export interface PriceLevel {
  price: string; // Price level string
  amount: string; // Volume available at price
  ordersCount?: number; // Optional count of individual resting orders
}

export interface OrderBook {
  exchange: string;
  symbol: string;
  bids: PriceLevel[]; // Sorted strictly descending: bids[0].price > bids[1].price
  asks: PriceLevel[]; // Sorted strictly ascending: asks[0].price < asks[1].price
  timestamp: number;
  sequence?: number; // Monotonic sequence number
  checksum?: number; // Venue-computed CRC32 checksum for verification
  lastUpdateId?: number;
}
```

### 2.4 Funding Rate

Derivatives funding rates and interval normalizations:

```typescript
export interface FundingRate {
  exchange: string;
  symbol: string;
  rate: string; // Raw interval rate (e.g. "0.0001" = 0.01%)
  interval_hours: number; // Standard interval (e.g. 8 for Binance, 1 for Hyperliquid)
  predicted_rate?: string; // Estimated next funding rate
  timestamp: number; // Current cycle timestamp
  next_funding_time: number; // Epoch timestamp of next settlement
  open_interest?: string; // Current open contracts in notional USD
}

export interface NormalizedFundingData {
  exchange: string;
  symbol: string;
  rawRate: string;
  intervalHours: number;
  hourlyRate: string; // rate / intervalHours
  dailyRate: string; // hourlyRate * 24
  weeklyRate: string; // dailyRate * 7
  annualizedRate: string; // dailyRate * 365
  nextFundingTimestamp: number;
  timestamp: number;
}
```

---

## 3. Universal Opportunity Model

The normalized schema representing detected, fee-adjusted, and executable arbitrage candidates:

```typescript
export type StrategyType =
  | 'SPOT_CEX_CEX'
  | 'SPOT_CEX_DEX'
  | 'SPOT_DEX_DEX'
  | 'TRIANGULAR'
  | 'MULTI_HOP'
  | 'CROSS_CHAIN'
  | 'STABLECOIN'
  | 'FUNDING'
  | 'BASIS'
  | 'PERP_PERP'
  | 'STATISTICAL'
  | 'PAIRS'
  | 'LIQUIDATION'
  | 'ONCHAIN_MEV';

export interface OpportunityRouteLeg {
  source_venue: string;
  target_venue: string;
  source_asset: string;
  target_asset: string;
  action: 'BUY' | 'SELL' | 'SWAP' | 'BRIDGE' | 'BORROW' | 'REPAY';
  expected_price: string;
  executable_quantity: string;
  estimated_fee: string;
  estimated_slippage_bps: number;
}

export interface Opportunity {
  id: string;
  strategy_type: StrategyType;
  asset: string;
  route: OpportunityRouteLeg[];
  venues: string[];
  chains: string[];
  entry_price: string;
  exit_price: string;
  gross_spread: string;
  gross_profit: string;
  trading_fees: string;
  withdrawal_fees: string;
  gas_cost: string;
  bridge_cost: string;
  slippage: string;
  expected_net_profit: string;
  expected_roi: string;
  required_capital: string;
  max_executable_size: string;
  estimated_duration_ms: number;
  latency: LatencyMetrics;
  liquidity_score: number;
  data_quality: DataQualityStatus;
  execution_risk: RiskScore; // "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "D"
  timestamp: number;
  detected_at?: number;
  last_valid_at?: number;
  expires_at?: number;
  status?: OpportunityStatus; // "DETECTED" | "VALIDATING" | "VALID" | "STALE" | "EXPIRED"
}
```
