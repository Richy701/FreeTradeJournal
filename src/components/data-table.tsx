import { useMemo } from "react"
import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { useDemoData } from '@/hooks/use-demo-data'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faList, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

interface DataTableProps {
  data?: any // We'll ignore the passed data and use localStorage instead
}

export function DataTable({ data }: DataTableProps) {
  // Get theme colors and demo data
  const { themeColors } = useThemePresets()
  const { formatCurrency } = useSettings()
  const { getTrades } = useDemoData()
  
  // Get trades from demo data or localStorage
  const trades = useMemo(() => {
    const tradesData = getTrades()
    return tradesData.map((trade: any) => ({
      ...trade,
      entryTime: new Date(trade.entryTime),
        exitTime: new Date(trade.exitTime)
      })).sort((a: Trade, b: Trade) => b.exitTime.getTime() - a.exitTime.getTime()) // Sort by most recent first
  }, [getTrades])

  // Remove local formatCurrency - using from settings context

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card className="h-[400px] flex flex-col hover:shadow-lg transition-shadow duration-200 border-0">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 rounded-lg" style={{backgroundColor: `${themeColors.primary}20`}}>
            <FontAwesomeIcon icon={faList} className="h-4 w-4" style={{color: themeColors.primary}} />
          </div>
          Recent Trades
        </CardTitle>
        <CardDescription className="text-muted-foreground font-medium">
          Your latest trading activity and performance
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {trades.length > 0 ? (
          <div className="h-full overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="font-semibold text-foreground/70">Symbol</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Side</TableHead>
                  <TableHead className="font-semibold text-foreground/70 text-right">P&L</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.slice(0, 10).map((trade: Trade, index: number) => (
                  <TableRow 
                    key={trade.id} 
                    className={`hover:bg-muted/50 transition-colors border-border/30 ${
                      index % 2 === 1 ? 'bg-muted/20' : ''
                    }`}
                  >
                    <TableCell className="font-semibold">{trade.symbol}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className="font-medium"
                        style={{
                          backgroundColor: `${trade.side === 'long' ? themeColors.profit : themeColors.loss}10`,
                          borderColor: trade.side === 'long' ? themeColors.profit : themeColors.loss,
                          color: trade.side === 'long' ? themeColors.profit : themeColors.loss
                        }}
                      >
                        <FontAwesomeIcon 
                          icon={trade.side === 'long' ? faArrowUp : faArrowDown} 
                          className="h-2 w-2 mr-1"
                          style={{color: trade.side === 'long' ? themeColors.profit : themeColors.loss}} 
                        />
                        {trade.side.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span 
                        className="font-semibold"
                        style={{color: trade.pnl >= 0 ? themeColors.profit : themeColors.loss}}
                      >
                        {formatCurrency(trade.pnl, true)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">{formatDate(trade.exitTime)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">No trades found</p>
              <p className="text-sm">Start by adding your first trade to see it here</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}