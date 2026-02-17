import React from 'react';
import { useCurrentFrame } from 'remotion';
import { sceneOpacity } from './animations';

interface SceneContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

const SceneContainer: React.FC<SceneContainerProps> = ({
  children,
  backgroundColor = '#0a0a0a',
}) => {
  const frame = useCurrentFrame();

  const opacity = sceneOpacity(frame);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SceneContainer;
