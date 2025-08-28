import { PerformanceGoals } from "@/components/performance-goals"
import { useThemePresets } from '@/contexts/theme-presets'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBullseye, faChartLine, faTrophy, faShieldAlt } from '@fortawesome/free-solid-svg-icons'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { useMemo } from 'react'

export default function Goals() {
  const { themeColors } = useThemePresets()
  
  // Get trades for statistics
  const trades = useMemo(() => {
    const storedTrades = localStorage.getItem('trades')
    if (!storedTrades) return []
    
    try {
      return JSON.parse(storedTrades)
    } catch {
      return []
    }
  }, [])

  // Calculate achievement statistics
  const stats = useMemo(() => {
    const storedGoals = localStorage.getItem('tradingGoals')
    const goals = storedGoals ? JSON.parse(storedGoals) : []
    const achievedGoals = goals.filter((g: any) => g.achieved).length
    
    const storedRules = localStorage.getItem('riskRules')
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <SiteHeader />
      {/* Header Section */}
      <div className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 
                  className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent leading-tight pb-1"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.primary}DD, ${themeColors.primary}AA)`
                  }}
                >
                  Goals & Risk Management
                </h1>
                <p className="text-muted-foreground text-lg sm:text-xl font-medium max-w-2xl">
                  Set performance targets and manage your trading risk
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{color: themeColors.profit}}>
                    {stats.achievedGoals}
                  </div>
                  <div className="text-xs text-muted-foreground">Goals Achieved</div>
                </div>
                <div className="h-12 w-px bg-border"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{color: themeColors.primary}}>
                    {stats.activeRules}
                  </div>
                  <div className="text-xs text-muted-foreground">Active Rules</div>
                </div>
                {stats.violations > 0 && (
                  <>
                    <div className="h-12 w-px bg-border"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{color: themeColors.loss}}>
                        {stats.violations}
                      </div>
                      <div className="text-xs text-muted-foreground">Violations</div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Mobile Stats */}
            <div className="flex lg:hidden items-center gap-4 pt-2">
              <Badge variant="outline" className="gap-1">
                <FontAwesomeIcon icon={faTrophy} className="h-3 w-3" style={{color: themeColors.profit}} />
                {stats.achievedGoals} Achieved
              </Badge>
              <Badge variant="outline" className="gap-1">
                <FontAwesomeIcon icon={faShieldAlt} className="h-3 w-3" style={{color: themeColors.primary}} />
                {stats.activeRules} Rules
              </Badge>
              {stats.violations > 0 && (
                <Badge variant="outline" className="gap-1" style={{borderColor: themeColors.loss}}>
                  {stats.violations} Violations
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
          <Card className="hover:shadow-lg transition-all duration-200 bg-muted/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <FontAwesomeIcon icon={faBullseye} className="h-4 w-4" style={{color: themeColors.primary}} />
                Set Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Define clear, measurable targets for your trading performance. Track profit, win rate, and more.
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-200 bg-muted/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <FontAwesomeIcon icon={faShieldAlt} className="h-4 w-4" style={{color: themeColors.primary}} />
                Risk Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Set automated risk management rules to protect your capital and maintain discipline.
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-200 bg-muted/30 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <FontAwesomeIcon icon={faTrophy} className="h-4 w-4" style={{color: themeColors.primary}} />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Celebrate your wins and track your progress with achievement badges and notifications.
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Performance Goals Component */}
        <div className="animate-in fade-in duration-300 delay-100">
          <PerformanceGoals />
        </div>
        
        {/* Tips Section */}
        <Card className="animate-in fade-in duration-300 delay-200 hover:shadow-lg transition-all duration-200 bg-muted/30 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <FontAwesomeIcon icon={faChartLine} className="h-4 w-4" style={{color: themeColors.primary}} />
              Goal Setting Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">SMART Goals</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>Specific:</strong> Clear and well-defined targets</li>
                  <li>• <strong>Measurable:</strong> Quantifiable metrics to track</li>
                  <li>• <strong>Achievable:</strong> Realistic based on your history</li>
                  <li>• <strong>Relevant:</strong> Aligned with your trading strategy</li>
                  <li>• <strong>Time-bound:</strong> Daily, weekly, or monthly periods</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Risk Management Best Practices</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Never risk more than 1-2% per trade</li>
                  <li>• Set daily loss limits (e.g., 3% of account)</li>
                  <li>• Use stop losses on every trade</li>
                  <li>• Maintain minimum 1.5:1 risk/reward ratio</li>
                  <li>• Limit number of concurrent open positions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}