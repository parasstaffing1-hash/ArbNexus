-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ExchangeType" AS ENUM ('CEX', 'DEX');

-- CreateEnum
CREATE TYPE "StrategyType" AS ENUM ('SPATIAL', 'TRIANGULAR', 'CROSS_CHAIN', 'DEX_CEX', 'FUNDING_BASIS', 'STABLECOIN', 'STATISTICAL', 'LIQUIDATION', 'ONCHAIN_MEV');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DETECTED', 'VALIDATING', 'VALID', 'ACTIVE', 'SIMULATING', 'EXECUTING', 'COMPLETED', 'EXPIRED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaperOrderStatus" AS ENUM ('PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "exchanges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ExchangeType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "apiEndpoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_pairs" (
    "id" TEXT NOT NULL,
    "exchangeId" TEXT NOT NULL,
    "baseSymbol" TEXT NOT NULL,
    "quoteSymbol" TEXT NOT NULL,
    "pairString" TEXT NOT NULL,
    "minOrderSize" DOUBLE PRECISION NOT NULL DEFAULT 0.001,
    "makerFeeBps" INTEGER NOT NULL DEFAULT 10,
    "takerFeeBps" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_pairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arbitrage_opportunities" (
    "id" TEXT NOT NULL,
    "strategy" "StrategyType" NOT NULL,
    "sourceVenue" TEXT NOT NULL,
    "targetVenue" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "buyPrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "spreadPercent" DOUBLE PRECISION NOT NULL,
    "grossProfitUsd" DOUBLE PRECISION NOT NULL,
    "netProfitUsd" DOUBLE PRECISION NOT NULL,
    "totalFeesUsd" DOUBLE PRECISION NOT NULL,
    "minCapitalUsd" DOUBLE PRECISION NOT NULL,
    "legsJson" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'DETECTED',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arbitrage_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_logs" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "status" "OpportunityStatus" NOT NULL,
    "txHashes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "realizedProfitUsd" DOUBLE PRECISION,
    "gasSpentUsd" DOUBLE PRECISION,
    "executionDurationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "minSpreadPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "minProfitUsd" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "channels" TEXT[] DEFAULT ARRAY['TELEGRAM', 'DISCORD']::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "walletAddress" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expiresAt" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "venues" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "strategyType" "StrategyType" NOT NULL,
    "name" TEXT NOT NULL,
    "minSpreadBps" INTEGER NOT NULL DEFAULT 10,
    "maxCapitalUsd" DOUBLE PRECISION NOT NULL DEFAULT 25000,
    "maxSlippageBps" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parametersJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategy_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculation_histories" (
    "id" TEXT NOT NULL,
    "calculatorSlug" TEXT NOT NULL,
    "inputsJson" JSONB NOT NULL,
    "outputsJson" JSONB NOT NULL,
    "executionMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calculation_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backtest_runs" (
    "id" TEXT NOT NULL,
    "strategy" "StrategyType" NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "initialCapitalUsd" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "finalEquityUsd" DOUBLE PRECISION NOT NULL,
    "totalNetProfitUsd" DOUBLE PRECISION NOT NULL,
    "sharpeRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxDrawdownPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "winRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tradesCount" INTEGER NOT NULL DEFAULT 0,
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backtest_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backtest_trades" (
    "id" TEXT NOT NULL,
    "backtestRunId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "feeUsd" DOUBLE PRECISION NOT NULL,
    "netProfitUsd" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backtest_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "accountName" TEXT NOT NULL DEFAULT 'Default Paper Account',
    "initialBalanceUsd" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "currentBalanceUsd" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paper_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_orders" (
    "id" TEXT NOT NULL,
    "paperAccountId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "status" "PaperOrderStatus" NOT NULL DEFAULT 'PENDING',
    "filledQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feeUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "slippageUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "realizedPnlUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paper_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_positions" (
    "id" TEXT NOT NULL,
    "paperAccountId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "unrealizedPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paper_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "tagsJson" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exchanges_slug_key" ON "exchanges"("slug");

-- CreateIndex
CREATE INDEX "market_pairs_baseSymbol_quoteSymbol_idx" ON "market_pairs"("baseSymbol", "quoteSymbol");

-- CreateIndex
CREATE UNIQUE INDEX "market_pairs_exchangeId_pairString_key" ON "market_pairs"("exchangeId", "pairString");

-- CreateIndex
CREATE INDEX "arbitrage_opportunities_pair_status_idx" ON "arbitrage_opportunities"("pair", "status");

-- CreateIndex
CREATE INDEX "arbitrage_opportunities_detectedAt_idx" ON "arbitrage_opportunities"("detectedAt");

-- CreateIndex
CREATE INDEX "arbitrage_opportunities_strategy_status_idx" ON "arbitrage_opportunities"("strategy", "status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_items_watchlistId_symbol_key" ON "watchlist_items"("watchlistId", "symbol");

-- CreateIndex
CREATE INDEX "calculation_histories_calculatorSlug_createdAt_idx" ON "calculation_histories"("calculatorSlug", "createdAt");

-- CreateIndex
CREATE INDEX "backtest_runs_strategy_createdAt_idx" ON "backtest_runs"("strategy", "createdAt");

-- CreateIndex
CREATE INDEX "backtest_trades_backtestRunId_idx" ON "backtest_trades"("backtestRunId");

-- CreateIndex
CREATE INDEX "paper_orders_paperAccountId_status_idx" ON "paper_orders"("paperAccountId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "paper_positions_paperAccountId_symbol_venue_key" ON "paper_positions"("paperAccountId", "symbol", "venue");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "system_metrics_service_metricName_timestamp_idx" ON "system_metrics"("service", "metricName", "timestamp");

-- AddForeignKey
ALTER TABLE "market_pairs" ADD CONSTRAINT "market_pairs_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "exchanges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "arbitrage_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_configs" ADD CONSTRAINT "strategy_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backtest_trades" ADD CONSTRAINT "backtest_trades_backtestRunId_fkey" FOREIGN KEY ("backtestRunId") REFERENCES "backtest_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_accounts" ADD CONSTRAINT "paper_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_orders" ADD CONSTRAINT "paper_orders_paperAccountId_fkey" FOREIGN KEY ("paperAccountId") REFERENCES "paper_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_positions" ADD CONSTRAINT "paper_positions_paperAccountId_fkey" FOREIGN KEY ("paperAccountId") REFERENCES "paper_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

