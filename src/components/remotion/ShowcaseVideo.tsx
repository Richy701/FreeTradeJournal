import React from 'react';
import { Sequence, useCurrentFrame, interpolate } from 'remotion';
import DashboardScene from './scenes/DashboardScene';
import TradeTrackingScene from './scenes/TradeTrackingScene';
import AnalyticsScene from './scenes/AnalyticsScene';
import JournalScene from './scenes/JournalScene';
import GoalsScene from './scenes/GoalsScene';
import ClosingScene from './scenes/ClosingScene';
import { SCENE_COUNT, SCENE_DURATION, DASHBOARD_DURATION } from './shared/animations';

export interface ShowcaseVideoProps {
  backgroundColor?: string;
  foregroundColor?: string;
  primaryColor?: string;
  mutedColor?: string;
  isMobile?: boolean;
}

const ProgressDots: React.FC<{ primaryColor: string; mutedColor: string }> = ({
  primaryColor,
  mutedColor,
}) => {
  const frame = useCurrentFrame();
  // frame is relative to this Sequence (starts at 0 when scenes begin)
  const activeIndex = Math.min(Math.floor(frame / SCENE_DURATION), SCENE_COUNT - 1);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 10,
        zIndex: 10,
      }}
    >
      {Array.from({ length: SCENE_COUNT }).map((_, i) => {
        const isActive = i === activeIndex;
        const dotWidth = isActive ? 24 : 8;

        return (
          <div
            key={i}
            style={{
              width: dotWidth,
              height: 8,
              borderRadius: 4,
              backgroundColor: isActive ? primaryColor : `${mutedColor}40`,
              transition: 'width 0.3s, background-color 0.3s',
            }}
          />
        );
      })}
    </div>
  );
};

const ShowcaseVideoComposition: React.FC<ShowcaseVideoProps> = (props) => {
  const { backgroundColor = '#030303', primaryColor = '#f59e0b', mutedColor = '#a1a1aa' } = props;
  const totalDuration = DASHBOARD_DURATION + SCENE_COUNT * SCENE_DURATION;
  const s = DASHBOARD_DURATION; // offset for scene starts

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Dashboard screenshot — first 3 seconds */}
      <Sequence from={0} durationInFrames={DASHBOARD_DURATION}>
        <DashboardScene backgroundColor={backgroundColor} />
      </Sequence>

      {/* Solid background behind all scenes to prevent bleed-through */}
      <Sequence from={s} durationInFrames={SCENE_COUNT * SCENE_DURATION}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor }} />
      </Sequence>

      <Sequence from={s} durationInFrames={SCENE_DURATION}>
        <TradeTrackingScene {...props} />
      </Sequence>
      <Sequence from={s + SCENE_DURATION} durationInFrames={SCENE_DURATION}>
        <AnalyticsScene {...props} />
      </Sequence>
      <Sequence from={s + SCENE_DURATION * 2} durationInFrames={SCENE_DURATION}>
        <JournalScene {...props} />
      </Sequence>
      <Sequence from={s + SCENE_DURATION * 3} durationInFrames={SCENE_DURATION}>
        <GoalsScene {...props} />
      </Sequence>
      <Sequence from={s + SCENE_DURATION * 4} durationInFrames={SCENE_DURATION}>
        <ClosingScene {...props} />
      </Sequence>

      {/* Progress dots — only during scenes, not during dashboard */}
      <Sequence from={s} durationInFrames={SCENE_COUNT * SCENE_DURATION}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <ProgressDots primaryColor={primaryColor} mutedColor={mutedColor} />
        </div>
      </Sequence>
    </div>
  );
};

export default ShowcaseVideoComposition;
