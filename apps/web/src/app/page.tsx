'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeBackground } from '../components/three/three-background';
import { Sidebar, NavView } from '../components/navigation/sidebar';
import { Topbar } from '../components/navigation/topbar';
import { DashboardView } from '../components/views/dashboard-view';
import { ScannerView } from '../components/views/scanner-view';
import { OpportunityDrawer } from '../components/views/opportunity-drawer';
import { FundingHeatmapView } from '../components/views/funding-heatmap-view';
import { CrossChainView } from '../components/views/cross-chain-view';
import { GasTrackerView } from '../components/views/gas-tracker-view';
import { ExchangesView } from '../components/views/exchanges-view';
import { AlertsView } from '../components/views/alerts-view';
import { AnalyticsView } from '../components/views/analytics-view';
import { SettingsView } from '../components/views/settings-view';
import { CalculatorsHubView } from '../components/views/calculators-hub-view';
import { PaperTradingView } from '../components/views/paper-trading-view';
import { BacktestingView } from '../components/views/backtesting-view';
import { OnChainMEVView } from '../components/views/onchain-mev-view';
import { ResearchWorkspaceView } from '../components/views/research-workspace-view';
import { StoryExperience } from '../components/story/story-experience';
import { LiveOpportunity } from '../lib/mock-data';

export default function TerminalPage() {
  const [activeView, setActiveView] = React.useState<NavView>('dashboard');
  const [collapsedSidebar, setCollapsedSidebar] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [show3D, setShow3D] = React.useState(true);
  const [isScanning, setIsScanning] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedOpportunity, setSelectedOpportunity] = React.useState<LiveOpportunity | null>(
    null,
  );

  // Sync initial view from URL query if present (e.g. /?view=story or /?view=scanner)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const requestedView = params.get('view') as NavView | null;
      if (requestedView) {
        setActiveView(requestedView);
      }
    }
  }, []);

  // Close mobile sidebar on navigate
  const handleSelectView = (view: NavView) => {
    setActiveView(view);
    setMobileSidebarOpen(false);
  };

  // If in Keynote Story Mode, render the full immersive 10-video scroll experience
  if (activeView === 'story') {
    return (
      <StoryExperience
        onEnterTerminal={(view) => {
          setActiveView((view as NavView) || 'dashboard');
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-[#071423] text-zinc-100 flex overflow-hidden font-sans">
      {/* Three.js Interactive 3D Background */}
      <ThreeBackground
        enabled={show3D}
        className="fixed inset-0 pointer-events-none z-0 opacity-60"
      />

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Desktop & Mobile Navigation Sidebar */}
      <div
        className={`fixed md:relative z-40 h-full transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar
          activeView={activeView}
          onSelectView={handleSelectView}
          collapsed={collapsedSidebar}
          onToggleCollapse={() => setCollapsedSidebar(!collapsedSidebar)}
        />
      </div>

      {/* Main Terminal Shell Area */}
      <div className="relative z-10 flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <Topbar
          show3DBackground={show3D}
          onToggle3DBackground={() => setShow3D(!show3D)}
          isScanning={isScanning}
          onToggleScanning={() => setIsScanning(!isScanning)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeView={activeView}
          onSelectView={handleSelectView}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onRefreshData={() => {
            // Data refresh action
          }}
        />

        {/* Scrollable View Canvas */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-7xl w-full mx-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === 'dashboard' && (
                <DashboardView
                  onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                  onNavigateToScanner={() => setActiveView('scanner')}
                  onNavigateToFunding={() => setActiveView('funding')}
                />
              )}

              {activeView === 'scanner' && (
                <ScannerView
                  onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                  externalSearch={searchQuery}
                />
              )}

              {activeView === 'research' && <ResearchWorkspaceView />}

              {activeView === 'calculators' && <CalculatorsHubView />}

              {activeView === 'funding' && <FundingHeatmapView />}

              {activeView === 'cross-chain' && <CrossChainView />}

              {activeView === 'paper-trading' && <PaperTradingView />}

              {activeView === 'backtesting' && <BacktestingView />}

              {activeView === 'onchain-mev' && <OnChainMEVView />}

              {activeView === 'gas' && <GasTrackerView />}

              {activeView === 'exchanges' && <ExchangesView />}

              {activeView === 'alerts' && <AlertsView />}

              {activeView === 'analytics' && <AnalyticsView />}

              {activeView === 'settings' && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Slide-over Opportunity Detail Drawer */}
      <OpportunityDrawer
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
      />
    </div>
  );
}
