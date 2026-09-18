'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Cpu, BarChart3, Database } from 'lucide-react';
import { Button } from '@arbitrage/ui';
import { StorySectionConfig } from './story-config';
import { MetricOverlay } from './metric-overlay';
import { OpportunityMiniCard } from './opportunity-mini-card';
import { RouteVisualization } from './route-visualization';
import { LiquidityDepthCurve } from './liquidity-depth-curve';
import { ScrollIndicator } from './scroll-indicator';

interface SectionContentProps {
  section: StorySectionConfig;
  onNavigateView?: (view: string) => void;
  onScrollNext?: () => void;
  className?: string;
}

export function SectionContent({
  section,
  onNavigateView,
  onScrollNext,
  className = '',
}: SectionContentProps) {
  const [mouseOffset, setMouseOffset] = React.useState({ x: 0, y: 0 });

  // Subtle mouse parallax for foreground UI elements only (Desktop)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 12;
    const y = (clientY / innerHeight - 0.5) * 12;
    setMouseOffset({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`relative z-20 w-full min-h-screen flex flex-col justify-between p-6 sm:p-12 md:p-16 max-w-7xl mx-auto pointer-events-none select-none ${className}`}
    >
      {/* Top Tag & Index */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="pt-8 sm:pt-4 flex items-center justify-between"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-cyan-800/40 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-xs text-cyan-300 font-semibold tracking-wider">
            {section.tag}
          </span>
        </div>

        {section.overlayType === 'hero' && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <img
              src="/logo.png"
              alt="ArbNexus Logo"
              className="w-8 h-8 rounded-lg border border-cyan-400/40 object-cover shadow-lg"
            />
            <span className="font-black text-sm text-white tracking-widest hidden sm:inline">
              ARBNEXUS
            </span>
          </div>
        )}
      </motion.div>

      {/* Center Body: Headline, Subtitle, Interactive Card */}
      <motion.div
        style={{
          transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
          transition: 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
        className="my-auto max-w-2xl sm:max-w-3xl space-y-6"
      >
        {/* Title Lockup */}
        <div className="space-y-2">
          {section.overlayType === 'hero' && (
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                CRYPTO ARBITRAGE INTELLIGENCE
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                ZERO-FLOAT ENGINE
              </span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            {section.title}
          </h1>

          {section.highlightTitle && (
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-400 bg-clip-text text-transparent">
              {section.highlightTitle}
            </h2>
          )}
        </div>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-zinc-300 leading-relaxed font-sans max-w-xl backdrop-blur-[2px]">
          {section.subtitle}
        </p>

        {/* Section-Specific Dynamic Overlay Elements */}
        <div className="pointer-events-auto pt-2">
          {section.overlayType === 'scanner' && <OpportunityMiniCard />}
          {section.overlayType === 'cross-exchange' && (
            <OpportunityMiniCard
              pair="ETH/USDT"
              buyVenue="Binance Spot"
              buyPrice="$3,120.40"
              sellVenue="Bybit Spot"
              sellPrice="$3,136.20"
              netSpread="+50.6 bps"
              netProfit="+$1,580.00"
              size="$300,000"
              confidence={96}
            />
          )}
          {section.overlayType === 'triangular' && <RouteVisualization type="triangular" />}
          {section.overlayType === 'cross-chain' && <RouteVisualization type="cross-chain" />}
          {section.overlayType === 'liquidity' && <LiquidityDepthCurve />}
        </div>

        {/* CTA Buttons */}
        {(section.primaryCta || section.secondaryCta) && (
          <div className="flex flex-wrap items-center gap-3 pt-4 pointer-events-auto">
            {section.primaryCta && (
              <button
                onClick={() => onNavigateView && onNavigateView(section.primaryCta!.targetView)}
                className="px-6 py-3 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-black flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>{section.primaryCta.label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {section.secondaryCta && (
              <button
                onClick={() => onNavigateView && onNavigateView(section.secondaryCta!.targetView)}
                className="px-5 py-3 rounded-xl font-mono text-xs font-semibold bg-black/50 hover:bg-black/70 border border-cyan-800/60 hover:border-cyan-400 text-zinc-200 hover:text-white backdrop-blur-md transition-all cursor-pointer"
              >
                {section.secondaryCta.label}
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Bottom Footer: Financial Metrics & Scroll Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        className="pb-8 sm:pb-4 space-y-4"
      >
        {section.metrics && section.metrics.length > 0 && (
          <div className="pointer-events-auto">
            <MetricOverlay metrics={section.metrics} />
          </div>
        )}

        {section.overlayType === 'hero' && (
          <div className="pt-2 flex justify-center pointer-events-auto">
            <ScrollIndicator onClick={onScrollNext} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
