import React from 'react';
import { Img, useCurrentFrame, interpolate } from 'remotion';

interface DashboardSceneProps {
  backgroundColor?: string;
}

const DashboardScene: React.FC<DashboardSceneProps> = ({
  backgroundColor = '#030303',
}) => {
  const frame = useCurrentFrame();

  // Fade in at start, fade out at end
  const opacity = interpolate(frame, [0, 15, 70, 90], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
      }}
    >
      <Img
        src="/images/landing/trading-dashboard-screenshot.png"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
};

export default DashboardScene;
