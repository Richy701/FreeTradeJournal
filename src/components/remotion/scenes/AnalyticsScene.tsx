import React from 'react';
import { ChartLineUp } from '@phosphor-icons/react';
import ScreenshotScene from '../shared/ScreenshotScene';

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
}) => (
  <ScreenshotScene
    src="/images/screenshots/trade-insights-screenshot.webp"
    title="Spot Patterns Fast"
    subtitle="Heatmaps, equity curves, and win rate breakdowns at a glance"
    icon={<ChartLineUp size={48} color={primaryColor} strokeWidth={1.5} />}
    backgroundColor={backgroundColor}
    foregroundColor={foregroundColor}
    mutedColor={mutedColor}
  />
);

export default AnalyticsScene;
