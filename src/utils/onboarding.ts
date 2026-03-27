import { UserStorage } from './user-storage';

// Utility functions for onboarding checks
export const hasCompletedOnboarding = (userId: string | null): boolean => {
  const completed = UserStorage.getItem(userId, 'onboardingCompleted');
  return completed === 'true';
};

export const getOnboardingRedirect = (userId: string | null): string => {
  return hasCompletedOnboarding(userId) ? '/dashboard' : '/onboarding';
};

export const clearOnboardingData = (userId: string | null): void => {
  UserStorage.removeItem(userId, 'onboardingCompleted');
  UserStorage.removeItem(userId, 'onboarding');
  UserStorage.removeItem(userId, 'trades');
  UserStorage.removeItem(userId, 'settings');
};