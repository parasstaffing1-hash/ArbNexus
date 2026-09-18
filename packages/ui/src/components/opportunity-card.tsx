import * as React from 'react';
import { GlassCard } from './glass-card';
import { ExchangeBadge } from './exchange-badge';
import { SpreadBadge } from './spread-badge';
import { ProfitChip } from './profit-chip';
import { Button } from './button';
import { ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export interface OpportunityCardProps {
  id: string;
  pair: string;
  sourceExchange: string;
  targetExchange: string;
  buyPrice: number;
  sellPrice: number;
  spreadPercent: number;
  netProfitUsd: number;
  totalFeesUsd: number;
  confidenceScore: number;
  network?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export function OpportunityCard({
  id,
  pair,
  sourceExchange,
  targetExchange,
  buyPrice,
  sellPrice,
  spreadPercent,
  netProfitUsd,
  totalFeesUsd,
  confidenceScore,
  network = 'Ethereum',
  onSelect,
  className,
}: OpportunityCardProps) {
  return (
    <GlassCard
      variant={spreadPercent > 1.5 ? 'gold' : 'default'}
      className={cn('cursor-pointer space-y-4 hover:border-cyan-400/50', className)}
      onClick={() => onSelect?.(id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-bold text-white">{pair}</span>
          <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            {network}
          </span>
        </div>
        <SpreadBadge spreadPercent={spreadPercent} />
      </div>

      <div className="flex items-center justify-between rounded-lg bg-[#071423]/70 p-2.5 border border-[#163350]/60">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Buy Venue</span>
          <div className="flex items-center gap-1.5">
            <ExchangeBadge name={sourceExchange} size="sm" />
            <span className="font-mono text-xs text-slate-300">${buyPrice.toLocaleString()}</span>
          </div>
        </div>

        <ArrowRight className="h-4 w-4 text-cyan-400" />

        <div className="space-y-0.5 text-right">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Sell Venue</span>
          <div className="flex items-center justify-end gap-1.5">
            <ExchangeBadge name={targetExchange} size="sm" />
            <span className="font-mono text-xs text-slate-300">${sellPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Net Yield</span>
          <div>
            <ProfitChip profitUsd={netProfitUsd} feesUsd={totalFeesUsd} size="md" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center justify-end gap-0.5">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Confidence
            </span>
            <span className="font-mono text-xs font-semibold text-emerald-400">
              {(confidenceScore * 100).toFixed(0)}%
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-8 border-[#214368] text-xs hover:border-cyan-400 hover:text-cyan-300"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(id);
            }}
          >
            <Zap className="h-3.5 w-3.5 mr-1 text-cyan-400" /> Inspect
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
