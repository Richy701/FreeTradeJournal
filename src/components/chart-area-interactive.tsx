import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useThemePresets } from '@/contexts/theme-presets'
import { useDemoData } from '@/hooks/use-demo-data'
import { faChartArea, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'
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
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { useMemo, useState } from "react"
import { BarChart3 } from "lucide-react"

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

export function ChartAreaInteractive() {
  const [view, setView] = useState<ChartView>('equity')
  // Get theme colors and demo data
  const { themeColors, alpha } = useThemePresets()
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

  const winDays = dailyData.filter(d => d.pnl >= 0).length
  const lossDays = dailyData.filter(d => d.pnl < 0).length

  return (
    <Card className="h-[400px] flex flex-col hover:shadow-lg transition-shadow duration-200 border-0">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="p-2 rounded-lg" style={{backgroundColor: `${alpha(themeColors.primary, '20')}`}}>
                {view === 'equity' ? (
                  <FontAwesomeIcon icon={faChartArea} className="h-4 w-4" style={{color: themeColors.primary}} />
                ) : (
                  <BarChart3 className="h-4 w-4" style={{color: themeColors.primary}} />
                )}
              </div>
              {view === 'equity' ? 'Equity Curve' : 'Trade P&L'}
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium mt-1">
              {view === 'equity'
                ? 'Your trading performance over time - cumulative P&L progression'
                : 'Daily profit & loss'}
            </CardDescription>
          </div>
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
            <button
              onClick={() => setView('equity')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === 'equity'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Equity
            </button>
            <button
              onClick={() => setView('pnl')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === 'pnl'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              P&L
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-4 py-2">
        {chartData.length > 0 ? (
          <div className="h-full">
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
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={themeColors.profit} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={themeColors.profit} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
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
                    fill="url(#equityGradient)"
                    stroke={themeColors.profit}
                    strokeWidth={2}
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
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={24}>
                    {dailyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? themeColors.profit : themeColors.loss}
                        fillOpacity={0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No trading data available. Start by adding some trades!
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-border/30 bg-muted/20">
        <div className="flex w-full items-center justify-between text-sm mt-2">
          <div className="flex items-center gap-3 mt-1">
            {view === 'equity' ? (
              <>
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
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 leading-none">
                  <span className="font-semibold" style={{color: themeColors.profit}}>{winDays} green</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-semibold" style={{color: themeColors.loss}}>{lossDays} red</span>
                  <span className="text-muted-foreground">days</span>
                </div>
                <div className="h-4 w-px bg-border"></div>
                <div className="flex items-center gap-2 leading-none">
                  <span className="text-muted-foreground font-medium">Total P&L:</span>
                  <span className="font-semibold" style={{color: isPositive ? themeColors.profit : themeColors.loss}}>
                    {isPositive ? '+' : ''}${totalPnL.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {chartData.length} trades
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
