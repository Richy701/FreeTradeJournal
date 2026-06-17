import { useThemePresets } from '@/contexts/theme-presets'
import { useDemoData } from '@/hooks/use-demo-data'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts"
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
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { useMemo, useState } from "react"

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

const fmtUSD = (n: number, withSign = false) => {
  const sign = withSign && n > 0 ? '+' : n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const fmtUSDShort = (n: number, withSign = false) => {
  const sign = withSign && n > 0 ? '+' : n < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`
}

// Hover card: which trade, what it made, and where the running total stands.
function EquityTooltip({ active, payload, profit, loss }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs space-y-1.5 min-w-[10rem]">
      <div className="font-medium text-foreground">{p.date} · Trade #{p.trade}</div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-muted-foreground">This trade</span>
        <span className="font-semibold tabular-nums" style={{ color: p.pnl >= 0 ? profit : loss }}>{fmtUSD(p.pnl, true)}</span>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-muted-foreground">Running total</span>
        <span className="font-semibold tabular-nums" style={{ color: p.cumulative >= 0 ? profit : loss }}>{fmtUSD(p.cumulative, true)}</span>
      </div>
    </div>
  )
}

// Hover card for the daily P&L bars.
function DailyTooltip({ active, payload, profit, loss }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs space-y-1.5 min-w-[9rem]">
      <div className="font-medium text-foreground">{p.date}</div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-muted-foreground">Day&apos;s P&amp;L</span>
        <span className="font-semibold tabular-nums" style={{ color: p.pnl >= 0 ? profit : loss }}>{fmtUSD(p.pnl, true)}</span>
      </div>
    </div>
  )
}

export function ChartAreaInteractive() {
  const [view, setView] = useState<ChartView>('equity')
  // Get theme colors and demo data
  const { themeColors } = useThemePresets()
  const { getTrades } = useDemoData()

  // Get trades from demo data or localStorage and generate equity curve data
  const chartData = useMemo(() => {
    const tradesData = getTrades()
    if (!tradesData || tradesData.length === 0) return []

    const parsedTrades: Trade[] = tradesData.map((trade: any) => ({
      ...trade,
      entryTime: new Date(trade.entryTime),
      exitTime: new Date(trade.exitTime)
    }))

      // Sort trades by exit time
      const sortedTrades = parsedTrades.sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime())

      // Generate equity curve data
      let cumulativePnL = 0
      return sortedTrades.map((trade, index) => {
        cumulativePnL += trade.pnl
        return {
          date: trade.exitTime.toLocaleDateString(),
          pnl: trade.pnl,
          cumulative: cumulativePnL,
          trade: index + 1,
        }
      })
  }, [getTrades])

  // Aggregate trades by day for the P&L bar chart
  const dailyData = useMemo(() => {
    if (chartData.length === 0) return []

    const byDay = new Map<string, number>()
    for (const entry of chartData) {
      byDay.set(entry.date, (byDay.get(entry.date) || 0) + entry.pnl)
    }

    return Array.from(byDay, ([date, pnl]) => ({ date, pnl }))
  }, [chartData])

  const totalPnL = chartData.length > 0 ? chartData[chartData.length - 1].cumulative : 0
  const isPositive = totalPnL >= 0
  // Curve color follows net performance instead of always rendering green.
  const curveColor = isPositive ? themeColors.profit : themeColors.loss

  // Peak (high-water mark), max drawdown, and where $0 sits in the value range
  // (used to split the curve green-above / red-below the waterline).
  const { peak, maxDrawdown, gradientOffset } = useMemo(() => {
    if (chartData.length === 0) return { peak: 0, maxDrawdown: 0, gradientOffset: 1 }
    let runningPeak = chartData[0].cumulative
    let dd = 0
    let lo = chartData[0].cumulative
    let hi = chartData[0].cumulative
    for (const d of chartData) {
      runningPeak = Math.max(runningPeak, d.cumulative)
      dd = Math.min(dd, d.cumulative - runningPeak)
      lo = Math.min(lo, d.cumulative)
      hi = Math.max(hi, d.cumulative)
    }
    const max = Math.max(hi, 0)
    const min = Math.min(lo, 0)
    const offset = max <= 0 ? 0 : min >= 0 ? 1 : max / (max - min)
    return { peak: hi, maxDrawdown: dd, gradientOffset: offset }
  }, [chartData])

  // X-axis labels: one per unique date (no repeats), thinned to ~8 evenly spaced.
  const dateTicks = useMemo(() => {
    const firstOfDate: { trade: number; date: string }[] = []
    const seen = new Set<string>()
    for (const d of chartData) {
      if (!seen.has(d.date)) {
        seen.add(d.date)
        firstOfDate.push({ trade: d.trade, date: d.date })
      }
    }
    const maxTicks = 8
    let chosen = firstOfDate
    if (firstOfDate.length > maxTicks) {
      const step = (firstOfDate.length - 1) / (maxTicks - 1)
      chosen = Array.from({ length: maxTicks }, (_, i) => firstOfDate[Math.round(i * step)])
    }
    const labelByTrade: Record<number, string> = {}
    chosen.forEach(c => { labelByTrade[c.trade] = c.date })
    return { ticks: chosen.map(c => c.trade), labelByTrade }
  }, [chartData])

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
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold">
              {view === 'equity' ? 'Equity Curve' : 'Daily P&L'}
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium mt-1">
              {view === 'equity'
                ? 'Cumulative profit and loss, trade by trade'
                : 'Profit and loss for each trading day'}
            </CardDescription>
          </div>
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
            <button
              onClick={() => setView('equity')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                view === 'equity'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={view === 'equity'}
            >
              Equity
            </button>
            <button
              onClick={() => setView('pnl')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                view === 'pnl'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={view === 'pnl'}
            >
              P&L
            </button>
          </div>
        </div>

        {view === 'equity' && chartData.length > 0 && (
          <div className="flex items-center gap-4 sm:gap-5 mt-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Net</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: isPositive ? themeColors.profit : themeColors.loss }}>
                {fmtUSDShort(totalPnL, true)}
              </span>
            </div>
            <div className="h-7 w-px bg-border/70 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Peak</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: themeColors.profit }}>
                {fmtUSDShort(peak)}
              </span>
            </div>
            <div className="h-7 w-px bg-border/70 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Deepest dip</span>
              {maxDrawdown < 0 ? (
                <span className="text-sm font-semibold tabular-nums" style={{ color: themeColors.loss }}>
                  {fmtUSDShort(maxDrawdown)}
                </span>
              ) : (
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">$0</span>
              )}
            </div>
          </div>
        )}

        {view === 'pnl' && dailyData.length > 0 && (
          <div className="flex items-center gap-4 sm:gap-5 mt-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Best day</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: dailyStats.best >= 0 ? themeColors.profit : themeColors.loss }}>
                {fmtUSDShort(dailyStats.best, true)}
              </span>
            </div>
            <div className="h-7 w-px bg-border/70 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Worst day</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: dailyStats.worst < 0 ? themeColors.loss : themeColors.profit }}>
                {fmtUSDShort(dailyStats.worst, true)}
              </span>
            </div>
            <div className="h-7 w-px bg-border/70 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg / day</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: dailyStats.avg >= 0 ? themeColors.profit : themeColors.loss }}>
                {fmtUSDShort(dailyStats.avg, true)}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="px-4 py-2">
        {chartData.length > 0 ? (
          <div className="h-[260px]">
            {view === 'equity' ? (
              <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20,
                  }}
                >
                  <defs>
                    {/* Split both fill and stroke at the $0 waterline: green above, red below. */}
                    <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={0} stopColor={themeColors.profit} stopOpacity={0.5} />
                      <stop offset={gradientOffset} stopColor={themeColors.profit} stopOpacity={0.04} />
                      <stop offset={gradientOffset} stopColor={themeColors.loss} stopOpacity={0.04} />
                      <stop offset={1} stopColor={themeColors.loss} stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="equityStroke" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={0} stopColor={themeColors.profit} />
                      <stop offset={gradientOffset} stopColor={themeColors.profit} />
                      <stop offset={gradientOffset} stopColor={themeColors.loss} />
                      <stop offset={1} stopColor={themeColors.loss} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.35} />
                  <XAxis
                    dataKey="trade"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    ticks={dateTicks.ticks}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => (dateTicks.labelByTrade[value] || '').slice(0, 5)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={[(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)]}
                    tickFormatter={(value) => `$${Math.round(value).toLocaleString()}`}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" strokeWidth={1} />
                  <ChartTooltip
                    cursor={false}
                    content={<EquityTooltip profit={themeColors.profit} loss={themeColors.loss} />}
                  />
                  <Area
                    dataKey="cumulative"
                    type="monotone"
                    baseValue={0}
                    fill="url(#equityFill)"
                    stroke="url(#equityStroke)"
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, index, key } = props
                      // Mark only the latest point so "where am I now" reads at a glance.
                      if (index !== chartData.length - 1) return <g key={key} />
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
                </AreaChart>
              </ChartContainer>
            ) : (
              <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <BarChart
                  accessibilityLayer
                  data={dailyData}
                  margin={{
                    left: 20,
                    right: 20,
                    top: 10,
                    bottom: 20,
                  }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.35} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                    interval="preserveStartEnd"
                    tickFormatter={(value) => value.slice(0, 5)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `$${Math.round(value).toLocaleString()}`}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.4 }}
                    content={<DailyTooltip profit={themeColors.profit} loss={themeColors.loss} />}
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
          <div className="flex h-[260px] items-center justify-center text-center text-muted-foreground px-6">
            No trades to chart yet. Log your first one and your curve starts here.
          </div>
        )}
      </CardContent>
      {chartData.length > 0 && (
      <CardFooter className="border-t border-border/70 px-4 sm:px-6">
        <div className="flex w-full items-center gap-2 sm:gap-3 text-xs sm:text-sm mt-2 min-w-0">
          {view === 'equity' ? (
            <>
              <div className="flex items-center gap-1.5 sm:gap-2 leading-none min-w-0 truncate text-muted-foreground font-medium">
                {chartData[0].date} &ndash; {chartData[chartData.length - 1].date}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 sm:gap-2 leading-none whitespace-nowrap">
                <span className="font-semibold" style={{color: themeColors.profit}}>{winDays} green</span>
                <span className="text-muted-foreground">/</span>
                <span className="font-semibold" style={{color: themeColors.loss}}>{lossDays} red</span>
                <span className="text-muted-foreground">days</span>
              </div>
            </>
          )}
          <div className="h-4 w-px bg-border shrink-0"></div>
          <div className="text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {chartData.length} trades
          </div>
        </div>
      </CardFooter>
      )}
    </Card>
  )
}
