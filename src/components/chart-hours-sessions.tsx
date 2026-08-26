"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, Cell, LabelList, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { Clock, ChartBarHorizontal, ChartPolar } from '@phosphor-icons/react'

import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { useDashboardPeriod, filterTradesByPeriod } from '@/contexts/dashboard-period'
import { useDemoData } from '@/hooks/use-demo-data'
import { ChartEmptyState } from '@/components/dashboard/chart-empty-state'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { SegmentedControl } from '@/components/ui/segmented-control'

// Session windows in each market's own IANA zone — same definitions as
// market-sessions.tsx, so daylight saving is handled by Intl rather than
// hand-maintained UTC offsets.
interface SessionDef {
  name: string
  tz: string
  /** Local minutes-since-midnight when the session opens/closes. */
  start: number
  end: number
}

const SESSIONS: SessionDef[] = [
  { name: 'Sydney', tz: 'Australia/Sydney', start: 8 * 60, end: 17 * 60 },
  { name: 'Tokyo', tz: 'Asia/Tokyo', start: 9 * 60, end: 18 * 60 },
  { name: 'London', tz: 'Europe/London', start: 8 * 60, end: 17 * 60 },
  { name: 'New York', tz: 'America/New_York', start: 8 * 60, end: 17 * 60 },
]

// Buckets holding fewer trades than this are real but too thin to draw a
// conclusion from — the footers say so instead of naming a "best hour" off
// two trades.
const MIN_MEANINGFUL_TRADES = 5

interface Bucket {
  key: string
  label: string
  count: number
  wins: number
  netPnl: number
  winRate: number
  /** Compact value text drawn on the bar in P&L view. */
  pnlLabel?: string
  /** "65%" drawn on the bar in win-rate view. */
  winLabel?: string
}

const makeBucket = (key: string, label: string): Bucket =>
  ({ key, label, count: 0, wins: 0, netPnl: 0, winRate: 0 })

function pushTrade(b: Bucket, pnl: number) {
  b.count += 1
  b.netPnl += pnl
  if (pnl > 0) b.wins += 1
}

const finalize = (b: Bucket): Bucket =>
  ({ ...b, winRate: b.count > 0 ? Math.round((b.wins / b.count) * 100) : 0 })

// Building an Intl.DateTimeFormat is the expensive part (~0.1ms each), and
// this runs four times per trade. Cached per zone: 5,000 trades went from
// ~540ms to ~25ms in a Node benchmark.
const TZ_FORMATTERS = new Map<string, Intl.DateTimeFormat>()

/** Minutes since midnight for an instant, read in a specific timezone. */
function minutesInTz(at: Date, tz: string): number {
  let fmt = TZ_FORMATTERS.get(tz)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false,
    })
    TZ_FORMATTERS.set(tz, fmt)
  }
  const parts = fmt.formatToParts(at)
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0'
  return (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10)
}

/** 14 -> "2pm". Hour labels read faster than 24h clock on a dense axis. */
function formatHour(h: number): string {
  if (h === 0) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

// Sessions overlap in real life, so counting a trade once per open market
// double-counts the London/NY crossover — the busiest window of the day — and
// makes the percentages meaningless. Instead every trade lands in exactly one
// zone, and the crossovers become named zones of their own.
//
// Four buckets, the way session tools traders already use split the day
// (Asia, London, New York, out of session). An overlap goes to the market that
// has just opened: the Asia/London crossover is London's open, the London/NY
// crossover is New York's open. Listed in the order they happen in a day.
const ZONES = [
  { key: 'Asia', label: 'Asia' },
  { key: 'London', label: 'London' },
  { key: 'New York', label: 'New York' },
  { key: 'Off-session', label: 'Off hours' },
] as const

function zoneFor(open: Set<string>): string {
  if (open.has('New York')) return 'New York'
  if (open.has('London')) return 'London'
  if (open.has('Tokyo') || open.has('Sydney')) return 'Asia'
  return 'Off-session'
}

/** 8:30 -> "8:30am"; whole hours drop the minutes. */
function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const base = formatHour(h)
  return m === 0 ? base : base.replace(/(am|pm)$/, `:${String(m).padStart(2, '0')}$1`)
}

/**
 * Each zone's window expressed in the viewer's local clock, e.g. "8am–1pm".
 * Sampled across today in 15-minute steps so DST on every market is handled
 * by Intl. The off-hours window spans midnight, so it can be two ranges.
 */
export function zoneWindows(): Record<string, string> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const STEP = 15
  const runs: Record<string, [number, number][]> = {}
  let prevZone: string | null = null
  for (let m = 0; m < 24 * 60; m += STEP) {
    const at = new Date(start.getTime() + m * 60_000)
    const open = new Set<string>()
    for (const sd of SESSIONS) {
      const local = minutesInTz(at, sd.tz)
      if (local >= sd.start && local < sd.end) open.add(sd.name)
    }
    const zone = zoneFor(open)
    const list = (runs[zone] ||= [])
    if (zone === prevZone) list[list.length - 1][1] = m + STEP
    else list.push([m, m + STEP])
    prevZone = zone
  }
  const out: Record<string, string> = {}
  for (const [zone, list] of Object.entries(runs)) {
    // A run that ends at midnight joins one that starts at midnight.
    if (list.length > 1 && list[0][0] === 0 && list[list.length - 1][1] === 24 * 60) {
      const last = list.pop()!
      list[0] = [last[0], list[0][1] + 24 * 60]
    }
    out[zone] = list
      .map(([a, b]) => `${formatClock(a)}–${formatClock(b % (24 * 60))}`)
      .join(', ')
  }
  return out
}

// Entry time is what the trader chose — that is the decision the hour-of-day
// view is about. Exit only stands in when entry is missing or unparseable.
//
// A date with no time (CSV rows that only carry the day, manual entries left
// at the default) parses to local midnight. That is a valid Date but not a
// real time of day, so it is treated as untimed — the same test the trade log
// uses to hide the clock on those rows. A trade genuinely taken at 00:00:00
// is lost to this; that is rarer than a whole import landing on "12am".
export function tradeInstant(t: any): Date | null {
  for (const raw of [t?.entryTime, t?.exitTime]) {
    if (!raw) continue
    const d = raw instanceof Date ? raw : new Date(raw)
    if (isNaN(d.getTime())) continue
    if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) continue
    return d
  }
  return null
}

const safePnl = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0

/** Polar axis label for the radar: session name with its local hours underneath. */
function SessionAngleTick({ x, y, cx, cy, payload, windows }: any) {
  const win = windows?.[payload?.value] ?? ''
  const dx = x - cx, dy = y - cy
  const len = Math.hypot(dx, dy) || 1
  const px = x + (dx / len) * 6, py = y + (dy / len) * 6
  const anchor = Math.abs(dx) < 4 ? 'middle' : dx > 0 ? 'start' : 'end'
  return (
    <g transform={`translate(${px},${py})`}>
      <text textAnchor={anchor} dy={dy < -4 ? -4 : 6} fontSize={11} fontWeight={500} fill="hsl(var(--foreground))">
        {payload?.value}
      </text>
      <text textAnchor={anchor} dy={dy < -4 ? 9 : 19} fontSize={10} fill="hsl(var(--muted-foreground))">
        {win}
      </text>
    </g>
  )
}

/** Category tick for the sessions chart: name, then its local hours. */
function SessionTick({ x, y, payload, windows }: any) {
  const win = windows?.[payload?.value] ?? ''
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="end" dy={-1} fontSize={11} fontWeight={500} fill="hsl(var(--foreground))">
        {payload?.value}
      </text>
      <text textAnchor="end" dy={12} fontSize={10} fill="hsl(var(--muted-foreground))">
        {win}
      </text>
    </g>
  )
}

export function ChartHoursSessions() {
  const { themeColors } = useThemePresets()
  const { formatCurrency, getCurrencySymbol } = useSettings()
  const { getAnalyticsTrades } = useDemoData()
  const { period } = useDashboardPeriod()
  const [refreshKey, setRefreshKey] = useState(0)
  const [hourView, setHourView] = useState<'pnl' | 'winRate'>('pnl')
  const [sessionView, setSessionView] = useState<'pnl' | 'winRate' | 'count'>('pnl')
  const [sessionLayout, setSessionLayout] = useState<'bars' | 'radar'>('bars')

  const localZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'your local time'
    } catch {
      return 'your local time'
    }
  }, [])
  const windows = useMemo(zoneWindows, [])

  useEffect(() => {
    const bump = () => setRefreshKey(prev => prev + 1)
    window.addEventListener('storage', bump)
    window.addEventListener('tradesUpdated', bump)
    return () => {
      window.removeEventListener('storage', bump)
      window.removeEventListener('tradesUpdated', bump)
    }
  }, [])

  const currencySymbol = getCurrencySymbol()

  const {
    hourData, sessionData, totalTrades, allTradesCount, untimedCount,
    bestHour, worstHour, bestWinHour, bestSession,
  } = useMemo(() => {
    // Compact currency for the two bar labels — no decimals, symbol in front.
    const fmtCompact = (n: number) => {
      const sign = n > 0 ? '+' : n < 0 ? '-' : ''
      return `${sign}${currencySymbol}${Math.abs(Math.round(n)).toLocaleString('en-US')}`
    }

    const allTrades = getAnalyticsTrades().trades
    const trades = filterTradesByPeriod(allTrades, period)

    const hours: Bucket[] = Array.from({ length: 24 }, (_, h) =>
      makeBucket(String(h), formatHour(h)))
    const sessions = new Map<string, Bucket>(
      ZONES.map(z => [z.key, makeBucket(z.key, z.label)]))

    let counted = 0
    let untimed = 0

    for (const t of trades || []) {
      const when = tradeInstant(t)
      // A trade with no usable timestamp can't be placed on a clock. Counting
      // it as midnight would invent a pattern, so it is excluded and reported.
      if (!when) { untimed++; continue }
      const pnl = safePnl(t?.pnl)
      counted++

      // Hour buckets use the viewer's own clock: the stored instant is UTC-true
      // (imports convert via the account's broker timezone), so rendering it
      // locally answers "what time was it for me".
      pushTrade(hours[when.getHours()], pnl)

      // Which markets were actually open at that instant, collapsed into the
      // single zone that owns the trade.
      const openNow = new Set<string>()
      for (const s of SESSIONS) {
        const mins = minutesInTz(when, s.tz)
        if (mins >= s.start && mins < s.end) openNow.add(s.name)
      }
      pushTrade(sessions.get(zoneFor(openNow))!, pnl)
    }

    const finalHours = hours.map(finalize)
    // Empty zones are dropped so a London-hours trader doesn't stare at rows
    // they never traded. Kept in time-of-day order so the list reads like a
    // trading day rather than a leaderboard; the footer names the best window.
    const finalSessions = Array.from(sessions.values()).map(finalize)

    // "Best"/"worst" are only claimed off buckets with enough trades behind them.
    const meaningfulHours = finalHours.filter(h => h.count >= MIN_MEANINGFUL_TRADES)
    const best = meaningfulHours.length
      ? meaningfulHours.reduce((a, b) => (b.netPnl > a.netPnl ? b : a)) : null
    // "Worst" only means something when the hour actually lost money. The
    // thinnest winner is not a warning, so it gets no mention at all.
    const losingHours = meaningfulHours.filter(h => h.netPnl < 0)
    const worst = losingHours.length
      ? losingHours.reduce((a, b) => (b.netPnl < a.netPnl ? b : a)) : null

    // Every traded hour carries its value; the empty hours at both ends of the
    // day are trimmed (one hour of padding kept) so the bars use the width.
    for (const h of finalHours) {
      if (h.count > 0) {
        h.pnlLabel = fmtCompact(h.netPnl)
        h.winLabel = `${h.winRate}%`
      }
    }
    const tradedIdx = finalHours.map((h, i) => (h.count > 0 ? i : -1)).filter(i => i >= 0)
    const firstHour = tradedIdx.length ? Math.max(0, tradedIdx[0] - 1) : 0
    const lastHour = tradedIdx.length ? Math.min(23, tradedIdx[tradedIdx.length - 1] + 1) : 23
    const visibleHours = finalHours.slice(firstHour, lastHour + 1)
    const bestWinHour = meaningfulHours.length
      ? meaningfulHours.reduce((a, b) => (b.winRate > a.winRate ? b : a)) : null

    const meaningfulSessions = finalSessions.filter(s => s.count >= MIN_MEANINGFUL_TRADES)

    return {
      hourData: visibleHours,
      bestWinHour,
      sessionData: finalSessions,
      totalTrades: counted,
      allTradesCount: (allTrades || []).length,
      untimedCount: untimed,
      bestHour: best,
      worstHour: worst,
      bestSession: meaningfulSessions.length
        ? meaningfulSessions.reduce((a, b) => (b.netPnl > a.netPnl ? b : a)) : null,
    }
  }, [refreshKey, getAnalyticsTrades, period, currencySymbol])

  const hasData = totalTrades > 0
  const hasDataOutsidePeriod = allTradesCount > 0
  // Trades exist in the period but none carry a usable time.
  const allUntimed = !hasData && untimedCount > 0

  const sessionViewLabel = { pnl: 'P&L', winRate: 'Win rate', count: 'Trades' }[sessionView]
  const hourConfig = {
    netPnl: { label: 'P&L', color: 'hsl(var(--primary))' },
    winRate: { label: 'Win rate', color: 'hsl(var(--primary))' },
  } satisfies ChartConfig
  const sessionConfig = {
    value: { label: sessionViewLabel, color: 'hsl(var(--primary))' },
    radarValue: { label: sessionViewLabel, color: 'hsl(var(--primary))' },
  } satisfies ChartConfig

  // Only the best session carries a value label; the tooltip has the rest.
  const sessionChartData = sessionData.map(s => ({
    ...s,
    window: windows[s.key] ?? '',
    value: sessionView === 'pnl' ? s.netPnl : sessionView === 'winRate' ? s.winRate : s.count,
    // A radar cannot draw below its centre, so a losing session sits at zero
    // on the shape; the signed figure is in the tooltip and the footer.
    radarValue: sessionView === 'pnl' ? Math.max(0, s.netPnl) : sessionView === 'winRate' ? s.winRate : s.count,
    valueLabel: s.count === 0 ? 'No trades'
      : sessionView === 'pnl' ? formatCurrency(s.netPnl, true)
      : sessionView === 'winRate' ? `${s.winRate}%` : String(s.count),
  }))
  const radarMax = Math.max(1, ...sessionChartData.map(d => d.radarValue))
  const bestWinSession = sessionData.filter(s => s.count >= MIN_MEANINGFUL_TRADES)
    .reduce<Bucket | null>((a, b) => (!a || b.winRate > a.winRate ? b : a), null)
  const busiestSession = sessionData.reduce<Bucket | null>((a, b) => (!a || b.count > a.count ? b : a), null)
  const sessionWindowsByLabel = Object.fromEntries(sessionChartData.map(s => [s.label, s.window]))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
      {/* Hour of day */}
      <Card className="h-[450px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold tracking-tight">Time of Day</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1.5">
                {hourView === 'pnl' ? 'P&L by entry hour' : 'Win rate by entry hour'} · {localZone}
              </CardDescription>
            </div>
            <SegmentedControl
              value={hourView}
              onChange={setHourView}
              className="shrink-0"
              aria-label="Hour chart metric"
              options={[
                { value: 'pnl', label: 'P&L' },
                { value: 'winRate', label: 'Win rate' },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 px-4 py-2">
          {hasData ? (
            <ChartContainer config={hourConfig} className="h-full w-full aspect-auto">
              <BarChart data={hourData} margin={{ top: 20, right: 20, bottom: 4, left: 20 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={hourData.length > 14 ? 1 : 0}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis hide domain={hourView === 'winRate' ? [0, 100] : undefined} />
                {/* Without this, losses hang below an invisible line. The zero
                    rule is what makes a red bar read as a loss at a glance.
                    In win-rate view the useful reference is coin-flip, not 0. */}
                <ReferenceLine
                  y={hourView === 'winRate' ? 50 : 0}
                  stroke="hsl(var(--border))"
                  strokeDasharray={hourView === 'winRate' ? '4 4' : undefined}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent
                    formatter={(_value, _name, item) => (
                      item.payload.count === 0 ? (
                        <span>No trades</span>
                      ) : (
                        <span>
                          {formatCurrency(item.payload.netPnl, true)} · {item.payload.winRate}% win rate · {item.payload.count} trade{item.payload.count === 1 ? '' : 's'}
                        </span>
                      )
                    )}
                  />}
                />
                <Bar
                  dataKey={hourView === 'winRate' ? 'winRate' : 'netPnl'}
                  radius={3}
                  maxBarSize={22}
                >
                  {hourData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={hourView === 'winRate'
                        ? themeColors.primary
                        : entry.netPnl >= 0 ? themeColors.profit : themeColors.loss}
                      // Empty hours stay visible as a flat gap rather than
                      // disappearing, so the axis keeps its shape.
                      fillOpacity={entry.count === 0 ? 0.15 : 1}
                    />
                  ))}
                  <LabelList
                    dataKey={hourView === 'pnl' ? 'pnlLabel' : 'winLabel'}
                    position="top"
                    offset={6}
                    className="fill-muted-foreground"
                    fontSize={10}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <ChartEmptyState
              icon={Clock}
              title={allUntimed ? 'Your trades have no time of day' : 'No trades to break down yet'}
              description={allUntimed
                ? `${untimedCount === 1 ? 'The trade in this period has' : `All ${untimedCount} trades in this period have`} a date but no time, so there is nothing to put on a clock. Add the entry time when you log a trade, or import a CSV that includes times.`
                : 'Log a few trades and this shows which hours of the day actually make you money.'}
              hasDataOutsidePeriod={allUntimed ? false : hasDataOutsidePeriod}
            />
          )}
        </CardContent>
        {hasData && (
          <CardFooter className="pt-0 pb-4 px-6">
            <p className="text-xs text-muted-foreground">
              {hourView === 'winRate' && bestWinHour ? (
                <>Best hour by win rate {bestWinHour.label} at {bestWinHour.winRate}% from {bestWinHour.count} trades.</>
              ) : bestHour ? (
                <>
                  {bestHour.netPnl > 0
                    ? <>Best hour {bestHour.label} at {formatCurrency(bestHour.netPnl, true)} from {bestHour.count} trades.</>
                    : <>No hour is in profit yet. Least bad is {bestHour.label} at {formatCurrency(bestHour.netPnl, true)} from {bestHour.count} trades.</>}
                  {worstHour && worstHour.key !== bestHour.key && (
                    <> Worst {worstHour.label} at {formatCurrency(worstHour.netPnl, true)} from {worstHour.count}.</>
                  )}
                </>
              ) : (
                <>No hour has {MIN_MEANINGFUL_TRADES} trades behind it yet, so nothing here is worth acting on.</>
              )}
            </p>
          </CardFooter>
        )}
      </Card>

      {/* Sessions */}
      <Card className="h-[450px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold tracking-tight">Trading Sessions</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1.5">
                {sessionViewLabel} by session · {localZone}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
            <SegmentedControl
              value={sessionView}
              onChange={setSessionView}
              className="shrink-0"
              aria-label="Session chart metric"
              options={[
                { value: 'pnl', label: 'P&L' },
                { value: 'winRate', label: 'Win rate' },
                { value: 'count', label: 'Trades' },
              ]}
            />
            <SegmentedControl
              value={sessionLayout}
              onChange={setSessionLayout}
              className="shrink-0"
              aria-label="Session chart layout"
              options={[
                { value: 'bars', icon: ChartBarHorizontal, ariaLabel: 'Bars view', title: 'Bars' },
                { value: 'radar', icon: ChartPolar, ariaLabel: 'Radar view', title: 'Radar' },
              ]}
            />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 px-4 py-2">
          {hasData && sessionLayout === 'radar' ? (
            <ChartContainer config={sessionConfig} className="h-full w-full aspect-auto">
              <RadarChart data={sessionChartData} outerRadius="72%" margin={{ top: 24, right: 72, bottom: 24, left: 72 }}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent
                    labelFormatter={(_label, payload) => {
                      const p = payload?.[0]?.payload
                      return p ? `${p.label} · ${p.window}` : String(_label)
                    }}
                    formatter={(_value, _name, item) => (
                      item.payload.count === 0 ? (
                        <span>No trades</span>
                      ) : (
                        <span>
                          {formatCurrency(item.payload.netPnl, true)} · {item.payload.winRate}% win rate · {item.payload.count} trade{item.payload.count === 1 ? '' : 's'}
                          {item.payload.count < MIN_MEANINGFUL_TRADES && ' · thin'}
                        </span>
                      )
                    )}
                  />}
                />
                <PolarAngleAxis dataKey="label" tick={<SessionAngleTick windows={sessionWindowsByLabel} />} />
                <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <PolarRadiusAxis domain={[0, sessionView === 'winRate' ? 100 : radarMax]} tick={false} axisLine={false} />
                <Radar
                  dataKey="radarValue"
                  fill={themeColors.primary}
                  fillOpacity={0.55}
                  stroke={themeColors.primary}
                  strokeWidth={2}
                  dot={{ r: 3, fill: themeColors.primary, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </RadarChart>
            </ChartContainer>
          ) : hasData ? (
            <ChartContainer config={sessionConfig} className="h-full w-full aspect-auto">
              <BarChart
                data={sessionChartData}
                layout="vertical"
                margin={{ top: 8, right: 84, bottom: 8, left: 8 }}
                barCategoryGap="28%"
              >
                <XAxis type="number" dataKey="value" hide domain={sessionView === 'winRate' ? [0, 100] : undefined} />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={96}
                  tickLine={false}
                  axisLine={false}
                  tick={<SessionTick windows={sessionWindowsByLabel} />}
                />
                {/* Zero rule in P&L so a loss reads as a loss; coin-flip line in win rate. */}
                <ReferenceLine
                  x={sessionView === 'winRate' ? 50 : 0}
                  stroke="hsl(var(--border))"
                  strokeDasharray={sessionView === 'winRate' ? '4 4' : undefined}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent
                    labelFormatter={(_label, payload) => {
                      const p = payload?.[0]?.payload
                      return p ? `${p.label} · ${p.window}` : String(_label)
                    }}
                    formatter={(_value, _name, item) => (
                      item.payload.count === 0 ? (
                        <span>No trades</span>
                      ) : (
                        <span>
                          {formatCurrency(item.payload.netPnl, true)} · {item.payload.winRate}% win rate · {item.payload.count} trade{item.payload.count === 1 ? '' : 's'}
                          {item.payload.count < MIN_MEANINGFUL_TRADES && ' · thin'}
                        </span>
                      )
                    )}
                  />}
                />
                <Bar dataKey="value" radius={4} maxBarSize={30} isAnimationActive={false}>
                  {sessionChartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={sessionView === 'pnl'
                        ? entry.netPnl >= 0 ? themeColors.profit : themeColors.loss
                        : themeColors.primary}
                      fillOpacity={entry.count === 0 ? 0.15 : 1}
                    />
                  ))}
                  <LabelList
                    dataKey="valueLabel"
                    position="right"
                    offset={8}
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={1}
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <ChartEmptyState
              icon={Clock}
              title={allUntimed ? 'Your trades have no time of day' : 'No session data yet'}
              description={allUntimed
                ? 'Sessions need the time a trade was taken. Add entry times, or import a CSV that includes them, and this fills in.'
                : 'Once you log trades, this shows whether Asia, London or New York is where your edge lives.'}
              hasDataOutsidePeriod={allUntimed ? false : hasDataOutsidePeriod}
            />
          )}
        </CardContent>
        {hasData && (
          <CardFooter className="pt-0 pb-4 px-6">
            <p className="text-xs text-muted-foreground">
              {sessionView === 'count' && busiestSession && busiestSession.count > 0
                ? <>Most trades in {busiestSession.label}: {busiestSession.count} of {totalTrades}. Each trade counts once.</>
                : sessionView === 'winRate' && bestWinSession
                ? <>Best win rate {bestWinSession.label} at {bestWinSession.winRate}% from {bestWinSession.count} trades. Each trade counts once.</>
                : bestSession
                ? <>Best session {bestSession.label} at {formatCurrency(bestSession.netPnl, true)} from {bestSession.count} trades. Each trade counts once.</>
                : <>No session has {MIN_MEANINGFUL_TRADES} trades behind it yet.</>}
              {untimedCount > 0 && <> {untimedCount} trade{untimedCount === 1 ? '' : 's'} had no usable time and {untimedCount === 1 ? 'is' : 'are'} left out.</>}
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
