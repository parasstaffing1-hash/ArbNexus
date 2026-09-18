'use client';

import * as React from 'react';
import {
  Zap,
  ShieldCheck,
  Fuel,
  Cpu,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { GlassCard, Button, Badge } from '@arbitrage/ui';

interface OnChainOpportunityRow {
  id: string;
  type: 'AMM_ATOMIC' | 'LIQUIDATION' | 'BACKRUN' | 'FLASH_LOAN';
  protocol: string;
  chain: string;
  asset: string;
  grossProfitUsd: string;
  gasCostUsd: string;
  flashLoanFeeUsd: string;
  netProfitUsd: string;
  metric: string;
  status: 'SIMULATED_VALID' | 'PENDING' | 'EXPIRED';
}

export function OnChainMEVView() {
  const [items] = React.useState<OnChainOpportunityRow[]>([
    {
      id: 'mev-atomic-01',
      type: 'AMM_ATOMIC',
      protocol: 'Uniswap V3 ↔ Curve',
      chain: 'Ethereum',
      asset: 'WETH/USDC',
      grossProfitUsd: '$193.40',
      gasCostUsd: '$12.60',
      flashLoanFeeUsd: '$25.00',
      netProfitUsd: '+$155.80',
      metric: 'Spread: 38.7 bps',
      status: 'SIMULATED_VALID',
    },
    {
      id: 'liq-aave-02',
      type: 'LIQUIDATION',
      protocol: 'Aave V3',
      chain: 'Arbitrum',
      asset: 'WETH / USDC Debt',
      grossProfitUsd: '$1,750.00',
      gasCostUsd: '$4.20',
      flashLoanFeeUsd: '$17.50',
      netProfitUsd: '+$1,728.30',
      metric: 'Health Factor: 0.972 (Bonus 5%)',
      status: 'SIMULATED_VALID',
    },
    {
      id: 'mev-flash-03',
      type: 'FLASH_LOAN',
      protocol: 'Balancer ↔ Sushi',
      chain: 'Base',
      asset: 'cbETH/ETH',
      grossProfitUsd: '$210.00',
      gasCostUsd: '$1.80',
      flashLoanFeeUsd: '$0.00',
      netProfitUsd: '+$208.20',
      metric: 'Spread: 21.0 bps (Zero Fee Loan)',
      status: 'SIMULATED_VALID',
    },
    {
      id: 'mev-backrun-04',
      type: 'BACKRUN',
      protocol: 'Raydium CLMM ↔ Orca',
      chain: 'Solana',
      asset: 'SOL/USDC',
      grossProfitUsd: '$85.00',
      gasCostUsd: '$0.05',
      flashLoanFeeUsd: '$0.00',
      netProfitUsd: '+$84.95',
      metric: 'Spread: 45.0 bps (Post-Whale Swap)',
      status: 'SIMULATED_VALID',
    },
  ]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              On-Chain, Liquidation & MEV Intelligence
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              SIMULATION ONLY
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Research atomic AMM price discrepancies, lending health-factor liquidations, and
            flash-loan routing with zero execution keys.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>ZERO BROADCAST • FOUNDRY & ANVIL READY</span>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassCard variant="default" className="p-4">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
            Monitored Lending Pools
          </span>
          <div className="text-2xl font-mono font-extrabold text-white">12 Pools</div>
          <div className="text-xs text-zinc-400 mt-1 font-mono">Aave V3, Compound, Spark</div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
            Flash Loan Providers
          </span>
          <div className="text-2xl font-mono font-extrabold text-cyan-300">Aave / Balancer</div>
          <div className="text-xs text-zinc-400 mt-1 font-mono">0.00% to 0.05% fee tiers</div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
            Active Simulated Net Profit
          </span>
          <div className="text-2xl font-mono font-extrabold text-emerald-400">+$2,177.25</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">4 opportunities identified</div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
            Supported On-Chain Networks
          </span>
          <div className="text-2xl font-mono font-extrabold text-purple-300">6 Chains</div>
          <div className="text-xs text-zinc-400 mt-1 font-mono">ETH, Arb, Base, OP, Poly, Sol</div>
        </GlassCard>
      </div>

      {/* On-Chain Opportunities Table */}
      <GlassCard variant="default" className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Detected On-Chain Discrepancies & Liquidations
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">{items.length} active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-cyan-900/30 text-zinc-400">
                <th className="pb-2.5 font-medium">TYPE</th>
                <th className="pb-2.5 font-medium">PROTOCOL</th>
                <th className="pb-2.5 font-medium">CHAIN</th>
                <th className="pb-2.5 font-medium">ASSET</th>
                <th className="pb-2.5 font-medium">METRIC / SPREAD</th>
                <th className="pb-2.5 font-medium">GROSS PROFIT</th>
                <th className="pb-2.5 font-medium">GAS COST</th>
                <th className="pb-2.5 font-medium">FLASH LOAN FEE</th>
                <th className="pb-2.5 font-medium">EST. NET PROFIT</th>
                <th className="pb-2.5 font-medium text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 text-zinc-300">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-cyan-500/5 transition-colors">
                  <td className="py-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                      {it.type}
                    </span>
                  </td>
                  <td className="py-3 text-white font-bold">{it.protocol}</td>
                  <td className="py-3 text-cyan-300">{it.chain}</td>
                  <td className="py-3 text-zinc-200">{it.asset}</td>
                  <td className="py-3 text-zinc-400">{it.metric}</td>
                  <td className="py-3 text-zinc-300">{it.grossProfitUsd}</td>
                  <td className="py-3 text-zinc-400">{it.gasCostUsd}</td>
                  <td className="py-3 text-zinc-400">{it.flashLoanFeeUsd}</td>
                  <td className="py-3 text-emerald-400 font-bold">{it.netProfitUsd}</td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" />
                      {it.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
