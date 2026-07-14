"use client"

import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { useDashboardPeriod, filterTradesByPeriod } from '@/contexts/dashboard-period'
import { useDemoData } from '@/hooks/use-demo-data'
import { Bar, BarChart, Cell, LabelList, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, Sector, Label, XAxis, YAxis } from "recharts"
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

function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

// Lightness curve modelled on Tailwind 500-level colors — each hue needs a
// different lightness to look equally vibrant (yellow needs ~48%, blue ~60%, etc.)
const LIGHTNESS_STOPS: [number, number][] = [
  [0, 60], [25, 53], [38, 50], [48, 47], [84, 44], [142, 45],
  [160, 39], [173, 40], [189, 43], [199, 48], [217, 60],
  [239, 67], [258, 66], [271, 65], [292, 61], [330, 60], [347, 50], [360, 60],
]

function vibrantLightness(hue: number): number {
  const h = ((hue % 360) + 360) % 360
  for (let i = 0; i < LIGHTNESS_STOPS.length - 1; i++) {
    if (h >= LIGHTNESS_STOPS[i][0] && h <= LIGHTNESS_STOPS[i + 1][0]) {
      const t = (h - LIGHTNESS_STOPS[i][0]) / (LIGHTNESS_STOPS[i + 1][0] - LIGHTNESS_STOPS[i][0])
      return Math.round(LIGHTNESS_STOPS[i][1] + t * (LIGHTNESS_STOPS[i + 1][1] - LIGHTNESS_STOPS[i][1]))
    }
  }
  return 55
}

function generatePairColors(primary: string, profit: string, loss: string): string[] {
  const [h] = hexToHSL(primary)
  const hues = [h, (h + 55) % 360, (h + 110) % 360, (h + 165) % 360, (h + 220) % 360, (h + 275) % 360]
  return [
    ...hues.map(hue => `hsl(${hue}, 88%, ${vibrantLightness(hue)}%)`),
    profit,
    loss,
  ]
}

export function ChartRadarDefault() {
  const { themeColors } = useThemePresets()
  const { formatCurrency, getCurrencySymbol } = useSettings()
  // Compact currency for bar labels — no decimals, EUR keeps its suffix position
  const fmtCompact = (n: number) => {
    const symbol = getCurrencySymbol()
    const sign = n > 0 ? '+' : n < 0 ? '-' : ''
    const formatted = Math.abs(Math.round(n)).toLocaleString('en-US')
    return symbol === '€' ? `${sign}${formatted}${symbol}` : `${sign}${symbol}${formatted}`
  }
  const pairColors = useMemo(
    () => generatePairColors(themeColors.primary, themeColors.profit, themeColors.loss),
    [themeColors.primary, themeColors.profit, themeColors.loss]
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

  const { chartData, rawData, pieData, pieConfig, totalTrades, allTradesCount } = useMemo(() => {
    const allTrades = getAnalyticsTrades().trades
    const trades = filterTradesByPeriod(allTrades, period)

    let rawPairData: any[]
    if (!trades || trades.length === 0) {
      rawPairData = [{ pair: "No Data", pnl: 0, actualPnl: 0, tradeCount: 0, wins: 0, winRate: 0 }]
    } else {
      const pairPerformance = trades.reduce((acc: any, trade: any) => {
        const symbol = trade.symbol || 'Unknown'
        if (!acc[symbol]) {
          acc[symbol] = { pair: symbol, pnl: 0, actualPnl: 0, tradeCount: 0, wins: 0 }
        }
        acc[symbol].pnl += trade.pnl || 0
        acc[symbol].actualPnl += trade.pnl || 0
        acc[symbol].tradeCount += 1
        if ((trade.pnl || 0) > 0) acc[symbol].wins += 1
        return acc
      }, {})

      rawPairData = Object.values(pairPerformance)
        .sort((a: any, b: any) => b.pnl - a.pnl)
        .slice(0, 8)
        .map((d: any) => ({ ...d, winRate: d.tradeCount > 0 ? Math.round((d.wins / d.tradeCount) * 100) : 0 }))

      if (rawPairData.length === 0) {
        rawPairData = [{ pair: "No Data", pnl: 0, actualPnl: 0, tradeCount: 0, wins: 0, winRate: 0 }]
      }
    }

    const total = rawPairData.reduce((sum: number, d: any) => sum + d.tradeCount, 0)
    // Slices and legend sort by share (largest first) — colors are assigned
    // before sorting so each symbol keeps a stable color.
    const piePairs = rawPairData.map((d: any, i: number) => ({
      pair: d.pair,
      trades: d.tradeCount,
      fill: pairColors[i % pairColors.length],
    })).sort((a: any, b: any) => b.trades - a.trades)

    const config: ChartConfig = {
      trades: { label: "Trades" },
    }
    rawPairData.forEach((d: any, i: number) => {
      config[d.pair] = {
        label: d.pair,
        color: pairColors[i % pairColors.length],
      }
    })

    return {
      chartData: rawPairData,
      rawData: rawPairData,
      pieData: piePairs,
      pieConfig: config,
      totalTrades: total,
      allTradesCount: allTrades.length,
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

  const totalPnL = rawData.reduce((sum: number, item: any) => sum + item.actualPnl, 0)
  const hasData = chartData.length > 0 && chartData[0].pair !== "No Data"
  // rawData is sorted by P&L descending, so the best symbol is first
  const bestSymbol = hasData ? rawData[0] : null
  const mostTraded = hasData
    ? rawData.reduce((max: any, d: any) => (d.tradeCount > max.tradeCount ? d : max), rawData[0])
    : null
  const concentration = mostTraded && totalTrades > 0
    ? Math.round((mostTraded.tradeCount / totalTrades) * 100)
    : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
      {/* Symbol P&L bars */}
      <Card className="h-[450px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold tracking-tight">Symbols Performance</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1.5">
                {symbolView === 'bars' ? 'P&L breakdown by symbol' : 'Win rate by symbol'}
              </CardDescription>
            </div>
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setSymbolView('bars')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  symbolView === 'bars'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={symbolView === 'bars'}
              >
                Bars
              </button>
              <button
                onClick={() => setSymbolView('radar')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  symbolView === 'radar'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={symbolView === 'radar'}
              >
                Radar
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 px-4 py-2">
          {hasData ? (
            <div className="h-full px-1 sm:px-2">
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
                    fillOpacity={0.6}
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
                style={{ height: `${Math.min(chartData.length * 56, 300)}px` }}
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
                  <Bar dataKey="actualPnl" radius={4} maxBarSize={28}>
                    {chartData.map((entry: any) => (
                      <Cell key={entry.pair} fill={entry.actualPnl >= 0 ? themeColors.profit : themeColors.loss} />
                    ))}
                    <LabelList
                      dataKey="actualPnl"
                      position="right"
                      offset={8}
                      formatter={(v: number) => fmtCompact(v)}
                      className="fill-foreground"
                      fontSize={11}
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
        <CardFooter className="border-t border-border/70 py-3 sm:py-3">
          <div className="flex w-full items-end justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Symbols</span>
              <span className="text-sm font-semibold tabular-nums">{hasData ? chartData.length : '—'}</span>
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
      <Card className="h-[450px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold tracking-tight">Trade Distribution</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Trade count distribution across symbols
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 px-4 py-2">
          {hasData ? (
            <div className="h-full flex items-center justify-center gap-4 sm:gap-8">
              <ChartContainer config={pieConfig} className="h-full aspect-square">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={pieData}
                    dataKey="trades"
                    nameKey="pair"
                    innerRadius={60}
                    strokeWidth={2}
                    stroke="hsl(var(--card))"
                    activeIndex={0}
                    activeShape={(props: any) => (
                      <Sector {...props} outerRadius={(props.outerRadius || 0) + 8} />
                    )}
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
              <div className="shrink-0 space-y-2.5 max-w-[45%]">
                {pieData.map((entry: any) => (
                  <div key={entry.pair} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-[2px] shrink-0" style={{ backgroundColor: entry.fill }} />
                      <span className="text-foreground font-medium truncate">{entry.pair}</span>
                      <span className="text-foreground font-semibold tabular-nums">
                        {totalTrades > 0 ? Math.round((entry.trades / totalTrades) * 100) : 0}%
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5 pl-[18px]">
                      {entry.trades} {entry.trades === 1 ? 'trade' : 'trades'}
                    </p>
                  </div>
                ))}
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
        <CardFooter className="border-t border-border/70 py-3 sm:py-3">
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
