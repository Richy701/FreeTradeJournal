import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import ShowcaseVideoComposition, { type ShowcaseVideoProps } from './ShowcaseVideo';
import { useIsMobile } from '@/hooks/use-mobile';

const FPS = 30;
const DURATION_IN_FRAMES = 540; // 18 seconds (3s dashboard + 5x3s scenes)
const COMP_WIDTH = 1280;
const COMP_HEIGHT = 720;

function getThemeColors(): Omit<ShowcaseVideoProps, 'isMobile'> {
  const style = getComputedStyle(document.documentElement);
  const isDark = document.documentElement.classList.contains('dark');

  const getCSSVar = (name: string): string => {
    const raw = style.getPropertyValue(name).trim();
    if (!raw) return '';
    return `hsl(${raw})`;
  };

  return {
    backgroundColor: getCSSVar('--background') || (isDark ? '#030303' : '#f1f3f5'),
    foregroundColor: getCSSVar('--foreground') || (isDark ? '#e1e7ef' : '#09090b'),
    primaryColor: '#f59e0b',
    mutedColor: getCSSVar('--muted-foreground') || (isDark ? '#a1a1aa' : '#71717a'),
  };
}

const ShowcasePlayer: React.FC = () => {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [themeColors, setThemeColors] = useState<Omit<ShowcaseVideoProps, 'isMobile'>>(
    () => {
      if (typeof window === 'undefined') {
        return {
          backgroundColor: '#0a0a0a',
          foregroundColor: '#fafaf9',
          primaryColor: '#f59e0b',
          mutedColor: '#a1a1aa',
        };
      }
      return getThemeColors();
    }
  );

  const updateColors = useCallback(() => {
    setThemeColors(getThemeColors());
  }, []);

  useEffect(() => {
    updateColors();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          updateColors();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [updateColors]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const player = playerRef.current;
        if (!player) return;

        if (entry.isIntersecting) {
          player.play();
        } else {
          player.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const inputProps: ShowcaseVideoProps = {
    ...themeColors,
    isMobile,
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    >
      <Player
        ref={playerRef}
        component={ShowcaseVideoComposition}
        inputProps={inputProps}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        compositionWidth={COMP_WIDTH}
        compositionHeight={COMP_HEIGHT}
        style={{ width: '100%', height: '100%' }}
        autoPlay={false}
        loop
        controls={false}
        numberOfSharedAudioTags={0}
      />
    </div>
  );
};

export default ShowcasePlayer;
