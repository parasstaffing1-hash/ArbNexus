'use client';

import * as React from 'react';
import { Percent, TrendingUp, Clock, Flame, ArrowRightLeft, Sparkles, Info } from 'lucide-react';
import { GlassCard, Button, cn } from '@arbitrage/ui';
import { MOCK_FUNDING_RATES, FundingRateData } from '../../lib/mock-data';

export function FundingHeatmapView() {
  const [fundingRates] = React.useState<FundingRateData[]>(MOCK_FUNDING_RATES);
  const [timeLeft, setTimeLeft] = React.useState('02h 41m 18s');

  // Calculate highest delta opportunity
  const bestDelta = React.useMemo(() => {
    let maxDiff = 0;
    let bestAsset = '';
    let longEx = '';
    let shortEx = '';

    fundingRates.forEach((item) => {
      const exMap: Record<string, number> = {
        Binance: item.binance,
        Bybit: item.bybit,
        OKX: item.okx,
        Hyperliquid: item.hyperliquid,
        Bitget: item.bitget,
      };
      const entries = Object.entries(exMap);
      entries.sort((a, b) => a[1] - b[1]);
      const diff = entries[entries.length - 1][1] - entries[0][1];
      if (diff > maxDiff) {
        maxDiff = diff;
        bestAsset = item.asset;
        longEx = entries[0][0];
        shortEx = entries[entries.length - 1][0];
      }
    });

    return { asset: bestAsset, diff: maxDiff, longEx, shortEx, apy: maxDiff * 3 * 365 };
  }, [fundingRates]);

  const getCellColor = (val: number) => {
    if (val < 0) return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (val > 0.03)
      return 'bg-amber-500/25 text-amber-300 border-amber-500/40 font-bold shadow-[inset_0_0_8px_rgba(245,166,35,0.2)]';
    if (val > 0.015) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Perpetual Funding Rate Matrix
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              8H SETTLEMENT
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time perp funding rates across major CEXs and Hyperliquid DEX for delta-neutral
            basis arbitrage.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-lg bg-black/40 border border-cyan-900/30 text-zinc-300">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Next Settlement:</span>
          <span className="font-bold text-amber-400">{timeLeft}</span>
        </div>
      </div>

      {/* Top Funding Opportunity Banner */}
      <GlassCard variant="gold" className="p-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                Top Delta-Neutral Arb Opportunity
              </span>
            </div>
            <div className="text-sm text-zinc-200">
              Long <span className="text-cyan-300 font-bold">{bestDelta.longEx}</span> + Short{' '}
              <span className="text-amber-300 font-bold">{bestDelta.shortEx}</span> on{' '}
              <span className="text-white font-bold">{bestDelta.asset}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] font-mono text-zinc-400">8H RATE DELTA</div>
              <div className="text-xl font-mono font-extrabold text-amber-400">
                +{bestDelta.diff.toFixed(3)}%
              </div>
            </div>
            <div className="h-8 w-px bg-amber-500/30" />
            <div>
              <div className="text-[10px] font-mono text-zinc-400">ANNUALIZED APY</div>
              <div className="text-xl font-mono font-extrabold text-emerald-400">
                +{bestDelta.apy.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Funding Heatmap Table */}
      <GlassCard variant="default" className="overflow-hidden border-cyan-900/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cyan-900/30 bg-black/40 text-zinc-400 text-[11px] uppercase font-mono tracking-wider">
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4 text-center">Binance</th>
                <th className="py-3 px-4 text-center">Bybit</th>
                <th className="py-3 px-4 text-center">OKX</th>
                <th className="py-3 px-4 text-center">Hyperliquid</th>
                <th className="py-3 px-4 text-center">Bitget</th>
                <th className="py-3 px-4 text-center">Predicted</th>
                <th className="py-3 px-4 text-right">Annual APY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-950/40 text-xs font-mono">
              {fundingRates.map((item) => (
                <tr key={item.asset} className="hover:bg-cyan-500/5 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-xs font-mono">
                      {item.asset}
                    </span>
                    <span>{item.asset}/USDT</span>
                  </td>

                  {/* Exchanges */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded border inline-block min-w-[64px]',
                        getCellColor(item.binance),
                      )}
                    >
                      {(item.binance > 0 ? '+' : '') + item.binance.toFixed(3)}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded border inline-block min-w-[64px]',
                        getCellColor(item.bybit),
                      )}
                    >
                      {(item.bybit > 0 ? '+' : '') + item.bybit.toFixed(3)}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded border inline-block min-w-[64px]',
                        getCellColor(item.okx),
                      )}
                    >
                      {(item.okx > 0 ? '+' : '') + item.okx.toFixed(3)}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded border inline-block min-w-[64px]',
                        getCellColor(item.hyperliquid),
                      )}
                    >
                      {(item.hyperliquid > 0 ? '+' : '') + item.hyperliquid.toFixed(3)}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded border inline-block min-w-[64px]',
                        getCellColor(item.bitget),
                      )}
                    >
                      {(item.bitget > 0 ? '+' : '') + item.bitget.toFixed(3)}%
                    </span>
                  </td>

                  {/* Predicted */}
                  <td className="py-3.5 px-4 text-center text-zinc-300 font-mono">
                    {(item.predictedNext > 0 ? '+' : '') + item.predictedNext.toFixed(3)}%
                  </td>

                  {/* APY */}
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                    {item.annualizedApy > 0
                      ? `+${item.annualizedApy.toFixed(1)}%`
                      : `${item.annualizedApy.toFixed(1)}%`}
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
