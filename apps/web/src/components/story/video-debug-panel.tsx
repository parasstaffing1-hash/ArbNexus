'use client';

import * as React from 'react';
import { Terminal, X } from 'lucide-react';

interface VideoDebugPanelProps {
  activeSectionIndex: number;
  currentVideoSrc: string;
  duration: number;
  currentTime: number;
  scrollProgress: number;
  isLoaded: boolean;
  hasError: boolean;
}

export function VideoDebugPanel({
  activeSectionIndex,
  currentVideoSrc,
  duration,
  currentTime,
  scrollProgress,
  isLoaded,
  hasError,
}: VideoDebugPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [fps, setFps] = React.useState(60);

  // Measure rough client RAF FPS
  React.useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Keyboard shortcut Ctrl+Shift+D or Alt+D
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') ||
        (e.altKey && e.key.toLowerCase() === 'd')
      ) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 font-mono select-none">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg bg-black/70 border border-cyan-900/50 text-cyan-400 hover:text-white hover:bg-black/90 text-[10px] flex items-center gap-1.5 shadow-xl transition-all"
          title="Toggle Video Engine Debug HUD (Ctrl+Shift+D)"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>DEBUG HUD</span>
        </button>
      ) : (
        <div className="p-4 rounded-xl bg-black/90 border border-cyan-500/50 backdrop-blur-xl shadow-2xl text-xs text-zinc-200 w-80">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-cyan-900/60 text-cyan-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>VIDEO ENGINE HUD</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-zinc-400 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Active Section:</span>
              <span className="text-white font-bold">#{activeSectionIndex}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Video Asset:</span>
              <span className="text-cyan-300 truncate max-w-[150px]">{currentVideoSrc}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Duration:</span>
              <span>{duration.toFixed(2)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Current Time:</span>
              <span className="text-emerald-400 font-semibold">{currentTime.toFixed(2)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Section Progress:</span>
              <span className="text-cyan-400 font-bold">{(scrollProgress * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Loaded / State:</span>
              <span
                className={
                  isLoaded ? 'text-emerald-400' : hasError ? 'text-rose-400' : 'text-amber-400'
                }
              >
                {hasError ? 'ERROR (FALLBACK)' : isLoaded ? 'READY' : 'FETCHING'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Client Render FPS:</span>
              <span className={fps >= 50 ? 'text-emerald-400' : 'text-amber-400'}>{fps} FPS</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-cyan-950/60 text-[10px] text-zinc-500">
            Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-zinc-300">Ctrl+Shift+D</kbd>{' '}
            to toggle
          </div>
        </div>
      )}
    </div>
  );
}
