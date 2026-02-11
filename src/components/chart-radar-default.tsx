"use client"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartLine } from '@fortawesome/free-solid-svg-icons'
import { useThemePresets } from '@/contexts/theme-presets'
import { useDemoData } from '@/hooks/use-demo-data'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
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

export const description = "Trading Performance Radar"

const chartConfig = {
  score: {
    label: "Performance",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function ChartRadarDefault() {
  const { themeColors } = useThemePresets()
  const { getTrades } = useDemoData()
  const [refreshKey, setRefreshKey] = useState(0)

  // Listen for storage changes to refresh chart when trades are updated
  useEffect(() => {
    const handleStorageChange = () => setRefreshKey(prev => prev + 1)
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events when trades are added/updated
    const handleTradesUpdate = () => setRefreshKey(prev => prev + 1)
    window.addEventListener('tradesUpdated', handleTradesUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('tradesUpdated', handleTradesUpdate)
    }
  }, [])

  // Generate trading pairs performance data based on actual trades
  const { chartData, rawData } = useMemo(() => {
    const trades = getTrades()

    let rawPairData;
    if (!trades || trades.length === 0) {
      rawPairData = [{ pair: "No Data", pnl: 0, actualPnl: 0 }]
    } else {
      // Group trades by symbol/pair and calculate total P&L for each
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

      // Convert to array and sort by P&L
      rawPairData = Object.values(pairPerformance)
        .sort((a: any, b: any) => b.pnl - a.pnl)
        .slice(0, 8) // Show top 8 pairs

      if (rawPairData.length === 0) {
        rawPairData = [{ pair: "No Data", pnl: 0, actualPnl: 0 }]
      }
    }
    
    // Normalize P&L values for radar chart (scale 0-100)
    const allPnls = rawPairData.map((d: any) => d.pnl)
    const minPnl = Math.min(...allPnls)
    const maxPnl = Math.max(...allPnls)
    const range = maxPnl - minPnl || 1
    
    // Normalize to 0-100 scale, with negative values starting at 25
    const normalizedData = rawPairData.map((item: any) => ({
      ...item,
      score: (item as any).pnl < 0 
        ? Math.max(0, 25 + ((item as any).pnl / Math.abs(minPnl)) * 25)
        : 50 + ((item as any).pnl / maxPnl) * 50
    }))
    
    return { chartData: normalizedData, rawData: rawPairData }
  }, [refreshKey, getTrades])

  const totalPnL = rawData.reduce((sum: number, item: any) => sum + item.actualPnl, 0)

  return (
    <Card className="h-[450px] flex flex-col hover:shadow-lg transition-shadow duration-200 border-border/50">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 rounded-lg" style={{backgroundColor: `${themeColors.primary}20`}}>
            <FontAwesomeIcon icon={faChartLine} className="h-4 w-4" style={{color: themeColors.primary}} />
          </div>
          Trading Pairs Performance
        </CardTitle>
        <CardDescription className="text-muted-foreground font-medium">
          P&L breakdown by currency pairs and trading instruments
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-4 py-2">
        {chartData.length > 0 ? (
          <div className="h-full">
            <ChartContainer
              config={chartConfig}
              className="h-full w-full aspect-auto"
            >
              <RadarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <ChartTooltip 
                  cursor={false} 
                  content={<ChartTooltipContent 
                    formatter={(value, name) => {
                      const item = chartData.find(d => d.pair === name);
                      return item ? `$${item.actualPnl.toFixed(2)}` : value;
                    }}
                  />} 
                />
                <PolarAngleAxis 
                  dataKey="pair" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                />
                <PolarGrid 
                  stroke="hsl(var(--border))" 
                  strokeOpacity={0.5} 
                />
                <Radar
                  dataKey="score"
                  fill={themeColors.primary}
                  fillOpacity={0.3}
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
      <CardFooter className="border-t border-border/30 bg-muted/20">
        <div className="flex w-full items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-medium leading-none">
              Total P&L: 
              <span className="font-semibold" style={{color: (totalPnL as number) >= 0 ? themeColors.profit : themeColors.loss}}>
                {(totalPnL as number) >= 0 ? '+' : ''}${(totalPnL as number).toFixed(2)}
              </span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-2 leading-none">
              <span className="text-muted-foreground font-medium">
                {(totalPnL as number) >= 1000 ? 'Strong Performance' : (totalPnL as number) >= 0 ? 'Profitable' : 'Needs Improvement'}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {chartData.length} trading pairs
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}