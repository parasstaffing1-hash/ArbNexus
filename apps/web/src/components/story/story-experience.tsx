'use client';

import * as React from 'react';
import { ArrowRight, ChevronLeft, Sparkles, Terminal, Activity } from 'lucide-react';
import { STORY_SECTIONS } from './story-config';
import { ScrollVideoSection } from './scroll-video-section';
import { ScrollProgressBar } from './scroll-progress-bar';
import { SectionNavigator } from './section-navigator';
import { VideoDebugPanel } from './video-debug-panel';

interface StoryExperienceProps {
  onEnterTerminal: (targetView?: string) => void;
  className?: string;
}

export function StoryExperience({ onEnterTerminal, className = '' }: StoryExperienceProps) {
  const [activeSectionIndex, setActiveSectionIndex] = React.useState(1);

  // Smooth scroll to a target section index
  const handleScrollToSection = (index: number) => {
    const el = document.getElementById(`story-section-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveSectionIndex(index);
    }
  };

  const currentSection =
    STORY_SECTIONS.find((s) => s.index === activeSectionIndex) || STORY_SECTIONS[0];

  return (
    <div
      className={`relative w-full min-h-screen bg-[#071423] text-zinc-100 overflow-x-hidden select-none font-sans ${className}`}
    >
      {/* Top Thin Progress Line */}
      <ScrollProgressBar
        totalSections={STORY_SECTIONS.length}
        activeSectionIndex={activeSectionIndex}
      />

      {/* Floating Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 px-4 sm:px-8 flex items-center justify-between bg-gradient-to-b from-[#071423]/90 via-[#071423]/50 to-transparent backdrop-blur-[4px] pointer-events-auto">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="ArbNexus Logo"
            className="w-8 h-8 rounded-lg border border-cyan-400/40 object-cover shadow-lg"
          />
          <div className="flex flex-col">
            <span className="font-black text-sm text-white tracking-wider flex items-center gap-1">
              Arb
              <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                Nexus
              </span>
              <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                KEYNOTE
              </span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
              10-PART PRODUCT STORY
            </span>
          </div>
        </div>

        {/* Action: Enter Live Terminal */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onEnterTerminal('dashboard')}
            className="px-4 py-2 rounded-xl font-mono text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 hover:text-white flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,254,0.2)] transition-all cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>ENTER LIVE TERMINAL</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Side Section Navigator (01 - 10) */}
      <SectionNavigator
        activeSectionIndex={activeSectionIndex}
        onSelectSection={handleScrollToSection}
      />

      {/* 10 Sequentially Scrubbed Video Sections */}
      <main className="relative z-10">
        {STORY_SECTIONS.map((section) => (
          <ScrollVideoSection
            key={section.id}
            section={section}
            isActive={activeSectionIndex === section.index}
            onNavigateView={(view) => onEnterTerminal(view)}
            onScrollNext={() => handleScrollToSection(section.index + 1)}
            onSectionInView={(idx) => setActiveSectionIndex(idx)}
          />
        ))}
      </main>

      {/* Developer HUD Overlay (Dev mode only) */}
      <VideoDebugPanel
        activeSectionIndex={activeSectionIndex}
        currentVideoSrc={currentSection.video}
        duration={0}
        currentTime={0}
        scrollProgress={activeSectionIndex / STORY_SECTIONS.length}
        isLoaded={true}
        hasError={false}
      />
    </div>
  );
}
