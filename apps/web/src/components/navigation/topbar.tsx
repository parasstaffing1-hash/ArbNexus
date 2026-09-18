'use client';

import * as React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Search, Fuel, Box, RefreshCw, Menu, Activity, Layers, Sparkles } from 'lucide-react';
import { Button, cn } from '@arbitrage/ui';
import { useArbitrageStore } from '../../stores/arbitrage.store';

interface TopbarProps {
  show3DBackground: boolean;
  onToggle3DBackground: () => void;
  isScanning: boolean;
  onToggleScanning: () => void;
  onRefreshData?: () => void;
  onToggleMobileSidebar?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeView?: string;
  onSelectView?: (view: any) => void;
  className?: string;
}

export function Topbar({
  show3DBackground,
  onToggle3DBackground,
  isScanning,
  onToggleScanning,
  onRefreshData,
  onToggleMobileSidebar,
  searchQuery,
  onSearchChange,
  activeView,
  onSelectView,
  className,
}: TopbarProps) {
  const { dataMode, setDataMode, latency } = useArbitrageStore();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshData) onRefreshData();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header
      className={cn(
        'h-16 px-4 md:px-6 flex items-center justify-between gap-3 select-none border-b',
        'bg-[#071423]/80 backdrop-blur-xl border-cyan-900/25 z-20',
        className,
      )}
    >
      {/* Left side: Mobile Menu + Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            aria-label="Toggle mobile menu"
            className="p-2 md:hidden rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <img
            src="/logo.png"
            alt="ArbNexus"
            className="w-6 h-6 rounded-md object-cover border border-cyan-400/40"
          />
          <span className="font-black text-xs text-white tracking-wider">
            Arb
            <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
              Nexus
            </span>
          </span>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search tokens, pairs (ETH/USDT), venues..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              'w-full pl-9 pr-12 py-1.5 rounded-lg text-xs font-mono',
              'bg-[#0a1b2e]/90 text-zinc-200 placeholder:text-zinc-500',
              'border border-cyan-900/40 focus:border-cyan-400/60 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 transition-all',
            )}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-zinc-400 bg-white/5 rounded border border-zinc-700/50">
              /
            </kbd>
          </div>
        </div>
      </div>

      {/* Middle: Live Gas Ticker & Latency */}
      <div className="hidden lg:flex items-center gap-4 px-3 py-1.5 rounded-xl bg-black/30 border border-cyan-900/30 font-mono text-xs">
        {/* Latency metric */}
        <div className="flex items-center gap-1 text-[11px] text-zinc-300">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-zinc-500">LATENCY:</span>
          <span className="text-cyan-300 font-semibold">{latency.totalLatencyMs}ms</span>
          <span className="text-[9px] text-zinc-500">
            ({latency.sourceLatencyMs}+{latency.pipelineLatencyMs}ms)
          </span>
        </div>
        <span className="text-zinc-600">|</span>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Fuel className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px]">GAS:</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
            ETH <span className="text-white font-semibold">15 Gwei</span>
          </span>
          <span className="text-zinc-600">|</span>
          <span className="flex items-center gap-1 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
            ARB <span className="text-white font-semibold">0.1 Gwei</span>
          </span>
          <span className="text-zinc-600">|</span>
          <span className="flex items-center gap-1 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
            SOL <span className="text-white font-semibold">2,840 TPS</span>
          </span>
        </div>
      </div>

      {/* Right side: Controls & Wallet */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mode Selector Badges */}
        <div className="flex items-center rounded-lg bg-black/40 p-0.5 border border-cyan-900/30 font-mono text-[10px]">
          {(['LIVE', 'DEMO', 'REPLAY', 'BACKTEST'] as const).map((mode) => {
            const isActive = dataMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setDataMode(mode)}
                className={cn(
                  'px-2 py-1 rounded transition-all flex items-center gap-1 font-bold',
                  isActive
                    ? mode === 'LIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : mode === 'DEMO'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : mode === 'REPLAY'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-zinc-500 hover:text-zinc-300',
                )}
              >
                {isActive && (
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full inline-block',
                      mode === 'LIVE' ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400',
                    )}
                  />
                )}
                {mode}
              </button>
            );
          })}
        </div>

        {/* Keynote Story Toggle Button */}
        {onSelectView && (
          <button
            onClick={() => onSelectView(activeView === 'story' ? 'dashboard' : 'story')}
            title={
              activeView === 'story'
                ? 'Switch to Live Data Terminal'
                : 'Experience 10-Part Cinematic Keynote Story'
            }
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border',
              activeView === 'story'
                ? 'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border-cyan-400/50 text-cyan-200 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                : 'bg-black/30 border-cyan-900/30 text-zinc-300 hover:text-white hover:border-cyan-500/40',
            )}
          >
            <Sparkles
              className={cn(
                'w-3.5 h-3.5',
                activeView === 'story' ? 'text-cyan-400 animate-spin' : 'text-cyan-400',
              )}
              style={activeView === 'story' ? { animationDuration: '6s' } : undefined}
            />
            <span className="hidden sm:inline font-bold text-[11px]">
              {activeView === 'story' ? 'LIVE TERMINAL' : 'KEYNOTE'}
            </span>
          </button>
        )}

        {/* Scanner State Button */}
        <button
          onClick={onToggleScanning}
          title={
            isScanning ? 'Scanner Active - Click to Pause' : 'Scanner Paused - Click to Resume'
          }
          className={cn(
            'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border',
            isScanning
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800',
          )}
        >
          <Activity
            className={cn(
              'w-3.5 h-3.5',
              isScanning ? 'animate-pulse text-emerald-400' : 'text-zinc-500',
            )}
          />
          <span className="font-semibold text-[11px]">{isScanning ? 'STREAMING' : 'PAUSED'}</span>
        </button>

        {/* 3D Background Toggle Button */}
        <button
          onClick={onToggle3DBackground}
          title={
            show3DBackground ? 'Disable 3D Background (Performance Mode)' : 'Enable 3D Background'
          }
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border',
            show3DBackground
              ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 shadow-[0_0_10px_rgba(0,242,254,0.15)]'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white',
          )}
        >
          <Box className={cn('w-3.5 h-3.5', show3DBackground && 'text-cyan-400')} />
          <span className="hidden md:inline text-[11px] font-medium">
            3D {show3DBackground ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          title="Force poll feeds"
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 border border-cyan-900/20 transition-all"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin text-cyan-400')} />
        </button>

        {/* RainbowKit Wallet Connect */}
        <div className="scale-90 sm:scale-100 origin-right">
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </div>
    </header>
  );
}
