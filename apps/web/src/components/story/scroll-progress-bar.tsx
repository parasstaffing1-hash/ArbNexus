'use client';

import * as React from 'react';

interface ScrollProgressBarProps {
  totalSections?: number;
  activeSectionIndex?: number;
  className?: string;
}

export function ScrollProgressBar({
  totalSections = 10,
  activeSectionIndex = 1,
  className = '',
}: ScrollProgressBarProps) {
  const [scrollPercentage, setScrollPercentage] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollPercentage(Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const paddedIndex = String(activeSectionIndex).padStart(2, '0');
  const paddedTotal = String(totalSections).padStart(2, '0');

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* Top progress bar line */}
      <div className="w-full h-[2px] bg-black/40 backdrop-blur-sm">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 shadow-[0_0_8px_rgba(0,242,254,0.8)] transition-all duration-150 ease-out"
          style={{ width: `${scrollPercentage}%` }}
        />
      </div>

      {/* Floating minimal counter */}
      <div className="absolute top-3 right-6 px-3 py-1 rounded-full bg-black/60 border border-cyan-900/40 backdrop-blur-md font-mono text-[11px] text-zinc-300 flex items-center gap-1.5 shadow-xl">
        <span className="text-cyan-400 font-bold">{paddedIndex}</span>
        <span className="text-zinc-600">/</span>
        <span className="text-zinc-500">{paddedTotal}</span>
      </div>
    </div>
  );
}
