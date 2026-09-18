import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calculator,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  Zap,
} from 'lucide-react';
import { Card, Button, Badge } from '@arbitrage/ui';

interface StrategyDetailConfig {
  name: string;
  category: string;
  formula: string;
  description: string;
  parameters: { name: string; defaultValue: string; description: string }[];
  riskFactors: string[];
  calculatorSlug: string;
}

const STRATEGIES: Record<string, StrategyDetailConfig> = {
  triangular: {
    name: 'Triangular Arbitrage',
    category: 'Cyclic Graph Arbitrage',
    formula:
      'Net PnL = C_0 * [ (P_12 * (1 - f_1)) * (P_23 * (1 - f_2)) * (P_31 * (1 - f_3)) - 1 ] - Slippage - Gas',
    description:
      'Explores 3-leg currency cycles (e.g. USDT -> BTC -> ETH -> USDT) where the cross-currency implied exchange rate diverges from the direct pair price.',
    parameters: [
      {
        name: 'Root Asset',
        defaultValue: 'USDT',
        description: 'Base denomination currency to enter and exit cycle',
      },
      {
        name: 'Min Spread Bps',
        defaultValue: '5 bps (0.05%)',
        description: 'Minimum hurdle rate to cover exchange fees',
      },
      {
        name: 'Max Slippage',
        defaultValue: '10 bps',
        description: 'Slippage threshold cap before rejecting cycle',
      },
    ],
    riskFactors: ['Leg Execution Latency', 'Orderbook Depletion', 'Exchange API Rate Limiting'],
    calculatorSlug: 'spot-arbitrage',
  },
  'multi-hop': {
    name: 'Multi-Hop Graph Arbitrage',
    category: 'Cross-Venue Routing',
    formula: 'Net Return = Product_{i=1}^{k} [ R_i * (1 - f_i) * (1 - s_i) ] - sum(Gas_i)',
    description:
      'Finds 4-hop and 5-hop arbitrage pathways across decentralized liquidity pools and centralized books using combinatorial pruning to avoid path explosion.',
    parameters: [
      {
        name: 'Max Hops',
        defaultValue: '4',
        description: 'Maximum leg depth traversal (3 to 5 hops)',
      },
      {
        name: 'Liquidity Floor',
        defaultValue: '$25,000 USD',
        description: 'Prunes edges with insufficient pool depth',
      },
      {
        name: 'Max Data Age',
        defaultValue: '15,000 ms',
        description: 'Prunes quotes exceeding staleness threshold',
      },
    ],
    riskFactors: [
      'Multi-Hop Reorg Risk',
      'Cumulative Calldata Gas',
      'Intermediate Slippage Cascades',
    ],
    calculatorSlug: 'spot-arbitrage',
  },
  funding: {
    name: 'Funding Rate Carry & Perp-Perp Arbitrage',
    category: 'Derivatives Carry',
    formula: 'Annualized Carry = FundingRate * (24 / Interval) * 365 - 2 * TakerFee',
    description:
      'Captures periodic 8-hour funding payments paid between perpetual contract longs and shorts by establishing delta-neutral spot hedges or opposite perpetual positions.',
    parameters: [
      {
        name: 'Min APY Hurdle',
        defaultValue: '10.0%',
        description: 'Minimum annualized yield to enter position',
      },
      {
        name: 'Holding Period',
        defaultValue: '30 Days',
        description: 'Projected carry holding duration',
      },
      {
        name: 'Leverage Cap',
        defaultValue: '1x (Cash-and-Carry)',
        description: 'Isolated delta-neutral hedge ratio',
      },
    ],
    riskFactors: [
      'Funding Rate Inversion',
      'Liquidation on Margin Legs',
      'Exchange Unscheduled Maintenance',
    ],
    calculatorSlug: 'funding-arbitrage',
  },
  basis: {
    name: 'Spot ↔ Futures Basis Term Structure',
    category: 'Cash and Carry Convergence',
    formula: 'Annualized Basis = [ (Future - Spot) / Spot ] * (365 / DaysToExpiry)',
    description:
      'Locks in fixed contango premium by buying spot underlying and selling dated futures contracts, capturing deterministic convergence to spot at expiry.',
    parameters: [
      {
        name: 'Min Annualized Basis',
        defaultValue: '6.0%',
        description: 'Minimum basis return threshold',
      },
      {
        name: 'Tenor Filter',
        defaultValue: '1M to 3M',
        description: 'Maturity window for optimal capital turnover',
      },
    ],
    riskFactors: ['Early Delivery Risk', 'Spot Transfer Latency', 'Exchange Haircut Changes'],
    calculatorSlug: 'basis-arbitrage',
  },
  statistical: {
    name: 'Statistical Mean-Reversion',
    category: 'Quantitative Relative Value',
    formula: 'Z_t = [ (P_A,t - Beta * P_B,t) - Mean_Spread ] / StdDev_Spread',
    description:
      'Monitors cointegrated pairs via the Ornstein-Uhlenbeck mean-reverting process. Triggers entries when the synthetic spread deviates beyond 2.0 standard deviations.',
    parameters: [
      {
        name: 'Entry Z-Score',
        defaultValue: '2.0',
        description: 'Standard deviation threshold for entry',
      },
      { name: 'Exit Z-Score', defaultValue: '0.5', description: 'Mean reversion target for exit' },
      { name: 'Stop Loss Z-Score', defaultValue: '3.5', description: 'Divergence stop threshold' },
      {
        name: 'Lookback Window',
        defaultValue: '60 Periods',
        description: 'Rolling sample length for spread estimation',
      },
    ],
    riskFactors: [
      'Structural Regime Shift',
      'Cointegration Breakdown',
      'Uncorrelated Asset Shocks',
    ],
    calculatorSlug: 'spot-arbitrage',
  },
  pairs: {
    name: 'Pairs Arbitrage & Cointegration',
    category: 'Engle-Granger Two-Step',
    formula: 'Delta e_t = gamma * e_{t-1} + epsilon_t; HalfLife = ln(2) / (-gamma)',
    description:
      'Identifies statistically stationary pairs with Engle-Granger regression and Dickey-Fuller residual tests for reliable mean-reverting statistical arbitrage.',
    parameters: [
      {
        name: 'P-Value Cutoff',
        defaultValue: 'p < 0.05',
        description: 'Statistical significance threshold',
      },
      {
        name: 'Max Half-Life',
        defaultValue: '30 Minutes',
        description: 'Upper bound on expected reversion time',
      },
    ],
    riskFactors: ['Beta Drift', 'Cross-Venue Margin Demands', 'Idiosyncratic Token Insolvency'],
    calculatorSlug: 'spot-arbitrage',
  },
};

export function generateStaticParams() {
  return [
    { strategy: 'triangular' },
    { strategy: 'multi-hop' },
    { strategy: 'funding' },
    { strategy: 'basis' },
    { strategy: 'statistical' },
    { strategy: 'pairs' },
  ];
}

export default async function StrategyDetailPage({
  params,
}: {
  params: Promise<{ strategy: string }>;
}) {
  const { strategy } = await params;
  const config = STRATEGIES[strategy] || STRATEGIES['triangular'];

  return (
    <div className="min-h-screen bg-[#071423] text-zinc-100 p-6 md:p-10 font-sans space-y-6 max-w-6xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/?view=research" className="hover:text-zinc-200 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Research Workspace
        </Link>
        <span>/</span>
        <span className="text-zinc-200 font-medium">{config.name}</span>
      </div>

      {/* Header Card */}
      <Card className="bg-zinc-900/60 border-zinc-800 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
            {config.category}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Detection Only (Execution Disabled)
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{config.name}</h1>
        <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">{config.description}</p>

        {/* Mathematical Formula Box */}
        <div className="mt-4 p-4 bg-zinc-950 border border-zinc-800/80 rounded-lg">
          <span className="text-[11px] font-mono text-zinc-500 block mb-1 uppercase tracking-wider">
            Mathematical Invariant & Profit Formula
          </span>
          <code className="text-xs text-indigo-300 font-mono block overflow-x-auto py-1">
            {config.formula}
          </code>
        </div>
      </Card>

      {/* Parameters & Risk Decomposition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strategy Parameters */}
        <Card className="bg-zinc-900/60 border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Configurable Strategy Parameters
          </h2>
          <div className="divide-y divide-zinc-800 text-xs font-mono">
            {config.parameters.map((p) => (
              <div key={p.name} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="text-zinc-200 block font-medium">{p.name}</span>
                  <span className="text-zinc-500 text-[11px]">{p.description}</span>
                </div>
                <span className="text-indigo-400 font-semibold">{p.defaultValue}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Risk Decomposition */}
        <Card className="bg-zinc-900/60 border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            8-Factor Risk Decomposition
          </h2>
          <ul className="space-y-2 text-xs text-zinc-400">
            {config.riskFactors.map((rf) => (
              <li
                key={rf}
                className="flex items-center gap-2 p-2 rounded bg-zinc-950/60 border border-zinc-800/50"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-zinc-200 font-mono">{rf}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Calculator Integration Quick Link */}
      <Card className="bg-indigo-950/20 border-indigo-500/30 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-400" />
            Interactive Calculator Suite Integration
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Populate live opportunity inputs directly into the precision Decimal.js calculator
            engine.
          </p>
        </div>
        <Link href={`/calculators`}>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5">
            Launch Calculator
          </Button>
        </Link>
      </Card>
    </div>
  );
}
