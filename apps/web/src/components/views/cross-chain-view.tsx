'use client';

import * as React from 'react';
import {
  GitBranch,
  ArrowRight,
  ShieldCheck,
  Clock,
  Fuel,
  CheckCircle2,
  DollarSign,
  Layers,
} from 'lucide-react';
import { GlassCard, Button, Badge } from '@arbitrage/ui';
import { MOCK_BRIDGES, BridgeRoute } from '../../lib/mock-data';

export function CrossChainView() {
  const [bridges] = React.useState<BridgeRoute[]>(MOCK_BRIDGES);
  const [selectedSource, setSelectedSource] = React.useState('Ethereum');
  const [selectedDest, setSelectedDest] = React.useState('Arbitrum');
  const [amountUsd, setAmountUsd] = React.useState('10000');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Cross-Chain Liquidity & Bridge Matrix
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            LAYER 0/1/2
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Real-time bridge latency, gas cost, and security audit scores for cross-chain arbitrage
          transfers.
        </p>
      </div>

      {/* Interactive Bridge Simulator Bar */}
      <GlassCard variant="cyan" className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 block mb-1">ORIGIN CHAIN</span>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400"
              >
                <option value="Ethereum">Ethereum Mainnet</option>
                <option value="Arbitrum">Arbitrum One</option>
                <option value="Base">Base</option>
                <option value="Optimism">Optimism</option>
                <option value="Polygon">Polygon PoS</option>
              </select>
            </div>

            <ArrowRight className="w-4 h-4 text-cyan-400 mt-4" />

            <div>
              <span className="text-[10px] font-mono text-zinc-400 block mb-1">
                DESTINATION CHAIN
              </span>
              <select
                value={selectedDest}
                onChange={(e) => setSelectedDest(e.target.value)}
                className="bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400"
              >
                <option value="Arbitrum">Arbitrum One</option>
                <option value="Base">Base</option>
                <option value="Optimism">Optimism</option>
                <option value="Polygon">Polygon PoS</option>
                <option value="Ethereum">Ethereum Mainnet</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] font-mono text-zinc-400 block mb-1">
                TRANCHE SIZE ($USD)
              </span>
              <input
                type="number"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                className="bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-1.5 w-32 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-mono font-bold text-xs"
            >
              CALCULATE BEST ROUTE
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Bridge Protocols Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bridges.map((bridge) => {
          const totalFee = bridge.estimatedFeeUsd + bridge.gasCostUsd;
          return (
            <GlassCard
              key={bridge.id}
              variant="default"
              className="p-5 space-y-4 hover:border-cyan-500/40 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-white font-mono">{bridge.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 font-mono">
                    <span>{bridge.sourceChain}</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                    <span>{bridge.destChain}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{(bridge.securityScore * 100).toFixed(0)}% TRUST</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/40 border border-cyan-900/20 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 block">FINALITY</span>
                  <div className="text-white font-bold flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {bridge.durationMinutes} min
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block">TOTAL COST</span>
                  <div className="text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                    <Fuel className="w-3 h-3" />${totalFee.toFixed(2)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block">POOL LIQUIDITY</span>
                  <div className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                    <DollarSign className="w-3 h-3" />
                    {bridge.liquidityUsd}
                  </div>
                </div>
              </div>

              {/* Routing Hops */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-zinc-400">EXECUTION HOPS:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {bridge.hops.map((hop, idx) => (
                    <React.Fragment key={idx}>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
                        {hop}
                      </span>
                      {idx < bridge.hops.length - 1 && (
                        <span className="text-zinc-600 text-xs">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
