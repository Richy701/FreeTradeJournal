import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useThemePresets } from '@/contexts/theme-presets'
import { useDemoData } from '@/hooks/use-demo-data'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserTie,
  faLightbulb,
  faChartLine,
  faExclamationTriangle,
  faTrophy,
  faArrowTrendUp,
  faArrowTrendDown,
  faBrain,
  faHeartPulse,
  faClock,
  faBalanceScale,
  faFire,
  faSnowflake,
  faGraduationCap,
  faChartPie,
  faCheck
} from '@fortawesome/free-solid-svg-icons'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Trade {
  pnl: number
  winRate?: number
  riskReward?: number
  symbol?: string
  exitTime?: Date
  entryTime?: Date
  volume?: number
  type?: 'long' | 'short'
  entryPrice?: number
  exitPrice?: number
  notes?: string
}

const TIP_SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  action: 2,
  success: 3,
  info: 4,
  tip: 5,
}

export function TradingCoach() {
  const { themeColors, alpha } = useThemePresets()
  const { getTrades } = useDemoData()
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dismissedCoachTips')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })
  const cardRef = useRef<HTMLDivElement>(null)

  // Get trades from demo data or localStorage
  const trades = useMemo(() => {
    const tradesData = getTrades()
    return tradesData.map((trade: any) => ({
      ...trade,
      exitTime: trade.exitTime ? new Date(trade.exitTime) : undefined,
      entryTime: trade.entryTime ? new Date(trade.entryTime) : undefined
    }))
  }, [getTrades])

  // Advanced pattern detection
  const detectTradingPatterns = (trades: Trade[]) => {
    const patterns = {
      overtrading: false,
      revengeTrading: false,
      revengeTradeProbability: 0,
      fomo: false,
      consistentTiming: false,
      positionSizingIssues: false,
      emotionalTrading: false,
      learningFromLosses: false
    }

    if (trades.length < 5) return patterns

    // Overtrading detection: More than 10 trades in a day
    const tradesPerDay = new Map()
    trades.forEach(trade => {
      if (trade.exitTime) {
        const day = trade.exitTime.toDateString()
        tradesPerDay.set(day, (tradesPerDay.get(day) || 0) + 1)
      }
    })
    patterns.overtrading = Array.from(tradesPerDay.values()).some(count => count > 10)

    // Revenge trading: Quick entries after losses with increased size
    let revengeCount = 0
    let lossFollowUps = 0
    for (let i = 1; i < trades.length; i++) {
      const currEntry = trades[i].entryTime
      const prevExit = trades[i-1].exitTime
      if (trades[i-1].pnl < 0 && currEntry && prevExit) {
        lossFollowUps++
        const timeDiff = (currEntry.getTime() - prevExit.getTime()) / (1000 * 60)
        const prevVolume = trades[i-1].volume || 0
        const currVolume = trades[i].volume || 0
        if (timeDiff < 30 && currVolume > prevVolume * 1.5) {
          revengeCount++
        }
      }
    }
    patterns.revengeTrading = revengeCount > 0
    patterns.revengeTradeProbability = lossFollowUps > 0
      ? Math.round((revengeCount / lossFollowUps) * 100)
      : 0

    // FOMO detection: Entering at extreme prices
    const recentTrades = trades.slice(-10)
    const highEntries = recentTrades.filter(t => {
      if (!t.entryPrice || !t.exitPrice) return false
      const movePercent = Math.abs((t.exitPrice - t.entryPrice) / t.entryPrice * 100)
      return movePercent > 5 && t.pnl < 0
    })
    patterns.fomo = highEntries.length > 3

    // Position sizing issues: High variance in trade sizes
    const volumes = trades.filter(t => t.volume).map(t => t.volume || 0)
    if (volumes.length > 5) {
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length
      const variance = volumes.map(v => Math.pow(v - avgVolume, 2)).reduce((a, b) => a + b, 0) / volumes.length
      const stdDev = Math.sqrt(variance)
      patterns.positionSizingIssues = stdDev / avgVolume > 0.5
    }

    // Emotional trading: Worse performance after losses
    let lossStreak = 0
    let performanceAfterLoss = []
    for (let i = 0; i < trades.length - 1; i++) {
      if (trades[i].pnl < 0) {
        lossStreak++
        performanceAfterLoss.push(trades[i + 1].pnl)
      } else {
        lossStreak = 0
      }
    }
    const avgPerformanceAfterLoss = performanceAfterLoss.length > 0
      ? performanceAfterLoss.reduce((a, b) => a + b, 0) / performanceAfterLoss.length
      : 0
    patterns.emotionalTrading = avgPerformanceAfterLoss < 0 && performanceAfterLoss.length > 3

    return patterns
  }

  // Time-based analysis
  const analyzeTimePatterns = (trades: Trade[]) => {
    const timeAnalysis = {
      bestHour: null as number | null,
      worstHour: null as number | null,
      bestDay: null as string | null,
      worstDay: null as string | null,
      morningPerformance: 0,
      afternoonPerformance: 0,
      consistency: 0
    }

    if (trades.length < 10) return timeAnalysis

    // Hour analysis
    const hourlyPnL = new Map()
    const hourlyCount = new Map()
    trades.forEach(trade => {
      if (trade.exitTime) {
        const hour = trade.exitTime.getHours()
        hourlyPnL.set(hour, (hourlyPnL.get(hour) || 0) + trade.pnl)
        hourlyCount.set(hour, (hourlyCount.get(hour) || 0) + 1)
      }
    })

    let bestHourPnL = -Infinity
    let worstHourPnL = Infinity
    hourlyPnL.forEach((pnl, hour) => {
      const avgPnL = pnl / (hourlyCount.get(hour) || 1)
      if (avgPnL > bestHourPnL) {
        bestHourPnL = avgPnL
        timeAnalysis.bestHour = hour
      }
      if (avgPnL < worstHourPnL) {
        worstHourPnL = avgPnL
        timeAnalysis.worstHour = hour
      }
    })

    // Day analysis
    const dailyPnL = new Map()
    const dailyCount = new Map()
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    trades.forEach(trade => {
      if (trade.exitTime) {
        const day = days[trade.exitTime.getDay()]
        dailyPnL.set(day, (dailyPnL.get(day) || 0) + trade.pnl)
        dailyCount.set(day, (dailyCount.get(day) || 0) + 1)
      }
    })

    let bestDayPnL = -Infinity
    let worstDayPnL = Infinity
    dailyPnL.forEach((pnl, day) => {
      const avgPnL = pnl / (dailyCount.get(day) || 1)
      if (avgPnL > bestDayPnL) {
        bestDayPnL = avgPnL
        timeAnalysis.bestDay = day
      }
      if (avgPnL < worstDayPnL) {
        worstDayPnL = avgPnL
        timeAnalysis.worstDay = day
      }
    })

    // Morning vs afternoon
    const morningTrades = trades.filter(t => t.exitTime && t.exitTime.getHours() < 12)
    const afternoonTrades = trades.filter(t => t.exitTime && t.exitTime.getHours() >= 12)
    timeAnalysis.morningPerformance = morningTrades.reduce((sum, t) => sum + t.pnl, 0)
    timeAnalysis.afternoonPerformance = afternoonTrades.reduce((sum, t) => sum + t.pnl, 0)

    return timeAnalysis
  }

  // Calculate advanced metrics
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

    // Profit factor
    const totalWins = winningTrades.reduce((sum: number, t: Trade) => sum + t.pnl, 0)
    const totalLosses = Math.abs(losingTrades.reduce((sum: number, t: Trade) => sum + t.pnl, 0))
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins

    // Maximum drawdown
    let maxDrawdown = 0
    let peak = 0
    let runningPnL = 0
    trades.forEach((trade: Trade) => {
      runningPnL += trade.pnl
      if (runningPnL > peak) peak = runningPnL
      const drawdown = peak - runningPnL
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    })

    // Sharpe ratio approximation
    const returns = trades.map((t: Trade) => t.pnl)
    const avgReturn = returns.reduce((a: number, b: number) => a + b, 0) / returns.length
    const variance = returns.map((r: number) => Math.pow(r - avgReturn, 2)).reduce((a: number, b: number) => a + b, 0) / returns.length
    const stdDev = Math.sqrt(variance)
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0

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

    // Long vs Short performance
    const longTrades = trades.filter((t: Trade) => t.type === 'long')
    const shortTrades = trades.filter((t: Trade) => t.type === 'short')
    const longWinRate = longTrades.length > 0
      ? (longTrades.filter((t: Trade) => t.pnl > 0).length / longTrades.length) * 100
      : 0
    const shortWinRate = shortTrades.length > 0
      ? (shortTrades.filter((t: Trade) => t.pnl > 0).length / shortTrades.length) * 100
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
      streak: calculateStreak(trades),
      profitFactor,
      maxDrawdown,
      sharpeRatio,
      longWinRate,
      shortWinRate,
      patterns: detectTradingPatterns(trades),
      timeAnalysis: analyzeTimePatterns(trades)
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

  // Generate smarter coaching tips based on advanced analysis
  const coachingTips = useMemo(() => {
    const tips: { icon: any; type: string; title: string; message: string; key: string }[] = []

    if (!metrics) {
      // Tips for new traders
      return [
        {
          icon: faLightbulb,
          type: 'tip',
          title: "Welcome to FreeTradeJournal!",
          message: "Start logging your trades to unlock AI-powered insights about your trading psychology and patterns.",
          key: "welcome"
        },
        {
          icon: faBrain,
          type: 'info',
          title: "Track Everything",
          message: "Log entry/exit times, emotions, and notes. The AI coach learns from your patterns to provide personalized guidance.",
          key: "track"
        },
        {
          icon: faChartLine,
          type: 'tip',
          title: "Set Clear Goals",
          message: "Define your risk management rules. Professional traders typically risk 1-2% per trade with a minimum 1.5:1 R:R.",
          key: "goals"
        }
      ]
    }

    // Pattern-based insights
    if (metrics.patterns.overtrading) {
      tips.push({
        icon: faFire,
        type: 'critical',
        title: "Overtrading Detected!",
        message: "You're taking too many trades per day. Quality over quantity. Set a daily trade limit and stick to it.",
        key: "overtrading"
      })
    }

    if (metrics.patterns.revengeTrading) {
      tips.push({
        icon: faHeartPulse,
        type: 'critical',
        title: "Revenge Trading Pattern",
        message: "You're increasing position sizes after losses. Take a 30-minute break after any loss to reset emotionally.",
        key: "revenge"
      })
    }

    if (metrics.patterns.fomo) {
      tips.push({
        icon: faExclamationTriangle,
        type: 'warning',
        title: "FOMO Trading Detected",
        message: "You're entering trades at extreme prices. Wait for pullbacks and use limit orders instead of market orders.",
        key: "fomo"
      })
    }

    if (metrics.patterns.positionSizingIssues) {
      tips.push({
        icon: faBalanceScale,
        type: 'warning',
        title: "Inconsistent Position Sizing",
        message: "Your trade sizes vary too much. Use a fixed percentage risk model (e.g., 1% per trade) for consistency.",
        key: "sizing"
      })
    }

    if (metrics.patterns.emotionalTrading) {
      tips.push({
        icon: faHeartPulse,
        type: 'critical',
        title: "Emotional Trading Detected",
        message: "Your performance drops after losses. Consider reducing position size by 50% after 2 consecutive losses.",
        key: "emotional"
      })
    }

    // Time-based insights
    if (metrics.timeAnalysis.bestHour !== null && metrics.timeAnalysis.worstHour !== null) {
      tips.push({
        icon: faClock,
        type: 'info',
        title: "Optimal Trading Hours",
        message: `You perform best at ${metrics.timeAnalysis.bestHour}:00 and worst at ${metrics.timeAnalysis.worstHour}:00. Focus your trading during peak performance hours.`,
        key: "hours"
      })
    }

    if (metrics.timeAnalysis.bestDay) {
      tips.push({
        icon: faClock,
        type: 'success',
        title: `Best Day: ${metrics.timeAnalysis.bestDay}`,
        message: `Your win rate is highest on ${metrics.timeAnalysis.bestDay}s. Consider increasing focus on this day.`,
        key: "bestday"
      })
    }

    if (metrics.timeAnalysis.morningPerformance > metrics.timeAnalysis.afternoonPerformance * 2) {
      tips.push({
        icon: faSnowflake,
        type: 'success',
        title: "Morning Trader Profile",
        message: "You perform significantly better in morning sessions. Consider closing your platform after lunch.",
        key: "morning"
      })
    }

    // Advanced metrics insights
    if (metrics.profitFactor > 2) {
      tips.push({
        icon: faTrophy,
        type: 'success',
        title: `Excellent Profit Factor: ${metrics.profitFactor.toFixed(2)}`,
        message: "Your wins significantly outweigh losses. This is institutional-level performance. Keep it up!",
        key: "pf-high"
      })
    } else if (metrics.profitFactor < 1.2) {
      tips.push({
        icon: faChartPie,
        type: 'warning',
        title: `Low Profit Factor: ${metrics.profitFactor.toFixed(2)}`,
        message: "Aim for a profit factor above 1.5. Focus on cutting losses quickly and letting winners run.",
        key: "pf-low"
      })
    }

    if (metrics.maxDrawdown > Math.abs(metrics.totalPnL * 0.5)) {
      tips.push({
        icon: faArrowTrendDown,
        type: 'critical',
        title: "High Drawdown Risk",
        message: `Your max drawdown is ${metrics.maxDrawdown.toFixed(2)}. This is too high relative to profits. Reduce position sizes.`,
        key: "drawdown"
      })
    }

    if (metrics.sharpeRatio > 1) {
      tips.push({
        icon: faGraduationCap,
        type: 'success',
        title: "Great Risk-Adjusted Returns",
        message: `Sharpe ratio of ${metrics.sharpeRatio.toFixed(2)} shows excellent consistency. You're managing risk well.`,
        key: "sharpe-high"
      })
    } else if (metrics.sharpeRatio < 0.5) {
      tips.push({
        icon: faGraduationCap,
        type: 'warning',
        title: "Improve Consistency",
        message: "Your returns are too volatile. Focus on consistent small wins rather than home runs.",
        key: "sharpe-low"
      })
    }

    // Direction bias insights
    if (metrics.longWinRate > metrics.shortWinRate + 20) {
      tips.push({
        icon: faArrowTrendUp,
        type: 'info',
        title: "Long Bias Detected",
        message: `You're ${metrics.longWinRate.toFixed(0)}% profitable on longs vs ${metrics.shortWinRate.toFixed(0)}% on shorts. Consider focusing on long setups.`,
        key: "longbias"
      })
    }

    // Performance-based tips
    if (metrics.winRate < 40 && metrics.riskReward < 1.5) {
      tips.push({
        icon: faExclamationTriangle,
        type: 'critical',
        title: "Unsustainable Strategy",
        message: `Low win rate (${metrics.winRate.toFixed(1)}%) with poor R:R (${metrics.riskReward.toFixed(2)}). You need either higher win rate OR better R:R to be profitable.`,
        key: "unsustainable"
      })
    } else if (metrics.winRate > 60 && metrics.riskReward > 2) {
      tips.push({
        icon: faTrophy,
        type: 'success',
        title: "Elite Performance!",
        message: `${metrics.winRate.toFixed(1)}% win rate with ${metrics.riskReward.toFixed(2)} R:R is exceptional. You're in the top 5% of traders.`,
        key: "elite"
      })
    }

    // Streak-based psychological insights
    if (metrics.streak.type === 'winning' && metrics.streak.count >= 5) {
      tips.push({
        icon: faFire,
        type: 'warning',
        title: `Hot Streak: ${metrics.streak.count} Wins`,
        message: "Don't increase position size! Most traders blow up accounts after win streaks due to overconfidence.",
        key: "hotstreak"
      })
    } else if (metrics.streak.type === 'losing' && metrics.streak.count >= 4) {
      tips.push({
        icon: faSnowflake,
        type: 'critical',
        title: `Cold Streak: ${metrics.streak.count} Losses`,
        message: "STOP TRADING TODAY. Review your last 5 trades for common mistakes. Return tomorrow with a fresh mindset.",
        key: "coldstreak"
      })
    }

    // Learning insights
    if (metrics.totalTrades > 50 && metrics.recentWinRate > metrics.winRate + 15) {
      tips.push({
        icon: faGraduationCap,
        type: 'success',
        title: "Rapid Improvement!",
        message: `Your recent win rate (${metrics.recentWinRate.toFixed(1)}%) shows you're learning fast. Document what's working!`,
        key: "improvement"
      })
    }

    // Psychological state detection
    const lastThreeTrades = trades.slice(-3)
    if (lastThreeTrades.length === 3 && lastThreeTrades.every((t: Trade) => t.pnl < 0)) {
      tips.push({
        icon: faHeartPulse,
        type: 'critical',
        title: "Tilt Warning",
        message: "3 losses in a row often lead to emotional decisions. Take a break, review your process, not the outcome.",
        key: "tilt"
      })
    }

    // Market condition awareness
    if (metrics.totalTrades > 20) {
      const volatileTrades = trades.filter((t: Trade) => {
        if (!t.entryPrice || !t.exitPrice) return false
        const move = Math.abs((t.exitPrice - t.entryPrice) / t.entryPrice * 100)
        return move > 3
      })
      if (volatileTrades.length / metrics.totalTrades > 0.6) {
        tips.push({
          icon: faChartLine,
          type: 'info',
          title: "High Volatility Trading",
          message: "You're trading in volatile conditions. Consider reducing position size by 30% to manage risk.",
          key: "volatility"
        })
      }
    }

    // Specific actionable advice
    if (metrics.totalTrades > 30 && metrics.winRate < 50 && metrics.riskReward < 2) {
      tips.push({
        icon: faBrain,
        type: 'action',
        title: "Action Plan",
        message: "1) Set minimum 2:1 R:R before entry. 2) Use alerts instead of watching charts. 3) Journal the 'why' behind each trade.",
        key: "actionplan"
      })
    }

    // Motivational insights based on progress
    if (metrics.totalPnL > 0 && metrics.totalTrades > 100) {
      tips.push({
        icon: faTrophy,
        type: 'success',
        title: "Proven Profitable Trader",
        message: "With 100+ trades and positive P&L, you've proven your edge. Now focus on scaling responsibly.",
        key: "proven"
      })
    }

    // Add data-driven prediction with calculated probability
    if (metrics.patterns.emotionalTrading && metrics.streak.type === 'losing') {
      const prob = metrics.patterns.revengeTradeProbability
      tips.push({
        icon: faBrain,
        type: 'critical',
        title: "High Risk Alert",
        message: `Based on your history, ${prob}% of trades after a loss show revenge patterns. Close your platform and take a break.`,
        key: "revenge-predict"
      })
    }

    // Sort by severity: critical first, then warning, action, success, info
    tips.sort((a, b) => (TIP_SEVERITY_ORDER[a.type] ?? 5) - (TIP_SEVERITY_ORDER[b.type] ?? 5))

    return tips.length > 0 ? tips : [{
      icon: faLightbulb,
      type: 'info',
      title: "Keep Trading",
      message: "Continue logging trades to unlock more personalized insights.",
      key: "keepgoing"
    }]
  }, [metrics, trades])

  // Filter out dismissed tips
  const visibleTips = useMemo(() => {
    const filtered = coachingTips.filter(tip => !dismissedTips.has(tip.key))
    return filtered.length > 0 ? filtered : coachingTips
  }, [coachingTips, dismissedTips])

  const dismissCurrentTip = useCallback(() => {
    const tip = visibleTips[currentTipIndex]
    if (!tip) return
    const next = new Set(dismissedTips)
    next.add(tip.key)
    setDismissedTips(next)
    try {
      localStorage.setItem('dismissedCoachTips', JSON.stringify([...next]))
    } catch {}
    // adjust index so we don't jump past the end
    if (currentTipIndex >= visibleTips.length - 1) {
      setCurrentTipIndex(0)
    }
  }, [visibleTips, currentTipIndex, dismissedTips])

  // Rotate through tips — pauses on hover and on critical tips
  useEffect(() => {
    if (visibleTips.length <= 1) return

    const currentTip = visibleTips[currentTipIndex]
    const isCritical = currentTip?.type === 'critical'

    if (isPaused || isCritical) return

    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % visibleTips.length)
        setIsAnimating(false)
      }, 150)
    }, 15000)

    return () => clearInterval(interval)
  }, [visibleTips.length, isPaused, currentTipIndex, visibleTips])

  // Keep index in bounds when tips change
  useEffect(() => {
    if (currentTipIndex >= visibleTips.length) {
      setCurrentTipIndex(0)
    }
  }, [visibleTips.length, currentTipIndex])

  const currentTip = visibleTips[currentTipIndex] || visibleTips[0]

  const getTipColor = (type: string) => {
    switch (type) {
      case 'success': return themeColors.profit
      case 'warning': return themeColors.loss
      case 'critical': return themeColors.loss
      case 'action': return themeColors.primary
      case 'info': return themeColors.primary
      default: return themeColors.primary
    }
  }

  const getTipIcon = (type: string) => {
    switch (type) {
      case 'success': return faTrophy
      case 'warning': return faExclamationTriangle
      case 'critical': return faFire
      case 'action': return faBrain
      case 'info': return faLightbulb
      default: return currentTip.icon || faLightbulb
    }
  }

  const goToTip = useCallback((index: number) => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentTipIndex(index)
      setIsAnimating(false)
    }, 150)
  }, [])

  const nextTip = useCallback(() => {
    goToTip((currentTipIndex + 1) % visibleTips.length)
  }, [currentTipIndex, visibleTips.length, goToTip])

  const prevTip = useCallback(() => {
    goToTip((currentTipIndex - 1 + visibleTips.length) % visibleTips.length)
  }, [currentTipIndex, visibleTips.length, goToTip])

  if (!currentTip) return null

  return (
    <Card
      ref={cardRef}
      className=""
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span>AI Trading Coach</span>
            {currentTip.type === 'critical' && (
              <span
                className="px-2 py-1 text-xs font-bold rounded animate-pulse"
                style={{
                  backgroundColor: alpha(themeColors.loss, '20'),
                  color: themeColors.loss
                }}
              >
                URGENT
              </span>
            )}
          </div>
          {visibleTips.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevTip}
                className="h-8 w-8 p-0"
              >
                ←
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3ch] text-center">
                {currentTipIndex + 1} / {visibleTips.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextTip}
                className="h-8 w-8 p-0"
              >
                →
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className={cn(
          "transition-shadow duration-200",
          isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}>
          <div className="text-center space-y-3">
            <div className="flex flex-col items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{backgroundColor: alpha(getTipColor(currentTip.type), '20')}}
              >
                <FontAwesomeIcon
                  icon={getTipIcon(currentTip.type)}
                  className="h-5 w-5"
                  style={{color: getTipColor(currentTip.type)}}
                />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-2" style={{color: getTipColor(currentTip.type)}}>
                  {currentTip.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  {currentTip.message}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress dots + dismiss */}
        {visibleTips.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {visibleTips.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "rounded-full transition-shadow duration-200",
                  index === currentTipIndex
                    ? "h-2 w-6"
                    : "h-2 w-2 opacity-40 hover:opacity-70"
                )}
                style={{
                  backgroundColor: index === currentTipIndex
                    ? getTipColor(currentTip.type)
                    : themeColors.primary
                }}
                onClick={() => goToTip(index)}
                aria-label={`Go to tip ${index + 1}`}
              />
            ))}
            <button
              onClick={dismissCurrentTip}
              className="ml-2 h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors"
              aria-label="Dismiss this tip"
              title="Got it, dismiss"
            >
              <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Severity indicator for critical alerts */}
        {currentTip.type === 'critical' && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: alpha(themeColors.loss, '20') }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: themeColors.loss }}>
              <FontAwesomeIcon icon={faExclamationTriangle} className="h-3 w-3" />
              <span>Immediate action recommended</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
