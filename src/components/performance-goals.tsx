import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useThemePresets } from '@/contexts/theme-presets'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBullseye,
  faTrophy,
  faChartLine,
  faShieldAlt,
  faCheckCircle,
  faTimesCircle,
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
  faPen
} from '@fortawesome/free-solid-svg-icons'
import { Progress } from "@/components/ui/progress"
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
import { cn } from "@/lib/utils"

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

export function PerformanceGoals() {
  const { themeColors } = useThemePresets()
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
    const storedGoals = localStorage.getItem('tradingGoals')
    const storedRules = localStorage.getItem('riskRules')
    
    if (storedGoals) {
      setGoals(JSON.parse(storedGoals).map((g: any) => ({
        ...g,
        createdAt: new Date(g.createdAt),
        achievedAt: g.achievedAt ? new Date(g.achievedAt) : undefined
      })))
    } else {
      // Default goals for new users
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
      localStorage.setItem('tradingGoals', JSON.stringify(defaultGoals))
    }
    
    if (storedRules) {
      setRiskRules(JSON.parse(storedRules))
    } else {
      // Default risk rules
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
          value: 2, // percentage
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
      localStorage.setItem('riskRules', JSON.stringify(defaultRules))
    }
  }, [])

  // Get trades and calculate current progress
  const trades = useMemo(() => {
    const storedTrades = localStorage.getItem('trades')
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
        // Update in localStorage
        const updatedGoals = goals.map(g => g.id === goal.id ? { ...g, achieved: true, achievedAt: new Date() } : g)
        localStorage.setItem('tradingGoals', JSON.stringify(updatedGoals))
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
          // This would need to be checked when placing a trade
          break
        case 'maxOpenTrades':
          // This would need real-time open trade tracking
          break
      }
      
      if (violated) {
        rule.violations = (rule.violations || 0) + 1
        localStorage.setItem('riskRules', JSON.stringify(riskRules))
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
    localStorage.setItem('tradingGoals', JSON.stringify(updatedGoals))
    setShowGoalDialog(false)
    
    toast.success('Goal Added!', {
      description: `New ${goal.period} ${goal.type} target set.`
    })
  }

  const deleteGoal = (id: string) => {
    const updatedGoals = goals.filter(g => g.id !== id)
    setGoals(updatedGoals)
    localStorage.setItem('tradingGoals', JSON.stringify(updatedGoals))
  }

  const toggleRiskRule = (id: string) => {
    const updatedRules = riskRules.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    )
    setRiskRules(updatedRules)
    localStorage.setItem('riskRules', JSON.stringify(updatedRules))
  }

  const updateRiskRule = (rule: RiskRule) => {
    let updatedRules: RiskRule[]
    
    // Check if this is a new rule (not in existing rules)
    const existingRule = riskRules.find(r => r.id === rule.id)
    
    if (existingRule) {
      // Update existing rule
      updatedRules = riskRules.map(r => r.id === rule.id ? rule : r)
    } else {
      // Add new rule
      updatedRules = [...riskRules, rule]
    }
    
    setRiskRules(updatedRules)
    localStorage.setItem('riskRules', JSON.stringify(updatedRules))
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
    localStorage.setItem('tradingGoals', JSON.stringify(updatedGoals))
    
    toast.info('Goal Reset', {
      description: 'Progress has been reset for this goal.'
    })
  }

  // Check rules on trade updates
  useEffect(() => {
    checkRiskRules()
  }, [trades])

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-border/50">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg" style={{backgroundColor: `${themeColors.primary}20`}}>
              <FontAwesomeIcon icon={faBullseye} className="h-4 w-4" style={{color: themeColors.primary}} />
            </div>
            Performance Goals & Risk Management
          </CardTitle>
          <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
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
                        className="h-auto p-3 justify-start text-left hover:bg-muted/50"
                        onClick={() => {
                          setNewGoal(preset)
                          addGoal()
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{backgroundColor: `${themeColors.primary}20`}}>
                            <FontAwesomeIcon icon={preset.icon} className="h-4 w-4" style={{color: themeColors.primary}} />
                          </div>
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
                      setNewGoal({...newGoal, type, target: defaults[type]})
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
                    <Select value={newGoal.period} onValueChange={(v) => setNewGoal({...newGoal, period: v as Goal['period']})}>
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
                      onChange={(e) => setNewGoal({...newGoal, target: parseFloat(e.target.value)})}
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
        <CardDescription className="text-muted-foreground font-medium mt-2">
          Track your trading goals and manage risk with automated rules
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Active Goals */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Active Goals</h3>
            <Badge variant="outline" className="text-xs">
              {goalProgress.filter(g => g.achieved).length}/{goalProgress.length} Achieved
            </Badge>
          </div>
          
          {goalProgress.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FontAwesomeIcon icon={faBullseye} className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No goals set. Add your first goal to start tracking!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goalProgress.map(goal => {
                const progress = goal.type === 'maxLoss' || goal.type === 'maxDrawdown' 
                  ? Math.max(0, Math.min(100, (1 - (goal.current || 0) / goal.target) * 100))
                  : Math.min(100, ((goal.current || 0) / goal.target) * 100)
                
                return (
                  <div key={goal.id} className="space-y-2 p-3 rounded-lg bg-muted/20 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon 
                          icon={goal.achieved ? faCheckCircle : faChartLine} 
                          className="h-3 w-3" 
                          style={{color: goal.achieved ? themeColors.profit : themeColors.primary}}
                        />
                        <span className="text-sm font-medium">
                          {goal.period.charAt(0).toUpperCase() + goal.period.slice(1)} {goal.type.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {goal.current !== undefined ? (
                            goal.type === 'profit' || goal.type === 'maxLoss' || goal.type === 'maxDrawdown' 
                              ? `$${goal.current.toFixed(0)}`
                              : goal.type === 'winRate' 
                                ? `${goal.current.toFixed(1)}%`
                                : goal.type === 'riskReward'
                                  ? `${goal.current.toFixed(2)}:1`
                                  : goal.current
                          ) : '0'} / {formatTarget(goal)}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {goal.achieved && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-5 w-5 p-0 text-xs"
                              onClick={() => resetGoalProgress(goal.id)}
                              title="Reset progress"
                            >
                              <FontAwesomeIcon icon={faRotateRight} className="h-3 w-3" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-5 w-5 p-0 text-xs"
                            onClick={() => deleteGoal(goal.id)}
                            title="Delete goal"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-2"
                      style={{
                        '--progress-background': goal.achieved ? themeColors.profit : themeColors.primary
                      } as any}
                    />
                    {goal.achieved && (
                      <div className="flex items-center gap-1 text-xs" style={{color: themeColors.profit}}>
                        <FontAwesomeIcon icon={faTrophy} className="h-3 w-3" />
                        <span>Achieved {goal.achievedAt ? new Date(goal.achievedAt).toLocaleDateString() : 'today'}!</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Risk Rules */}
        <div className="space-y-3 pt-3 border-t border-border/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Risk Management Rules</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
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
              + Add Rule
            </Button>
          </div>
          
          <div className="space-y-2">
            {riskRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/10 group">
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRiskRule(rule.id)}
                  />
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon 
                      icon={faShieldAlt} 
                      className="h-3 w-3" 
                      style={{color: rule.enabled ? themeColors.primary : 'gray'}}
                    />
                    <span className="text-sm">
                      {getRuleLabel(rule.type)}: {rule.type.includes('Percent') || rule.type === 'maxRiskPerTrade' ? `${rule.value}%` : rule.type === 'maxOpenTrades' ? rule.value : `$${rule.value}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rule.violations && rule.violations > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {rule.violations} violations
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={() => {
                      setEditingRule(rule)
                      setShowRuleDialog(true)
                    }}
                  >
                    <FontAwesomeIcon icon={faPen} className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

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
                    onValueChange={(v) => setEditingRule({...editingRule, type: v as RiskRule['type']})}
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
                    onChange={(e) => setEditingRule({...editingRule, value: parseFloat(e.target.value)})}
                    placeholder="Enter value"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable Rule</Label>
                  <Switch 
                    checked={editingRule.enabled}
                    onCheckedChange={(checked) => setEditingRule({...editingRule, enabled: checked})}
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

        {/* Achievement Badges */}
        {goalProgress.filter(g => g.achieved).length > 0 && (
          <div className="space-y-3 pt-3 border-t border-border/30">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Recent Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {goalProgress.filter(g => g.achieved).map(goal => (
                <Badge 
                  key={goal.id}
                  variant="outline" 
                  className="flex items-center gap-1"
                  style={{
                    borderColor: themeColors.profit,
                    backgroundColor: `${themeColors.profit}10`
                  }}
                >
                  <FontAwesomeIcon icon={faMedal} className="h-3 w-3" style={{color: themeColors.profit}} />
                  {goal.period} {goal.type}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}