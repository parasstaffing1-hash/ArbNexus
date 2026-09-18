'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Zap,
  DollarSign,
  Layers,
  ChevronRight,
  Flame,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  GlassCard,
  SpreadBadge,
  ProfitChip,
  ExchangeBadge,
  AnimatedNumber,
  Button,
} from '@arbitrage/ui';
import { LiveOpportunity, LiveTicker, MOCK_OPPORTUNITIES, MOCK_TICKERS } from '../../lib/mock-data';
import { useOpportunities, useFundingRates } from '../../hooks/use-arbitrage-api';
import { useArbitrageSocket } from '../../hooks/use-arbitrage-socket';

interface DashboardViewProps {
  onSelectOpportunity: (opp: LiveOpportunity) => void;
  onNavigateToScanner: () => void;
  onNavigateToFunding: () => void;
}

export function DashboardView({
  onSelectOpportunity,
  onNavigateToScanner,
  onNavigateToFunding,
}: DashboardViewProps) {
  const opportunitiesQuery = useOpportunities();
  const opportunities: LiveOpportunity[] = opportunitiesQuery.data || MOCK_OPPORTUNITIES;
  const { isConnected: isSocketConnected } = useArbitrageSocket();

  const topOpportunities = React.useMemo(
    () => [...opportunities].sort((a, b) => b.netSpreadPercent - a.netSpreadPercent).slice(0, 5),
    [opportunities],
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Live Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Arb
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">
              Nexus
            </span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              CLUSTER
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            The Intelligence Platform for Crypto Arbitrage • Real-time cross-venue scanning •
            Latency: <span className="text-cyan-400 font-mono">18ms</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToScanner}
            className="text-xs border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Live Scanner
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onNavigateToFunding}
            className="text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold gap-1.5"
          >
            <Flame className="w-3.5 h-3.5 text-black fill-black" />
            Funding Rates
          </Button>
        </div>
      </div>

      {/* Tickers Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.values(MOCK_TICKERS).map((ticker) => {
          const isPositive = ticker.change24h >= 0;
          return (
            <GlassCard
              key={ticker.symbol}
              variant="default"
              className="p-4 relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-zinc-300 tracking-wider">
                    {ticker.symbol}
                  </span>
                  <div className="text-xl font-mono font-bold text-white mt-1">
                    ${ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                    isPositive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {isPositive ? `+${ticker.change24h}%` : `${ticker.change24h}%`}
                </div>
              </div>

              {/* Sparkline & Details */}
              <div className="mt-3 flex items-end justify-between">
                <div className="text-[10px] font-mono text-zinc-500 space-y-0.5">
                  <div>H: ${ticker.high24h.toLocaleString()}</div>
                  <div>L: ${ticker.low24h.toLocaleString()}</div>
                  <div>Vol: {ticker.volume24h}</div>
                </div>

                {/* SVG Sparkline */}
                <svg className="w-24 h-8 overflow-visible" viewBox="0 0 100 30">
                  <polyline
                    fill="none"
                    stroke={isPositive ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={ticker.sparkline
                      .map((val, idx, arr) => {
                        const min = Math.min(...arr);
                        const max = Math.max(...arr);
                        const x = (idx / (arr.length - 1)) * 100;
                        const y = 30 - ((val - min) / (max - min || 1)) * 26 - 2;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                </svg>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Spreads */}
        <GlassCard variant="cyan" className="p-4 relative">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
            <span>ACTIVE ARB SPREADS</span>
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">
            <AnimatedNumber value={MOCK_OPPORTUNITIES.length} />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-cyan-300 font-mono">
            <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Highest spread: <span className="font-bold text-white">3.78%</span>
            </span>
          </div>
        </GlassCard>

        {/* KPI 2: Est. 24h Net Profit */}
        <GlassCard variant="gold" className="p-4 relative">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
            <span>EST. 24H NET CAPTURE</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">
            $
            <AnimatedNumber
              value={1845.2}
              format={(v) =>
                v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              }
            />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-300 font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>+24.8% vs 7-day average</span>
          </div>
        </GlassCard>

        {/* KPI 3: Monitored Venues */}
        <GlassCard variant="default" className="p-4 relative">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
            <span>CONNECTED VENUES</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">10 / 10</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>5 CEXs + 5 DEXs Monitored</span>
          </div>
        </GlassCard>

        {/* KPI 4: Mean Route Latency */}
        <GlassCard variant="default" className="p-4 relative">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-2">
            <span>EXECUTION LATENCY</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">
            <AnimatedNumber value={142} />{' '}
            <span className="text-lg font-normal text-zinc-400">ms</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fastest: 85ms (OKX-Hyperliquid)</span>
          </div>
        </GlassCard>
      </div>

      {/* Main Grid: Top Spreads Table + Strategy Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High-Spread Opportunities */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                Top Active Arbitrage Routes
              </h2>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                REAL-TIME
              </span>
            </div>
            <button
              onClick={onNavigateToScanner}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 group"
            >
              View All ({MOCK_OPPORTUNITIES.length})
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="space-y-2.5">
            {topOpportunities.map((opp) => (
              <GlassCard
                key={opp.id}
                variant="default"
                onClick={() => onSelectOpportunity(opp)}
                className="p-3.5 cursor-pointer hover:border-cyan-400/50 hover:bg-[#0a2238]/80 transition-all duration-200 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Pair & Route info */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center font-bold font-mono text-cyan-300 text-xs">
                      {opp.token}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono text-sm">{opp.pair}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 border border-white/10">
                          {opp.network}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {opp.strategy}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                        <span className="text-zinc-500">Buy:</span>
                        <ExchangeBadge name={opp.sourceExchange} type={opp.sourceExchangeType} />
                        <span className="text-zinc-600">→</span>
                        <span className="text-zinc-500">Sell:</span>
                        <ExchangeBadge name={opp.targetExchange} type={opp.targetExchangeType} />
                      </div>
                    </div>
                  </div>

                  {/* Spread & Profit */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-zinc-500 font-mono">NET SPREAD</div>
                      <SpreadBadge spreadPercent={opp.netSpreadPercent} size="sm" />
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-zinc-500 font-mono">EST. PROFIT</div>
                      <ProfitChip
                        profitUsd={opp.netProfitUsd}
                        feesUsd={opp.estimatedFeesUsd}
                        size="sm"
                      />
                    </div>

                    <div className="hidden sm:block">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-cyan-500/30 text-cyan-300 group-hover:bg-cyan-500/20 transition-colors"
                      >
                        Inspect
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Strategy Distribution & Live Engine Status */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
            Strategy & Risk Breakdown
          </h2>

          <GlassCard variant="default" className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  DEX-CEX Spatial
                </span>
                <span className="font-mono text-white font-bold">66.7%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 w-[66.7%]" />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  CEX-CEX Spatial
                </span>
                <span className="font-mono text-white font-bold">20.0%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 w-[20%]" />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  Cross-Chain L1/L2
                </span>
                <span className="font-mono text-white font-bold">13.3%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 w-[13.3%]" />
              </div>
            </div>

            <div className="pt-3 border-t border-cyan-900/30 text-xs space-y-2">
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wide">
                AI Guardrails & Execution Status
              </div>
              <div className="flex items-center justify-between text-zinc-300 font-mono text-[11px]">
                <span>Slippage Model:</span>
                <span className="text-emerald-400 font-semibold">Constant Product + CL</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300 font-mono text-[11px]">
                <span>Gas Estimation:</span>
                <span className="text-cyan-400 font-semibold">EIP-1559 Dynamic</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300 font-mono text-[11px]">
                <span>MEV Protection:</span>
                <span className="text-amber-400 font-semibold">Flashbots RPC Ready</span>
              </div>
            </div>
          </GlassCard>

          {/* Quick Action Box */}
          <GlassCard variant="cyan" className="p-4 text-center space-y-2">
            <div className="text-xs font-mono text-cyan-300 font-semibold">
              REAL-TIME SCANNER AGENTS
            </div>
            <p className="text-[11px] text-zinc-400">
              10 exchange WebSocket streams actively generating orderbook ticks.
            </p>
            <Button
              size="sm"
              onClick={onNavigateToScanner}
              className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold font-mono"
            >
              LAUNCH FULL SCANNER
            </Button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
