import { EmptyState } from '@/components/empty-state'
import { useId, useMemo, useEffect, useState } from 'react'
import { trackGateHit } from '@/lib/track-activity'
import { Lightbulb, ArrowRight, ChartBar, UserCircle, ArrowsSplit, Crosshair, TrendUp, CalendarDots, Timer, Receipt } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '@/components/site-header'
import { AppFooter } from '@/components/app-footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NoticeBanner } from '@/components/notice-banner'
import { useTradeIdeas } from '@/hooks/use-trade-ideas'
import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { useUserStorage } from '@/utils/user-storage'
import { AIAnalysis } from '@/components/ai-analysis'
import { TagPerformance } from '@/components/tag-performance'
import { FREE_ANALYTICS_WINDOW_DAYS } from '@/constants/pricing'
import { trackEvent } from '@/lib/analytics'
import { niceAxis, niceAxisBoth } from '@/lib/chart-axis'
import { HOLD_TIME_BUCKETS } from '@/utils/trade-aggregates'
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
import { Progress } from '@/components/ui/progress'

export default function TradeIdeas() {
  const { ideas, charts, summary, tagStats, holdTime, costs, totalTrades, hasEnoughData, hiddenCount, rawTrades } = useTradeIdeas()
  const { themeColors, alpha, chartStyle } = useThemePresets()
  const userStorage = useUserStorage()
  const DISMISSED_KEY = 'dismissedIdeas'
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { const v = JSON.parse(userStorage.getItem(DISMISSED_KEY) || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [] } catch { return [] }
  })
  const [showAllIdeas, setShowAllIdeas] = useState(false)
  const IDEAS_VISIBLE = 3
  const visibleIdeas = ideas.filter((i) => !dismissed.includes(i.id))
  const shownIdeas = showAllIdeas ? visibleIdeas : visibleIdeas.slice(0, IDEAS_VISIBLE)
  const dismissedHere = ideas.filter((i) => dismissed.includes(i.id)).length
  const dismissIdea = (id: string) => {
    const next = [...dismissed, id]
    setDismissed(next)
    void userStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
    trackEvent('idea_dismissed', { rule: id.split(':')[0] })
  }
  const restoreIdeas = () => {
    setDismissed([])
    void userStorage.setItem(DISMISSED_KEY, '[]')
  }
  const { formatCurrency, getCurrencySymbol } = useSettings()
  // Axis ticks get a compact format (no decimals) so long values like $8,000.00
  // don't overflow recharts' fixed 60px axis width. Tooltips keep full precision.
  const formatAxisCurrency = (v: number) => {
    const symbol = getCurrencySymbol()
    const sign = v < 0 ? '-' : ''
    const formatted = Math.abs(Math.round(v)).toLocaleString('en-US')
    return `${sign}${symbol}${formatted}`
  }
  const gradientId = useId().replace(/:/g, '')

  const weeklyAxis = useMemo(() => {
    let lo = 0, hi = 0
    for (const w of charts?.weeklyPnl ?? []) { lo = Math.min(lo, w.pnl); hi = Math.max(hi, w.pnl) }
    return niceAxis(lo, hi)
  }, [charts])
  const strategyAxis = useMemo(() => {
    let lo = 0, hi = 0
    for (const st of charts?.strategyPnl ?? []) { lo = Math.min(lo, st.pnl); hi = Math.max(hi, st.pnl) }
    return niceAxisBoth(lo, hi)
  }, [charts])

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

  const holdConfig = useMemo<ChartConfig>(() => ({
    netPnl: { label: 'P&L', color: themeColors.primary },
  }), [themeColors.primary])
  const holdRows = useMemo(() => (holdTime?.buckets ?? []).map(b => ({
    ...b,
    label: HOLD_TIME_BUCKETS.find(h => h.key === b.key)?.label ?? b.key,
    winRateRounded: Math.round(b.winRate),
  })), [holdTime])
  const holdAxis = useMemo(() => {
    let lo = 0, hi = 0
    for (const b of holdRows) { lo = Math.min(lo, b.netPnl); hi = Math.max(hi, b.netPnl) }
    return niceAxisBoth(lo, hi)
  }, [holdRows])
  // Best bucket only when it has a few trades behind it; the footer says so.
  const bestHold = useMemo(() => {
    const pool = holdRows.filter(b => b.count >= 5 && b.netPnl > 0)
    return pool.length ? pool.reduce((a, b) => (b.avgPnl > a.avgPnl ? b : a)) : null
  }, [holdRows])

  // "12m", "1h 05m", "2d 3h" — same reading a trader would give out loud.
  const fmtMinutes = (mins: number | null) => {
    if (mins === null) return '—'
    if (mins < 60) return `${Math.round(mins)}m`
    if (mins < 1440) { const h = Math.floor(mins / 60); const m = Math.round(mins % 60); return m ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h` }
    const d = Math.floor(mins / 1440); const h = Math.round((mins % 1440) / 60)
    return h ? `${d}d ${h}h` : `${d}d`
  }
  const pct = (v: number) => `${Math.round(v * 100)}%`

  useEffect(() => {
    if (hiddenCount > 0) trackGateHit('analytics_window', { hidden: hiddenCount, source: 'insights' })
  }, [hiddenCount])

  const windowNotice = hiddenCount > 0 && (
    <NoticeBanner
      tone="neutral"
      icon={CalendarDots}
      title={`Insights cover your last ${FREE_ANALYTICS_WINDOW_DAYS} days`}
      description={`${hiddenCount} older ${hiddenCount === 1 ? 'trade' : 'trades'} not included. Your trade log and exports always include everything.`}
      actions={
        <Button asChild size="sm" variant="outline">
          <Link
            to="/pricing"
            onClick={() => trackEvent('pro_gate_cta_clicked', { feature: 'Full Analytics History', source: 'insights_window_notice' })}
          >
            Unlock full history <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    />
  )

  if (!hasEnoughData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <div data-insights-header className="px-4 pt-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 border-b pb-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="space-y-0.5">
                <h1 className="text-2xl font-semibold tracking-tight">Trade Insights</h1>
                <p className="text-sm text-muted-foreground">Data-driven patterns and analytics from your trading data.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {windowNotice}
          <EmptyState icon={Lightbulb} title="Build a history worth learning from" description="Trade Insights needs at least five trades in the selected range to compare your results and highlight patterns.">
            <Button asChild style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}><Link to="/trades">Go to Trade Log<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Link to="/coach" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">Meet your AI Coach</Link>
          </EmptyState>
        </div>
        <AppFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div data-insights-header className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="space-y-0.5">
              <h1 className="text-2xl font-semibold tracking-tight">Trade Insights</h1>
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
          <nav aria-label="Trade insights sections" className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild><a href="#insights-analysis">AI analysis</a></Button>
            <Button variant="outline" size="sm" asChild><a href="#insights-performance">Performance</a></Button>
            {ideas.length > 0 && <Button variant="outline" size="sm" asChild><a href="#insights-actions">Actionable ideas</a></Button>}
          </nav>
        </div>
      </div>

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {windowNotice}

        {/* AI Trade Analysis */}
        {rawTrades.length >= 3 && (
          <Card id="insights-analysis" className="scroll-mt-20 p-5 shadow-none space-y-4">
            <AIAnalysis trades={rawTrades} embedded reportDesign setupLayout="stacked" />
          </Card>
        )}

        {/* Summary Stats */}
        {summary && (
          <section id="insights-performance" className="scroll-mt-20 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5 shadow-none space-y-2">
              <p className="text-xs text-muted-foreground">Best symbol</p>
              <p className="text-xl font-semibold tracking-tight">{summary.bestSymbol}</p>
              <p className="text-sm tabular-nums" style={{ color: summary.bestSymbolPnl >= 0 ? themeColors.profit : themeColors.loss }}>{formatCurrency(summary.bestSymbolPnl, true)}</p>
            </Card>
            <Card className="p-5 shadow-none space-y-2">
              <p className="text-xs text-muted-foreground">Strongest day</p>
              <p className="text-xl font-semibold tracking-tight">{summary.bestDay}</p>
              <p className="text-sm text-muted-foreground tabular-nums">{summary.bestDayWinRate}% win rate</p>
            </Card>
            <Card className="p-5 shadow-none space-y-2">
              <p className="text-xs text-muted-foreground">Leading direction</p>
              <p className="text-xl font-semibold tracking-tight">{summary.winDirection}</p>
              <p className="text-sm text-muted-foreground tabular-nums">{summary.winDirectionWr}% win rate</p>
            </Card>
            {summary.topStrategy && summary.topStrategy !== '—' && (
              <Card className="p-5 shadow-none space-y-2">
                <p className="text-xs text-muted-foreground">Top strategy</p>
                <p className="text-xl font-semibold tracking-tight break-words">{summary.topStrategy}</p>
                <p className="text-sm text-muted-foreground tabular-nums">{summary.topStrategyWr}% win rate</p>
              </Card>
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
          </section>
        )}

        {/* Hold time + cost of trading: the two facts the P&L breakdowns below cannot show */}
        {(holdTime || costs) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {holdTime && (
              <Card data-hold-time className="min-w-0 bg-card p-5 shadow-none space-y-3 flex flex-col">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4" style={{ color: themeColors.primary }} />
                  <span className="text-base font-semibold text-foreground">Hold Time</span>
                </div>
                <p className="text-sm text-muted-foreground">How long you stay in winners versus losers</p>
                {holdTime.sampleCount < 5 ? (
                  <div className="flex-1 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Needs entry and exit times</p>
                    <p className="mt-1">
                      {holdTime.sampleCount} of {totalTrades} trades have both. Five are needed. Trades saved with the same time for entry and exit, or imported from a date-only file, do not count.
                    </p>
                  </div>
                ) : (
                <>
                <div className="divide-y divide-border/50 text-sm">
                  <div className="flex items-baseline justify-between py-2">
                    <span className="text-muted-foreground">Typical winner</span>
                    <span className="font-medium" style={{ color: themeColors.profit, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtMinutes(holdTime.medianWinMinutes)}
                      <span className="text-xs text-muted-foreground font-normal"> · {holdTime.winCount} trades</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between py-2">
                    <span className="text-muted-foreground">Typical loser</span>
                    <span className="font-medium" style={{ color: themeColors.loss, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtMinutes(holdTime.medianLossMinutes)}
                      <span className="text-xs text-muted-foreground font-normal"> · {holdTime.lossCount} trades</span>
                    </span>
                  </div>
                </div>
                <ChartContainer config={holdConfig} className="min-h-[220px] flex-1 aspect-auto w-full">
                  <BarChart data={holdRows} maxBarSize={28} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    {chartStyle.grid && <CartesianGrid vertical={false} strokeOpacity={0.1} />}
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
                    <YAxis tick={{ fontSize: 11 }} domain={holdAxis.domain} ticks={holdAxis.ticks} tickFormatter={(v) => formatAxisCurrency(v)} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, item) => {
                            const d = item.payload
                            return (
                              <span>
                                {formatCurrency(Number(value), true)} · {d.winRateRounded}% WR · {d.count} trades
                              </span>
                            )
                          }}
                        />
                      }
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                    <Bar dataKey="netPnl" radius={[4, 4, 0, 0]}>
                      {holdRows.map((entry) => (
                        <Cell key={entry.key} fill={entry.netPnl >= 0 ? themeColors.profit : themeColors.loss} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
                <p className="text-xs text-muted-foreground">
                  {holdTime.medianWinMinutes !== null && holdTime.medianLossMinutes !== null && holdTime.medianLossMinutes > holdTime.medianWinMinutes * 1.5
                    ? 'You hold losers longer than winners. Cutting the losers at the winners\' pace is usually the cheapest fix there is.'
                    : bestHold
                      ? `Your best results come from trades held ${bestHold.label.toLowerCase()}: ${formatCurrency(bestHold.avgPnl, true)} per trade over ${bestHold.count} trades.`
                      : `Based on ${holdTime.sampleCount} trades with entry and exit times.`}
                </p>
                </>
                )}
              </Card>
            )}

            {costs && (
              <Card className="min-w-0 bg-card p-5 shadow-none space-y-3 flex flex-col">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" style={{ color: themeColors.primary }} />
                  <span className="text-base font-semibold text-foreground">Cost of Trading</span>
                </div>
                <p className="text-sm text-muted-foreground">Commissions, fees and swap against your results</p>
                {costs.tradesWithCosts === 0 ? (
                  <div className="flex-1 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">No costs recorded yet</p>
                    <p className="mt-1">
                      None of your {totalTrades} trades carry a commission, fee or swap. Add them in the trade form, or import a broker file that has a fees column, and this fills in.
                    </p>
                  </div>
                ) : (
                <>
                <div className="divide-y divide-border/50 text-sm">
                  <div className="flex items-baseline justify-between py-2">
                    <span className="text-muted-foreground">Before costs</span>
                    <span className="font-medium" style={{ color: costs.grossPnl >= 0 ? themeColors.profit : themeColors.loss, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(costs.grossPnl, true)}</span>
                  </div>
                  <div className="flex items-baseline justify-between py-2">
                    <span className="text-muted-foreground">Costs</span>
                    <span className="font-medium" style={{ color: themeColors.loss, fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(-costs.costs, true)}
                      <span className="text-xs text-muted-foreground font-normal"> · {formatCurrency(costs.costPerTrade, false)} per trade</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between py-2">
                    <span className="text-foreground font-medium">Net result</span>
                    <span className="font-semibold" style={{ color: costs.netPnl >= 0 ? themeColors.profit : themeColors.loss, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(costs.netPnl, true)}</span>
                  </div>
                </div>
                {costs.perSymbol.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground pt-1">Where the costs go</p>
                    <div className="divide-y divide-border/50 text-sm">
                      {costs.perSymbol.slice(0, 5).map(sc => (
                        <div key={sc.symbol} className="flex items-baseline justify-between py-1.5">
                          <span className="text-muted-foreground">{sc.symbol}<span className="text-xs"> · {sc.count} {sc.count === 1 ? 'trade' : 'trades'}</span></span>
                          <span className="font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatCurrency(sc.costs, false)}
                            <span className="text-xs text-muted-foreground font-normal"> · {formatCurrency(sc.costPerTrade, false)} each</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-auto space-y-1.5 text-xs text-muted-foreground">
                  {costs.shareOfGrossProfit !== null && (
                    <p>Costs took <span className="font-medium text-foreground">{pct(costs.shareOfGrossProfit)}</span> of what your trades made before the broker's cut.</p>
                  )}
                  {costs.shareOfNetLoss !== null && (
                    <p>Costs are <span className="font-medium text-foreground">{pct(costs.shareOfNetLoss)}</span> of your net loss. Without them the result would be {formatCurrency(costs.grossPnl, true)}.</p>
                  )}
                  {costs.flippedByCosts > 0 && (
                    <p><span className="font-medium text-foreground">{costs.flippedByCosts}</span> {costs.flippedByCosts === 1 ? 'trade' : 'trades'} made money before costs and lost after them.</p>
                  )}
                  {costs.tradesWithCosts < costs.tradeCount && (
                    <p>{costs.tradeCount - costs.tradesWithCosts} of {costs.tradeCount} trades recorded no costs, so the real figure is higher.</p>
                  )}
                </div>
                </>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Symbol Performance Chart */}
        {charts != null && charts.symbolPnl.length > 0 && (
          <Card className="min-w-0 bg-card p-5 shadow-none space-y-3">
            <div className="flex items-center gap-2">
              <ChartBar className="h-4 w-4" style={{ color: themeColors.primary }} />
              <span className="text-base font-semibold text-foreground">Symbol Performance</span>
            </div>
            <p className="text-sm text-muted-foreground">P&L breakdown by instrument</p>
            {/* One row per symbol: a fixed height thins the labels once the
                list passes ~10, and an unlabelled bar is useless here. */}
            <ChartContainer config={symbolConfig} className="w-full" style={{ height: Math.max(160, charts.symbolPnl.length * 26 + 16) }}>
                <BarChart
                  accessibilityLayer
                  data={charts.symbolPnl}
                  layout="vertical"
                  margin={{ left: 0, right: 8 }}
                >
                  <XAxis type="number" dataKey="pnl" hide domain={['dataMin', 'dataMax']} />
                  <YAxis
                    dataKey="symbol"
                    type="category"
                    width={72}
                    interval={0}
                    tickLine={false}
                    tickMargin={8}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
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
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trader Profile — Radar */}
          {summary != null && summary.traderProfile.length > 0 && (
            <Card className="min-w-0 bg-card p-5 shadow-none space-y-3 flex flex-col">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" style={{ color: themeColors.primary }} />
                <span className="text-base font-semibold text-foreground">Trader Profile</span>
              </div>
              <p className="text-sm text-muted-foreground">Your trading style at a glance</p>
              <div className="flex flex-1 flex-col items-center gap-6">
                <ChartContainer config={profileConfig} className="mx-auto aspect-square h-[260px]">
                  <RadarChart data={summary.traderProfile} cx="50%" cy="50%" outerRadius="58%">
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
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                          <span className="text-xs text-muted-foreground">{p.metric}</span>
                          <span className="text-xs font-semibold" style={{ color, fontVariantNumeric: 'tabular-nums' }}>{label}</span>
                        </div>
                        <Progress className="h-1.5 bg-muted/60" value={p.value} indicatorColor={color} />
                        <p className="text-right text-[11px] font-medium text-muted-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>{p.value}/100</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Direction Split - Donut */}
          {charts != null && charts.direction.length > 0 && (
            <Card className="min-w-0 bg-card p-5 shadow-none space-y-3 flex flex-col">
              <div className="flex items-center gap-2">
                <ArrowsSplit className="h-4 w-4" style={{ color: themeColors.primary }} />
                <span className="text-base font-semibold text-foreground">Direction Split</span>
              </div>
              <p className="text-sm text-muted-foreground">Long vs Short performance</p>
              <div className="flex flex-1 flex-col items-center gap-6">
                <div className="flex flex-1 items-center">
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
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
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
                          <Progress className="h-1.5 bg-muted/60" value={d.winRate} indicatorColor={color} />
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
            </Card>
          )}
        </div>

        {charts != null && charts.strategyPnl.length > 0 && (
          <Card className="min-w-0 bg-card p-5 shadow-none space-y-3">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4" style={{ color: themeColors.primary }} />
              <span className="text-base font-semibold text-foreground">Strategy Breakdown</span>
            </div>
            <p className="text-sm text-muted-foreground">Which strategies are working</p>
              <ChartContainer config={strategyConfig} className="h-[250px] w-full">
                <BarChart data={charts.strategyPnl} layout="vertical" margin={{ left: 30, right: 20 }}>
                  {chartStyle.grid && <CartesianGrid horizontal={false} strokeOpacity={0.1} />}
                  <YAxis dataKey="strategy" type="category" width={120} tick={{ fontSize: 11 }} />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={strategyAxis.domain} ticks={strategyAxis.ticks} tickFormatter={(v) => formatAxisCurrency(v)} />
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
          </Card>
        )}

        {tagStats != null && (
          <TagPerformance
            perTag={tagStats.perTag}
            perMistake={tagStats.perMistake}
            mistakeImpact={tagStats.mistakeImpact}
            significanceThreshold={tagStats.significanceThreshold}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {charts != null && charts.weeklyPnl.length > 1 && (
            <Card className="min-w-0 bg-card p-5 shadow-none space-y-3">
              <div className="flex items-center gap-2">
                <TrendUp className="h-4 w-4" style={{ color: themeColors.primary }} />
                <span className="text-base font-semibold text-foreground">Weekly P&L Trend</span>
              </div>
              <p className="text-sm text-muted-foreground">Your performance over time</p>
                <ChartContainer config={weeklyConfig} className="h-[200px] w-full">
                  <AreaChart data={charts.weeklyPnl} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`weeklyGradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={themeColors.primary} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={themeColors.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {chartStyle.grid && <CartesianGrid vertical={false} strokeOpacity={0.1} />}
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={weeklyAxis.domain} ticks={weeklyAxis.ticks} tickFormatter={(v) => formatAxisCurrency(v)} />
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
                    {/* Follows Settings > Appearance > Chart style. The smooth
                        option is monotone, so it never overshoots a week's
                        real value between points. */}
                    <Area
                      type={chartStyle.curveType}
                      dataKey="pnl"
                      stroke={themeColors.primary}
                      strokeWidth={1.5}
                      dot={chartStyle.points === 'trade' ? { r: 3, fill: themeColors.primary, strokeWidth: 0 } : false}
                      activeDot={{ r: 4, fill: themeColors.primary, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                      fill={`url(#weeklyGradient-${gradientId})`}
                      fillOpacity={chartStyle.fill ? 1 : 0}
                    />
                  </AreaChart>
                </ChartContainer>
            </Card>
          )}

          {charts != null && charts.dayOfWeek.length > 0 && (
            <Card className="min-w-0 bg-card p-5 shadow-none space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDots className="h-4 w-4" style={{ color: themeColors.primary }} />
                <span className="text-base font-semibold text-foreground">Day of Week</span>
              </div>
              <p className="text-sm text-muted-foreground">P&L by trading day</p>
                <ChartContainer config={hourlyConfig} className="h-[200px] w-full">
                  <BarChart data={charts.dayOfWeek} maxBarSize={24} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    {chartStyle.grid && <CartesianGrid vertical={false} strokeOpacity={0.1} />}
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
            </Card>
          )}
        </div>

        {ideas.length > 0 && (
          <Card id="insights-actions" className="scroll-mt-20 min-w-0 bg-card p-5 shadow-none space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" style={{ color: themeColors.primary }} aria-hidden="true" />
              <span className="text-base font-semibold text-foreground">Actionable Ideas</span>
            </div>
            <p className="text-sm text-muted-foreground">
              What is costing you, biggest first, with one change each. Figures cover {hiddenCount > 0 ? `your last ${FREE_ANALYTICS_WINDOW_DAYS} days` : 'all your trades'}.
            </p>
            {visibleIdeas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nothing left to show.{' '}
                <button type="button" className="underline underline-offset-4 hover:text-foreground" onClick={restoreIdeas}>Bring back the {dismissedHere} you set aside</button>.
              </p>
            ) : (
              <div className="divide-y divide-border/50">
                {shownIdeas.map((idea) => (
                  <div key={idea.id} className="py-4 flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground">{idea.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{idea.evidence}</p>
                      <p className="text-sm text-foreground leading-relaxed">{idea.action}</p>
                    </div>
                    <div className="shrink-0 text-right space-y-1.5">
                      <p className="text-sm font-semibold" style={{ color: themeColors.loss, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(idea.impact, false)}</p>
                      <p className="text-[11px] text-muted-foreground">at stake</p>
                      <button
                        type="button"
                        className="text-[11px] text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
                        onClick={() => dismissIdea(idea.id)}
                      >
                        Not relevant
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(visibleIdeas.length > IDEAS_VISIBLE || dismissedHere > 0) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                {visibleIdeas.length > IDEAS_VISIBLE && (
                  <button type="button" className="underline underline-offset-4 hover:text-foreground" onClick={() => setShowAllIdeas((v) => !v)}>
                    {showAllIdeas ? 'Show fewer' : `Show ${visibleIdeas.length - IDEAS_VISIBLE} more`}
                  </button>
                )}
                {dismissedHere > 0 && visibleIdeas.length > 0 && (
                  <button type="button" className="underline underline-offset-4 hover:text-foreground" onClick={restoreIdeas}>
                    Bring back {dismissedHere} set aside
                  </button>
                )}
              </div>
            )}
          </Card>
        )}
      </div>

      <AppFooter />
    </div>
  )
}
