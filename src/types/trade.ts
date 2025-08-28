export interface Trade {
  id: string
  symbol: string
  side: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  quantity: number
  entryTime: Date
  exitTime: Date
  commission: number
  pnl: number
  pnlPercentage: number
  notes?: string
  strategy?: string
  tags?: string[]
  screenshots?: string[]
}

export interface TradeFormData {
  symbol: string
  side: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  quantity: number
  entryTime: Date
  exitTime: Date
  commission: number
  notes?: string
  strategy?: string
  tags?: string[]
}

export interface DashboardMetrics {
  totalPnL: number
  winRate: number
  profitFactor: number
  expectancy: number
  totalTrades: number
  wins: number
  losses: number
  maxDrawdown: number
  consecutiveLosses: number
  largestWin: number
  largestLoss: number
  averageWin: number
  averageLoss: number
}