import { PerformanceGoals } from "@/components/performance-goals"
import { useThemePresets } from '@/contexts/theme-presets'
import { useUserStorage } from '@/utils/user-storage'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTrophy,
  faShield,
  faFire,
  faChartBar
} from '@fortawesome/free-solid-svg-icons'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { Footer7 } from "@/components/ui/footer-7"
import { footerConfig } from "@/components/ui/footer-config"
import { useMemo } from 'react'

export default function Goals() {
  const { themeColors, alpha } = useThemePresets()
  const userStorage = useUserStorage()

  // Get trades for statistics
  const trades = useMemo(() => {
    const storedTrades = userStorage.getItem('trades')
    if (!storedTrades) return []

    try {
      return JSON.parse(storedTrades)
    } catch {
      return []
    }
  }, [])

  // Calculate achievement statistics
  const stats = useMemo(() => {
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
  }, [trades])

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <SiteHeader />

      {/* Frosted Glass Header */}
      <div className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(to right, ${themeColors.primary}, ${alpha(themeColors.primary, 'DD')})` }}>
              Goals & Risk Management
            </h1>
            <p className="text-muted-foreground text-base">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Glass Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card
              key={index}
              className="bg-muted/30 backdrop-blur-sm border-0 hover:shadow-lg transition-shadow duration-200"
            >
              <CardHeader className="pb-2 pt-5 px-5">
                <div className="flex items-center justify-between">
                  <div
                    className="p-2.5 rounded-lg shadow-sm"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <FontAwesomeIcon icon={stat.icon} className="h-4 w-4" style={{ color: stat.color }} />
                  </div>
                  {stat.trend && (
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: `${alpha(themeColors.profit, '15')}`, color: themeColors.profit }}
                    >
                      {stat.trend}{stat.value}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </span>
                    {stat.total !== undefined && (
                      <span className="text-sm text-muted-foreground">of {stat.total}</span>
                    )}
                  </div>
                  <CardTitle className="text-sm font-medium text-foreground">{stat.label}</CardTitle>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  )}
                </div>
                {stat.total !== undefined && stat.total > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-muted/50 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: stat.color,
                          width: `${Math.min((stat.value / stat.total) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
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
