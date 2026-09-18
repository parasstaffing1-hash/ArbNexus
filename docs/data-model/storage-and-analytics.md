# Storage Architecture & Analytics Lake

## 1. Multi-Tiered Storage Topology

ArbNexus employs a hybrid storage strategy optimized for transactional state, high-frequency tick archiving, and high-performance vector analytics:

```
+-------------------------------------------------------------------------------+
|                             HYBRID STORAGE TIERS                              |
+---------------------+-------------------------+-------------------------------+
| Tier                | Technology              | Workload / Retention          |
+---------------------+-------------------------+-------------------------------+
| 1. Transactional    | PostgreSQL + Prisma     | Users, Auth, Config, Alerts,  |
|    (OLTP)           |                         | Audited Opportunity History   |
+---------------------+-------------------------+-------------------------------+
| 2. Real-Time Cache  | Valkey / Redis          | Active Sessions, In-Flight    |
|                     |                         | Spreads, Heartbeat Leases     |
+---------------------+-------------------------+-------------------------------+
| 3. High-Frequency   | Partitioned Parquet on  | Tick-by-tick Trades, L2 Depth |
|    Data Lake        | Local Disk / S3 / R2    | Snapshots, OrderBook Deltas   |
+---------------------+-------------------------+-------------------------------+
| 4. Vector Analytics | DuckDB (Embedded Engine)| Historical Replay, Backtest   |
|    & Research       | ClickHouse / QuestDB    | Analytics, Parameter Sweep    |
+---------------------+-------------------------+-------------------------------+
```

---

## 2. Parquet Partitioning Scheme

Historical market data is organized on disk (or Cloudflare R2 / S3 object storage) using standardized Hive-style directory partitioning:

```
data/
└── market-data/
    ├── trades/
    │   └── exchange=binance/
    │       └── symbol=BTC-USDT/
    │           └── year=2026/
    │               └── month=09/
    │                   └── day=17/
    │                       └── trades_00000.parquet
    ├── orderbooks/
    │   └── exchange=bybit/
    │       └── symbol=ETH-USDT/
    │           └── date=2026-09-17/
    │               └── depth_snapshots.parquet
    └── funding/
        └── exchange=hyperliquid/
            └── symbol=SOL-USDC/
                └── funding_history.parquet
```

### Columnar Arrow Schema for Parquet Trades

```
Field Name           Arrow Data Type        Nullable
---------------------------------------------------
id                   Utf8                   false
exchange             Dictionary(Int8, Utf8) false
symbol               Dictionary(Int16, Utf8)false
price                Decimal128(18, 8)      false
size                 Decimal128(18, 8)      false
side                 Int8 (0=BUY, 1=SELL)   false
timestamp            Timestamp(ms)          false
received_timestamp   Timestamp(ms)          false
latency_ms           Int32                  false
```

---

## 3. DuckDB Vectorized Analytics Engine

ArbNexus embeds **DuckDB** as the default zero-infrastructure analytical query engine. Because DuckDB executes directly against compressed Parquet files with zero serialization penalty, it can query hundreds of millions of ticks per second:

### Example: Arbitrage Opportunity Spread Analysis via DuckDB

```sql
SELECT
    binance.timestamp,
    binance.bid AS binance_bid,
    bybit.ask AS bybit_ask,
    (binance.bid - bybit.ask) AS raw_spread,
    ((binance.bid - bybit.ask) / bybit.ask) * 10000 AS spread_bps
FROM
    read_parquet('data/market-data/trades/exchange=binance/symbol=BTC-USDT/**/*.parquet') AS binance
JOIN
    read_parquet('data/market-data/trades/exchange=bybit/symbol=BTC-USDT/**/*.parquet') AS bybit
ON
    binance.timestamp = bybit.timestamp
WHERE
    binance.bid > bybit.ask
ORDER BY
    spread_bps DESC
LIMIT 100;
```

---

## 4. Pluggable Timeseries Adapters

For enterprise deployments requiring high-ingest real-time streaming queries, ArbNexus provides unified interfaces to swap between:

- **DuckDB** (Default: Zero config, embedded, local development).
- **QuestDB** (Ultra-low latency SQL timeseries ingest).
- **ClickHouse** (Distributed analytics for petabyte-scale tick data).
- **TimescaleDB** (PostgreSQL-native timeseries hypertable extension).

Switching is handled via the `ANALYTICS_BACKEND` environment variable (`duckdb` | `questdb` | `clickhouse` | `timescaledb`).
