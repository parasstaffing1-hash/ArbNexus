'use client';

import * as React from 'react';
import { VideoFallback } from './video-fallback';

interface VideoBackgroundProps {
  src: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  sectionTitle?: string;
  isPriority?: boolean; // True for Hero (Video 1)
  isNearViewport?: boolean; // Lazy-loading trigger from IntersectionObserver
  reducedMotion?: boolean;
  className?: string;
}

export function VideoBackground({
  src,
  videoRef,
  sectionTitle,
  isPriority = false,
  isNearViewport = true,
  reducedMotion = false,
  className = '',
}: VideoBackgroundProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // When approaching viewport or if priority, ensure source is loaded
  const shouldLoad = isPriority || isNearViewport;

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onCanPlay = () => {
      setIsLoaded(true);
      if (reducedMotion) {
        // If reduced motion is requested, play softly in background without scrubbing
        video.play().catch(() => {});
      }
    };

    const onError = (e: Event) => {
      console.warn(`[ArbNexus VideoEngine] Video load error on: ${src}`, e);
      setHasError(true);
    };

    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
    };
  }, [videoRef, src, reducedMotion]);

  if (hasError) {
    return <VideoFallback sectionTitle={sectionTitle} className={className} />;
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Underlying Video Element */}
      {shouldLoad && (
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          loop={reducedMotion}
          autoPlay={reducedMotion}
          preload={isPriority ? 'auto' : 'metadata'}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            willChange: 'transform, opacity',
            filter: 'contrast(1.05) saturate(1.1)',
          }}
        />
      )}

      {/* Cinematic Vignette Overlay — Darkens edges while keeping center vivid */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#071423] via-transparent to-[#071423]/70 pointer-events-none" />

      {/* Content Radial Shadow — Enhances text readability without obscuring video animation */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#071423]/40 to-[#071423]/80 pointer-events-none" />

      {/* Subtle brand tint glow */}
      <div className="absolute inset-0 bg-cyan-950/15 mix-blend-overlay pointer-events-none" />
    </div>
  );
}
