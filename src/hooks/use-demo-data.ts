import { useAuth } from '@/contexts/auth-context';
import { useAccounts } from '@/contexts/account-context';
import { useUserStorage } from '@/utils/user-storage';
import { useCallback, useEffect, useState } from 'react';
import { getChangeVersion, onSyncChange } from '@/contexts/sync-context';

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
  const { activeAccount } = useAccounts();
  const userStorage = useUserStorage();

  // Subscribe to sync changes — version bump triggers re-render
  const [, setVersion] = useState(() => getChangeVersion());
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
      return trades.filter((trade: any) =>
        trade.accountId === activeAccount.id ||
        (!trade.accountId && activeAccount.id.includes('default')) // Handle legacy trades without accountId
      );
    }

    return trades;
  }, [isDemo, userStorage, activeAccount]);

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
      return entries.filter((entry: any) =>
        entry.accountId === activeAccount.id ||
        (!entry.accountId && activeAccount.id.includes('default'))
      );
    }

    return entries;
  }, [isDemo, userStorage, activeAccount]);

  const getGoals = useCallback(() => {
    let goals = [];

    const savedGoals = userStorage.getItem('goals');
    if (savedGoals) {
      try {
        goals = JSON.parse(savedGoals);
      } catch {
        goals = [];
      }
    }

    // Filter goals by active account if account exists
    if (activeAccount) {
      return goals.filter((goal: any) =>
        goal.accountId === activeAccount.id ||
        (!goal.accountId && activeAccount.id.includes('default'))
      );
    }

    return goals;
  }, [isDemo, userStorage, activeAccount]);

  return {
    isDemo,
    getTrades,
    getJournalEntries,
    getGoals,
  };
}
