import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase-lazy';
import { UserStorage, isSettingsDirty, clearSettingsDirty } from '@/utils/user-storage';
import type { Firestore, Unsubscribe } from 'firebase/firestore';

// Keys we sync between localStorage and Firestore
const SYNC_KEYS = ['trades', 'journalEntries', 'goals', 'tradingGoals', 'accounts', 'riskRules', 'onboardingCompleted', 'onboarding', 'propFirmAccounts', 'propFirmTransactions', 'settings'] as const;
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
  // Set by disable(); enable() re-checks it after its awaits so a mid-flight
  // logout can't leave the poll interval running on a disabled engine.
  private stopped = false;
  private _initialPullDone = false;
  private initialPullCallbacks: Set<() => void> = new Set();

  constructor(uid: string) {
    this.uid = uid;
  }

  get status() { return this._status; }
  get lastSyncTime() { return this._lastSyncTime; }
  get initialPullDone() { return this._initialPullDone; }

  onInitialPullDone(cb: () => void) {
    if (this._initialPullDone) { cb(); return () => {}; }
    this.initialPullCallbacks.add(cb);
    return () => { this.initialPullCallbacks.delete(cb); };
  }

  private markInitialPullDone() {
    if (this._initialPullDone) return;
    this._initialPullDone = true;
    this.initialPullCallbacks.forEach(cb => cb());
    this.initialPullCallbacks.clear();
  }

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
      this.stopped = false;
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

          // The user deliberately changed settings locally before this pull
          // finished. settings is last-write-wins, so keep the local edit and
          // flush it to remote after the pull (its earlier push was blocked).
          if (key === 'settings' && isSettingsDirty(this.uid)) {
            console.log('[Sync] Keeping local settings edit over remote (will flush)');
            continue;
          }

          // Update local data (go through UserStorage to keep cache & encryption in sync)
          // skipSync=true to avoid pushing the same data back to remote
          UserStorage.setItem(this.uid, key, remoteValue, true);
          this.notifyChange(key);
          console.log(`[Sync] Pulled ${key} from remote`);
        }
      }

      // disable() may have run while the pull above was awaiting — don't
      // start (or leak) the poll interval on a disabled engine.
      if (this.stopped) return;

      // Start polling for changes every 10 seconds
      this.pollTimer = setInterval(() => {
        this.poll();
      }, 10000);

      this._lastSyncTime = Date.now();
      this.setStatus('synced');
      this.markInitialPullDone();
      console.log('[Sync] Cloud Function polling enabled');

      // Flush a settings change the user made before the pull finished: its
      // push was blocked pre-pull and the pull above left it in place, so push
      // the current local value now that pulling is done (push is unblocked).
      if (isSettingsDirty(this.uid)) {
        const localSettings = UserStorage.getItem(this.uid, 'settings');
        if (localSettings) this.syncKey('settings', localSettings);
      }
    } catch (err) {
      console.error('SyncEngine enable failed:', err);
      this.setStatus('error');

      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount - 1) * 1000;
        console.log(`Retrying sync in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
        this.retryTimer = setTimeout(() => {
          this.enable();
        }, delay);
      } else {
        console.warn('Sync failed after max retries. Please check your internet connection.');
        this.markInitialPullDone();
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

        // Once the user has edited settings this session, treat local as
        // authoritative so polling can't overwrite it with a stale remote.
        if (key === 'settings' && isSettingsDirty(this.uid)) continue;

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

          // Go through UserStorage to keep cache & encryption in sync
          // skipSync=true to avoid pushing the same data back to remote
          UserStorage.setItem(this.uid, key, remoteValue, true);
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

    // CRITICAL: Block empty collections only BEFORE the initial pull — a fresh
    // device writes default '[]' on mount, and pushing that would wipe the
    // cloud copy. AFTER the pull, an empty array is a real user deletion and
    // must propagate: blocking it made the 10s poll resurrect deleted trades.
    const isEmpty = data === '[]' || data === '{}' || data === '' || data === 'null';
    if (isEmpty && !this._initialPullDone &&
        (key === 'trades' || key === 'accounts' || key === 'journalEntries' || key === 'goals')) {
      console.warn(`[Sync] Blocked empty ${key} push before initial pull`);
      return;
    }

    // CRITICAL: Never push settings before the initial pull completes.
    // settings is a single last-write-wins blob, and a fresh device writes
    // DEFAULT settings to storage on mount — pushing those before the pull
    // would overwrite the user's real cloud settings on every new device.
    // Blocked here, real settings sync from the first change after the pull.
    if (key === 'settings' && !this._initialPullDone) {
      console.warn('[Sync] Blocked settings push before initial pull');
      return;
    }

    // CRITICAL: Never sync default-only accounts before initial pull completes
    // This prevents a race condition where a freshly created default account
    // overwrites real accounts in Firestore on new devices / cleared cache
    if (key === 'accounts' && !this._initialPullDone) {
      try {
        const parsed = JSON.parse(data);
        const allDefaults = Array.isArray(parsed) && parsed.every((a: any) => a.id?.startsWith('default-'));
        if (allDefaults) {
          console.warn('[Sync] Blocked default-only accounts from syncing before initial pull');
          return;
        }
      } catch { /* parse error, let it through */ }
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

      // allowEmpty tells the server this is a deliberate post-pull write, so
      // an empty array (user deleted everything) is accepted instead of being
      // blocked by the server's fresh-device guard.
      await syncDataFn({ key, value: data, allowEmpty: this._initialPullDone });

      this._lastSyncTime = Date.now();
      this.setStatus('synced');
      // Push confirmed — the local settings edit is now safely in the cloud, so
      // future loads can pull normally instead of forcing local to win.
      if (key === 'settings') clearSettingsDirty(this.uid);
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
    this.stopped = true;
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
    this.initialPullCallbacks.clear();
  }
}
