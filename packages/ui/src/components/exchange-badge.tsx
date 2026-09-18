import * as React from 'react';
import { cn } from '../lib/utils';

export interface ExchangeBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  type?: 'CEX' | 'DEX';
  status?: 'online' | 'degraded' | 'offline';
  latencyMs?: number;
  size?: 'sm' | 'md';
}

export function ExchangeBadge({
  name,
  type = 'CEX',
  status = 'online',
  latencyMs,
  size = 'md',
  className,
  ...props
}: ExchangeBadgeProps) {
  const statusColors = {
    online: 'bg-emerald-400',
    degraded: 'bg-amber-400',
    offline: 'bg-rose-500',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-[#1d3b5c]/70 bg-[#0b1c2e]/90 font-mono tracking-tight text-slate-200',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        className,
      )}
      {...props}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', statusColors[status])} />
      <span className="font-semibold text-slate-100">{name}</span>
      <span
        className={cn(
          'rounded px-1 text-[10px] uppercase font-mono',
          type === 'CEX'
            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20',
        )}
      >
        {type}
      </span>
      {latencyMs !== undefined && (
        <span className="text-[10px] text-slate-400 font-mono">{latencyMs}ms</span>
      )}
    </div>
  );
}
