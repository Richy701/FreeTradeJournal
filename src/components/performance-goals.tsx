import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useThemePresets } from '@/contexts/theme-presets'
import { useUserStorage } from '@/utils/user-storage'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBullseye,
  faTrophy,
  faChartLine,
  faShieldAlt,
  faExclamationTriangle,
  faMedal,
  faFire,
  faStar,
  faDollarSign,
  faPercentage,
  faBolt,
  faBalanceScale,
  faShield,
  faChartArea,
  faCalendarDay,
  faCalendarWeek,
  faCalendar,
  faRotateRight,
  faPen,
  faCheck,
  faTrash
} from '@fortawesome/free-solid-svg-icons'
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
  DialogTrigger,
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

interface Goal {
  id: string
  type: 'profit' | 'winRate' | 'trades' | 'riskReward' | 'maxLoss' | 'maxDrawdown'
  period: 'daily' | 'weekly' | 'monthly'
  target: number
  current?: number
  achieved?: boolean
  createdAt: Date
  achievedAt?: Date
}

interface RiskRule {
  id: string
  type: 'maxLossPerDay' | 'maxLossPerTrade' | 'maxRiskPerTrade' | 'maxOpenTrades'
  value: number
  enabled: boolean
  violations?: number
}

// Helper: human-readable goal label
function getGoalLabel(type: string): string {
  const labels: Record<string, string> = {
    profit: 'Profit Target',
    winRate: 'Win Rate',
    trades: 'Trade Count',
    riskReward: 'Risk/Reward',
    maxLoss: 'Max Loss',
    maxDrawdown: 'Max Drawdown'
  }
  return labels[type] || type
}

// Helper: format current value for display
function formatCurrentValue(goal: { type: string; current?: number }): string {
  const val = goal.current ?? 0
  switch (goal.type) {
    case 'profit':
    case 'maxLoss':
    case 'maxDrawdown':
      return `$${val.toFixed(0)}`
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
function getRuleIcon(type: string) {
  const icons: Record<string, any> = {
    maxLossPerDay: faFire,
    maxLossPerTrade: faExclamationTriangle,
    maxRiskPerTrade: faPercentage,
    maxOpenTrades: faChartLine
  }
  return icons[type] || faShieldAlt
}

// Circular progress ring component
function CircularProgress({ percentage, size = 52, strokeWidth = 5, color, achieved }: {
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
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
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
          <FontAwesomeIcon icon={faCheck} className="h-4 w-4" style={{ color }} />
        ) : (
          <span className="text-xs font-bold" style={{ color }}>{Math.round(percentage)}%</span>
        )}
      </div>
    </div>
  )
}

export function PerformanceGoals() {
  const { themeColors, alpha } = useThemePresets()
  const userStorage = useUserStorage()
  const [goals, setGoals] = useState<Goal[]>([])
  const [riskRules, setRiskRules] = useState<RiskRule[]>([])
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<RiskRule | null>(null)
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    type: 'profit',
    period: 'monthly',
    target: 1000
  })

  // Celebrate achievement with toast notification
  const celebrateAchievement = (goal: Goal) => {
    const messages = {
      profit: '🎉 Profit target achieved!',
      winRate: '🏆 Win rate goal reached!',
      trades: '📈 Trade count target hit!',
      riskReward: '⚖️ Risk/Reward goal achieved!',
      maxLoss: '🛡️ Stayed within loss limits!',
      maxDrawdown: '💪 Drawdown controlled successfully!'
    }

    toast.success(messages[goal.type], {
      description: `You've achieved your ${goal.period} target of ${formatTarget(goal)}!`,
      duration: 7000
    })
  }

  const formatTarget = (goal: Goal) => {
    switch (goal.type) {
      case 'profit':
      case 'maxLoss':
      case 'maxDrawdown':
        return `$${goal.target}`
      case 'winRate':
        return `${goal.target}%`
      case 'trades':
        return `${goal.target} trades`
      case 'riskReward':
        return `${goal.target}:1 R:R`
      default:
        return goal.target
    }
  }

  // Load goals and risk rules from localStorage
  useEffect(() => {
    const storedGoals = userStorage.getItem('tradingGoals')
    const storedRules = userStorage.getItem('riskRules')

    if (storedGoals) {
      setGoals(JSON.parse(storedGoals).map((g: any) => ({
        ...g,
        createdAt: new Date(g.createdAt),
        achievedAt: g.achievedAt ? new Date(g.achievedAt) : undefined
      })))
    } else {
      const defaultGoals: Goal[] = [
        {
          id: '1',
          type: 'profit',
          period: 'monthly',
          target: 1000,
          createdAt: new Date()
        },
        {
          id: '2',
          type: 'winRate',
          period: 'weekly',
          target: 60,
          createdAt: new Date()
        }
      ]
      setGoals(defaultGoals)
      userStorage.setItem('tradingGoals', JSON.stringify(defaultGoals))
    }

    if (storedRules) {
      setRiskRules(JSON.parse(storedRules))
    } else {
      const defaultRules: RiskRule[] = [
        {
          id: '1',
          type: 'maxLossPerDay',
          value: 100,
          enabled: true,
          violations: 0
        },
        {
          id: '2',
          type: 'maxRiskPerTrade',
          value: 2,
          enabled: true,
          violations: 0
        },
        {
          id: '3',
          type: 'maxOpenTrades',
          value: 3,
          enabled: false,
          violations: 0
        }
      ]
      setRiskRules(defaultRules)
      userStorage.setItem('riskRules', JSON.stringify(defaultRules))
    }
  }, [])

  // Get trades and calculate current progress
  const trades = useMemo(() => {
    const storedTrades = userStorage.getItem('trades')
    if (!storedTrades) return []

    try {
      return JSON.parse(storedTrades).map((trade: any) => ({
        ...trade,
        exitTime: trade.exitTime ? new Date(trade.exitTime) : new Date()
      }))
    } catch {
      return []
    }
  }, [])

  // Calculate goal progress
  const goalProgress = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.setHours(0, 0, 0, 0))
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    return goals.map(goal => {
      let relevantTrades = trades
      let startDate: Date

      switch (goal.period) {
        case 'daily':
          startDate = todayStart
          break
        case 'weekly':
          startDate = weekStart
          break
        case 'monthly':
          startDate = monthStart
          break
      }

      relevantTrades = trades.filter((t: any) => t.exitTime >= startDate)

      let current = 0
      let achieved = false

      switch (goal.type) {
        case 'profit':
          current = relevantTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0)
          achieved = current >= goal.target
          break
        case 'winRate':
          const wins = relevantTrades.filter((t: any) => t.pnl > 0).length
          current = relevantTrades.length > 0 ? (wins / relevantTrades.length) * 100 : 0
          achieved = current >= goal.target
          break
        case 'trades':
          current = relevantTrades.length
          achieved = current >= goal.target
          break
        case 'riskReward':
          const avgRR = relevantTrades.length > 0
            ? relevantTrades.reduce((sum: number, t: any) => sum + (t.riskReward || 0), 0) / relevantTrades.length
            : 0
          current = avgRR
          achieved = current >= goal.target
          break
        case 'maxLoss':
          current = Math.abs(Math.min(0, relevantTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0)))
          achieved = current <= goal.target
          break
        case 'maxDrawdown':
          let peak = 0
          let drawdown = 0
          let cumulative = 0

          relevantTrades.forEach((t: any) => {
            cumulative += t.pnl || 0
            if (cumulative > peak) peak = cumulative
            const currentDrawdown = peak - cumulative
            if (currentDrawdown > drawdown) drawdown = currentDrawdown
          })

          current = drawdown
          achieved = current <= goal.target
          break
      }

      // Check for new achievements
      if (achieved && !goal.achieved) {
        celebrateAchievement(goal)
        goal.achieved = true
        goal.achievedAt = new Date()
        const updatedGoals = goals.map(g => g.id === goal.id ? { ...g, achieved: true, achievedAt: new Date() } : g)
        userStorage.setItem('tradingGoals', JSON.stringify(updatedGoals))
      }

      return { ...goal, current, achieved }
    })
  }, [goals, trades])

  // Check risk rule violations
  const checkRiskRules = () => {
    const now = new Date()
    const todayStart = new Date(now.setHours(0, 0, 0, 0))
    const todayTrades = trades.filter((t: any) => t.exitTime >= todayStart)

    riskRules.forEach(rule => {
      if (!rule.enabled) return

      let violated = false

      switch (rule.type) {
        case 'maxLossPerDay':
          const todayLoss = Math.abs(Math.min(0, todayTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0)))
          if (todayLoss > rule.value) {
            violated = true
            toast.error(`Risk Rule Violation!`, {
              description: `Daily loss limit of $${rule.value} exceeded!`,
              duration: 5000
            })
          }
          break
        case 'maxLossPerTrade':
          const lastTrade = trades[trades.length - 1]
          if (lastTrade && Math.abs(lastTrade.pnl) > rule.value && lastTrade.pnl < 0) {
            violated = true
            toast.error(`Risk Rule Violation!`, {
              description: `Trade loss exceeded $${rule.value} limit!`,
              duration: 5000
            })
          }
          break
        case 'maxRiskPerTrade':
          break
        case 'maxOpenTrades':
          break
      }

      if (violated) {
        rule.violations = (rule.violations || 0) + 1
        userStorage.setItem('riskRules', JSON.stringify(riskRules))
      }
    })
  }

  const addGoal = () => {
    const goal: Goal = {
      id: Date.now().toString(),
      type: newGoal.type as Goal['type'],
      period: newGoal.period as Goal['period'],
      target: newGoal.target || 0,
      createdAt: new Date()
    }

    const updatedGoals = [...goals, goal]
    setGoals(updatedGoals)
    userStorage.setItem('tradingGoals', JSON.stringify(updatedGoals))
    setShowGoalDialog(false)

    toast.success('Goal Added!', {
      description: `New ${goal.period} ${goal.type} target set.`
    })
  }

  const deleteGoal = (id: string) => {
    const updatedGoals = goals.filter(g => g.id !== id)
    setGoals(updatedGoals)
    userStorage.setItem('tradingGoals', JSON.stringify(updatedGoals))
  }

  const toggleRiskRule = (id: string) => {
    const updatedRules = riskRules.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    )
    setRiskRules(updatedRules)
    userStorage.setItem('riskRules', JSON.stringify(updatedRules))
  }

  const updateRiskRule = (rule: RiskRule) => {
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

    toast.success(existingRule ? 'Risk Rule Updated' : 'Risk Rule Added', {
      description: `${getRuleLabel(rule.type)} set to ${rule.type.includes('Percent') || rule.type === 'maxRiskPerTrade' ? rule.value + '%' : '$' + rule.value}`
    })
  }

  const getRuleLabel = (type: string) => {
    const labels: Record<string, string> = {
      maxLossPerDay: 'Max Daily Loss',
      maxLossPerTrade: 'Max Loss Per Trade',
      maxRiskPerTrade: 'Max Risk Per Trade',
      maxOpenTrades: 'Max Open Trades'
    }
    return labels[type] || type
  }

  const resetGoalProgress = (id: string) => {
    const updatedGoals = goals.map(g =>
      g.id === id ? { ...g, achieved: false, achievedAt: undefined } : g
    )
    setGoals(updatedGoals)
    userStorage.setItem('tradingGoals', JSON.stringify(updatedGoals))

    toast.info('Goal Reset', {
      description: 'Progress has been reset for this goal.'
    })
  }

  const getPeriodIcon = (period: string) => {
    switch (period) {
      case 'daily': return faCalendarDay
      case 'weekly': return faCalendarWeek
      case 'monthly': return faCalendar
      default: return faCalendar
    }
  }

  // Check rules on trade updates
  useEffect(() => {
    checkRiskRules()
  }, [trades])

  const achievedGoals = goalProgress.filter(g => g.achieved)

  return (
    <div className="space-y-6">
      {/* ── Goals Card ── */}
      <Card className="">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <FontAwesomeIcon icon={faBullseye} className="h-4 w-4 text-muted-foreground" />
              Active Goals
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {achievedGoals.length}/{goalProgress.length} achieved
              </span>
              <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText || '#fff' }}
                  >
                    Add Goal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Set Your Trading Goal</DialogTitle>
                    <DialogDescription>
                      Choose from common trading goals or create a custom target.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {/* Quick Goal Presets */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Popular Goals</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { type: 'profit', period: 'monthly', target: 1000, label: 'Make $1,000 this month', icon: faDollarSign },
                          { type: 'winRate', period: 'weekly', target: 70, label: '70% win rate this week', icon: faBullseye },
                          { type: 'profit', period: 'daily', target: 100, label: '$100 daily profit goal', icon: faChartLine },
                          { type: 'trades', period: 'weekly', target: 20, label: '20 trades this week', icon: faBolt },
                          { type: 'riskReward', period: 'monthly', target: 2, label: '2:1 risk/reward ratio', icon: faBalanceScale },
                          { type: 'maxLoss', period: 'daily', target: 200, label: 'Max $200 daily loss', icon: faShield }
                        ].map((preset, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="h-auto p-3 justify-start text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                            onClick={() => {
                              setNewGoal({
                                ...preset,
                                type: preset.type as Goal['type'],
                                period: preset.period as Goal['period'],
                                id: Math.random().toString(36).substr(2, 9),
                                createdAt: new Date()
                              })
                              addGoal()
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <FontAwesomeIcon icon={preset.icon} className="h-3.5 w-3.5 text-muted-foreground" />
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

                    {/* Custom Goal Form */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Goal Type</Label>
                        <Select value={newGoal.type} onValueChange={(v) => {
                          const type = v as Goal['type']
                          const defaults: Record<string, number> = {
                            profit: 1000,
                            winRate: 65,
                            trades: 15,
                            riskReward: 1.5,
                            maxLoss: 300,
                            maxDrawdown: 500
                          }
                          setNewGoal({ ...newGoal, type, target: defaults[type] })
                        }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="profit">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faDollarSign} className="h-3 w-3" />
                                Profit Target
                              </div>
                            </SelectItem>
                            <SelectItem value="winRate">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faPercentage} className="h-3 w-3" />
                                Win Rate %
                              </div>
                            </SelectItem>
                            <SelectItem value="trades">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faBolt} className="h-3 w-3" />
                                Trade Count
                              </div>
                            </SelectItem>
                            <SelectItem value="riskReward">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faBalanceScale} className="h-3 w-3" />
                                Risk/Reward
                              </div>
                            </SelectItem>
                            <SelectItem value="maxLoss">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faShield} className="h-3 w-3" />
                                Max Loss Limit
                              </div>
                            </SelectItem>
                            <SelectItem value="maxDrawdown">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faChartArea} className="h-3 w-3" />
                                Max Drawdown
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
                                <FontAwesomeIcon icon={faCalendarDay} className="h-3 w-3" />
                                Daily
                              </div>
                            </SelectItem>
                            <SelectItem value="weekly">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faCalendarWeek} className="h-3 w-3" />
                                Weekly
                              </div>
                            </SelectItem>
                            <SelectItem value="monthly">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faCalendar} className="h-3 w-3" />
                                Monthly
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Target {newGoal.type === 'winRate' ? '(%)' :
                            newGoal.type === 'profit' || newGoal.type === 'maxLoss' || newGoal.type === 'maxDrawdown' ? '($)' :
                              newGoal.type === 'riskReward' ? '(ratio)' : '(count)'}
                        </Label>
                        <Input
                          type="number"
                          value={newGoal.target}
                          onChange={(e) => setNewGoal({ ...newGoal, target: parseFloat(e.target.value) })}
                          placeholder={
                            newGoal.type === 'winRate' ? '65' :
                              newGoal.type === 'profit' ? '1000' :
                                newGoal.type === 'trades' ? '20' :
                                  newGoal.type === 'riskReward' ? '1.5' : '200'
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addGoal} disabled={!newGoal.target}>
                      Create Goal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {goalProgress.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FontAwesomeIcon icon={faBullseye} className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No goals set. Add your first goal to start tracking!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goalProgress.map(goal => {
                const progress = goal.type === 'maxLoss' || goal.type === 'maxDrawdown'
                  ? Math.max(0, Math.min(100, (1 - (goal.current || 0) / goal.target) * 100))
                  : Math.min(100, ((goal.current || 0) / goal.target) * 100)

                return (
                  <div
                    key={goal.id}
                    className="group relative rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Circular progress ring */}
                      <CircularProgress
                        percentage={progress}
                        color={goal.achieved ? themeColors.profit : themeColors.primary}
                        achieved={goal.achieved || false}
                      />

                      {/* Goal details */}
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
                            <FontAwesomeIcon icon={getPeriodIcon(goal.period)} className="h-2.5 w-2.5 mr-1" />
                            {goal.period}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrentValue(goal)} / {formatTarget(goal)}
                        </div>
                        {goal.achieved && (
                          <div className="flex items-center gap-1 text-xs" style={{ color: themeColors.profit }}>
                            <FontAwesomeIcon icon={faTrophy} className="h-3 w-3" />
                            <span>Achieved {goal.achievedAt ? new Date(goal.achievedAt).toLocaleDateString() : 'today'}!</span>
                          </div>
                        )}
                      </div>

                      {/* Hover actions */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {goal.achieved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => resetGoalProgress(goal.id)}
                            title="Reset progress"
                            aria-label="Reset goal"
                          >
                            <FontAwesomeIcon icon={faRotateRight} className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:text-destructive"
                          onClick={() => { if (!window.confirm('Are you sure you want to delete this goal?')) return; deleteGoal(goal.id); }}
                          title="Delete goal"
                          aria-label="Delete goal"
                        >
                          <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Risk Rules Card ── */}
      <Card className="">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <FontAwesomeIcon icon={faShieldAlt} className="h-4 w-4 text-muted-foreground" />
              Risk Management Rules
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newRule: RiskRule = {
                  id: Date.now().toString(),
                  type: 'maxLossPerDay',
                  value: 100,
                  enabled: true,
                  violations: 0
                }
                setEditingRule(newRule)
                setShowRuleDialog(true)
              }}
            >
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2 space-y-2">
          {riskRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FontAwesomeIcon icon={faShieldAlt} className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No risk rules configured.</p>
            </div>
          ) : (
            riskRules.map(rule => (
              <div
                key={rule.id}
                className="group flex items-center justify-between rounded-lg border border-border p-3.5"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRiskRule(rule.id)}
                  />
                  <FontAwesomeIcon
                    icon={getRuleIcon(rule.type)}
                    className="h-3.5 w-3.5 text-muted-foreground"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {getRuleLabel(rule.type)}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {rule.type.includes('Percent') || rule.type === 'maxRiskPerTrade'
                        ? `${rule.value}%`
                        : rule.type === 'maxOpenTrades'
                          ? rule.value
                          : `$${rule.value}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rule.violations && rule.violations > 0 ? (
                    <Badge
                      className="text-xs font-medium"
                      style={{
                        backgroundColor: alpha(themeColors.loss, '20'),
                        color: themeColors.loss,
                        border: `1px solid ${alpha(themeColors.loss, '30')}`
                      }}
                    >
                      {rule.violations} violation{rule.violations !== 1 ? 's' : ''}
                    </Badge>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                    onClick={() => {
                      setEditingRule(rule)
                      setShowRuleDialog(true)
                    }}
                    aria-label="Edit rule"
                  >
                    <FontAwesomeIcon icon={faPen} className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Risk Rule Edit Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule?.id ? 'Edit' : 'Add'} Risk Rule</DialogTitle>
            <DialogDescription>
              Configure your risk management parameters.
            </DialogDescription>
          </DialogHeader>
          {editingRule && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rule Type</Label>
                <Select
                  value={editingRule.type}
                  onValueChange={(v) => setEditingRule({ ...editingRule, type: v as RiskRule['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maxLossPerDay">Max Daily Loss ($)</SelectItem>
                    <SelectItem value="maxLossPerTrade">Max Loss Per Trade ($)</SelectItem>
                    <SelectItem value="maxRiskPerTrade">Max Risk Per Trade (%)</SelectItem>
                    <SelectItem value="maxOpenTrades">Max Open Trades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Value {editingRule.type === 'maxRiskPerTrade' ? '(%)' : editingRule.type === 'maxOpenTrades' ? '(count)' : '($)'}
                </Label>
                <Input
                  type="number"
                  value={editingRule.value}
                  onChange={(e) => setEditingRule({ ...editingRule, value: parseFloat(e.target.value) })}
                  placeholder="Enter value"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Rule</Label>
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
              Save Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Achievements Card ── */}
      {achievedGoals.length > 0 && (
        <Card className="">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <FontAwesomeIcon icon={faTrophy} className="h-4 w-4 text-muted-foreground" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievedGoals.map(goal => (
                <div
                  key={goal.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon
                      icon={goal.type === 'profit' ? faDollarSign
                        : goal.type === 'winRate' ? faStar
                        : goal.type === 'trades' ? faBolt
                        : faMedal}
                      className="h-3.5 w-3.5"
                      style={{ color: themeColors.profit }}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {getGoalLabel(goal.type)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {goal.period} · {formatTarget(goal)}
                  </div>
                  {goal.achievedAt && (
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {new Date(goal.achievedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
