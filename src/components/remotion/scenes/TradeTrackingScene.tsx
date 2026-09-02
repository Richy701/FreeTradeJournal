import React from 'react';
import { ChartLineUp } from '@phosphor-icons/react';
import ScreenshotScene from '../shared/ScreenshotScene';

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
}) => (
  <ScreenshotScene
    src="/images/screenshots/trading-log-screenshot.webp"
    title="Track Every Trade"
    subtitle="Log entries, exits, and performance across all your markets"
    icon={<ChartLineUp size={48} color={primaryColor} strokeWidth={1.5} />}
    backgroundColor={backgroundColor}
    foregroundColor={foregroundColor}
    mutedColor={mutedColor}
  />
);

export default TradeTrackingScene;
