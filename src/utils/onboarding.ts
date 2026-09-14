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
// Only records representing user activity count; storage keys may be seeded
// before setup has begun. Keep customized legacy default accounts valid.
export function hasExistingOnboardingData(userId: string | null): boolean {
  if (!userId) return false;
  const records = (key: string): Record<string, unknown>[] => {
    try {
      const value: unknown = JSON.parse(UserStorage.getItem(userId, key) || '[]');
      return Array.isArray(value) ? value.filter(item => item && typeof item === 'object' && typeof item.id === 'string' && item.id.length > 0) : [];
    } catch { return []; }
  };
  if (records('trades').length || records('journalEntries').length) return true;
  return records('accounts').some(account => !(
    String(account.id).startsWith('default-') && account.name === 'Main Account' &&
    account.type === 'demo' && account.broker === 'Demo Broker' && account.currency === 'USD' &&
    account.balance === undefined && account.initialBalance === undefined && !account.brokerTimezone
  ));
}
