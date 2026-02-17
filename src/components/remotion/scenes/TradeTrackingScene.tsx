import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { CandlestickChart } from 'lucide-react';
import SceneContainer from '../shared/SceneContainer';
import { staggeredOpacity, staggeredTranslateY, iconScale } from '../shared/animations';

interface TradeTrackingSceneProps {
  backgroundColor?: string;
  foregroundColor?: string;
  primaryColor?: string;
  mutedColor?: string;
  isMobile?: boolean;
}

const TradeTrackingScene: React.FC<TradeTrackingSceneProps> = ({
  backgroundColor,
  foregroundColor = '#ffffff',
  primaryColor = '#f59e0b',
  mutedColor = '#a1a1aa',
  isMobile,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleSize = isMobile ? 24 : 32;
  const subtitleSize = isMobile ? 14 : 16;

  return (
    <SceneContainer backgroundColor={backgroundColor}>
      <div
        style={{
          opacity: staggeredOpacity(frame, fps, 0),
          transform: `scale(${iconScale(frame, fps)})`,
        }}
      >
        <CandlestickChart
          size={isMobile ? 48 : 64}
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
          Track Every Trade
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
          Log entries, exits, and performance across all your markets
        </p>
      </div>
    </SceneContainer>
  );
};

export default TradeTrackingScene;
