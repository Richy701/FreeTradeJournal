"use client"

import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { useDashboardPeriod, filterTradesByPeriod } from '@/contexts/dashboard-period'
import { useDemoData } from '@/hooks/use-demo-data'
import { Bar, BarChart, Cell, LabelList, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, Label, XAxis, YAxis } from "recharts"
import { ChartEmptyState } from '@/components/dashboard/chart-empty-state'
import { ChartBarHorizontal, ChartDonut } from '@phosphor-icons/react'
import { useMemo, useEffect, useState } from "react"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SegmentedControl } from '@/components/ui/segmented-control'


export function ChartRadarDefault() {
  const { themeColors } = useThemePresets()
  const { formatCurrency, getCurrencySymbol } = useSettings()
  // Compact currency for bar labels — no decimals, symbol always in front
  const fmtCompact = (n: number) => {
    const symbol = getCurrencySymbol()
    const sign = n > 0 ? '+' : n < 0 ? '-' : ''
    const formatted = Math.abs(Math.round(n)).toLocaleString('en-US')
    return `${sign}${symbol}${formatted}`
  }
  // Categorical palette from the theme (Theme Studio can override slots),
  // with profit/loss appended for symbol lists longer than the palette.
  const pairColors = useMemo(
    () => [...themeColors.palette, themeColors.profit, themeColors.loss],
    [themeColors.palette, themeColors.profit, themeColors.loss]
  )
  const { getAnalyticsTrades } = useDemoData()
  const { period } = useDashboardPeriod()
  const [refreshKey, setRefreshKey] = useState(0)
  const [symbolView, setSymbolView] = useState<'bars' | 'radar'>('bars')

  useEffect(() => {
    const handleStorageChange = () => setRefreshKey(prev => prev + 1)
    window.addEventListener('storage', handleStorageChange)

    const handleTradesUpdate = () => setRefreshKey(prev => prev + 1)
    window.addEventListener('tradesUpdated', handleTradesUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('tradesUpdated', handleTradesUpdate)
    }
  }, [])

  const { chartData, pieData, pieConfig, totalTrades, allTradesCount, symbolCount, totalPnL, bestSymbol, mostTraded } = useMemo(() => {
    const allTrades = getAnalyticsTrades().trades
    const trades = filterTradesByPeriod(allTrades, period)

    type PairRow = { pair: string; pnl: number; actualPnl: number; tradeCount: number; wins: number; winRate: number }
    const noData: PairRow = { pair: "No Data", pnl: 0, actualPnl: 0, tradeCount: 0, wins: 0, winRate: 0 }

    // Every symbol in the period. Totals, best/most-traded and the donut are
    // computed from this full list — the bars only *display* a subset.
    const pairPerformance = (trades || []).reduce((acc: Record<string, PairRow>, trade: any) => {
      const symbol = trade.symbol || 'Unknown'
      if (!acc[symbol]) {
        acc[symbol] = { pair: symbol, pnl: 0, actualPnl: 0, tradeCount: 0, wins: 0, winRate: 0 }
      }
      acc[symbol].pnl += trade.pnl || 0
      acc[symbol].actualPnl += trade.pnl || 0
      acc[symbol].tradeCount += 1
      if ((trade.pnl || 0) > 0) acc[symbol].wins += 1
      return acc
    }, {})
    const allPairs: PairRow[] = Object.values(pairPerformance)
      .map((d) => ({ ...d, winRate: d.tradeCount > 0 ? Math.round((d.wins / d.tradeCount) * 100) : 0 }))
      .sort((a, b) => b.pnl - a.pnl)

    // Bars/radar: the 8 symbols that moved the account most, in either
    // direction, so the biggest losers show up next to the biggest winners.
    const MAX_BARS = 8
    const displayed: PairRow[] = allPairs.length === 0
      ? [noData]
      : [...allPairs]
          .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
          .slice(0, MAX_BARS)
          .sort((a, b) => b.pnl - a.pnl)

    // Donut: slices by trade count, largest first. Past 8 symbols the tail is
    // folded into one "Other" slice so the legend stays readable.
    const MAX_SLICES = 8
    const byCount = [...allPairs].sort((a, b) => b.tradeCount - a.tradeCount)
    const sliceRows = byCount.length > MAX_SLICES ? byCount.slice(0, MAX_SLICES - 1) : byCount
    const otherCount = byCount.slice(sliceRows.length).reduce((sum, d) => sum + d.tradeCount, 0)
    const piePairs = sliceRows.map((d, i) => ({
      pair: d.pair,
      trades: d.tradeCount,
      fill: pairColors[i % pairColors.length],
    }))
    if (otherCount > 0) {
      piePairs.push({ pair: 'Other', trades: otherCount, fill: 'hsl(var(--muted-foreground) / 0.35)' })
    }

    const config: ChartConfig = {
      trades: { label: "Trades" },
    }
    piePairs.forEach((d) => {
      config[d.pair] = { label: d.pair, color: d.fill }
    })

    return {
      chartData: displayed,
      pieData: piePairs,
      pieConfig: config,
      totalTrades: (trades || []).length,
      allTradesCount: allTrades.length,
      symbolCount: allPairs.length,
      totalPnL: allPairs.reduce((sum, d) => sum + d.actualPnl, 0),
      bestSymbol: allPairs[0] ?? null,
      mostTraded: byCount[0] ?? null,
    }
  }, [refreshKey, getAnalyticsTrades, period])

  const barConfig = {
    actualPnl: {
      label: "P&L",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  const radarConfig = {
    winRate: {
      label: "Win rate",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  const hasData = chartData.length > 0 && chartData[0].pair !== "No Data"
  const concentration = mostTraded && totalTrades > 0
    ? Math.round((mostTraded.tradeCount / totalTrades) * 100)
    : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Symbol P&L bars */}
      <Card className="flex flex-col overflow-hidden shadow-none [container-type:inline-size]">
        <CardHeader className="pb-3">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold tracking-tight">Symbols Performance</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1.5">
                {symbolView === 'bars' ? 'P&L breakdown by symbol' : 'Win rate by symbol'}
                {hasData && symbolCount > chartData.length && ` · top ${chartData.length} of ${symbolCount}`}
              </CardDescription>
            </div>
            <SegmentedControl
              value={symbolView}
              onChange={setSymbolView}
              className="shrink-0"
              aria-label="Symbol chart layout"
              options={[
                { value: 'bars', label: 'Bars' },
                { value: 'radar', label: 'Radar' },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center min-w-0 px-4 py-3 sm:px-5 sm:py-3">
          {hasData ? (
            <div className="w-full px-1" style={{ height: symbolView === 'radar' ? 260 : Math.max(190, chartData.length * 36 + 16) }}>
              {symbolView === 'radar' ? (
              <ChartContainer config={radarConfig} className="h-full w-full aspect-auto">
                <RadarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent
                      formatter={(value, _name, item) => (
                        <span>
                          {value}% win rate · {formatCurrency(item.payload.actualPnl, true)} · {item.payload.tradeCount} trades
                        </span>
                      )}
                    />}
                  />
                  <PolarAngleAxis
                    dataKey="pair"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    dataKey="winRate"
                    fill={themeColors.primary}
                    fillOpacity={0.18}
                    stroke={themeColors.primary}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ChartContainer>
              ) : (
              // Fixed height per symbol, centered — otherwise recharts stretches a
              // handful of bars across the whole card and the gaps dwarf the bars.
              <div className="h-full flex items-center">
              <ChartContainer
                config={barConfig}
                className="w-full aspect-auto"
                style={{ height: `${Math.max(190, chartData.length * 36 + 16)}px` }}
              >
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 64, bottom: 4, left: 4 }}
                  barCategoryGap="20%"
                >
                  <XAxis type="number" dataKey="actualPnl" hide />
                  <YAxis
                    dataKey="pair"
                    type="category"
                    width={72}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent
                      formatter={(value, _name, item) => (
                        <span>
                          {formatCurrency(Number(value), true)} · {item.payload.tradeCount} trades
                        </span>
                      )}
                    />}
                  />
                  <Bar dataKey="actualPnl" radius={4} maxBarSize={18}>
                    {chartData.map((entry: any) => (
                      <Cell key={entry.pair} fill={entry.actualPnl >= 0 ? themeColors.profit : themeColors.loss} />
                    ))}
                    <LabelList
                      dataKey="actualPnl"
                      content={({ value, viewBox }) => {
                        if (!viewBox || !('x' in viewBox)) return null
                        // Negative bars extend left of zero. Keep their values to
                        // the right of zero, away from the symbol-name column.
                        const x = Number(viewBox.x ?? 0) + Math.max(Number(viewBox.width ?? 0), 0) + 8
                        const y = Number(viewBox.y ?? 0) + Number(viewBox.height ?? 0) / 2
                        return <text x={x} y={y} dominantBaseline="middle" className="fill-foreground" fontSize={11}>{fmtCompact(Number(value))}</text>
                      }}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
              </div>
              )}
            </div>
          ) : (
            <ChartEmptyState
              icon={ChartBarHorizontal}
              title="No symbol data yet"
              description="Your P&L by symbol appears after your first trade."
              hasDataOutsidePeriod={allTradesCount > 0}
            />
          )}
        </CardContent>
        {hasData && (
        <CardFooter className="border-t border-border/70 bg-muted/20 py-3 sm:py-3">
          <div className="flex w-full items-end justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Symbols</span>
              <span className="text-sm font-semibold tabular-nums">{hasData ? symbolCount : '—'}</span>
            </div>
            <div className="flex flex-col gap-0.5 text-center">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Best</span>
              <span className="text-sm font-semibold tabular-nums truncate">
                {bestSymbol ? (
                  <>
                    {bestSymbol.pair}{' '}
                    <span style={{ color: bestSymbol.actualPnl >= 0 ? themeColors.profit : themeColors.loss }}>
                      {fmtCompact(bestSymbol.actualPnl)}
                    </span>
                  </>
                ) : '—'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 text-right">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Net P&L</span>
              <span className="text-sm font-semibold tabular-nums" style={{color: totalPnL >= 0 ? themeColors.profit : themeColors.loss}}>
                {formatCurrency(totalPnL, true)}
              </span>
            </div>
          </div>
        </CardFooter>
        )}
      </Card>

      {/* Pie Chart */}
      <Card className="flex flex-col overflow-hidden shadow-none [container-type:inline-size]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold tracking-tight">Trade Distribution</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Trade count distribution across symbols
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center min-w-0 px-4 py-3 sm:px-5 sm:py-3">
          {hasData ? (
            <div className="grid w-full grid-cols-1 items-center justify-items-center gap-4 [@container(min-width:440px)]:grid-cols-[160px_minmax(0,1fr)]">
              <ChartContainer config={pieConfig} className="aspect-square h-40 w-40 shrink-0">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={pieData}
                    dataKey="trades"
                    nameKey="pair"
                    innerRadius={56}
                    outerRadius={74}
                    strokeWidth={2}
                    stroke="hsl(var(--card))"
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-2xl font-bold"
                              >
                                {totalTrades}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 20}
                                className="fill-muted-foreground text-xs"
                              >
                                Trades
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="w-full min-w-0">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-8 px-2 text-[10px]">Symbol</TableHead>
                      <TableHead className="h-8 px-2 text-right text-[10px]">Trades</TableHead>
                      <TableHead className="h-8 px-2 text-right text-[10px]">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pieData.map(entry => (
                      <TableRow key={entry.pair}>
                        <TableCell className="px-2 py-2 font-medium">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: entry.fill }} aria-hidden="true" />
                            {entry.pair}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-right tabular-nums text-muted-foreground">{entry.trades}</TableCell>
                        <TableCell className="px-2 py-2 text-right font-medium tabular-nums">
                          {totalTrades > 0 ? Math.round(entry.trades / totalTrades * 100) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <ChartEmptyState
              icon={ChartDonut}
              title="No trades to count yet"
              description="See where your trading volume goes once you log trades."
              hasDataOutsidePeriod={allTradesCount > 0}
            />
          )}
        </CardContent>
        {hasData && (
        <CardFooter className="border-t border-border/70 bg-muted/20 py-3 sm:py-3">
          <div className="flex w-full items-end justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Most traded</span>
              <span className="text-sm font-semibold tabular-nums truncate">
                {mostTraded ? `${mostTraded.pair} · ${mostTraded.tradeCount} trades` : '—'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 text-right">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Concentration</span>
              <span className="text-sm font-semibold tabular-nums">
                {mostTraded ? `${concentration}% of all trades` : '—'}
              </span>
            </div>
          </div>
        </CardFooter>
        )}
      </Card>
    </div>
  )
}
