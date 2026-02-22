import { interpolate, spring, type SpringConfig } from 'remotion';

const SPRING_CONFIG: SpringConfig = {
  damping: 20,
  stiffness: 80,
  mass: 0.5,
  overshootClamping: false,
};

const BOUNCE_SPRING: SpringConfig = {
  damping: 12,
  stiffness: 100,
  mass: 0.6,
  overshootClamping: false,
};

/** Staggered fade-in opacity for element at given index (0=icon, 1=title, 2=subtitle) */
export function staggeredOpacity(frame: number, fps: number, index: number): number {
  const delay = index * 6; // 6 frames (~200ms) stagger between each element
  const fadeInVal = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIG,
  });
  // Fade out: all elements fade together at frames 65-90
  const fadeOutVal = interpolate(frame, [65, 90], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return Math.min(fadeInVal, fadeOutVal);
}

/** Staggered slide-up for element at given index */
export function staggeredTranslateY(frame: number, fps: number, index: number): number {
  const delay = index * 6;
  const progress = spring({
    frame: frame - delay,
    fps,
    config: SPRING_CONFIG,
  });
  return interpolate(progress, [0, 1], [24, 0]);
}

/** Spring scale with overshoot for icons — bounces to ~1.1 then settles at 1 */
export function iconScale(frame: number, fps: number): number {
  const progress = spring({
    frame,
    fps,
    config: BOUNCE_SPRING,
  });
  // Overshoot: map 0-1 spring (which naturally overshoots with low damping) to scale
  return interpolate(progress, [0, 1], [0, 1]);
}

/** Overall scene fade (used by SceneContainer for the background/glow) */
export function sceneOpacity(frame: number): number {
  const fadeInVal = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOutVal = interpolate(frame, [65, 90], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return Math.min(fadeInVal, fadeOutVal);
}

export const SCENE_COUNT = 5;
export const SCENE_DURATION = 90;
export const DASHBOARD_DURATION = 90; // 3s dashboard screenshot scene
export const TOTAL_DURATION = DASHBOARD_DURATION + SCENE_COUNT * SCENE_DURATION; // 690 frames
