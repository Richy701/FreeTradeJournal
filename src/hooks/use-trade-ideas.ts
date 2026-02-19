import { useMemo } from 'react'
import { useDemoData } from '@/hooks/use-demo-data'
import { useSettings } from '@/contexts/settings-context'

export interface TradeIdea {
  id: string
  title: string
  insight: string
  sentiment: 'positive' | 'neutral' | 'opportunity'
}

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

interface ParsedTrade {
  id: string
  symbol: string
  side: string
  pnl: number
  entryTime: Date
  exitTime: Date
  strategy?: string
}

function parseTrades(rawTrades: any[]): ParsedTrade[] {
  return rawTrades
    .map((t: any) => ({
      id: t.id,
      symbol: t.symbol || '',
      side: t.side || t.action || '',
      pnl: Number(t.pnl) || Number(t.netProfit) || Number(t.profit) || 0,
      entryTime: t.entryTime ? new Date(t.entryTime) : new Date(t.date || t.createdAt),
      exitTime: t.exitTime ? new Date(t.exitTime) : new Date(t.exitDate || t.date || t.createdAt),
      strategy: t.strategy || undefined,
    }))
    .filter((t) => t.symbol && !isNaN(t.entryTime.getTime()))
}

function buildChartData(trades: ParsedTrade[]): ChartDataSet {
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
    const key = weekStart.toISOString().slice(0, 10)
    const s = byWeek.get(key) || { totalPnl: 0, count: 0 }
    s.totalPnl += t.pnl
    s.count++
    byWeek.set(key, s)
  }
  const weeklyPnl = [...byWeek.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, s]) => ({
      week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pnl: Math.round(s.totalPnl * 100) / 100,
      tradeCount: s.count,
    }))

  // Daily activity (for contribution graph)
  const byDate = new Map<string, { count: number; totalPnl: number }>()
  for (const t of trades) {
    const key = t.entryTime.toISOString().slice(0, 10)
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

function buildSummaryStats(charts: ChartDataSet, trades: ParsedTrade[]): SummaryStats {
  // Single pass for winners, losers, totalPnl
  let winCount = 0, winSum = 0, loseCount = 0, loseSum = 0, totalPnl = 0
  for (const t of trades) {
    totalPnl += t.pnl
    if (t.pnl > 0) { winCount++; winSum += t.pnl }
    else if (t.pnl < 0) { loseCount++; loseSum += t.pnl }
  }
  const winRate = trades.length > 0 ? Math.round((winCount / trades.length) * 100) : 0

  const bestSym = charts.symbolPnl[0]

  // Loop for max day by pnl instead of sort
  let bestDay = charts.dayOfWeek[0] || null
  for (let i = 1; i < charts.dayOfWeek.length; i++) {
    if (charts.dayOfWeek[i].pnl > bestDay!.pnl) bestDay = charts.dayOfWeek[i]
  }

  const winDir = charts.direction.length > 0
    ? charts.direction.reduce((a, b) => (a.winRate > b.winRate ? a : b))
    : null
  const topStrat = charts.strategyPnl[0]

  const avgWin = winCount > 0 ? winSum / winCount : 0
  const avgLoss = loseCount > 0 ? Math.abs(loseSum / loseCount) : 0

  // Trader profile — normalized to 0-100
  const rr = avgLoss > 0 ? avgWin / avgLoss : 0
  // Risk/Reward: cap at 3:1 = 100
  const rrScore = Math.min(Math.round((rr / 3) * 100), 100)

  // Consistency: lower std deviation of daily P&L = higher score
  const dailyPnls = charts.dailyActivity.map(d => d.pnl)
  let consistency = 80
  if (dailyPnls.length > 1) {
    const mean = dailyPnls.reduce((a, b) => a + b, 0) / dailyPnls.length
    const variance = dailyPnls.reduce((a, b) => a + (b - mean) ** 2, 0) / dailyPnls.length
    const stdDev = Math.sqrt(variance)
    const cv = mean !== 0 ? stdDev / Math.abs(mean) : 5
    // CV of 0 = 100, CV of 3+ = 10
    consistency = Math.max(10, Math.min(100, Math.round(100 - (cv / 3) * 90)))
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
    bestDay: bestDay?.day || '—',
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

function generateIdeas(
  trades: ParsedTrade[],
  charts: ChartDataSet,
  summary: SummaryStats,
  fmt: (n: number, s?: boolean) => string
): TradeIdea[] {
  const ideas: TradeIdea[] = []

  // Best symbol idea
  if (charts.symbolPnl.length > 0 && charts.symbolPnl[0].pnl > 0) {
    const best = charts.symbolPnl[0]
    ideas.push({
      id: 'focus-best-symbol',
      title: `Focus on ${best.symbol}`,
      insight: `Consider increasing your ${best.symbol} allocation — you win ${best.winRate}% of trades with ${fmt(best.pnl, true)} total P&L. This is your strongest instrument.`,
      sentiment: 'positive',
    })
  }

  // Worst symbol idea
  const worstSym = charts.symbolPnl.filter((s) => s.pnl < 0 && s.wins + s.losses >= 3)
  if (worstSym.length > 0) {
    const worst = worstSym[worstSym.length - 1]
    ideas.push({
      id: 'reduce-worst-symbol',
      title: `Reduce ${worst.symbol} exposure`,
      insight: `${worst.symbol} is costing you ${fmt(Math.abs(worst.pnl))} with a ${worst.winRate}% win rate. Consider tighter stops, smaller size, or removing it from your watchlist.`,
      sentiment: 'opportunity',
    })
  }

  // Best time + symbol combo
  const bestHour = charts.hourlyPnl.reduce((best, h) => (h.pnl > best.pnl ? h : best), charts.hourlyPnl[0])
  if (bestHour && charts.symbolPnl[0]) {
    ideas.push({
      id: 'time-symbol-combo',
      title: `Trade ${charts.symbolPnl[0].symbol} around ${bestHour.hour}`,
      insight: `Combine your best instrument (${charts.symbolPnl[0].symbol}) with your peak hour (${bestHour.hour}) for the highest edge. That hour has a ${bestHour.winRate}% win rate.`,
      sentiment: 'positive',
    })
  }

  // Direction bias
  if (charts.direction.length === 2) {
    const [d1, d2] = charts.direction
    const wrDiff = Math.abs(d1.winRate - d2.winRate)
    if (wrDiff >= 10) {
      const better = d1.winRate > d2.winRate ? d1 : d2
      ideas.push({
        id: 'direction-edge',
        title: `Lean into ${better.name.toLowerCase()} trades`,
        insight: `Your ${better.name.toLowerCase()} trades win ${better.winRate}% of the time vs ${(better === d1 ? d2 : d1).winRate}% on the other side. Prioritize setups in this direction.`,
        sentiment: 'positive',
      })
    }
  }

  // Strategy advice
  if (charts.strategyPnl.length >= 2) {
    const profitable = charts.strategyPnl.filter((s) => s.pnl > 0)
    const unprofitable = charts.strategyPnl.filter((s) => s.pnl < 0)
    if (profitable.length > 0 && unprofitable.length > 0) {
      ideas.push({
        id: 'stick-to-strategies',
        title: `Double down on "${profitable[0].strategy}"`,
        insight: `"${profitable[0].strategy}" is your edge (${profitable[0].winRate}% WR, ${fmt(profitable[0].pnl, true)}). Consider dropping "${unprofitable[unprofitable.length - 1].strategy}" which is losing you money.`,
        sentiment: 'opportunity',
      })
    }
  }

  // Risk/reward
  if (summary.avgWin > 0 && summary.avgLoss > 0) {
    const rr = summary.avgWin / summary.avgLoss
    if (rr < 1) {
      ideas.push({
        id: 'let-winners-run',
        title: 'Let your winners run',
        insight: `Your average winner (${fmt(summary.avgWin)}) is smaller than your average loser (${fmt(summary.avgLoss)}). Try trailing stops or wider take-profit levels to improve your R:R from ${rr.toFixed(1)}:1.`,
        sentiment: 'opportunity',
      })
    } else if (rr >= 2) {
      ideas.push({
        id: 'great-rr',
        title: 'Your risk management is solid',
        insight: `${rr.toFixed(1)}:1 reward-to-risk ratio means you can afford a lower win rate and still be profitable. Keep managing risk the same way.`,
        sentiment: 'positive',
      })
    }
  }

  // Best day suggestion — loop for max/min instead of sort
  let bestDayData = charts.dayOfWeek[0] || null
  let worstDayData = charts.dayOfWeek[0] || null
  for (let i = 1; i < charts.dayOfWeek.length; i++) {
    if (charts.dayOfWeek[i].pnl > bestDayData!.pnl) bestDayData = charts.dayOfWeek[i]
    if (charts.dayOfWeek[i].pnl < worstDayData!.pnl) worstDayData = charts.dayOfWeek[i]
  }
  if (bestDayData && worstDayData && worstDayData.pnl < 0) {
    ideas.push({
      id: 'day-schedule',
      title: `Trade more on ${bestDayData.day}s`,
      insight: `${bestDayData.day}s are your best day (${bestDayData.winRate}% WR, ${fmt(bestDayData.pnl, true)}). Consider reducing activity on ${worstDayData.day}s where you're down ${fmt(Math.abs(worstDayData.pnl))}.`,
      sentiment: 'neutral',
    })
  }

  // Underexplored
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recentSymbols = new Set(trades.filter((t) => t.exitTime >= sevenDaysAgo).map((t) => t.symbol))
  for (const sym of charts.symbolPnl) {
    if (recentSymbols.has(sym.symbol)) continue
    if (sym.pnl > 0 && sym.wins + sym.losses >= 2) {
      ideas.push({
        id: `revisit-${sym.symbol}`,
        title: `Revisit ${sym.symbol}`,
        insight: `You haven't traded ${sym.symbol} recently, but it was profitable (${sym.winRate}% WR, ${fmt(sym.pnl, true)}). Worth adding back to your watchlist.`,
        sentiment: 'opportunity',
      })
      break // Only one underexplored idea
    }
  }

  return ideas
}

export function useTradeIdeas() {
  const { getTrades } = useDemoData()
  const { formatCurrency } = useSettings()

  const trades = useMemo(() => parseTrades(getTrades()), [getTrades])

  const charts = useMemo(() => {
    if (trades.length < 5) return null
    return buildChartData(trades)
  }, [trades])

  const summary = useMemo(() => {
    if (!charts) return null
    return buildSummaryStats(charts, trades)
  }, [charts, trades])

  const ideas = useMemo(() => {
    if (!charts || !summary) return []
    return generateIdeas(trades, charts, summary, formatCurrency)
  }, [trades, charts, summary, formatCurrency])

  return {
    ideas,
    charts,
    summary,
    totalTrades: trades.length,
    hasEnoughData: trades.length >= 5,
  }
}
