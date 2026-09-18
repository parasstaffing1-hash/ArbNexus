'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ScanLine,
  Percent,
  GitBranch,
  Fuel,
  Building2,
  BellRing,
  BarChart3,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calculator,
  Wallet,
  History,
  Sparkles,
} from 'lucide-react';
import { cn } from '@arbitrage/ui';

export type NavView =
  | 'dashboard'
  | 'scanner'
  | 'calculators'
  | 'funding'
  | 'cross-chain'
  | 'paper-trading'
  | 'backtesting'
  | 'onchain-mev'
  | 'gas'
  | 'exchanges'
  | 'alerts'
  | 'analytics'
  | 'research'
  | 'settings'
  | 'story';

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

interface NavItem {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'story', label: 'Keynote Story', icon: Sparkles, badge: '10 MP4' },
  { id: 'scanner', label: 'Live Scanner', icon: ScanLine, badge: 'LIVE' },
  { id: 'research', label: 'Quant Research', icon: BarChart3, badge: 'NEW' },
  { id: 'calculators', label: 'Calculators', icon: Calculator, badge: '100+' },
  { id: 'funding', label: 'Funding Rates', icon: Percent },
  { id: 'cross-chain', label: 'Cross-Chain', icon: GitBranch },
  { id: 'paper-trading', label: 'Paper Trading', icon: Wallet, badge: 'DEMO' },
  { id: 'backtesting', label: 'Backtesting', icon: History, badge: 'REPLAY' },
  { id: 'onchain-mev', label: 'On-Chain MEV', icon: Sparkles, badge: 'EVM/SVM' },
  { id: 'gas', label: 'Gas Tracker', icon: Fuel },
  { id: 'exchanges', label: 'Exchanges', icon: Building2 },
  { id: 'alerts', label: 'Alert Rules', icon: BellRing },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Sliders },
];

export function Sidebar({
  activeView,
  onSelectView,
  collapsed,
  onToggleCollapse,
  className,
}: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={cn(
        'relative flex flex-col h-screen z-30 select-none border-r',
        'bg-[#071423]/90 backdrop-blur-xl border-cyan-900/30 text-zinc-300',
        className,
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-cyan-900/20 justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#071423] border border-cyan-400/40 shadow-[0_0_15px_rgba(0,242,254,0.3)] shrink-0 overflow-hidden">
            <img src="/logo.png" alt="ArbNexus Logo" className="w-full h-full object-cover" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#071423]" />
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-wider text-white">
                    Arb
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">
                      Nexus
                    </span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    PRO
                  </span>
                </div>
                <span className="text-[9px] tracking-wider text-zinc-400 font-medium">
                  INTELLIGENCE PLATFORM
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav Items List */}
      <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-800">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={cn(
                'group relative flex items-center w-full rounded-xl transition-all duration-200',
                collapsed ? 'justify-center h-12 px-0' : 'h-11 px-3 gap-3',
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 via-cyan-500/5 to-transparent text-white border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(0,242,254,0.08)]'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border-l-2 border-transparent',
              )}
            >
              <div
                className={cn(
                  'relative flex items-center justify-center transition-colors',
                  isActive ? 'text-cyan-300' : 'text-zinc-400 group-hover:text-cyan-400',
                )}
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                {isActive && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute -inset-1 rounded-full bg-cyan-400/20 blur-sm pointer-events-none"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
              </div>

              {!collapsed && (
                <div className="flex items-center justify-between flex-1 overflow-hidden">
                  <span
                    className={cn(
                      'text-xs font-medium tracking-wide truncate',
                      isActive ? 'text-white font-semibold' : 'text-zinc-300',
                    )}
                  >
                    {item.label}
                  </span>

                  {item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="p-2 border-t border-cyan-900/20 flex justify-center">
          <button
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* System Status Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-cyan-900/20 bg-black/20 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px] text-zinc-300 font-medium">SYSTEM HEALTH</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">100%</span>
          </div>

          <div className="space-y-1 font-mono text-[10px] text-zinc-400">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Latency:</span>
              <span className="text-cyan-300">18ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">WS Streams:</span>
              <span className="text-white">10 Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Engine:</span>
              <span className="text-amber-400 font-semibold">v1.0.0-CORE</span>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
