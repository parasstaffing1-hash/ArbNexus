'use client';

import * as React from 'react';
import { TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

export function LiquidityDepthCurve() {
  const tiers = [
    {
      size: '$1,000',
      spread: '+42.5 bps',
      slippage: '1.2 bps',
      netProfit: '+$4.25',
      profitable: true,
      fillRate: '100% Top of Book',
    },
    {
      size: '$10,000',
      spread: '+38.2 bps',
      slippage: '5.5 bps',
      netProfit: '+$38.20',
      profitable: true,
      fillRate: '100% L2 Depth',
    },
    {
      size: '$100,000',
      spread: '+21.0 bps',
      slippage: '22.7 bps',
      netProfit: '+$210.00',
      profitable: true,
      fillRate: '98.5% Partial Impact',
    },
    {
      size: '$500,000',
      spread: '-12.4 bps',
      slippage: '56.4 bps',
      netProfit: '-$620.00 (Loss)',
      profitable: false,
      fillRate: 'Crossed Break-Even',
    },
  ];

  return (
    <div className="p-5 rounded-2xl bg-black/65 border border-cyan-500/30 backdrop-blur-xl max-w-lg w-full">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-950/60 font-mono text-xs">
        <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
          <TrendingDown className="w-4 h-4 text-amber-400" />
          <span>ORDER-BOOK IMPACT SIMULATOR</span>
        </div>
        <span className="text-zinc-400 text-[10px]">DECIMAL.JS DEPTH WALK</span>
      </div>

      <div className="text-xs text-zinc-300 mb-3 font-sans italic">
        &ldquo;A price difference is not necessarily an executable arbitrage.&rdquo;
      </div>

      <div className="space-y-2">
        {tiers.map((tier, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-xl border font-mono text-xs flex items-center justify-between transition-colors ${
              tier.profitable
                ? 'bg-white/[0.02] border-cyan-900/30 hover:border-cyan-400/40'
                : 'bg-rose-950/20 border-rose-900/40 hover:border-rose-500/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {tier.profitable ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <div>
                <span className="text-white font-bold">{tier.size}</span>
                <span className="text-[10px] text-zinc-400 ml-2">Slip: {tier.slippage}</span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`font-bold ${tier.profitable ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {tier.spread}
              </span>
              <div className="text-[10px] text-zinc-400">{tier.netProfit}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-cyan-950/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>Dynamic VWAP Calculation</span>
        <span>Simulated Against Live L2 Snapshot</span>
      </div>
    </div>
  );
}
