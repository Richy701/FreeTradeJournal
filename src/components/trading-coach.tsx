import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useThemePresets } from '@/contexts/theme-presets'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUserTie, 
  faLightbulb, 
  faChartLine, 
  faExclamationTriangle,
  faTrophy,
  faArrowTrendUp,
  faArrowTrendDown,
  faBrain
} from '@fortawesome/free-solid-svg-icons'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Trade {
  pnl: number
  winRate?: number
  riskReward?: number
  symbol?: string
  exitTime?: Date
}

export function TradingCoach() {
  const { themeColors } = useThemePresets()
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Get trades from localStorage
  const trades = useMemo(() => {
    const storedTrades = localStorage.getItem('trades')
    if (!storedTrades) return []
    
    try {
      return JSON.parse(storedTrades).map((trade: any) => ({
        ...trade,
        exitTime: trade.exitTime ? new Date(trade.exitTime) : undefined
      }))
    } catch {
      return []
    }
  }, [])

  // Calculate metrics for personalized advice
  const metrics = useMemo(() => {
    if (trades.length === 0) return null
    
    const totalPnL = trades.reduce((sum: number, t: Trade) => sum + (t.pnl || 0), 0)
    const winningTrades = trades.filter((t: Trade) => t.pnl > 0)
    const losingTrades = trades.filter((t: Trade) => t.pnl < 0)
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0
    
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum: number, t: any) => sum + t.pnl, 0) / winningTrades.length 
      : 0
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum: number, t: any) => sum + t.pnl, 0) / losingTrades.length)
      : 0
    const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0
    
    // Find most traded symbol
    const symbolCounts = trades.reduce((acc: any, t: Trade) => {
      const symbol = t.symbol || 'Unknown'
      acc[symbol] = (acc[symbol] || 0) + 1
      return acc
    }, {})
    const mostTraded = Object.entries(symbolCounts).sort((a: any, b: any) => b[1] - a[1])[0]
    
    // Calculate recent performance (last 10 trades)
    const recentTrades = trades.slice(-10)
    const recentPnL = recentTrades.reduce((sum: number, t: Trade) => sum + (t.pnl || 0), 0)
    const recentWinRate = recentTrades.length > 0 
      ? (recentTrades.filter((t: Trade) => t.pnl > 0).length / recentTrades.length) * 100 
      : 0
    
    return {
      totalPnL,
      winRate,
      riskReward,
      avgWin,
      avgLoss,
      totalTrades: trades.length,
      mostTraded: mostTraded ? mostTraded[0] : null,
      recentPnL,
      recentWinRate,
      streak: calculateStreak(trades)
    }
  }, [trades])

  // Calculate winning/losing streak
  function calculateStreak(trades: Trade[]) {
    if (trades.length === 0) return { type: 'none', count: 0 }
    
    let currentStreak = 0
    let streakType = trades[trades.length - 1].pnl > 0 ? 'winning' : 'losing'
    
    for (let i = trades.length - 1; i >= 0; i--) {
      const isWin = trades[i].pnl > 0
      if ((streakType === 'winning' && isWin) || (streakType === 'losing' && !isWin)) {
        currentStreak++
      } else {
        break
      }
    }
    
    return { type: streakType, count: currentStreak }
  }

  // Generate coaching tips based on performance
  const coachingTips = useMemo(() => {
    const tips = []
    
    if (!metrics) {
      // Tips for new traders
      return [
        {
          icon: faLightbulb,
          type: 'tip',
          title: "Welcome to TradeVault!",
          message: "Start logging your trades to get personalized coaching insights."
        },
        {
          icon: faBrain,
          type: 'info',
          title: "Track Everything",
          message: "The more data you log, the better insights I can provide about your trading patterns."
        },
        {
          icon: faChartLine,
          type: 'tip',
          title: "Set Clear Goals",
          message: "Define your risk management rules and stick to them. Consider using 1-2% risk per trade."
        }
      ]
    }
    
    // Performance-based tips
    if (metrics.winRate < 40) {
      tips.push({
        icon: faExclamationTriangle,
        type: 'warning',
        title: "Low Win Rate Alert",
        message: `Your win rate is ${metrics.winRate.toFixed(1)}%. Consider reviewing your entry criteria and market analysis.`
      })
    } else if (metrics.winRate > 60) {
      tips.push({
        icon: faTrophy,
        type: 'success',
        title: "Excellent Win Rate!",
        message: `${metrics.winRate.toFixed(1)}% win rate is impressive! Keep maintaining your discipline.`
      })
    }
    
    // Risk-reward tips
    if (metrics.riskReward < 1.5) {
      tips.push({
        icon: faArrowTrendDown,
        type: 'warning',
        title: "Risk-Reward Needs Work",
        message: `Your R:R is ${metrics.riskReward.toFixed(2)}. Aim for at least 1.5:1 to ensure long-term profitability.`
      })
    } else if (metrics.riskReward > 2) {
      tips.push({
        icon: faArrowTrendUp,
        type: 'success',
        title: "Great Risk Management!",
        message: `R:R of ${metrics.riskReward.toFixed(2)} is excellent. This gives you room for lower win rates.`
      })
    }
    
    // Streak-based tips
    if (metrics.streak.type === 'winning' && metrics.streak.count >= 3) {
      tips.push({
        icon: faTrophy,
        type: 'success',
        title: `${metrics.streak.count} Trade Win Streak!`,
        message: "You're in the zone! Stay disciplined and don't let overconfidence creep in."
      })
    } else if (metrics.streak.type === 'losing' && metrics.streak.count >= 3) {
      tips.push({
        icon: faExclamationTriangle,
        type: 'warning',
        title: `${metrics.streak.count} Trade Losing Streak`,
        message: "Consider taking a break to reset. Review your recent trades for patterns."
      })
    }
    
    // Recent performance
    if (metrics.recentWinRate > metrics.winRate + 10) {
      tips.push({
        icon: faArrowTrendUp,
        type: 'success',
        title: "Improving Performance!",
        message: `Your recent win rate (${metrics.recentWinRate.toFixed(1)}%) is better than your average. Great progress!`
      })
    } else if (metrics.recentWinRate < metrics.winRate - 10) {
      tips.push({
        icon: faArrowTrendDown,
        type: 'warning',
        title: "Recent Underperformance",
        message: "Your recent trades are below your average. Time to review and adjust your strategy."
      })
    }
    
    // General tips
    if (metrics.totalTrades < 20) {
      tips.push({
        icon: faLightbulb,
        type: 'info',
        title: "Build Your Database",
        message: "You have logged " + metrics.totalTrades + " trades. Keep logging to identify patterns in your trading."
      })
    }
    
    if (metrics.mostTraded) {
      tips.push({
        icon: faChartLine,
        type: 'info',
        title: "Favorite Pair",
        message: `You trade ${metrics.mostTraded} the most. Consider if you're missing opportunities in other pairs.`
      })
    }
    
    // Add motivational quote if doing well
    if (metrics.totalPnL > 0) {
      tips.push({
        icon: faBrain,
        type: 'success',
        title: "Stay Consistent",
        message: "\"The goal of a successful trader is to make the best trades. Money is secondary.\" - Alexander Elder"
      })
    }
    
    return tips
  }, [metrics])

  // Rotate through tips
  useEffect(() => {
    if (coachingTips.length <= 1) return
    
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % coachingTips.length)
        setIsAnimating(false)
      }, 150)
    }, 8000) // Change tip every 8 seconds
    
    return () => clearInterval(interval)
  }, [coachingTips.length])

  const currentTip = coachingTips[currentTipIndex] || coachingTips[0]

  const getTipColor = (type: string) => {
    switch (type) {
      case 'success': return themeColors.profit
      case 'warning': return themeColors.loss
      case 'info': return themeColors.primary
      default: return themeColors.primary
    }
  }

  const nextTip = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentTipIndex((prev) => (prev + 1) % coachingTips.length)
      setIsAnimating(false)
    }, 150)
  }

  const prevTip = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentTipIndex((prev) => (prev - 1 + coachingTips.length) % coachingTips.length)
      setIsAnimating(false)
    }, 150)
  }

  if (!currentTip) return null

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-muted/30 to-muted/10">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg" style={{backgroundColor: `${themeColors.primary}20`}}>
              <FontAwesomeIcon icon={faBrain} className="h-4 w-4" style={{color: themeColors.primary}} />
            </div>
            <span>AI Trading Coach</span>
          </div>
          {coachingTips.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevTip}
                className="h-7 w-7 p-0"
              >
                ←
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentTipIndex + 1} / {coachingTips.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextTip}
                className="h-7 w-7 p-0"
              >
                →
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className={cn(
          "transition-all duration-200",
          isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}>
          <div className="text-center space-y-3">
            <h3 className="font-semibold text-base" style={{color: getTipColor(currentTip.type)}}>
              {currentTip.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {currentTip.message}
            </p>
          </div>
        </div>
        
        {/* Progress dots */}
        {coachingTips.length > 1 && (
          <div className="flex items-center justify-center gap-1 mt-4">
            {coachingTips.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  index === currentTipIndex 
                    ? "w-6" 
                    : "w-1.5 opacity-40"
                )}
                style={{
                  backgroundColor: index === currentTipIndex 
                    ? getTipColor(currentTip.type)
                    : themeColors.primary
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}