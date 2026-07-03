import type { Trade } from './trade';
export * from './trade';

// Additional types for demo mode
export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  emotions?: string[];
  entryType?: 'general' | 'pre-trade' | 'post-trade';
  tradeId?: string;
  screenshots?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AccountInfo {
  userId: string;
  accountName: string;
  brokerName: string;
  accountNumber: string;
  startingBalance: number;
  currentBalance: number;
  currency: string;
  accountType: 'live' | 'demo' | 'funded';
  createdAt: string;
  updatedAt: string;
}

// Extended Trade interface for demo data
export interface ExtendedTrade extends Omit<Trade, 'exitTime' | 'entryTime'> {
  userId?: string;
  date?: string;
  time?: string;
  instrumentType?: 'forex' | 'futures' | 'stocks' | 'crypto';
  action?: 'buy' | 'sell';
  stopLoss?: number;
  takeProfit?: number;
  swap?: number;
  profit?: number;
  netProfit?: number;
  exitDate?: string;
  exitTime?: Date | string;
  entryTime?: Date | string;
  duration?: string;
  status?: 'open' | 'closed' | 'pending';
  emotions?: string;
  createdAt?: string;
  updatedAt?: string;
}