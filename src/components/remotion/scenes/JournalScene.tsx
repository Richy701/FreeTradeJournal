import React from 'react';
import { BookOpen } from '@phosphor-icons/react';
import ScreenshotScene from '../shared/ScreenshotScene';

interface JournalSceneProps {
  backgroundColor?: string;
  foregroundColor?: string;
  primaryColor?: string;
  mutedColor?: string;
  isMobile?: boolean;
}

const JournalScene: React.FC<JournalSceneProps> = ({
  backgroundColor,
  foregroundColor = '#ffffff',
  primaryColor = '#f59e0b',
  mutedColor = '#a1a1aa',
}) => (
  <ScreenshotScene
    src="/images/screenshots/trading-journal-screenshot.webp"
    title="Journal Your Journey"
    subtitle="Document strategies, track mindset, and learn from every trade"
    icon={<BookOpen size={48} color={primaryColor} strokeWidth={1.5} />}
    backgroundColor={backgroundColor}
    foregroundColor={foregroundColor}
    mutedColor={mutedColor}
  />
);

export default JournalScene;
