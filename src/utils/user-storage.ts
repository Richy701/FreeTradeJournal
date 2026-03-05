/**
 * User-scoped localStorage utilities
 * Ensures each user's data is completely isolated
 */

// Module-level sync reference (set by SyncProvider, avoids circular deps)
let syncRef: { syncKey: (key: string, data: string) => void } | null = null;

export function setSyncRef(ref: typeof syncRef) {
  syncRef = ref;
}

export class UserStorage {
  private static getScopedKey(userId: string | null, key: string): string {
    if (!userId) {
      return `guest_${key}`;
    }
    return `user_${userId}_${key}`;
  }

  static getItem(userId: string | null, key: string): string | null {
    const scopedKey = this.getScopedKey(userId, key);
    return localStorage.getItem(scopedKey);
  }

  static setItem(userId: string | null, key: string, value: string): void {
    const scopedKey = this.getScopedKey(userId, key);
    localStorage.setItem(scopedKey, value);
    // Fire-and-forget sync to Firestore for logged-in users
    if (syncRef && userId) {
      syncRef.syncKey(key, value);
    }
  }

  static removeItem(userId: string | null, key: string): void {
    const scopedKey = this.getScopedKey(userId, key);
    localStorage.removeItem(scopedKey);
  }

  static clearUserData(userId: string): void {
    const prefix = `user_${userId}_`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  static migrateUserData(userId: string): void {
    const keysToMigrate = [
      'trades',
      'journalEntries',
      'goals',
      'onboardingCompleted',
      'userPreferences',
      'accounts'
    ];

    keysToMigrate.forEach(key => {
      const existingData = localStorage.getItem(key);
      if (existingData) {
        this.setItem(userId, key, existingData);
        localStorage.removeItem(key);
      }
    });
  }

  static hasUserData(userId: string): boolean {
    const prefix = `user_${userId}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        return true;
      }
    }
    return false;
  }

  static getUserDataKeys(userId: string): string[] {
    const prefix = `user_${userId}_`;
    const userKeys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        userKeys.push(key.replace(prefix, ''));
      }
    }

    return userKeys;
  }
}

/**
 * Hook to use user-scoped localStorage with current user context
 */
import { useAuth } from '@/contexts/auth-context';
import { useMemo } from 'react';

export function useUserStorage() {
  const { user } = useAuth();
  const userId = user?.uid || null;

  return useMemo(() => ({
    getItem: (key: string) => UserStorage.getItem(userId, key),
    setItem: (key: string, value: string) => UserStorage.setItem(userId, key, value),
    removeItem: (key: string) => UserStorage.removeItem(userId, key),
    clearUserData: () => userId && UserStorage.clearUserData(userId),
    migrateUserData: () => userId && UserStorage.migrateUserData(userId),
    hasUserData: () => userId && UserStorage.hasUserData(userId),
    getUserDataKeys: () => userId ? UserStorage.getUserDataKeys(userId) : [],
  }), [userId]);
}
