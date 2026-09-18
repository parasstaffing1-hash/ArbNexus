'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';

interface ScrollIndicatorProps {
  onClick?: () => void;
  className?: string;
}

export function ScrollIndicator({ onClick, className = '' }: ScrollIndicatorProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 cursor-pointer text-zinc-400 hover:text-cyan-300 transition-colors ${className}`}
      aria-label="Scroll to next section"
    >
      <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 group-hover:text-cyan-400 transition-colors">
        Scroll to Explore
      </span>
      <div className="w-5 h-8 rounded-full border border-zinc-600/60 group-hover:border-cyan-400/60 flex items-start justify-center p-1 transition-colors">
        <div className="w-1 h-2 rounded-full bg-cyan-400 animate-bounce" />
      </div>
      <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 -mt-1 animate-pulse" />
    </button>
  );
}
