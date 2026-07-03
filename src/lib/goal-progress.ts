// Shared progress math for `tradingGoals` so every surface (Goals page,
// Profile widget) computes the same numbers. `current` is derived from trades
// at render time and is never persisted; only `achieved` is written back.

export interface TradingGoal {
  id: string
  type: 'profit' | 'winRate' | 'trades' | 'riskReward'
  period: 'daily' | 'weekly' | 'monthly'
  target: number
  current?: number
  achieved?: boolean
  createdAt: Date | string
  achievedAt?: Date | string
}

const GOAL_LABELS: Record<string, string> = {
  profit: 'Profit Target',
  winRate: 'Win Rate',
  trades: 'Trade Count',
  riskReward: 'Risk/Reward',
}

export function getGoalLabel(type: string): string {
  return GOAL_LABELS[type] || type
}

export function getGoalTitle(goal: Pick<TradingGoal, 'type' | 'period'>): string {
  const period = goal.period.charAt(0).toUpperCase() + goal.period.slice(1)
  return `${period} ${getGoalLabel(goal.type)}`
}

export function computeGoalProgress<T extends TradingGoal>(
  goals: T[],
  trades: Array<{ pnl?: number; riskReward?: number; exitTime?: Date | string }>,
): Array<T & { current: number; achieved: boolean }> {
  // Build each boundary from the unmutated `now`. (Date setters mutate in
  // place, so deriving them sequentially off one Date corrupts later reads —
  // e.g. weekStart rolling into the previous month would break monthStart.)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - now.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const datedTrades = trades.map(t => ({
    ...t,
    exitTime: t.exitTime instanceof Date ? t.exitTime : new Date(t.exitTime ?? 0),
  }))

  return goals.map(goal => {
    let startDate: Date

    switch (goal.period) {
      case 'daily':
        startDate = todayStart
        break
      case 'weekly':
        startDate = weekStart
        break
      case 'monthly':
      default:
        startDate = monthStart
        break
    }

    const relevantTrades = datedTrades.filter(t => t.exitTime >= startDate)

    let current = 0
    let achieved = false

    switch (goal.type) {
      case 'profit':
        current = relevantTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
        achieved = current >= goal.target
        break
      case 'winRate': {
        const wins = relevantTrades.filter(t => (t.pnl || 0) > 0).length
        current = relevantTrades.length > 0 ? (wins / relevantTrades.length) * 100 : 0
        achieved = relevantTrades.length > 0 && current >= goal.target
        break
      }
      case 'trades':
        current = relevantTrades.length
        achieved = current >= goal.target
        break
      case 'riskReward': {
        const avgRR = relevantTrades.length > 0
          ? relevantTrades.reduce((sum, t) => sum + (t.riskReward || 0), 0) / relevantTrades.length
          : 0
        current = avgRR
        achieved = relevantTrades.length > 0 && current >= goal.target
        break
      }
    }

    // Once a goal has been achieved (and persisted), it stays achieved even
    // after the period rolls over and current-period trades no longer meet
    // the target. resetGoalProgress is the deliberate way to clear it.
    return { ...goal, current, achieved: achieved || goal.achieved === true }
  })
}
