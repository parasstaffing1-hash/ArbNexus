# ArbNexus Site Reliability Engineering (SRE) & Disaster Recovery Runbook

**System:** ArbNexus — Master Crypto Arbitrage Intelligence Platform  
**Classification:** Operational Security & High-Availability Manual  
**Safety Protocol:** Read-Only Intelligence Enforced (`ENABLE_EXECUTION=false`)  
**Target Architecture:** PostgreSQL (Prisma), NATS JetStream, Valkey/Redis, ClickHouse, Cloudflare R2, Next.js / NestJS

---

## 1. High-Availability & Disaster Recovery Objectives

| Metric                             | Target                                        | Rationale                                                                                            |
| :--------------------------------- | :-------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **RTO (Recovery Time Objective)**  | **< 5 minutes**                               | Automated hot-standby services and stateless container restarts ensure rapid recovery.               |
| **RPO (Recovery Point Objective)** | **< 1 second (streaming) / < 1 hour (state)** | NATS JetStream persistent WAL retains unacknowledged event streams; database snapshots occur hourly. |
| **Availability SLA**               | **99.95%**                                    | Continuous monitoring, rate limiting, circuit breaking, and multi-venue redundancy.                  |

---

## 2. Incident Classification & Severity Matrix

- **P1 - Critical (Immediate Escalation, 15m Response):**
  - Any server-side violation or bypass attempt of `ENABLE_EXECUTION=false`.
  - Database corruption or unrecoverable PostgreSQL disk failure.
  - Hardcoded API secret or cryptographic key leak alert.
- **P2 - Major (1 Hour Response):**
  - NATS JetStream partition failure or message queue consumer lag exceeding 10,000 messages.
  - WebSocket gateway connection drops affecting >20% of concurrent connected dashboards.
  - Complete disruption of major CEX/DEX data feed (e.g., Binance, Bybit, Uniswap v3).
- **P3 - Minor (4 Hours Response):**
  - R2 historical tick archiving cron failure.
  - Non-critical telemetry or Grafana/Prometheus exporter latency.
  - Cosmetic frontend render warning.

---

## 3. Subsystem Failure Runbooks

### Runbook A: PostgreSQL Database Outage & Cold Restore

#### Symptoms:

- NestJS API throws `PrismaClientInitializationError` or connection timeout on port 5432.
- Dashboard indicates disconnected database state.

#### Immediate Action:

1. Verify container or managed instance status:
   ```bash
   docker compose ps postgres
   docker compose logs --tail 100 postgres
   ```
2. If disk or corruption occurred, execute point-in-time recovery using the automated backup tool:
   ```bash
   # List available snapshots
   ls -lah backups/

   # Verify integrity of target snapshot
   npx tsx scripts/backup-database.ts --verify backups/arbnexus-db-backup-<TIMESTAMP>.json.gz
   ```
3. Run database migrations to re-sync schema:
   ```bash
   pnpm prisma:generate
   pnpm --filter api prisma migrate deploy
   ```

---

### Runbook B: NATS JetStream Event Broker Outage

#### Symptoms:

- Indexer / Listeners report `NatsConnectionError` or disconnected event bus.
- Real-time opportunities stop streaming to WebSocket gateway.

#### Immediate Action:

1. Check NATS server container:
   ```bash
   docker compose ps nats
   docker compose restart nats
   ```
2. Verify streams and consumers:
   ```bash
   nats stream list
   nats stream report
   ```
3. Restart Indexer and Data Engine workers:
   ```bash
   pnpm --filter indexer dev
   ```

---

### Runbook C: Cloudflare R2 / S3 Dataset Storage Unreachability

#### Symptoms:

- Historical tick archive job logs HTTP 500/503 from S3 endpoint.
- Scheduled task `task-4226` reports upload retry exhaustion.

#### Recovery Procedure:

1. Validate Cloudflare R2 credentials:
   ```bash
   # Ensure environment variables are populated
   echo $R2_ACCESS_KEY_ID
   echo $R2_ENDPOINT
   ```
2. Run manual tick archive sync:
   ```bash
   npx tsx scripts/archive-ticks-to-r2.ts
   ```
3. Ticks will buffer locally in DuckDB/parquet partition buffer until R2 reachability is restored.

---

### Runbook D: CEX / DEX Rate Limit Exceeded (HTTP 429 / Cloudflare Shield)

#### Symptoms:

- Exchange connectors log `RateLimitExceeded` or CCXT throws `DDoSProtection`.
- Liquidity depth updates drop below target refresh interval.

#### Mitigation:

1. Bottleneck token-bucket automatically scales down request concurrency.
2. Opossum circuit breaker trips to `OPEN` state to prevent IP bans.
3. Fallback to secondary read-only mirror endpoints:
   - For Binance: switch from `api.binance.com` to `api1.binance.com` / `api3.binance.com`.
   - For Uniswap / Raydium: switch RPC endpoints to secondary fallbacks in `rpc.config.ts`.

---

### Runbook E: Execution Safety Lockout & Zero-Trust Verification

#### Strict Mandate:

**ArbNexus is strictly an Arbitrage Intelligence Platform. Live execution of trades, orders, funds movement, or blockchain transactions is permanently disabled.**

#### Verification:

1. Verify `ENABLE_EXECUTION` environment flag:
   ```bash
   node -e "console.log(process.env.ENABLE_EXECUTION === 'true' ? 'CRITICAL VIOLATION' : 'SECURE: EXECUTION DISABLED');"
   ```
2. Verify `ExecutionSafetyGuard` intercepts prohibited routes:
   - Any HTTP POST/PUT/DELETE to `/execute`, `/trade`, `/orders/live`, `/withdraw`, or `/broadcast` must return `HTTP 403 Forbidden` with payload:
   ```json
   {
     "statusCode": 403,
     "error": "Forbidden",
     "message": "EXECUTION_DISABLED: ArbNexus is operating in read-only intelligence and simulation mode. Live order placement, wallet transactions, and exchange withdrawals are permanently disallowed by policy.",
     "timestamp": "2026-09-18T...",
     "safetyPolicy": "ENABLE_EXECUTION=false"
   }
   ```
