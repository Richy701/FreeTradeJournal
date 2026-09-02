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

  // Slow push-in so the still capture reads as footage
  const zoom = interpolate(frame, [0, 90], [1.02, 1.1], {
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
        src="/images/screenshots/trading-dashboard-screenshot.webp"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${zoom})`,
        }}
      />
    </div>
  );
};

export default DashboardScene;
