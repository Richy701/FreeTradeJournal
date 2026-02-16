import { useMemo } from "react"
import { useThemePresets } from '@/contexts/theme-presets'
import { useSettings } from '@/contexts/settings-context'
import { useDemoData } from '@/hooks/use-demo-data'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faList, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
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
  const { themeColors, alpha } = useThemePresets()
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
    <Card className="h-[400px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Trades</CardTitle>
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
                    className={`hover:bg-muted/50 border-border/30 ${
                      index % 2 === 1 ? 'bg-muted/20' : ''
                    }`}
                  >
                    <TableCell className="font-semibold">{trade.symbol}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className="font-medium"
                        style={{
                          backgroundColor: `${alpha(trade.side === 'long' ? themeColors.profit : themeColors.loss, '10')}`,
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
            <div className="text-center space-y-3">
              <FontAwesomeIcon icon={faList} className="h-8 w-8 opacity-40" />
              <p className="text-lg font-medium">No trades found</p>
              <p className="text-sm">Add your first trade or import a CSV to get started</p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Link to="/trade-log">
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
                  <Upload className="h-3.5 w-3.5" />
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