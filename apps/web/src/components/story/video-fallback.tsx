'use client';

import * as React from 'react';
import { ShieldAlert } from 'lucide-react';

interface VideoFallbackProps {
  sectionTitle?: string;
  errorMessage?: string;
  className?: string;
}

export function VideoFallback({ sectionTitle, errorMessage, className = '' }: VideoFallbackProps) {
  return (
    <div
      className={`relative w-full h-full min-h-screen flex items-center justify-center bg-[#071423] overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Ambient background glow layers */}
      <div className="absolute inset-0 bg-radial-gradient from-cyan-950/40 via-[#0a1829]/90 to-[#050d18] pointer-events-none" />

      {/* Cybernetic decorative grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 242, 254, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 242, 254, 0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating orbital aura */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-500/10 via-fuchsia-500/5 to-transparent blur-3xl animate-pulse pointer-events-none" />

      {/* Subtle fallback watermark */}
      <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-md opacity-40">
        <ShieldAlert className="w-8 h-8 text-cyan-400 mb-2" />
        <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
          Atmospheric Fallback Active
        </span>
        {sectionTitle && (
          <span className="font-sans text-xs text-zinc-500 mt-1">{sectionTitle}</span>
        )}
      </div>
    </div>
  );
}
