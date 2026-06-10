import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AIFeedback } from '@/components/ui/ai-feedback'
import { useThemePresets } from '@/contexts/theme-presets'
import { useDemoData } from '@/hooks/use-demo-data'
import { Lightbulb, ChartLineUp, Warning, Trophy, TrendUp, TrendDown, Brain, Heartbeat, Clock, Scales, Fire, Snowflake, GraduationCap, ChartPie, Check, ChatCircle, PaperPlaneTilt, X, type Icon } from '@phosphor-icons/react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useProStatus } from '@/contexts/pro-context'
import { useStreamingAI } from '@/hooks/use-streaming-ai'
import { useUserStorage } from '@/utils/user-storage'
import { getAICache, setAICache } from '@/utils/ai-cache'
import { SpinnerGap } from '@phosphor-icons/react'
import DOMPurify from 'dompurify'

interface Trade {
  pnl: number
  winRate?: number
  riskReward?: number
  symbol?: string
  exitTime?: Date
  entryTime?: Date
  lotSize?: number
  side?: 'long' | 'short'
  entryPrice?: number
  exitPrice?: number
  notes?: string
  emotions?: string
}

const NEGATIVE_EMOTIONS = new Set(['Anxious', 'Fearful', 'FOMO', 'Greedy', 'Revenge', 'Frustrated', 'Uncertain'])
const POSITIVE_EMOTIONS = new Set(['Confident', 'Disciplined', 'Patient'])

interface TiltScore {
  score: number
  label: string
  color: string
  factors: string[]
}

function computeTiltScore(trades: Trade[], themeColors: { profit: string; loss: string; primary: string }): TiltScore {
  const factors: string[] = []
  let score = 0

  if (trades.length < 3) {
    return { score: 0, label: 'Insufficient data', color: themeColors.primary, factors: [] }
  }

  const sorted = [...trades]
    .filter(t => t.exitTime)
    .sort((a, b) => new Date(b.exitTime!).getTime() - new Date(a.exitTime!).getTime())

  if (sorted.length < 3) {
    return { score: 0, label: 'Insufficient data', color: themeColors.primary, factors: [] }
  }

  // Factor 1: Consecutive recent losses (0-30 pts)
  let streak = 0
  for (const t of sorted) {
    if (t.pnl < 0) streak++
    else break
  }
  if (streak >= 2) {
    const pts = Math.min(30, streak * 8)
    score += pts
    factors.push(`${streak} consecutive losses`)
  }

  // Factor 2: Negative emotions on recent trades (0-25 pts)
  const recent = sorted.slice(0, 8)
  let negCount = 0
  let posCount = 0
  for (const t of recent) {
    if (t.emotions) {
      const tags = t.emotions.split(',').map(e => e.trim())
      for (const tag of tags) {
        if (NEGATIVE_EMOTIONS.has(tag)) negCount++
        if (POSITIVE_EMOTIONS.has(tag)) posCount++
      }
    }
  }
  if (negCount > 0) {
    const pts = Math.min(25, negCount * 5)
    score += pts
    factors.push(`${negCount} negative emotion tags recently`)
  }
  if (posCount > 0) {
    score = Math.max(0, score - posCount * 3)
  }

  // Factor 3: Rapid entries after losses - revenge trading signal (0-25 pts)
  let rapidAfterLoss = 0
  for (let i = 0; i < Math.min(sorted.length - 1, 6); i++) {
    const curr = sorted[i]
    const prev = sorted[i + 1]
    if (prev.pnl < 0 && curr.entryTime && prev.exitTime) {
      const gap = (new Date(curr.entryTime).getTime() - new Date(prev.exitTime!).getTime()) / 60000
      if (gap >= 0 && gap < 10) {
        rapidAfterLoss++
      }
    }
  }
  if (rapidAfterLoss > 0) {
    const pts = Math.min(25, rapidAfterLoss * 10)
    score += pts
    factors.push(`${rapidAfterLoss} rapid entries after losses`)
  }

  // Factor 4: Increasing size after losses (0-20 pts)
  let sizeEscalations = 0
  for (let i = 0; i < Math.min(sorted.length - 1, 6); i++) {
    const curr = sorted[i]
    const prev = sorted[i + 1]
    if (prev.pnl < 0 && curr.lotSize && prev.lotSize && curr.lotSize > prev.lotSize * 1.3) {
      sizeEscalations++
    }
  }
  if (sizeEscalations > 0) {
    const pts = Math.min(20, sizeEscalations * 10)
    score += pts
    factors.push(`Position size increased after ${sizeEscalations} loss(es)`)
  }

  score = Math.min(100, Math.max(0, score))

  let label: string
  let color: string
  if (score <= 20) {
    label = 'Focused'
    color = themeColors.profit
  } else if (score <= 45) {
    label = 'Steady'
    color = themeColors.primary
  } else if (score <= 65) {
    label = 'Caution'
    color = themeColors.primary
  } else {
    label = 'On Tilt'
    color = themeColors.loss
  }

  return { score, label, color, factors }
}

function TiltMeter({ tilt, alpha }: { tilt: TiltScore; alpha: (color: string, opacity: string) => string }) {
  const [showFactors, setShowFactors] = useState(false)
  const pct = Math.max(2, tilt.score)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heartbeat className="h-4 w-4" style={{ color: tilt.color }} />
          <span className="text-sm font-semibold">Tilt Meter</span>
        </div>
        <button
          onClick={() => setShowFactors(!showFactors)}
          className="flex items-center gap-1.5"
        >
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: alpha(tilt.color, '18'),
              color: tilt.color,
            }}
          >
            {tilt.label}
          </span>
        </button>
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: tilt.color,
          }}
        />
      </div>
      {showFactors && tilt.factors.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-0.5 pt-1">
          {tilt.factors.map((f, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: tilt.color }} />
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const CHAT_CACHE_KEY = 'ftj-coach-chat-history'
const CHAT_SUGGESTIONS = [
  "Why am I losing money?",
  "What's my best setup?",
  "Should I stop trading today?",
  "How can I improve my win rate?",
]

function renderChatMarkdown(md: string): string {
  const html = md
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-3 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-3 list-decimal">$2</li>')
    .replace(/\n\n/g, '<br/>')
    .replace(/\n/g, ' ')
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'li', 'br'],
    ALLOWED_ATTR: ['class'],
  })
}

const TIP_SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  action: 2,
  success: 3,
  info: 4,
  tip: 5,
}

const AI_COACH_CACHE_KEY = 'ftj-ai-coaching-tips'
const AI_COACH_TTL = 24 * 60 * 60 * 1000 // 24h

export function TradingCoach() {
  const { themeColors, alpha } = useThemePresets()
  const { getTrades } = useDemoData()
  const { isPro, hasAIAccess, updateFreeAiQuota } = useProStatus()
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [aiTips, setAiTips] = useState<any[] | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dismissedCoachTips')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })
  const cardRef = useRef<HTMLDivElement>(null)

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(CHAT_CACHE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })
  const [chatInput, setChatInput] = useState('')
  const { streamText, isStreaming: chatStreaming, startStream, meta: chatMeta } = useStreamingAI()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const userStorage = useUserStorage()

  // Get trades from demo data or localStorage
  const trades = useMemo(() => {
    const tradesData = getTrades()
    return tradesData.map((trade: any) => ({
      ...trade,
      exitTime: trade.exitTime ? new Date(trade.exitTime) : undefined,
      entryTime: trade.entryTime ? new Date(trade.entryTime) : undefined
    }))
  }, [getTrades])

  const tiltScore = useMemo(() => computeTiltScore(trades, themeColors), [trades, themeColors])

  // Persist chat history
  useEffect(() => {
    if (chatMessages.length > 0) {
      try {
        localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(chatMessages.slice(-20)))
      } catch {}
    }
  }, [chatMessages])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, streamText])

  // Update free quota from chat responses
  useEffect(() => {
    if (chatMeta?.freeUsage) updateFreeAiQuota(chatMeta.freeUsage)
  }, [chatMeta])

  const buildChatContext = useCallback(() => {
    const wins = trades.filter((t: Trade) => t.pnl > 0).length
    const totalPnl = trades.reduce((s: number, t: Trade) => s + t.pnl, 0)
    const avgPnl = trades.length > 0 ? totalPnl / trades.length : 0

    let consLosses = 0
    for (const t of [...trades].reverse()) {
      if (t.pnl < 0) consLosses++
      else break
    }

    const goalsRaw = userStorage.getItem('tradingGoals')
    const rulesRaw = userStorage.getItem('riskRules')
    let goals: any[] = []
    let rules: any[] = []
    try { goals = goalsRaw ? JSON.parse(goalsRaw) : [] } catch {}
    try { rules = rulesRaw ? JSON.parse(rulesRaw) : [] } catch {}

    return {
      stats: {
        winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
        totalPnl,
        avgPnl,
        tradeCount: trades.length,
        consecutiveLosses: consLosses,
      },
      recentTrades: trades.slice(-10).map((t: Trade) => ({
        symbol: t.symbol,
        side: t.side || 'long',
        pnl: t.pnl,
        holdMinutes: t.entryTime && t.exitTime
          ? Math.round((new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime()) / 60000)
          : null,
        emotions: t.emotions || null,
      })),
      goals: goals.map((g: any) => ({ type: g.type, period: g.period, target: g.target, current: g.current })),
      rules: rules.map((r: any) => ({ type: r.type, value: r.value })),
      tiltFactors: tiltScore.factors,
    }
  }, [trades, userStorage, tiltScore.factors])

  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim() || chatStreaming) return

    const userMsg: ChatMessage = { role: 'user', content: message.trim() }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')

    try {
      const context = buildChatContext()
      const result = await startStream('assist', {
        type: 'coach_chat',
        payload: {
          message: userMsg.content,
          history: chatMessages.slice(-6),
          ...context,
        },
      })

      if (result) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: result }])
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not respond right now. Try again.' }])
    }
  }, [chatStreaming, chatMessages, buildChatContext, startStream])

  const clearChat = useCallback(() => {
    setChatMessages([])
    localStorage.removeItem(CHAT_CACHE_KEY)
  }, [])

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
        const prevVolume = trades[i-1].lotSize || 0
        const currVolume = trades[i].lotSize || 0
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
    const volumes: number[] = [];
    for (const t of trades) { if (t.lotSize) volumes.push(t.lotSize); }
    if (volumes.length > 5) {
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length
      let varianceSum = 0;
      for (const v of volumes) varianceSum += (v - avgVolume) ** 2;
      const variance = varianceSum / volumes.length
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
    const longTrades = trades.filter((t: Trade) => t.side === 'long')
    const shortTrades = trades.filter((t: Trade) => t.side === 'short')
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

  // Stable fingerprint of trade data — changes when trades are added/edited
  const tradeFingerprint = useMemo(() => {
    if (trades.length === 0) return ''
    const totalPnL = trades.reduce((s: number, t: Trade) => s + t.pnl, 0)
    return `${trades.length}:${totalPnL.toFixed(2)}`
  }, [trades])

  // Fetch AI coaching tips for Pro users
  const aiFetchedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!hasAIAccess || trades.length < 3 || !metrics) return

    // Check cache first
    const cached = getAICache<any[]>(AI_COACH_CACHE_KEY, AI_COACH_TTL)
    if (cached && aiFetchedRef.current === tradeFingerprint) {
      setAiTips(cached)
      return
    }

    // If trade data changed, clear stale cache
    if (aiFetchedRef.current !== null && aiFetchedRef.current !== tradeFingerprint) {
      setAiTips(null)
    }

    // Prevent duplicate fetch (React StrictMode double-invocation)
    if (aiFetchedRef.current === tradeFingerprint) return
    aiFetchedRef.current = tradeFingerprint

    const fetchAITips = async () => {
      setAiLoading(true)
      try {
        // Compute stats for the payload
        const wins = trades.filter((t: Trade) => t.pnl > 0).length
        const totalPnl = trades.reduce((s: number, t: Trade) => s + t.pnl, 0)
        const avgPnl = totalPnl / trades.length

        // Find best/worst symbols
        const symbolPnl: Record<string, number> = {}
        trades.forEach((t: Trade) => {
          if (t.symbol) symbolPnl[t.symbol] = (symbolPnl[t.symbol] || 0) + t.pnl
        })
        const sorted = Object.entries(symbolPnl).sort((a, b) => b[1] - a[1])
        const bestSymbol = sorted[0]?.[0]
        const worstSymbol = sorted[sorted.length - 1]?.[0]

        // Consecutive losses
        let consLosses = 0
        for (const t of [...trades].reverse()) {
          if (t.pnl < 0) consLosses++
          else break
        }

        // Avg hold
        const holdTimes = trades
          .filter((t: Trade) => t.entryTime && t.exitTime)
          .map((t: Trade) => (new Date(t.exitTime!).getTime() - new Date(t.entryTime!).getTime()) / 60000)
        const avgHoldMinutes = holdTimes.length > 0 ? Math.round(holdTimes.reduce((a: number, b: number) => a + b, 0) / holdTimes.length) : 0

        const { requestAIAssist } = await import('@/services/ai-assist')
        const response = await requestAIAssist({
          type: 'coaching_tips',
          payload: {
            trades: trades.slice(-15).map((t: Trade) => ({
              symbol: t.symbol,
              side: t.side || 'long',
              pnl: t.pnl,
              holdMinutes: t.entryTime && t.exitTime
                ? Math.round((new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime()) / 60000)
                : null,
              emotions: t.emotions || null,
            })),
            winRate: (wins / trades.length) * 100,
            avgPnl,
            totalPnl,
            consecutiveLosses: consLosses,
            bestSymbol,
            worstSymbol,
            avgHoldMinutes,
            tradeCount: trades.length,
          },
        })

        if (response.freeUsage) updateFreeAiQuota(response.freeUsage)
        const parsed = JSON.parse(response.result)
        if (Array.isArray(parsed)) {
          const tipsWithKeys = parsed.map((tip: any, i: number) => ({
            icon: Lightbulb,
            type: tip.type || 'info',
            title: tip.title || 'Tip',
            message: tip.message || '',
            key: `ai-tip-${i}`,
          }))
          setAiTips(tipsWithKeys)
          setAICache(AI_COACH_CACHE_KEY, tipsWithKeys)
        }
      } catch {
        // Silently fall back to client-side tips
      } finally {
        setAiLoading(false)
      }
    }

    fetchAITips()
  }, [hasAIAccess, trades.length, tradeFingerprint, metrics])

  // Generate smarter coaching tips based on advanced analysis
  const coachingTips = useMemo(() => {
    const tips: { icon: any; type: string; title: string; message: string; key: string }[] = []

    if (!metrics) {
      // Tips for new traders
      return [
        {
          icon: Lightbulb,
          type: 'tip',
          title: "Meet Coach FTJ",
          message: "Start logging your trades to unlock AI-powered insights about your trading psychology and patterns.",
          key: "welcome"
        },
        {
          icon: Brain,
          type: 'info',
          title: "Track Everything",
          message: "Log entry/exit times, emotions, and notes. Coach FTJ learns from your patterns to provide personalized guidance.",
          key: "track"
        },
        {
          icon: ChartLineUp,
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
        icon: Fire,
        type: 'critical',
        title: "Overtrading Detected!",
        message: "You're taking too many trades per day. Quality over quantity. Set a daily trade limit and stick to it.",
        key: "overtrading"
      })
    }

    if (metrics.patterns.revengeTrading) {
      tips.push({
        icon: Heartbeat,
        type: 'critical',
        title: "Revenge Trading Pattern",
        message: "You're increasing position sizes after losses. Take a 30-minute break after any loss to reset emotionally.",
        key: "revenge"
      })
    }

    if (metrics.patterns.fomo) {
      tips.push({
        icon: Warning,
        type: 'warning',
        title: "FOMO Trading Detected",
        message: "You're entering trades at extreme prices. Wait for pullbacks and use limit orders instead of market orders.",
        key: "fomo"
      })
    }

    if (metrics.patterns.positionSizingIssues) {
      tips.push({
        icon: Scales,
        type: 'warning',
        title: "Inconsistent Position Sizing",
        message: "Your trade sizes vary too much. Use a fixed percentage risk model (e.g., 1% per trade) for consistency.",
        key: "sizing"
      })
    }

    if (metrics.patterns.emotionalTrading) {
      tips.push({
        icon: Heartbeat,
        type: 'critical',
        title: "Emotional Trading Detected",
        message: "Your performance drops after losses. Consider reducing position size by 50% after 2 consecutive losses.",
        key: "emotional"
      })
    }

    // Time-based insights
    if (metrics.timeAnalysis.bestHour !== null && metrics.timeAnalysis.worstHour !== null) {
      tips.push({
        icon: Clock,
        type: 'info',
        title: "Optimal Trading Hours",
        message: `You perform best at ${metrics.timeAnalysis.bestHour}:00 and worst at ${metrics.timeAnalysis.worstHour}:00. Focus your trading during peak performance hours.`,
        key: "hours"
      })
    }

    if (metrics.timeAnalysis.bestDay) {
      tips.push({
        icon: Clock,
        type: 'success',
        title: `Best Day: ${metrics.timeAnalysis.bestDay}`,
        message: `Your win rate is highest on ${metrics.timeAnalysis.bestDay}s. Consider increasing focus on this day.`,
        key: "bestday"
      })
    }

    if (metrics.timeAnalysis.morningPerformance > metrics.timeAnalysis.afternoonPerformance * 2) {
      tips.push({
        icon: Snowflake,
        type: 'success',
        title: "Morning Trader Profile",
        message: "You perform significantly better in morning sessions. Consider closing your platform after lunch.",
        key: "morning"
      })
    }

    // Advanced metrics insights
    if (metrics.profitFactor > 2) {
      tips.push({
        icon: Trophy,
        type: 'success',
        title: `Excellent Profit Factor: ${metrics.profitFactor.toFixed(2)}`,
        message: "Your wins significantly outweigh losses. This is institutional-level performance. Keep it up!",
        key: "pf-high"
      })
    } else if (metrics.profitFactor < 1.2) {
      tips.push({
        icon: ChartPie,
        type: 'warning',
        title: `Low Profit Factor: ${metrics.profitFactor.toFixed(2)}`,
        message: "Aim for a profit factor above 1.5. Focus on cutting losses quickly and letting winners run.",
        key: "pf-low"
      })
    }

    if (metrics.maxDrawdown > Math.abs(metrics.totalPnL * 0.5)) {
      tips.push({
        icon: TrendDown,
        type: 'critical',
        title: "High Drawdown Risk",
        message: `Your max drawdown is ${metrics.maxDrawdown.toFixed(2)}. This is too high relative to profits. Reduce position sizes.`,
        key: "drawdown"
      })
    }

    if (metrics.sharpeRatio > 1) {
      tips.push({
        icon: GraduationCap,
        type: 'success',
        title: "Great Risk-Adjusted Returns",
        message: `Sharpe ratio of ${metrics.sharpeRatio.toFixed(2)} shows excellent consistency. You're managing risk well.`,
        key: "sharpe-high"
      })
    } else if (metrics.sharpeRatio < 0.5) {
      tips.push({
        icon: GraduationCap,
        type: 'warning',
        title: "Improve Consistency",
        message: "Your returns are too volatile. Focus on consistent small wins rather than home runs.",
        key: "sharpe-low"
      })
    }

    // Direction bias insights
    if (metrics.longWinRate > metrics.shortWinRate + 20) {
      tips.push({
        icon: TrendUp,
        type: 'info',
        title: "Long Bias Detected",
        message: `You're ${metrics.longWinRate.toFixed(0)}% profitable on longs vs ${metrics.shortWinRate.toFixed(0)}% on shorts. Consider focusing on long setups.`,
        key: "longbias"
      })
    }

    // Performance-based tips
    if (metrics.winRate < 40 && metrics.riskReward < 1.5) {
      tips.push({
        icon: Warning,
        type: 'critical',
        title: "Unsustainable Strategy",
        message: `Low win rate (${metrics.winRate.toFixed(1)}%) with poor R:R (${metrics.riskReward.toFixed(2)}). You need either higher win rate OR better R:R to be profitable.`,
        key: "unsustainable"
      })
    } else if (metrics.winRate > 60 && metrics.riskReward > 2) {
      tips.push({
        icon: Trophy,
        type: 'success',
        title: "Elite Performance!",
        message: `${metrics.winRate.toFixed(1)}% win rate with ${metrics.riskReward.toFixed(2)} R:R is exceptional. You're in the top 5% of traders.`,
        key: "elite"
      })
    }

    // Streak-based psychological insights
    if (metrics.streak.type === 'winning' && metrics.streak.count >= 5) {
      tips.push({
        icon: Fire,
        type: 'warning',
        title: `Hot Streak: ${metrics.streak.count} Wins`,
        message: "Don't increase position size! Most traders blow up accounts after win streaks due to overconfidence.",
        key: "hotstreak"
      })
    } else if (metrics.streak.type === 'losing' && metrics.streak.count >= 4) {
      tips.push({
        icon: Snowflake,
        type: 'critical',
        title: `Cold Streak: ${metrics.streak.count} Losses`,
        message: "STOP TRADING TODAY. Review your last 5 trades for common mistakes. Return tomorrow with a fresh mindset.",
        key: "coldstreak"
      })
    }

    // Learning insights
    if (metrics.totalTrades > 50 && metrics.recentWinRate > metrics.winRate + 15) {
      tips.push({
        icon: GraduationCap,
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
        icon: Heartbeat,
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
          icon: ChartLineUp,
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
        icon: Brain,
        type: 'action',
        title: "Action Plan",
        message: "1) Set minimum 2:1 R:R before entry. 2) Use alerts instead of watching charts. 3) Journal the 'why' behind each trade.",
        key: "actionplan"
      })
    }

    // Motivational insights based on progress
    if (metrics.totalPnL > 0 && metrics.totalTrades > 100) {
      tips.push({
        icon: Trophy,
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
        icon: Brain,
        type: 'critical',
        title: "High Risk Alert",
        message: `Based on your history, ${prob}% of trades after a loss show revenge patterns. Close your platform and take a break.`,
        key: "revenge-predict"
      })
    }

    // Sort by severity: critical first, then warning, action, success, info
    tips.sort((a, b) => (TIP_SEVERITY_ORDER[a.type] ?? 5) - (TIP_SEVERITY_ORDER[b.type] ?? 5))

    return tips.length > 0 ? tips : [{
      icon: Lightbulb,
      type: 'info',
      title: "Keep Trading",
      message: "Continue logging trades to unlock more personalized insights.",
      key: "keepgoing"
    }]
  }, [metrics, trades])

  // Use AI tips for Pro users, client-side tips for free users
  const baseTips = hasAIAccess && aiTips ? aiTips : coachingTips

  // Filter out dismissed tips
  const visibleTips = useMemo(() => {
    const filtered = baseTips.filter(tip => !dismissedTips.has(tip.key))
    return filtered.length > 0 ? filtered : baseTips
  }, [baseTips, dismissedTips])

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

  const getTipIcon = (type: string): Icon => {
    switch (type) {
      case 'success': return Trophy
      case 'warning': return Warning
      case 'critical': return Fire
      case 'action': return Brain
      case 'info': return Lightbulb
      default: return currentTip.icon || Lightbulb
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
            <span>Coach FTJ</span>
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
                aria-label="Previous tip"
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
                aria-label="Next tip"
              >
                →
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {trades.length >= 3 && (
          <div className="mb-4 pb-4 border-b border-border/50">
            <TiltMeter tilt={tiltScore} alpha={alpha} />
          </div>
        )}
        {aiLoading ? (
          <div className="flex items-center justify-center gap-2 py-6">
            <SpinnerGap className="h-4 w-4 animate-spin" style={{ color: themeColors.primary }} />
            <span className="text-sm text-muted-foreground">Loading AI coaching...</span>
          </div>
        ) : (
        <>
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
                {(() => { const TipIcon = getTipIcon(currentTip.type); return <TipIcon className="h-5 w-5" style={{color: getTipColor(currentTip.type)}} />; })()}
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
                  "indicator-dot rounded-full transition-shadow duration-200 box-content p-1",
                  index === currentTipIndex
                    ? "h-1.5 w-4"
                    : "h-1.5 w-1.5 opacity-40 hover:opacity-70"
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
              className="indicator-dot ml-1.5 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors"
              aria-label="Dismiss this tip"
              title="Got it, dismiss"
            >
              <Check className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* AI Feedback */}
        {aiTips && (
          <div className="mt-3 pt-3 border-t border-border/50 flex justify-center">
            <AIFeedback feature="Coach FTJ" responseId={currentTip?.title} />
          </div>
        )}

        {/* Severity indicator for critical alerts */}
        {currentTip.type === 'critical' && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: alpha(themeColors.loss, '20') }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: themeColors.loss }}>
              <Warning className="h-3 w-3" />
              <span>Immediate action recommended</span>
            </div>
          </div>
        )}

        {/* Ask Coach FTJ */}
        {hasAIAccess && (
          <div className="mt-4 pt-4 border-t border-border/50">
            {!chatOpen ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => { setChatOpen(true); setTimeout(() => chatInputRef.current?.focus(), 100) }}
              >
                <ChatCircle className="mr-2 h-3.5 w-3.5" />
                Ask Coach FTJ
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chat</span>
                  <div className="flex items-center gap-1">
                    {chatMessages.length > 0 && (
                      <button
                        onClick={clearChat}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => setChatOpen(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      aria-label="Close chat"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="max-h-64 overflow-y-auto space-y-2.5 scroll-smooth">
                  {chatMessages.length === 0 && !chatStreaming && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground text-center">Ask anything about your trading</p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {CHAT_SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => sendChatMessage(s)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-border/70 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "text-sm leading-relaxed",
                        msg.role === 'user'
                          ? "text-right"
                          : "[&_strong]:text-foreground [&_li]:py-0.5"
                      )}
                    >
                      {msg.role === 'user' ? (
                        <span
                          className="inline-block px-3 py-1.5 rounded-lg text-sm"
                          style={{
                            backgroundColor: alpha(themeColors.primary, '15'),
                            color: themeColors.primary,
                          }}
                        >
                          {msg.content}
                        </span>
                      ) : (
                        <div
                          className="text-sm text-muted-foreground leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderChatMarkdown(msg.content) }}
                        />
                      )}
                    </div>
                  ))}
                  {chatStreaming && streamText && (
                    <div className="text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_li]:py-0.5">
                      <div dangerouslySetInnerHTML={{ __html: renderChatMarkdown(streamText) }} />
                      <span className="inline-block h-3 w-0.5 ml-0.5 animate-pulse" style={{ backgroundColor: themeColors.primary }} />
                    </div>
                  )}
                  {chatStreaming && !streamText && (
                    <div className="flex items-center gap-2 py-2">
                      <SpinnerGap className="h-3.5 w-3.5 animate-spin" style={{ color: themeColors.primary }} />
                      <span className="text-xs text-muted-foreground">Coach FTJ is thinking...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={(e) => { e.preventDefault(); sendChatMessage(chatInput) }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask Coach FTJ..."
                    disabled={chatStreaming}
                    className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 disabled:opacity-50"
                    style={{ focusRingColor: themeColors.primary } as React.CSSProperties}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!chatInput.trim() || chatStreaming}
                    className="h-9 w-9 p-0 shrink-0"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    <PaperPlaneTilt className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}
        </>
        )}
      </CardContent>
    </Card>
  )
}
