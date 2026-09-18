import * as React from 'react';
import { GlassCard, GlassCardProps } from './glass-card';
import { cn } from '../lib/utils';

export interface HeatmapCardProps extends Omit<GlassCardProps, 'children'> {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function HeatmapCard({
  title,
  subtitle,
  badge,
  actions,
  children,
  className,
  ...props
}: HeatmapCardProps) {
  return (
    <GlassCard className={cn('space-y-4', className)} {...props}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1c3957]/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 tracking-tight">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div>{children}</div>
    </GlassCard>
  );
}
