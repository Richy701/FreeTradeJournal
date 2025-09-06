import { useAuth } from '@/contexts/auth-context';
import { DemoDataService } from '@/services/demo-service';
import { DataService } from '@/services/data-service';

/**
 * Hook to get data based on demo mode status
 */
export function useDemoData() {
  const { isDemo } = useAuth();

  const getTrades = () => {
    if (isDemo) {
      return DemoDataService.getTrades();
    }
    // Get from localStorage
    const savedTrades = localStorage.getItem('trades');
    if (savedTrades) {
      try {
        return JSON.parse(savedTrades);
      } catch {
        return [];
      }
    }
    return [];
  };

  const getJournalEntries = () => {
    if (isDemo) {
      return DemoDataService.getJournalEntries();
    }
    // Get from localStorage
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      try {
        return JSON.parse(savedEntries);
      } catch {
        return [];
      }
    }
    return [];
  };

  const getGoals = () => {
    if (isDemo) {
      return DemoDataService.getGoals();
    }
    // Get from localStorage
    const savedGoals = localStorage.getItem('goals');
    if (savedGoals) {
      try {
        return JSON.parse(savedGoals);
      } catch {
        return [];
      }
    }
    return [];
  };

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