export type PropAccountType = 'evaluation' | 'funded' | 'instant' | 'express'
export type PropAccountStatus = 'active' | 'passed' | 'failed' | 'withdrawn'
export type TransactionType =
  | 'evaluation-fee'
  | 'reset-fee'
  | 'monthly-fee'
  | 'payout'
  | 'other-expense'

export interface PropFirmAccount {
  id: string
  firmName: string
  accountSize: number
  accountType: PropAccountType
  status: PropAccountStatus
  startDate: string
  endDate?: string
  notes?: string
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
