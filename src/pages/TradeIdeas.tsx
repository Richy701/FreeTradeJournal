import { useId, useMemo } from 'react'
import { Lightbulb, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { Footer7 } from '@/components/ui/footer-7'
import { footerConfig } from '@/components/ui/footer-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTradeIdeas } from '@/hooks/use-trade-ideas'
import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Area,
  AreaChart,
  Label,
  ReferenceLine,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

export default function TradeIdeas() {
  const { ideas, charts, summary, totalTrades, hasEnoughData } = useTradeIdeas()
  const { themeColors } = useThemePresets()
  const { formatCurrency } = useSettings()
  const gradientId = useId().replace(/:/g, '')

  if (!hasEnoughData) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="border-b">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold">Trade Insights</h1>
          </div>
        </div>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="p-4 rounded-2xl" style={{ backgroundColor: `${themeColors.primary}10` }}>
                <Lightbulb className="h-8 w-8" style={{ color: themeColors.primary }} aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Not Enough Data Yet</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Log at least 5 trades to unlock data-driven trade insights.
                </p>
              </div>
              <Button asChild className="mt-2">
                <Link to="/trades">
                  Log Trades <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer7 {...footerConfig} />
      </div>
    )
  }

  const symbolConfig = useMemo<ChartConfig>(() => ({
    pnl: { label: 'P&L', color: themeColors.primary },
  }), [themeColors.primary])

  const hourlyConfig = useMemo<ChartConfig>(() => ({
    pnl: { label: 'P&L', color: themeColors.primary },
  }), [themeColors.primary])

  const profileConfig = useMemo<ChartConfig>(() => ({
    value: { label: 'Score', color: themeColors.primary },
  }), [themeColors.primary])

  const directionConfig = useMemo<ChartConfig>(() => ({
    Long: { label: 'Long', color: themeColors.profit },
    Short: { label: 'Short', color: themeColors.loss },
  }), [themeColors.profit, themeColors.loss])

  const weeklyConfig = useMemo<ChartConfig>(() => ({
    pnl: { label: 'Weekly P&L', color: themeColors.primary },
  }), [themeColors.primary])

  const strategyConfig = useMemo<ChartConfig>(() => ({
    pnl: { label: 'P&L', color: themeColors.primary },
  }), [themeColors.primary])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Header */}
      <div className="border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Trade Insights</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {ideas.length} insights from{' '}
                <span className="font-medium text-foreground">{totalTrades} trades</span>
                {summary && (
                  <>
                    {' '}&middot;{' '}
                    <span className="font-medium" style={{ color: summary.totalPnl >= 0 ? themeColors.profit : themeColors.loss, fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(summary.totalPnl, true)}
                    </span>
                    {' '}total &middot;{' '}
                    <span className="font-medium text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {summary.winRate}%
                    </span>
                    {' '}win rate
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Summary Stats */}
        {summary && (
          <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex items-center gap-2.5 rounded-full py-2 px-4"
              style={{ backgroundColor: `${themeColors.profit}12` }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: themeColors.profit }} />
              <span className="text-sm font-semibold" style={{ color: themeColors.profit }}>
                {summary.bestSymbol}
              </span>
              <span className="text-xs text-muted-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(summary.bestSymbolPnl, true)}
              </span>
            </div>
            <div
              className="flex items-center gap-2.5 rounded-full py-2 px-4"
              style={{ backgroundColor: `${themeColors.primary}12` }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: themeColors.primary }} />
              <span className="text-sm font-semibold" style={{ color: themeColors.primary }}>
                {summary.bestDay}s
              </span>
              <span className="text-xs text-muted-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {summary.bestDayWinRate}% WR
              </span>
            </div>
            <div
              className="flex items-center gap-2.5 rounded-full py-2 px-4"
              style={{ backgroundColor: `${themeColors.primary}12` }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: themeColors.primary }} />
              <span className="text-sm font-semibold" style={{ color: themeColors.primary }}>
                {summary.winDirection}
              </span>
              <span className="text-xs text-muted-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {summary.winDirectionWr}% WR
              </span>
            </div>
            {summary.topStrategy && summary.topStrategy !== '—' && (
              <div
                className="flex items-center gap-2.5 rounded-full py-2 px-4"
                style={{ backgroundColor: `${themeColors.profit}12` }}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: themeColors.profit }} />
                <span className="text-sm font-semibold" style={{ color: themeColors.profit }}>
                  {summary.topStrategy}
                </span>
                <span className="text-xs text-muted-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {summary.topStrategyWr}% WR
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your strongest symbol is{' '}
            <span className="font-medium text-foreground">{summary.bestSymbol}</span>
            {' '}at{' '}
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(summary.bestSymbolPnl, true)}</span>
            . You perform best on{' '}
            <span className="font-medium text-foreground">{summary.bestDay}s</span>
            {' '}with a{' '}
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{summary.bestDayWinRate}%</span>
            {' '}win rate, and your edge leans{' '}
            <span className="font-medium text-foreground">{summary.winDirection}</span>
            {' '}at{' '}
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{summary.winDirectionWr}% WR</span>
            {summary.topStrategy && summary.topStrategy !== '—' && (
              <>
                . Top strategy:{' '}
                <span className="font-medium text-foreground">{summary.topStrategy}</span>
                {' '}
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>({summary.topStrategyWr}% WR)</span>
              </>
            )}
            .
          </p>
          </div>
        )}

        {/* Symbol Performance Chart */}
        {charts && charts.symbolPnl.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Symbol Performance</CardTitle>
              <CardDescription>P&L breakdown by instrument</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={symbolConfig} className="h-[300px] w-full">
                <BarChart
                  accessibilityLayer
                  data={charts.symbolPnl}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <XAxis type="number" dataKey="pnl" hide />
                  <YAxis
                    dataKey="symbol"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, item) => {
                          const d = item.payload
                          return (
                            <span>
                              {formatCurrency(Number(value), true)} · {d.winRate}% WR · {d.wins + d.losses} trades
                            </span>
                          )
                        }}
                      />
                    }
                  />
                  <Bar dataKey="pnl" radius={5}>
                    {charts.symbolPnl.map((entry) => (
                      <Cell key={entry.symbol} fill={entry.pnl >= 0 ? themeColors.profit : themeColors.loss} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Two-column: Hourly + Direction */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trader Profile — Radar */}
          {summary && summary.traderProfile.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trader Profile</CardTitle>
                <CardDescription>Your trading style at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ChartContainer config={profileConfig} className="mx-auto aspect-square h-[280px]">
                  <RadarChart data={summary.traderProfile} cx="50%" cy="50%" outerRadius="65%">
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, item) => {
                            const d = item.payload
                            return <span>{d.metric}: {value}/100</span>
                          }}
                        />
                      }
                    />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarGrid stroke="hsl(var(--border))" />
                    <Radar
                      dataKey="value"
                      fill={themeColors.primary}
                      fillOpacity={0.2}
                      stroke={themeColors.primary}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ChartContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {summary.traderProfile.map((p) => {
                    const label = p.value >= 70 ? 'Strong' : p.value >= 40 ? 'Average' : 'Weak'
                    const color = p.value >= 70 ? themeColors.profit : p.value >= 40 ? themeColors.primary : themeColors.loss
                    return (
                      <div key={p.metric} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">{p.metric}</span>
                        <span className="font-medium" style={{ color, fontVariantNumeric: 'tabular-nums' }}>
                          {p.value} — {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Direction Split - Donut */}
          {charts && charts.direction.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Direction Split</CardTitle>
                <CardDescription>Long vs Short performance</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <ChartContainer config={directionConfig} className="h-[250px] w-full max-w-[300px]">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <span>{name}: {value} trades</span>
                          )}
                        />
                      }
                    />
                    <Pie
                      data={charts.direction}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {charts.direction.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.name === 'Long' ? themeColors.profit : themeColors.loss}
                        />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                            const totalWr = summary ? summary.winRate : 0
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 8} className="fill-foreground text-2xl font-bold">
                                  {totalWr}%
                                </tspan>
                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-muted-foreground text-xs">
                                  Win Rate
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
                {/* Legend */}
                <div className="flex flex-row sm:flex-col gap-4 sm:gap-3">
                  {charts.direction.map((d) => (
                    <div key={d.name} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          aria-hidden="true"
                          style={{ backgroundColor: d.name === 'Long' ? themeColors.profit : themeColors.loss }}
                        />
                        <span className="text-sm font-medium">{d.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {d.winRate}% WR · {d.count} trades · {formatCurrency(d.pnl, true)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Strategy Performance */}
        {charts && charts.strategyPnl.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Strategy Breakdown</CardTitle>
              <CardDescription>Which strategies are working</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={strategyConfig} className="h-[250px] w-full">
                <BarChart data={charts.strategyPnl} layout="vertical" margin={{ left: 30, right: 20 }}>
                  <CartesianGrid horizontal={false} strokeOpacity={0.1} />
                  <YAxis dataKey="strategy" type="category" width={120} tick={{ fontSize: 11 }} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, item) => {
                          const d = item.payload
                          return (
                            <span>
                              {formatCurrency(Number(value), true)} · {d.winRate}% WR · {d.count} trades
                            </span>
                          )
                        }}
                      />
                    }
                  />
                  <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                  <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                    {charts.strategyPnl.map((entry) => (
                      <Cell key={entry.strategy} fill={entry.pnl >= 0 ? themeColors.profit : themeColors.loss} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Two-column: Weekly Trend + Day of Week */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weekly Trend */}
          {charts && charts.weeklyPnl.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly P&L Trend</CardTitle>
                <CardDescription>Your performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={weeklyConfig} className="h-[200px] w-full">
                  <AreaChart data={charts.weeklyPnl} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`weeklyGradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={themeColors.primary} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={themeColors.primary} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, item) => {
                            const d = item.payload
                            return (
                              <span>
                                {formatCurrency(Number(value), true)} · {d.tradeCount} trades
                              </span>
                            )
                          }}
                        />
                      }
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                    <Area
                      type="monotone"
                      dataKey="pnl"
                      stroke={themeColors.primary}
                      strokeWidth={2}
                      fill={`url(#weeklyGradient-${gradientId})`}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Day of Week */}
          {charts && charts.dayOfWeek.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Day of Week</CardTitle>
                <CardDescription>P&L by trading day</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={hourlyConfig} className="h-[200px] w-full">
                  <BarChart data={charts.dayOfWeek} maxBarSize={24} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, item) => {
                            const d = item.payload
                            return (
                              <span>
                                {formatCurrency(Number(value), true)} · {d.winRate}% WR · {d.count} trades
                              </span>
                            )
                          }}
                        />
                      }
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {charts.dayOfWeek.map((entry) => (
                        <Cell key={entry.day} fill={entry.pnl >= 0 ? themeColors.profit : themeColors.loss} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actionable Ideas */}
        {ideas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" style={{ color: themeColors.primary }} aria-hidden="true" />
                Actionable Ideas
              </CardTitle>
              <CardDescription>Suggestions based on your trading data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ideas.map((idea) => {
                const accentColor = idea.sentiment === 'positive'
                  ? themeColors.profit
                  : idea.sentiment === 'opportunity'
                    ? '#f59e0b'
                    : themeColors.primary
                return (
                  <div
                    key={idea.id}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${accentColor}0a` }}
                  >
                    <p className="font-medium text-sm" style={{ color: accentColor }}>{idea.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                      {idea.insight}
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>

      <Footer7 {...footerConfig} />
    </div>
  )
}
