'use client';

import * as React from 'react';
import { GlassCard } from '@arbitrage/ui';

interface ProfitCurveChartProps {
  points: {
    tradeSizeUsd: number;
    netProfitUsd: number;
    netRoiPercent: number;
    isProfitable: boolean;
  }[];
  optimalTradeSizeUsd?: number;
  currentTradeSizeUsd?: number;
}

export function ProfitCurveChart({
  points,
  optimalTradeSizeUsd,
  currentTradeSizeUsd,
}: ProfitCurveChartProps) {
  if (!points || points.length === 0) return null;

  const minX = Math.min(...points.map((p) => p.tradeSizeUsd));
  const maxX = Math.max(...points.map((p) => p.tradeSizeUsd));
  const minY = Math.min(0, ...points.map((p) => p.netProfitUsd));
  const maxY = Math.max(10, ...points.map((p) => p.netProfitUsd));

  const width = 600;
  const height = 240;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 40;

  const scaleX = (val: number) =>
    padLeft + ((val - minX) / (maxX - minX || 1)) * (width - padLeft - padRight);

  const scaleY = (val: number) =>
    height - padBottom - ((val - minY) / (maxY - minY || 1)) * (height - padTop - padBottom);

  const zeroY = scaleY(0);

  const pathData = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(p.tradeSizeUsd)} ${scaleY(p.netProfitUsd)}`)
    .join(' ');

  return (
    <GlassCard variant="default" className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Trade Size vs Net Profit Curve
          </h4>
          <span className="text-[10px] font-mono text-zinc-400">
            Simulates order-book market impact vs fixed fee amortization
          </span>
        </div>

        {optimalTradeSizeUsd && optimalTradeSizeUsd > 0 && (
          <div className="text-right font-mono text-xs">
            <span className="text-[10px] text-zinc-400 block">OPTIMAL SIZE</span>
            <span className="font-bold text-cyan-400">
              ${optimalTradeSizeUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 overflow-visible font-mono text-[10px]"
        >
          {/* Zero baseline */}
          <line
            x1={padLeft}
            y1={zeroY}
            x2={width - padRight}
            y2={zeroY}
            stroke="#3f3f46"
            strokeDasharray="4 4"
          />
          <text x={padLeft - 8} y={zeroY + 3} fill="#71717a" textAnchor="end">
            $0
          </text>

          {/* Top Y axis label */}
          <text x={padLeft - 8} y={scaleY(maxY) + 4} fill="#10b981" textAnchor="end">
            ${maxY.toFixed(0)}
          </text>

          {/* Min Y axis label */}
          {minY < 0 && (
            <text x={padLeft - 8} y={scaleY(minY)} fill="#f43f5e" textAnchor="end">
              ${minY.toFixed(0)}
            </text>
          )}

          {/* Area fill under curve */}
          <path
            d={`${pathData} L ${scaleX(points[points.length - 1].tradeSizeUsd)} ${zeroY} L ${scaleX(
              points[0].tradeSizeUsd,
            )} ${zeroY} Z`}
            fill="url(#profitGradient)"
            opacity="0.2"
          />

          <defs>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#071423" />
            </linearGradient>
          </defs>

          {/* Main Profit Line */}
          <path
            d={pathData}
            fill="none"
            stroke="#00f2fe"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={scaleX(p.tradeSizeUsd)}
              cy={scaleY(p.netProfitUsd)}
              r={p.tradeSizeUsd === currentTradeSizeUsd ? 5 : 3}
              fill={p.netProfitUsd > 0 ? '#10b981' : '#f43f5e'}
              stroke="#ffffff"
              strokeWidth={p.tradeSizeUsd === currentTradeSizeUsd ? 2 : 1}
            />
          ))}

          {/* Current selected point callout */}
          {currentTradeSizeUsd && (
            <line
              x1={scaleX(currentTradeSizeUsd)}
              y1={padTop}
              x2={scaleX(currentTradeSizeUsd)}
              y2={height - padBottom}
              stroke="#f5a623"
              strokeDasharray="2 2"
            />
          )}

          {/* X axis labels */}
          <text x={padLeft} y={height - 12} fill="#71717a">
            ${minX >= 1000 ? `${(minX / 1000).toFixed(0)}k` : minX}
          </text>
          <text x={width - padRight} y={height - 12} fill="#71717a" textAnchor="end">
            ${maxX >= 1000 ? `${(maxX / 1000).toFixed(0)}k` : maxX}
          </text>
        </svg>
      </div>
    </GlassCard>
  );
}
