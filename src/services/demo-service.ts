import {
  DEMO_TRADES,
  DEMO_JOURNAL_ENTRIES,
  DEMO_GOALS,
  DEMO_STATS,
  DEMO_ACCOUNT
} from '@/data/demo-data';
import type { ExtendedTrade as Trade, JournalEntry, Goal, AccountInfo } from '@/types';

export class DemoDataService {
  static getTrades(): Trade[] {
    return DEMO_TRADES;
  }

  static getTradeById(id: string): Trade | undefined {
    return DEMO_TRADES.find(trade => trade.id === id);
  }

  static getJournalEntries(): JournalEntry[] {
    return DEMO_JOURNAL_ENTRIES;
  }

  static getJournalEntryById(id: string): JournalEntry | undefined {
    return DEMO_JOURNAL_ENTRIES.find(entry => entry.id === id);
  }

  static getGoals(): Goal[] {
    return DEMO_GOALS;
  }

  static getGoalById(id: string): Goal | undefined {
    return DEMO_GOALS.find(goal => goal.id === id);
  }

  static getStats() {
    return DEMO_STATS;
  }

  static getAccountInfo(): AccountInfo {
    return DEMO_ACCOUNT;
  }
}
