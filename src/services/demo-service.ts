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

  // Methods that simulate creating/updating/deleting (but don't persist)
  static async createTrade(trade: Partial<Trade>): Promise<Trade> {
    // In demo mode, just return the trade with a generated ID
    const newTrade = {
      ...trade,
      id: `demo-trade-${Date.now()}`,
      userId: 'demo-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Trade;
    
    // Add to the in-memory array (won't persist)
    DEMO_TRADES.push(newTrade);
    return newTrade;
  }

  static async updateTrade(id: string, updates: Partial<Trade>): Promise<Trade> {
    const index = DEMO_TRADES.findIndex(t => t.id === id);
    if (index !== -1) {
      DEMO_TRADES[index] = { ...DEMO_TRADES[index], ...updates };
      return DEMO_TRADES[index];
    }
    throw new Error('Trade not found');
  }

  static async deleteTrade(id: string): Promise<void> {
    const index = DEMO_TRADES.findIndex(t => t.id === id);
    if (index !== -1) {
      DEMO_TRADES.splice(index, 1);
    }
  }

  static async createJournalEntry(entry: Partial<JournalEntry>): Promise<JournalEntry> {
    const newEntry = {
      ...entry,
      id: `demo-journal-${Date.now()}`,
      userId: 'demo-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as JournalEntry;
    
    DEMO_JOURNAL_ENTRIES.push(newEntry);
    return newEntry;
  }

  static async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    const index = DEMO_JOURNAL_ENTRIES.findIndex(e => e.id === id);
    if (index !== -1) {
      DEMO_JOURNAL_ENTRIES[index] = { ...DEMO_JOURNAL_ENTRIES[index], ...updates };
      return DEMO_JOURNAL_ENTRIES[index];
    }
    throw new Error('Journal entry not found');
  }

  static async deleteJournalEntry(id: string): Promise<void> {
    const index = DEMO_JOURNAL_ENTRIES.findIndex(e => e.id === id);
    if (index !== -1) {
      DEMO_JOURNAL_ENTRIES.splice(index, 1);
    }
  }

  static async createGoal(goal: Partial<Goal>): Promise<Goal> {
    const newGoal = {
      ...goal,
      id: `demo-goal-${Date.now()}`,
      userId: 'demo-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Goal;
    
    DEMO_GOALS.push(newGoal);
    return newGoal;
  }

  static async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    const index = DEMO_GOALS.findIndex(g => g.id === id);
    if (index !== -1) {
      DEMO_GOALS[index] = { ...DEMO_GOALS[index], ...updates };
      return DEMO_GOALS[index];
    }
    throw new Error('Goal not found');
  }

  static async deleteGoal(id: string): Promise<void> {
    const index = DEMO_GOALS.findIndex(g => g.id === id);
    if (index !== -1) {
      DEMO_GOALS.splice(index, 1);
    }
  }
}