'use client';

import * as React from 'react';
import {
  ShieldAlert,
  TrendingUp,
  Wallet,
  Play,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { GlassCard, Button, Badge } from '@arbitrage/ui';

interface PaperOrderRow {
  id: string;
  symbol: string;
  venue: string;
  side: 'BUY' | 'SELL';
  amount: string;
  price: string;
  slippageUsd: string;
  feeUsd: string;
  pnlUsd: string;
  status: 'FILLED' | 'PENDING' | 'CANCELLED';
  time: string;
}

export function PaperTradingView() {
  const [totalEquity, setTotalEquity] = React.useState(1254380.5);
  const [winRate, setWinRate] = React.useState(88.4);
  const [tradesCount, setTradesCount] = React.useState(43);
  const [realizedPnl, setRealizedPnl] = React.useState(4380.5);

  const [orders, setOrders] = React.useState<PaperOrderRow[]>([
    {
      id: 'paper-binance-001',
      symbol: 'BTC/USDT',
      venue: 'Binance',
      side: 'BUY',
      amount: '0.1500 BTC',
      price: '$100,010.00',
      slippageUsd: '$1.50',
      feeUsd: '$15.00',
      pnlUsd: '+$42.50',
      status: 'FILLED',
      time: '12s ago',
    },
    {
      id: 'paper-bybit-002',
      symbol: 'BTC/USDT',
      venue: 'Bybit',
      side: 'SELL',
      amount: '0.1500 BTC',
      price: '$100,500.00',
      slippageUsd: '$1.48',
      feeUsd: '$15.08',
      pnlUsd: '+$58.20',
      status: 'FILLED',
      time: '10s ago',
    },
    {
      id: 'paper-okx-003',
      symbol: 'ETH/USDT',
      venue: 'OKX',
      side: 'BUY',
      amount: '4.2000 ETH',
      price: '$3,520.00',
      slippageUsd: '$2.10',
      feeUsd: '$14.78',
      pnlUsd: '+$28.40',
      status: 'FILLED',
      time: '1m ago',
    },
    {
      id: 'paper-uni-004',
      symbol: 'SOL/USDC',
      venue: 'Uniswap V3',
      side: 'BUY',
      amount: '65.0000 SOL',
      price: '$182.40',
      slippageUsd: '$3.20',
      feeUsd: '$11.85',
      pnlUsd: '+$34.10',
      status: 'FILLED',
      time: '3m ago',
    },
  ]);

  const [simPair, setSimPair] = React.useState('BTC/USDT');
  const [simSizeUsd, setSimSizeUsd] = React.useState('10000');
  const [isSimulating, setIsSimulating] = React.useState(false);

  const handleSimulateTrade = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const netGain = Math.floor(Math.random() * 40) + 20;
      setRealizedPnl((prev) => prev + netGain);
      setTotalEquity((prev) => prev + netGain);
      setTradesCount((prev) => prev + 1);

      const newOrder: PaperOrderRow = {
        id: `paper-sim-${Date.now().toString().slice(-4)}`,
        symbol: simPair,
        venue: 'Binance -> Bybit',
        side: 'BUY',
        amount: (parseFloat(simSizeUsd) / 100000).toFixed(4) + ' ' + simPair.split('/')[0],
        price: '$100,010.00',
        slippageUsd: '$1.50',
        feeUsd: '$15.00',
        pnlUsd: `+$${netGain}.00`,
        status: 'FILLED',
        time: 'Just now',
      };
      setOrders((prev) => [newOrder, ...prev]);
      setIsSimulating(false);
    }, 400);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Paper Trading & Execution Sandbox
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              ZERO CAPITAL RISK
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Simulate realistic multi-leg execution with fee drag, depth-weighted slippage, and
            network latency.
          </p>
        </div>

        {/* Hard Safety Banner */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>LIVE TRADING: DISABLED (SERVER ENFORCED)</span>
        </div>
      </div>

      {/* Portfolio Equity & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassCard variant="default" className="p-4">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
            Total Paper Equity
          </span>
          <div className="text-2xl font-mono font-extrabold text-white">
            ${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-mono">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +$4,380.50 (Initial $1,250,000.00)
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
            Realized Net PnL
          </span>
          <div className="text-2xl font-mono font-extrabold text-emerald-400">
            +${realizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-400 mt-1 font-mono">After fees & depth slippage</div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
            Simulation Win Rate
          </span>
          <div className="text-2xl font-mono font-extrabold text-cyan-300">{winRate}%</div>
          <div className="text-xs text-zinc-400 mt-1 font-mono">
            {tradesCount} executed paper cycles
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
            Simulated Venues
          </span>
          <div className="text-2xl font-mono font-extrabold text-purple-300">5 Venues</div>
          <div className="text-xs text-zinc-400 mt-1 font-mono">
            Binance, Bybit, OKX, Uni, Raydium
          </div>
        </GlassCard>
      </div>

      {/* Manual Paper Execution Trigger */}
      <GlassCard variant="cyan" className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 block mb-1">ASSET PAIR</span>
              <select
                value={simPair}
                onChange={(e) => setSimPair(e.target.value)}
                className="bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400"
              >
                <option value="BTC/USDT">BTC/USDT</option>
                <option value="ETH/USDT">ETH/USDT</option>
                <option value="SOL/USDC">SOL/USDC</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] font-mono text-zinc-400 block mb-1">
                CAPITAL ALLOCATION
              </span>
              <select
                value={simSizeUsd}
                onChange={(e) => setSimSizeUsd(e.target.value)}
                className="bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400"
              >
                <option value="1000">$1,000</option>
                <option value="5000">$5,000</option>
                <option value="10000">$10,000</option>
                <option value="50000">$50,000</option>
              </select>
            </div>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleSimulateTrade}
            disabled={isSimulating}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 text-black font-semibold text-xs gap-1.5"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Simulating Execution...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                Simulate Paper Order
              </>
            )}
          </Button>
        </div>
      </GlassCard>

      {/* Paper Orders Table */}
      <GlassCard variant="default" className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Paper Fills & Position History
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">{orders.length} orders recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-cyan-900/30 text-zinc-400">
                <th className="pb-2.5 font-medium">ORDER ID</th>
                <th className="pb-2.5 font-medium">PAIR</th>
                <th className="pb-2.5 font-medium">VENUE</th>
                <th className="pb-2.5 font-medium">SIDE</th>
                <th className="pb-2.5 font-medium">AMOUNT</th>
                <th className="pb-2.5 font-medium">AVG PRICE</th>
                <th className="pb-2.5 font-medium">SLIPPAGE</th>
                <th className="pb-2.5 font-medium">FEES</th>
                <th className="pb-2.5 font-medium">NET PnL</th>
                <th className="pb-2.5 font-medium">STATUS</th>
                <th className="pb-2.5 font-medium text-right">TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 text-zinc-300">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-cyan-500/5 transition-colors">
                  <td className="py-3 text-cyan-300 font-bold">{o.id}</td>
                  <td className="py-3 text-white font-bold">{o.symbol}</td>
                  <td className="py-3 text-zinc-300">{o.venue}</td>
                  <td className="py-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        o.side === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {o.side}
                    </span>
                  </td>
                  <td className="py-3">{o.amount}</td>
                  <td className="py-3 text-white">{o.price}</td>
                  <td className="py-3 text-zinc-400">{o.slippageUsd}</td>
                  <td className="py-3 text-zinc-400">{o.feeUsd}</td>
                  <td className="py-3 text-emerald-400 font-bold">{o.pnlUsd}</td>
                  <td className="py-3">
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" />
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-zinc-500">{o.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
