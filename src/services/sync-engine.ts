import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase-lazy';
import { UserStorage } from '@/utils/user-storage';
import type { Firestore, Unsubscribe } from 'firebase/firestore';

// Keys we sync between localStorage and Firestore
const SYNC_KEYS = ['trades', 'journalEntries', 'goals', 'accounts', 'riskRules', 'onboardingCompleted', 'onboarding'] as const;
type SyncKey = typeof SYNC_KEYS[number];

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

type ChangeListener = (key: string) => void;

export class SyncEngine {
  private uid: string;
  private db: Firestore | null = null;
  private unsubscribers: Unsubscribe[] = [];
  private listeners: Set<ChangeListener> = new Set();
  private _status: SyncStatus = 'idle';
  private _lastSyncTime: number | null = null;
  private statusListeners: Set<() => void> = new Set();
  private writingKeys = new Set<string>();
  private writeTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private retryCount = 0;
  private maxRetries = 3;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(uid: string) {
    this.uid = uid;
  }

  get status() { return this._status; }
  get lastSyncTime() { return this._lastSyncTime; }

  onStatusChange(cb: () => void) {
    this.statusListeners.add(cb);
    return () => { this.statusListeners.delete(cb); };
  }

  private setStatus(s: SyncStatus) {
    this._status = s;
    this.statusListeners.forEach(cb => cb());
  }

  onChange(cb: ChangeListener) {
    this.listeners.add(cb);
    return () => { this.listeners.delete(cb); };
  }

  private notifyChange(key: string) {
    this.listeners.forEach(cb => cb(key));
  }

  /** Start Cloud Function polling (bypasses content blockers) */
  async enable() {
    try {
      this.setStatus('syncing');
      this.retryCount = 0;

      // Initial migration: push localStorage data to Firestore via Cloud Function
      const auth = await getFirebaseAuth();
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const getSyncDataFn = httpsCallable(functions, 'getSyncData');

      // First, get remote data
      const result = await getSyncDataFn({}) as { data: { data: Record<string, string> } };
      const remoteData = result.data.data;

      // For each key, push local data if remote is empty
      for (const key of SYNC_KEYS) {
        const localData = UserStorage.getItem(this.uid, key);
        const remoteValue = remoteData[key];

        if (localData && !remoteValue) {
          // Local has data but remote doesn't - push to remote
          await this.syncKey(key, localData);
        } else if (remoteValue && remoteValue !== localData) {
          // Remote has different data - pull to local (safety checks apply)
          const remoteIsEmpty = remoteValue === '[]' || remoteValue === '{}' || remoteValue === '';
          const localHasData = localData && localData !== '[]' && localData !== '{}' && localData !== '';

          if (remoteIsEmpty && localHasData) {
            console.warn(`[Sync] Skipping empty remote overwrite for ${key}`);
            continue;
          }

          // Update local data
          const scopedKey = `user_${this.uid}_${key}`;
          localStorage.setItem(scopedKey, remoteValue);
          this.notifyChange(key);
          console.log(`[Sync] Pulled ${key} from remote`);
        }
      }

      // Start polling for changes every 10 seconds
      this.pollTimer = setInterval(() => {
        this.poll();
      }, 10000);

      this._lastSyncTime = Date.now();
      this.setStatus('synced');
      console.log('[Sync] ✅ Cloud Function polling enabled (content blocker bypass active)');
    } catch (err) {
      console.error('SyncEngine enable failed:', err);
      this.setStatus('error');

      // Retry with exponential backoff (1s, 2s, 4s)
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount - 1) * 1000;
        console.log(`Retrying sync in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
        this.retryTimer = setTimeout(() => {
          this.enable();
        }, delay);
      } else {
        console.warn('Sync failed after max retries. Please check your internet connection.');
      }
    }
  }

  /** Poll for remote changes via Cloud Function */
  private async poll() {
    if (this._status === 'syncing') return; // Skip if already syncing

    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const getSyncDataFn = httpsCallable(functions, 'getSyncData');

      const result = await getSyncDataFn({}) as { data: { data: Record<string, string> } };
      const remoteData = result.data.data;

      for (const key of SYNC_KEYS) {
        // Skip keys we're currently writing
        if (this.writingKeys.has(key)) continue;

        const remoteValue = remoteData[key];
        if (!remoteValue) continue;

        const localData = UserStorage.getItem(this.uid, key);
        if (localData !== remoteValue) {
          // Remote has changed - update local
          const remoteIsEmpty = remoteValue === '[]' || remoteValue === '{}' || remoteValue === '';
          const localHasData = localData && localData !== '[]' && localData !== '{}' && localData !== '';

          if (remoteIsEmpty && localHasData) {
            console.warn(`[Sync] Skipping empty remote overwrite for ${key}`);
            continue;
          }

          const scopedKey = `user_${this.uid}_${key}`;
          localStorage.setItem(scopedKey, remoteValue);
          this.notifyChange(key);
          console.log(`[Sync] Pulled ${key} from remote (poll)`);
        }
      }

      this._lastSyncTime = Date.now();
      if (this._status !== 'synced') {
        this.setStatus('synced');
      }
    } catch (err) {
      console.warn('[Sync] Poll failed:', err);
      // Don't change status to error on poll failure, just log it
    }
  }

  /** Push a key to Firestore via Cloud Function (bypasses content blockers) */
  async syncKey(key: string, data: string) {
    if (!SYNC_KEYS.includes(key as SyncKey)) return;

    // CRITICAL: Never sync empty arrays - this prevents data loss
    // Empty arrays from fresh onboarding should NOT overwrite real data in Firestore
    const isEmpty = data === '[]' || data === '{}' || data === '' || data === 'null';
    if (isEmpty && (key === 'trades' || key === 'accounts' || key === 'journalEntries' || key === 'goals')) {
      console.warn(`[Sync] Blocked empty ${key} from syncing to prevent data loss`);
      return;
    }

    try {
      this.writingKeys.add(key);
      // Clear any previous timer for this key
      const prev = this.writeTimers.get(key);
      if (prev) clearTimeout(prev);

      this.setStatus('syncing');

      // Use Cloud Function instead of direct Firestore (bypasses content blockers)
      const auth = await getFirebaseAuth();
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const syncDataFn = httpsCallable(functions, 'syncData');

      await syncDataFn({ key, value: data });

      this._lastSyncTime = Date.now();
      this.setStatus('synced');
      console.log(`[Sync] Synced ${key} via Cloud Function`);
    } catch (err) {
      console.warn(`Sync write failed for ${key}:`, err);
      this.setStatus('error');
    } finally {
      // Small delay before re-enabling snapshot processing for this key to avoid echo
      const timer = setTimeout(() => { this.writingKeys.delete(key); }, 500);
      this.writeTimers.set(key, timer);
    }
  }

  /** Stop all listeners and clean up */
  disable() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.listeners.clear();
    // Clear all pending write timers
    this.writeTimers.forEach(timer => clearTimeout(timer));
    this.writeTimers.clear();
    this.writingKeys.clear();
    // Clear retry timer
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    // Clear poll timer
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.retryCount = 0;
    this.db = null;
    // Notify status listeners before clearing them
    this.setStatus('idle');
    this.statusListeners.clear();
  }
}
