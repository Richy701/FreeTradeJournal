import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { SyncEngine, type SyncStatus } from '@/services/sync-engine';
import { setSyncRef } from '@/utils/user-storage';

interface SyncContextType {
  isSyncing: boolean;
  syncStatus: SyncStatus;
  lastSyncTime: number | null;
  initialSyncDone: boolean;
}

const SyncContext = createContext<SyncContextType>({
  isSyncing: false,
  syncStatus: 'idle',
  lastSyncTime: null,
  initialSyncDone: true,
});

export function useSync() {
  return useContext(SyncContext);
}

// Global change version — useDemoData subscribes to this
let changeVersion = 0;
const changeListeners = new Set<() => void>();

export function getChangeVersion() { return changeVersion; }

export function onSyncChange(cb: () => void) {
  changeListeners.add(cb);
  return () => { changeListeners.delete(cb); };
}

function bumpVersion() {
  changeVersion++;
  changeListeners.forEach(cb => cb());
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isPro, isLoading: isProLoading } = useProStatus();
  const engineRef = useRef<SyncEngine | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clean up previous engine
    if (engineRef.current) {
      engineRef.current.disable();
      engineRef.current = null;
      setSyncRef(null);
      setSyncStatus('idle');
    }

    // No user — no sync needed
    if (!user) {
      setInitialSyncDone(true);
      return;
    }

    // Still determining Pro status — wait
    if (isProLoading) return;

    // Not Pro — no sync needed
    if (!isPro) {
      setInitialSyncDone(true);
      return;
    }

    // Pro user — start sync engine
    setInitialSyncDone(false);
    const engine = new SyncEngine(user.uid);
    engineRef.current = engine;

    // Wire sync ref so UserStorage.setItem delegates to Firestore
    setSyncRef({ syncKey: (key, data) => engine.syncKey(key, data) });

    // Safety timeout: if sync doesn't complete in 10 seconds, proceed anyway
    // This prevents infinite loading on persistent network issues or content blockers
    syncTimeoutRef.current = setTimeout(() => {
      if (!initialSyncDone) {
        console.warn('Sync timeout reached (possible content blocker), proceeding with local data');
        setInitialSyncDone(true);
      }
    }, 10000);

    // Listen for status changes
    const unsubStatus = engine.onStatusChange(() => {
      setSyncStatus(engine.status);
      setLastSyncTime(engine.lastSyncTime);
      // Only mark as done when successfully synced, not on error
      // This prevents showing empty data when sync fails on flaky mobile networks
      if (engine.status === 'synced') {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
        setInitialSyncDone(true);
      }
    });

    // Listen for remote data changes → bump version so React re-reads
    const unsubChange = engine.onChange(() => {
      bumpVersion();
    });

    // Start syncing
    engine.enable();

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      unsubStatus();
      unsubChange();
      engine.disable();
      setSyncRef(null);
    };
  }, [user, isPro, isProLoading]);

  return (
    <SyncContext.Provider value={{
      isSyncing: syncStatus === 'syncing',
      syncStatus,
      lastSyncTime,
      initialSyncDone,
    }}>
      {children}
    </SyncContext.Provider>
  );
}
