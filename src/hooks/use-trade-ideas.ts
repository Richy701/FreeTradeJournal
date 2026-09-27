import { useMemo } from 'react'
import { useDemoData } from '@/hooks/use-demo-data'
import { useSettings } from '@/contexts/settings-context'
import { computeTradeAggregates, computeHoldTimeStats, computeCostStats } from '@/utils/trade-aggregates'
import { buildActionableIdeas } from '@/utils/actionable-ideas'


export interface SymbolChartData {
  symbol: string
  pnl: number
  wins: number
  losses: number
  winRate: number
}

export interface HourlyChartData {
  hour: string
  pnl: number
  winRate: number
  count: number
}

export interface DayChartData {
  day: string
  // Full name for prose ("Thursdays"); `day` stays short for axis ticks.
  dayLong: string
  pnl: number
  winRate: number
  count: number
}

export interface DirectionData {
  name: string
  wins: number
  losses: number
  pnl: number
  winRate: number
  count: number
}

export interface StrategyChartData {
  strategy: string
  pnl: number
  winRate: number
  count: number
}

export interface WeeklyChartData {
  week: string
  pnl: number
  tradeCount: number
}

export interface DailyActivity {
  date: string // YYYY-MM-DD
  count: number
  pnl: number
}

export interface ChartDataSet {
  symbolPnl: SymbolChartData[]
  hourlyPnl: HourlyChartData[]
  dayOfWeek: DayChartData[]
  direction: DirectionData[]
  strategyPnl: StrategyChartData[]
  weeklyPnl: WeeklyChartData[]
  dailyActivity: DailyActivity[]
}

export interface TraderProfilePoint {
  metric: string
  value: number
  fullMark: 100
}

export interface SummaryStats {
  bestSymbol: string
  bestSymbolPnl: number
  bestDay: string
  bestDayWinRate: number
  winDirection: string
  winDirectionWr: number
  topStrategy: string
  topStrategyWr: number
  totalPnl: number
  winRate: number
  avgWin: number
  avgLoss: number
  traderProfile: TraderProfilePoint[]
}

export interface ParsedTrade {
  id: string
  symbol: string
  side: string
  pnl: number
  entryTime: Date
  exitTime: Date
  strategy?: string
  tags?: string[]
  commission?: number
  fees?: number
  swap?: number
}

// Smallest group (symbol, day, hour, side) an idea or "best X" may be built on.
export const MIN_GROUP_TRADES = 3

// Read the stored P&L the same way the Dashboard does (t.pnl first), with
// legacy fallbacks for old imports. Checked field-by-field so a legitimate
// $0 pnl doesn't fall through to netProfit/profit like a `||` chain would.
function readStoredPnl(t: any): number {
  for (const v of [t.pnl, t.netProfit, t.profit]) {
    if (v === undefined || v === null || v === '') continue
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return 0
}

export function parseTrades(rawTrades: any[]): ParsedTrade[] {
  return rawTrades
    .map((t: any) => ({
      id: t.id,
      symbol: t.symbol || '',
      side: t.side || t.action || '',
      pnl: readStoredPnl(t),
      entryTime: t.entryTime ? new Date(t.entryTime) : new Date(t.date || t.createdAt),
      exitTime: t.exitTime ? new Date(t.exitTime) : new Date(t.exitDate || t.date || t.createdAt),
      strategy: t.strategy || undefined,
      tags: Array.isArray(t.tags) ? t.tags.filter((x: unknown) => typeof x === 'string') : undefined,
      commission: Number(t.commission) || 0,
      fees: Number(t.fees) || 0,
      swap: Number(t.swap) || 0,
    }))
    .filter((t) => t.symbol && !isNaN(t.entryTime.getTime()))
}

export function buildChartData(trades: ParsedTrade[]): ChartDataSet {
  // Symbol P&L
  const bySymbol = new Map<string, { wins: number; losses: number; totalPnl: number }>()
  for (const t of trades) {
    const s = bySymbol.get(t.symbol) || { wins: 0, losses: 0, totalPnl: 0 }
    if (t.pnl > 0) s.wins++
    else s.losses++
    s.totalPnl += t.pnl
    bySymbol.set(t.symbol, s)
  }
  const symbolPnl = [...bySymbol.entries()]
    .map(([symbol, s]) => ({
      symbol,
      pnl: Math.round(s.totalPnl * 100) / 100,
      wins: s.wins,
      losses: s.losses,
      winRate: Math.round((s.wins / (s.wins + s.losses)) * 100),
    }))
    .sort((a, b) => b.pnl - a.pnl)

  // Hourly P&L
  const byHour = new Map<number, { count: number; wins: number; totalPnl: number }>()
  for (const t of trades) {
    const h = t.entryTime.getHours()
    const s = byHour.get(h) || { count: 0, wins: 0, totalPnl: 0 }
    s.count++
    if (t.pnl > 0) s.wins++
    s.totalPnl += t.pnl
    byHour.set(h, s)
  }
  const hourlyPnl = [...byHour.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hour, s]) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      pnl: Math.round(s.totalPnl * 100) / 100,
      winRate: Math.round((s.wins / s.count) * 100),
      count: s.count,
    }))

  // Day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayLongNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const byDay = new Map<number, { count: number; wins: number; totalPnl: number }>()
  for (const t of trades) {
    const d = t.entryTime.getDay()
    const s = byDay.get(d) || { count: 0, wins: 0, totalPnl: 0 }
    s.count++
    if (t.pnl > 0) s.wins++
    s.totalPnl += t.pnl
    byDay.set(d, s)
  }
  const dayOfWeek = [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([d, s]) => ({
      day: dayNames[d],
      dayLong: dayLongNames[d],
      pnl: Math.round(s.totalPnl * 100) / 100,
      winRate: Math.round((s.wins / s.count) * 100),
      count: s.count,
    }))

  // Direction split — single pass
  const dirStats = { long: { wins: 0, losses: 0, pnl: 0, count: 0 }, short: { wins: 0, losses: 0, pnl: 0, count: 0 } }
  for (const t of trades) {
    const side = t.side === 'long' || t.side === 'buy' ? 'long' : t.side === 'short' || t.side === 'sell' ? 'short' : null
    if (!side) continue
    const s = dirStats[side]
    s.count++
    if (t.pnl > 0) s.wins++
    else s.losses++
    s.pnl += t.pnl
  }
  const direction: DirectionData[] = []
  if (dirStats.long.count > 0) {
    const s = dirStats.long
    direction.push({ name: 'Long', wins: s.wins, losses: s.losses, pnl: Math.round(s.pnl * 100) / 100, winRate: Math.round((s.wins / s.count) * 100), count: s.count })
  }
  if (dirStats.short.count > 0) {
    const s = dirStats.short
    direction.push({ name: 'Short', wins: s.wins, losses: s.losses, pnl: Math.round(s.pnl * 100) / 100, winRate: Math.round((s.wins / s.count) * 100), count: s.count })
  }

  // Strategy P&L
  const byStrat = new Map<string, { count: number; wins: number; totalPnl: number }>()
  for (const t of trades) {
    if (!t.strategy) continue
    const s = byStrat.get(t.strategy) || { count: 0, wins: 0, totalPnl: 0 }
    s.count++
    if (t.pnl > 0) s.wins++
    s.totalPnl += t.pnl
    byStrat.set(t.strategy, s)
  }
  const strategyPnl = [...byStrat.entries()]
    .map(([strategy, s]) => ({
      strategy,
      pnl: Math.round(s.totalPnl * 100) / 100,
      winRate: Math.round((s.wins / s.count) * 100),
      count: s.count,
    }))
    .sort((a, b) => b.pnl - a.pnl)

  // Weekly P&L
  const byWeek = new Map<string, { totalPnl: number; count: number }>()
  for (const t of trades) {
    const d = t.exitTime
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
    const s = byWeek.get(key) || { totalPnl: 0, count: 0 }
    s.totalPnl += t.pnl
    s.count++
    byWeek.set(key, s)
  }
  const weeklyPnl = [...byWeek.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, s]) => ({
      // Parse the local yyyy-mm-dd key as local components — new Date(str)
      // would read it as UTC midnight and shift the label a day west of UTC.
      week: new Date(Number(week.slice(0, 4)), Number(week.slice(5, 7)) - 1, Number(week.slice(8, 10)))
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pnl: Math.round(s.totalPnl * 100) / 100,
      tradeCount: s.count,
    }))

  // Daily activity (for contribution graph)
  const byDate = new Map<string, { count: number; totalPnl: number }>()
  for (const t of trades) {
    const key = `${t.entryTime.getFullYear()}-${String(t.entryTime.getMonth() + 1).padStart(2, '0')}-${String(t.entryTime.getDate()).padStart(2, '0')}`
    const s = byDate.get(key) || { count: 0, totalPnl: 0 }
    s.count++
    s.totalPnl += t.pnl
    byDate.set(key, s)
  }
  const dailyActivity: DailyActivity[] = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, s]) => ({
      date,
      count: s.count,
      pnl: Math.round(s.totalPnl * 100) / 100,
    }))

  return { symbolPnl, hourlyPnl, dayOfWeek, direction, strategyPnl, weeklyPnl, dailyActivity }
}

export function buildSummaryStats(charts: ChartDataSet, trades: ParsedTrade[]): SummaryStats {
  // Single pass for winners, losers, totalPnl
  let winCount = 0, winSum = 0, loseCount = 0, loseSum = 0, totalPnl = 0
  for (const t of trades) {
    totalPnl += t.pnl
    if (t.pnl > 0) { winCount++; winSum += t.pnl }
    else if (t.pnl < 0) { loseCount++; loseSum += t.pnl }
  }
  const winRate = trades.length > 0 ? Math.round((winCount / trades.length) * 100) : 0

  // "Best" anything needs a few trades behind it: a single lucky Monday is
  // not a pattern. Prefer groups at the minimum; fall back only when nothing
  // qualifies so the summary still renders on a young account.
  const bestSym = charts.symbolPnl.find(sy => sy.wins + sy.losses >= MIN_GROUP_TRADES) || charts.symbolPnl[0]

  const dayPool = charts.dayOfWeek.filter(d => d.count >= MIN_GROUP_TRADES)
  const days = dayPool.length > 0 ? dayPool : charts.dayOfWeek
  let bestDay = days[0] || null
  for (let i = 1; i < days.length; i++) {
    if (days[i].pnl > bestDay!.pnl) bestDay = days[i]
  }

  const dirPool = charts.direction.filter(d => d.count >= MIN_GROUP_TRADES)
  const dirs = dirPool.length > 0 ? dirPool : charts.direction
  const winDir = dirs.length > 0
    ? dirs.reduce((a, b) => (a.winRate > b.winRate ? a : b))
    : null
  const topStrat = charts.strategyPnl.find(st => st.count >= MIN_GROUP_TRADES) || charts.strategyPnl[0]

  const avgWin = winCount > 0 ? winSum / winCount : 0
  const avgLoss = loseCount > 0 ? Math.abs(loseSum / loseCount) : 0

  // Trader profile — normalized to 0-100
  const rr = avgLoss > 0 ? avgWin / avgLoss : 0
  // Risk/Reward: cap at 3:1 = 100
  const rrScore = Math.min(Math.round((rr / 3) * 100), 100)

  // Consistency: lower std deviation of daily P&L = higher score. Only a
  // positive average day earns the full scale — a trader who loses the same
  // amount every day is consistent at losing, and used to score "Strong".
  // With fewer than two days there is nothing to measure: sit at the middle.
  const dailyPnls = charts.dailyActivity.map(d => d.pnl)
  let consistency = 50
  if (dailyPnls.length > 1) {
    const mean = dailyPnls.reduce((a, b) => a + b, 0) / dailyPnls.length
    if (mean > 0) {
      const variance = dailyPnls.reduce((a, b) => a + (b - mean) ** 2, 0) / dailyPnls.length
      const cv = Math.sqrt(variance) / mean
      // CV of 0 = 100, CV of 3+ = 10
      consistency = Math.max(10, Math.min(100, Math.round(100 - (cv / 3) * 90)))
    } else {
      // Share of green days, capped so a losing account never reads as strong.
      const greenDays = dailyPnls.filter(v => v > 0).length
      consistency = Math.max(10, Math.round((greenDays / dailyPnls.length) * 40))
    }
  }

  // Volume: normalize active days per week (cap at 5 = 100)
  const activeDays = charts.dailyActivity.length
  const weekSpan = charts.weeklyPnl.length || 1
  const daysPerWeek = activeDays / weekSpan
  const volumeScore = Math.min(100, Math.round((daysPerWeek / 5) * 100))

  const traderProfile: TraderProfilePoint[] = [
    { metric: 'Win Rate', value: winRate, fullMark: 100 },
    { metric: 'R:R', value: rrScore, fullMark: 100 },
    { metric: 'Consistency', value: consistency, fullMark: 100 },
    { metric: 'Volume', value: volumeScore, fullMark: 100 },
    { metric: 'Best Day', value: bestDay?.winRate || 0, fullMark: 100 },
    { metric: 'Direction', value: winDir?.winRate || 0, fullMark: 100 },
  ]

  return {
    bestSymbol: bestSym?.symbol || '—',
    bestSymbolPnl: bestSym?.pnl || 0,
    bestDay: bestDay?.dayLong || '—',
    bestDayWinRate: bestDay?.winRate || 0,
    winDirection: winDir?.name || '—',
    winDirectionWr: winDir?.winRate || 0,
    topStrategy: topStrat?.strategy || '—',
    topStrategyWr: topStrat?.winRate || 0,
    totalPnl,
    winRate,
    avgWin,
    avgLoss,
    traderProfile,
  }
}

export function useTradeIdeas() {
  const { getAnalyticsTrades } = useDemoData()
  const { formatCurrency } = useSettings()

  // Insights are an analytics view, so free accounts get the trailing
  // window only — same as the Dashboard. hiddenCount feeds the notice banner.
  const analyticsData = useMemo(() => getAnalyticsTrades(), [getAnalyticsTrades])
  const trades = useMemo(() => parseTrades(analyticsData.trades), [analyticsData])

  const charts = useMemo(() => {
    if (trades.length < 5) return null
    return buildChartData(trades)
  }, [trades])

  const summary = useMemo(() => {
    if (!charts) return null
    return buildSummaryStats(charts, trades)
  }, [charts, trades])

  // Ranked by money at stake; the page handles dismissals.
  const ideas = useMemo(() => buildActionableIdeas(trades, (n) => formatCurrency(n, false)), [trades, formatCurrency])

  // Tag tables come from the shared, significance-aware aggregator (the same
  // one the AI coach reads) rather than a fourth stats path.
  const tagStats = useMemo(() => {
    if (trades.length < 5) return null
    const agg = computeTradeAggregates(trades)
    return {
      perTag: agg.perTag,
      perMistake: agg.perMistake,
      mistakeImpact: agg.mistakeImpact,
      significanceThreshold: agg.significanceThreshold,
    }
  }, [trades])

  // Both always computed once the page has data; the cards explain
  // themselves when the trades lack durations or recorded costs, rather
  // than silently disappearing.
  const holdTime = useMemo(() => (trades.length < 5 ? null : computeHoldTimeStats(trades)), [trades])
  const costs = useMemo(() => (trades.length < 5 ? null : computeCostStats(trades)), [trades])

  return {
    ideas,
    charts,
    summary,
    tagStats,
    holdTime,
    costs,
    totalTrades: trades.length,
    hasEnoughData: trades.length >= 5,
    hiddenCount: analyticsData.hiddenCount,
    rawTrades: analyticsData.trades,
  }
}
