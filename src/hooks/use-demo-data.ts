import { useAuth } from '@/contexts/auth-context';
import { useAccounts } from '@/contexts/account-context';
import { DemoDataService } from '@/services/demo-service';
import { DataService } from '@/services/data-service';
import { useUserStorage } from '@/utils/user-storage';
import { useCallback } from 'react';

/**
 * Hook to get data based on demo mode status
 */
export function useDemoData() {
  const { isDemo } = useAuth();
  const { activeAccount } = useAccounts();
  const userStorage = useUserStorage();

  const getTrades = useCallback(() => {
    let trades = [];
    
    if (isDemo) {
      trades = DemoDataService.getTrades();
    } else {
      // Get from user-scoped localStorage
      const savedTrades = userStorage.getItem('trades');
      if (savedTrades) {
        try {
          trades = JSON.parse(savedTrades);
        } catch {
          trades = [];
        }
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
    
    if (isDemo) {
      entries = DemoDataService.getJournalEntries();
    } else {
      // Get from user-scoped localStorage
      const savedEntries = userStorage.getItem('journalEntries');
      if (savedEntries) {
        try {
          entries = JSON.parse(savedEntries);
        } catch {
          entries = [];
        }
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
    
    if (isDemo) {
      goals = DemoDataService.getGoals();
    } else {
      // Get from user-scoped localStorage
      const savedGoals = userStorage.getItem('goals');
      if (savedGoals) {
        try {
          goals = JSON.parse(savedGoals);
        } catch {
          goals = [];
        }
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

  const getStats = () => {
    if (isDemo) {
      return DemoDataService.getStats();
    }
    return null;
  };

  return {
    isDemo,
    getTrades,
    getJournalEntries,
    getGoals,
    getStats,
    // Also expose the full DataService for components that need it
    dataService: DataService,
  };
}