'use client';

import * as React from 'react';
import { StoryMetric } from './story-config';

interface MetricOverlayProps {
  metrics: StoryMetric[];
  className?: string;
}

export function MetricOverlay({ metrics, className = '' }: MetricOverlayProps) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full ${className}`}>
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className="relative group p-3 sm:p-4 rounded-xl bg-black/40 border border-cyan-900/30 backdrop-blur-md transition-all hover:border-cyan-400/40 hover:bg-black/60 shadow-lg"
        >
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

          <div className="text-[10px] sm:text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1 truncate">
            {metric.label}
          </div>
          <div
            className={`font-mono text-sm sm:text-lg font-bold tracking-tight ${
              metric.positive === true
                ? 'text-emerald-400'
                : metric.positive === false
                  ? 'text-rose-400'
                  : 'text-white'
            }`}
          >
            {metric.prefix}
            {metric.value}
            {metric.suffix}
          </div>
        </div>
      ))}
    </div>
  );
}
