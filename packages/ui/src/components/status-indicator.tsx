import * as React from 'react';
import { cn } from '../lib/utils';

export type SystemStatusType = 'online' | 'volatile' | 'degraded' | 'offline';

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: SystemStatusType;
  label?: string;
  pulse?: boolean;
}

export function StatusIndicator({
  status,
  label,
  pulse = true,
  className,
  ...props
}: StatusIndicatorProps) {
  const statusConfig = {
    online: {
      color: 'bg-emerald-400',
      ring: 'bg-emerald-400/30',
      text: 'text-emerald-300',
      defaultLabel: 'Live / Healthy',
    },
    volatile: {
      color: 'bg-cyan-400',
      ring: 'bg-cyan-400/30',
      text: 'text-cyan-300',
      defaultLabel: 'High Arbitrage Volatility',
    },
    degraded: {
      color: 'bg-amber-400',
      ring: 'bg-amber-400/30',
      text: 'text-amber-300',
      defaultLabel: 'Latency Degraded',
    },
    offline: {
      color: 'bg-rose-500',
      ring: 'bg-rose-500/30',
      text: 'text-rose-300',
      defaultLabel: 'Disconnected',
    },
  };

  const current = statusConfig[status];

  return (
    <div className={cn('inline-flex items-center gap-2 font-mono text-xs', className)} {...props}>
      <span className="relative flex h-2.5 w-2.5">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              current.ring,
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', current.color)} />
      </span>
      {label !== undefined ? (
        <span className={cn('font-medium', current.text)}>{label}</span>
      ) : (
        <span className={cn('font-medium', current.text)}>{current.defaultLabel}</span>
      )}
    </div>
  );
}
