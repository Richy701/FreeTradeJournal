import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { useUserStorage } from '@/utils/user-storage'
import { useDemoGuard } from '@/hooks/use-demo-guard'
import { useDemoData } from '@/hooks/use-demo-data'
import { getChangeVersion, onSyncChange } from '@/contexts/sync-context'
import { Target, Gauge, Warning, Fire, CurrencyDollar, Percent, Lightning, Scales, ChartLine, Calendar, CalendarDots, Pen, Check, Trash, ArrowSquareOut, type Icon } from '@phosphor-icons/react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { toast } from 'sonner'
import { trackEvent } from '@/lib/analytics'
import { computeGoalProgress, computeGoalHistory, currentPeriodStart, getGoalLabel, type TradingGoal } from '@/lib/goal-progress'
import { evaluateRiskRules, getRuleLabel, type RiskRule, type RuleStatus } from '@/lib/risk-rules'
import type { PropFirmAccount } from '@/types/prop-tracker'

type Goal = TradingGoal

// Amber for "getting close to a cap" — risk bars only. Goals never use it:
// being near a TARGET is progress (theme primary), not a warning.
const WARN_COLOR = '#f59e0b'

// One-time migration of stored data into the current model:
//  - drop the dead rule types (maxRiskPerTrade, maxOpenTrades)
//  - convert maxLoss / maxDrawdown *goals* into risk limits
function migrateStored(rawGoals: string | null, rawRules: string | null) {
  let goals: any[] = []
  let rules: any[] = []
  try { goals = rawGoals ? JSON.parse(rawGoals) : [] } catch { /* corrupted */ }
  try { rules = rawRules ? JSON.parse(rawRules) : [] } catch { /* corrupted */ }
  let changed = false

  const keptRules = rules.filter((r: any) => {
    if (r.type === 'maxRiskPerTrade' || r.type === 'maxOpenTrades') { changed = true; return false }
    return true
  })

  const keptGoals: any[] = []
  for (const g of goals) {
    if (g.type === 'maxLoss') {
      changed = true
      if (!keptRules.some((r: any) => r.type === 'maxLossPerDay')) {
        keptRules.push({ id: `mig-${g.id}`, type: 'maxLossPerDay', value: g.target, enabled: true, violations: 0 })
      }
    } else if (g.type === 'maxDrawdown') {
      changed = true
      if (!keptRules.some((r: any) => r.type === 'maxDrawdown')) {
        keptRules.push({ id: `mig-${g.id}`, type: 'maxDrawdown', value: g.target, enabled: true, violations: 0 })
      }
    } else {
      keptGoals.push(g)
    }
  }

  return { goals: keptGoals, rules: keptRules, changed }
}

// Round up to a "nice" target number (1 / 2 / 2.5 / 5 steps per decade).
function niceCeil(x: number): number {
  if (x <= 0) return 0
  const mag = Math.pow(10, Math.floor(Math.log10(x)))
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (mag * step >= x) return mag * step
  }
  return mag * 10
}

interface GoalSuggestion {
  type: Goal['type']
  period: Goal['period']
  target: number
  headline: string
  detail: string
}

// Starter goals derived from the trader's own history, shown in the empty
// state so the first goal is one click instead of a blank form. Only offered
// once there's enough history to say something honest about.
function computeGoalSuggestions(trades: { pnl?: unknown; exitTime: Date }[], sym: string): GoalSuggestion[] {
  if (trades.length < 5) return []
  const out: GoalSuggestion[] = []

  const byMonth = new Map<string, number>()
  const weeks = new Set<number>()
  let wins = 0
  for (const t of trades) {
    const pnl = Number(t.pnl) || 0
    const d = new Date(t.exitTime)
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`
    byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + pnl)
    weeks.add(Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000)))
    if (pnl > 0) wins++
  }

  const avgMonth = [...byMonth.values()].reduce((a, b) => a + b, 0) / byMonth.size
  if (avgMonth > 0) {
    const target = niceCeil(avgMonth * 1.15)
    out.push({
      type: 'profit',
      period: 'monthly',
      target,
      headline: `Your average month is +${sym}${Math.round(avgMonth).toLocaleString()}`,
      detail: `Beat it with a ${sym}${target.toLocaleString()} monthly profit target.`,
    })
  }

  const winRate = (wins / trades.length) * 100
  if (trades.length >= 10 && winRate >= 30 && winRate < 65) {
    const target = Math.min(70, Math.ceil((winRate + 5) / 5) * 5)
    out.push({
      type: 'winRate',
      period: 'weekly',
      target,
      headline: `You win ${winRate.toFixed(0)}% of your trades`,
      detail: `Aim for ${target}% each week by skipping the setups you already know are marginal.`,
    })
  }

  const avgPerWeek = trades.length / Math.max(1, weeks.size)
  if (avgPerWeek >= 2) {
    const target = Math.max(3, Math.round(avgPerWeek))
    out.push({
      type: 'trades',
      period: 'weekly',
      target,
      headline: `You average ${Math.round(avgPerWeek)} trades a week`,
      detail: `A steady ${target}-trade week keeps you showing up without overtrading.`,
    })
  }

  return out.slice(0, 3)
}

function getRuleIcon(type: string): Icon {
  const icons: Record<string, Icon> = {
    maxLossPerDay: Fire,
    maxLossPerTrade: Warning,
    maxDrawdown: ChartLine
  }
  return icons[type] || Target
}

// The main value + target, formatted per goal type.
function formatGoalValue(type: Goal['type'], value: number, sym: string): string {
  switch (type) {
    case 'profit': return `${sym}${Math.round(value).toLocaleString()}`
    case 'winRate': return `${value.toFixed(1)}%`
    case 'riskReward': return `${value.toFixed(2)}:1`
    case 'trades':
    default: return `${Math.round(value)}`
  }
}

function formatGoalTarget(type: Goal['type'], target: number, sym: string): string {
  switch (type) {
    case 'profit': return `${sym}${target.toLocaleString()}`
    case 'winRate': return `${target}%`
    case 'riskReward': return `${target}:1`
    case 'trades':
    default: return `${target} trades`
  }
}

const PERIOD_NOUN: Record<Goal['period'], string> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
}

const GOAL_TYPE_DEFAULTS: Record<Goal['type'], number> = {
  profit: 1000,
  winRate: 65,
  trades: 15,
  riskReward: 1.5,
}

// Quick-pick targets shown under the input, per goal type.
const GOAL_TARGET_CHIPS: Record<Goal['type'], number[]> = {
  profit: [100, 250, 500, 1000, 2500],
  winRate: [50, 55, 60, 65, 70],
  trades: [5, 10, 20, 50],
  riskReward: [1.5, 2, 2.5, 3],
}

// Quick-pick limit values sized from the trader's account (falls back to
// round numbers when no account size is set in Settings).
function ruleValueChips(type: RiskRule['type'], accountSize: number): Array<{ value: number; note?: string }> {
  if (accountSize > 0) {
    const pcts = type === 'maxLossPerTrade' ? [0.5, 1, 2] : type === 'maxLossPerDay' ? [1, 2, 3, 5] : [5, 10, 15]
    return pcts.map(p => ({ value: Math.round((accountSize * p) / 100), note: `${p}%` }))
  }
  return [100, 250, 500, 1000].map(value => ({ value }))
}

export function PerformanceGoals() {
  const { themeColors, alpha } = useThemePresets()
  const { settings, formatCurrency, getCurrencySymbol } = useSettings()
  const currencySymbol = getCurrencySymbol()
  const userStorage = useUserStorage()
  const demoGuard = useDemoGuard()
  const { getTrades } = useDemoData()
  // Re-read storage when sync (or a local write, including the app-wide
  // breach monitor's violation counts) bumps the change version.
  const [dataVersion, setDataVersion] = useState(() => getChangeVersion())
  useEffect(() => onSyncChange(() => setDataVersion(getChangeVersion())), [])
  const [goals, setGoals] = useState<Goal[]>([])
  const [riskRules, setRiskRules] = useState<RiskRule[]>([])
  const [propAccounts, setPropAccounts] = useState<PropFirmAccount[]>([])
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null)
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<RiskRule | null>(null)
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    type: 'profit',
    period: 'monthly',
    target: 1000
  })

  // Load goals and risk rules from user-scoped storage, migrating any legacy
  // shapes. No seeded defaults: a fresh account gets the suggestions flow
  // (goals derived from their own trades), not two targets they never chose.
  useEffect(() => {
    const rawGoals = userStorage.getItem('tradingGoals')
    const rawRules = userStorage.getItem('riskRules')
    const m = migrateStored(rawGoals, rawRules)

    setGoals(m.goals.map((g: any) => ({
      ...g,
      createdAt: new Date(g.createdAt),
      achievedAt: g.achievedAt ? new Date(g.achievedAt) : undefined
    })))
    setRiskRules(m.rules)

    if (m.changed) {
      userStorage.setItem('tradingGoals', JSON.stringify(m.goals))
      userStorage.setItem('riskRules', JSON.stringify(m.rules))
    }

    try {
      const rawProp = userStorage.getItem('propFirmAccounts')
      setPropAccounts(rawProp ? JSON.parse(rawProp) : [])
    } catch {
      setPropAccounts([])
    }
    // dataVersion: re-read after a cloud-sync pull so goals/rules edited on
    // another device show up without a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion])

  // Trades via useDemoData: demo-aware AND scoped to the active account.
  const trades = useMemo(() => {
    try {
      return getTrades().map((trade: any) => ({
        ...trade,
        exitTime: trade.exitTime ? new Date(trade.exitTime) : new Date()
      }))
    } catch {
      return []
    }
  }, [getTrades, dataVersion])

  const goalProgress = useMemo(() => computeGoalProgress(goals, trades), [goals, trades])

  // Empty-state goal suggestions from the trader's own trade history.
  const goalSuggestions = useMemo(
    () => (goalProgress.length === 0 ? computeGoalSuggestions(trades, currencySymbol) : []),
    [goalProgress.length, trades, currencySymbol]
  )
  const suggestionsShownRef = useRef(false)
  useEffect(() => {
    if (goalSuggestions.length > 0 && !suggestionsShownRef.current) {
      suggestionsShownRef.current = true
      trackEvent('goal_suggestions_shown', { count: goalSuggestions.length })
    }
  }, [goalSuggestions.length])

  // Celebrate a goal the first time it's achieved within the current period.
  // `achievedAt` is the dedup record — achievement itself is computed live
  // and resets naturally when the period rolls over.
  useEffect(() => {
    const newlyAchieved = goalProgress.filter(gp => {
      if (!gp.achieved) return false
      const at = gp.achievedAt ? new Date(gp.achievedAt) : null
      return !at || at < currentPeriodStart(gp.period)
    })
    if (newlyAchieved.length === 0) return

    newlyAchieved.forEach(g => {
      toast.success('Goal achieved', {
        description: `You hit your ${g.period} target of ${formatGoalTarget(g.type, g.target, currencySymbol)}.`,
        duration: 7000
      })
    })
    setGoals(prev => {
      const updated = prev.map(g =>
        newlyAchieved.some(n => n.id === g.id) ? { ...g, achievedAt: new Date() } : g
      )
      userStorage.setItem('tradingGoals', JSON.stringify(updated))
      return updated
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalProgress])

  // Build and save a goal directly (used by presets so we don't depend on
  // async state updates landing first).
  const createGoal = (data: { type: Goal['type']; period: Goal['period']; target: number }) => {
    if (demoGuard('create goals')) return
    if (!data.target || data.target <= 0) return

    const goal: Goal = {
      id: Date.now().toString(),
      type: data.type,
      period: data.period,
      target: data.target,
      createdAt: new Date()
    }

    const updatedGoals = [...goals, goal]
    setGoals(updatedGoals)
    userStorage.setItem('tradingGoals', JSON.stringify(updatedGoals))
    setShowGoalDialog(false)
    setEditingGoal(null)

    trackEvent('goal_created', { type: goal.type, period: goal.period })
    toast.success('Goal Added', {
      description: `New ${goal.period} ${getGoalLabel(goal.type).toLowerCase()} target set.`
    })
  }

  const saveGoal = () => {
    if (demoGuard('manage goals')) return
    if (!newGoal.target || newGoal.target <= 0) return

    if (editingGoal) {
      const updatedGoals = goals.map(g =>
        g.id === editingGoal.id
          ? { ...g, type: newGoal.type as Goal['type'], period: newGoal.period as Goal['period'], target: newGoal.target as number, achievedAt: undefined }
          : g
      )
      setGoals(updatedGoals)
      userStorage.setItem('tradingGoals', JSON.stringify(updatedGoals))
      setShowGoalDialog(false)
      setEditingGoal(null)
      toast.success('Goal Updated', {
        description: `${getGoalLabel(newGoal.type as string)} target updated.`
      })
    } else {
      createGoal({
        type: newGoal.type as Goal['type'],
        period: newGoal.period as Goal['period'],
        target: newGoal.target as number
      })
    }
  }

  const openAddGoal = () => {
    trackEvent('goal_dialog_opened')
    setEditingGoal(null)
    setNewGoal({ type: 'profit', period: 'monthly', target: 1000 })
    setShowGoalDialog(true)
  }

  const openEditGoal = (goal: Goal) => {
    if (demoGuard('manage goals')) return
    setEditingGoal(goal)
    setNewGoal({ type: goal.type, period: goal.period, target: goal.target })
    setShowGoalDialog(true)
  }

  const deleteGoal = (id: string) => {
    const updatedGoals = goals.filter(g => g.id !== id)
    setGoals(updatedGoals)
    userStorage.setItem('tradingGoals', JSON.stringify(updatedGoals))
    setDeletingGoal(null)
  }

  const toggleRiskRule = (id: string) => {
    if (demoGuard('manage risk rules')) return
    const updatedRules = riskRules.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    )
    setRiskRules(updatedRules)
    userStorage.setItem('riskRules', JSON.stringify(updatedRules))
  }

  const updateRiskRule = (rule: RiskRule) => {
    if (demoGuard('manage risk rules')) return
    if (!rule.value || rule.value <= 0) {
      toast.warning('Enter a value greater than zero.')
      return
    }
    let updatedRules: RiskRule[]
    const existingRule = riskRules.find(r => r.id === rule.id)

    if (existingRule) {
      updatedRules = riskRules.map(r => r.id === rule.id ? rule : r)
    } else {
      updatedRules = [...riskRules, rule]
    }

    setRiskRules(updatedRules)
    userStorage.setItem('riskRules', JSON.stringify(updatedRules))
    setEditingRule(null)
    setShowRuleDialog(false)

    toast.success(existingRule ? 'Risk Limit Updated' : 'Risk Limit Added', {
      description: `${getRuleLabel(rule.type)} set to ${currencySymbol}${rule.value}.`
    })
  }

  const openAddRule = () => {
    setEditingRule({
      id: Date.now().toString(),
      type: 'maxLossPerDay',
      value: 100,
      enabled: true,
      violations: 0
    })
    setShowRuleDialog(true)
  }

  const getPeriodIcon = (period: string): Icon => {
    switch (period) {
      case 'weekly': return CalendarDots
      default: return Calendar
    }
  }

  // ── Risk status (single source = shared evaluator, same math as the
  //    app-wide breach monitor) ──
  const ruleStatuses = useMemo(() => evaluateRiskRules(riskRules, trades), [riskRules, trades])
  const enabledStatuses = ruleStatuses.filter(s => s.rule.enabled)
  const totalViolations = riskRules.reduce((s, r) => s + (r.violations || 0), 0)
  const anyBreached = enabledStatuses.some(s => s.breached) || totalViolations > 0
  const maxPct = enabledStatuses.length > 0 ? Math.max(...enabledStatuses.map(s => s.pct)) : 0

  const riskStatus = anyBreached
    ? { label: 'Limit breached today', color: themeColors.loss }
    : maxPct >= 75
      ? { label: 'Getting close', color: WARN_COLOR }
      : { label: 'All clear today', color: themeColors.profit }

  // Per-trade risk facts (single source of truth = Settings)
  const accountSize = settings.accountSize || 0
  const riskPerTrade = settings.riskPerTrade || 0
  const maxRiskDollars = (accountSize * riskPerTrade) / 100
  const tradesToBlow = riskPerTrade > 0 ? Math.round(100 / riskPerTrade) : 0
  const riskTone = riskPerTrade <= 2 ? themeColors.profit : riskPerTrade <= 4 ? themeColors.primary : themeColors.loss

  const activePropAccounts = propAccounts.filter(
    a => a.status === 'active' && a.challengeRules && (a.challengeRules.maxTotalDrawdown > 0 || a.challengeRules.maxDailyDrawdown > 0)
  )

  const achievedCount = goalProgress.filter(g => g.achieved).length
  const primaryButtonStyle = { backgroundColor: themeColors.primary, color: themeColors.primaryButtonText || '#fff' }

  const barColorFor = (pct: number) =>
    pct >= 90 ? themeColors.loss : pct >= 60 ? WARN_COLOR : themeColors.profit

  return (
    <div className="space-y-10">

      {/* ───────────────────────── Risk ───────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-base font-semibold">Risk</h2>
            {riskRules.length > 0 && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ color: riskStatus.color, backgroundColor: alpha(riskStatus.color, '12') }}
              >
                <Gauge className="h-3 w-3" />
                {riskStatus.label}
              </span>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={openAddRule}>
            Add Limit
          </Button>
        </div>

        {riskRules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/30 py-10 px-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: alpha(themeColors.primary, '10') }}>
              <Gauge className="h-6 w-6" style={{ color: themeColors.primary }} />
            </div>
            <h3 className="text-sm font-semibold mb-1">No risk limits yet</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-5">
              Cap your daily loss, per-trade loss, or drawdown. You get an alert the moment a trade crosses one, anywhere in the app.
            </p>
            <Button size="sm" variant="outline" onClick={openAddRule}>
              Create your first limit
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ruleStatuses.map(({ rule, current, pct, breached }: RuleStatus) => {
              const RuleIcon = getRuleIcon(rule.type)
              const barColor = breached ? themeColors.loss : barColorFor(pct)
              return (
                <div
                  key={rule.id}
                  className={`rounded-lg border border-border bg-card flex flex-col p-4 gap-3 ${rule.enabled ? '' : 'opacity-55'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <RuleIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{getRuleLabel(rule.type)}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground"
                        onClick={() => { setEditingRule(rule); setShowRuleDialog(true) }}
                        aria-label="Edit limit"
                      >
                        <Pen className="h-3.5 w-3.5" />
                      </Button>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRiskRule(rule.id)}
                        aria-label={`${getRuleLabel(rule.type)} enabled`}
                      />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-2xl font-bold tabular-nums" style={breached ? { color: themeColors.loss } : undefined}>
                      {currencySymbol}{Math.round(current).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {currencySymbol}{rule.value.toLocaleString()}
                    </span>
                    {(rule.violations || 0) > 0 && (
                      <Badge
                        className="ml-auto text-[10px] font-medium"
                        style={{
                          backgroundColor: alpha(themeColors.loss, '15'),
                          color: themeColors.loss,
                          border: `1px solid ${alpha(themeColors.loss, '25')}`
                        }}
                      >
                        {rule.violations} breach{rule.violations !== 1 ? 'es' : ''} today
                      </Badge>
                    )}
                  </div>

                  <div className="mt-auto h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: rule.enabled ? `${Math.max(pct, 1)}%` : '0%', backgroundColor: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Per-trade risk facts (sourced from Settings — one place to change it) */}
        <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <p className="text-[11px] text-muted-foreground">Account size</p>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(accountSize, false)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Risk per trade</p>
                <p className="text-sm font-semibold tabular-nums" style={{ color: riskTone }}>{riskPerTrade}%</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Max risk / trade</p>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(maxRiskDollars, false)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Losers to blow account</p>
                <p className="text-sm font-semibold tabular-nums">{tradesToBlow || '—'}</p>
              </div>
            </div>
            <Link
              to="/settings"
              className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: themeColors.primary }}
            >
              Adjust in Settings
              <ArrowSquareOut className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Prop firm limits — read-only reference from Prop Tracker */}
        {activePropAccounts.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Prop firm limits</p>
              <Link
                to="/prop-tracker"
                className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: themeColors.primary }}
              >
                Manage in Prop Tracker
                <ArrowSquareOut className="h-3 w-3" />
              </Link>
            </div>
            {activePropAccounts.map(acc => (
              <div key={acc.id} className="rounded-lg border border-border bg-card/50 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{acc.firmName}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">
                    {formatCurrency(acc.accountSize, false)} · {acc.accountType}
                  </p>
                </div>
                <div className="flex gap-5 text-right shrink-0">
                  {acc.challengeRules!.maxDailyDrawdown > 0 && (
                    <div>
                      <p className="text-[11px] text-muted-foreground">Daily DD</p>
                      <p className="text-sm font-semibold tabular-nums">{acc.challengeRules!.maxDailyDrawdown}%</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] text-muted-foreground">Total DD</p>
                    <p className="text-sm font-semibold tabular-nums">{acc.challengeRules!.maxTotalDrawdown}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ───────────────────────── Goals ───────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2.5 min-w-0">
            <h2 className="text-base font-semibold">Goals</h2>
            {goalProgress.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {achievedCount} of {goalProgress.length} hit this period
              </span>
            )}
          </div>
          <Button size="sm" onClick={openAddGoal} style={primaryButtonStyle}>
            Add Goal
          </Button>
        </div>

        {goalProgress.length === 0 ? (
          goalSuggestions.length > 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-card/30 py-8 px-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: alpha(themeColors.primary, '10') }}>
                  <Target className="h-6 w-6" style={{ color: themeColors.primary }} />
                </div>
                <h3 className="text-sm font-semibold mb-1">Start from your own numbers</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  These come from your last {trades.length} trades. Pick one to start with — you can change the target any time.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
                {goalSuggestions.map(s => (
                  <div key={s.type} className="rounded-lg border border-border bg-card p-4 flex flex-col">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      {getGoalLabel(s.type)}
                    </span>
                    <p className="text-sm font-semibold mt-1.5">{s.headline}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex-1">{s.detail}</p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        trackEvent('goal_suggestion_accepted', { type: s.type, period: s.period })
                        createGoal({ type: s.type, period: s.period, target: s.target })
                      }}
                      style={primaryButtonStyle}
                    >
                      Set this goal
                    </Button>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={openAddGoal}>
                  or create your own
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-card/30 py-12 px-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: alpha(themeColors.primary, '10') }}>
                <Target className="h-6 w-6" style={{ color: themeColors.primary }} />
              </div>
              <h3 className="text-sm font-semibold mb-1">No goals set yet</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-5">
                Goals give your trading direction. Set a profit target, win rate, or trade count and track your progress over time.
              </p>
              <Button size="sm" onClick={openAddGoal} style={primaryButtonStyle}>
                Set your first goal
              </Button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {goalProgress.map(goal => {
              const progress = Math.min(100, Math.max(0, ((goal.current || 0) / goal.target) * 100))
              const accent = goal.achieved ? themeColors.profit : themeColors.primary
              const history = computeGoalHistory(goal, trades)
              const finished = history.filter(h => !h.inProgress)
              const hitCount = finished.filter(h => h.achieved).length
              const PeriodIcon = getPeriodIcon(goal.period)

              return (
                <div
                  key={goal.id}
                  className="rounded-lg border border-border bg-card flex flex-col p-4 gap-3"
                  style={{
                    borderColor: goal.achieved ? alpha(themeColors.profit, '30') : undefined,
                    backgroundColor: goal.achieved ? alpha(themeColors.profit, '05') : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-sm font-semibold">{getGoalLabel(goal.type)}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 capitalize"
                        style={{ borderColor: alpha(accent, '40'), color: accent }}
                      >
                        <PeriodIcon className="h-2.5 w-2.5 mr-1" />
                        {goal.period}
                      </Badge>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground"
                        onClick={() => openEditGoal(goal)}
                        aria-label="Edit goal"
                      >
                        <Pen className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => { if (!demoGuard('manage goals')) setDeletingGoal(goal) }}
                        aria-label="Delete goal"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tabular-nums" style={goal.achieved ? { color: themeColors.profit } : undefined}>
                      {formatGoalValue(goal.type, goal.current || 0, currencySymbol)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {formatGoalTarget(goal.type, goal.target, currencySymbol)}
                    </span>
                  </div>

                  {goal.achieved && (
                    <div className="flex items-center gap-1.5 text-xs font-medium -mt-1" style={{ color: themeColors.profit }}>
                      <Check className="h-3.5 w-3.5" />
                      Hit this {PERIOD_NOUN[goal.period]}
                    </div>
                  )}

                  <div className="mt-auto space-y-2.5">
                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(progress, 1)}%`, backgroundColor: accent }}
                      />
                    </div>
                    {finished.length >= 2 && (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {history.map((h, i) => (
                            <span
                              key={i}
                              title={h.start.toLocaleDateString()}
                              className="h-2 w-2 rounded-sm"
                              style={{
                                backgroundColor: h.achieved ? themeColors.profit : 'transparent',
                                border: h.achieved ? 'none' : `1px solid ${h.inProgress ? alpha(themeColors.primary, '70') : 'hsl(var(--border))'}`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Hit {hitCount} of last {finished.length} {PERIOD_NOUN[goal.period]}s
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Goal Add/Edit Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={(open) => { setShowGoalDialog(open); if (!open) setEditingGoal(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'New Goal'}</DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Update your target.' : 'Pick what to aim for, how often, and how much.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>What to aim for</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { type: 'profit', label: 'Profit', icon: CurrencyDollar },
                  { type: 'winRate', label: 'Win Rate', icon: Percent },
                  { type: 'trades', label: 'Trades', icon: Lightning },
                  { type: 'riskReward', label: 'R:R', icon: Scales },
                ] as const).map(opt => {
                  const selected = newGoal.type === opt.type
                  const OptIcon = opt.icon
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setNewGoal({ ...newGoal, type: opt.type, target: GOAL_TYPE_DEFAULTS[opt.type] })}
                      className="rounded-lg border px-2 py-2.5 flex flex-col items-center gap-1.5 text-xs font-medium transition-colors"
                      style={selected
                        ? { borderColor: themeColors.primary, backgroundColor: alpha(themeColors.primary, '10'), color: themeColors.primary }
                        : { borderColor: 'hsl(var(--border))' }}
                    >
                      <OptIcon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>How often</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map(p => {
                  const selected = newGoal.period === p
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewGoal({ ...newGoal, period: p })}
                      className="rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-colors"
                      style={selected
                        ? { borderColor: themeColors.primary, backgroundColor: alpha(themeColors.primary, '10'), color: themeColors.primary }
                        : { borderColor: 'hsl(var(--border))' }}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target</Label>
              <div className="relative">
                {newGoal.type === 'profit' && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currencySymbol}</span>
                )}
                <Input
                  type="number"
                  min={0}
                  step={newGoal.type === 'riskReward' ? 0.1 : 1}
                  className={newGoal.type === 'profit' ? 'pl-7 pr-3' : 'pr-12'}
                  value={Number.isFinite(newGoal.target) ? newGoal.target : ''}
                  onChange={(e) => setNewGoal({ ...newGoal, target: parseFloat(e.target.value) })}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newGoal.target && newGoal.target > 0) saveGoal() }}
                  placeholder={String(GOAL_TYPE_DEFAULTS[newGoal.type || 'profit'])}
                />
                {newGoal.type !== 'profit' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {newGoal.type === 'winRate' ? '%' : newGoal.type === 'riskReward' ? ':1' : 'trades'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_TARGET_CHIPS[newGoal.type || 'profit'].map(v => {
                  const selected = newGoal.target === v
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setNewGoal({ ...newGoal, target: v })}
                      className="rounded-full border px-2.5 py-1 text-xs tabular-nums transition-colors"
                      style={selected
                        ? { borderColor: themeColors.primary, backgroundColor: alpha(themeColors.primary, '10'), color: themeColors.primary }
                        : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                    >
                      {formatGoalTarget((newGoal.type || 'profit') as Goal['type'], v, currencySymbol)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowGoalDialog(false); setEditingGoal(null) }}>
              Cancel
            </Button>
            <Button onClick={saveGoal} disabled={!newGoal.target || newGoal.target <= 0} style={primaryButtonStyle}>
              {editingGoal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Goal confirm (replaces the native window.confirm) */}
      <Dialog open={!!deletingGoal} onOpenChange={(open) => { if (!open) setDeletingGoal(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this goal?</DialogTitle>
            <DialogDescription>
              {deletingGoal ? `Your ${deletingGoal.period} ${getGoalLabel(deletingGoal.type).toLowerCase()} target will be removed.` : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingGoal(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deletingGoal && deleteGoal(deletingGoal.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Risk Limit Edit Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={(open) => { setShowRuleDialog(open); if (!open) setEditingRule(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{riskRules.some(r => r.id === editingRule?.id) ? 'Edit' : 'Add'} Risk Limit</DialogTitle>
            <DialogDescription>
              Set a cap and we'll warn you when your trades cross it.
            </DialogDescription>
          </DialogHeader>
          {editingRule && (
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label>Limit type</Label>
                <div className="space-y-2">
                  {([
                    { type: 'maxLossPerDay', desc: "The most you'll let yourself lose in one day" },
                    { type: 'maxLossPerTrade', desc: 'The most a single trade is allowed to lose' },
                    { type: 'maxDrawdown', desc: 'How far your balance can fall from its peak' },
                  ] as const).map(opt => {
                    const selected = editingRule.type === opt.type
                    const OptIcon = getRuleIcon(opt.type)
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setEditingRule({ ...editingRule, type: opt.type })}
                        className="w-full rounded-lg border px-3 py-2.5 flex items-center gap-3 text-left transition-colors"
                        style={selected
                          ? { borderColor: themeColors.primary, backgroundColor: alpha(themeColors.primary, '08') }
                          : { borderColor: 'hsl(var(--border))' }}
                      >
                        <OptIcon className="h-4 w-4 shrink-0" style={{ color: selected ? themeColors.primary : 'hsl(var(--muted-foreground))' }} />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium" style={selected ? { color: themeColors.primary } : undefined}>
                            {getRuleLabel(opt.type)}
                          </span>
                          <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Limit</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currencySymbol}</span>
                  <Input
                    type="number"
                    min={0}
                    className="pl-7"
                    value={Number.isFinite(editingRule.value) ? editingRule.value : ''}
                    onChange={(e) => setEditingRule({ ...editingRule, value: parseFloat(e.target.value) })}
                    onKeyDown={(e) => { if (e.key === 'Enter' && editingRule.value > 0) updateRiskRule(editingRule) }}
                    placeholder="250"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ruleValueChips(editingRule.type, accountSize).map(chip => {
                    const selected = editingRule.value === chip.value
                    return (
                      <button
                        key={chip.value}
                        type="button"
                        onClick={() => setEditingRule({ ...editingRule, value: chip.value })}
                        className="rounded-full border px-2.5 py-1 text-xs tabular-nums transition-colors"
                        style={selected
                          ? { borderColor: themeColors.primary, backgroundColor: alpha(themeColors.primary, '10'), color: themeColors.primary }
                          : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                      >
                        {currencySymbol}{chip.value.toLocaleString()}{chip.note ? ` · ${chip.note}` : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
              {riskRules.some(r => r.id === editingRule.id) && (
                <div className="flex items-center justify-between">
                  <Label>Enable Limit</Label>
                  <Switch
                    checked={editingRule.enabled}
                    onCheckedChange={(checked) => setEditingRule({ ...editingRule, enabled: checked })}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRuleDialog(false)
              setEditingRule(null)
            }}>
              Cancel
            </Button>
            <Button onClick={() => editingRule && updateRiskRule(editingRule)} style={primaryButtonStyle}>
              Save Limit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
