"use client"

import { useThemePresets } from '@/contexts/theme-presets'
import { useDemoData } from '@/hooks/use-demo-data'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Pie, PieChart, Sector, Label } from "recharts"
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
  const pairColors = useMemo(
    () => generatePairColors(themeColors.primary, themeColors.profit, themeColors.loss),
    [themeColors.primary, themeColors.profit, themeColors.loss]
  )
  const { getTrades } = useDemoData()
  const [refreshKey, setRefreshKey] = useState(0)

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

  const { chartData, rawData, pieData, pieConfig, totalTrades } = useMemo(() => {
    const trades = getTrades()

    let rawPairData: any[]
    if (!trades || trades.length === 0) {
      rawPairData = [{ pair: "No Data", pnl: 0, actualPnl: 0, tradeCount: 0 }]
    } else {
      const pairPerformance = trades.reduce((acc: any, trade: any) => {
        const symbol = trade.symbol || 'Unknown'
        if (!acc[symbol]) {
          acc[symbol] = { pair: symbol, pnl: 0, actualPnl: 0, tradeCount: 0 }
        }
        acc[symbol].pnl += trade.pnl || 0
        acc[symbol].actualPnl += trade.pnl || 0
        acc[symbol].tradeCount += 1
        return acc
      }, {})

      rawPairData = Object.values(pairPerformance)
        .sort((a: any, b: any) => b.pnl - a.pnl)
        .slice(0, 8)

      if (rawPairData.length === 0) {
        rawPairData = [{ pair: "No Data", pnl: 0, actualPnl: 0, tradeCount: 0 }]
      }
    }

    const allPnls = rawPairData.map((d: any) => d.pnl)
    const minPnl = Math.min(...allPnls)
    const maxPnl = Math.max(...allPnls)

    const normalizedData = rawPairData.map((item: any) => ({
      ...item,
      score: item.pnl < 0
        ? Math.max(0, 25 + (item.pnl / Math.abs(minPnl)) * 25)
        : 50 + (item.pnl / (maxPnl || 1)) * 50
    }))

    const total = rawPairData.reduce((sum: number, d: any) => sum + d.tradeCount, 0)
    const piePairs = rawPairData.map((d: any, i: number) => ({
      pair: d.pair,
      trades: d.tradeCount,
      fill: pairColors[i % pairColors.length],
    }))

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
      chartData: normalizedData,
      rawData: rawPairData,
      pieData: piePairs,
      pieConfig: config,
      totalTrades: total,
    }
  }, [refreshKey, getTrades])

  const radarConfig = {
    score: {
      label: "Performance",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  const totalPnL = rawData.reduce((sum: number, item: any) => sum + item.actualPnl, 0)
  const hasData = chartData.length > 0 && chartData[0].pair !== "No Data"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
      {/* Radar Chart */}
      <Card className="h-[450px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Pairs Performance</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            P&L breakdown by currency pairs and instruments
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 px-4 py-2">
          {hasData ? (
            <div className="h-full">
              <ChartContainer config={radarConfig} className="h-full w-full aspect-auto">
                <RadarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent
                      formatter={(value, name) => {
                        const item = chartData.find((d: any) => d.pair === name)
                        return item ? `$${item.actualPnl.toFixed(2)}` : value
                      }}
                    />}
                  />
                  <PolarAngleAxis
                    dataKey="pair"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <Radar
                    dataKey="score"
                    fill={themeColors.primary}
                    fillOpacity={0.6}
                    stroke={themeColors.primary}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No trading data available. Start trading to see your pairs performance!
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-border/50 py-3">
          <div className="flex w-full items-center justify-between text-sm">
            <span className="text-muted-foreground">{chartData.length} pairs tracked</span>
            <span className="font-semibold" style={{color: totalPnL >= 0 ? themeColors.profit : themeColors.loss}}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </span>
          </div>
        </CardFooter>
      </Card>

      {/* Pie Chart */}
      <Card className="h-[450px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Trade Distribution</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            Trade count distribution across pairs
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 px-4 py-2">
          {hasData ? (
            <div className="h-full">
              <ChartContainer config={pieConfig} className="h-full w-full aspect-auto">
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
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No trading data available. Start trading to see distribution!
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-border/50 py-3">
          <div className="flex w-full items-center justify-between text-sm">
            <span className="text-muted-foreground">{chartData.length} pairs traded</span>
            <span className="font-semibold">{totalTrades} trades</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
