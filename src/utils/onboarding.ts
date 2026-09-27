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
// The untouched placeholder that account-context seeds for a brand-new user
// before onboarding has run. Anything the user customized no longer matches.
export function isSeedAccount(account: Record<string, unknown>): boolean {
  return String(account.id).startsWith('default-') && account.name === 'Main Account' &&
    account.type === 'demo' && account.broker === 'Demo Broker' && account.currency === 'USD' &&
    account.balance === undefined && account.initialBalance === undefined && !account.brokerTimezone;
}

function storedRecords(userId: string, key: string): Record<string, unknown>[] {
  try {
    const value: unknown = JSON.parse(UserStorage.getItem(userId, key) || '[]');
    return Array.isArray(value) ? value.filter(item => item && typeof item === 'object' && typeof item.id === 'string' && item.id.length > 0) : [];
  } catch { return []; }
}

// True when the user has logged anything (trades or journal entries) on this device.
export function hasStoredRecords(userId: string | null): boolean {
  if (!userId) return false;
  return storedRecords(userId, 'trades').length > 0 || storedRecords(userId, 'journalEntries').length > 0;
}

// Only records representing user activity count; storage keys may be seeded
// before setup has begun. Keep customized legacy default accounts valid.
export function hasExistingOnboardingData(userId: string | null): boolean {
  if (!userId) return false;
  if (hasStoredRecords(userId)) return true;
  return storedRecords(userId, 'accounts').some(account => !isSeedAccount(account));
}
