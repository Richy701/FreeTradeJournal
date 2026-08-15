// Shared progress math for `tradingGoals` so every surface (Goals page,
// Profile widget, AI coach) computes the same numbers. `current` is derived
// from trades at render time and is never persisted; `achievedAt` is the only
// achievement state written back (used to celebrate once per period).

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

// A win rate from one or two trades is noise, not a hit target.
const WIN_RATE_MIN_TRADES = 3

export function getGoalLabel(type: string): string {
  return GOAL_LABELS[type] || type
}

export function getGoalTitle(goal: Pick<TradingGoal, 'type' | 'period'>): string {
  const period = goal.period.charAt(0).toUpperCase() + goal.period.slice(1)
  return `${period} ${getGoalLabel(goal.type)}`
}

interface GoalTrade {
  pnl?: number
  riskReward?: number
  exitTime?: Date | string
}

/** Start of the current daily/weekly/monthly period. */
export function currentPeriodStart(period: TradingGoal['period']): Date {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (period) {
    case 'daily':
      return todayStart
    case 'weekly': {
      const weekStart = new Date(todayStart)
      weekStart.setDate(weekStart.getDate() - now.getDay())
      return weekStart
    }
    case 'monthly':
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1)
  }
}

// Evaluate one goal against the trades inside [start, end).
function evaluateWindow(
  goal: Pick<TradingGoal, 'type' | 'target'>,
  trades: Array<GoalTrade & { exitTime: Date }>,
  start: Date,
  end?: Date,
): { current: number; achieved: boolean } {
  const windowTrades = trades.filter(t => t.exitTime >= start && (!end || t.exitTime < end))

  switch (goal.type) {
    case 'profit': {
      const current = windowTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
      return { current, achieved: current >= goal.target }
    }
    case 'winRate': {
      const wins = windowTrades.filter(t => (t.pnl || 0) > 0).length
      const current = windowTrades.length > 0 ? (wins / windowTrades.length) * 100 : 0
      return { current, achieved: windowTrades.length >= WIN_RATE_MIN_TRADES && current >= goal.target }
    }
    case 'trades':
      return { current: windowTrades.length, achieved: windowTrades.length >= goal.target }
    case 'riskReward': {
      // Only trades that recorded an R:R — counting blanks as 0 dragged the
      // average down for anyone who doesn't fill the field on every trade.
      const withRR = windowTrades.filter(t => (t.riskReward || 0) > 0)
      const current = withRR.length > 0
        ? withRR.reduce((sum, t) => sum + (t.riskReward || 0), 0) / withRR.length
        : 0
      return { current, achieved: withRR.length > 0 && current >= goal.target }
    }
    default:
      return { current: 0, achieved: false }
  }
}

function withDates(trades: GoalTrade[]): Array<GoalTrade & { exitTime: Date }> {
  return trades.map(t => ({
    ...t,
    exitTime: t.exitTime instanceof Date ? t.exitTime : new Date(t.exitTime ?? 0),
  }))
}

// `achieved` is LIVE for the current period — it resets naturally when the
// period rolls over. Long-term consistency lives in computeGoalHistory, not
// in a sticky flag.
export function computeGoalProgress<T extends TradingGoal>(
  goals: T[],
  trades: GoalTrade[],
): Array<T & { current: number; achieved: boolean }> {
  const datedTrades = withDates(trades)
  return goals.map(goal => {
    const { current, achieved } = evaluateWindow(goal, datedTrades, currentPeriodStart(goal.period))
    return { ...goal, current, achieved }
  })
}

export interface GoalPeriodResult {
  start: Date
  /** Whether the goal's target was met inside this period. */
  achieved: boolean
  /** The still-running current period (rendered differently from finished ones). */
  inProgress: boolean
}

/**
 * The goal evaluated over the last `count` periods (oldest first, current
 * period last). Computed retroactively from trade history — periods that end
 * before the first recorded trade are omitted, so a new user isn't shown a
 * row of misses they never had a chance at.
 */
export function computeGoalHistory(
  goal: Pick<TradingGoal, 'type' | 'period' | 'target'>,
  trades: GoalTrade[],
  count = 6,
): GoalPeriodResult[] {
  const datedTrades = withDates(trades)
  if (datedTrades.length === 0) return []
  const firstTrade = Math.min(...datedTrades.map(t => t.exitTime.getTime()))

  const startOf = (offset: number): Date => {
    const base = currentPeriodStart(goal.period)
    const d = new Date(base)
    if (goal.period === 'daily') d.setDate(d.getDate() - offset)
    else if (goal.period === 'weekly') d.setDate(d.getDate() - offset * 7)
    else d.setMonth(d.getMonth() - offset)
    return d
  }

  const results: GoalPeriodResult[] = []
  for (let offset = count - 1; offset >= 0; offset--) {
    const start = startOf(offset)
    const end = offset > 0 ? startOf(offset - 1) : undefined
    if (end && end.getTime() <= firstTrade) continue
    const { achieved } = evaluateWindow(goal, datedTrades, start, end)
    results.push({ start, achieved, inProgress: offset === 0 })
  }
  return results
}
