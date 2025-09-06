import { DemoDataService } from './demo-service';
import type { ExtendedTrade as Trade, JournalEntry, Goal } from '@/types';

/**
 * Unified data service that returns demo data in demo mode,
 * or real localStorage data otherwise
 */
export class DataService {
  static isDemo(): boolean {
    // Check if we're in demo mode by looking for the demo user
    const authState = localStorage.getItem('auth-state');
    if (authState) {
      try {
        const state = JSON.parse(authState);
        return state?.user?.uid === 'demo-user' || state?.isDemo === true;
      } catch {
        return false;
      }
    }
    return false;
  }

  static getTrades(): Trade[] {
    if (this.isDemo()) {
      return DemoDataService.getTrades();
    }
    
    const savedTrades = localStorage.getItem('trades');
    if (savedTrades) {
      try {
        return JSON.parse(savedTrades);
      } catch {
        return [];
      }
    }
    return [];
  }

  static saveTrade(trade: Trade): Trade {
    if (this.isDemo()) {
      return DemoDataService.createTrade(trade) as unknown as Trade;
    }

    const trades = this.getTrades();
    trades.push(trade);
    localStorage.setItem('trades', JSON.stringify(trades));
    return trade;
  }

  static updateTrade(id: string, updates: Partial<Trade>): Trade {
    if (this.isDemo()) {
      return DemoDataService.updateTrade(id, updates) as unknown as Trade;
    }

    const trades = this.getTrades();
    const index = trades.findIndex(t => t.id === id);
    if (index !== -1) {
      trades[index] = { ...trades[index], ...updates };
      localStorage.setItem('trades', JSON.stringify(trades));
      return trades[index];
    }
    throw new Error('Trade not found');
  }

  static deleteTrade(id: string): void {
    if (this.isDemo()) {
      DemoDataService.deleteTrade(id);
      return;
    }

    const trades = this.getTrades();
    const filtered = trades.filter(t => t.id !== id);
    localStorage.setItem('trades', JSON.stringify(filtered));
  }

  static getJournalEntries(): JournalEntry[] {
    if (this.isDemo()) {
      return DemoDataService.getJournalEntries();
    }

    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      try {
        return JSON.parse(savedEntries);
      } catch {
        return [];
      }
    }
    return [];
  }

  static saveJournalEntry(entry: JournalEntry): JournalEntry {
    if (this.isDemo()) {
      return DemoDataService.createJournalEntry(entry) as unknown as JournalEntry;
    }

    const entries = this.getJournalEntries();
    entries.push(entry);
    localStorage.setItem('journalEntries', JSON.stringify(entries));
    return entry;
  }

  static updateJournalEntry(id: string, updates: Partial<JournalEntry>): JournalEntry {
    if (this.isDemo()) {
      return DemoDataService.updateJournalEntry(id, updates) as unknown as JournalEntry;
    }

    const entries = this.getJournalEntries();
    const index = entries.findIndex(e => e.id === id);
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updates };
      localStorage.setItem('journalEntries', JSON.stringify(entries));
      return entries[index];
    }
    throw new Error('Journal entry not found');
  }

  static deleteJournalEntry(id: string): void {
    if (this.isDemo()) {
      DemoDataService.deleteJournalEntry(id);
      return;
    }

    const entries = this.getJournalEntries();
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem('journalEntries', JSON.stringify(filtered));
  }

  static getGoals(): Goal[] {
    if (this.isDemo()) {
      return DemoDataService.getGoals();
    }

    const savedGoals = localStorage.getItem('goals');
    if (savedGoals) {
      try {
        return JSON.parse(savedGoals);
      } catch {
        return [];
      }
    }
    return [];
  }

  static saveGoal(goal: Goal): Goal {
    if (this.isDemo()) {
      return DemoDataService.createGoal(goal) as unknown as Goal;
    }

    const goals = this.getGoals();
    goals.push(goal);
    localStorage.setItem('goals', JSON.stringify(goals));
    return goal;
  }

  static updateGoal(id: string, updates: Partial<Goal>): Goal {
    if (this.isDemo()) {
      return DemoDataService.updateGoal(id, updates) as unknown as Goal;
    }

    const goals = this.getGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
      goals[index] = { ...goals[index], ...updates };
      localStorage.setItem('goals', JSON.stringify(goals));
      return goals[index];
    }
    throw new Error('Goal not found');
  }

  static deleteGoal(id: string): void {
    if (this.isDemo()) {
      DemoDataService.deleteGoal(id);
      return;
    }

    const goals = this.getGoals();
    const filtered = goals.filter(g => g.id !== id);
    localStorage.setItem('goals', JSON.stringify(filtered));
  }

  static getStats() {
    if (this.isDemo()) {
      return DemoDataService.getStats();
    }

    // Calculate stats from real data
    const trades = this.getTrades();
    // Add calculation logic here if needed
    return null;
  }
}