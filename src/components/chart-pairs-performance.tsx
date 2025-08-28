"use client"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar } from '@fortawesome/free-solid-svg-icons'
import { useThemePresets } from '@/contexts/theme-presets'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
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

export const description = "Trading Pairs Performance Bar Chart"

const chartConfig = {
  pnl: {
    label: "P&L ($)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function ChartPairsPerformance() {
  const { themeColors } = useThemePresets()
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
  const chartData = useMemo(() => {
    const storedTrades = localStorage.getItem('trades')
    
    if (!storedTrades) {
      // Show sample trading pairs for demo purposes
      return [
        { pair: "EUR/USD", pnl: 850 },
        { pair: "GBP/USD", pnl: 320 },
        { pair: "USD/JPY", pnl: -150 },
        { pair: "AUD/USD", pnl: 420 },
        { pair: "USD/CAD", pnl: 180 },
        { pair: "NZD/USD", pnl: -80 },
        { pair: "EUR/GBP", pnl: 250 },
        { pair: "USD/CHF", pnl: -120 },
      ]
    }
    
    try {
      const trades = JSON.parse(storedTrades)
      
      // Group trades by symbol/pair and calculate total P&L for each
      const pairPerformance = trades.reduce((acc: any, trade: any) => {
        const symbol = trade.symbol || 'Unknown'
        if (!acc[symbol]) {
          acc[symbol] = { pair: symbol, pnl: 0, tradeCount: 0 }
        }
        acc[symbol].pnl += trade.pnl || 0
        acc[symbol].tradeCount += 1
        return acc
      }, {})
      
      // Convert to array and sort by absolute P&L value
      const pairArray = Object.values(pairPerformance)
        .sort((a: any, b: any) => Math.abs(b.pnl) - Math.abs(a.pnl))
        .slice(0, 10) // Show top 10 pairs
      
      return pairArray.length > 0 ? pairArray : [
        { pair: "No trades yet", pnl: 0 }
      ]
    } catch {
      return [
        { pair: "Error loading", pnl: 0 }
      ]
    }
  }, [refreshKey])

  const totalPnL = chartData.reduce((sum, item) => sum + item.pnl, 0)
  const profitablePairs = chartData.filter(item => item.pnl > 0).length
  const losingPairs = chartData.filter(item => item.pnl < 0).length

  return (
    <Card className="h-[450px] flex flex-col hover:shadow-lg transition-shadow duration-200 border-border/50">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 rounded-lg" style={{backgroundColor: `${themeColors.primary}20`}}>
            <FontAwesomeIcon icon={faChartBar} className="h-4 w-4" style={{color: themeColors.primary}} />
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
              className="h-full w-full"
            >
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, bottom: 40, left: 50 }}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  type="number"
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  type="category"
                  dataKey="pair" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={60}
                />
                <ChartTooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  content={<ChartTooltipContent />} 
                />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pnl >= 0 ? themeColors.profit : themeColors.loss}
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
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
              <span className="font-semibold" style={{color: totalPnL >= 0 ? themeColors.profit : themeColors.loss}}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-4 leading-none text-xs">
              <span style={{color: themeColors.profit}}>
                {profitablePairs} winning
              </span>
              <span style={{color: themeColors.loss}}>
                {losingPairs} losing
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {chartData.length} pairs traded
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}