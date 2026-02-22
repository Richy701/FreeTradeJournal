import { PerformanceGoals } from "@/components/performance-goals"
import { useThemePresets } from '@/contexts/theme-presets'
import { useAuth } from '@/contexts/auth-context'
import { useUserStorage } from '@/utils/user-storage'
import { useDemoData } from '@/hooks/use-demo-data'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTrophy,
  faShield,
  faFire,
  faChartBar
} from '@fortawesome/free-solid-svg-icons'
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { Footer7 } from "@/components/ui/footer-7"
import { footerConfig } from "@/components/ui/footer-config"
import { useMemo } from 'react'

export default function Goals() {
  const { themeColors } = useThemePresets()
  const { isDemo } = useAuth()
  const userStorage = useUserStorage()
  const { getTrades: getDemoTrades } = useDemoData()

  // Get trades for statistics
  const trades = useMemo(() => {
    if (isDemo) {
      return getDemoTrades()
    }

    const storedTrades = userStorage.getItem('trades')
    if (!storedTrades) return []

    try {
      return JSON.parse(storedTrades)
    } catch {
      return []
    }
  }, [isDemo])

  // Calculate achievement statistics
  const stats = useMemo(() => {
    if (isDemo) {
      return {
        totalGoals: 3,
        achievedGoals: 1,
        activeRules: 2,
        totalRules: 3,
        violations: 0,
        trades: trades.length
      }
    }

    const storedGoals = userStorage.getItem('tradingGoals')
    const goals = storedGoals ? JSON.parse(storedGoals) : []
    const achievedGoals = goals.filter((g: any) => g.achieved).length

    const storedRules = userStorage.getItem('riskRules')
    const rules = storedRules ? JSON.parse(storedRules) : []
    const activeRules = rules.filter((r: any) => r.enabled).length
    const violations = rules.reduce((sum: number, r: any) => sum + (r.violations || 0), 0)

    return {
      totalGoals: goals.length,
      achievedGoals,
      activeRules,
      totalRules: rules.length,
      violations,
      trades: trades.length
    }
  }, [trades, isDemo])

  // Dynamic subtitle
  const subtitle = useMemo(() => {
    const parts: string[] = []
    if (stats.totalGoals > 0) {
      parts.push(`${stats.achievedGoals} of ${stats.totalGoals} goals achieved`)
    }
    if (stats.activeRules > 0) {
      parts.push(`${stats.activeRules} risk rule${stats.activeRules !== 1 ? 's' : ''} active`)
    }
    if (parts.length === 0) return 'Set goals and manage risk to improve your trading'
    return parts.join(' · ')
  }, [stats])

  const statCards = [
    {
      icon: faTrophy,
      value: stats.achievedGoals,
      label: 'Goals Achieved',
      total: stats.totalGoals,
      color: themeColors.profit,
      trend: stats.achievedGoals > 0 ? '+' : null
    },
    {
      icon: faShield,
      value: stats.activeRules,
      label: 'Active Rules',
      color: themeColors.primary,
      subtitle: 'Risk protection'
    },
    {
      icon: faChartBar,
      value: stats.trades,
      label: 'Total Trades',
      color: themeColors.primary,
      subtitle: 'All time'
    },
    {
      icon: faFire,
      value: stats.violations || 0,
      label: 'Risk Violations',
      color: themeColors.loss,
      subtitle: 'Recent alerts'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Header */}
      <div className="border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-foreground">
            Goals & Risk Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 2xl:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={stat.icon} className="h-3 w-3" />
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold" style={{ color: stat.color }}>
                    {stat.value}
                  </span>
                  {stat.total !== undefined && (
                    <span className="text-sm text-muted-foreground">/ {stat.total}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Goals Section */}
        <PerformanceGoals />
      </div>
      <Footer7 {...footerConfig} />
    </div>
  )
}
