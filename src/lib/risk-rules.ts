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
