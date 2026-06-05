import { UserStorage } from './user-storage';

export type ExperienceLevel = 'beginner' | 'developing' | 'experienced' | 'veteran';

export const hasCompletedOnboarding = (userId: string | null): boolean => {
  const completed = UserStorage.getItem(userId, 'onboardingCompleted');
  return completed === 'true';
};

export const getOnboardingRedirect = (userId: string | null): string => {
  return hasCompletedOnboarding(userId) ? '/dashboard' : '/onboarding';
};

export const getExperienceLevel = (userId: string | null): ExperienceLevel | null => {
  const raw = UserStorage.getItem(userId, 'onboarding');
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return data.experienceLevel || null;
  } catch {
    return null;
  }
};

export const clearOnboardingData = (userId: string | null): void => {
  UserStorage.removeItem(userId, 'onboardingCompleted');
  UserStorage.removeItem(userId, 'onboarding');
  UserStorage.removeItem(userId, 'trades');
  UserStorage.removeItem(userId, 'settings');
};