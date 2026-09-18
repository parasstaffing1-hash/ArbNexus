# Third-Party Open Source Licensing & Compliance Audit

This document inventories the third-party dependencies utilized throughout the **ArbNexus** Master Crypto Arbitrage Platform, including their licensing terms, repository links, usage context, and copyleft/commercial compliance classifications.

---

## 1. Dependency Inventory & License Classifications

| Package / Library          | Version  | License      | Repository                                         | Purpose                                | Copyleft / Restrictive? |
| :------------------------- | :------- | :----------- | :------------------------------------------------- | :------------------------------------- | :---------------------- |
| **Next.js**                | 15.2.0   | MIT          | https://github.com/vercel/next.js                  | Web framework & SSR                    | Permissive (No)         |
| **React**                  | 19.0.0   | MIT          | https://github.com/facebook/react                  | UI rendering engine                    | Permissive (No)         |
| **NestJS**                 | 11.0.0   | MIT          | https://github.com/nestjs/nest                     | Backend API & WebSocket server         | Permissive (No)         |
| **TypeScript**             | 5.7.3    | Apache 2.0   | https://github.com/microsoft/TypeScript            | Static type system                     | Permissive (No)         |
| **Decimal.js**             | 10.5.0   | MIT          | https://github.com/MikeMcl/decimal.js              | Arbitrary-precision financial math     | Permissive (No)         |
| **Zod**                    | 3.24.2   | MIT          | https://github.com/colinhacks/zod                  | Schema declaration & validation        | Permissive (No)         |
| **CCXT**                   | 4.4.60   | MIT          | https://github.com/ccxt/ccxt                       | Public cryptocurrency exchange feeds   | Permissive (No)         |
| **Three.js**               | 0.186.0  | MIT          | https://github.com/mrdoob/three.js                 | 3D background visualization & globe    | Permissive (No)         |
| **Socket.IO**              | 4.8.1    | MIT          | https://github.com/socketio/socket.io              | Real-time WebSocket streaming          | Permissive (No)         |
| **Prisma**                 | 6.4.1    | Apache 2.0   | https://github.com/prisma/prisma                   | ORM & PostgreSQL database client       | Permissive (No)         |
| **Viem**                   | 2.23.0   | MIT          | https://github.com/wevm/viem                       | EVM blockchain interaction             | Permissive (No)         |
| **Wagmi**                  | 2.14.0   | MIT          | https://github.com/wevm/wagmi                      | React Web3 hooks                       | Permissive (No)         |
| **RainbowKit**             | 2.2.0    | MIT          | https://github.com/rainbow-me/rainbowkit           | Wallet connection modal                | Permissive (No)         |
| **TanStack Table**         | 8.21.2   | MIT          | https://github.com/TanStack/table                  | Headless virtualized data tables       | Permissive (No)         |
| **TanStack Query**         | 5.66.0   | MIT          | https://github.com/TanStack/query                  | Async state caching & synchronization  | Permissive (No)         |
| **Zustand**                | 5.0.3    | MIT          | https://github.com/pmndrs/zustand                  | Lightweight global client state        | Permissive (No)         |
| **Framer Motion**          | 12.4.7   | MIT          | https://github.com/motiondivision/motion           | 60fps physics-based animations         | Permissive (No)         |
| **Tailwind CSS**           | 3.4.17   | MIT          | https://github.com/tailwindlabs/tailwindcss        | Utility-first CSS styling              | Permissive (No)         |
| **Lucide React**           | 0.475.0  | ISC          | https://github.com/lucide-icons/lucide             | UI icons                               | Permissive (No)         |
| **DuckDB (Python)**        | 1.2.0    | MIT          | https://github.com/duckdb/duckdb                   | In-process analytical OLAP engine      | Permissive (No)         |
| **Polars**                 | 1.23.0   | MIT          | https://github.com/pola-rs/polars                  | High-speed multi-threaded DataFrames   | Permissive (No)         |
| **PyArrow**                | 19.0.0   | Apache 2.0   | https://github.com/apache/arrow                    | Arrow columnar format & Parquet        | Permissive (No)         |
| **NumPy**                  | 2.2.3    | BSD 3-Clause | https://github.com/numpy/numpy                     | Scientific numerical primitives        | Permissive (No)         |
| **SciPy**                  | 1.15.2   | BSD 3-Clause | https://github.com/scipy/scipy                     | Portfolio & nonlinear optimization     | Permissive (No)         |
| **Statsmodels**            | 0.14.4   | BSD 3-Clause | https://github.com/statsmodels/statsmodels         | Statistical time series & ADF tests    | Permissive (No)         |
| **FastAPI**                | 0.115.8  | MIT          | https://github.com/tiangolo/fastapi                | Python research microservice           | Permissive (No)         |
| **Hypothesis**             | 6.127.3  | MPL 2.0      | https://github.com/HypothesisWorks/hypothesis      | Property-based testing                 | Permissive (File-level) |
| **Vitest**                 | 3.0.7    | MIT          | https://github.com/vitest-dev/vitest               | Unit & integration test runner         | Permissive (No)         |
| **ECharts**                | 5.6.0    | Apache 2.0   | https://github.com/apache/echarts                  | Financial & spread visual charts       | Permissive (No)         |
| **nats** (Node)            | 2.29.3   | Apache 2.0   | https://github.com/nats-io/nats.js                 | High-throughput event streaming        | Permissive (No)         |
| **nats-py**                | 2.16.0   | Apache 2.0   | https://github.com/nats-io/nats.py                 | Python JetStream async client          | Permissive (No)         |
| **@clickhouse/client**     | 1.14.0   | Apache 2.0   | https://github.com/ClickHouse/clickhouse-js        | Columnar analytical time-series DB     | Permissive (No)         |
| **clickhouse-connect**     | 1.8.0    | Apache 2.0   | https://github.com/ClickHouse/clickhouse-connect   | Python ClickHouse query driver         | Permissive (No)         |
| **@aws-sdk/client-s3**     | 3.1009.0 | Apache 2.0   | https://github.com/aws/aws-sdk-js-v3               | S3 & Cloudflare R2 dataset storage     | Permissive (No)         |
| **msgpackr**               | 1.11.2   | MIT          | https://github.com/kriszyp/msgpackr                | Ultra-fast binary serialization        | Permissive (No)         |
| **bottleneck**             | 2.19.5   | BSD-2-Clause | https://github.com/SGrondin/bottleneck             | Token bucket rate limiter              | Permissive (No)         |
| **opossum**                | 8.5.0    | Apache 2.0   | https://github.com/nodeshift/opossum               | Circuit breaker for exchange RPCs      | Permissive (No)         |
| **lru-cache**              | 11.2.6   | ISC          | https://github.com/isaacs/node-lru-cache           | Fast in-memory LRU cache               | Permissive (No)         |
| **argon2**                 | 0.44.2   | MIT          | https://github.com/ranisalt/node-argon2            | Password hashing algorithm             | Permissive (No)         |
| **jose**                   | 6.2.2    | MIT          | https://github.com/panva/jose                      | JWT, JWE, JWS cryptographic primitives | Permissive (No)         |
| **better-auth**            | 1.5.4    | MIT          | https://github.com/better-auth/better-auth         | Modern secure session authentication   | Permissive (No)         |
| **@nestjs/throttler**      | 6.4.0    | MIT          | https://github.com/nestjs/throttler                | HTTP endpoint rate limiting            | Permissive (No)         |
| **pino** / **nestjs-pino** | 9.6.0    | MIT          | https://github.com/pinojs/pino                     | Structured JSON logger                 | Permissive (No)         |
| **prom-client**            | 15.1.3   | Apache 2.0   | https://github.com/siimon/prom-client              | Prometheus metric instrumentation      | Permissive (No)         |
| **@opentelemetry/api**     | 1.9.0    | Apache 2.0   | https://github.com/open-telemetry/opentelemetry-js | OpenTelemetry distributed tracing      | Permissive (No)         |
| **@bull-board/api**        | 6.17.4   | MIT          | https://github.com/felixmosh/bull-board            | Queue inspection dashboard             | Permissive (No)         |

---

## 2. Copyleft & GPL/AGPL Risk Assessment

- **No GPL, AGPL, or restrictive copyleft libraries are incorporated into the runtime distribution.**
- All production runtime dependencies are licensed under **MIT**, **Apache 2.0**, **BSD 3-Clause**, **BSD 2-Clause**, or **ISC**, allowing safe commercial and proprietary deployment without open-sourcing proprietary arbitrage strategies or intellectual property.
- **Hypothesis** is licensed under **Mozilla Public License 2.0 (MPL 2.0)**:
  - It is used strictly as a development test runner dependency (`test_quant.py`) and is never packaged or distributed in the production runtime artifact.
