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
  marketConditions?: string;
  lessonsLearned?: string;
  improvementAreas?: string;
  tradingPlan?: string;
  gratitude?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: 'profit' | 'performance' | 'risk' | 'discipline' | 'other';
  targetValue: number;
  currentValue: number;
  targetDate: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'ongoing';
  status: 'pending' | 'in-progress' | 'achieved' | 'failed';
  description?: string;
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
  percentGain?: number;
  riskRewardRatio?: number;
  exitDate?: string;
  exitTime?: Date | string;
  entryTime?: Date | string;
  duration?: string;
  status?: 'open' | 'closed' | 'pending';
  emotions?: string;
  emotionScore?: number;
  setup?: string;
  mistakes?: string;
  lessons?: string;
  createdAt?: string;
  updatedAt?: string;
}