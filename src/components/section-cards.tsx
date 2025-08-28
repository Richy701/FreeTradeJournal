import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useThemePresets } from '@/contexts/theme-presets'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faDollarSign, 
  faPercentage, 
  faChartBar, 
  faChartLine,
  faArrowUp, 
  faArrowDown, 
  faQuestionCircle 
} from '@fortawesome/free-solid-svg-icons'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart, Pie, PieChart, Sector } from "recharts"
import { useMemo } from "react"

// Define interfaces for type safety
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

export function SectionCards() {
  // Get theme colors
  const { themeColors } = useThemePresets()
  
  // Get trades from localStorage
  const trades = useMemo(() => {
    const storedTrades = localStorage.getItem('trades')
    if (!storedTrades) return []
    
    try {
      const parsedTrades = JSON.parse(storedTrades)
      return parsedTrades.map((trade: any) => ({
        ...trade,
        entryTime: new Date(trade.entryTime),
        exitTime: new Date(trade.exitTime)
      }))
    } catch {
      return []
    }
  }, [])

  // Calculate metrics
  const metrics = useMemo(() => {
    if (trades.length === 0) {
      return {
        totalPnL: 0,
        winRate: 0,
        totalTrades: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
      }
    }

    const totalPnL = trades.reduce((sum: number, trade: Trade) => sum + trade.pnl, 0)
    const winningTrades = trades.filter((trade: Trade) => trade.pnl > 0)
    const losingTrades = trades.filter((trade: Trade) => trade.pnl < 0)
    
    const winRate = (winningTrades.length / trades.length) * 100
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum: number, trade: Trade) => sum + trade.pnl, 0) / winningTrades.length 
      : 0
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum: number, trade: Trade) => sum + trade.pnl, 0) / losingTrades.length)
      : 0

    const grossProfit = winningTrades.reduce((sum: number, trade: Trade) => sum + trade.pnl, 0)
    const grossLoss = Math.abs(losingTrades.reduce((sum: number, trade: Trade) => sum + trade.pnl, 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0

    return {
      totalPnL,
      winRate,
      totalTrades: trades.length,
      avgWin,
      avgLoss,
      profitFactor,
    }
  }, [trades])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <TooltipProvider>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 overflow-visible">
        <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-muted/30 backdrop-blur-sm overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total P&L</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FontAwesomeIcon icon={faQuestionCircle} className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="p-2 border-0 bg-background/95 backdrop-blur">
                  <p className="text-xs">Total profit/loss after commissions</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="p-2.5 rounded-lg shadow-sm" style={{backgroundColor: `${metrics.totalPnL >= 0 ? themeColors.profit : themeColors.loss}20`}}>
              <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4" style={{color: metrics.totalPnL >= 0 ? themeColors.profit : themeColors.loss}} />
            </div>
          </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-3xl font-bold tracking-tight" style={{letterSpacing: '-0.02em', color: metrics.totalPnL >= 0 ? themeColors.profit : themeColors.loss}}>
              {metrics.totalPnL >= 0 ? '+' : ''}{formatCurrency(metrics.totalPnL)}
            </div>
            <div className="flex items-center gap-1">
              <FontAwesomeIcon 
                icon={metrics.totalPnL >= 0 ? faArrowUp : faArrowDown} 
                className="h-3 w-3" 
                style={{color: metrics.totalPnL >= 0 ? themeColors.profit : themeColors.loss}} 
              />
              <p className="text-xs text-muted-foreground font-medium">
                {formatPercentage(Math.abs((metrics.totalPnL / 10000) * 100))} from initial
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-muted/30 backdrop-blur-sm overflow-visible hover:z-[10001]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Win Rate</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <FontAwesomeIcon icon={faQuestionCircle} className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="p-2 border-0 bg-background/95 backdrop-blur z-[10002]">
                <p className="text-xs">Percentage of profitable trades</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="p-2.5 rounded-lg shadow-sm" style={{backgroundColor: `${themeColors.profit}20`}}>
            <FontAwesomeIcon icon={faPercentage} className="h-4 w-4" style={{color: themeColors.profit}} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-2">
              <div className="text-3xl font-bold tracking-tight text-foreground" style={{letterSpacing: '-0.02em'}}>{formatPercentage(metrics.winRate)}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-medium">{trades.filter((t: Trade) => t.pnl > 0).length}W</span>
                <span className="text-muted-foreground font-medium">/</span>
                <span className="text-muted-foreground font-medium">{trades.filter((t: Trade) => t.pnl < 0).length}L</span>
              </div>
            </div>
            <div className="w-16 h-16 relative z-[10000]">
              <ChartContainer
                config={{
                  wins: { label: "Wins", color: themeColors.profit },
                  losses: { label: "Losses", color: themeColors.loss }
                }}
                className="w-full h-full relative z-[10000]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={[
                      { type: "wins", count: trades.filter((t: Trade) => t.pnl > 0).length, fill: themeColors.profit },
                      { type: "losses", count: trades.filter((t: Trade) => t.pnl < 0).length, fill: themeColors.loss }
                    ]}
                    dataKey="count"
                    nameKey="type"
                    innerRadius={16}
                    outerRadius={28}
                    strokeWidth={2}
                    activeIndex={0}
                    activeShape={({
                      outerRadius = 0,
                      ...props
                    }: any) => (
                      <Sector {...props} outerRadius={outerRadius + 2} />
                    )}
                  />
                </PieChart>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-muted/30 backdrop-blur-sm overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Trades</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <FontAwesomeIcon icon={faQuestionCircle} className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="p-2 border-0 bg-background/95 backdrop-blur">
                <p className="text-xs">Total completed trades</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="p-2.5 rounded-lg shadow-sm" style={{backgroundColor: `${themeColors.profit}20`}}>
            <FontAwesomeIcon icon={faChartBar} className="h-4 w-4" style={{color: themeColors.profit}} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-3xl font-bold tracking-tight text-foreground" style={{letterSpacing: '-0.02em'}}>{metrics.totalTrades.toLocaleString()}</div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(Math.min(3, metrics.totalTrades))].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground ring-1 ring-background" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Positions tracked
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-muted/30 backdrop-blur-sm overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Profit Factor</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <FontAwesomeIcon icon={faQuestionCircle} className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="p-2 border-0 bg-background/95 backdrop-blur">
                <p className="text-xs">Ratio of total profits to losses (&gt;1 is profitable)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="p-2.5 rounded-lg shadow-sm" style={{backgroundColor: `${themeColors.profit}20`}}>
            <FontAwesomeIcon icon={faChartLine} className="h-4 w-4" style={{color: themeColors.profit}} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-2">
              <div className="text-3xl font-bold tracking-tight text-foreground" style={{letterSpacing: '-0.02em'}}>
                {metrics.profitFactor >= 999 ? '∞' : metrics.profitFactor.toFixed(2)}x
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {metrics.profitFactor >= 2 ? 'Excellent' : 
                 metrics.profitFactor >= 1.5 ? 'Good' :
                 metrics.profitFactor >= 1 ? 'Positive' : 'Negative'}
              </p>
            </div>
            <div className="w-16 h-16 relative z-[10000]">
              <ChartContainer
                config={{
                  wins: { label: "Wins", color: themeColors.profit },
                  losses: { label: "Losses", color: themeColors.loss }
                }}
                className="w-full h-full relative z-[10000]"
              >
                <RadialBarChart
                  data={[{
                    wins: trades.filter((t: Trade) => t.pnl > 0).length,
                    losses: trades.filter((t: Trade) => t.pnl < 0).length
                  }]}
                  endAngle={180}
                  innerRadius={20}
                  outerRadius={32}
                >
                  <RadialBar
                    dataKey="wins"
                    stackId="a"
                    cornerRadius={2}
                    fill={themeColors.profit}
                    className="stroke-transparent"
                  />
                  <RadialBar
                    dataKey="losses"
                    fill={themeColors.loss}
                    stackId="a"
                    cornerRadius={2}
                    className="stroke-transparent"
                  />
                </RadialBarChart>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  )
}