'use client';

import * as React from 'react';
import { Building2, Activity, CheckCircle2, Clock, Wifi, Radio, Layers } from 'lucide-react';
import { GlassCard, ExchangeBadge, StatusIndicator, Button } from '@arbitrage/ui';
import { MOCK_EXCHANGES, ExchangeStatus } from '../../lib/mock-data';

export function ExchangesView() {
  const [exchanges] = React.useState<ExchangeStatus[]>(MOCK_EXCHANGES);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Connected Venues & Gateway Health
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            10/10 OPERATIONAL
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          CCXT CEX adapters, Hummingbot gateway nodes, and EVM/Solana DEX RPC connections.
        </p>
      </div>

      {/* Grid of Exchange Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exchanges.map((ex) => (
          <GlassCard
            key={ex.id}
            variant="default"
            className="p-4 space-y-4 hover:border-cyan-500/40 transition-all"
          >
            {/* Header: Name + Status */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <ExchangeBadge name={ex.name} type={ex.type} />
              </div>

              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                <StatusIndicator status="online" pulse={true} />
                <span>ONLINE</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/40 border border-cyan-900/20 text-xs font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 block">LATENCY</span>
                <span className="text-cyan-300 font-bold block mt-0.5">{ex.latencyMs} ms</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 block">PAIRS</span>
                <span className="text-white font-bold block mt-0.5">{ex.monitoredPairs}</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 block">UPTIME 24H</span>
                <span className="text-emerald-400 font-bold block mt-0.5">{ex.uptime24h}%</span>
              </div>
            </div>

            {/* Endpoint */}
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
              <span className="text-zinc-500">Gateway:</span>
              <span className="text-zinc-300 truncate max-w-[180px]">{ex.endpoint}</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
