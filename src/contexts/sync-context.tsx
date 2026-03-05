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

    // Listen for status changes
    const unsubStatus = engine.onStatusChange(() => {
      setSyncStatus(engine.status);
      setLastSyncTime(engine.lastSyncTime);
      if (engine.status === 'synced' || engine.status === 'error') {
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
