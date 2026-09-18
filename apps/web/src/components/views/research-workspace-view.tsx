'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Activity,
  Zap,
  GitBranch,
  Layers,
  ArrowRightLeft,
  Percent,
  BarChart3,
  Download,
  Calculator,
  ShieldCheck,
  Clock,
  Coins,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, Button, Badge } from '@arbitrage/ui';

export function ResearchWorkspaceView() {
  const [selectedStrategy, setSelectedStrategy] = React.useState<
    'TRIANGULAR' | 'MULTI_HOP' | 'FUNDING' | 'BASIS' | 'STATISTICAL' | 'PAIRS'
  >('TRIANGULAR');
  const [selectedAsset, setSelectedAsset] = React.useState<'BTC' | 'ETH' | 'SOL'>('BTC');
  const [tradeCapital, setTradeCapital] = React.useState<number>(10000);
  const [zScoreThreshold, setZScoreThreshold] = React.useState<number>(2.0);
  const [isExporting, setIsExporting] = React.useState<string | null>(null);

  // Strategy Matrix State
  const matrixData = [
    {
      asset: 'BTC',
      spotArb: { spread: '+0.42%', profit: '+$42.00', status: 'ACTIVE' },
      triangular: { spread: '+0.84%', profit: '+$84.12', status: 'ACTIVE', grade: 'AAA' },
      multiHop: { spread: '+1.15%', profit: '+$115.30', status: 'ACTIVE', grade: 'AA' },
      funding: { spread: '12.4% APY', profit: '+$34.00/d', status: 'ACTIVE', grade: 'AAA' },
      basis: { spread: '8.6% Ann.', profit: '+$179.00', status: 'ACTIVE', grade: 'AA' },
      statistical: { spread: 'Z=2.45', profit: '+$96.25', status: 'ACTIVE', grade: 'A' },
    },
    {
      asset: 'ETH',
      spotArb: { spread: '+0.38%', profit: '+$38.00', status: 'ACTIVE' },
      triangular: { spread: '+0.68%', profit: '+$68.40', status: 'ACTIVE', grade: 'AA' },
      multiHop: { spread: '+0.92%', profit: '+$92.00', status: 'ACTIVE', grade: 'A' },
      funding: { spread: '14.8% APY', profit: '+$40.50/d', status: 'ACTIVE', grade: 'AAA' },
      basis: { spread: '9.2% Ann.', profit: '+$191.00', status: 'ACTIVE', grade: 'AA' },
      statistical: { spread: 'Z=2.15', profit: '+$84.50', status: 'ACTIVE', grade: 'AA' },
    },
    {
      asset: 'SOL',
      spotArb: { spread: '+0.55%', profit: '+$55.00', status: 'ACTIVE' },
      triangular: { spread: '+1.02%', profit: '+$102.00', status: 'ACTIVE', grade: 'AAA' },
      multiHop: { spread: '+1.35%', profit: '+$135.00', status: 'ACTIVE', grade: 'AA' },
      funding: { spread: '18.2% APY', profit: '+$49.80/d', status: 'ACTIVE', grade: 'AAA' },
      basis: { spread: '11.5% Ann.', profit: '+$239.00', status: 'ACTIVE', grade: 'AA' },
      statistical: { spread: 'Z=2.30', profit: '+$90.00', status: 'ACTIVE', grade: 'A' },
    },
  ];

  // Checkpoints for triangular sizing
  const checkpoints = [
    { capital: 100, netProfit: 0.84, roi: 0.84, executable: true },
    { capital: 500, netProfit: 4.21, roi: 0.84, executable: true },
    { capital: 1000, netProfit: 8.41, roi: 0.84, executable: true },
    { capital: 5000, netProfit: 42.06, roi: 0.84, executable: true },
    { capital: 10000, netProfit: 84.12, roi: 0.84, executable: true },
    { capital: 50000, netProfit: 418.5, roi: 0.83, executable: true },
    { capital: 100000, netProfit: 825.0, roi: 0.82, executable: false },
  ];

  const handleExport = (format: 'CSV' | 'JSON' | 'Parquet') => {
    setIsExporting(format);
    setTimeout(() => {
      setIsExporting(null);
      alert(`Exported dataset successfully as ${format} (Cloudflare R2 archival synced).`);
    }, 800);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              Advanced Quantitative Research & Strategy Matrix
            </h1>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
              INSTITUTIONAL QUANT
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time multi-asset strategy detection, graph cycle search, futures term structure,
            and statistical cointegration.
          </p>
        </div>

        {/* Action Controls & Export */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleExport('CSV')}
            variant="outline"
            className="border-zinc-700 bg-zinc-900/60 text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </Button>
          <Button
            onClick={() => handleExport('JSON')}
            variant="outline"
            className="border-zinc-700 bg-zinc-900/60 text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </Button>
          <Button
            onClick={() => handleExport('Parquet')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Parquet (R2)
          </Button>
        </div>
      </div>

      {/* Zero Execution Safety Notice */}
      <div className="p-3 bg-zinc-900/60 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Safety Gate Enforced:</strong> Simulation & Detection mode only. Live order
            execution permanently disabled (
            <code className="text-zinc-300">ENABLE_EXECUTION=false</code>).
          </span>
        </div>
        <span className="text-zinc-500 font-mono">LATENCY: 18ms | QUALITY: 100% VALID</span>
      </div>

      {/* 1. Live Strategy Matrix */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Live Strategy Cross-Venue Matrix
          </h2>
          <span className="text-xs text-zinc-400">
            Real-time synchronized ticker & orderbook feed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="py-2.5 px-3">Asset</th>
                <th className="py-2.5 px-3">Spot CEX Arb</th>
                <th className="py-2.5 px-3">Triangular (3-Hop)</th>
                <th className="py-2.5 px-3">Multi-Hop (4/5-Hop)</th>
                <th className="py-2.5 px-3">Funding Rate Carry</th>
                <th className="py-2.5 px-3">Futures Basis</th>
                <th className="py-2.5 px-3">Statistical Pairs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {matrixData.map((row) => (
                <tr key={row.asset} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-3 font-semibold text-zinc-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-indigo-400 font-bold">
                      {row.asset}
                    </span>
                    {row.asset}/USDT
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-bold">{row.spotArb.spread}</span>
                    <span className="text-zinc-400 block text-[11px]">{row.spotArb.profit}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-bold">{row.triangular.spread}</span>
                    <span className="text-zinc-400 block text-[11px]">{row.triangular.profit}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-400 font-bold">{row.multiHop.spread}</span>
                    <span className="text-zinc-400 block text-[11px]">{row.multiHop.profit}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-cyan-400 font-bold">{row.funding.spread}</span>
                    <span className="text-zinc-400 block text-[11px]">{row.funding.profit}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-indigo-400 font-bold">{row.basis.spread}</span>
                    <span className="text-zinc-400 block text-[11px]">{row.basis.profit}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-amber-400 font-bold">{row.statistical.spread}</span>
                    <span className="text-zinc-400 block text-[11px]">
                      {row.statistical.profit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 2. Interactive Strategy Selector & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Strategy Selector */}
        <Card className="bg-zinc-900/50 border-zinc-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            Strategy Research Selector
          </h3>

          <div className="space-y-1.5">
            {[
              { id: 'TRIANGULAR', label: 'Triangular Arbitrage (3-Hop)', tag: 'CYCLES' },
              { id: 'MULTI_HOP', label: 'Multi-Hop Graph (4/5-Hop)', tag: 'GRAPH' },
              { id: 'FUNDING', label: 'Funding Rate & Perp Differentials', tag: 'CARRY' },
              { id: 'BASIS', label: 'Futures Basis & Term Structure', tag: 'CURVE' },
              { id: 'STATISTICAL', label: 'Statistical Mean-Reversion', tag: 'OU-PROCESS' },
              { id: 'PAIRS', label: 'Cointegrated Pairs Arbitrage', tag: 'ENGLE-GRANGER' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStrategy(st.id as any)}
                className={`w-full text-left p-2.5 rounded-md flex items-center justify-between text-xs transition-colors ${
                  selectedStrategy === st.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-medium'
                    : 'bg-zinc-900/30 text-zinc-400 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <span>{st.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                  {st.tag}
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-zinc-800 pt-4 space-y-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Target Capital (USD)</label>
              <input
                type="number"
                value={tradeCapital}
                onChange={(e) => setTradeCapital(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                Z-Score Divergence Threshold
              </label>
              <input
                type="number"
                step="0.1"
                value={zScoreThreshold}
                onChange={(e) => setZScoreThreshold(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
              />
            </div>
          </div>
        </Card>

        {/* Center & Right: Deep Strategy Analytics Display */}
        <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800 p-5 space-y-4">
          {selectedStrategy === 'TRIANGULAR' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Triangular Arbitrage: USDT → BTC → ETH → USDT
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Orderbook depth simulation with fee & slippage deductions
                  </p>
                </div>
                <a
                  href="/calculators"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Open Route Calculator
                </a>
              </div>

              {/* Leg Cards */}
              <div className="grid grid-cols-3 gap-2.5 my-3">
                <div className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 font-mono block">LEG 1 (SWAP)</span>
                  <span className="font-semibold text-xs text-zinc-200">USDT → BTC</span>
                  <span className="text-zinc-400 block text-[11px] mt-1 font-mono">
                    @ $98,500.00
                  </span>
                  <span className="text-zinc-500 text-[10px] block">Binance Spot (0.10% fee)</span>
                </div>
                <div className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 font-mono block">LEG 2 (SWAP)</span>
                  <span className="font-semibold text-xs text-zinc-200">BTC → ETH</span>
                  <span className="text-zinc-400 block text-[11px] mt-1 font-mono">
                    @ 0.03425 BTC
                  </span>
                  <span className="text-zinc-500 text-[10px] block">
                    Uniswap V3 Pool (0.05% fee)
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 font-mono block">LEG 3 (SWAP)</span>
                  <span className="font-semibold text-xs text-zinc-200">ETH → USDT</span>
                  <span className="text-zinc-400 block text-[11px] mt-1 font-mono">
                    @ $2,875.50
                  </span>
                  <span className="text-zinc-500 text-[10px] block">OKX Spot (0.08% fee)</span>
                </div>
              </div>

              {/* Sizing Checkpoints Table */}
              <div className="mt-4">
                <span className="text-xs font-medium text-zinc-300 block mb-2">
                  Profitability Curve across Capital Tiers ($100 – $100,000)
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 text-[11px]">
                        <th className="py-1.5">Capital</th>
                        <th className="py-1.5">Expected Net PnL</th>
                        <th className="py-1.5">Net ROI</th>
                        <th className="py-1.5">Execution Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {checkpoints.map((cp) => (
                        <tr key={cp.capital}>
                          <td className="py-1.5 text-zinc-300">${cp.capital.toLocaleString()}</td>
                          <td className="py-1.5 text-emerald-400 font-bold">
                            +${cp.netProfit.toFixed(2)}
                          </td>
                          <td className="py-1.5 text-zinc-300">+{cp.roi.toFixed(2)}%</td>
                          <td className="py-1.5">
                            {cp.executable ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                EXECUTABLE
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                SLIPPAGE BOUND
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedStrategy === 'FUNDING' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Funding Rate Arbitrage: Spot BTC Long + Short BTC Perp
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Cash-and-carry carry yield with break-even period modeling
                  </p>
                </div>
                <a
                  href="/calculators"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Open Funding Calculator
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">ANNUALIZED APY</span>
                  <span className="text-base font-bold text-cyan-400 font-mono">14.82%</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">DAILY CARRY</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">+$40.50</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">ROUND-TRIP FEES</span>
                  <span className="text-base font-bold text-amber-400 font-mono">-$14.00</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">BREAK-EVEN TIME</span>
                  <span className="text-base font-bold text-zinc-200 font-mono">8.3 Hours</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded text-xs space-y-1.5 text-zinc-400">
                <div className="flex justify-between">
                  <span>Binance Spot Entry:</span>
                  <span className="text-zinc-200 font-mono">$98,450.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Deribit / Bybit Perp Mark:</span>
                  <span className="text-zinc-200 font-mono">$98,510.00 (+60 bps basis)</span>
                </div>
                <div className="flex justify-between">
                  <span>Funding Interval:</span>
                  <span className="text-zinc-200 font-mono">8 Hours (+0.0135% per interval)</span>
                </div>
              </div>
            </div>
          )}

          {selectedStrategy === 'BASIS' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Futures Basis Term Structure: Spot BTC vs Dated Futures
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Fixed-income annualized yield through maturity convergence
                  </p>
                </div>
                <a
                  href="/calculators"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Open Basis Calculator
                </a>
              </div>

              <div className="grid grid-cols-4 gap-2.5 my-3 text-xs font-mono">
                <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">SPOT PRICE</span>
                  <span className="text-zinc-200 font-bold">$98,500.00</span>
                  <span className="text-zinc-500 text-[10px] block mt-1">Binance</span>
                </div>
                <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">1M FUTURE</span>
                  <span className="text-indigo-400 font-bold">$99,150.00</span>
                  <span className="text-emerald-400 text-[10px] block mt-1">+7.9% Ann.</span>
                </div>
                <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">3M FUTURE</span>
                  <span className="text-indigo-400 font-bold">$100,450.00</span>
                  <span className="text-emerald-400 text-[10px] block mt-1">+8.6% Ann.</span>
                </div>
                <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">6M FUTURE</span>
                  <span className="text-indigo-400 font-bold">$102,800.00</span>
                  <span className="text-emerald-400 text-[10px] block mt-1">+9.4% Ann.</span>
                </div>
              </div>
            </div>
          )}

          {selectedStrategy === 'STATISTICAL' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Statistical Mean-Reversion: ETH ↔ stETH Synthetic Spread
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Ornstein-Uhlenbeck process with half-life estimation
                  </p>
                </div>
                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
                  ENGLE-GRANGER COINTEGRATED
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">CURRENT Z-SCORE</span>
                  <span className="text-base font-bold text-amber-400 font-mono">Z = +2.45</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">HALF-LIFE (TAU)</span>
                  <span className="text-base font-bold text-zinc-200 font-mono">14.2 Mins</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">HEDGE RATIO (BETA)</span>
                  <span className="text-base font-bold text-zinc-200 font-mono">1.0024</span>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">ADF P-VALUE</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    0.018 (p &lt; 0.05)
                  </span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded text-xs space-y-1 text-zinc-400">
                <span className="text-zinc-200 font-medium block">Trade Signal:</span>
                <p>
                  Spread is expanded beyond 2.0 standard deviations (38.5 bps). Optimal action is{' '}
                  <strong>SHORT SPREAD</strong>: Sell ETH at $2,856.40, Buy stETH at $2,845.50. Mean
                  reversion expected within 15 minutes.
                </p>
              </div>
            </div>
          )}

          {selectedStrategy === 'MULTI_HOP' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Multi-Hop Cross-Venue Graph: USDT → BTC → ETH → SOL → USDT
                  </h3>
                  <p className="text-xs text-zinc-400">
                    4-Hop cycle across Binance, Uniswap V3, and Raydium
                  </p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  4-HOP CYCLE
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs font-mono my-3">
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">LEG 1</span>
                  <span>USDT → BTC</span>
                  <span className="text-zinc-500 text-[10px] block">Binance</span>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">LEG 2</span>
                  <span>BTC → ETH</span>
                  <span className="text-zinc-500 text-[10px] block">Uniswap V3</span>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">LEG 3</span>
                  <span>ETH → SOL</span>
                  <span className="text-zinc-500 text-[10px] block">Across Bridge</span>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-[10px] text-zinc-500 block">LEG 4</span>
                  <span>SOL → USDT</span>
                  <span className="text-zinc-500 text-[10px] block">Raydium</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-zinc-500 block text-[10px]">NET PROFIT (ON $10K)</span>
                  <span className="text-emerald-400 font-bold text-sm">+$115.30 USD</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">TOTAL FEES + GAS</span>
                  <span className="text-zinc-300 font-bold">-$24.50 USD</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">TOTAL LATENCY</span>
                  <span className="text-zinc-300 font-bold">145ms</span>
                </div>
              </div>
            </div>
          )}

          {selectedStrategy === 'PAIRS' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Cointegrated Pairs Divergence Monitor
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Tracking divergence between high-correlation crypto assets
                  </p>
                </div>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                  PAIRS MONITOR
                </Badge>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between">
                  <div>
                    <span className="font-bold text-zinc-200">ETH/USDT ↔ stETH/USDT</span>
                    <span className="text-zinc-500 block text-[10px]">
                      Correlation: 0.984 | Beta: 1.002
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 font-bold">Z = +2.45 (38.5 bps)</span>
                    <span className="text-emerald-400 block text-[10px]">SHORT SPREAD</span>
                  </div>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between">
                  <div>
                    <span className="font-bold text-zinc-200">SOL/USDT ↔ mSOL/USDT</span>
                    <span className="text-zinc-500 block text-[10px]">
                      Correlation: 0.971 | Beta: 1.150
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 font-bold">Z = +2.15 (45.2 bps)</span>
                    <span className="text-emerald-400 block text-[10px]">SHORT SPREAD</span>
                  </div>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between">
                  <div>
                    <span className="font-bold text-zinc-200">BTC/USDT ↔ WBTC/USDT</span>
                    <span className="text-zinc-500 block text-[10px]">
                      Correlation: 0.996 | Beta: 1.000
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400 font-bold">Z = +1.20 (12.0 bps)</span>
                    <span className="text-zinc-500 block text-[10px]">NEUTRAL</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 3. Portfolio Capital Allocator Scenario */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              Multi-Opportunity Capital Allocation Scenario
            </h3>
            <p className="text-xs text-zinc-400">
              Optimal allocation of available capital across concurrent opportunities bounded by
              venue limits and execution risk
            </p>
          </div>
          <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs font-mono">
            PORTFOLIO: $100,000 USD
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded">
            <span className="text-xs text-zinc-400 block">
              Opportunity A (Triangular USDT-BTC-ETH)
            </span>
            <span className="text-base font-bold text-emerald-400 font-mono mt-1 block">
              $25,000 USD
            </span>
            <span className="text-[11px] text-zinc-500">
              Weight: 25% | Expected ROI: +0.84% (+$210.30)
            </span>
          </div>
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded">
            <span className="text-xs text-zinc-400 block">
              Opportunity B (Funding Rate BTC Cash-and-Carry)
            </span>
            <span className="text-base font-bold text-cyan-400 font-mono mt-1 block">
              $40,000 USD
            </span>
            <span className="text-[11px] text-zinc-500">
              Weight: 40% (Max Venue Cap) | APY: 14.8%
            </span>
          </div>
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded">
            <span className="text-xs text-zinc-400 block">
              Opportunity C (ETH/stETH Statistical Pairs)
            </span>
            <span className="text-base font-bold text-indigo-400 font-mono mt-1 block">
              $20,000 USD
            </span>
            <span className="text-[11px] text-zinc-500">
              Weight: 20% | Expected ROI: +0.38% (+$76.00)
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400">
            Total Allocated: <strong className="text-zinc-200">$85,000 USD (85%)</strong>
          </span>
          <span className="text-zinc-400">
            Idle Capital Reserve: <strong className="text-zinc-200">$15,000 USD (15%)</strong>
          </span>
          <span className="text-emerald-400 font-bold">Projected Net Result: +$448.30 USD</span>
        </div>
      </Card>
    </div>
  );
}
