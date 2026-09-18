'use client';

import * as React from 'react';
import { StorySectionConfig } from './story-config';
import { VideoBackground } from './video-background';
import { SectionContent } from './section-content';
import { useVideoScrubber } from './use-video-scrubber';

interface ScrollVideoSectionProps {
  section: StorySectionConfig;
  isActive: boolean;
  onNavigateView?: (view: string) => void;
  onScrollNext?: () => void;
  onSectionInView?: (index: number) => void;
  className?: string;
}

export function ScrollVideoSection({
  section,
  isActive,
  onNavigateView,
  onScrollNext,
  onSectionInView,
  className = '',
}: ScrollVideoSectionProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isNearViewport, setIsNearViewport] = React.useState(section.index === 1);

  // Lazy loading observer: loads video metadata when user approaches within 400px
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsNearViewport(true);
            if (onSectionInView && entry.intersectionRatio > 0.4) {
              onSectionInView(section.index);
            }
          }
        });
      },
      {
        rootMargin: '400px 0px 400px 0px',
        threshold: [0.1, 0.4, 0.8],
      },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [section.index, onSectionInView]);

  // Hook connecting scroll position to video.currentTime via requestAnimationFrame
  const scrubberState = useVideoScrubber({
    videoRef,
    containerRef,
    enabled: isNearViewport,
  });

  return (
    <section
      ref={containerRef}
      id={`story-section-${section.index}`}
      data-section-index={section.index}
      className={`relative w-full min-h-[125vh] bg-[#071423] ${className}`}
    >
      {/* Sticky 100vh Full-Viewport Video Shell */}
      <div className="sticky top-0 h-screen w-full overflow-hidden z-0">
        <VideoBackground
          src={section.video}
          videoRef={videoRef}
          sectionTitle={section.title}
          isPriority={section.index === 1}
          isNearViewport={isNearViewport}
          reducedMotion={scrubberState.reducedMotion}
        />
      </div>

      {/* Floating Foreground Content Layer */}
      <div className="relative z-10 -mt-[100vh] w-full min-h-screen flex flex-col justify-center pointer-events-none">
        <SectionContent
          section={section}
          onNavigateView={onNavigateView}
          onScrollNext={onScrollNext}
        />
      </div>
    </section>
  );
}
