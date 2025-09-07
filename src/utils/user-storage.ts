/**
 * User-scoped localStorage utilities
 * Ensures each user's data is completely isolated
 */

export class UserStorage {
  private static getScopedKey(userId: string | null, key: string): string {
    if (!userId) {
      // Fallback for non-authenticated users (demo mode, etc.)
      return `guest_${key}`;
    }
    return `user_${userId}_${key}`;
  }

  /**
   * Get user-scoped data from localStorage
   */
  static getItem(userId: string | null, key: string): string | null {
    const scopedKey = this.getScopedKey(userId, key);
    return localStorage.getItem(scopedKey);
  }

  /**
   * Set user-scoped data in localStorage
   */
  static setItem(userId: string | null, key: string, value: string): void {
    const scopedKey = this.getScopedKey(userId, key);
    localStorage.setItem(scopedKey, value);
  }

  /**
   * Remove user-scoped data from localStorage
   */
  static removeItem(userId: string | null, key: string): void {
    const scopedKey = this.getScopedKey(userId, key);
    localStorage.removeItem(scopedKey);
  }

  /**
   * Clear all data for a specific user
   */
  static clearUserData(userId: string): void {
    const prefix = `user_${userId}_`;
    const keysToRemove: string[] = [];
    
    // Find all keys for this user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all user data
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Migrate existing unscoped data to user-scoped data
   * Call this once when user logs in to preserve existing data
   */
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
        // Move to user-scoped key
        this.setItem(userId, key, existingData);
        // Remove old unscoped key
        localStorage.removeItem(key);
        // Migrated data for user
      }
    });
  }

  /**
   * Check if user has any existing data (for migration purposes)
   */
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

  /**
   * Get all user data keys (for debugging/admin purposes)
   */
  static getUserDataKeys(userId: string): string[] {
    const prefix = `user_${userId}_`;
    const userKeys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        // Return the original key without the user prefix
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

export function useUserStorage() {
  const { user } = useAuth();
  const userId = user?.uid || null;

  return {
    getItem: (key: string) => UserStorage.getItem(userId, key),
    setItem: (key: string, value: string) => UserStorage.setItem(userId, key, value),
    removeItem: (key: string) => UserStorage.removeItem(userId, key),
    clearUserData: () => userId && UserStorage.clearUserData(userId),
    migrateUserData: () => userId && UserStorage.migrateUserData(userId),
    hasUserData: () => userId && UserStorage.hasUserData(userId),
    getUserDataKeys: () => userId ? UserStorage.getUserDataKeys(userId) : [],
  };
}