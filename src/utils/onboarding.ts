import { UserStorage } from './user-storage';

// Utility functions for onboarding checks
export const hasCompletedOnboarding = (userId: string | null): boolean => {
  const completed = UserStorage.getItem(userId, 'onboardingCompleted');
  const onboardingData = UserStorage.getItem(userId, 'onboarding');
  
  // Check if both onboarding completion flag and data exist
  return completed === 'true' && onboardingData !== null;
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