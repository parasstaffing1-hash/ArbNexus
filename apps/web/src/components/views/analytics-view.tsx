'use client';

import * as React from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  ShieldCheck,
  Zap,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { GlassCard, AnimatedNumber } from '@arbitrage/ui';

export function AnalyticsView() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Historical Arbitrage & Execution Analytics
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            30-DAY ROLLING
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Performance metrics, route latency distributions, and profit attribution across DEX and
          CEX venues.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="cyan" className="p-4">
          <div className="text-xs font-mono text-zinc-400 mb-1">CUMULATIVE CAPTURE</div>
          <div className="text-2xl font-bold font-mono text-white">
            $
            <AnimatedNumber
              value={24890.5}
              format={(v) =>
                v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              }
            />
          </div>
          <div className="text-xs text-cyan-300 font-mono mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs prev month
          </div>
        </GlassCard>

        <GlassCard variant="gold" className="p-4">
          <div className="text-xs font-mono text-zinc-400 mb-1">TOTAL EXECUTIONS</div>
          <div className="text-2xl font-bold font-mono text-white">
            <AnimatedNumber value={142} /> trades
          </div>
          <div className="text-xs text-amber-300 font-mono mt-1">98.6% fill success rate</div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="text-xs font-mono text-zinc-400 mb-1">VOLUME ROUTED</div>
          <div className="text-2xl font-bold font-mono text-white">$4.82M</div>
          <div className="text-xs text-zinc-400 font-mono mt-1">Across 10 exchanges</div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="text-xs font-mono text-zinc-400 mb-1">AVG EXECUTION SLIPPAGE</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">0.024%</div>
          <div className="text-xs text-emerald-300 font-mono mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Within safe corridor
          </div>
        </GlassCard>
      </div>

      {/* Hourly Spread Density & Venue Profit Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard variant="default" className="p-5 space-y-4">
          <h2 className="font-bold text-sm text-white font-mono uppercase">
            Hourly Opportunity Density
          </h2>
          <div className="h-48 flex items-end gap-2 pt-4 px-2">
            {[42, 68, 85, 30, 92, 110, 75, 58, 89, 124, 98, 65].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  style={{ height: `${(height / 130) * 100}%` }}
                  className="w-full rounded-t bg-gradient-to-t from-cyan-500/40 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 transition-all cursor-pointer"
                  title={`${height} opportunities detected`}
                />
                <span className="text-[9px] font-mono text-zinc-500">{idx * 2}h</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-5 space-y-4">
          <h2 className="font-bold text-sm text-white font-mono uppercase">
            Profit Attribution by Exchange
          </h2>
          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Uniswap V3 ↔ Binance</span>
                <span className="text-cyan-400 font-bold">$11,420 (45.8%)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-cyan-400 w-[45.8%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Raydium ↔ Bybit</span>
                <span className="text-amber-400 font-bold">$7,210 (28.9%)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-amber-400 w-[28.9%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>OKX ↔ Hyperliquid</span>
                <span className="text-purple-400 font-bold">$4,850 (19.5%)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-purple-400 w-[19.5%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Cross-Chain Bridges</span>
                <span className="text-blue-400 font-bold">$1,410 (5.8%)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-blue-400 w-[5.8%]" />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
