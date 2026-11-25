import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { useDashboardPeriod, filterTradesByPeriod } from '@/contexts/dashboard-period'
import { useDemoData } from '@/hooks/use-demo-data'
import { useIsMobile } from '@/hooks/use-mobile'
import { ChartEmptyState } from '@/components/dashboard/chart-empty-state'
import { ChartLine } from '@phosphor-icons/react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceDot, ReferenceLine, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { useMemo, useState } from "react"
import { niceAxis } from "@/lib/chart-axis"
import { SegmentedControl } from '@/components/ui/segmented-control'

// Define interfaces
interface Trade {
  id: string
  symbol: string
  side: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  quantity: number
  entryTime: Date
  exitTime: Date
  commission: number
  pnl: number
  pnlPercentage: number
  notes?: string
  strategy?: string
  tags?: string[]
}

type ChartView = 'equity' | 'pnl'

const chartConfig = {
  pnl: {
    label: "P&L",
    color: "hsl(var(--chart-1))",
  },
  cumulative: {
    label: "Cumulative P&L",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

// Symbol always leads, EUR included (matches settings-context formatCurrency).
const fmtMoney = (n: number, symbol: string, withSign = false) => {
  const sign = withSign && n > 0 ? '+' : n < 0 ? '-' : ''
  const formatted = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${sign}${symbol}${formatted}`
}

const fmtMoneyShort = (n: number, symbol: string, withSign = false) => {
  const sign = withSign && n > 0 ? '+' : n < 0 ? '-' : ''
  const formatted = Math.abs(Math.round(n)).toLocaleString('en-US')
  return `${sign}${symbol}${formatted}`
}

// Axis ticks: k-notation above $1,000 ($10.6k) so labels stay short.
// Full values remain in tooltips and the stats strip.
const fmtMoneyAxis = (n: number, symbol: string) => {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  const num = abs >= 1000
    ? `${(abs / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`
    : Math.round(abs).toLocaleString('en-US')
  return `${sign}${symbol}${num}`
}

// Hover card: which day, what it made, and where the running total stands.
function EquityTooltip({ active, payload, profit, loss, symbol }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div className="rounded-xl border border-border/70 bg-popover p-3 text-xs leading-relaxed text-popover-foreground shadow-lg shadow-black/10 dark:shadow-black/30 space-y-1.5 min-w-[10rem]">
      <div className="font-medium text-foreground">{p.date} · {p.tradeNo ? `Trade #${p.tradeNo}` : `${p.trades} ${p.trades === 1 ? 'trade' : 'trades'}`}</div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-muted-foreground">{p.tradeNo ? 'This trade' : 'That day'}</span>
        <span className="font-semibold tabular-nums" style={{ color: p.pnl >= 0 ? profit : loss }}>{fmtMoney(p.pnl, symbol, true)}</span>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-muted-foreground">Running total</span>
        <span className="font-semibold tabular-nums" style={{ color: p.cumulative >= 0 ? profit : loss }}>{fmtMoney(p.cumulative, symbol, true)}</span>
      </div>
    </div>
  )
}

// Hover card for the daily P&L bars.
function DailyTooltip({ active, payload, profit, loss, symbol }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div className="rounded-xl border border-border/70 bg-popover p-3 text-xs leading-relaxed text-popover-foreground shadow-lg shadow-black/10 dark:shadow-black/30 space-y-1.5 min-w-[9rem]">
      <div className="font-medium text-foreground">{p.date}</div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-muted-foreground">Day&apos;s P&amp;L</span>
        <span className="font-semibold tabular-nums" style={{ color: p.pnl >= 0 ? profit : loss }}>{fmtMoney(p.pnl, symbol, true)}</span>
      </div>
    </div>
  )
}

export function ChartAreaInteractive() {
  const [view, setView] = useState<ChartView>('equity')
  // Get theme colors and demo data
  const { themeColors, chartStyle } = useThemePresets()
  const { getCurrencySymbol } = useSettings()
  const symbol = getCurrencySymbol()
  const { getAnalyticsTrades } = useDemoData()
  const { period } = useDashboardPeriod()
  // Mobile reclaims the axis gutter: Recharts' default 60px YAxis plus 20px margins
  // ate ~30% of the card width on a phone.
  const isMobile = useIsMobile()

  // Get trades from demo data or localStorage and generate equity curve data.
  // allTradesCount tracks the unfiltered total so the empty state can tell
  // "no trades at all" apart from "none in the selected period".
  const { chartData, allTradesCount } = useMemo(() => {
    const allTrades = getAnalyticsTrades().trades
    const tradesData = filterTradesByPeriod(allTrades, period)
    if (!tradesData || tradesData.length === 0) return { chartData: [], allTradesCount: allTrades.length }

    const parsedTrades: Trade[] = tradesData.map((trade: any) => ({
      ...trade,
      entryTime: new Date(trade.entryTime),
      exitTime: new Date(trade.exitTime)
    }))

      // Sort trades by exit time
      const sortedTrades = parsedTrades.sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime())

      // Generate equity curve data
      let cumulativePnL = 0
      const rows = sortedTrades.map((trade, index) => {
        cumulativePnL += trade.pnl
        return {
          date: trade.exitTime.toLocaleDateString(),
          dateShort: trade.exitTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          pnl: trade.pnl,
          cumulative: cumulativePnL,
          trade: index + 1,
        }
      })
      return { chartData: rows, allTradesCount: allTrades.length }
  }, [getAnalyticsTrades, period])

  // Aggregate trades by day for the P&L bar chart
  const dailyData = useMemo(() => {
    if (chartData.length === 0) return []

    const byDay = new Map<string, { pnl: number; dateShort: string }>()
    for (const entry of chartData) {
      const day = byDay.get(entry.date)
      if (day) day.pnl += entry.pnl
      else byDay.set(entry.date, { pnl: entry.pnl, dateShort: entry.dateShort })
    }

    return Array.from(byDay, ([date, day]) => ({ date, pnl: day.pnl, dateShort: day.dateShort }))
  }, [chartData])

  // By default the line plots one point per day (the running total at each
  // day's close), so it moves in gentle steps instead of zigzagging trade by
  // trade. Settings > Appearance > Chart style can switch back to every trade.
  // Peak and Deepest dip below always come from every trade.
  const equityDays = useMemo(() => {
    type Point = { date: string; dateShort: string; pnl: number; cumulative: number; trades: number; day: number; tradeNo?: number }
    if (chartStyle.points === 'trade') {
      return chartData.map((d): Point => ({ date: d.date, dateShort: d.dateShort, pnl: d.pnl, cumulative: d.cumulative, trades: 1, day: d.trade, tradeNo: d.trade }))
    }
    const days: Point[] = []
    for (const entry of chartData) {
      const last = days[days.length - 1]
      if (last && last.date === entry.date) {
        last.pnl += entry.pnl
        last.cumulative = entry.cumulative
        last.trades++
      } else {
        days.push({ date: entry.date, dateShort: entry.dateShort, pnl: entry.pnl, cumulative: entry.cumulative, trades: 1, day: days.length + 1 })
      }
    }
    return days
  }, [chartData, chartStyle.points])

  const equityAxis = useMemo(() => {
    let lo = 0, hi = 0
    for (const d of chartData) { lo = Math.min(lo, d.cumulative); hi = Math.max(hi, d.cumulative) }
    const axis = niceAxis(lo, hi)
    // Keep round tick labels without forcing the plot to the next full tick.
    // A $10.6k peak should have a little headroom, not a $15k ceiling.
    const top = hi > 0 ? hi + (hi - lo) * 0.08 : axis.domain[1]
    return { ...axis, domain: [axis.domain[0], top] as [number, number], ticks: axis.ticks.filter(tick => tick <= top) }
  }, [chartData])
  const dailyAxis = useMemo(() => {
    let lo = 0, hi = 0
    for (const d of dailyData) { lo = Math.min(lo, d.pnl); hi = Math.max(hi, d.pnl) }
    return niceAxis(lo, hi)
  }, [dailyData])

  const totalPnL = chartData.length > 0 ? chartData[chartData.length - 1].cumulative : 0
  const isPositive = totalPnL >= 0
  // Curve color follows net performance instead of always rendering green.
  const curveColor = isPositive ? themeColors.profit : themeColors.loss

  // Peak (high-water mark), max drawdown, and where $0 sits in the value range
  // (used to split the curve green-above / red-below the waterline).
  const { peak, maxDrawdown } = useMemo(() => {
    if (chartData.length === 0) return { peak: 0, maxDrawdown: 0 }
    let runningPeak = chartData[0].cumulative
    let dd = 0
    let hi = chartData[0].cumulative
    for (const d of chartData) {
      runningPeak = Math.max(runningPeak, d.cumulative)
      dd = Math.min(dd, d.cumulative - runningPeak)
      hi = Math.max(hi, d.cumulative)
    }
    return { peak: hi, maxDrawdown: dd }
  }, [chartData])

  // Where the plotted line peaks, and where $0 sits in its range (used to split
  // the curve green-above / red-below the waterline).
  const { linePeak, linePeakDay, gradientOffset } = useMemo(() => {
    if (equityDays.length === 0) return { linePeak: 0, linePeakDay: 0, gradientOffset: 1 }
    let lo = equityDays[0].cumulative
    let hi = equityDays[0].cumulative
    let hiDay = equityDays[0].day
    for (const d of equityDays) {
      lo = Math.min(lo, d.cumulative)
      if (d.cumulative > hi) { hi = d.cumulative; hiDay = d.day }
    }
    const max = Math.max(hi, 0)
    const min = Math.min(lo, 0)
    const offset = max <= 0 ? 0 : min >= 0 ? 1 : max / (max - min)
    return { linePeak: hi, linePeakDay: hiDay, gradientOffset: offset }
  }, [equityDays])

  // X-axis labels: one per unique date (no repeats), thinned to ~8 evenly spaced.
  const dateTicks = useMemo(() => {
    const seen = new Set<string>()
    const firstOfDate = equityDays.filter(d => !seen.has(d.date) && seen.add(d.date)).map(d => ({ trade: d.day, date: d.dateShort }))
    const maxTicks = 8
    let chosen = firstOfDate
    if (firstOfDate.length > maxTicks) {
      const step = (firstOfDate.length - 1) / (maxTicks - 1)
      chosen = Array.from({ length: maxTicks }, (_, i) => firstOfDate[Math.round(i * step)])
    }
    const labelByTrade: Record<number, string> = {}
    chosen.forEach(c => { labelByTrade[c.trade] = c.date })
    return { ticks: chosen.map(c => c.trade), labelByTrade }
  }, [equityDays])

  const winDays = dailyData.filter(d => d.pnl >= 0).length
  const lossDays = dailyData.filter(d => d.pnl < 0).length

  const dailyStats = useMemo(() => {
    if (dailyData.length === 0) return { best: 0, worst: 0, avg: 0 }
    let best = -Infinity, worst = Infinity, sum = 0
    for (const d of dailyData) {
      best = Math.max(best, d.pnl)
      worst = Math.min(worst, d.pnl)
      sum += d.pnl
    }
    return { best, worst, avg: sum / dailyData.length }
  }, [dailyData])

  return (
    <Card className="flex flex-col overflow-hidden shadow-none">
      <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold">
              {view === 'equity' ? 'Equity Curve' : 'Daily P&L'}
            </CardTitle>
            <CardDescription className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {chartData.length > 0 ? (
                <>
                  <span>{chartData[0].dateShort} &ndash; {chartData[chartData.length - 1].dateShort}</span>
                  <span aria-hidden="true">·</span>
                  <span>{chartData.length} trades</span>
                  {view === 'pnl' && <><span aria-hidden="true">·</span><span>{winDays} green / {lossDays} red days</span></>}
                </>
              ) : 'Your trading performance over time'}
            </CardDescription>
          </div>
          <SegmentedControl
            value={view}
            onChange={setView}
            aria-label="Chart view"
            options={[
              { value: 'equity', label: 'Equity' },
              { value: 'pnl', label: 'P&L' },
            ]}
          />
        </div>

        {view === 'equity' && chartData.length > 0 && (
          <div className="grid grid-cols-[1.3fr_1fr_1fr] items-end gap-3 border-t pt-4 !mt-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-8 [&>div]:min-w-0 [&>div]:gap-1.5 [&>div:first-child>span:last-child]:text-2xl sm:[&>div:first-child>span:last-child]:text-3xl [&>div:first-child>span:last-child]:tracking-tight [&>div>span:last-child]:[overflow-wrap:anywhere]">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Net P&L</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: isPositive ? themeColors.profit : themeColors.loss }}>
                {fmtMoneyShort(totalPnL, symbol, true)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Peak</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: themeColors.profit }}>
                {fmtMoneyShort(peak, symbol)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Deepest dip</span>
              {maxDrawdown < 0 ? (
                <span className="text-sm font-semibold tabular-nums" style={{ color: themeColors.loss }}>
                  {fmtMoneyShort(maxDrawdown, symbol)}
                </span>
              ) : (
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">{fmtMoneyShort(0, symbol)}</span>
              )}
            </div>
          </div>
        )}

        {view === 'pnl' && dailyData.length > 0 && (
          <div className="grid grid-cols-[1.3fr_1fr_1fr] items-end gap-3 border-t pt-4 !mt-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-8 [&>div]:min-w-0 [&>div]:gap-1.5 [&>div:first-child>span:last-child]:text-2xl sm:[&>div:first-child>span:last-child]:text-3xl [&>div:first-child>span:last-child]:tracking-tight [&>div>span:last-child]:[overflow-wrap:anywhere]">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Best day</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: dailyStats.best >= 0 ? themeColors.profit : themeColors.loss }}>
                {fmtMoneyShort(dailyStats.best, symbol, true)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Worst day</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: dailyStats.worst < 0 ? themeColors.loss : themeColors.profit }}>
                {fmtMoneyShort(dailyStats.worst, symbol, true)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg / day</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: dailyStats.avg >= 0 ? themeColors.profit : themeColors.loss }}>
                {fmtMoneyShort(dailyStats.avg, symbol, true)}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="min-w-0 px-4 pt-0 pb-2 sm:pt-0 sm:pb-2">
        {chartData.length > 0 ? (
          <div className="h-[220px]">
            {view === 'equity' ? (
              <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <AreaChart
                  accessibilityLayer
                  data={equityDays}
                  margin={{
                    left: isMobile ? 0 : 20,
                    right: isMobile ? 8 : 20,
                    top: 12,
                    bottom: 4,
                  }}
                >
                  <defs>
                    {/* Split both fill and stroke at the $0 waterline: green above, red below. */}
                    <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={0} stopColor={themeColors.profit} stopOpacity={0.4} />
                      <stop offset={gradientOffset} stopColor={themeColors.profit} stopOpacity={0} />
                      <stop offset={gradientOffset} stopColor={themeColors.loss} stopOpacity={0} />
                      <stop offset={1} stopColor={themeColors.loss} stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="equityStroke" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={0} stopColor={themeColors.profit} />
                      <stop offset={gradientOffset} stopColor={themeColors.profit} />
                      <stop offset={gradientOffset} stopColor={themeColors.loss} />
                      <stop offset={1} stopColor={themeColors.loss} />
                    </linearGradient>
                  </defs>
                  {chartStyle.grid && <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.25} />}
                  <XAxis
                    dataKey="day"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    ticks={dateTicks.ticks}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => dateTicks.labelByTrade[value] || ''}
                  />
                  <YAxis
                    width={isMobile ? 48 : 60}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={isMobile ? 4 : 8}
                    domain={equityAxis.domain}
                    ticks={equityAxis.ticks}
                    tickFormatter={(value) => fmtMoneyAxis(value, symbol)}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" strokeWidth={1} />
                  {/* High-water mark: faint dotted line + dot so the Peak stat has a visible anchor */}
                  <ReferenceLine y={linePeak} stroke={themeColors.profit} strokeOpacity={0.3} strokeDasharray="2 4" strokeWidth={1} />
                  <ChartTooltip
                    cursor={false}
                    content={<EquityTooltip profit={themeColors.profit} loss={themeColors.loss} symbol={symbol} />}
                  />
                  <Area
                    dataKey="cumulative"
                    type={chartStyle.curveType}
                    baseValue={0}
                    fill="url(#equityFill)"
                    fillOpacity={chartStyle.fill ? 1 : 0}
                    stroke="url(#equityStroke)"
                    strokeWidth={1.5}
                    activeDot={{ r: 4, fill: curveColor, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    dot={(props: any) => {
                      const { cx, cy, index, key } = props
                      // Mark only the latest point so "where am I now" reads at a glance.
                      if (index !== equityDays.length - 1) return <g key={key} />
                      return (
                        <circle
                          key={key}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={curveColor}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      )
                    }}
                  />
                  <ReferenceDot
                    x={linePeakDay}
                    y={linePeak}
                    r={3}
                    fill={themeColors.profit}
                    stroke="hsl(var(--background))"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <BarChart
                  accessibilityLayer
                  data={dailyData}
                  margin={{
                    left: isMobile ? 0 : 20,
                    right: isMobile ? 8 : 20,
                    top: 10,
                    bottom: 4,
                  }}
                  barCategoryGap="20%"
                >
                  {chartStyle.grid && <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.25} />}
                  <XAxis
                    dataKey="dateShort"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    width={isMobile ? 48 : 60}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={isMobile ? 4 : 8}
                    domain={dailyAxis.domain}
                    ticks={dailyAxis.ticks}
                    tickFormatter={(value) => fmtMoneyAxis(value, symbol)}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                  {/* Dashed line at the average day so each bar reads against typical */}
                  <ReferenceLine y={dailyStats.avg} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.5} strokeDasharray="4 4" strokeWidth={1} />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.4 }}
                    content={<DailyTooltip profit={themeColors.profit} loss={themeColors.loss} symbol={symbol} />}
                  />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={28}>
                    {dailyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? themeColors.profit : themeColors.loss}
                        fillOpacity={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </div>
        ) : (
          <div className="h-[220px]">
            <ChartEmptyState
              icon={ChartLine}
              title="No trades to chart yet"
              description="Log your first trade and your equity curve starts here."
              hasDataOutsidePeriod={allTradesCount > 0}
            />
          </div>
        )}
      </CardContent>

    </Card>
  )
}
