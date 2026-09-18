'use client';

import * as React from 'react';

export interface VideoScrubberState {
  currentTime: number;
  duration: number;
  progress: number;
  isLoaded: boolean;
  hasError: boolean;
  isPlaying: boolean;
  reducedMotion: boolean;
}

interface UseVideoScrubberOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
}

export function useVideoScrubber({
  videoRef,
  containerRef,
  enabled = true,
}: UseVideoScrubberOptions): VideoScrubberState {
  const [state, setState] = React.useState<VideoScrubberState>({
    currentTime: 0,
    duration: 0,
    progress: 0,
    isLoaded: false,
    hasError: false,
    isPlaying: false,
    reducedMotion: false,
  });

  const lastTimeRef = React.useRef<number>(-1);
  const rafIdRef = React.useRef<number | null>(null);

  // Check prefers-reduced-motion
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      setState((prev) => ({ ...prev, reducedMotion: mediaQuery.matches }));
    };
    updateMotion();
    mediaQuery.addEventListener('change', updateMotion);
    return () => mediaQuery.removeEventListener('change', updateMotion);
  }, []);

  // Sync scroll to video currentTime
  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleScroll = () => {
      if (rafIdRef.current) return;

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const container = containerRef.current;
        const video = videoRef.current;

        if (!container || !video || !video.duration || isNaN(video.duration)) {
          return;
        }

        if (state.reducedMotion) {
          // If reduced motion is requested, do not scroll scrub
          return;
        }

        const rect = container.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Progress calculation:
        // 0 when top of container reaches top of viewport
        // 1 when bottom of container minus 1 screen height reaches top of viewport
        const scrollableDistance = rect.height - windowHeight;
        if (scrollableDistance <= 0) return;

        const distanceScrolled = -rect.top;
        const rawProgress = distanceScrolled / scrollableDistance;
        const clampedProgress = Math.max(0, Math.min(1, rawProgress));

        const targetTime = clampedProgress * video.duration;

        // Skip update if change is below 33ms (approx 1 frame at 30fps)
        if (Math.abs(targetTime - lastTimeRef.current) > 0.033) {
          lastTimeRef.current = targetTime;
          // Set directly on the DOM element without triggering React re-renders
          if (!video.seeking && isFinite(targetTime)) {
            try {
              video.currentTime = targetTime;
            } catch {
              // Ignore browser seeking interruptions
            }
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial position check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [containerRef, videoRef, enabled, state.reducedMotion]);

  // Handle video element events
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setState((prev) => ({
        ...prev,
        duration: video.duration || 0,
        isLoaded: true,
      }));
    };

    const handleError = () => {
      setState((prev) => ({
        ...prev,
        hasError: true,
        isLoaded: false,
      }));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };
  }, [videoRef]);

  return state;
}
