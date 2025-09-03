import { useThemePresets } from '@/contexts/theme-presets'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts } from '@/contexts/account-context'
import { DataTable } from "@/components/data-table"
import { CalendarHeatmap } from "@/components/calendar-heatmap"
import { TradingCoach } from "@/components/trading-coach"
import { SiteHeader } from "@/components/site-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import { useState, useEffect, lazy, Suspense } from "react"
import { toast } from 'sonner'
import { parseCSV, validateCSVFile } from '@/utils/csv-parser'

// Lazy load chart components to reduce initial bundle size
const SectionCards = lazy(() => import("@/components/section-cards").then(m => ({ default: m.SectionCards })))
const ChartAreaInteractive = lazy(() => import("@/components/chart-area-interactive").then(m => ({ default: m.ChartAreaInteractive })))
import { Link } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function Dashboard() {
  const { themeColors } = useThemePresets()
  const { user } = useAuth()
  const { activeAccount } = useAccounts()
  const [isLoading, setIsLoading] = useState(true)
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
  const [csvUploadState, setCsvUploadState] = useState({
    isUploading: false,
  })
  const [tradeForm, setTradeForm] = useState({
    symbol: "",
    side: "long" as "long" | "short",
    market: "forex" as "forex" | "futures" | "indices",
    entryPrice: "",
    exitPrice: "",
    lotSize: "",
    pnl: "",
    strategy: "",
    notes: "",
    propFirm: "none"
  })

  const propFirms = [
    "E8 Markets", "Funded FX", "FundingPips", "TopStep",
    "FTMO", "Alpha Capital Group", "Apex Trader Funding", "The5ers"
  ]

  const getInstrumentsByMarket = (market: string) => {
    switch (market) {
      case 'forex':
        return ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP'];
      case 'futures':
        return ['ES', 'NQ', 'YM', 'RTY', 'CL', 'GC', 'SI', 'ZB', 'ZN', 'ZF'];
      case 'indices':
        return ['SPX500', 'NAS100', 'US30', 'GER40', 'UK100', 'FRA40', 'JPN225', 'AUS200'];
      default:
        return [];
    }
  }

  const handleSaveTrade = () => {
    if (!tradeForm.symbol || !tradeForm.entryPrice || !tradeForm.exitPrice) return
    
    const savedTrades = localStorage.getItem('trades')
    let trades = []
    
    if (savedTrades) {
      try {
        trades = JSON.parse(savedTrades)
      } catch {
        trades = []
      }
    }
    
    const entryPrice = parseFloat(tradeForm.entryPrice)
    const exitPrice = parseFloat(tradeForm.exitPrice)
    const lotSize = parseFloat(tradeForm.lotSize) || 1
    const pnl = parseFloat(tradeForm.pnl) || ((exitPrice - entryPrice) * lotSize * (tradeForm.side === 'long' ? 1 : -1))
    
    const newTrade = {
      id: Date.now().toString(),
      accountId: activeAccount?.id || 'default',
      symbol: tradeForm.symbol.toUpperCase(),
      side: tradeForm.side,
      entryPrice,
      exitPrice,
      lotSize,
      entryTime: new Date(),
      exitTime: new Date(),
      spread: 0,
      commission: 0,
      swap: 0,
      pnl,
      pnlPercentage: entryPrice > 0 ? (pnl / (entryPrice * lotSize)) * 100 : 0,
      notes: tradeForm.notes,
      strategy: tradeForm.strategy,
      market: tradeForm.market,
      propFirm: tradeForm.propFirm === "none" ? "" : tradeForm.propFirm
    }
    
    trades.unshift(newTrade)
    localStorage.setItem('trades', JSON.stringify(trades))
    
    // Reset form
    setTradeForm({
      symbol: "",
      side: "long",
      market: "forex",
      entryPrice: "",
      exitPrice: "",
      lotSize: "",
      pnl: "",
      strategy: "",
      notes: "",
      propFirm: "none"
    })
    
    setIsTradeModalOpen(false)
  }

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setCsvUploadState({ isUploading: true });
    let totalSuccessful = 0;
    let totalFailed = 0;

    try {
      for (const file of files) {
        try {
          const content = await validateCSVFile(file);
          const result = parseCSV(content);
          
          if (result.success) {
            const savedTrades = localStorage.getItem('trades');
            let existingTrades = [];
            
            if (savedTrades) {
              try {
                existingTrades = JSON.parse(savedTrades);
              } catch {
                existingTrades = [];
              }
            }

            // Convert parsed trades to dashboard format with accountId
            const importedTrades = result.trades.map((trade, index) => ({
              id: `dashboard-import-${Date.now()}-${index}`,
              accountId: activeAccount?.id || 'default-main-account',
              symbol: trade.symbol.toUpperCase(),
              side: trade.side,
              entryPrice: parseFloat(trade.entryPrice) || 0,
              exitPrice: parseFloat(trade.exitPrice) || 0,
              lotSize: parseFloat(trade.quantity) || 1,
              entryTime: new Date(trade.date),
              exitTime: new Date(trade.date),
              spread: 0,
              commission: 0,
              swap: 0,
              pnl: parseFloat(trade.pnl) || 0,
              pnlPercentage: 0,
              notes: `Imported from ${file.name} via Dashboard`,
              strategy: '',
              market: 'forex',
              propFirm: ''
            }));
            
            const updatedTrades = [...existingTrades, ...importedTrades];
            localStorage.setItem('trades', JSON.stringify(updatedTrades));
            
            totalSuccessful += result.summary.successfulParsed;
            totalFailed += result.summary.failed;
          }
        } catch (fileError) {
          totalFailed++;
        }
      }
      
      if (totalSuccessful > 0) {
        toast.success(`CSV Import Successful!`, {
          description: `Imported ${totalSuccessful} trades${totalFailed > 0 ? `. ${totalFailed} rows were skipped due to errors.` : ''}`,
          duration: 5000
        });
      } else {
        toast.error('CSV Import Failed', {
          description: 'No valid trades found in the file',
          duration: 5000
        });
      }
      
    } catch (error) {
      toast.error('CSV Import Failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000
      });
    } finally {
      setCsvUploadState({ isUploading: false });
      // Clear the file input
      event.target.value = '';
    }
  };

  // Generate personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    const firstName = user?.displayName?.split(' ')[0] || 'Trader'
    
    if (hour >= 5 && hour < 12) {
      return `Good morning, ${firstName}!`
    } else if (hour >= 12 && hour < 17) {
      return `Good afternoon, ${firstName}!`
    } else if (hour >= 17 && hour < 22) {
      return `Good evening, ${firstName}!`
    } else {
      return `Welcome back, ${firstName}!`
    }
  }

  useEffect(() => {
    // Simulate initial load time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // Skeleton loader components
  const MetricCardSkeleton = () => (
    <div className="bg-muted/30 backdrop-blur-sm rounded-lg border-0 p-6 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )

  const ChartSkeleton = ({ height = "h-[400px]" }) => (
    <div className={`bg-muted/30 backdrop-blur-sm rounded-lg border p-6 ${height}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-full w-full rounded" />
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header Skeleton */}
        <div className="border-b bg-card/80 backdrop-blur-xl">
          <div className="w-full px-4 py-4 sm:px-6 lg:px-8 sm:py-6 md:py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-3">
                <Skeleton className="h-12 w-80" />
                <Skeleton className="h-6 w-96" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12 animate-in fade-in-0 duration-500">
          {/* Metrics Cards Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ChartSkeleton />
            </div>
            <div className="lg:col-span-1">
              <ChartSkeleton />
            </div>
          </div>

          {/* Calendar Skeleton */}
          <ChartSkeleton height="h-[500px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {/* Mobile-optimized Header Section */}
      <div className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="w-full px-3 py-4 sm:px-6 lg:px-8 sm:py-6">
          <div className="flex flex-col gap-4">
            <div className="space-y-3 sm:space-y-4">
              {/* Personalized Greeting */}
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-base sm:text-lg font-semibold text-foreground opacity-90">
                  {getGreeting()}
                </p>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              
              {/* Dashboard Title */}
              <div className="space-y-2 text-center sm:text-left">
                <h1 
                  className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black bg-clip-text text-transparent leading-tight pb-1"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.primary}DD, ${themeColors.primary}AA)`
                  }}
                >
                  Trading Dashboard
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-lg font-medium max-w-2xl mx-auto sm:mx-0">
                  Track your performance and analyze your trades
                </p>
              </div>
            </div>
            
            {/* Quick Actions - Centered on mobile */}
            <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3">
              <Dialog open={isTradeModalOpen} onOpenChange={setIsTradeModalOpen}>
                <DialogTrigger asChild>
                  <Button size="default" className="gap-2 h-10 sm:h-11 touch-manipulation">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm sm:text-base">Add Trade</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Trade</DialogTitle>
                    <DialogDescription>
                      Quick trade entry for your dashboard
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Market</Label>
                        <Select value={tradeForm.market} onValueChange={(value: "forex" | "futures" | "indices") => {
                          setTradeForm(prev => ({ ...prev, market: value, symbol: "" }))
                        }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="forex">💱 Forex</SelectItem>
                            <SelectItem value="futures">📊 Futures</SelectItem>
                            <SelectItem value="indices">📈 Indices</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Side</Label>
                        <Select value={tradeForm.side} onValueChange={(value: "long" | "short") => setTradeForm(prev => ({ ...prev, side: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="long">📈 Long (Buy)</SelectItem>
                            <SelectItem value="short">📉 Short (Sell)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Symbol</Label>
                        <Select value={tradeForm.symbol} onValueChange={(value) => setTradeForm(prev => ({ ...prev, symbol: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select instrument" />
                          </SelectTrigger>
                          <SelectContent>
                            {getInstrumentsByMarket(tradeForm.market).map((instrument) => (
                              <SelectItem key={instrument} value={instrument}>
                                {instrument}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Prop Firm</Label>
                        <Select value={tradeForm.propFirm} onValueChange={(value) => setTradeForm(prev => ({ ...prev, propFirm: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {propFirms.map((firm) => (
                              <SelectItem key={firm} value={firm}>
                                {firm}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="entry-price">Entry Price</Label>
                        <Input
                          id="entry-price"
                          type="number"
                          step="0.00001"
                          placeholder="1.08450"
                          value={tradeForm.entryPrice}
                          onChange={(e) => setTradeForm(prev => ({ ...prev, entryPrice: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="exit-price">Exit Price</Label>
                        <Input
                          id="exit-price"
                          type="number"
                          step="0.00001"
                          placeholder="1.08650"
                          value={tradeForm.exitPrice}
                          onChange={(e) => setTradeForm(prev => ({ ...prev, exitPrice: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lot-size">Lot Size</Label>
                        <Input
                          id="lot-size"
                          type="number"
                          step="0.01"
                          placeholder="1.00"
                          value={tradeForm.lotSize}
                          onChange={(e) => setTradeForm(prev => ({ ...prev, lotSize: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="trade-strategy">Strategy</Label>
                        <Input
                          id="trade-strategy"
                          placeholder="Breakout, Support/Resistance, etc."
                          value={tradeForm.strategy}
                          onChange={(e) => setTradeForm(prev => ({ ...prev, strategy: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trade-notes">Notes</Label>
                      <Textarea
                        id="trade-notes"
                        placeholder="Trade reasoning, market conditions, etc."
                        value={tradeForm.notes}
                        onChange={(e) => setTradeForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t gap-3 sm:gap-0">
                      <Link to="/trades" onClick={() => setIsTradeModalOpen(false)}>
                        <Button variant="outline" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Full Trade Journal
                        </Button>
                      </Link>
                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <Button variant="outline" onClick={() => setIsTradeModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveTrade} 
                          disabled={!tradeForm.symbol || !tradeForm.entryPrice || !tradeForm.exitPrice}
                        >
                          Save Trade
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                size="default" 
                className="gap-2 h-10 sm:h-11 touch-manipulation"
                onClick={() => document.getElementById('dashboard-csv-import')?.click()}
                disabled={csvUploadState.isUploading}
              >
                <Upload className="h-4 w-4" />
                <span className="text-sm sm:text-base">
                  {csvUploadState.isUploading ? 'Importing...' : 'Import CSV'}
                </span>
              </Button>
              <input
                id="dashboard-csv-import"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSVImport}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-optimized Main Content */}
      <div className="w-full px-3 py-4 sm:px-6 lg:px-8 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Top metrics row */}
        <div className="animate-in fade-in duration-300">
          <Suspense fallback={<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>}>
            <SectionCards />
          </Suspense>
        </div>
        
        {/* AI Trading Coach */}
        <div className="animate-in fade-in duration-300 delay-50">
          <TradingCoach />
        </div>
        
        {/* Main content area - Stack on mobile, side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 animate-in fade-in duration-300 delay-100">
          {/* Recent trades - Show first on mobile for quick access */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <DataTable />
          </div>
          
          {/* Equity curve */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <ChartAreaInteractive />
            </Suspense>
          </div>
        </div>
        
        {/* Calendar Section */}
        <div className="animate-in fade-in duration-300 delay-150">
          <CalendarHeatmap />
        </div>
      </div>
      
    </div>
  )
}