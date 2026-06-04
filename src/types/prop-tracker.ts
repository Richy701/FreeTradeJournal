export type PropCurrency = 'USD' | 'EUR' | 'GBP' | 'CHF' | 'AUD' | 'CAD' | 'JPY' | 'CZK'
export type PropAccountType = 'evaluation' | 'funded' | 'instant' | 'express'
export type PropAccountStatus = 'active' | 'passed' | 'failed' | 'withdrawn'
export type TransactionType =
  | 'evaluation-fee'
  | 'reset-fee'
  | 'monthly-fee'
  | 'payout'
  | 'other-expense'

export interface ChallengeRules {
  profitTarget: number
  maxDailyDrawdown: number
  maxTotalDrawdown: number
  minTradingDays?: number
}

export interface ChallengeProgress {
  currentBalance: number
  highWaterMark: number
  tradingDaysCount: number
  todayPnL?: number
  lastUpdated: string
}

export interface PropFirmAccount {
  id: string
  firmName: string
  accountSize: number
  currency?: PropCurrency
  accountType: PropAccountType
  status: PropAccountStatus
  startDate: string
  endDate?: string
  notes?: string
  challengeRules?: ChallengeRules
  challengeProgress?: ChallengeProgress
  createdAt: string
}

export interface PropFirmTransaction {
  id: string
  propAccountId: string
  type: TransactionType
  amount: number
  description: string
  date: string
  createdAt: string
}
