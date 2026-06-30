// User-scoped localStorage with transparent encryption for logged-in users
import { deriveEncryptionKey, encrypt, decrypt, isEncrypted, isCryptoAvailable } from '@/utils/crypto';

// Module-level sync reference (set by SyncProvider, avoids circular deps)
let syncRef: { syncKey: (key: string, data: string) => void } | null = null;

export function setSyncRef(ref: typeof syncRef) {
  syncRef = ref;
}

// Marks that this device has a deliberate local `settings` edit that has NOT
// been confirmed-synced to the cloud yet. `settings` is a single
// last-write-wins blob whose push is blocked until the initial pull finishes,
// so without this a change made before the pull (or refreshed before the async
// push lands) is silently dropped and then overwritten by stale remote.
//
// Persisted in raw localStorage (never synced) so it survives a refresh: the
// sync engine keeps the local edit authoritative and re-flushes it until the
// push is CONFIRMED, then clears the flag so normal cross-device pulls resume.
// Scoped by uid and per-browser, i.e. "this device has an unconfirmed edit."
const SETTINGS_DIRTY_PREFIX = 'ftj_settings_dirty_';

export function markSettingsDirty(uid: string | null) {
  if (!uid) return;
  try { localStorage.setItem(SETTINGS_DIRTY_PREFIX + uid, '1'); } catch { /* ignore */ }
}

export function clearSettingsDirty(uid: string | null) {
  if (!uid) return;
  try { localStorage.removeItem(SETTINGS_DIRTY_PREFIX + uid); } catch { /* ignore */ }
}

export function isSettingsDirty(uid: string | null): boolean {
  if (!uid) return false;
  try { return localStorage.getItem(SETTINGS_DIRTY_PREFIX + uid) === '1'; } catch { return false; }
}

export class UserStorage {
  private static cache = new Map<string, string>();
  private static encryptionKeys = new Map<string, CryptoKey>();
  private static readyUsers = new Set<string>();

  static async initEncryption(userId: string): Promise<void> {
    if (!isCryptoAvailable()) return;
    const key = await deriveEncryptionKey(userId);
    this.encryptionKeys.set(userId, key);
    const prefix = `user_${userId}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const scopedKey = localStorage.key(i);
      if (!scopedKey || !scopedKey.startsWith(prefix)) continue;
      const raw = localStorage.getItem(scopedKey);
      if (raw === null) continue;
      if (isEncrypted(raw)) {
        try {
          const plaintext = await decrypt(raw, key);
          this.cache.set(scopedKey, plaintext);
        } catch {
          this.cache.set(scopedKey, raw);
        }
      } else {
        this.cache.set(scopedKey, raw);
        encrypt(raw, key)
          .then(encrypted => localStorage.setItem(scopedKey, encrypted))
          .catch(() => {});
      }
    }
    this.readyUsers.add(userId);
  }

  static isReady(userId: string): boolean {
    return this.readyUsers.has(userId);
  }

  private static getScopedKey(userId: string | null, key: string): string {
    if (!userId) {
      return `guest_${key}`;
    }
    return `user_${userId}_${key}`;
  }

  static getItem(userId: string | null, key: string): string | null {
    const scopedKey = this.getScopedKey(userId, key);
    if (this.cache.has(scopedKey)) {
      return this.cache.get(scopedKey)!;
    }
    return localStorage.getItem(scopedKey);
  }

  // Returns a promise that resolves once the value has actually been written to
  // localStorage and rejects if the write fails (e.g. QuotaExceededError). The
  // in-memory cache is updated synchronously so reads are immediately consistent,
  // but callers that need to know the write durably landed (before navigating or
  // refreshing) should await this. Fire-and-forget callers can ignore the promise.
  static async setItem(userId: string | null, key: string, value: string, skipSync = false): Promise<void> {
    const scopedKey = this.getScopedKey(userId, key);
    const cryptoKey = userId ? this.encryptionKeys.get(userId) : undefined;
    let toWrite = value;
    if (cryptoKey && isCryptoAvailable()) {
      this.cache.set(scopedKey, value);
      try {
        toWrite = await encrypt(value, cryptoKey);
      } catch {
        // Encryption failed — fall back to writing plaintext.
        toWrite = value;
      }
    }
    // Let storage-quota and other write errors propagate so awaiting callers can
    // surface them instead of silently dropping data.
    localStorage.setItem(scopedKey, toWrite);
    // Never push the demo sandbox to the cloud — it's a throwaway fake user.
    if (syncRef && userId && userId !== 'demo-user' && !skipSync) {
      syncRef.syncKey(key, value);
    }
  }

  static removeItem(userId: string | null, key: string): void {
    const scopedKey = this.getScopedKey(userId, key);
    this.cache.delete(scopedKey);
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

    keysToRemove.forEach(key => {
      this.cache.delete(key);
      localStorage.removeItem(key);
    });
    this.encryptionKeys.delete(userId);
    this.readyUsers.delete(userId);
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
