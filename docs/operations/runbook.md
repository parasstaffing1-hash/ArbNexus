# ArbNexus Operations & Deployment Runbook

## 1. Local Development Setup

### Prerequisites

- **Node.js**: $\ge 22.0.0$
- **pnpm**: $\ge 11.0.0$
- **Python**: $\ge 3.11.0$ (detected: Python 3.14)
- **Docker & Docker Compose**: (Optional for local memory mode; required for multi-container stack)

### Initial Bootstrap

```bash
# 1. Install all monorepo dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env

# 3. Generate Prisma client
pnpm run prisma:generate

# 4. Build all packages
pnpm run build:packages

# 5. Run end-to-end acceptance demonstration
pnpm run demo:acceptance
```

---

## 2. Starting Applications

### Frontend Development (Next.js 15 Terminal)

```bash
pnpm run dev:web
# Accessible at http://localhost:3000
```

### Backend API Development (NestJS)

```bash
pnpm run dev:api
# REST API: http://localhost:4000/api/v1
# Swagger UI: http://localhost:4000/api/docs
# Prometheus Metrics: http://localhost:4000/api/v1/health/metrics
```

### Python Quant Engine

```bash
cd apps/quant-engine
python -m pytest tests/test_quant.py
```

---

## 3. Production Docker Orchestration

Launch the full production stack using the root `docker-compose.yml`:

```bash
docker compose up -d
```

### Stack Services:

- **`traefik`**: Reverse proxy & SSL termination (`:80`, `:443`, Dashboard `:8080`).
- **`postgres`**: PostgreSQL 16 transactional store (`:5432`).
- **`valkey`**: Valkey 8 in-memory cache (`:6379`).
- **`nats`**: NATS JetStream event bus (`:4222`, Monitoring `:8222`).
- **`api`**: NestJS backend service (`:4000`).
- **`web`**: Next.js frontend terminal (`:3000`).
- **`prometheus`**: Metrics scraper (`:9090`).
- **`grafana`**: Observability dashboards (`:3001`).

---

## 4. Verification & Testing Commands

```bash
# Run Vitest test suites across market-data and calculators
pnpm --filter @arbitrage/market-data test
pnpm --filter @arbitrage/calculators test

# Run Python property tests
cd apps/quant-engine && python -m pytest tests/test_quant.py

# Format and code lint check
pnpm run format:check
pnpm run lint
```
