'use client';

import * as React from 'react';
import { STORY_SECTIONS } from './story-config';

interface SectionNavigatorProps {
  activeSectionIndex: number;
  onSelectSection: (index: number) => void;
  className?: string;
}

export function SectionNavigator({
  activeSectionIndex,
  onSelectSection,
  className = '',
}: SectionNavigatorProps) {
  return (
    <aside
      aria-label="Story section navigation"
      className={`fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-2 pointer-events-auto ${className}`}
    >
      {STORY_SECTIONS.map((sec) => {
        const isActive = activeSectionIndex === sec.index;
        const paddedNum = String(sec.index).padStart(2, '0');

        return (
          <button
            key={sec.id}
            onClick={() => onSelectSection(sec.index)}
            aria-label={`Scroll to section ${paddedNum}: ${sec.title}`}
            className="group flex items-center gap-2.5 py-1 px-1.5 focus:outline-none"
          >
            {/* Hover title preview */}
            <span
              className={`text-[10px] font-mono tracking-wider transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                isActive ? 'text-cyan-300 font-bold' : 'text-zinc-400'
              }`}
            >
              {sec.title}
            </span>

            {/* Numeric Badge & Indicator */}
            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded transition-all duration-300 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,242,254,0.4)] scale-110'
                  : 'bg-black/30 text-zinc-500 border border-white/5 group-hover:text-zinc-300 group-hover:border-cyan-800/40'
              }`}
            >
              {paddedNum}
            </span>

            {/* Vertical connector line segment */}
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-cyan-400 scale-125 shadow-[0_0_6px_rgba(0,242,254,1)]'
                  : 'bg-zinc-700/60 group-hover:bg-zinc-500'
              }`}
            />
          </button>
        );
      })}
    </aside>
  );
}
