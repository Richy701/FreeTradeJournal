import { useMemo } from "react"
import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { useDemoData } from '@/hooks/use-demo-data'
import { List, ArrowUp, ArrowDown, Plus, UploadSimple, CaretRight } from '@phosphor-icons/react'
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, isToday, isYesterday } from "date-fns"

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

interface DataTableProps {
  data?: any
}

// Guard against unparseable saved dates: date-fns format() throws
// "RangeError: Invalid time value" on an Invalid Date, which would otherwise
// crash the whole dashboard render.
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime())
}

function formatTradeDate(date: Date): string {
  if (!isValidDate(date)) return '—'
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

// Imported trades often carry no time-of-day and land on exactly midnight —
// repeating "12:00 AM" down the list is noise, so hide it in that case.
function formatTradeTime(date: Date): string {
  if (!isValidDate(date)) return ''
  if (date.getHours() === 0 && date.getMinutes() === 0) return ''
  return format(date, 'h:mm a')
}

export function DataTable({ data }: DataTableProps) {
  const { themeColors, alpha } = useThemePresets()
  const { formatCurrency } = useSettings()
  const { getTrades } = useDemoData()
  const navigate = useNavigate()

  const trades = useMemo(() => {
    // Deliberately unwindowed: this is a trade list, not a stat — the free
    // analytics window never hides rows from a list of the user's own trades
    const tradesData = getTrades()
    return tradesData.map((trade: any) => ({
      ...trade,
      entryTime: new Date(trade.entryTime),
      exitTime: new Date(trade.exitTime)
    })).sort((a: Trade, b: Trade) => b.exitTime.getTime() - a.exitTime.getTime())
  }, [getTrades])

  const visibleTrades = trades.slice(0, 10)

  // Group consecutive trades by day so the date reads once per day
  // instead of repeating on every row.
  const groupedTrades = useMemo(() => {
    const groups: { label: string; trades: Trade[] }[] = []
    for (const trade of visibleTrades) {
      const label = formatTradeDate(trade.exitTime)
      const last = groups[groups.length - 1]
      if (last && last.label === label) last.trades.push(trade)
      else groups.push({ label, trades: [trade] })
    }
    return groups
  }, [visibleTrades])

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Trades</CardTitle>
          {trades.length > 0 && (
            <Link
              to="/trades"
              className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
              <CaretRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pt-0">
        {trades.length > 0 ? (
          <div className="h-full overflow-y-auto -mx-1 px-1">
            <div className="flex flex-col">
              {groupedTrades.map((group) => (
                <div key={group.label}>
                  <div className="px-2 pt-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                  {group.trades.map((trade: Trade, index: number) => {
                    const isLong = trade.side === 'long'
                    const isProfit = trade.pnl >= 0
                    const sideColor = isLong ? themeColors.profit : themeColors.loss
                    const pnlColor = isProfit ? themeColors.profit : themeColors.loss
                    const pctValue = Number.isFinite(trade.pnlPercentage) ? trade.pnlPercentage : 0
                    const tradeTime = formatTradeTime(trade.exitTime)
                    const qty = Number(trade.quantity) || 0

                    return (
                      <div key={trade.id}>
                        <button
                          type="button"
                          onClick={() => navigate('/trades')}
                          className="w-full flex items-center gap-3 py-2.5 px-2 rounded-md hover:bg-muted/50 transition-colors text-left cursor-pointer"
                        >
                          {/* Left: direction arrow, colored by side (long green / short red) */}
                          <div className="w-4 flex items-center justify-center shrink-0">
                            {isLong ? (
                              <ArrowUp className="h-3.5 w-3.5" weight="bold" style={{ color: sideColor }} />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5" weight="bold" style={{ color: sideColor }} />
                            )}
                          </div>

                          {/* Center: symbol + side, size, time */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {trade.symbol}
                              </span>
                              {trade.strategy && (
                                <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                                  {trade.strategy}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {isLong ? 'Long' : 'Short'}{qty > 0 ? ` ×${qty.toLocaleString()}` : ''}{tradeTime ? ` · ${tradeTime}` : ''}
                            </p>
                          </div>

                          {/* Right: P&L + percentage */}
                          <div className="flex flex-col items-end">
                            <span
                              className="text-sm font-semibold tabular-nums"
                              style={{ color: pnlColor }}
                            >
                              {formatCurrency(trade.pnl, true)}
                            </span>
                            {pctValue !== 0 && (
                              <span className="text-[11px] text-muted-foreground tabular-nums">
                                {isProfit ? '+' : ''}{pctValue.toFixed(2)}%
                              </span>
                            )}
                          </div>
                        </button>
                        {index < group.trades.length - 1 && (
                          <div className="mx-2 border-b border-border/40" />
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center space-y-3">
              <List className="h-8 w-8 opacity-40" />
              <p className="text-lg font-medium">No trades found</p>
              <p className="text-sm">Add your first trade or import a CSV to get started</p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Link to="/trades">
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Add Trade
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => document.getElementById('dashboard-csv-import')?.click()}
                >
                  <UploadSimple className="h-3.5 w-3.5" />
                  Import CSV
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
