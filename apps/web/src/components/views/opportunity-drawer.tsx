'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Layers,
  Fuel,
  CheckCircle2,
  Copy,
  Terminal,
  Play,
  RotateCcw,
  Calculator,
  Bell,
  Bookmark,
} from 'lucide-react';
import { GlassCard, SpreadBadge, ProfitChip, ExchangeBadge, Button } from '@arbitrage/ui';
import { LiveOpportunity } from '../../lib/mock-data';

interface OpportunityDrawerProps {
  opportunity: LiveOpportunity | null;
  onClose: () => void;
}

export function OpportunityDrawer({ opportunity, onClose }: OpportunityDrawerProps) {
  const [simulationState, setSimulationState] = React.useState<'idle' | 'simulating' | 'success'>(
    'idle',
  );
  const [copied, setCopied] = React.useState(false);

  if (!opportunity) return null;

  const handleSimulate = () => {
    setSimulationState('simulating');
    setTimeout(() => {
      setSimulationState('success');
    }, 1200);
  };

  const handleCopyCalldata = () => {
    const calldata = {
      opportunityId: opportunity.id,
      pair: opportunity.pair,
      strategy: opportunity.strategy,
      sourceExchange: opportunity.sourceExchange,
      targetExchange: opportunity.targetExchange,
      buyPrice: opportunity.buyPrice,
      sellPrice: opportunity.sellPrice,
      minCapitalUsd: opportunity.minCapitalUsd,
      netSpreadPercent: opportunity.netSpreadPercent,
      timestamp: Date.now(),
    };
    navigator.clipboard.writeText(JSON.stringify(calldata, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-full max-w-xl bg-[#071423]/95 backdrop-blur-2xl border-l border-cyan-500/30 text-zinc-200 h-full shadow-2xl flex flex-col z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-cyan-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 flex items-center justify-center font-bold font-mono text-cyan-300 text-sm">
                {opportunity.token}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white font-mono">{opportunity.pair}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                    {opportunity.strategy}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                  Network: <span className="text-zinc-200">{opportunity.network}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                aria-label="Close drawer"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
            {/* Net Spread & Est. Profit Highlight */}
            <div className="grid grid-cols-2 gap-3">
              <GlassCard variant="cyan" className="p-3.5">
                <span className="text-[11px] font-mono text-zinc-400">NET SPREAD</span>
                <div className="mt-1">
                  <SpreadBadge spreadPercent={opportunity.netSpreadPercent} size="md" />
                </div>
                <div className="text-[10px] font-mono text-zinc-500 mt-1">
                  Gross: +{opportunity.grossSpreadPercent}%
                </div>
              </GlassCard>

              <GlassCard variant="gold" className="p-3.5">
                <span className="text-[11px] font-mono text-zinc-400">EST. NET PROFIT</span>
                <div className="mt-1">
                  <ProfitChip
                    profitUsd={opportunity.netProfitUsd}
                    feesUsd={opportunity.estimatedFeesUsd}
                    size="md"
                  />
                </div>
                <div className="text-[10px] font-mono text-zinc-500 mt-1">
                  Capital: ${opportunity.minCapitalUsd.toLocaleString()}
                </div>
              </GlassCard>
            </div>

            {/* Execution Route Diagram */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300 font-bold uppercase tracking-wider">
                  EXECUTION ROUTE FLOW
                </span>
                <span className="text-cyan-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />~{opportunity.executionDurationMs}ms target
                </span>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-cyan-900/30 space-y-3 font-mono text-xs">
                {/* Leg 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <div>
                      <div className="font-bold text-white">BUY {opportunity.token}</div>
                      <div className="text-[10px] text-zinc-400">
                        Price: ${opportunity.buyPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <ExchangeBadge
                    name={opportunity.sourceExchange}
                    type={opportunity.sourceExchangeType}
                  />
                </div>

                {/* Routing Link */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 text-zinc-500 text-[10px] bg-black/50 px-3 py-1 rounded-full border border-zinc-800">
                    <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
                    <span>Cross-Venue Flash Routing</span>
                    <ArrowRight className="w-3 h-3 text-zinc-400" />
                  </div>
                </div>

                {/* Leg 2 */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold">
                      2
                    </span>
                    <div>
                      <div className="font-bold text-white">SELL {opportunity.token}</div>
                      <div className="text-[10px] text-zinc-400">
                        Price: ${opportunity.sellPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <ExchangeBadge
                    name={opportunity.targetExchange}
                    type={opportunity.targetExchangeType}
                  />
                </div>
              </div>
            </div>

            {/* Itemized Fee Breakdown */}
            <div className="space-y-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                FEE & SLIPPAGE AUDIT
              </span>

              <div className="p-4 rounded-xl bg-black/40 border border-cyan-900/30 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                    Est. Gas / Network Fee:
                  </span>
                  <span className="text-white">${opportunity.estimatedFeesUsd.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Source Exchange Fee (0.1%):
                  </span>
                  <span className="text-white">
                    ${(opportunity.minCapitalUsd * 0.001).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    Target Exchange Taker Fee (0.075%):
                  </span>
                  <span className="text-white">
                    ${(opportunity.minCapitalUsd * 0.00075).toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex justify-between items-center font-bold text-sm">
                  <span className="text-cyan-300">Net Profit Captured:</span>
                  <span className="text-emerald-400">+${opportunity.netProfitUsd.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Depth & Risk Check */}
            <div className="space-y-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                RISK & MEV SHIELD
              </span>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono space-y-2 text-emerald-300">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Validation Passed: Low MEV Surface</span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  Liquidity depth exceeds minimum requirements by 4.2x. Protected by private builder
                  routing.
                </p>
              </div>
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-cyan-900/30 bg-black/40 space-y-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSimulate}
                disabled={simulationState === 'simulating'}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-mono text-xs font-bold gap-2"
              >
                {simulationState === 'simulating' ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    SIMULATING...
                  </>
                ) : simulationState === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    SIMULATION VERIFIED (+$
                    {opportunity.netProfitUsd.toFixed(2)})
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    SIMULATE ARB ROUTE
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCalldata}
                className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 font-mono text-xs gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'COPIED' : 'CALLDATA'}
              </Button>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-cyan-900/20">
              <a
                href="/calculators"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-cyan-900/40 bg-white/5 hover:bg-cyan-500/10 text-[11px] font-mono text-cyan-300 transition-colors"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>OPEN CALCULATOR</span>
              </a>
              <button
                onClick={() =>
                  alert(
                    `Alert configured for ${opportunity.pair} (Spread > ${opportunity.netSpreadPercent.toFixed(2)}%)`,
                  )
                }
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-cyan-900/40 bg-white/5 hover:bg-cyan-500/10 text-[11px] font-mono text-zinc-300 transition-colors"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>ADD ALERT</span>
              </button>
              <button
                onClick={() => alert(`Added ${opportunity.pair} to Watchlist`)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-cyan-900/40 bg-white/5 hover:bg-cyan-500/10 text-[11px] font-mono text-zinc-300 transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
                <span>WATCHLIST</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
