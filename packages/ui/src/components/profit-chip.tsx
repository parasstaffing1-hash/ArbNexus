import * as React from 'react';
import { cn } from '../lib/utils';

export interface ProfitChipProps extends React.HTMLAttributes<HTMLDivElement> {
  profitUsd: number;
  feesUsd?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfitChip({
  profitUsd,
  feesUsd,
  size = 'md',
  className,
  ...props
}: ProfitChipProps) {
  const isPositive = profitUsd > 0;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border font-mono tracking-tight',
        isPositive
          ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
          : 'border-rose-500/30 bg-rose-950/40 text-rose-300',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3 py-1.5 text-sm font-semibold',
        className,
      )}
      title={
        feesUsd !== undefined ? `Gross profit before $${feesUsd.toFixed(2)} in fees` : undefined
      }
      {...props}
    >
      <span>
        {isPositive ? '+' : ''}$
        {profitUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      {feesUsd !== undefined && feesUsd > 0 && (
        <span className="text-[10px] text-slate-400 font-sans opacity-80">
          (-${feesUsd.toFixed(1)})
        </span>
      )}
    </div>
  );
}
