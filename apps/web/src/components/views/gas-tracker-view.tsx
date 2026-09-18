'use client';

import * as React from 'react';
import {
  Fuel,
  Zap,
  Clock,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';
import { GlassCard, Button } from '@arbitrage/ui';
import { MOCK_GAS, GasMetric } from '../../lib/mock-data';

export function GasTrackerView() {
  const [gasMetrics] = React.useState<GasMetric[]>(MOCK_GAS);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Fuel className="w-5 h-5 text-amber-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Cross-Chain Gas & Fee Oracle
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            EIP-1559 REAL-TIME
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Dynamic fee base and priority tip tracker to optimize atomic batch execution margins.
        </p>
      </div>

      {/* Recommended Gas Window */}
      <GlassCard
        variant="cyan"
        className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              Optimal Execution Condition
            </div>
            <div className="text-sm font-semibold text-white">
              Ethereum Base Fee is currently 15 Gwei (32% below 7d average)
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-zinc-300 bg-black/40 px-3 py-1.5 rounded-lg border border-cyan-900/40">
          Recommended MEV Bribe: <span className="text-amber-400 font-bold">2.5 Gwei</span>
        </div>
      </GlassCard>

      {/* Gas Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gasMetrics.map((gas) => (
          <GlassCard
            key={gas.chain}
            variant="default"
            className="p-4 space-y-4 hover:border-cyan-500/40 transition-all"
          >
            {/* Title & USD Equiv */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-white font-mono">{gas.chain}</h3>
                <span className="text-[10px] font-mono text-zinc-500">
                  Live Base + Priority Tip
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-zinc-500">TYPICAL SWAP</span>
                <div className="text-sm font-bold font-mono text-emerald-400">
                  ${gas.usdEquivalent.toFixed(3)}
                </div>
              </div>
            </div>

            {/* 3 Gas Tiers */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">SLOW</span>
                <span className="text-xs font-bold text-zinc-300 mt-1 block">{gas.slowGwei}</span>
                <span className="text-[9px] text-zinc-500">Gwei</span>
              </div>

              <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <span className="text-[10px] text-cyan-400 block font-bold">STANDARD</span>
                <span className="text-xs font-bold text-cyan-200 mt-1 block">
                  {gas.standardGwei}
                </span>
                <span className="text-[9px] text-cyan-400/80">Gwei</span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] text-amber-400 block font-bold">FAST (MEV)</span>
                <span className="text-xs font-bold text-amber-200 mt-1 block">{gas.fastGwei}</span>
                <span className="text-[9px] text-amber-400/80">Gwei</span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
