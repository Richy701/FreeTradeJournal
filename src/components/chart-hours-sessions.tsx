"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, Cell, LabelList, ReferenceLine, XAxis, YAxis } from "recharts"
import { Clock } from '@phosphor-icons/react'

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
  /** Value text drawn on the bar — only set for the buckets worth calling out. */
  pnlLabel?: string
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
const ZONES = [
  'London / NY overlap',
  'Asia / London overlap',
  'London only',
  'New York only',
  'Asia',
  'Off-session',
] as const

function zoneFor(open: Set<string>): string {
  const london = open.has('London')
  const newYork = open.has('New York')
  const asia = open.has('Tokyo') || open.has('Sydney')
  if (london && newYork) return 'London / NY overlap'
  if (asia && london) return 'Asia / London overlap'
  if (newYork) return 'New York only'
  if (london) return 'London only'
  if (asia) return 'Asia'
  return 'Off-session'
}

// Entry time is what the trader chose — that is the decision the hour-of-day
// view is about. Exit only stands in when entry is missing or unparseable.
function tradeInstant(t: any): Date | null {
  for (const raw of [t?.entryTime, t?.exitTime]) {
    if (!raw) continue
    const d = raw instanceof Date ? raw : new Date(raw)
    if (!isNaN(d.getTime())) return d
  }
  return null
}

const safePnl = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0

export function ChartHoursSessions() {
  const { themeColors } = useThemePresets()
  const { formatCurrency, getCurrencySymbol } = useSettings()
  const { getAnalyticsTrades } = useDemoData()
  const { period } = useDashboardPeriod()
  const [refreshKey, setRefreshKey] = useState(0)
  const [hourView, setHourView] = useState<'pnl' | 'winRate'>('pnl')

  const localZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'your local time'
    } catch {
      return 'your local time'
    }
  }, [])

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
    bestHour, worstHour, bestSession, pnlRange,
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
      ZONES.map(z => [z, makeBucket(z, z)]))

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
    // they never traded. Strongest first.
    const finalSessions = Array.from(sessions.values())
      .filter(b => b.count > 0).map(finalize)
      .sort((a, b) => b.netPnl - a.netPnl)

    // "Best"/"worst" are only claimed off buckets with enough trades behind them.
    const meaningfulHours = finalHours.filter(h => h.count >= MIN_MEANINGFUL_TRADES)
    const best = meaningfulHours.length
      ? meaningfulHours.reduce((a, b) => (b.netPnl > a.netPnl ? b : a)) : null
    // "Worst" only means something when the hour actually lost money. The
    // thinnest winner is not a warning, so it gets no mention at all.
    const losingHours = meaningfulHours.filter(h => h.netPnl < 0)
    const worst = losingHours.length
      ? losingHours.reduce((a, b) => (b.netPnl < a.netPnl ? b : a)) : null

    // Only the best hour carries a value on the bar. Labelling the worst too
    // collides whenever the two land on adjacent hours, and the footer already
    // states both numbers in full.
    for (const h of finalHours) {
      if (best && h.key === best.key) h.pnlLabel = fmtCompact(h.netPnl)
    }

    const meaningfulSessions = finalSessions.filter(s => s.count >= MIN_MEANINGFUL_TRADES)

    return {
      hourData: finalHours,
      sessionData: finalSessions,
      totalTrades: counted,
      allTradesCount: (allTrades || []).length,
      untimedCount: untimed,
      bestHour: best,
      worstHour: worst,
      bestSession: meaningfulSessions.length
        ? meaningfulSessions.reduce((a, b) => (b.netPnl > a.netPnl ? b : a)) : null,
      // The track spans the actual data range, so zero sits where the data puts
      // it. All-profitable zones fill from the left edge with no wasted half;
      // once something loses money the axis moves in and the split is visible.
      pnlRange: finalSessions.reduce(
        (r, s) => ({ min: Math.min(r.min, s.netPnl), max: Math.max(r.max, s.netPnl) }),
        { min: 0, max: 0 },
      ),
    }
  }, [refreshKey, getAnalyticsTrades, period, currencySymbol])

  const hasData = totalTrades > 0
  const hasDataOutsidePeriod = allTradesCount > 0

  // Zero's position along the track, derived from the data rather than pinned
  // to the middle — a set with no losses should not waste half its width.
  const span = pnlRange.max - pnlRange.min
  const zeroPos = span > 0 ? ((0 - pnlRange.min) / span) * 100 : 0
  const hasLosingZone = pnlRange.min < 0

  const hourConfig = {
    netPnl: { label: 'P&L', color: 'hsl(var(--primary))' },
    winRate: { label: 'Win rate', color: 'hsl(var(--primary))' },
  } satisfies ChartConfig

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
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setHourView('pnl')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  hourView === 'pnl'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={hourView === 'pnl'}
              >
                P&L
              </button>
              <button
                onClick={() => setHourView('winRate')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  hourView === 'winRate'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={hourView === 'winRate'}
              >
                Win rate
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 px-4 py-2">
          {hasData ? (
            <ChartContainer config={hourConfig} className="h-full w-full aspect-auto">
              <BarChart data={hourData} margin={{ top: 20, right: 8, bottom: 4, left: 4 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={2}
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
                  {hourView === 'pnl' && (
                    <LabelList
                      dataKey="pnlLabel"
                      position="top"
                      offset={6}
                      className="fill-muted-foreground"
                      fontSize={11}
                    />
                  )}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <ChartEmptyState
              icon={Clock}
              title="No trades to break down yet"
              description="Log a few trades and this shows which hours of the day actually make you money."
              hasDataOutsidePeriod={hasDataOutsidePeriod}
            />
          )}
        </CardContent>
        {hasData && (
          <CardFooter className="pt-0 pb-4 px-6">
            <p className="text-xs text-muted-foreground">
              {bestHour ? (
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
          <CardTitle className="text-lg font-semibold tracking-tight">Trading Sessions</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1.5">
            P&L by market window · {localZone}. Every trade counts once, in the one window it was taken in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 px-6 py-2">
          {hasData && sessionData.length > 0 ? (
            <div className="h-full flex flex-col justify-evenly py-1">
              {sessionData.map((s) => {
                const width = span > 0 ? Math.max((Math.abs(s.netPnl) / span) * 100, 1) : 0
                const color = s.netPnl >= 0 ? themeColors.profit : themeColors.loss
                return (
                  <div key={s.key} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-foreground truncate">
                        {s.label}{' '}
                        <span className="font-normal text-muted-foreground">
                          {s.count} trade{s.count === 1 ? '' : 's'} · {s.winRate}% win
                          {s.count < MIN_MEANINGFUL_TRADES && ' · thin'}
                        </span>
                      </span>
                      <span
                        className="text-xs font-semibold tabular-nums shrink-0"
                        style={{ color }}
                      >
                        {formatCurrency(s.netPnl, true)}
                      </span>
                    </div>
                    <div className="relative h-2.5 w-full rounded-full bg-muted/40">
                      <div
                        className="absolute inset-y-0 rounded-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor: color,
                          ...(s.netPnl >= 0
                            ? { left: `${zeroPos}%` }
                            : { right: `${100 - zeroPos}%` }),
                        }}
                      />
                      {/* The zero rule only earns its place once something is
                          losing money — with an all-profitable set it would just
                          be a line hugging the left edge. */}
                      {hasLosingZone && (
                        <div
                          className="absolute inset-y-[-3px] w-px bg-border"
                          style={{ left: `${zeroPos}%` }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <ChartEmptyState
              icon={Clock}
              title="No session data yet"
              description="Once you log trades, this shows whether London, the New York crossover or the Asia hours is where your edge lives."
              hasDataOutsidePeriod={hasDataOutsidePeriod}
            />
          )}
        </CardContent>
        {hasData && (
          <CardFooter className="pt-0 pb-4 px-6">
            <p className="text-xs text-muted-foreground">
              {bestSession
                ? <>{hasLosingZone && 'Losses run left of the line, profits right. '}Best window {bestSession.label} at {formatCurrency(bestSession.netPnl, true)} from {bestSession.count} trades.</>
                : <>No window has {MIN_MEANINGFUL_TRADES} trades behind it yet.</>}
              {untimedCount > 0 && <> {untimedCount} trade{untimedCount === 1 ? '' : 's'} had no usable time and {untimedCount === 1 ? 'is' : 'are'} left out.</>}
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
