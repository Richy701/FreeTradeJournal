import { EmptyState } from '@/components/empty-state'
import { useMemo } from "react"
import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { usePnlDisplay } from '@/hooks/use-pnl-display'
import { useDemoData } from '@/hooks/use-demo-data'
import { List, Plus, UploadSimple, CaretRight } from '@phosphor-icons/react'
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

const VISIBLE_ROWS = 8

export function DataTable({ data }: DataTableProps) {
  const { themeColors } = useThemePresets()
  const { formatCurrency } = useSettings()
  const { mode: pnlMode, formatPnl } = usePnlDisplay()
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

  const visibleTrades: Trade[] = trades.slice(0, VISIBLE_ROWS)

  // One-line read of the rows shown, so the card says something before you scan it
  const summary = useMemo(() => {
    const wins = visibleTrades.filter(t => t.pnl > 0).length
    const losses = visibleTrades.filter(t => t.pnl < 0).length
    const net = visibleTrades.reduce((s, t) => s + t.pnl, 0)
    return { wins, losses, net }
  }, [visibleTrades])

  // Group consecutive trades by day so the date reads once per day
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

  const goToLog = () => navigate('/trades')

  return (
    <Card className="flex flex-col overflow-hidden shadow-none">
      <CardHeader className="border-b p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <CardTitle className="text-lg font-semibold">Recent trades</CardTitle>
            {visibleTrades.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums truncate">
                {summary.wins}W {summary.losses}L ·{' '}
                <span style={{ color: summary.net >= 0 ? themeColors.profit : themeColors.loss }}>{formatCurrency(summary.net)}</span>
              </span>
            )}
          </div>
          {trades.length > 0 && (
            <Button asChild variant="ghost" size="sm" className="shrink-0 text-xs">
            <Link to="/trades">
              View all
              <CaretRight className="h-3 w-3" />
            </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-0">
        {trades.length > 0 ? (
          <div>
            <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1fr)_80px_minmax(0,1fr)_120px] gap-3 border-b px-5 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:grid"><span>Symbol</span><span>Side</span><span>Entry → Exit</span><span className="text-right">P&amp;L</span></div>
            {groupedTrades.map((group) => (
              <div key={group.label} className="border-b last:border-b-0">
                <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2 sm:px-5">
                  <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
                  <span className="text-[11px] text-muted-foreground">{group.trades.length} trade{group.trades.length === 1 ? '' : 's'}</span>

                </div>
                <ul className="divide-y divide-border/50">
                  {group.trades.map((trade) => {
                    const isLong = trade.side === 'long'
                    const isProfit = trade.pnl >= 0
                    const sideColor = isLong ? themeColors.profit : themeColors.loss
                    const pnlColor = isProfit ? themeColors.profit : themeColors.loss
                    const pctValue = Number.isFinite(trade.pnlPercentage) ? trade.pnlPercentage : 0
                    const time = formatTradeTime(trade.exitTime)
                    const secondary = pnlMode === 'percent'
                      ? formatCurrency(trade.pnl, true)
                      : pctValue !== 0 ? `${isProfit ? '+' : ''}${pctValue.toFixed(2)}%` : ''
                    return (
                      <li key={trade.id}>
                        <button
                          type="button"
                          onClick={goToLog}
                          className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 min-h-12 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_80px_minmax(0,1fr)_120px] sm:px-5 rounded-none text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                        >
                          <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
                            <span className="text-sm font-semibold shrink-0">{trade.symbol}</span>
                            <span className="text-xs truncate">
                              <span className="font-medium sm:hidden" style={{ color: sideColor }}>{isLong ? 'Long' : 'Short'}</span>
                              {trade.strategy && <span className="text-muted-foreground"><span className="sm:hidden"> · </span>{trade.strategy}</span>}
                              {time && <span className="text-muted-foreground hidden sm:inline"> · {time}</span>}
                            </span>
                          </div>
                          <Badge variant="outline" className="hidden w-fit rounded-md font-normal sm:inline-flex" style={{ color: sideColor }}>{isLong ? 'Long' : 'Short'}</Badge>
                          <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                            {Number.isFinite(trade.entryPrice) && Number.isFinite(trade.exitPrice) && trade.entryPrice > 0 && trade.exitPrice > 0
                              ? `${trade.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 5 })} → ${trade.exitPrice.toLocaleString(undefined, { maximumFractionDigits: 5 })}`
                              : '—'}
                          </span>
                          <div className="flex flex-col items-end gap-1 shrink-0 tabular-nums">
                            <span className="text-sm font-semibold" style={{ color: pnlColor }}>{formatPnl(trade.pnl)}</span>
                            {secondary && (
                              <span className="text-xs text-muted-foreground hidden sm:inline-block">{secondary}</span>
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState compact className="border-0" icon={List} title="Your recent trades will appear here" description="Log a trade or import a broker CSV to start your history.">
              <div className="flex items-center justify-center gap-2 pt-2">
                <Link to="/trades">
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Add trade
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
          </EmptyState>
        )}
      </CardContent>
    </Card>
  )
}
