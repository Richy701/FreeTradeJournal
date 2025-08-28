// Utility functions for onboarding checks
export const hasCompletedOnboarding = (): boolean => {
  const completed = localStorage.getItem('onboardingCompleted');
  const onboardingData = localStorage.getItem('onboarding');
  
  // Check if both onboarding completion flag and data exist
  return completed === 'true' && onboardingData !== null;
};

export const getOnboardingRedirect = (): string => {
  return hasCompletedOnboarding() ? '/dashboard' : '/onboarding';
};

export const clearOnboardingData = (): void => {
  localStorage.removeItem('onboardingCompleted');
  localStorage.removeItem('onboarding');
  localStorage.removeItem('trades');
  localStorage.removeItem('settings');
};