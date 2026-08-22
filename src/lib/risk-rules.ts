// Shared evaluation for `riskRules` so the Goals page and the app-wide breach
// monitor compute identical numbers. Rules evaluate against the ACTIVE
// account's trades (callers pass trades from useDemoData's getTrades).

export interface RiskRule {
  id: string
  type: 'maxLossPerDay' | 'maxLossPerTrade' | 'maxDrawdown'
  value: number
  enabled: boolean
  violations?: number
}

export interface RuleStatus {
  rule: RiskRule
  /** Current usage in currency (today's loss, today's worst trade loss, or lifetime drawdown). */
  current: number
  /** 0-100, clamped. */
  pct: number
  breached: boolean
}

export const RULE_LABELS: Record<RiskRule['type'], string> = {
  maxLossPerDay: 'Max Daily Loss',
  maxLossPerTrade: 'Max Loss Per Trade',
  maxDrawdown: 'Max Drawdown',
}

export function getRuleLabel(type: string): string {
  return RULE_LABELS[type as RiskRule['type']] || type
}

interface RuleTrade {
  pnl?: number
  exitTime?: Date | string
}

// Peak-to-trough drawdown across all trades (ordered by exit time).
export function computeMaxDrawdown(trades: RuleTrade[]): number {
  const ordered = [...trades].sort(
    (a, b) => new Date(a.exitTime ?? 0).getTime() - new Date(b.exitTime ?? 0).getTime()
  )
  let peak = 0, drawdown = 0, cumulative = 0
  for (const t of ordered) {
    cumulative += t.pnl || 0
    if (cumulative > peak) peak = cumulative
    const dd = peak - cumulative
    if (dd > drawdown) drawdown = dd
  }
  return drawdown
}

/**
 * How far equity sits below its most recent peak right now, over every trade
 * with a usable exit time. Unlike computeMaxDrawdown (the worst slide ever,
 * which never recovers) this goes back to zero when a new peak is made.
 */
export function currentDrawdown(trades: RuleTrade[]): number {
  const ordered = trades
    .map(t => ({ ms: new Date(t.exitTime ?? 0).getTime(), pnl: t.pnl || 0 }))
    .filter(t => Number.isFinite(t.ms) && t.ms > 0)
    .sort((a, b) => a.ms - b.ms)
  let cumulative = 0
  let peak = 0
  for (const t of ordered) {
    cumulative += t.pnl
    if (cumulative > peak) peak = cumulative
  }
  return peak - cumulative
}

export function evaluateRiskRules(rules: RiskRule[], trades: RuleTrade[]): RuleStatus[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayTrades = trades.filter(t => new Date(t.exitTime ?? 0) >= todayStart)

  const todayLoss = Math.abs(Math.min(0, todayTrades.reduce((s, t) => s + (t.pnl || 0), 0)))
  // Today's worst single-trade loss. (Both the breach check and the display
  // use this — the old code breached only on the single LATEST trade, so a
  // limit-crossing loss earlier in an import batch never fired.)
  const worstTradeLoss = todayTrades.length > 0
    ? Math.abs(Math.min(0, ...todayTrades.map(t => t.pnl || 0)))
    : 0
  const drawdown = computeMaxDrawdown(trades)

  return rules.map(rule => {
    const current =
      rule.type === 'maxLossPerDay' ? todayLoss :
      rule.type === 'maxLossPerTrade' ? worstTradeLoss :
      drawdown
    const pct = rule.value > 0 ? Math.min(100, (current / rule.value) * 100) : 0
    return { rule, current, pct, breached: rule.enabled && current > rule.value }
  })
}

// ── Historical rule adherence ──────────────────────────────────────────────
// `evaluateRiskRules` only answers "where am I right now, today". This replays
// the same limits backwards over every completed trading day so we can answer
// "what does breaking them actually cost you".
//
// Deliberate choices, because each one changes the number:
//  - A day counts as broken only if a limit was crossed ON that day. Drawdown
//    is a running measure, so without this one bad day would mark every day
//    after it as broken and the comparison would be meaningless.
//  - Only enabled limits with a positive value are replayed.
//  - Limits are replayed at their CURRENT value. Past values were never
//    recorded, so this is "how would today's limits have judged past days".
//  - Days are local calendar days keyed off exitTime, matching the calendar
//    heatmap so the two never disagree about which day a trade belongs to.
//  - Today is excluded. It is still open, and the live evaluator covers it.

export interface RuleAdherenceDay {
  /** Local start-of-day. */
  date: Date
  /** Net P&L for the day. */
  pnl: number
  /** Limits crossed on this day. Empty means the day stayed inside all of them. */
  brokenRuleTypes: RiskRule['type'][]
}

export interface AdherenceBucket {
  days: number
  winningDays: number
  /** 0-100. */
  winRate: number
  totalPnl: number
  avgPnl: number
}

export interface RuleAdherenceStats {
  /** Days that stayed inside every enabled limit. */
  followed: AdherenceBucket
  /** Days that crossed at least one. */
  broken: AdherenceBucket
  /** Per-day detail, oldest first, today excluded. */
  days: RuleAdherenceDay[]
  /** Both buckets hold enough days for the comparison to mean anything. */
  comparable: boolean
}

/** Below this many days in either bucket the comparison is noise, not a finding. */
export const MIN_ADHERENCE_DAYS = 3

export function localDayStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function bucketOf(days: RuleAdherenceDay[]): AdherenceBucket {
  const winningDays = days.filter(d => d.pnl > 0).length
  const totalPnl = days.reduce((s, d) => s + d.pnl, 0)
  return {
    days: days.length,
    winningDays,
    winRate: days.length > 0 ? (winningDays / days.length) * 100 : 0,
    totalPnl,
    avgPnl: days.length > 0 ? totalPnl / days.length : 0,
  }
}

export function computeRuleAdherence(
  rules: RiskRule[],
  trades: RuleTrade[],
  now: Date = new Date()
): RuleAdherenceStats {
  const active = rules.filter(r => r.enabled && r.value > 0)
  const todayStart = localDayStart(now).getTime()

  const ordered = trades
    .filter(t => {
      const ms = new Date(t.exitTime ?? 0).getTime()
      return Number.isFinite(ms) && ms > 0 && localDayStart(new Date(ms)).getTime() < todayStart
    })
    .sort((a, b) => new Date(a.exitTime ?? 0).getTime() - new Date(b.exitTime ?? 0).getTime())

  const byDay = new Map<number, RuleTrade[]>()
  for (const t of ordered) {
    const key = localDayStart(new Date(t.exitTime ?? 0)).getTime()
    const bucket = byDay.get(key)
    if (bucket) bucket.push(t)
    else byDay.set(key, [t])
  }

  // Two rules of the same type (the dialog does not block duplicates): the
  // live monitor checks each one, so the tighter value is the one that bites.
  const limitFor = (type: RiskRule['type']) => {
    const values = active.filter(r => r.type === type).map(r => r.value)
    return values.length > 0 ? Math.min(...values) : 0
  }

  // Running equity state, carried across days so a drawdown crossing is
  // attributed to the day it happened rather than to every day that follows it.
  let cumulative = 0
  let peak = 0

  const days: RuleAdherenceDay[] = []

  for (const key of [...byDay.keys()].sort((a, b) => a - b)) {
    const dayTrades = byDay.get(key)!
    const pnls = dayTrades.map(t => t.pnl || 0)
    const pnl = pnls.reduce((s, p) => s + p, 0)

    // Judged trade by trade, the way the live monitor saw it happen. A day
    // that hit the limit at 10:00 and clawed back by the close still crossed
    // it, and the breach toast already said so at the time.
    let running = 0
    let worstRunning = 0
    // Drawdown is measured from the most recent equity peak, so every fresh
    // slide past the limit counts, not just the first one in the account's life.
    const drawdownBefore = peak - cumulative
    let worstDrawdownToday = drawdownBefore
    for (const p of pnls) {
      running += p
      if (running < worstRunning) worstRunning = running
      cumulative += p
      if (cumulative > peak) peak = cumulative
      const dd = peak - cumulative
      if (dd > worstDrawdownToday) worstDrawdownToday = dd
    }

    const brokenRuleTypes: RiskRule['type'][] = []

    const dayLossLimit = limitFor('maxLossPerDay')
    if (dayLossLimit > 0 && -worstRunning > dayLossLimit) {
      brokenRuleTypes.push('maxLossPerDay')
    }

    const tradeLossLimit = limitFor('maxLossPerTrade')
    if (tradeLossLimit > 0 && Math.abs(Math.min(0, ...pnls)) > tradeLossLimit) {
      brokenRuleTypes.push('maxLossPerTrade')
    }

    // Crossed on this day, not merely still under water from an earlier one.
    const drawdownLimit = limitFor('maxDrawdown')
    if (drawdownLimit > 0 && worstDrawdownToday > drawdownLimit && drawdownBefore <= drawdownLimit) {
      brokenRuleTypes.push('maxDrawdown')
    }

    days.push({ date: new Date(key), pnl, brokenRuleTypes })
  }

  const followedDays = days.filter(d => d.brokenRuleTypes.length === 0)
  const brokenDays = days.filter(d => d.brokenRuleTypes.length > 0)

  return {
    followed: bucketOf(followedDays),
    broken: bucketOf(brokenDays),
    days,
    comparable:
      active.length > 0 &&
      followedDays.length >= MIN_ADHERENCE_DAYS &&
      brokenDays.length >= MIN_ADHERENCE_DAYS,
  }
}
