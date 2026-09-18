'use client';

import * as React from 'react';
import {
  History,
  Play,
  RotateCcw,
  BarChart2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  Sliders,
  Filter,
} from 'lucide-react';
import { GlassCard, Button } from '@arbitrage/ui';

interface BacktestRunRecord {
  id: string;
  strategy: string;
  symbol: string;
  period: string;
  winRate: string;
  netProfitUsd: string;
  roi: string;
  sharpeRatio: string;
  maxDrawdown: string;
  tradesCount: number;
}

export function BacktestingView() {
  const [selectedStrategy, setSelectedStrategy] = React.useState('SPOT_CEX_CEX');
  const [selectedSymbol, setSelectedSymbol] = React.useState('BTC/USDT');
  const [initialCapital, setInitialCapital] = React.useState('50000');
  const [latencyMs, setLatencyMs] = React.useState('20');
  const [isRunning, setIsRunning] = React.useState(false);

  const [runs, setRuns] = React.useState<BacktestRunRecord[]>([
    {
      id: 'bt-run-9021',
      strategy: 'SPOT_CEX_CEX',
      symbol: 'BTC/USDT',
      period: 'Past 30 Days',
      winRate: '96.2%',
      netProfitUsd: '+$14,280.00',
      roi: '+28.56%',
      sharpeRatio: '3.42',
      maxDrawdown: '1.8%',
      tradesCount: 312,
    },
    {
      id: 'bt-run-8840',
      strategy: 'FUNDING_ARBITRAGE',
      symbol: 'ETH/USDT',
      period: 'Past 90 Days',
      winRate: '100.0%',
      netProfitUsd: '+$21,450.00',
      roi: '+42.90%',
      sharpeRatio: '4.85',
      maxDrawdown: '0.9%',
      tradesCount: 270,
    },
    {
      id: 'bt-run-7411',
      strategy: 'TRIANGULAR',
      symbol: 'USDT->BTC->ETH',
      period: 'Past 7 Days',
      winRate: '89.4%',
      netProfitUsd: '+$3,840.00',
      roi: '+7.68%',
      sharpeRatio: '2.80',
      maxDrawdown: '2.4%',
      tradesCount: 184,
    },
    {
      id: 'bt-run-6902',
      strategy: 'CROSS_CHAIN',
      symbol: 'ETH (Mainnet -> Arb)',
      period: 'Past 14 Days',
      winRate: '92.1%',
      netProfitUsd: '+$6,190.00',
      roi: '+12.38%',
      sharpeRatio: '2.95',
      maxDrawdown: '2.1%',
      tradesCount: 94,
    },
  ]);

  const handleRunBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      const net = Math.floor(Math.random() * 4000) + 5000;
      const roiVal = ((net / parseFloat(initialCapital)) * 100).toFixed(2);
      const newRun: BacktestRunRecord = {
        id: `bt-run-${Math.floor(Math.random() * 9000 + 1000)}`,
        strategy: selectedStrategy,
        symbol: selectedSymbol,
        period: 'Past 30 Days',
        winRate: (Math.random() * 5 + 93).toFixed(1) + '%',
        netProfitUsd: `+$${net.toLocaleString()}.00`,
        roi: `+${roiVal}%`,
        sharpeRatio: (Math.random() * 1.5 + 2.5).toFixed(2),
        maxDrawdown: (Math.random() * 1.5 + 1.0).toFixed(1) + '%',
        tradesCount: Math.floor(Math.random() * 150 + 100),
      };
      setRuns((prev) => [newRun, ...prev]);
      setIsRunning(false);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Backtesting & Historical Replay Simulator
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              DUCKDB / PARQUET
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Replay L2 tick feeds with simulated execution latency, exchange fee tiers, and
            depth-based slippage.
          </p>
        </div>
      </div>

      {/* Simulator Parameters Panel */}
      <GlassCard variant="cyan" className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Backtest Run Parameters
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="text-[10px] font-mono text-zinc-400 block mb-1">STRATEGY</span>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
            >
              <option value="SPOT_CEX_CEX">Spot CEX ↔ CEX</option>
              <option value="FUNDING_ARBITRAGE">Funding Rate Carry</option>
              <option value="TRIANGULAR">Triangular Cycles</option>
              <option value="CROSS_CHAIN">Cross-Chain Spreads</option>
              <option value="STATISTICAL">Statistical Pairs</option>
            </select>
          </div>

          <div>
            <span className="text-[10px] font-mono text-zinc-400 block mb-1">ASSET / PAIR</span>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
            >
              <option value="BTC/USDT">BTC/USDT</option>
              <option value="ETH/USDT">ETH/USDT</option>
              <option value="SOL/USDT">SOL/USDT</option>
            </select>
          </div>

          <div>
            <span className="text-[10px] font-mono text-zinc-400 block mb-1">
              CAPITAL BUDGET ($)
            </span>
            <select
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
            >
              <option value="10000">$10,000</option>
              <option value="25000">$25,000</option>
              <option value="50000">$50,000</option>
              <option value="100000">$100,000</option>
            </select>
          </div>

          <div>
            <span className="text-[10px] font-mono text-zinc-400 block mb-1">
              SIMULATED LATENCY
            </span>
            <select
              value={latencyMs}
              onChange={(e) => setLatencyMs(e.target.value)}
              className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
            >
              <option value="10">10ms (Co-located HFT)</option>
              <option value="20">20ms (Direct Fiber)</option>
              <option value="50">50ms (Standard VPS)</option>
              <option value="100">100ms (Public Internet)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            variant="default"
            size="sm"
            onClick={handleRunBacktest}
            disabled={isRunning}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-black font-semibold text-xs gap-1.5"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                Executing Simulation...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                Run Historical Backtest
              </>
            )}
          </Button>
        </div>
      </GlassCard>

      {/* Historical Backtest Runs Table */}
      <GlassCard variant="default" className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Completed Simulation Runs
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">{runs.length} runs recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-cyan-900/30 text-zinc-400">
                <th className="pb-2.5 font-medium">RUN ID</th>
                <th className="pb-2.5 font-medium">STRATEGY</th>
                <th className="pb-2.5 font-medium">SYMBOL</th>
                <th className="pb-2.5 font-medium">PERIOD</th>
                <th className="pb-2.5 font-medium">WIN RATE</th>
                <th className="pb-2.5 font-medium">NET PROFIT</th>
                <th className="pb-2.5 font-medium">ROI</th>
                <th className="pb-2.5 font-medium">SHARPE</th>
                <th className="pb-2.5 font-medium">MAX DRAWDOWN</th>
                <th className="pb-2.5 font-medium text-right">TRADES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 text-zinc-300">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-cyan-500/5 transition-colors">
                  <td className="py-3 text-cyan-300 font-bold">{r.id}</td>
                  <td className="py-3 text-white font-bold">{r.strategy}</td>
                  <td className="py-3 text-zinc-300">{r.symbol}</td>
                  <td className="py-3 text-zinc-400">{r.period}</td>
                  <td className="py-3 text-emerald-400 font-bold">{r.winRate}</td>
                  <td className="py-3 text-emerald-400 font-bold">{r.netProfitUsd}</td>
                  <td className="py-3 text-cyan-300">{r.roi}</td>
                  <td className="py-3 text-purple-300 font-bold">{r.sharpeRatio}</td>
                  <td className="py-3 text-rose-300">{r.maxDrawdown}</td>
                  <td className="py-3 text-right text-zinc-400">{r.tradesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
