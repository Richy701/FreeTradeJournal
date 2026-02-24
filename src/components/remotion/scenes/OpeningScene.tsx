import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import SceneContainer from '../shared/SceneContainer';
import { staggeredOpacity, staggeredTranslateY } from '../shared/animations';

interface OpeningSceneProps {
  backgroundColor?: string;
  foregroundColor?: string;
  primaryColor?: string;
  mutedColor?: string;
  isMobile?: boolean;
}

const OpeningScene: React.FC<OpeningSceneProps> = ({
  backgroundColor,
  foregroundColor = '#ffffff',
  primaryColor,
  mutedColor = '#a1a1aa',
  isMobile,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleSize = 40;
  const subtitleSize = 18;

  return (
    <SceneContainer backgroundColor={backgroundColor}>
      <div
        style={{
          opacity: staggeredOpacity(frame, fps, 0),
          transform: `translateY(${staggeredTranslateY(frame, fps, 0)}px)`,
        }}
      >
        <h1
          style={{
            fontSize: titleSize,
            fontWeight: 700,
            color: foregroundColor,
            margin: 0,
            lineHeight: 1.2,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          FreeTradeJournal
        </h1>
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
          Your complete trading companion
        </p>
      </div>
    </SceneContainer>
  );
};

export default OpeningScene;
