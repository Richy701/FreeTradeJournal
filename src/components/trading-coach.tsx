import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AIFeedback } from '@/components/ui/ai-feedback'
import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { useDemoData } from '@/hooks/use-demo-data'
import { Lightbulb, ChartLineUp, Warning, Trophy, TrendUp, TrendDown, Brain, Heartbeat, Clock, Scales, Fire, Snowflake, GraduationCap, ChartPie, ChatCircle, PaperPlaneTilt, X, type Icon } from '@phosphor-icons/react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useProStatus } from '@/contexts/pro-context'
import { Link } from 'react-router-dom'
import { Sparkle } from '@phosphor-icons/react'
import { trackEvent } from '@/lib/analytics'
import { useStreamingAI } from '@/hooks/use-streaming-ai'
import { useUserStorage } from '@/utils/user-storage'
import { getAICache, setAICache } from '@/utils/ai-cache'
import { SpinnerGap } from '@phosphor-icons/react'
import { renderMarkdown } from '@/lib/markdown'

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
  strategy?: string
}

const NEGATIVE_EMOTIONS = new Set(['Anxious', 'Fearful', 'FOMO', 'Greedy', 'Revenge', 'Frustrated', 'Uncertain'])
const POSITIVE_EMOTIONS = new Set(['Confident', 'Disciplined', 'Patient'])

// Chat aggregation tuning. Buckets are ranked by sample size (trade count),
// never by raw dollar P&L, so a 2-trade symbol can never out-rank a 200-trade one.
const SIGNIFICANCE_THRESHOLD = 25 // buckets/overall below this are flagged not statistically significant
const MAX_BUCKETS = 6 // cap groups serialized into the chat payload (top N by trade count)
const MIN_STRATEGY_TAGGED_RATIO = 0.2 // need >=20% of trades tagged before we show any strategy edge

// CSV/demo/legacy pnl can be NaN/undefined; coerce to a finite number once.
const safeNum = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0

interface GroupAcc {
  key: string
  count: number
  wins: number
  losses: number
  netPnl: number
  sumWinPnl: number
  sumLossPnl: number // running NEGATIVE-or-zero sum of losing pnl
  rrSum: number // sum of PLANNED riskReward, only over trades with riskReward > 0
  rrCount: number // how many trades in this group have a planned R:R set
}

interface GroupStat {
  key: string
  count: number
  winRate: number // 0..100
  netPnl: number
  avgPnl: number
  payoffRatio: number | null // avgWin / |avgLoss|, null when not computable
  avgPlannedRR: number | null // avg of riskReward>0 subset, null when none set
  rrSampleCount: number // how many trades had a planned R:R (honesty)
  significant: boolean // count >= SIGNIFICANCE_THRESHOLD
}

function makeAcc(key: string): GroupAcc {
  return { key, count: 0, wins: 0, losses: 0, netPnl: 0, sumWinPnl: 0, sumLossPnl: 0, rrSum: 0, rrCount: 0 }
}

function pushTradeIntoAcc(acc: GroupAcc, pnl: number, rr: number) {
  acc.count++
  acc.netPnl += pnl
  if (pnl > 0) { acc.wins++; acc.sumWinPnl += pnl }
  else if (pnl < 0) { acc.losses++; acc.sumLossPnl += pnl }
  // pnl === 0 counts toward count/netPnl but is neither win nor loss.
  if (Number.isFinite(rr) && rr > 0) { acc.rrSum += rr; acc.rrCount++ }
}

function finalizeAcc(acc: GroupAcc): GroupStat {
  const avgWin = acc.wins > 0 ? acc.sumWinPnl / acc.wins : 0
  const avgLossAbs = acc.losses > 0 ? Math.abs(acc.sumLossPnl / acc.losses) : 0
  return {
    key: acc.key,
    count: acc.count,
    winRate: acc.count > 0 ? (acc.wins / acc.count) * 100 : 0,
    netPnl: acc.netPnl,
    avgPnl: acc.count > 0 ? acc.netPnl / acc.count : 0,
    // payoff ratio is only meaningful with at least one win AND one loss.
    payoffRatio: acc.wins > 0 && avgLossAbs > 0 ? avgWin / avgLossAbs : null,
    avgPlannedRR: acc.rrCount > 0 ? acc.rrSum / acc.rrCount : null,
    rrSampleCount: acc.rrCount,
    significant: acc.count >= SIGNIFICANCE_THRESHOLD,
  }
}

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

  // Factor 5: Entries outside the trader's usual hours (0-20 pts)
  // Baseline = entry-hour distribution of older trades (local clock, same as
  // the session aggregates). Recent entries at hours the trader rarely touches
  // score points, doubled when they follow a loss — the "revenge-firing at a
  // time you never trade" pattern. Needs enough history to know what "usual"
  // means, so the baseline excludes the recent window being judged.
  const offHoursWindow = sorted.slice(0, 6)
  const hourBaseline = sorted.slice(6)
  const hourCounts = new Array(24).fill(0)
  let baselineSize = 0
  for (const t of hourBaseline) {
    if (!t.entryTime) continue
    const when = new Date(t.entryTime)
    if (isNaN(when.getTime())) continue
    hourCounts[when.getHours()]++
    baselineSize++
  }
  if (baselineSize >= 20) {
    const rareThreshold = Math.max(1, baselineSize * 0.03)
    let offHours = 0
    let offHoursAfterLoss = 0
    for (let i = 0; i < offHoursWindow.length; i++) {
      const t = offHoursWindow[i]
      if (!t.entryTime) continue
      const when = new Date(t.entryTime)
      if (isNaN(when.getTime())) continue
      if (hourCounts[when.getHours()] < rareThreshold) {
        offHours++
        // Chronology guard (same as factor 3): with overlapping positions,
        // exit-time order ≠ entry order, so only count "after a loss" when the
        // losing trade actually closed before this entry was opened.
        const prev = sorted[i + 1]
        if (prev && prev.pnl < 0 && prev.exitTime && new Date(prev.exitTime).getTime() <= when.getTime()) {
          offHoursAfterLoss++
        }
      }
    }
    if (offHours > 0) {
      const pts = Math.min(20, offHours * 5 + offHoursAfterLoss * 5)
      score += pts
      factors.push(
        offHoursAfterLoss > 0
          ? `${offHours} entr${offHours === 1 ? 'y' : 'ies'} at hours you don't normally trade (${offHoursAfterLoss} right after a loss)`
          : `${offHours} entr${offHours === 1 ? 'y' : 'ies'} at hours you don't normally trade`
      )
    }
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
  const hasData = tilt.label !== 'Insufficient data'

  const recommendation = !hasData
    ? null
    : tilt.score <= 20
      ? 'Composed — keep following your plan.'
      : tilt.score <= 45
        ? 'Slightly elevated — stick to your rules and usual size.'
        : tilt.score <= 65
          ? 'Caution — size down and slow your entries.'
          : 'High tilt — step away for 30 minutes before trading again.'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heartbeat className="h-4 w-4" style={{ color: tilt.color }} />
          <span className="text-sm font-semibold">Tilt Meter</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: alpha(tilt.color, '18'), color: tilt.color }}
          >
            {tilt.label}
          </span>
          {hasData && (
            <span className="text-sm font-semibold font-display tabular-nums" style={{ color: tilt.color }}>
              {tilt.score}<span className="text-xs text-muted-foreground">/100</span>
            </span>
          )}
        </div>
      </div>

      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: tilt.color }}
        />
      </div>

      {recommendation && (
        <div className="flex items-start gap-2 text-xs">
          <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: tilt.color }} />
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">What to do:</span> {recommendation}
          </span>
        </div>
      )}

      {hasData && tilt.factors.length > 0 && (
        <div>
          <button
            onClick={() => setShowFactors(!showFactors)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {showFactors ? 'Hide' : 'Show'} {tilt.factors.length} contributing signal{tilt.factors.length !== 1 ? 's' : ''}
          </button>
          {showFactors && (
            <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
              {tilt.factors.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-muted-foreground shrink-0">–</span>
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function CoachStats({ metrics, themeColors }: { metrics: any; themeColors: { primary: string; profit: string; loss: string } }) {
  const streakLabel = metrics.streak.count === 1
    ? (metrics.streak.type === 'winning' ? 'win' : 'loss')
    : (metrics.streak.type === 'winning' ? 'wins' : 'losses')
  const stats: { label: string; value: string; color?: string }[] = [
    { label: 'Win rate', value: `${metrics.winRate.toFixed(0)}%` },
    { label: 'Profit factor', value: metrics.profitFactor.toFixed(2) },
    { label: 'Avg R:R', value: `${metrics.riskReward.toFixed(2)}:1` },
    { label: 'Recent win rate', value: `${metrics.recentWinRate.toFixed(0)}%` },
    { label: 'Total trades', value: String(metrics.totalTrades) },
    {
      label: 'Current streak',
      value: `${metrics.streak.count} ${streakLabel}`,
      color: metrics.streak.count === 0
        ? undefined
        : (metrics.streak.type === 'winning' ? themeColors.profit : themeColors.loss),
    },
  ]
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ChartPie className="h-4 w-4" style={{ color: themeColors.primary }} />
        <span className="text-sm font-semibold">Your numbers</span>
        {/* The coach always analyses full history (pattern detection needs it),
            so make that explicit next to the period-filtered dashboard widgets. */}
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">All time</span>
      </div>
      <div className="grid grid-cols-3 gap-x-3 gap-y-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-semibold font-display" style={s.color ? { color: s.color } : undefined}>{s.value}</p>
          </div>
        ))}
      </div>
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

// Replace the em/en dashes the model favours with plain punctuation.
function cleanDashes(s: string): string {
  return s.replace(/ +[—–] +/g, ', ').replace(/[—–]/g, '-')
}

// Block-level markdown renderer for chat replies: turns the model's markdown
// (headings, paragraphs, bullet/numbered lists, bold, inline code) into clean
// semantic HTML. Styling lives in CHAT_PROSE so headings, lists and spacing are
// applied from the JSX container rather than baked into the string. Normalises
// the model's em/en dashes first.
function renderChatMarkdown(md: string): string {
  return renderMarkdown(md, {
    preprocess: cleanDashes,
    maxHeadingLevel: 6,
    stripHeadingColon: true,
    classes: { heading: () => 'md-h', ul: 'md-ul', ol: 'md-ol' },
    allowedInlineTags: ['em'],
  })
}

// Shared typography for rendered chat replies. Block spacing, heading style and
// inside-positioned list markers are all applied here so the markup stays clean.
const CHAT_PROSE = cn(
  "text-sm text-muted-foreground leading-relaxed",
  "[&>*]:mt-2 [&>:first-child]:mt-0",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_.md-h]:mt-3 [&_.md-h]:text-[13px] [&_.md-h]:font-semibold [&_.md-h]:text-foreground",
  "[&_.md-ul]:list-disc [&_.md-ul]:list-inside [&_.md-ul]:ml-1 [&_.md-ul]:space-y-1",
  "[&_.md-ol]:list-decimal [&_.md-ol]:list-inside [&_.md-ol]:ml-1 [&_.md-ol]:space-y-1",
  "[&_li]:pl-0.5",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_code]:font-mono"
)

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
  const { getCurrencySymbol, formatCurrency } = useSettings()
  const { getTrades, isDemo } = useDemoData()
  const { isPro, hasAIAccess, freeAiQuota, updateFreeAiQuota } = useProStatus()
  const userStorage = useUserStorage()
  const [aiTips, setAiTips] = useState<any[] | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  // User-scoped (raw localStorage survived logout, leaking one user's coach
  // state to the next login on a shared browser). Legacy raw keys are read as
  // a fallback once and migrated on the next write.
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    try {
      const stored = userStorage.getItem('dismissedCoachTips') ?? localStorage.getItem('dismissedCoachTips')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = userStorage.getItem(CHAT_CACHE_KEY) ?? localStorage.getItem(CHAT_CACHE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })
  const [chatInput, setChatInput] = useState('')
  const { streamText, isStreaming: chatStreaming, startStream, meta: chatMeta, abort } = useStreamingAI()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => () => abort(), [abort])

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

  // Risk-adjusted, sample-sized aggregates for the coach chat. One O(n) pass over
  // the already account-scoped `trades` array (NEVER re-reads localStorage),
  // recomputed once per data change rather than per chat message.
  const chatAggregates = useMemo(() => {
    const symbolMap = new Map<string, GroupAcc>()
    const strategyMap = new Map<string, GroupAcc>()
    const sideMap = new Map<string, GroupAcc>()
    const weekdayMap = new Map<string, GroupAcc>()
    const sessionMap = new Map<string, GroupAcc>()
    const emotionMap = new Map<string, GroupAcc>()

    let strategiesTaggedCount = 0 // trades with a real (non-empty) strategy
    let sumWinPnl = 0, winCount = 0
    let sumLossPnl = 0, lossCount = 0 // sumLossPnl kept negative
    let rrSum = 0, rrCount = 0

    for (const t of trades as Trade[]) {
      const pnl = safeNum(t.pnl)
      const rr = safeNum(t.riskReward) // 0 == "not computed"; only rr > 0 is counted

      if (pnl > 0) { sumWinPnl += pnl; winCount++ }
      else if (pnl < 0) { sumLossPnl += pnl; lossCount++ }
      if (rr > 0) { rrSum += rr; rrCount++ }

      const symKey = (t.symbol || 'Unknown').trim() || 'Unknown'
      if (!symbolMap.has(symKey)) symbolMap.set(symKey, makeAcc(symKey))
      pushTradeIntoAcc(symbolMap.get(symKey)!, pnl, rr)

      const rawStrat = (t.strategy || '').trim()
      const stratKey = rawStrat || 'Untagged'
      if (rawStrat) strategiesTaggedCount++
      if (!strategyMap.has(stratKey)) strategyMap.set(stratKey, makeAcc(stratKey))
      pushTradeIntoAcc(strategyMap.get(stratKey)!, pnl, rr)

      // Do NOT coerce a missing side to 'long'.
      const sideKey = t.side === 'short' ? 'short' : t.side === 'long' ? 'long' : 'unknown'
      if (!sideMap.has(sideKey)) sideMap.set(sideKey, makeAcc(sideKey))
      pushTradeIntoAcc(sideMap.get(sideKey)!, pnl, rr)

      // Time dimensions use the trade's local clock — session/weekday patterns
      // only mean something in the trader's own timezone.
      const when = t.exitTime instanceof Date && !isNaN(t.exitTime.getTime()) ? t.exitTime
        : t.entryTime instanceof Date && !isNaN(t.entryTime.getTime()) ? t.entryTime : null
      if (when) {
        const dayKey = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][when.getDay()]
        if (!weekdayMap.has(dayKey)) weekdayMap.set(dayKey, makeAcc(dayKey))
        pushTradeIntoAcc(weekdayMap.get(dayKey)!, pnl, rr)

        const h = when.getHours()
        const sessKey = h < 6 ? 'overnight (00-06)' : h < 12 ? 'morning (06-12)' : h < 18 ? 'afternoon (12-18)' : 'evening (18-24)'
        if (!sessionMap.has(sessKey)) sessionMap.set(sessKey, makeAcc(sessKey))
        pushTradeIntoAcc(sessionMap.get(sessKey)!, pnl, rr)
      }

      // A trade can carry several emotions — it counts once per emotion tag
      if (typeof t.emotions === 'string' && t.emotions.trim()) {
        for (const raw of t.emotions.split(',')) {
          const emoKey = raw.trim().toLowerCase()
          if (!emoKey) continue
          if (!emotionMap.has(emoKey)) emotionMap.set(emoKey, makeAcc(emoKey))
          pushTradeIntoAcc(emotionMap.get(emoKey)!, pnl, rr)
        }
      }
    }

    // Rank by SAMPLE SIZE (trade count), never by raw dollar P&L. This is the
    // core anti-MGCJ6 guard: a 2-trade symbol can never out-rank a 200-trade one.
    const byCount = (a: GroupStat, b: GroupStat) => b.count - a.count

    const perSymbol = Array.from(symbolMap.values())
      .map(finalizeAcc).sort(byCount).slice(0, MAX_BUCKETS)

    // Exclude 'Untagged' so the model cannot invent a "best strategy" from untagged trades.
    const perStrategy = Array.from(strategyMap.values())
      .map(finalizeAcc).filter(g => g.key !== 'Untagged').sort(byCount).slice(0, MAX_BUCKETS)

    // Keep long/short; drop 'unknown' from any long-vs-short claim.
    const perSide = Array.from(sideMap.values())
      .map(finalizeAcc).filter(g => g.key !== 'unknown').sort(byCount)

    const perWeekday = Array.from(weekdayMap.values()).map(finalizeAcc).sort(byCount)
    const perSession = Array.from(sessionMap.values()).map(finalizeAcc).sort(byCount)
    const perEmotion = Array.from(emotionMap.values()).map(finalizeAcc).sort(byCount).slice(0, MAX_BUCKETS)

    const avgWin = winCount > 0 ? sumWinPnl / winCount : 0
    const avgLossAbs = lossCount > 0 ? Math.abs(sumLossPnl / lossCount) : 0

    // Only surface strategy claims when enough trades are actually tagged.
    const strategiesTagged = trades.length > 0 &&
      strategiesTaggedCount / trades.length >= MIN_STRATEGY_TAGGED_RATIO

    return {
      hasEnoughData: trades.length >= SIGNIFICANCE_THRESHOLD,
      significanceThreshold: SIGNIFICANCE_THRESHOLD,
      avgWin,
      avgLoss: avgLossAbs, // positive magnitude
      payoffRatio: winCount > 0 && avgLossAbs > 0 ? avgWin / avgLossAbs : null,
      avgPlannedRR: rrCount > 0 ? rrSum / rrCount : null,
      rrSampleCount: rrCount,
      strategiesTagged,
      perSymbol,
      perStrategy,
      perSide,
      perWeekday,
      perSession,
      perEmotion,
    }
  }, [trades])

  // Typewriter reveal: streamed chunks arrive in bursts, and rendering them
  // raw makes text pop in blocks. Two pieces make it read as typing:
  // 1. A paced reveal (~2-4 chars/frame) instead of painting whole chunks.
  // 2. `finishingText`: fast models finish generating before the typing does,
  //    and committing the full message at stream-end would cut the animation
  //    mid-word — so the final text keeps typing from local state and only
  //    commits to the message list once fully painted.
  const [typedStream, setTypedStream] = useState('')
  const [finishingText, setFinishingText] = useState<string | null>(null)
  useEffect(() => {
    const target = chatStreaming ? streamText : (finishingText ?? '')
    if (!target) { setTypedStream(''); return }
    let raf: number
    const tick = () => {
      setTypedStream(prev => {
        const current = chatStreaming ? streamText : (finishingText ?? '')
        if (prev.length >= current.length) return prev
        const backlog = current.length - prev.length
        // ~120 chars/s baseline, ~240 when behind, proportional catch-up only
        // for very large backlogs so it never lags by more than a second or two
        const step = backlog > 400 ? Math.ceil(backlog / 100) + 4 : backlog > 150 ? 4 : 2
        return current.slice(0, prev.length + step)
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [chatStreaming, streamText, finishingText])

  // Commit the finished answer to the message list only after the typewriter
  // has painted all of it
  useEffect(() => {
    if (!finishingText || chatStreaming) return
    if (typedStream.length >= finishingText.length) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: finishingText }])
      setFinishingText(null)
      setTypedStream('')
    }
  }, [finishingText, chatStreaming, typedStream])

  // Persist chat history (user-scoped; drop the legacy shared key)
  useEffect(() => {
    if (chatMessages.length > 0) {
      try {
        userStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(chatMessages.slice(-20)))
        localStorage.removeItem(CHAT_CACHE_KEY)
      } catch {}
    }
  }, [chatMessages, userStorage])

  // Keep the chat pinned to its latest message by scrolling ONLY the inner
  // message list — never scrollIntoView, which would also scroll the page/window.
  // Sending your own message always snaps down; anything else (streaming
  // tokens, the assistant's completed message) only follows if the reader is
  // already at the bottom — yanking someone down token-by-token while they
  // read the top of a long answer makes it unreadable.
  useEffect(() => {
    const el = chatScrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const lastIsUser = chatMessages[chatMessages.length - 1]?.role === 'user'
    if (lastIsUser || distanceFromBottom < 120) {
      el.scrollTo({ top: el.scrollHeight, behavior: lastIsUser ? 'smooth' : 'auto' })
    }
  }, [chatMessages])

  useEffect(() => {
    const el = chatScrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    // Instant (not smooth) while streaming: a smooth scroll still in flight
    // makes the next tick's distance measurement lie, which would unpin the
    // follow mid-stream. Keyed on the TYPED text so the follow tracks what is
    // actually painted, not the chunk buffer running ahead of it.
    if (distanceFromBottom < 120) {
      el.scrollTo({ top: el.scrollHeight })
    }
  }, [typedStream])

  // Update free quota from chat responses
  useEffect(() => {
    if (chatMeta?.freeUsage) updateFreeAiQuota(chatMeta.freeUsage)
  }, [chatMeta])

  const buildChatContext = useCallback(() => {
    const wins = trades.filter((t: Trade) => safeNum(t.pnl) > 0).length
    const totalPnl = trades.reduce((s: number, t: Trade) => s + safeNum(t.pnl), 0)
    const avgPnl = trades.length > 0 ? totalPnl / trades.length : 0

    let consLosses = 0
    for (const t of [...trades].reverse()) {
      if (safeNum(t.pnl) < 0) consLosses++
      else break
    }

    const goalsRaw = userStorage.getItem('tradingGoals')
    const rulesRaw = userStorage.getItem('riskRules')
    let goals: any[] = []
    let rules: any[] = []
    try { goals = goalsRaw ? JSON.parse(goalsRaw) : [] } catch {}
    try { rules = rulesRaw ? JSON.parse(rulesRaw) : [] } catch {}

    return {
      currency: getCurrencySymbol(),
      stats: {
        winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
        totalPnl,
        avgPnl,
        tradeCount: trades.length,
        consecutiveLosses: consLosses,
        // enriched, full-set, risk-adjusted overall context:
        avgWin: chatAggregates.avgWin,
        avgLoss: chatAggregates.avgLoss,
        payoffRatio: chatAggregates.payoffRatio, // number | null
        avgPlannedRR: chatAggregates.avgPlannedRR, // number | null
        rrSampleCount: chatAggregates.rrSampleCount,
        hasEnoughData: chatAggregates.hasEnoughData,
        significanceThreshold: chatAggregates.significanceThreshold,
      },
      // NEW enriched, sample-sized aggregates over the FULL account-scoped set:
      perSymbol: chatAggregates.perSymbol,
      perStrategy: chatAggregates.strategiesTagged ? chatAggregates.perStrategy : [],
      strategiesTagged: chatAggregates.strategiesTagged,
      perSide: chatAggregates.perSide,
      perWeekday: chatAggregates.perWeekday,
      perSession: chatAggregates.perSession,
      perEmotion: chatAggregates.perEmotion,
      recentTrades: trades.slice(-10).map((t: Trade) => ({
        symbol: t.symbol,
        side: t.side || 'long',
        pnl: safeNum(t.pnl),
        holdMinutes: (() => {
          const a = t.entryTime ? new Date(t.entryTime).getTime() : NaN
          const b = t.exitTime ? new Date(t.exitTime).getTime() : NaN
          return Number.isFinite(a) && Number.isFinite(b) ? Math.round((b - a) / 60000) : null
        })(),
        emotions: t.emotions || null,
      })),
      goals: goals.map((g: any) => ({ type: g.type, period: g.period, target: g.target, current: g.current })),
      rules: rules.map((r: any) => ({ type: r.type, value: r.value })),
      tiltFactors: tiltScore.factors,
    }
  }, [trades, userStorage, tiltScore.factors, chatAggregates, getCurrencySymbol])

  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim() || chatStreaming || finishingText) return

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
        // Hand off to the typewriter — the message is committed by the effect
        // above once fully typed out
        setFinishingText(result)
      }
    } catch (err: any) {
      // Quota/limit errors carry their own next step ("Upgrade to Pro...",
      // "Resets at midnight UTC") — show them instead of a fake transient error.
      const msg: string = err?.message || ''
      const isQuota = msg.includes('limit') || msg.includes('Upgrade to Pro')
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: isQuota ? msg : 'Sorry, I could not respond right now. Try again.',
      }])
    }
  }, [chatStreaming, finishingText, chatMessages, buildChatContext, startStream])

  const clearChat = useCallback(() => {
    setChatMessages([])
    // Also drop any reply still being typed out, or the commit effect would
    // re-add it to the thread the user just cleared.
    setFinishingText(null)
    setTypedStream('')
    userStorage.removeItem(CHAT_CACHE_KEY)
    localStorage.removeItem(CHAT_CACHE_KEY)
  }, [userStorage])

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
    if (!hasAIAccess || trades.length < 1 || !metrics) return
    // Demo mode has no real backend user — skip the (silently failing)
    // callable and let the client-side tips render instead.
    if (isDemo) return

    // Honor a fresh cache that matches the CURRENT trade data — the cache
    // stores its fingerprint so a fresh mount can trust it. (Previously the
    // in-memory ref was required to match, which is impossible on mount, so
    // every page visit refetched and burned a free AI credit.)
    const cached = getAICache<{ fp: string; tips: any[] }>(AI_COACH_CACHE_KEY, AI_COACH_TTL)
    if (cached && !Array.isArray(cached) && cached.fp === tradeFingerprint) {
      aiFetchedRef.current = tradeFingerprint
      setAiTips(cached.tips)
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
            currency: getCurrencySymbol(),
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
          setAICache(AI_COACH_CACHE_KEY, { fp: tradeFingerprint, tips: tipsWithKeys })
        }
      } catch {
        // Silently fall back to client-side tips
      } finally {
        setAiLoading(false)
      }
    }

    fetchAITips()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAIAccess, isDemo, trades.length, tradeFingerprint, metrics])

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
        message: `Your max drawdown is ${formatCurrency(metrics.maxDrawdown, false)}. This is too high relative to profits. Reduce position sizes.`,
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

  const dismissTip = useCallback((key: string) => {
    const next = new Set(dismissedTips)
    next.add(key)
    setDismissedTips(next)
    try {
      userStorage.setItem('dismissedCoachTips', JSON.stringify([...next]))
      localStorage.removeItem('dismissedCoachTips')
    } catch {}
  }, [dismissedTips, userStorage])

  const hasCritical = visibleTips.some((t) => t.type === 'critical')

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

  const getTipIcon = (type: string, tip?: { icon?: Icon }): Icon => {
    switch (type) {
      case 'success': return Trophy
      case 'warning': return Warning
      case 'critical': return Fire
      case 'action': return Brain
      case 'info': return Lightbulb
      default: return tip?.icon || Lightbulb
    }
  }

  if (visibleTips.length === 0 && !aiLoading) return null

  return (
    <div className="space-y-6">
      {(trades.length >= 3 || metrics) && (
        <div className="grid gap-4 md:grid-cols-2">
          {trades.length >= 3 && (
            <Card className="min-h-[200px] flex flex-col">
              <CardContent className="flex-1 flex flex-col justify-center py-6 sm:py-6">
                <TiltMeter tilt={tiltScore} alpha={alpha} />
              </CardContent>
            </Card>
          )}
          {metrics && (
            <Card className={`min-h-[200px] flex flex-col ${trades.length < 3 ? 'md:col-span-2' : ''}`}>
              <CardContent className="flex-1 flex flex-col justify-center py-6 sm:py-6">
                <CoachStats metrics={metrics} themeColors={themeColors} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
      <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span>Coach FTJ</span>
            {hasCritical && (
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
          {aiTips && <AIFeedback feature="Coach FTJ" responseId={visibleTips[0]?.title} />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {aiLoading ? (
          <div className="flex items-center justify-center gap-2 py-10">
            <SpinnerGap className="h-4 w-4 animate-spin" style={{ color: themeColors.primary }} />
            <span className="text-sm text-muted-foreground">Loading AI coaching...</span>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTips.map((tip) => {
              const color = getTipColor(tip.type)
              const TipIcon = getTipIcon(tip.type, tip)
              return (
                <div
                  key={tip.key}
                  className="relative rounded-lg border border-border bg-card p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-md shrink-0" style={{ backgroundColor: alpha(color, '15') }}>
                      <TipIcon className="h-4 w-4" style={{ color }} />
                    </div>
                    <h3 className="font-semibold text-sm leading-snug pt-0.5" style={{ color }}>
                      {cleanDashes(tip.title)}
                    </h3>
                    <button
                      onClick={() => dismissTip(tip.key)}
                      className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Dismiss this insight"
                      title="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cleanDashes(tip.message)}</p>
                </div>
              )
            })}
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

                {/* Messages — aria-busy suppresses announcements while tokens
                    stream in; the finished reply is announced once. */}
                <div ref={chatScrollRef} aria-live="polite" aria-busy={chatStreaming} className="max-h-64 overflow-y-auto space-y-2.5 scroll-smooth">
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
                  {chatMessages.map((msg, i) =>
                    msg.role === 'user' ? (
                      <div key={i} className="text-right">
                        <span
                          className="inline-block px-3 py-1.5 rounded-lg text-sm text-left"
                          style={{
                            backgroundColor: alpha(themeColors.primary, '15'),
                            color: themeColors.primary,
                          }}
                        >
                          {msg.content}
                        </span>
                      </div>
                    ) : (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: alpha(themeColors.primary, '15') }}
                          >
                            <Brain className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.primary }}>
                            Coach FTJ
                          </span>
                        </div>
                        <div className={CHAT_PROSE} dangerouslySetInnerHTML={{ __html: renderChatMarkdown(msg.content) }} />
                      </div>
                    )
                  )}
                  {(chatStreaming || finishingText) && typedStream && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: alpha(themeColors.primary, '15') }}
                        >
                          <Brain className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeColors.primary }}>
                          Coach FTJ
                        </span>
                      </div>
                      <div>
                        <div className={CHAT_PROSE} dangerouslySetInnerHTML={{ __html: renderChatMarkdown(typedStream) }} />
                        <span className="inline-block h-3 w-0.5 mt-1 animate-pulse" style={{ backgroundColor: themeColors.primary }} />
                      </div>
                    </div>
                  )}
                  {chatStreaming && !typedStream && (
                    <div className="flex items-center gap-2 py-2">
                      <div
                        className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: alpha(themeColors.primary, '15') }}
                      >
                        <Brain className="h-3.5 w-3.5" style={{ color: themeColors.primary }} />
                      </div>
                      <div
                        className="flex items-center gap-1 px-3 py-2.5 rounded-2xl"
                        style={{ backgroundColor: alpha(themeColors.primary, '08') }}
                        aria-label="Coach FTJ is typing"
                      >
                        {[0, 1, 2].map(i => (
                          <span
                            key={i}
                            className="h-1.5 w-1.5 rounded-full animate-bounce"
                            style={{ backgroundColor: themeColors.primary, animationDelay: `${i * 160}ms`, animationDuration: '900ms' }}
                          />
                        ))}
                      </div>
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
                    aria-label="Ask Coach FTJ"
                    disabled={chatStreaming || !!finishingText}
                    className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!chatInput.trim() || chatStreaming || !!finishingText}
                    className="h-9 w-9 p-0 shrink-0"
                    style={{ backgroundColor: themeColors.primary }}
                    aria-label="Send message"
                  >
                    <PaperPlaneTilt className="h-3.5 w-3.5" />
                  </Button>
                </form>
                {/* freeAiQuota is null for Pro/demo, so this only renders for
                    free users — no more hitting the wall with zero warning. */}
                {freeAiQuota && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    {freeAiQuota.remaining} of {freeAiQuota.limit} free AI queries left this month
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Free quota exhausted: keep an upgrade path where the chat button was,
            instead of the section silently disappearing */}
        {!hasAIAccess && freeAiQuota && freeAiQuota.remaining === 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex flex-col items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-4 text-center">
              <p className="text-sm font-medium">
                You've used all {freeAiQuota.limit} free AI queries this month
              </p>
              <p className="text-xs text-muted-foreground">
                Upgrade to Pro to keep chatting with Coach FTJ — or your quota resets next month.
              </p>
              <Link
                to="/pricing"
                onClick={() => trackEvent('pro_gate_cta_clicked', { feature: 'Coach FTJ', source: 'quota_exhausted' })}
                className="mt-1 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors duration-150 shadow-sm"
              >
                <Sparkle className="h-3.5 w-3.5" />
                Get Unlimited AI
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )
}
