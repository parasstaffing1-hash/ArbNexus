# ArbNexus Documentation Index

Welcome to the comprehensive technical documentation suite for **ArbNexus** — an institutional-grade, real-time crypto arbitrage intelligence and quantitative research platform.

---

## Documentation Structure

### 1. [System Architecture](architecture/overview.md)

- [Architecture Overview](architecture/overview.md) — System philosophy, safety boundaries, high-level dataflow diagram, and latency pipeline.
- [NATS JetStream Event Bus](architecture/nats-event-bus.md) — Pub/Sub topics, stream retention policies, message envelope schemas, and fallback mode.

### 2. [Data Model & Storage](data-model/canonical-schemas.md)

- [Canonical Schemas](data-model/canonical-schemas.md) — Normalized schemas for Ticker, Trade, OrderBook, FundingRate, and the 14-strategy Universal Opportunity model.
- [Storage Architecture & Analytics](data-model/storage-and-analytics.md) — Multi-tiered storage topology, Hive-partitioned Parquet data lake, DuckDB vectorized queries, and pluggable timeseries engines.

### 3. [Centralized Exchanges (CEX)](exchanges/cex-connectors.md)

- [CEX Connector Architecture](exchanges/cex-connectors.md) — BaseExchangeAdapter, WebSocket heartbeat watchdog, sequence gap recovery, and 8 implemented venue adapters.
- [Fee Schedules & Cost Modeling](exchanges/fee-schedules.md) — Maker/taker rates, VIP tiers, withdrawal costs, and hierarchical dynamic fee resolution.

### 4. [Decentralized Exchanges (DEX)](dexes/dex-connectors.md)

- [DEX Connectors](dexes/dex-connectors.md) — EVM & Solana DEX connectors (Uniswap v2/v3, Jupiter, Raydium, 1inch, Orca).
- [AMM Mathematics](dexes/amm-mathematics.md) — Constant product formulas, concentrated liquidity tick math, and analytical optimal trade sizing.

### 5. [Arbitrage Strategies](arbitrage-strategies/strategies-catalog.md)

- [Strategy Catalog](arbitrage-strategies/strategies-catalog.md) — Comprehensive specifications for all 14 strategy types, mathematical formulas, trigger conditions, and execution risk ratings.

### 6. [Calculators & Financial Math](calculators/deterministic-math.md)

- [Deterministic Mathematics](calculators/deterministic-math.md) — Zero-float policy, Decimal.js arbitrary precision guarantees, depth-weighted execution simulation, and immutable audit trails.

### 7. [Backtesting & Simulation](backtesting/backtest-engine.md)

- [Backtesting Engine](backtesting/backtest-engine.md) — Event-driven historical tick and depth replay, realistic fill modeling, slippage/fee drag, and risk-adjusted metrics.

### 8. [Blockchain & MEV](blockchain/indexers-and-mev.md)

- [Indexers & MEV Simulation](blockchain/indexers-and-mev.md) — EVM & Solana event indexers, EIP-1559 gas oracles, mempool sandwich analysis, and backrun discovery.

### 9. [Data Quality & Observability](data-quality/quality-rules.md)

- [Data Quality Engine](data-quality/quality-rules.md) — Validation rules (crossed books, sequence gaps, checksums, clock drift, anomaly filters).
- [Monitoring & Metrics](operations/monitoring-and-metrics.md) — Prometheus metrics reference, Grafana dashboards, and alert thresholds.

### 10. [Operations & Compliance](operations/runbook.md)

- [Operations Runbook](operations/runbook.md) — Local development bootstrap, Docker Compose orchestration, testing procedures, and verification.
- [Third-Party Licenses](third-party-licenses.md) — Complete dependency license audit and compliance records.
