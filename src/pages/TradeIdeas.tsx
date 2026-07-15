import { useId, useMemo } from 'react'
import { Lightbulb, ArrowRight, ChartBar, UserCircle, ArrowsSplit, Crosshair, TrendUp, CalendarDots } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { AppFooter } from '@/components/app-footer'
import { Button } from '@/components/ui/button'
import { useTradeIdeas } from '@/hooks/use-trade-ideas'
import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { AIAnalysis } from '@/components/ai-analysis'
import { FREE_ANALYTICS_WINDOW_DAYS } from '@/constants/pricing'
import { trackEvent } from '@/lib/analytics'
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
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

export default function TradeIdeas() {
  const { ideas, charts, summary, totalTrades, hasEnoughData, hiddenCount, rawTrades } = useTradeIdeas()
  const { themeColors, alpha } = useThemePresets()
  const { formatCurrency, getCurrencySymbol } = useSettings()
  // Axis ticks get a compact format (no decimals) so long values like $8,000.00
  // don't overflow recharts' fixed 60px axis width. Tooltips keep full precision.
  const formatAxisCurrency = (v: number) => {
    const symbol = getCurrencySymbol()
    const sign = v < 0 ? '-' : ''
    const formatted = Math.abs(Math.round(v)).toLocaleString('en-US')
    return symbol === '€' ? `${sign}${formatted}${symbol}` : `${sign}${symbol}${formatted}`
  }
  const gradientId = useId().replace(/:/g, '')

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

  const windowNotice = hiddenCount > 0 && (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
      <p className="text-xs text-muted-foreground">
        Insights cover your last {FREE_ANALYTICS_WINDOW_DAYS} days ({hiddenCount} older {hiddenCount === 1 ? 'trade' : 'trades'} not included). Your trade log and exports always include everything.
      </p>
      <Link
        to="/pricing"
        className="text-xs font-semibold hover:underline"
        style={{ color: themeColors.primary }}
        onClick={() => trackEvent('pro_gate_cta_clicked', { feature: 'Full Analytics History', source: 'insights_window_notice' })}
      >
        Unlock full history with Pro
      </Link>
    </div>
  )

  if (!hasEnoughData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <div className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
                <Lightbulb className="h-5 w-5" style={{ color: themeColors.primary }} />
              </div>
              <div className="space-y-0.5">
                <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>Trade Insights</h1>
                <p className="text-sm text-muted-foreground">Data-driven patterns and analytics from your trading data.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {windowNotice}
          <div className="rounded-xl border border-dashed bg-card/50 flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="p-4 rounded-2xl" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
              <Lightbulb className="h-8 w-8" style={{ color: themeColors.primary }} aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Not Enough Data Yet</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Log at least 5 trades to unlock data-driven trade insights.
              </p>
            </div>
            <Button asChild className="mt-2" style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>
              <Link to="/trades">
                Log Trades <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Link to="/coach" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
              Or meet your AI Coach
            </Link>
          </div>
        </div>
        <AppFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
              <Lightbulb className="h-5 w-5" style={{ color: themeColors.primary }} />
            </div>
            <div className="space-y-0.5">
              <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>Trade Insights</h1>
              <p className="text-sm text-muted-foreground">
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

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {windowNotice}

        {/* AI Trade Analysis */}
        {rawTrades.length >= 3 && <AIAnalysis trades={rawTrades} />}

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
        {charts != null && charts.symbolPnl.length > 0 && (
          <div className="rounded-xl border bg-card/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ChartBar className="h-4 w-4" style={{ color: themeColors.primary }} />
              <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Symbol Performance</span>
            </div>
            <p className="text-sm text-muted-foreground">P&L breakdown by instrument</p>
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
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trader Profile — Radar */}
          {summary != null && summary.traderProfile.length > 0 && (
            <div className="rounded-xl border bg-card/50 p-4 space-y-3 flex flex-col">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" style={{ color: themeColors.primary }} />
                <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Trader Profile</span>
              </div>
              <p className="text-sm text-muted-foreground">Your trading style at a glance</p>
              <div className="flex flex-1 flex-col items-center gap-6">
                <ChartContainer config={profileConfig} className="mx-auto aspect-square h-[220px]">
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
                <div className="grid grid-cols-2 gap-3 w-full mt-auto">
                  {summary.traderProfile.map((p) => {
                    const label = p.value >= 70 ? 'Strong' : p.value >= 40 ? 'Average' : 'Weak'
                    const color = p.value >= 70 ? themeColors.profit : p.value >= 40 ? themeColors.primary : themeColors.loss
                    return (
                      <div key={p.metric} className="rounded-lg border p-2.5 space-y-1.5" style={{ borderColor: `${color}20` }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{p.metric}</span>
                          <span className="text-xs font-semibold" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{label}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-muted/60">
                          <div className="h-full rounded-full" style={{ width: `${p.value}%`, backgroundColor: color }} />
                        </div>
                        <p className="text-right text-[11px] font-medium text-muted-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>{p.value}/100</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Direction Split - Donut */}
          {charts != null && charts.direction.length > 0 && (
            <div className="rounded-xl border bg-card/50 p-4 space-y-3 flex flex-col">
              <div className="flex items-center gap-2">
                <ArrowsSplit className="h-4 w-4" style={{ color: themeColors.primary }} />
                <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Direction Split</span>
              </div>
              <p className="text-sm text-muted-foreground">Long vs Short performance</p>
              <div className="flex flex-1 flex-col items-center gap-6">
                <ChartContainer config={directionConfig} className="h-[200px] w-full max-w-[240px]">
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
                      innerRadius={55}
                      outerRadius={80}
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
                <div className="grid grid-cols-2 gap-3 w-full mt-auto">
                  {charts.direction.map((d) => {
                    const color = d.name === 'Long' ? themeColors.profit : themeColors.loss
                    return (
                      <div key={d.name} className="rounded-lg border p-3 space-y-2.5" style={{ borderColor: `${color}20` }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-sm font-semibold">{d.name}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Win Rate</span>
                            <span className="font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{d.winRate}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden bg-muted/60">
                            <div className="h-full rounded-full" style={{ width: `${d.winRate}%`, backgroundColor: color }} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          <div>
                            <p className="text-muted-foreground">Trades</p>
                            <p className="font-medium">{d.count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">P&L</p>
                            <p className="font-medium" style={{ color: d.pnl >= 0 ? themeColors.profit : themeColors.loss }}>{formatCurrency(d.pnl, true)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Wins</p>
                            <p className="font-medium">{d.wins}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Losses</p>
                            <p className="font-medium">{d.losses}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {charts != null && charts.strategyPnl.length > 0 && (
          <div className="rounded-xl border bg-card/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4" style={{ color: themeColors.primary }} />
              <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Strategy Breakdown</span>
            </div>
            <p className="text-sm text-muted-foreground">Which strategies are working</p>
              <ChartContainer config={strategyConfig} className="h-[250px] w-full">
                <BarChart data={charts.strategyPnl} layout="vertical" margin={{ left: 30, right: 20 }}>
                  <CartesianGrid horizontal={false} strokeOpacity={0.1} />
                  <YAxis dataKey="strategy" type="category" width={120} tick={{ fontSize: 11 }} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatAxisCurrency(v)} />
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
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts != null && charts.weeklyPnl.length > 1 && (
            <div className="rounded-xl border bg-card/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendUp className="h-4 w-4" style={{ color: themeColors.primary }} />
                <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Weekly P&L Trend</span>
              </div>
              <p className="text-sm text-muted-foreground">Your performance over time</p>
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
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatAxisCurrency(v)} />
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
            </div>
          )}

          {charts != null && charts.dayOfWeek.length > 0 && (
            <div className="rounded-xl border bg-card/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDots className="h-4 w-4" style={{ color: themeColors.primary }} />
                <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Day of Week</span>
              </div>
              <p className="text-sm text-muted-foreground">P&L by trading day</p>
                <ChartContainer config={hourlyConfig} className="h-[200px] w-full">
                  <BarChart data={charts.dayOfWeek} maxBarSize={24} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatAxisCurrency(v)} />
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
            </div>
          )}
        </div>

        {ideas.length > 0 && (
          <div className="rounded-xl border bg-card/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" style={{ color: themeColors.primary }} aria-hidden="true" />
              <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Actionable Ideas</span>
            </div>
            <p className="text-sm text-muted-foreground">Suggestions based on your trading data</p>
            <div className="space-y-3">
              {ideas.map((idea) => {
                const accentColor = idea.sentiment === 'positive'
                  ? themeColors.profit
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
                    {idea.nextStep && (
                      <p className="text-xs mt-1.5 font-medium" style={{ color: accentColor, opacity: 0.85 }}>
                        Next step: {idea.nextStep}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  )
}
