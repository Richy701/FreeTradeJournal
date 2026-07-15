import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { useAccounts } from '@/contexts/account-context'
import { useDashboardPeriod, filterTradesByPeriod } from '@/contexts/dashboard-period'
import { useDemoData } from '@/hooks/use-demo-data'
import { TrendUp, TrendDown } from '@phosphor-icons/react'
import { Link } from "react-router-dom"
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
import { Pie, PieChart, Sector, RadialBar, RadialBarChart, Line, LineChart } from "recharts"
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
  // Get theme colors and demo data
  const { themeColors } = useThemePresets()
  const { formatCurrency: formatCurrencyFromSettings, getCurrencySymbol, settings } = useSettings()
  const { activeAccount } = useAccounts()
  const { getTrades, getAnalyticsTrades } = useDemoData()
  const { period } = useDashboardPeriod()

  // Get trades from demo data or localStorage, narrowed to the dashboard period
  const trades = useMemo(() => {
    const tradesData = filterTradesByPeriod(getAnalyticsTrades().trades, period)
    return tradesData.map((trade: any) => ({
      ...trade,
      entryTime: new Date(trade.entryTime),
      exitTime: new Date(trade.exitTime)
    }))
  }, [getAnalyticsTrades, period])

  // Account balance is an absolute value, not a windowed stat — always derive
  // it from the full trade history or it disagrees with the header balance
  const allTimePnL = useMemo(
    () => getTrades().reduce((sum: number, t: any) => sum + (Number(t.pnl) || 0), 0),
    [getTrades]
  )

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

  // Use formatCurrency from settings context
  const formatCurrency = (amount: number) => formatCurrencyFromSettings(amount, true)
  const formatCurrencyPlain = (amount: number) => formatCurrencyFromSettings(Math.abs(amount), false)

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  const accountBalance = (activeAccount?.balance || settings.accountSize || 10000) + allTimePnL
  const balancePositive = accountBalance >= (activeAccount?.balance || settings.accountSize || 10000)

  const pnlPositive = metrics.totalPnL >= 0
  const pnlPct = Math.abs((metrics.totalPnL / (activeAccount?.balance || settings.accountSize || 10000)) * 100)
  const winRateGood = metrics.winRate >= 50
  const winCount = trades.filter((t: Trade) => t.pnl > 0).length
  const lossCount = trades.filter((t: Trade) => t.pnl < 0).length
  const pfGood = metrics.profitFactor >= 1
  const pfLabel = metrics.profitFactor >= 2 ? 'Excellent' :
                  metrics.profitFactor >= 1.5 ? 'Good' :
                  metrics.profitFactor >= 1 ? 'Positive' : 'Needs work'
  const avgPnlPerTrade = metrics.totalTrades > 0 ? metrics.totalPnL / metrics.totalTrades : 0
  const grossProfit = trades.filter((t: Trade) => t.pnl > 0).reduce((s: number, t: Trade) => s + t.pnl, 0)
  const grossLoss = Math.abs(trades.filter((t: Trade) => t.pnl < 0).reduce((s: number, t: Trade) => s + t.pnl, 0))

  // Current win/loss streak from the most recent trades (breakeven ends a streak)
  const streak = useMemo(() => {
    const sorted = [...trades].sort((a: Trade, b: Trade) => a.exitTime.getTime() - b.exitTime.getTime())
    let count = 0
    let dir: 'win' | 'loss' | null = null
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].pnl === 0) break
      const d = sorted[i].pnl > 0 ? 'win' : 'loss'
      if (!dir) dir = d
      if (d !== dir) break
      count++
    }
    return { count, dir }
  }, [trades])

  const weekCount = useMemo(
    () => trades.filter((t: Trade) => Date.now() - t.exitTime.getTime() <= 7 * 24 * 60 * 60 * 1000).length,
    [trades]
  )

  // Mini cumulative P&L sparkline (last 10 trades)
  const pnlSparkline = useMemo(() => {
    const sorted = [...trades].sort((a: Trade, b: Trade) => a.exitTime.getTime() - b.exitTime.getTime())
    const recent = sorted.slice(-10)
    let cum = 0
    return recent.map((t: Trade) => {
      cum += t.pnl
      return { pnl: cum }
    })
  }, [trades])

  return (
    <TooltipProvider>
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 2xl:grid-cols-4 overflow-visible">

        {/* Total P&L */}
        <Link to="/trades" className="block h-full">
        <Card className="h-full relative overflow-visible cursor-pointer hover:bg-primary/[0.06] dark:hover:bg-primary/[0.08]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                  style={{ color: pnlPositive ? themeColors.profit : themeColors.loss }}
                >
                  {pnlPositive ? <TrendUp className="h-3 w-3" /> : <TrendDown className="h-3 w-3" />}
                  {pnlPositive ? '+' : '-'}{formatPercentage(pnlPct)}
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-2 border bg-popover">
                <p className="text-xs">Percentage of account balance</p>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-bold tracking-tight" style={{ color: pnlPositive ? themeColors.profit : themeColors.loss }}>
                  {formatCurrency(metrics.totalPnL)}
                </div>
                <div className="mt-3 space-y-0.5">
                  <p className="text-sm font-medium break-words text-muted-foreground">
                    Balance: {formatCurrencyPlain(accountBalance)}
                  </p>
                  <p className="text-xs break-words" style={{ color: avgPnlPerTrade >= 0 ? themeColors.profit : themeColors.loss }}>Avg {formatCurrency(avgPnlPerTrade)} per trade</p>
                </div>
              </div>
              <div className="w-16 h-16 relative shrink-0">
                <ChartContainer
                  config={{ pnl: { label: "P&L", color: pnlPositive ? themeColors.profit : themeColors.loss } }}
                  className="w-full h-full"
                >
                  <LineChart data={pnlSparkline} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
                    <Line dataKey="pnl" type="monotone" stroke={pnlPositive ? themeColors.profit : themeColors.loss} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ChartContainer>
              </div>
            </div>
          </CardContent>
        </Card>
        </Link>

        {/* Win Rate */}
        <Link to="/trades" className="block h-full">
        <Card className="h-full relative overflow-visible cursor-pointer hover:bg-primary/[0.06] dark:hover:bg-primary/[0.08]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            <div
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
              style={{ color: winRateGood ? themeColors.profit : themeColors.loss }}
            >
              {winCount}W / {lossCount}L
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-bold tracking-tight" style={{ color: winRateGood ? themeColors.profit : themeColors.loss }}>
                  {formatPercentage(metrics.winRate)}
                </div>
                <div className="mt-3 space-y-0.5">
                  <p className="text-sm font-medium break-words" style={{ color: winRateGood ? themeColors.profit : themeColors.loss }}>
                    {Math.abs(metrics.winRate - 50).toFixed(0)}pts {winRateGood ? 'above' : 'below'} 50%
                  </p>
                  <p className="text-xs break-words"><span style={{ color: themeColors.profit }}>{formatCurrencyPlain(metrics.avgWin)} avg win</span> / <span style={{ color: themeColors.loss }}>{formatCurrencyPlain(metrics.avgLoss)} avg loss</span></p>
                </div>
              </div>
              <div className="w-16 h-16 relative shrink-0">
                <ChartContainer
                  config={{
                    wins: { label: "Wins", color: themeColors.profit },
                    losses: { label: "Losses", color: themeColors.loss }
                  }}
                  className="w-full h-full"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={[
                        { type: "wins", count: winCount, fill: themeColors.profit },
                        { type: "losses", count: lossCount, fill: themeColors.loss }
                      ]}
                      dataKey="count"
                      nameKey="type"
                      innerRadius={16}
                      outerRadius={28}
                      strokeWidth={0}
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
        </Link>

        {/* Total Trades */}
        <Link to="/trades" className="block h-full">
        <Card className="h-full relative overflow-visible cursor-pointer hover:bg-primary/[0.06] dark:hover:bg-primary/[0.08]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
            <div className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {weekCount} this week
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-bold tracking-tight text-foreground">
                  {metrics.totalTrades.toLocaleString()}
                </div>
                <div className="mt-3 space-y-0.5">
                  <p className="text-sm font-medium break-words">
                    <span style={{ color: themeColors.profit }}>{winCount} winners</span>, <span style={{ color: themeColors.loss }}>{lossCount} losers</span>
                  </p>
                  {streak.count > 0 ? (
                    <p className="text-xs break-words" style={{ color: streak.dir === 'win' ? themeColors.profit : themeColors.loss }}>
                      {streak.count}-{streak.dir} streak
                    </p>
                  ) : (
                    <p className="text-xs break-words text-muted-foreground">No active streak</p>
                  )}
                </div>
              </div>
              <div className="w-16 h-16 flex items-center shrink-0">
                {winCount + lossCount > 0 ? (
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full">
                    <div style={{ width: `${(winCount / (winCount + lossCount)) * 100}%`, backgroundColor: themeColors.profit }} />
                    <div style={{ width: `${(lossCount / (winCount + lossCount)) * 100}%`, backgroundColor: themeColors.loss }} />
                  </div>
                ) : (
                  <div className="h-2.5 w-full rounded-full bg-muted" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        </Link>

        {/* Profit Factor */}
        <Link to="/trades" className="block h-full">
        <Card className="h-full relative overflow-visible cursor-pointer hover:bg-primary/[0.06] dark:hover:bg-primary/[0.08]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Factor</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                  style={{ color: pfGood ? themeColors.profit : themeColors.loss }}
                >
                  {pfGood ? <TrendUp className="h-3 w-3" /> : <TrendDown className="h-3 w-3" />}
                  {pfLabel}
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-2 border bg-popover">
                <p className="text-xs">Ratio of gross profits to losses (&gt;1 is profitable)</p>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-bold tracking-tight" style={{ color: pfGood ? themeColors.profit : themeColors.loss }}>
                  {metrics.profitFactor >= 999 ? '∞' : metrics.profitFactor.toFixed(2)}x
                </div>
                <div className="mt-3 space-y-0.5">
                  <p className="text-sm font-medium break-words" style={{ color: pfGood ? themeColors.profit : themeColors.loss }}>
                    {pfGood ? `${getCurrencySymbol()}${metrics.profitFactor.toFixed(2)} earned per ${getCurrencySymbol()}1 lost` : 'Losing more than winning'}
                  </p>
                  <p className="text-xs break-words"><span style={{ color: themeColors.profit }}>{formatCurrencyPlain(grossProfit)} won</span> / <span style={{ color: themeColors.loss }}>{formatCurrencyPlain(grossLoss)} lost</span></p>
                </div>
              </div>
              <div className="w-16 h-16 relative shrink-0">
                <ChartContainer
                  config={{
                    won: { label: "Won", color: themeColors.profit },
                    lost: { label: "Lost", color: themeColors.loss }
                  }}
                  className="w-full h-full"
                >
                  <RadialBarChart
                    data={[{ won: grossProfit, lost: grossLoss }]}
                    startAngle={180}
                    endAngle={0}
                    innerRadius={20}
                    outerRadius={32}
                    cy="68%"
                  >
                    <RadialBar
                      dataKey="won"
                      stackId="a"
                      cornerRadius={2}
                      fill={themeColors.profit}
                      className="stroke-transparent"
                    />
                    <RadialBar
                      dataKey="lost"
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
        </Link>

      </div>
    </TooltipProvider>
  )
}
