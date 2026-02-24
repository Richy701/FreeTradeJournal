import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { LineChart } from 'lucide-react';
import SceneContainer from '../shared/SceneContainer';
import { staggeredOpacity, staggeredTranslateY, iconScale } from '../shared/animations';

interface AnalyticsSceneProps {
  backgroundColor?: string;
  foregroundColor?: string;
  primaryColor?: string;
  mutedColor?: string;
  isMobile?: boolean;
}

const AnalyticsScene: React.FC<AnalyticsSceneProps> = ({
  backgroundColor,
  foregroundColor = '#ffffff',
  primaryColor = '#f59e0b',
  mutedColor = '#a1a1aa',
  isMobile,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleSize = 32;
  const subtitleSize = 16;

  return (
    <SceneContainer backgroundColor={backgroundColor}>
      <div
        style={{
          opacity: staggeredOpacity(frame, fps, 0),
          transform: `scale(${iconScale(frame, fps)})`,
        }}
      >
        <LineChart
          size={64}
          color={primaryColor}
          strokeWidth={1.5}
        />
      </div>
      <div
        style={{
          opacity: staggeredOpacity(frame, fps, 1),
          transform: `translateY(${staggeredTranslateY(frame, fps, 1)}px)`,
        }}
      >
        <h2
          style={{
            fontSize: titleSize,
            fontWeight: 700,
            color: foregroundColor,
            margin: 0,
            marginTop: 24,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Spot Patterns Fast
        </h2>
      </div>
      <div
        style={{
          opacity: staggeredOpacity(frame, fps, 2),
          transform: `translateY(${staggeredTranslateY(frame, fps, 2)}px)`,
        }}
      >
        <p
          style={{
            fontSize: subtitleSize,
            color: mutedColor,
            marginTop: 12,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Heatmaps, equity curves, and win rate breakdowns at a glance
        </p>
      </div>
    </SceneContainer>
  );
};

export default AnalyticsScene;
