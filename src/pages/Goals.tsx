import { PerformanceGoals } from "@/components/performance-goals"
import { useThemePresets } from '@/contexts/theme-presets'
import { useAuth } from '@/contexts/auth-context'
import { useUserStorage } from '@/utils/user-storage'
import { useDemoData } from '@/hooks/use-demo-data'
import { Trophy, Shield, Fire, Target, CheckCircle } from '@phosphor-icons/react'
import { SiteHeader } from "@/components/site-header"
import { AppFooter } from "@/components/app-footer"
import { useMemo } from 'react'
import { AIGoalCoach } from '@/components/ai-goal-coach'

function MiniArc({ percentage, size = 48, strokeWidth = 5, color }: {
  percentage: number; size?: number; strokeWidth?: number; color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = Math.PI * radius
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference
  return (
    <svg width={size} height={size / 2 + strokeWidth} className="overflow-visible">
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" strokeLinecap="round"
      />
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  )
}

export default function Goals() {
  const { themeColors, alpha } = useThemePresets()
  const { isDemo } = useAuth()
  const userStorage = useUserStorage()
  const { getTrades: getDemoTrades } = useDemoData()

  const trades = useMemo(() => {
    if (isDemo) return getDemoTrades()
    const storedTrades = userStorage.getItem('trades')
    if (!storedTrades) return []
    try { return JSON.parse(storedTrades) } catch { return [] }
  }, [isDemo])

  const stats = useMemo(() => {
    if (isDemo) {
      return { totalGoals: 3, achievedGoals: 1, activeRules: 2, totalRules: 3, violations: 0, trades: trades.length }
    }

    const storedGoals = userStorage.getItem('tradingGoals')
    let goals: any[] = []
    try { goals = storedGoals ? JSON.parse(storedGoals) : []; } catch { /* corrupted */ }
    const achievedGoals = goals.filter((g: any) => g.achieved).length

    const storedRules = userStorage.getItem('riskRules')
    let rules: any[] = []
    try { rules = storedRules ? JSON.parse(storedRules) : []; } catch { /* corrupted */ }
    const activeRules = rules.filter((r: any) => r.enabled).length
    const violations = rules.reduce((sum: number, r: any) => sum + (r.violations || 0), 0)

    return { totalGoals: goals.length, achievedGoals, activeRules, totalRules: rules.length, violations, trades: trades.length }
  }, [trades, isDemo])

  const completionRate = stats.totalGoals > 0 ? Math.round((stats.achievedGoals / stats.totalGoals) * 100) : 0
  const riskHealth = stats.violations === 0 ? 100 : Math.max(0, 100 - stats.violations * 20)

  const subtitle = useMemo(() => {
    if (stats.totalGoals === 0 && stats.totalRules === 0) return 'Set goals and manage risk to improve your trading'
    if (completionRate === 100 && stats.violations === 0) return 'All goals achieved and risk rules intact'
    const parts: string[] = []
    if (stats.totalGoals > 0) parts.push(`${stats.achievedGoals} of ${stats.totalGoals} goals achieved`)
    if (stats.activeRules > 0) parts.push(`${stats.activeRules} risk rule${stats.activeRules !== 1 ? 's' : ''} active`)
    return parts.join(' · ')
  }, [stats, completionRate])

  const statCards = [
    {
      icon: Trophy,
      value: `${stats.achievedGoals}`,
      suffix: `/ ${stats.totalGoals}`,
      label: 'Goals Achieved',
      color: themeColors.profit,
      bg: alpha(themeColors.profit, '10'),
      detail: stats.totalGoals > 0
        ? stats.achievedGoals === stats.totalGoals ? 'All targets hit' : `${stats.totalGoals - stats.achievedGoals} remaining`
        : 'No goals set yet',
    },
    {
      icon: Target,
      value: `${completionRate}%`,
      label: 'Completion Rate',
      color: completionRate >= 70 ? themeColors.profit : completionRate >= 40 ? '#f59e0b' : themeColors.primary,
      bg: alpha(completionRate >= 70 ? themeColors.profit : completionRate >= 40 ? '#f59e0b' : themeColors.primary, '10'),
      detail: completionRate >= 70 ? 'Strong progress' : completionRate >= 40 ? 'Building momentum' : 'Keep pushing',
      arc: completionRate,
    },
    {
      icon: Shield,
      value: `${stats.activeRules}`,
      label: 'Active Rules',
      color: themeColors.primary,
      bg: alpha(themeColors.primary, '10'),
      detail: stats.activeRules > 0 ? 'Risk protection on' : 'No protection active',
    },
    {
      icon: stats.violations === 0 ? CheckCircle : Fire,
      value: stats.violations === 0 ? 'Clear' : `${stats.violations}`,
      label: stats.violations === 0 ? 'Risk Status' : 'Violations',
      color: stats.violations === 0 ? themeColors.profit : themeColors.loss,
      bg: stats.violations === 0 ? alpha(themeColors.profit, '10') : alpha(themeColors.loss, '10'),
      detail: stats.violations === 0 ? 'No rule violations' : `${stats.violations} rule${stats.violations !== 1 ? 's' : ''} breached`,
      arc: riskHealth,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div className="border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 text-center sm:text-left">
          <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>
            Goals & Risk Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 2xl:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const StatIcon = stat.icon
            return (
              <div
                key={index}
                className="rounded-lg border border-border/60 p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg"
                    style={{ backgroundColor: stat.bg }}
                  >
                    <StatIcon className="h-4 w-4" style={{ color: stat.color }} />
                  </div>
                  {stat.arc !== undefined && (
                    <MiniArc percentage={stat.arc} color={stat.color} />
                  )}
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tracking-tight" style={{ color: stat.color }}>
                      {stat.value}
                    </span>
                    {stat.suffix && (
                      <span className="text-sm text-muted-foreground">{stat.suffix}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">{stat.detail}</p>
                </div>
              </div>
            )
          })}
        </div>

        <PerformanceGoals />
        <AIGoalCoach />
      </div>
      <AppFooter />
    </div>
  )
}
