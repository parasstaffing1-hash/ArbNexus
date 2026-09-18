import * as React from 'react';
import { cn } from '../lib/utils';

export interface SpreadBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  spreadPercent: number;
  highlightThreshold?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function SpreadBadge({
  spreadPercent,
  highlightThreshold = 1.0,
  size = 'md',
  className,
  ...props
}: SpreadBadgeProps) {
  const isHigh = spreadPercent >= highlightThreshold;
  const isUltra = spreadPercent >= 2.0;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-mono font-bold tracking-tight',
        isUltra
          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-[0_0_12px_rgba(245,166,35,0.3)]'
          : isHigh
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(0,242,254,0.2)]'
            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3.5 py-1.5 text-sm',
        className,
      )}
      {...props}
    >
      <span>+{spreadPercent >= 0 ? spreadPercent.toFixed(2) : '0.00'}%</span>
    </div>
  );
}
