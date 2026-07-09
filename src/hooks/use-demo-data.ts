import { useAuth } from '@/contexts/auth-context';
import { useAccounts } from '@/contexts/account-context';
import { useProStatus } from '@/contexts/pro-context';
import { useUserStorage } from '@/utils/user-storage';
import { useCallback, useEffect, useState } from 'react';
import { getChangeVersion, onSyncChange } from '@/contexts/sync-context';
import { belongsToAccount } from '@/lib/account-scope';
import { FREE_ANALYTICS_WINDOW_DAYS } from '@/constants/pricing';
import { windowAnalyticsTrades } from '@/lib/analytics-window';

/**
 * Hook to read trading data, account-scoped.
 *
 * Demo mode is an interactive sandbox: entering demo seeds the demo dataset
 * into demo-user-scoped storage (see seedDemoStorage), so demo reads/writes go
 * through the exact same user-scoped storage path as a real account. There is
 * no special demo read branch — that keeps demo and real behaviour identical
 * and lets sandbox edits show up immediately.
 *
 * Re-reads storage when sync (or a local write) bumps the change version.
 */
export function useDemoData() {
  const { isDemo } = useAuth();
  const { isPro, isLoading: isProLoading } = useProStatus();
  const { activeAccount } = useAccounts();
  const userStorage = useUserStorage();

  // Subscribe to sync changes — version bump triggers re-render
  const [version, setVersion] = useState(() => getChangeVersion());
  useEffect(() => {
    return onSyncChange(() => setVersion(getChangeVersion()));
  }, []);

  const getTrades = useCallback(() => {
    let trades = [];

    // Get from user-scoped localStorage (seeded with demo data in demo mode)
    const savedTrades = userStorage.getItem('trades');
    if (savedTrades) {
      try {
        trades = JSON.parse(savedTrades);
      } catch {
        trades = [];
      }
    }

    // Filter trades by active account if account exists
    if (activeAccount) {
      return trades.filter((trade: any) => belongsToAccount(trade, activeAccount.id));
    }

    return trades;
  }, [isDemo, userStorage, activeAccount, version]);

  // Analytics views (dashboard widgets, header stats) read through this instead
  // of getTrades: free accounts get the trailing FREE_ANALYTICS_WINDOW_DAYS
  // only. The trade log and exports always read getTrades — the window gates
  // analytics depth, never the user's own data. isPro already covers demo mode
  // and active trials.
  const getAnalyticsTrades = useCallback((): { trades: any[]; hiddenCount: number } => {
    const trades = getTrades();
    // While pro status is still resolving, err on the unwindowed side — never
    // flash the degraded free view (and its upgrade banner) at an entitled user
    if (isPro || isProLoading) return { trades, hiddenCount: 0 };
    return windowAnalyticsTrades(trades, FREE_ANALYTICS_WINDOW_DAYS);
  }, [getTrades, isPro, isProLoading]);

  const getJournalEntries = useCallback(() => {
    let entries = [];

    const savedEntries = userStorage.getItem('journalEntries');
    if (savedEntries) {
      try {
        entries = JSON.parse(savedEntries);
      } catch {
        entries = [];
      }
    }

    // Filter journal entries by active account if account exists
    if (activeAccount) {
      return entries.filter((entry: any) => belongsToAccount(entry, activeAccount.id));
    }

    return entries;
  }, [isDemo, userStorage, activeAccount, version]);

  return {
    isDemo,
    getTrades,
    getAnalyticsTrades,
    getJournalEntries,
  };
}
