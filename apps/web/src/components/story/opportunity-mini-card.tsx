'use client';

import * as React from 'react';
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react';

interface OpportunityMiniCardProps {
  pair?: string;
  buyVenue?: string;
  buyPrice?: string;
  sellVenue?: string;
  sellPrice?: string;
  netSpread?: string;
  netProfit?: string;
  size?: string;
  confidence?: number;
  className?: string;
}

export function OpportunityMiniCard({
  pair = 'BTC/USDT',
  buyVenue = 'Binance',
  buyPrice = '$100,010.00',
  sellVenue = 'OKX',
  sellPrice = '$100,480.00',
  netSpread = '+42.5 bps',
  netProfit = '+$1,175.00',
  size = '$250,000',
  confidence = 94,
  className = '',
}: OpportunityMiniCardProps) {
  return (
    <div
      className={`p-4 rounded-2xl bg-black/60 border border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-950/40 max-w-md w-full ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-950/60 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-white font-bold tracking-wide">{pair}</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-800/40">
            SPOT ↔ SPOT
          </span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 font-bold">
          <Zap className="w-3.5 h-3.5" />
          <span>{confidence}% CONFIDENCE</span>
        </div>
      </div>

      {/* Venues & Route */}
      <div className="grid grid-cols-2 gap-3 my-3 text-xs">
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-[10px] text-zinc-400 font-mono">BUY AT</div>
          <div className="text-cyan-300 font-bold">{buyVenue}</div>
          <div className="text-zinc-200 font-mono text-[11px] mt-0.5">{buyPrice}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-[10px] text-zinc-400 font-mono">SELL AT</div>
          <div className="text-fuchsia-300 font-bold">{sellVenue}</div>
          <div className="text-zinc-200 font-mono text-[11px] mt-0.5">{sellPrice}</div>
        </div>
      </div>

      {/* Metrics Footer */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyan-950/60 text-center font-mono">
        <div>
          <div className="text-[9px] text-zinc-400">NET SPREAD</div>
          <div className="text-xs font-bold text-emerald-400">{netSpread}</div>
        </div>
        <div>
          <div className="text-[9px] text-zinc-400">NET PROFIT</div>
          <div className="text-xs font-bold text-white">{netProfit}</div>
        </div>
        <div>
          <div className="text-[9px] text-zinc-400">MAX SIZE</div>
          <div className="text-xs font-semibold text-zinc-300">{size}</div>
        </div>
      </div>
    </div>
  );
}
