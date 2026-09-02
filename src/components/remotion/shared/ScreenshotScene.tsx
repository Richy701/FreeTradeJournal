import React from 'react';
import { Img, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { sceneOpacity, staggeredOpacity, staggeredTranslateY, iconScale } from './animations';

interface ScreenshotSceneProps {
  src: string;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  backgroundColor?: string;
  foregroundColor?: string;
  mutedColor?: string;
}

/**
 * Feature scene built on a real product screenshot: slow Ken Burns zoom over
 * the capture with a bottom scrim carrying the icon + title + subtitle.
 */
const ScreenshotScene: React.FC<ScreenshotSceneProps> = ({
  src,
  title,
  subtitle,
  icon,
  backgroundColor = '#030303',
  foregroundColor = '#ffffff',
  mutedColor = '#a1a1aa',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = sceneOpacity(frame);
  const zoom = interpolate(frame, [0, 150], [1.04, 1.16], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor,
        position: 'relative',
        overflow: 'hidden',
        opacity,
      }}
    >
      <Img
        src={src}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${zoom})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(3,3,3,0.92) 0%, rgba(3,3,3,0.45) 30%, rgba(3,3,3,0) 55%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 36,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 40px',
        }}
      >
        {icon && (
          <div
            style={{
              opacity: staggeredOpacity(frame, fps, 0),
              transform: `scale(${iconScale(frame, fps)})`,
            }}
          >
            {icon}
          </div>
        )}
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: foregroundColor,
            margin: 0,
            marginTop: icon ? 16 : 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            opacity: staggeredOpacity(frame, fps, 1),
            transform: `translateY(${staggeredTranslateY(frame, fps, 1)}px)`,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: 16,
            color: mutedColor,
            marginTop: 10,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            opacity: staggeredOpacity(frame, fps, 2),
            transform: `translateY(${staggeredTranslateY(frame, fps, 2)}px)`,
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default ScreenshotScene;
