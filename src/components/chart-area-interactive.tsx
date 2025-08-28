import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useThemePresets } from '@/contexts/theme-presets'
import { faChartArea, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import { useMemo } from "react"

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

export function ChartAreaInteractive() {
  // Get theme colors
  const { themeColors } = useThemePresets()
  
  // Get trades from localStorage and generate equity curve data
  const chartData = useMemo(() => {
    const storedTrades = localStorage.getItem('trades')
    if (!storedTrades) return []
    
    try {
      const parsedTrades: Trade[] = JSON.parse(storedTrades).map((trade: any) => ({
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
    } catch {
      return []
    }
  }, [])

  const totalPnL = chartData.length > 0 ? chartData[chartData.length - 1].cumulative : 0
  const isPositive = totalPnL >= 0

  return (
    <Card className="h-[400px] flex flex-col hover:shadow-lg transition-shadow duration-200 border-border/50">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 rounded-lg" style={{backgroundColor: `${themeColors.primary}20`}}>
            <FontAwesomeIcon icon={faChartArea} className="h-4 w-4" style={{color: themeColors.primary}} />
          </div>
          Equity Curve
        </CardTitle>
        <CardDescription className="text-muted-foreground font-medium">
          Your trading performance over time - cumulative P&L progression
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-4 py-2">
        {chartData.length > 0 ? (
          <div className="h-full">
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
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 5)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="cumulative"
                  type="natural"
                  fill={themeColors.profit}
                  fillOpacity={0.4}
                  stroke={themeColors.profit}
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No trading data available. Start by adding some trades!
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-border/30 bg-muted/20">
        <div className="flex w-full items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-medium leading-none">
              {isPositive ? 'Trending up' : 'Trending down'} 
              <FontAwesomeIcon 
                icon={isPositive ? faArrowUp : faArrowDown} 
                className="h-3 w-3"
                style={{color: isPositive ? themeColors.profit : themeColors.loss}} 
              />
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-2 leading-none">
              <span className="text-muted-foreground font-medium">Total P&L:</span>
              <span className="font-semibold" style={{color: isPositive ? themeColors.profit : themeColors.loss}}>
                {isPositive ? '+' : ''}${totalPnL.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {chartData.length} trades
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}