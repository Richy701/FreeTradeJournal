import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { useUserStorage } from '@/utils/user-storage'
import { useDemoGuard } from '@/hooks/use-demo-guard'
import { useDemoData } from '@/hooks/use-demo-data'
import { getChangeVersion, onSyncChange } from '@/contexts/sync-context'
import { Target, Trophy, ChartLineUp, Gauge, Warning, Medal, Fire, Star, CurrencyDollar, Percent, Lightning, Scales, ChartLine, Calendar, CalendarDots, ArrowCounterClockwise, Pen, Check, Trash, ArrowSquareOut, type Icon } from '@phosphor-icons/react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from 'sonner'
import { trackEvent } from '@/lib/analytics'
import { computeGoalProgress } from '@/lib/goal-progress'
import type { PropFirmAccount } from '@/types/prop-tracker'

// Goals are *targets* only — things you want to hit. Loss/drawdown protection
// lives under Risk Limits, not here.
interface Goal {
  id: string
  type: 'profit' | 'winRate' | 'trades' | 'riskReward'
  period: 'daily' | 'weekly' | 'monthly'
  target: number
  current?: number
  achieved?: boolean
  createdAt: Date
  achievedAt?: Date
}

// Risk limits that actually evaluate against trade data. The two former
// no-op rule types (maxRiskPerTrade %, maxOpenTrades) were removed.
interface RiskRule {
  id: string
  type: 'maxLossPerDay' | 'maxLossPerTrade' | 'maxDrawdown'
  value: number
  enabled: boolean
  violations?: number
}

// Local day, matching how the rest of the app buckets days (a UTC key would
// reset breach counters at UTC midnight, mid-session for US traders).
const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// One-time migration of stored data into the new model:
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

// Helper: human-readable goal label
function getGoalLabel(type: string): string {
  const labels: Record<string, string> = {
    profit: 'Profit Target',
    winRate: 'Win Rate',
    trades: 'Trade Count',
    riskReward: 'Risk/Reward'
  }
  return labels[type] || type
}

// Helper: format current value for display
function formatCurrentValue(goal: { type: string; current?: number }, sym: string): string {
  const val = goal.current ?? 0
  switch (goal.type) {
    case 'profit':
      return `${sym}${val.toFixed(0)}`
    case 'winRate':
      return `${val.toFixed(1)}%`
    case 'riskReward':
      return `${val.toFixed(2)}:1`
    case 'trades':
      return `${val}`
    default:
      return `${val}`
  }
}

// Helper: icon for risk rule type
function getRuleIcon(type: string): Icon {
  const icons: Record<string, Icon> = {
    maxLossPerDay: Fire,
    maxLossPerTrade: Warning,
    maxDrawdown: ChartLine
  }
  return icons[type] || Target
}

function getRuleLabel(type: string) {
  const labels: Record<string, string> = {
    maxLossPerDay: 'Max Daily Loss',
    maxLossPerTrade: 'Max Loss Per Trade',
    maxDrawdown: 'Max Drawdown'
  }
  return labels[type] || type
}

// Peak-to-trough drawdown across all trades (ordered by exit time).
function computeMaxDrawdown(trades: any[]): number {
  const ordered = [...trades].sort((a, b) =>
    new Date(a.exitTime).getTime() - new Date(b.exitTime).getTime()
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

// Circular progress ring component
function CircularProgress({ percentage, size = 64, strokeWidth = 6, color, achieved }: {
  percentage: number
  size?: number
  strokeWidth?: number
  color: string
  achieved: boolean
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/50"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {achieved ? (
          <Check className="h-5 w-5" style={{ color }} />
        ) : (
          <span className="text-sm font-bold" style={{ color }}>{Math.round(percentage)}%</span>
        )}
      </div>
    </div>
  )
}

export function PerformanceGoals() {
  const { themeColors, alpha } = useThemePresets()
  const { settings, formatCurrency, getCurrencySymbol } = useSettings()
  const currencySymbol = getCurrencySymbol()
  const userStorage = useUserStorage()
  const demoGuard = useDemoGuard()
  const { getTrades, isDemo } = useDemoData()
  // Re-read storage when sync (or a local write) bumps the change version, so
  // goal/risk progress reflects trades added/edited elsewhere without a reload.
  const [dataVersion, setDataVersion] = useState(() => getChangeVersion())
  useEffect(() => onSyncChange(() => setDataVersion(getChangeVersion())), [])
  const [goals, setGoals] = useState<Goal[]>([])
  const [riskRules, setRiskRules] = useState<RiskRule[]>([])
  const [propAccounts, setPropAccounts] = useState<PropFirmAccount[]>([])
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<RiskRule | null>(null)
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    type: 'profit',
    period: 'monthly',
    target: 1000
  })

  // Celebrate achievement with toast notification
  const celebrateAchievement = (goal: Goal) => {
    const messages: Record<string, string> = {
      profit: 'Profit target achieved!',
      winRate: 'Win rate goal reached!',
      trades: 'Trade count target hit!',
      riskReward: 'Risk/Reward goal achieved!'
    }

    toast.success(messages[goal.type] || 'Goal achieved!', {
      description: `You've achieved your ${goal.period} target of ${formatTarget(goal)}!`,
      duration: 7000
    })
  }

  const formatTarget = (goal: Goal) => {
    switch (goal.type) {
      case 'profit':
        return `${currencySymbol}${goal.target}`
      case 'winRate':
        return `${goal.target}%`
      case 'trades':
        return `${goal.target} trades`
      case 'riskReward':
        return `${goal.target}:1 R:R`
      default:
        return `${goal.target}`
    }
  }

  // Load goals and risk rules from user-scoped storage, migrating any legacy
  // shapes into the new model and resetting violation counters daily.
  useEffect(() => {
    const rawGoals = userStorage.getItem('tradingGoals')
    const rawRules = userStorage.getItem('riskRules')

    let baseGoals: any[]
    let baseRules: any[]
    let needPersist = false
    let isSeed = false

    if (rawGoals === null && rawRules === null) {
      isSeed = true
      baseGoals = [
        { id: '1', type: 'profit', period: 'monthly', target: 1000, createdAt: new Date().toISOString() },
        { id: '2', type: 'winRate', period: 'weekly', target: 60, createdAt: new Date().toISOString() }
      ]
      baseRules = [
        { id: '1', type: 'maxLossPerDay', value: 100, enabled: true, violations: 0 }
      ]
      needPersist = true
    } else {
      const m = migrateStored(rawGoals, rawRules)
      baseGoals = m.goals
      baseRules = m.rules
      needPersist = m.changed
    }

    // Reset violation counters on a new day so the badge stays meaningful.
    const today = todayKey()
    const lastDate = userStorage.getItem('riskRulesViolationDate')
    if (lastDate !== today) {
      if (baseRules.some((r: any) => (r.violations || 0) > 0)) needPersist = true
      baseRules = baseRules.map((r: any) => ({ ...r, violations: 0 }))
      userStorage.setItem('riskRulesViolationDate', today)
    }

    setGoals(baseGoals.map((g: any) => ({
      ...g,
      createdAt: new Date(g.createdAt),
      achievedAt: g.achievedAt ? new Date(g.achievedAt) : undefined
    })))
    setRiskRules(baseRules)

    // Demo mode is read-only — show the defaults without seeding storage.
    // Seeded defaults write with skipSync: pushing them could overwrite the
    // user's REAL cloud goals on a fresh device before the initial sync pull.
    // They sync naturally on the user's first real edit.
    if (needPersist && !isDemo) {
      userStorage.setItem('tradingGoals', JSON.stringify(baseGoals), isSeed)
      userStorage.setItem('riskRules', JSON.stringify(baseRules), isSeed)
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

  // Trades via useDemoData: demo-aware AND scoped to the active account (the
  // raw localStorage read mixed every account's trades into goal progress).
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

  // Calculate goal progress (pure — no side effects in render). Shared with
  // the Profile "Active Goals" widget so both surfaces show the same numbers.
  const goalProgress = useMemo(() => computeGoalProgress(goals, trades), [goals, trades])

  // Detect *newly* achieved goals and celebrate + persist (side effect lives
  // here, not inside the render-time useMemo above).
  useEffect(() => {
    const newlyAchieved = goalProgress.filter(gp =>
      gp.achieved && !goals.find(g => g.id === gp.id)?.achieved
    )
    if (newlyAchieved.length === 0) return

    newlyAchieved.forEach(g => celebrateAchievement(g))
    setGoals(prev => {
      const updated = prev.map(g =>
        newlyAchieved.some(n => n.id === g.id)
          ? { ...g, achieved: true, achievedAt: new Date() }
          : g
      )
      userStorage.setItem('tradingGoals', JSON.stringify(updated))
      return updated
    })
  }, [goalProgress])

  // Breach state per rule id from the previous check, so alerts fire on the
  // TRANSITION into breach — not again on every re-render/sync tick while the
  // (often lifetime-scoped) condition still holds. A rule id first seen while
  // already breached is baselined silently instead of toasting on page load.
  const breachStateRef = useRef<Record<string, boolean>>({})

  const checkRiskRules = () => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayTrades = trades.filter((t: any) => t.exitTime >= todayStart)
    const prev = breachStateRef.current
    const next: Record<string, boolean> = {}
    let newBreaches = false

    const updatedRules = riskRules.map(rule => {
      if (!rule.enabled) return rule

      let breached = false
      let description = ''

      switch (rule.type) {
        case 'maxLossPerDay': {
          const todayLoss = Math.abs(Math.min(0, todayTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0)))
          breached = todayLoss > rule.value
          description = `Daily loss limit of ${currencySymbol}${rule.value} exceeded.`
          break
        }
        case 'maxLossPerTrade': {
          // Latest trade by exit time — storage order is NOT chronological
          // (Trade Log appends new trades, the calendar quick-add prepends).
          const latest = trades.reduce(
            (a: any, b: any) => (!a || b.exitTime > a.exitTime ? b : a),
            null
          )
          breached = !!latest && latest.pnl < 0 && Math.abs(latest.pnl) > rule.value
          description = `Trade loss exceeded the ${currencySymbol}${rule.value} limit.`
          break
        }
        case 'maxDrawdown': {
          const dd = computeMaxDrawdown(trades)
          breached = dd > rule.value
          description = `Drawdown of ${currencySymbol}${dd.toFixed(0)} exceeded the ${currencySymbol}${rule.value} limit.`
          break
        }
      }

      next[rule.id] = breached
      if (breached && prev[rule.id] === false) {
        newBreaches = true
        toast.error('Risk Limit Hit', { description, duration: 5000 })
        return { ...rule, violations: (rule.violations || 0) + 1 }
      }
      return rule
    })

    breachStateRef.current = next
    if (newBreaches) {
      setRiskRules(updatedRules)
      userStorage.setItem('riskRules', JSON.stringify(updatedRules))
    }
  }

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
          ? { ...g, type: newGoal.type as Goal['type'], period: newGoal.period as Goal['period'], target: newGoal.target as number, achieved: false, achievedAt: undefined }
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
    if (demoGuard('manage goals')) return
    const updatedGoals = goals.filter(g => g.id !== id)
    setGoals(updatedGoals)
    userStorage.setItem('tradingGoals', JSON.stringify(updatedGoals))
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
      toast.error('Enter a value greater than zero.')
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

  const resetGoalProgress = (id: string) => {
    if (demoGuard('manage goals')) return

    // If the current period still satisfies the target, clearing the flag
    // would just re-achieve (and re-celebrate) on the next render — explain
    // instead of silently looking broken.
    const goal = goals.find(g => g.id === id)
    if (goal) {
      const live = computeGoalProgress([{ ...goal, achieved: false }], trades)[0]
      if (live?.achieved) {
        toast.info('Target still met this period', {
          description: 'This goal is currently satisfied, so it would immediately re-achieve. It starts fresh when the period rolls over.'
        })
        return
      }
    }

    const updatedGoals = goals.map(g =>
      g.id === id ? { ...g, achieved: false, achievedAt: undefined } : g
    )
    setGoals(updatedGoals)
    userStorage.setItem('tradingGoals', JSON.stringify(updatedGoals))

    toast.info('Goal Reset', {
      description: 'Progress has been reset for this goal.'
    })
  }

  const getPeriodIcon = (period: string): Icon => {
    switch (period) {
      case 'weekly': return CalendarDots
      default: return Calendar
    }
  }

  // Check rules on trade updates and once the rules themselves have loaded.
  // (riskRules is populated asynchronously after mount, so depending on trades
  // alone meant the check ran once against an empty rule set and never again.)
  useEffect(() => {
    checkRiskRules()
  }, [trades, riskRules])

  const achievedGoals = goalProgress.filter(g => g.achieved)

  // ── Account-aware risk math (single source of truth = Settings) ──
  const accountSize = settings.accountSize || 0
  const riskPerTrade = settings.riskPerTrade || 0
  const maxRiskDollars = (accountSize * riskPerTrade) / 100
  const tradesToBlow = riskPerTrade > 0 ? Math.round(100 / riskPerTrade) : 0
  const riskTone = riskPerTrade <= 2 ? themeColors.profit : riskPerTrade <= 4 ? themeColors.primary : themeColors.loss

  const activePropAccounts = propAccounts.filter(
    a => a.status === 'active' && a.challengeRules && (a.challengeRules.maxTotalDrawdown > 0 || a.challengeRules.maxDailyDrawdown > 0)
  )

  // Risk usage helpers (shared by health summary and rule cards)
  const nowForRisk = new Date()
  const riskTodayStart = new Date(nowForRisk.getFullYear(), nowForRisk.getMonth(), nowForRisk.getDate())
  const riskTodayTrades = trades.filter((t: any) => new Date(t.exitTime) >= riskTodayStart)
  const riskTodayLoss = Math.abs(Math.min(0, riskTodayTrades.reduce((s: number, t: any) => s + (t.pnl || 0), 0)))
  // Today's worst single-trade loss (was lifetime worst, which kept the
  // per-trade bar pinned red forever after one bad trade ever).
  const worstTradeLoss = riskTodayTrades.length > 0
    ? Math.abs(Math.min(0, ...riskTodayTrades.map((t: any) => t.pnl || 0)))
    : 0
  const overallDrawdown = computeMaxDrawdown(trades)

  const getRuleCurrent = (rule: RiskRule): number | null => {
    if (rule.type === 'maxLossPerDay') return riskTodayLoss
    if (rule.type === 'maxLossPerTrade') return worstTradeLoss
    if (rule.type === 'maxDrawdown') return overallDrawdown
    return null
  }

  const enabledRules = riskRules.filter(r => r.enabled)
  const ruleUtilizations = enabledRules.map(rule => {
    const current = getRuleCurrent(rule)
    return current !== null ? Math.min(100, (current / rule.value) * 100) : 0
  })
  const avgUtilization = ruleUtilizations.length > 0
    ? Math.round(ruleUtilizations.reduce((a, b) => a + b, 0) / ruleUtilizations.length)
    : 0
  const totalViolations = riskRules.reduce((s, r) => s + (r.violations || 0), 0)
  const healthColor = totalViolations > 0 ? themeColors.loss
    : avgUtilization >= 75 ? '#f59e0b'
    : themeColors.profit

  return (
    <Tabs defaultValue="goals" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 sm:max-w-md">
        <TabsTrigger value="goals">Goals</TabsTrigger>
        <TabsTrigger value="risk">Risk Limits</TabsTrigger>
        <TabsTrigger value="achievements">
          Achievements{achievedGoals.length > 0 ? ` (${achievedGoals.length})` : ''}
        </TabsTrigger>
      </TabsList>

      {/* ───────────────────────── Goals tab ───────────────────────── */}
      <TabsContent value="goals" className="space-y-4 mt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: alpha(themeColors.primary, '12') }}>
              <Target className="h-4 w-4" style={{ color: themeColors.primary }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Performance Goals</h2>
              <p className="text-xs text-muted-foreground">
                {goalProgress.length === 0
                  ? 'Define what you want to achieve as a trader'
                  : `${achievedGoals.length} of ${goalProgress.length} achieved`}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={openAddGoal}
            style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText || '#fff' }}
          >
            Add Goal
          </Button>
        </div>

        {goalProgress.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/30 py-12 px-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: alpha(themeColors.primary, '10') }}>
              <Target className="h-6 w-6" style={{ color: themeColors.primary }} />
            </div>
            <h3 className="text-sm font-semibold mb-1">No goals set yet</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-5">
              Goals give your trading direction. Set a profit target, win rate, or trade count and track your progress over time.
            </p>
            <Button
              size="sm"
              onClick={openAddGoal}
              style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText || '#fff' }}
            >
              Set your first goal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goalProgress.map(goal => {
              const progress = Math.min(100, ((goal.current || 0) / goal.target) * 100)

              const ringColor = goal.achieved
                ? themeColors.profit
                : progress >= 85
                  ? '#f59e0b'
                  : themeColors.primary

              const bgColor = goal.achieved
                ? alpha(themeColors.profit, '08')
                : progress >= 85
                  ? 'rgba(245,158,11,0.06)'
                  : alpha(themeColors.primary, '05')

              const barColor = goal.achieved
                ? themeColors.profit
                : progress >= 85
                  ? '#f59e0b'
                  : themeColors.primary

              return (
                <div
                  key={goal.id}
                  className="group relative rounded-lg border border-border overflow-hidden"
                  style={{ backgroundColor: bgColor }}
                >
                  <div className="flex items-start gap-3 p-3 sm:gap-4 sm:p-4">
                    <CircularProgress
                      percentage={progress}
                      color={ringColor}
                      achieved={goal.achieved || false}
                    />

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {getGoalLabel(goal.type)}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 capitalize"
                          style={{ borderColor: alpha(themeColors.primary, '40'), color: themeColors.primary }}
                        >
                          {(() => { const PeriodIcon = getPeriodIcon(goal.period); return <PeriodIcon className="h-2.5 w-2.5 mr-1" />; })()}
                          {goal.period}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrentValue(goal, currencySymbol)} / {formatTarget(goal)}
                      </div>
                      {goal.achieved && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: themeColors.profit }}>
                          <Trophy className="h-3 w-3" />
                          <span>Achieved {goal.achievedAt ? new Date(goal.achievedAt).toLocaleDateString() : 'today'}!</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {goal.achieved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => resetGoalProgress(goal.id)}
                          title="Reset progress"
                          aria-label="Reset goal"
                        >
                          <ArrowCounterClockwise className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => openEditGoal(goal)}
                        title="Edit goal"
                        aria-label="Edit goal"
                      >
                        <Pen className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:text-destructive"
                        onClick={() => { if (!window.confirm('Are you sure you want to delete this goal?')) return; deleteGoal(goal.id); }}
                        title="Delete goal"
                        aria-label="Delete goal"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-muted/60">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </TabsContent>

      {/* ─────────────────────── Risk Limits tab ─────────────────────── */}
      <TabsContent value="risk" className="space-y-4 mt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: alpha(themeColors.primary, '12') }}>
              <Gauge className="h-4 w-4" style={{ color: themeColors.primary }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Risk Limits</h2>
              <p className="text-xs text-muted-foreground">
                Caps that protect your capital and flag when you break them.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingRule({
                id: Date.now().toString(),
                type: 'maxLossPerDay',
                value: 100,
                enabled: true,
                violations: 0
              })
              setShowRuleDialog(true)
            }}
          >
            Add Limit
          </Button>
        </div>

        {/* Per-trade risk (sourced from Settings — one place to change it) */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-start gap-2">
              <Scales className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Per-trade risk</p>
                <p className="text-[11px] text-muted-foreground">From your account settings</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground">Account size</p>
              <p className="text-sm font-semibold">{formatCurrency(accountSize, false)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Risk per trade</p>
              <p className="text-sm font-semibold" style={{ color: riskTone }}>{riskPerTrade}%</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Max risk / trade</p>
              <p className="text-sm font-semibold">{formatCurrency(maxRiskDollars, false)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Losers to blow account</p>
              <p className="text-sm font-semibold">{tradesToBlow || '—'}</p>
            </div>
          </div>
        </div>

        {/* Risk health summary */}
        {enabledRules.length > 0 && (
          <div className="rounded-lg p-4" style={{ backgroundColor: alpha(healthColor, '08'), border: `1px solid ${alpha(healthColor, '20')}` }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: alpha(healthColor, '15') }}>
                <Gauge className="h-3.5 w-3.5" style={{ color: healthColor }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: healthColor }}>
                  {totalViolations > 0 ? 'Limits Breached' : avgUtilization >= 75 ? 'Approaching Limits' : 'All Clear'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {totalViolations > 0
                    ? `${totalViolations} breach${totalViolations !== 1 ? 'es' : ''} today`
                    : `${avgUtilization}% average usage across ${enabledRules.length} limit${enabledRules.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(avgUtilization, 2)}%`, backgroundColor: healthColor }}
              />
            </div>
          </div>
        )}

        {riskRules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/30 py-10 px-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: alpha(themeColors.primary, '10') }}>
              <Gauge className="h-6 w-6" style={{ color: themeColors.primary }} />
            </div>
            <h3 className="text-sm font-semibold mb-1">No risk limits configured</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-5">
              Set caps on daily loss, per-trade loss, and drawdown. When you cross one, you get notified.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingRule({
                  id: Date.now().toString(),
                  type: 'maxLossPerDay',
                  value: 100,
                  enabled: true,
                  violations: 0
                })
                setShowRuleDialog(true)
              }}
            >
              Create your first limit
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {riskRules.map(rule => {
              const current = getRuleCurrent(rule)
              const pct = current !== null ? Math.min(100, (current / rule.value) * 100) : null
              const barColor = pct === null ? themeColors.primary
                : pct >= 90 ? themeColors.loss
                : pct >= 60 ? '#f59e0b'
                : themeColors.profit

              return (
                <div
                  key={rule.id}
                  className="group rounded-lg border border-border overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRiskRule(rule.id)}
                      />
                      {(() => { const RuleIcon = getRuleIcon(rule.type); return <RuleIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />; })()}
                      <div className="flex flex-wrap items-baseline gap-x-2 min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {getRuleLabel(rule.type)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {currencySymbol}{rule.value}
                        </span>
                        {current !== null && rule.enabled && (
                          <span className="text-xs" style={{ color: barColor }}>
                            {currencySymbol}{current.toFixed(0)} used
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {rule.violations && rule.violations > 0 ? (
                        <Badge
                          className="text-xs font-medium"
                          style={{
                            backgroundColor: alpha(themeColors.loss, '20'),
                            color: themeColors.loss,
                            border: `1px solid ${alpha(themeColors.loss, '30')}`
                          }}
                        >
                          {rule.violations} breach{rule.violations !== 1 ? 'es' : ''}
                        </Badge>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                        onClick={() => {
                          setEditingRule(rule)
                          setShowRuleDialog(true)
                        }}
                        aria-label="Edit limit"
                      >
                        <Pen className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {pct !== null && rule.enabled && (
                    <div className="h-1 w-full bg-muted/60">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Prop firm limits — read-only reference from Prop Tracker */}
        {activePropAccounts.length > 0 && (
          <div className="space-y-2 pt-2">
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
              <div key={acc.id} className="rounded-lg border border-border p-3.5 flex items-center justify-between gap-3">
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
                      <p className="text-sm font-semibold">{acc.challengeRules!.maxDailyDrawdown}%</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] text-muted-foreground">Total DD</p>
                    <p className="text-sm font-semibold">{acc.challengeRules!.maxTotalDrawdown}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      {/* ────────────────────── Achievements tab ────────────────────── */}
      <TabsContent value="achievements" className="space-y-4 mt-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: alpha(themeColors.profit, '12') }}>
            <Trophy className="h-4 w-4" style={{ color: themeColors.profit }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Achievements</h2>
            <p className="text-xs text-muted-foreground">
              {achievedGoals.length > 0
                ? `${achievedGoals.length} goal${achievedGoals.length !== 1 ? 's' : ''} earned`
                : 'Goals you hit will show up here'}
            </p>
          </div>
        </div>

        {achievedGoals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/30 py-12 px-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: alpha(themeColors.profit, '10') }}>
              <Medal className="h-6 w-6" style={{ color: themeColors.profit }} />
            </div>
            <h3 className="text-sm font-semibold mb-1">No achievements yet</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Hit one of your goals and it will be celebrated here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievedGoals.map(goal => {
              const GoalIcon = goal.type === 'profit' ? CurrencyDollar
                : goal.type === 'winRate' ? Star
                : goal.type === 'trades' ? Lightning
                : Medal
              return (
                <div
                  key={goal.id}
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: alpha(themeColors.profit, '25') }}
                >
                  <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: alpha(themeColors.profit, '06') }}>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: alpha(themeColors.profit, '15') }}
                    >
                      <GoalIcon className="h-4 w-4" style={{ color: themeColors.profit }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{getGoalLabel(goal.type)}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {goal.period} · {formatTarget(goal)}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-2 flex items-center gap-1.5 border-t" style={{ borderColor: alpha(themeColors.profit, '15') }}>
                    <Trophy className="h-3 w-3" style={{ color: themeColors.profit }} />
                    <span className="text-[11px] font-medium" style={{ color: themeColors.profit }}>
                      Achieved {goal.achievedAt ? new Date(goal.achievedAt).toLocaleDateString() : 'today'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </TabsContent>

      {/* Goal Add/Edit Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={(open) => { setShowGoalDialog(open); if (!open) setEditingGoal(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Set Your Trading Goal'}</DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Update your target.' : 'Choose a common goal or create a custom target.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {!editingGoal && (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Popular Goals</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { type: 'profit', period: 'monthly', target: 1000, label: `Make ${currencySymbol}1,000 this month`, icon: CurrencyDollar },
                      { type: 'winRate', period: 'weekly', target: 70, label: '70% win rate this week', icon: Target },
                      { type: 'profit', period: 'daily', target: 100, label: `${currencySymbol}100 daily profit goal`, icon: ChartLineUp },
                      { type: 'trades', period: 'weekly', target: 20, label: '20 trades this week', icon: Lightning },
                      { type: 'riskReward', period: 'monthly', target: 2, label: '2:1 risk/reward ratio', icon: Scales },
                      { type: 'trades', period: 'monthly', target: 50, label: '50 trades this month', icon: Lightning }
                    ].map((preset, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-3 justify-start text-left hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
                        onClick={() => createGoal({
                          type: preset.type as Goal['type'],
                          period: preset.period as Goal['period'],
                          target: preset.target
                        })}
                      >
                        <div className="flex items-center gap-2.5">
                          {(() => { const PresetIcon = preset.icon; return <PresetIcon className="h-3.5 w-3.5 text-muted-foreground" />; })()}
                          <div>
                            <div className="font-medium text-sm">{preset.label}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {preset.period} • {preset.type.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or create custom</span>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select value={newGoal.type} onValueChange={(v) => {
                  const type = v as Goal['type']
                  const defaults: Record<string, number> = {
                    profit: 1000,
                    winRate: 65,
                    trades: 15,
                    riskReward: 1.5
                  }
                  setNewGoal({ ...newGoal, type, target: defaults[type] })
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profit">
                      <div className="flex items-center gap-2">
                        <CurrencyDollar className="h-3 w-3" />
                        Profit Target
                      </div>
                    </SelectItem>
                    <SelectItem value="winRate">
                      <div className="flex items-center gap-2">
                        <Percent className="h-3 w-3" />
                        Win Rate %
                      </div>
                    </SelectItem>
                    <SelectItem value="trades">
                      <div className="flex items-center gap-2">
                        <Lightning className="h-3 w-3" />
                        Trade Count
                      </div>
                    </SelectItem>
                    <SelectItem value="riskReward">
                      <div className="flex items-center gap-2">
                        <Scales className="h-3 w-3" />
                        Risk/Reward
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time Period</Label>
                <Select value={newGoal.period} onValueChange={(v) => setNewGoal({ ...newGoal, period: v as Goal['period'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Daily
                      </div>
                    </SelectItem>
                    <SelectItem value="weekly">
                      <div className="flex items-center gap-2">
                        <CalendarDots className="h-3 w-3" />
                        Weekly
                      </div>
                    </SelectItem>
                    <SelectItem value="monthly">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Monthly
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Target {newGoal.type === 'winRate' ? '(%)' :
                    newGoal.type === 'profit' ? `(${currencySymbol})` :
                      newGoal.type === 'riskReward' ? '(ratio)' : '(count)'}
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={newGoal.type === 'riskReward' ? 0.1 : 1}
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: parseFloat(e.target.value) })}
                  placeholder={
                    newGoal.type === 'winRate' ? '65' :
                      newGoal.type === 'profit' ? '1000' :
                        newGoal.type === 'trades' ? '20' : '1.5'
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowGoalDialog(false); setEditingGoal(null) }}>
              Cancel
            </Button>
            <Button onClick={saveGoal} disabled={!newGoal.target || newGoal.target <= 0}>
              {editingGoal ? 'Save Changes' : 'Create Goal'}
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
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Limit Type</Label>
                <Select
                  value={editingRule.type}
                  onValueChange={(v) => setEditingRule({ ...editingRule, type: v as RiskRule['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maxLossPerDay">Max Daily Loss ({currencySymbol})</SelectItem>
                    <SelectItem value="maxLossPerTrade">Max Loss Per Trade ({currencySymbol})</SelectItem>
                    <SelectItem value="maxDrawdown">Max Drawdown ({currencySymbol})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value ({currencySymbol})</Label>
                <Input
                  type="number"
                  min={0}
                  value={editingRule.value}
                  onChange={(e) => setEditingRule({ ...editingRule, value: parseFloat(e.target.value) })}
                  placeholder="Enter value"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Limit</Label>
                <Switch
                  checked={editingRule.enabled}
                  onCheckedChange={(checked) => setEditingRule({ ...editingRule, enabled: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRuleDialog(false)
              setEditingRule(null)
            }}>
              Cancel
            </Button>
            <Button onClick={() => editingRule && updateRiskRule(editingRule)}>
              Save Limit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
