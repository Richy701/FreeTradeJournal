import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import SceneContainer from '../shared/SceneContainer';
import { staggeredOpacity, staggeredTranslateY } from '../shared/animations';

interface ClosingSceneProps {
  backgroundColor?: string;
  primaryColor?: string;
  mutedColor?: string;
  isMobile?: boolean;
}

const ClosingScene: React.FC<ClosingSceneProps> = ({
  backgroundColor,
  primaryColor = '#f59e0b',
  mutedColor = '#a1a1aa',
  isMobile,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleSize = isMobile ? 28 : 40;
  const subtitleSize = isMobile ? 14 : 18;

  return (
    <SceneContainer backgroundColor={backgroundColor}>
      <div
        style={{
          opacity: staggeredOpacity(frame, fps, 0),
          transform: `translateY(${staggeredTranslateY(frame, fps, 0)}px)`,
        }}
      >
        <h2
          style={{
            fontSize: titleSize,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.2,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: `linear-gradient(135deg, ${primaryColor}, #fbbf24, ${primaryColor})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          100% Free, Forever
        </h2>
      </div>
      <div
        style={{
          opacity: staggeredOpacity(frame, fps, 1),
          transform: `translateY(${staggeredTranslateY(frame, fps, 1)}px)`,
        }}
      >
        <p
          style={{
            fontSize: subtitleSize,
            color: mutedColor,
            marginTop: 16,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          No credit card required. Start trading smarter today.
        </p>
      </div>
    </SceneContainer>
  );
};

export default ClosingScene;
