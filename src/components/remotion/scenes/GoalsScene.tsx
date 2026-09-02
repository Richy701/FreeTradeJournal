import React from 'react';
import { Gauge } from '@phosphor-icons/react';
import ScreenshotScene from '../shared/ScreenshotScene';

interface GoalsSceneProps {
  backgroundColor?: string;
  foregroundColor?: string;
  primaryColor?: string;
  mutedColor?: string;
  isMobile?: boolean;
}

const GoalsScene: React.FC<GoalsSceneProps> = ({
  backgroundColor,
  foregroundColor = '#ffffff',
  primaryColor = '#f59e0b',
  mutedColor = '#a1a1aa',
}) => (
  <ScreenshotScene
    src="/images/screenshots/goals-risk-management-screenshot.webp"
    title="Stay Disciplined"
    subtitle="Set goals, manage risk, and maintain consistency"
    icon={<Gauge size={48} color={primaryColor} strokeWidth={1.5} />}
    backgroundColor={backgroundColor}
    foregroundColor={foregroundColor}
    mutedColor={mutedColor}
  />
);

export default GoalsScene;
