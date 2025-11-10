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
import { Card } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { useMemo } from 'react'

export default function Goals() {
  const { themeColors } = useThemePresets()
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
      violations,
      trades: trades.length
    }
  }, [trades])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Goals & Risk Management</h1>
            <p className="text-sm text-muted-foreground">Track your trading progress and manage risks effectively</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
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
          ].map((stat, index) => (
            <Card key={index} className="p-5 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                    <FontAwesomeIcon icon={stat.icon} className="h-4 w-4" style={{ color: stat.color }} />
                  </div>
                  {stat.trend && (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${themeColors.profit}15`, color: themeColors.profit }}>
                      {stat.trend}{stat.value}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </span>
                    {stat.total && (
                      <span className="text-sm text-muted-foreground">of {stat.total}</span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-foreground">{stat.label}</div>
                  {stat.subtitle && (
                    <div className="text-xs text-muted-foreground">{stat.subtitle}</div>
                  )}
                </div>
                {stat.total && (
                  <div className="mt-2">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full transition-all duration-300" 
                        style={{ 
                          backgroundColor: stat.color,
                          width: `${Math.min((stat.value / stat.total) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Performance Goals Section */}
        <div className="mt-8">
          <PerformanceGoals />
        </div>
      </div>
    </div>
  )
}