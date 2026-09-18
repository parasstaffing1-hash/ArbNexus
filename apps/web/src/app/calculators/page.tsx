'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CALCULATOR_REGISTRY,
  CalculatorMeta,
  CalculatorCategory,
  calculateSpotArbitrage,
  calculateCrossChainArbitrage,
  calculateFundingProfit,
  calculateImpermanentLoss,
  calculateOpportunityScore,
} from '@arbitrage/calculators';
import { GlassCard, Button, cn } from '@arbitrage/ui';
import {
  Search,
  ScanLine,
  Percent,
  GitBranch,
  Flame,
  AlertTriangle,
  PieChart,
  DollarSign,
  Sliders,
  ShieldCheck,
  Fuel,
  Coins,
  Receipt,
  Layers,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

const CATEGORIES: { id: CalculatorCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Calculators' },
  { id: 'arbitrage', label: 'Spot Arbitrage' },
  { id: 'fees', label: 'Exchange Fees' },
  { id: 'slippage', label: 'Slippage & Depth' },
  { id: 'crosschain', label: 'Cross-Chain' },
  { id: 'funding', label: 'Funding Rates' },
  { id: 'futures', label: 'Futures & Margin' },
  { id: 'defi', label: 'DeFi & AMM' },
  { id: 'stablecoin', label: 'Stablecoins' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'risk', label: 'Risk & Volatility' },
  { id: 'yield', label: 'Yield & APY' },
  { id: 'gas', label: 'Gas & Network' },
  { id: 'scoring', label: 'Opportunity Scoring' },
  { id: 'simulation', label: 'Simulator' },
];

export default function CalculatorsCatalogPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<CalculatorCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredCalculators = React.useMemo(() => {
    return CALCULATOR_REGISTRY.filter((calc) => {
      if (selectedCategory !== 'all' && calc.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = calc.name.toLowerCase().includes(q);
        const matchDesc = calc.description.toLowerCase().includes(q);
        const matchFormula = calc.formulaDescription.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchFormula) return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#071423] text-zinc-100 p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-900/30 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-sans">
              Financial & Arbitrage Calculation Engine
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              DECIMAL.JS 36-DIGIT
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1.5">
            Deterministic, auditable calculation suite covering 16 financial domains across CEX,
            DEX, and cross-chain routes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-mono text-cyan-300 hover:text-white px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
          >
            <span>Live Terminal</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search calculators by name, formula, or asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-mono bg-[#0a1b2e] border border-cyan-900/40 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all border',
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border-cyan-400/40 shadow-[0_0_10px_rgba(0,242,254,0.15)]'
                  : 'bg-black/30 text-zinc-400 hover:text-white border-transparent',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calculator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCalculators.map((calc) => (
          <GlassCard
            key={calc.id}
            variant="default"
            className="p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                  {calc.category}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {calc.parameters.length} params
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-white font-mono group-hover:text-cyan-300 transition-colors">
                  {calc.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{calc.description}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-900/20 font-mono text-[11px] text-cyan-400/90 truncate">
                {calc.formulaDescription}
              </div>
            </div>

            <div className="pt-2 border-t border-cyan-900/20 flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400/80">AUDITABLE MATH</span>

              <Link
                href={`/calculators/${calc.slug}`}
                className="inline-flex items-center gap-1 text-xs font-mono font-bold text-cyan-300 hover:text-white transition-colors"
              >
                <span>Launch Calculator</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
