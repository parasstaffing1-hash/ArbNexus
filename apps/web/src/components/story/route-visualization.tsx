'use client';

import * as React from 'react';
import { ArrowRight, RefreshCw, Layers, ShieldCheck, GitBranch } from 'lucide-react';

interface RouteVisualizationProps {
  type: 'triangular' | 'cross-chain';
  className?: string;
}

export function RouteVisualization({ type, className = '' }: RouteVisualizationProps) {
  if (type === 'triangular') {
    return (
      <div
        className={`p-5 rounded-2xl bg-black/60 border border-cyan-500/30 backdrop-blur-xl max-w-lg w-full ${className}`}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-950/60 font-mono text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>TRIANGULAR CYCLE DETECTOR</span>
          </div>
          <span className="text-emerald-400 font-bold">+18.4 BPS NET</span>
        </div>

        {/* 3-Leg Triangular Cycle */}
        <div className="flex items-center justify-between gap-2 text-center font-mono">
          <div className="flex-1 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-700/30">
            <div className="text-[10px] text-zinc-400">LEG 1 (START)</div>
            <div className="text-sm font-bold text-white mt-0.5">USDT</div>
            <div className="text-[9px] text-cyan-400">100,000.00</div>
          </div>

          <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />

          <div className="flex-1 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-700/30">
            <div className="text-[10px] text-zinc-400">LEG 2</div>
            <div className="text-sm font-bold text-white mt-0.5">BTC</div>
            <div className="text-[9px] text-cyan-400">0.9998 BTC</div>
          </div>

          <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />

          <div className="flex-1 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-700/30">
            <div className="text-[10px] text-zinc-400">LEG 3</div>
            <div className="text-sm font-bold text-white mt-0.5">ETH</div>
            <div className="text-[9px] text-cyan-400">31.45 ETH</div>
          </div>

          <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />

          <div className="flex-1 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
            <div className="text-[10px] text-emerald-400 font-bold">LEG 4 (END)</div>
            <div className="text-sm font-bold text-emerald-300 mt-0.5">USDT</div>
            <div className="text-[9px] text-emerald-400 font-bold">100,184.20</div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-cyan-950/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>Venue: Binance Internal Order Book</span>
          <span className="text-zinc-500">Atomic Execution &lt; 20ms</span>
        </div>
      </div>
    );
  }

  // Cross-Chain Arbitrage
  return (
    <div
      className={`p-5 rounded-2xl bg-black/60 border border-purple-500/30 backdrop-blur-xl max-w-lg w-full ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-950/60 font-mono text-xs">
        <div className="flex items-center gap-2 text-purple-300 font-bold">
          <GitBranch className="w-3.5 h-3.5 text-purple-400" />
          <span>CROSS-CHAIN MULTI-HOP ROUTE</span>
        </div>
        <span className="text-emerald-400 font-bold">+84.2 BPS AFTER GAS</span>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center font-mono">
        <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-700/30">
          <div className="text-[9px] text-zinc-400">CHAIN A</div>
          <div className="text-xs font-bold text-white mt-0.5">Ethereum</div>
          <div className="text-[9px] text-purple-300 mt-0.5">Uniswap v3</div>
        </div>

        <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-700/30">
          <div className="text-[9px] text-zinc-400">BRIDGE</div>
          <div className="text-xs font-bold text-white mt-0.5">LI.FI / Stargate</div>
          <div className="text-[9px] text-purple-300 mt-0.5">Finality 1.8m</div>
        </div>

        <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-700/30">
          <div className="text-[9px] text-zinc-400">CHAIN B</div>
          <div className="text-xs font-bold text-white mt-0.5">Arbitrum / Sol</div>
          <div className="text-[9px] text-purple-300 mt-0.5">Jupiter / Camelot</div>
        </div>

        <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
          <div className="text-[9px] text-emerald-400 font-bold">NET RESULT</div>
          <div className="text-xs font-bold text-emerald-300 mt-0.5">+$2,105.00</div>
          <div className="text-[9px] text-emerald-400 mt-0.5">Gas: $14.20</div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-purple-950/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span>Route: ETH → USDC → Bridge → SOL → USDC</span>
        <span className="text-emerald-400">Optimized Slippage</span>
      </div>
    </div>
  );
}
