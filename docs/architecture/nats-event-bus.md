# NATS JetStream Event Bus Specification

## 1. Role in Architecture

**NATS JetStream** serves as the central high-throughput, low-latency publish/subscribe backbone for ArbNexus. It decouples high-frequency data ingestion workers (`apps/data-engine`) from the core detection engines (`packages/arbitrage-engine`), quantitative models (`apps/quant-engine`), historical archive stores (Parquet/DuckDB), and WebSocket distribution gateways (`apps/api`).

---

## 2. Topic Taxonomy & Stream Configuration

ArbNexus divides message subjects into four dedicated JetStream streams:

```
+-------------------+----------------------------------------+------------------+
| Stream Name       | Subjects                               | Storage / Limit  |
+-------------------+----------------------------------------+------------------+
| MARKET_STREAM     | market.ticker.*.*                      | Memory / 100k    |
|                   | market.orderbook.*.*                   | Memory / 20k     |
|                   | market.trade.*.*                       | File / 1M        |
|                   | market.funding.*.*                     | File / 50k       |
+-------------------+----------------------------------------+------------------+
| ONCHAIN_STREAM    | dex.swap.*.*                           | File / 500k      |
|                   | dex.pool.*.*                           | File / 100k      |
|                   | blockchain.block.*                     | File / 50k       |
|                   | blockchain.event.*                     | File / 200k      |
+-------------------+----------------------------------------+------------------+
| ARBITRAGE_STREAM  | arbitrage.candidate                    | Memory / 50k     |
|                   | arbitrage.validated                    | File / 100k      |
|                   | arbitrage.expired                      | Memory / 50k     |
|                   | alerts.opportunity                     | File / 50k       |
+-------------------+----------------------------------------+------------------+
| TELEMETRY_STREAM  | telemetry.heartbeat.*                  | Memory / 10k     |
|                   | telemetry.quality.*                    | Memory / 10k     |
|                   | telemetry.latency.*                    | Memory / 50k     |
+-------------------+----------------------------------------+------------------+
```

### Subject Wildcard Conventions

- `market.ticker.<exchange>.<symbol_canonical_token>`: e.g., `market.ticker.binance.btc_usdt`
- `market.orderbook.<exchange>.<symbol_canonical_token>`: e.g., `market.orderbook.okx.eth_usdt`
- `dex.swap.<dex_name>.<chain>`: e.g., `dex.swap.uniswap_v3.arbitrum`
- `blockchain.block.<chain>`: e.g., `blockchain.block.ethereum`

---

## 3. Canonical Message Envelope

All payloads transported across NATS JetStream are wrapped in a standard `CanonicalEnvelope<T>`:

```typescript
export interface CanonicalEnvelope<T> {
  id: string; // UUIDv4 unique event identifier
  topic: string; // Full subject topic name
  producer: string; // Emitting component e.g. "data-engine:binance-ws"
  timestamp_exchange: number; // Milliseconds timestamp from venue clock
  timestamp_ingest: number; // Epoch ms when packet arrived at socket
  timestamp_published: number; // Epoch ms when event pushed to NATS
  sequence: number; // Monotonically increasing producer sequence
  trace_id: string; // Distributed trace identifier for latency auditing
  schema_version: string; // e.g. "1.0.0"
  payload: T; // Strongly-typed payload (Ticker, OrderBook, Opportunity, etc.)
}
```

---

## 4. Consumer Patterns & Retention Policies

1. **Market Data Buffer (OrderBook & Ticker)**:
   - **Retention**: `Limits` with memory storage. Oldest messages discarded once buffer limit is reached.
   - **Consumers**: Push-based ephemeral consumer groups for real-time calculation detectors; pull-based durable consumer for Parquet batch dumper.
2. **Validated Opportunities**:
   - **Retention**: `WorkQueue` or durable file retention with 7-day retention period.
   - **Consumers**: `api-ws-broadcast` (subscribes to push notifications to frontend browsers), `postgres-audit-worker` (persists opportunities to database), and `alert-dispatcher` (evaluates user threshold alerts).
3. **In-Memory Local Fallback**:
   - For lightweight local testing or offline development without Docker, ArbNexus includes `InMemoryEventBus` implementing the identical pub/sub interface using Node.js `EventEmitter` and asynchronous iterators.
