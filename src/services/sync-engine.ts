import { getFirebaseFirestore } from '@/lib/firebase-lazy';
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

  /** Start Firestore listeners and initial migration */
  async enable() {
    try {
      this.setStatus('syncing');
      this.retryCount = 0; // Reset retry count on fresh enable
      this.db = await getFirebaseFirestore();
      const { doc, getDoc, setDoc, onSnapshot, serverTimestamp } = await import('firebase/firestore');

      // Initial migration: push localStorage data to Firestore only if remote is empty
      for (const key of SYNC_KEYS) {
        const localData = UserStorage.getItem(this.uid, key);
        if (localData) {
          const docRef = doc(this.db, 'users', this.uid, 'sync', key);
          try {
            const existing = await getDoc(docRef);
            if (!existing.exists() || !existing.data()?.data) {
              await setDoc(docRef, {
                data: localData,
                updatedAt: serverTimestamp(),
              });
            }
          } catch (err) {
            console.warn(`Sync migration failed for ${key}:`, err);
          }
        }
      }

      // Set up snapshot listeners
      for (const key of SYNC_KEYS) {
        const docRef = doc(this.db, 'users', this.uid, 'sync', key);
        const unsub = onSnapshot(docRef, (snap) => {
          if (!snap.exists()) return;
          // Skip if we just wrote this key (avoid echo)
          if (this.writingKeys.has(key)) return;

          const remote = snap.data();
          if (!remote?.data) return;

          const localData = UserStorage.getItem(this.uid, key);
          if (localData !== remote.data) {
            // Safety: never overwrite non-empty local data with empty remote data
            const remoteIsEmpty = remote.data === '[]' || remote.data === '{}' || remote.data === '';
            const localHasData = localData && localData !== '[]' && localData !== '{}' && localData !== '';
            if (remoteIsEmpty && localHasData) {
              console.warn(`Sync: skipping empty remote overwrite for ${key}`);
              return;
            }

            // Write directly to localStorage (bypass UserStorage.setItem to avoid re-triggering sync)
            const scopedKey = `user_${this.uid}_${key}`;
            localStorage.setItem(scopedKey, remote.data);
            this.notifyChange(key);
          }

          this._lastSyncTime = Date.now();
          this.setStatus('synced');
        }, (err) => {
          console.warn(`Sync listener error for ${key}:`, err);
          this.setStatus('error');
        });

        this.unsubscribers.push(unsub);
      }

      this._lastSyncTime = Date.now();
      this.setStatus('synced');
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
        // Max retries reached, likely a content blocker or persistent network issue
        console.warn('Sync failed after max retries. If using a content blocker, please whitelist Firebase.');
      }
    }
  }

  /** Push a key to Firestore (fire-and-forget) */
  async syncKey(key: string, data: string) {
    if (!this.db || !SYNC_KEYS.includes(key as SyncKey)) return;

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

      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const docRef = doc(this.db, 'users', this.uid, 'sync', key);
      await setDoc(docRef, {
        data,
        updatedAt: serverTimestamp(),
      });

      this._lastSyncTime = Date.now();
      this.setStatus('synced');
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
    this.retryCount = 0;
    this.db = null;
    // Notify status listeners before clearing them
    this.setStatus('idle');
    this.statusListeners.clear();
  }
}
