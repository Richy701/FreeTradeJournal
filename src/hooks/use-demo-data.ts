import { useAuth } from '@/contexts/auth-context';
import { DemoDataService } from '@/services/demo-service';
import { DataService } from '@/services/data-service';
import { useUserStorage } from '@/utils/user-storage';
import { useCallback } from 'react';

/**
 * Hook to get data based on demo mode status
 */
export function useDemoData() {
  const { isDemo } = useAuth();
  const userStorage = useUserStorage();

  const getTrades = useCallback(() => {
    if (isDemo) {
      return DemoDataService.getTrades();
    }
    // Get from user-scoped localStorage
    const savedTrades = userStorage.getItem('trades');
    if (savedTrades) {
      try {
        return JSON.parse(savedTrades);
      } catch {
        return [];
      }
    }
    return [];
  }, [isDemo, userStorage]);

  const getJournalEntries = useCallback(() => {
    if (isDemo) {
      return DemoDataService.getJournalEntries();
    }
    // Get from user-scoped localStorage
    const savedEntries = userStorage.getItem('journalEntries');
    if (savedEntries) {
      try {
        return JSON.parse(savedEntries);
      } catch {
        return [];
      }
    }
    return [];
  }, [isDemo, userStorage]);

  const getGoals = useCallback(() => {
    if (isDemo) {
      return DemoDataService.getGoals();
    }
    // Get from user-scoped localStorage
    const savedGoals = userStorage.getItem('goals');
    if (savedGoals) {
      try {
        return JSON.parse(savedGoals);
      } catch {
        return [];
      }
    }
    return [];
  }, [isDemo, userStorage]);

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