import { useThemePresets } from '@/contexts/theme-presets'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts } from '@/contexts/account-context'
import { useSettings } from '@/contexts/settings-context'
import { DataTable } from "@/components/data-table"
import { CalendarHeatmap } from "@/components/calendar-heatmap"
import { TradingCoach } from "@/components/trading-coach"
import { SiteHeader } from "@/components/site-header"
import { AppFooter } from "@/components/app-footer"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Upload, FileText, Calendar, CheckCircle2, AlertCircle, TrendingUp, UserPlus } from "lucide-react"
import { useState, useEffect, useMemo, lazy, Suspense } from "react"
import { toast } from 'sonner'
import { parseCSV, validateCSVFile, type CSVParseResult } from '@/utils/csv-parser'
import { useDemoData } from '@/hooks/use-demo-data'
import { DemoCtaCard } from '@/components/demo-cta-card'
import { useUserStorage } from '@/utils/user-storage'
import { PROP_FIRMS, MARKET_INSTRUMENTS, type MarketType } from '@/constants/trading'
import { LATEST_CHANGELOG_VERSION } from '@/constants/changelog'
import { WhatsNewDialog } from '@/components/whats-new-dialog'

// Lazy load chart components to reduce initial bundle size
const SectionCards = lazy(() => import("@/components/section-cards").then(m => ({ default: m.SectionCards })))
const ChartAreaInteractive = lazy(() => import("@/components/chart-area-interactive").then(m => ({ default: m.ChartAreaInteractive })))
const ChartRadarDefault = lazy(() => import("@/components/chart-radar-default").then(m => ({ default: m.ChartRadarDefault })))
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
  const { themeColors, alpha } = useThemePresets()
  const { user, isDemo, exitDemoMode } = useAuth()
  const { activeAccount } = useAccounts()
  const { formatCurrency: formatCurrencyFromSettings, settings } = useSettings()
  const { getTrades } = useDemoData()
  const userStorage = useUserStorage()
  const [dataVersion, setDataVersion] = useState(0)

  // Compute account balance
  const accountBalance = useMemo(() => {
    const tradesData = getTrades()
    const totalPnL = tradesData.reduce((sum: number, t: any) => sum + (Number(t.pnl) || 0), 0)
    return (activeAccount?.balance || settings.accountSize || 10000) + totalPnL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTrades, activeAccount, settings.accountSize, dataVersion])
  const [isLoading, setIsLoading] = useState(false)
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
  const [csvUploadState, setCsvUploadState] = useState({
    isUploading: false,
  })
  const [csvPreview, setCsvPreview] = useState<{
    show: boolean;
    file: File | null;
    parseResult: CSVParseResult | null;
  }>({ show: false, file: null, parseResult: null })
  const [importProgress, setImportProgress] = useState<{
    active: boolean;
    phase: string;
    percent: number;
  }>({ active: false, phase: '', percent: 0 })
  const [showWhatsNew, setShowWhatsNew] = useState(false)

  useEffect(() => {
    const lastSeen = userStorage.getItem('lastSeenChangelog')
    if (lastSeen !== LATEST_CHANGELOG_VERSION) {
      setShowWhatsNew(true)
      userStorage.setItem('lastSeenChangelog', LATEST_CHANGELOG_VERSION)
    }
  }, [userStorage])

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

  const getInstrumentsByMarket = (market: MarketType) => {
    return MARKET_INSTRUMENTS[market] || [];
  }

  const handleSaveTrade = () => {
    if (!tradeForm.symbol || !tradeForm.entryPrice || !tradeForm.exitPrice) return
    
    if (isDemo) {
      toast.info('Sign up to save your real trades!');
      return;
    }
    
    const savedTrades = userStorage.getItem('trades')
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
    userStorage.setItem('trades', JSON.stringify(trades))
    
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

    const file = files[0];
    setCsvUploadState({ isUploading: true });

    try {
      const content = await validateCSVFile(file);
      const result = parseCSV(content);

      // Close the trade modal and show preview dialog
      setIsTradeModalOpen(false);
      setCsvPreview({
        show: true,
        file: file,
        parseResult: result
      });

    } catch (error) {
      toast.error('File Import Error', {
        description: error instanceof Error ? error.message : 'Failed to read file',
        duration: 5000
      });
    } finally {
      setCsvUploadState({ isUploading: false });
      // Reset the file input
      event.target.value = '';
    }
  };

  // New function to actually perform the import after confirmation
  const handleConfirmImport = async () => {
    if (!csvPreview.parseResult || !csvPreview.file) return;

    const { parseResult: result, file } = csvPreview;

    setCsvPreview({ show: false, file: null, parseResult: null });
    setImportProgress({ active: true, phase: 'Reading existing trades...', percent: 20 });

    try {
      if (result.success) {
        const savedTrades = userStorage.getItem('trades');
        let existingTrades: any[] = [];

        if (savedTrades) {
          try {
            existingTrades = JSON.parse(savedTrades);
          } catch {
            existingTrades = [];
          }
        }

        setImportProgress({ active: true, phase: 'Processing trades...', percent: 50 });

        // Convert parsed trades to dashboard format with accountId
        const importedTrades = result.trades.map((trade, index) => ({
          id: `dashboard-import-${Date.now()}-${index}`,
          accountId: activeAccount?.id || 'default-main-account',
          symbol: trade.symbol,
          side: trade.side,
          entryPrice: parseFloat(trade.entryPrice) || 0,
          exitPrice: parseFloat(trade.exitPrice) || 0,
          lotSize: parseFloat(trade.quantity) || 1,
          entryTime: new Date(`${trade.date}T00:00:00`),
          exitTime: new Date(`${trade.date}T00:00:00`),
          spread: 0,
          commission: 0,
          swap: 0,
          pnl: parseFloat(trade.pnl) || 0,
          pnlPercentage: 0,
          riskReward: 0,
          notes: `Imported from ${file.name} via Dashboard`,
          strategy: '',
          market: 'forex',
          propFirm: ''
        }));

        setImportProgress({ active: true, phase: 'Checking for duplicates...', percent: 70 });

        // Deduplicate: fingerprint on key fields to skip already-imported trades
        const tradeFingerprint = (t: any) =>
          `${t.symbol}|${t.side}|${t.entryPrice}|${t.exitPrice}|${t.lotSize}|${t.pnl}|${new Date(t.entryTime).getTime()}|${new Date(t.exitTime).getTime()}`;

        const existingFingerprints = new Set(existingTrades.map(tradeFingerprint));
        const newTrades = importedTrades.filter((t: any) => !existingFingerprints.has(tradeFingerprint(t)));
        const skippedCount = importedTrades.length - newTrades.length;

        setImportProgress({ active: true, phase: 'Saving trades...', percent: 90 });

        const updatedTrades = [...existingTrades, ...newTrades];
        userStorage.setItem('trades', JSON.stringify(updatedTrades));

        // Brief pause so user sees 100%
        setImportProgress({ active: true, phase: 'Done!', percent: 100 });
        await new Promise(r => setTimeout(r, 500));
        setImportProgress({ active: false, phase: '', percent: 0 });

        // Bump version to re-render dashboard with new data
        setDataVersion(v => v + 1);

        toast.success(
          newTrades.length > 0
            ? `Imported ${newTrades.length} new trade${newTrades.length > 1 ? 's' : ''} from ${file.name}`
            : `No new trades to import from ${file.name}`,
          {
            description: skippedCount > 0
              ? `${skippedCount} duplicate trade${skippedCount > 1 ? 's' : ''} skipped`
              : result.errors.length > 0
                ? `${result.summary.failed} rows had errors and were skipped`
                : undefined,
            duration: 5000
          }
        );

      } else {
        toast.error('Failed to import file', {
          description: result.errors.join(', ')
        });
        setImportProgress({ active: false, phase: '', percent: 0 });
      }

    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import file');
      setImportProgress({ active: false, phase: '', percent: 0 });
    }
  };

  // Generate personalized greeting with consistent length to prevent layout shift
  const getGreeting = () => {
    const hour = new Date().getHours()
    // Limit firstName length to prevent layout shift with very long names
    const firstName = user?.displayName?.split(' ')[0]?.substring(0, 15) || 'Trader'
    
    // Use consistent greeting length to prevent layout shift
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

  // Compute dynamic header stats from trades
  const headerInsight = useMemo((): React.ReactNode => {
    const tradesData = getTrades()
    if (!tradesData || tradesData.length === 0) {
      return 'Add your first trade or import a CSV to get started'
    }

    const trades = tradesData.map((t: any) => ({
      pnl: Number(t.pnl) || 0,
      exitTime: new Date(t.exitTime),
    }))

    const totalPnl = trades.reduce((s: number, t: { pnl: number }) => s + t.pnl, 0)
    const wins = trades.filter((t: { pnl: number }) => t.pnl > 0).length
    const winRate = Math.round((wins / trades.length) * 100)

    // Calculate current win/loss streak
    const sorted = [...trades].sort((a: { exitTime: Date }, b: { exitTime: Date }) => b.exitTime.getTime() - a.exitTime.getTime())
    let streak = 0
    const streakPositive = sorted[0]?.pnl > 0
    for (const t of sorted) {
      if ((t.pnl > 0) === streakPositive && t.pnl !== 0) streak++
      else break
    }

    // Trades this week
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const thisWeek = trades.filter((t: { exitTime: Date }) => t.exitTime >= weekStart)
    const weekPnl = thisWeek.reduce((s: number, t: { pnl: number }) => s + t.pnl, 0)

    const pnlColor = totalPnl >= 0 ? themeColors.profit : themeColors.loss
    const weekPnlColor = weekPnl >= 0 ? themeColors.profit : themeColors.loss
    const winRateColor = winRate >= 50 ? themeColors.profit : themeColors.loss

    // Pick the most interesting insight
    if (streak >= 3 && streakPositive) {
      return <>{trades.length} trades · <span style={{ color: themeColors.profit }}>{streak}-trade win streak</span></>
    }
    if (thisWeek.length > 0) {
      const sign = weekPnl >= 0 ? '+' : ''
      return <>{thisWeek.length} trade{thisWeek.length === 1 ? '' : 's'} this week · <span style={{ color: weekPnlColor }}>{sign}${weekPnl.toFixed(2)}</span> P&L</>
    }
    if (trades.length > 0) {
      const sign = totalPnl >= 0 ? '+' : ''
      return <>{trades.length} trades · <span style={{ color: pnlColor }}>{sign}${totalPnl.toFixed(2)}</span> P&L · <span style={{ color: winRateColor }}>{winRate}%</span> win rate</>
    }
    return 'Track your performance and analyze your trades'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTrades, themeColors.profit, themeColors.loss, dataVersion])

  // No loading state needed - render content immediately

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
      <div className="min-h-screen bg-background">
        {/* Header Skeleton - Match exact layout */}
        <div className="border-b">
          <div className="w-full px-3 py-4 sm:px-6 lg:px-8 sm:py-6">
            <div className="flex flex-col gap-4">
              <div className="space-y-3 sm:space-y-4">
                {/* Personalized Greeting Skeleton */}
                <div className="space-y-1 text-center sm:text-left">
                  <Skeleton className="h-5 sm:h-7 w-72 mx-auto sm:mx-0" />
                  <Skeleton className="h-4 sm:h-5 w-80 mx-auto sm:mx-0" />
                </div>

                {/* Dashboard Title Skeleton */}
                <div className="space-y-2 text-center sm:text-left">
                  <Skeleton className="h-7 sm:h-8 md:h-12 lg:h-16 w-64 sm:w-96 mx-auto sm:mx-0" />
                  <Skeleton className="h-4 sm:h-5 md:h-7 w-80 sm:w-full max-w-2xl mx-auto sm:mx-0" />
                </div>
              </div>
              
              {/* Quick Actions Skeleton */}
              <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3">
                <Skeleton className="h-10 sm:h-11 w-32" />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12 animate-in fade-in-0 duration-500">
          {/* Metrics Cards Skeleton */}
          <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-4">
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
    <>
      <div className="min-h-screen bg-background">
      <SiteHeader />
      {/* Mobile-optimized Header Section */}
      <div className="border-b" style={{ contain: 'layout', transform: 'translate3d(0,0,0)' }}>
        <div className="w-full px-3 py-4 sm:px-6 lg:px-8 sm:py-6">
          <div className="flex flex-col gap-2">
            {/* Greeting + Date */}
            <div className="text-center sm:text-left">
              <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>
                {getGreeting()}
              </h1>
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            {/* Insight + action button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-muted-foreground text-sm font-medium max-w-2xl text-center sm:text-left">
                {headerInsight}
              </p>

              {/* Quick Actions - inline with title on desktop */}
              <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 flex-shrink-0">
              {isDemo ? (
                <Link to="/signup" onClick={() => exitDemoMode()}>
                  <Button
                    size="default"
                    className="gap-2 h-11 touch-manipulation !bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] text-black font-semibold hover:text-black"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign Up to Add Trades</span>
                    <span className="sm:hidden">Sign Up</span>
                  </Button>
                </Link>
              ) : (
              <Dialog open={isTradeModalOpen} onOpenChange={setIsTradeModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="default"
                    className="gap-2 h-11 touch-manipulation"
                    style={{backgroundColor: themeColors.primary || 'hsl(var(--primary))', color: themeColors.primaryButtonText}}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Trade</span>
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
                        <Label htmlFor="trade-market">Market</Label>
                        <Select value={tradeForm.market} onValueChange={(value: MarketType) => {
                          setTradeForm(prev => ({ ...prev, market: value, symbol: "" }))
                        }}>
                          <SelectTrigger id="trade-market">
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
                        <Label htmlFor="trade-side">Side</Label>
                        <Select value={tradeForm.side} onValueChange={(value: "long" | "short") => setTradeForm(prev => ({ ...prev, side: value }))}>
                          <SelectTrigger id="trade-side">
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
                        <Label htmlFor="trade-symbol">Symbol</Label>
                        <Select value={tradeForm.symbol} onValueChange={(value) => setTradeForm(prev => ({ ...prev, symbol: value }))}>
                          <SelectTrigger id="trade-symbol">
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
                        <Label htmlFor="trade-prop-firm">Prop Firm</Label>
                        <Select value={tradeForm.propFirm} onValueChange={(value) => setTradeForm(prev => ({ ...prev, propFirm: value }))}>
                          <SelectTrigger id="trade-prop-firm">
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {PROP_FIRMS.map((firm) => (
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
                          placeholder="1.08450…"
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
                          placeholder="1.08650…"
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
                          placeholder="1.00…"
                          value={tradeForm.lotSize}
                          onChange={(e) => setTradeForm(prev => ({ ...prev, lotSize: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="trade-strategy">Strategy</Label>
                        <Input
                          id="trade-strategy"
                          placeholder="Breakout, Support/Resistance, etc.…"
                          value={tradeForm.strategy}
                          onChange={(e) => setTradeForm(prev => ({ ...prev, strategy: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trade-notes">Notes</Label>
                      <Textarea
                        id="trade-notes"
                        placeholder="Trade reasoning, market conditions, etc.…"
                        value={tradeForm.notes}
                        onChange={(e) => setTradeForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t gap-3 sm:gap-0">
                      <div className="flex gap-2">
                        <Link to="/trades" onClick={() => setIsTradeModalOpen(false)}>
                          <Button variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Full Trade Journal
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => document.getElementById('dashboard-csv-import')?.click()}
                          disabled={csvUploadState.isUploading}
                        >
                          <Upload className="h-4 w-4" />
                          {csvUploadState.isUploading ? 'Importing...' : 'Import CSV'}
                        </Button>
                        <input
                          id="dashboard-csv-import"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          aria-label="Import CSV file"
                          onChange={handleCSVImport}
                        />
                      </div>
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
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-optimized Main Content */}
      <div className="w-full px-3 py-4 sm:px-6 lg:px-8 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Top metrics row */}
        <div>
          <Suspense fallback={<div className="grid grid-cols-2 2xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>}>
            <SectionCards />
          </Suspense>
        </div>

        {/* AI Trading Coach */}
        <div>
          <TradingCoach />
        </div>

        {/* Equity curve — full width hero */}
        <div>
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <ChartAreaInteractive />
          </Suspense>
        </div>

        {/* Recent trades — full width below */}
        <div>
          <DataTable />
        </div>

        {/* Pairs Performance Radar */}
        <div>
          <Suspense fallback={<Skeleton className="h-[450px] w-full" />}>
            <ChartRadarDefault />
          </Suspense>
        </div>

        {/* Calendar Section */}
        <div>
          <CalendarHeatmap />
        </div>

        {/* Demo CTA Card - Only show in demo mode */}
        {isDemo && (
          <div className="mt-8">
            <DemoCtaCard />
          </div>
        )}
      </div>
      
      {/* CSV Preview Dialog */}
      <Dialog open={csvPreview.show} onOpenChange={(open) => setCsvPreview(prev => ({ ...prev, show: open }))}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-2xl lg:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 flex-shrink-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
              Import Preview
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground">
              Review your trading data before importing to Dashboard
            </DialogDescription>
          </DialogHeader>

          {csvPreview.parseResult && (
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0">
              {/* Compact Status Banner */}
              <div
                className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-lg px-3 sm:px-4 py-2.5 border"
                style={{
                  backgroundColor: csvPreview.parseResult.summary.failed > 0 ? `${alpha(themeColors.loss, '08')}` : `${alpha(themeColors.profit, '08')}`,
                  borderColor: csvPreview.parseResult.summary.failed > 0 ? `${alpha(themeColors.loss, '20')}` : `${alpha(themeColors.profit, '20')}`
                }}
              >
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate" title={csvPreview.file?.name}>{csvPreview.file?.name}</span>
                <span className="text-muted-foreground text-sm">—</span>
                <span className="text-sm font-semibold" style={{ color: themeColors.profit }}>
                  {csvPreview.parseResult.summary.successfulParsed} trades
                </span>
                {csvPreview.parseResult.summary.failed > 0 && (
                  <>
                    <span className="text-muted-foreground text-sm">·</span>
                    <span className="text-sm font-semibold" style={{ color: themeColors.loss }}>
                      {csvPreview.parseResult.summary.failed} errors
                    </span>
                  </>
                )}
                {csvPreview.parseResult.summary.dateRange && (
                  <span className="hidden sm:flex items-center gap-2 ml-auto">
                    <span className="text-muted-foreground text-sm">·</span>
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {csvPreview.parseResult.summary.dateRange.earliest} — {csvPreview.parseResult.summary.dateRange.latest}
                    </span>
                  </span>
                )}
              </div>

              {/* Trade Summary Stats */}
              {csvPreview.parseResult.trades.length > 0 && (() => {
                const trades = csvPreview.parseResult!.trades;
                const pnls = trades.map(t => parseFloat(t.pnl));
                const totalPnl = pnls.reduce((sum, p) => sum + p, 0);
                const winCount = pnls.filter(p => p > 0).length;
                const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0;
                const bestTrade = Math.max(...pnls);
                const worstTrade = Math.min(...pnls);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg border bg-card px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total P&L</p>
                      <p className="text-lg font-bold" style={{ color: totalPnl >= 0 ? themeColors.profit : themeColors.loss }}>
                        {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                      <p className="text-lg font-bold" style={{ color: winRate >= 50 ? themeColors.profit : themeColors.loss }}>
                        {winRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Best Trade</p>
                      <p className="text-lg font-bold" style={{ color: themeColors.profit }}>
                        +${bestTrade.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Worst Trade</p>
                      <p className="text-lg font-bold" style={{ color: themeColors.loss }}>
                        ${worstTrade.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Sample Preview - Theme Aware Table */}
              {csvPreview.parseResult.trades.length > 0 && (
                <div className="bg-card rounded-xl border overflow-hidden">
                  <div
                    className="px-6 py-3 border-b"
                    style={{ backgroundColor: `${alpha(themeColors.primary, '10')}` }}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" style={{ color: themeColors.primary }} />
                      <h3 className="font-semibold text-foreground text-sm">
                        Trade Preview <span className="font-normal text-muted-foreground">(First 5 rows)</span>
                      </h3>
                    </div>
                  </div>

                  {/* Mobile card view */}
                  <div className="sm:hidden divide-y">
                    {csvPreview.parseResult.trades.slice(0, 5).map((trade, index) => (
                      <div key={index} className="px-4 py-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{trade.symbol}</span>
                            <Badge
                              className="text-[10px] px-1.5 py-0.5 border"
                              style={{
                                backgroundColor: trade.side === 'long'
                                  ? `${alpha(themeColors.profit, '15')}`
                                  : `${alpha(themeColors.loss, '15')}`,
                                color: trade.side === 'long'
                                  ? themeColors.profit
                                  : themeColors.loss,
                                borderColor: trade.side === 'long'
                                  ? `${alpha(themeColors.profit, '30')}`
                                  : `${alpha(themeColors.loss, '30')}`
                              }}
                            >
                              {trade.side.toUpperCase()}
                            </Badge>
                          </div>
                          <span
                            className="font-bold text-sm"
                            style={{
                              color: parseFloat(trade.pnl) >= 0
                                ? themeColors.profit
                                : themeColors.loss
                            }}
                          >
                            {parseFloat(trade.pnl) >= 0 ? '+' : ''}${parseFloat(trade.pnl).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{parseFloat(trade.entryPrice).toFixed(4)} → {parseFloat(trade.exitPrice).toFixed(4)}</span>
                          <span>·</span>
                          <span>{trade.quantity} lots</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table view */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                          <TableHead className="font-semibold">Symbol</TableHead>
                          <TableHead className="font-semibold">Side</TableHead>
                          <TableHead className="font-semibold">Entry</TableHead>
                          <TableHead className="font-semibold">Exit</TableHead>
                          <TableHead className="font-semibold">Size</TableHead>
                          <TableHead className="font-semibold">P&L</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvPreview.parseResult.trades.slice(0, 5).map((trade, index) => (
                          <TableRow key={index} className="hover:bg-black/[0.03] dark:hover:bg-white/[0.06] border-border">
                            <TableCell className="font-semibold text-foreground">
                              {trade.symbol}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className="text-xs px-2.5 py-1 border"
                                style={{
                                  backgroundColor: trade.side === 'long'
                                    ? `${alpha(themeColors.profit, '15')}`
                                    : `${alpha(themeColors.loss, '15')}`,
                                  color: trade.side === 'long'
                                    ? themeColors.profit
                                    : themeColors.loss,
                                  borderColor: trade.side === 'long'
                                    ? `${alpha(themeColors.profit, '30')}`
                                    : `${alpha(themeColors.loss, '30')}`
                                }}
                              >
                                {trade.side.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-sm">
                              {parseFloat(trade.entryPrice).toFixed(4)}
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-sm">
                              {parseFloat(trade.exitPrice).toFixed(4)}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {trade.quantity}
                            </TableCell>
                            <TableCell
                              className="font-bold"
                              style={{
                                color: parseFloat(trade.pnl) >= 0
                                  ? themeColors.profit
                                  : themeColors.loss
                              }}
                            >
                              {parseFloat(trade.pnl) >= 0 ? '+' : ''}${parseFloat(trade.pnl).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {csvPreview.parseResult.trades.length > 5 && (
                    <div
                      className="px-6 py-2.5 border-t text-center"
                      style={{ backgroundColor: `${alpha(themeColors.primary, '05')}` }}
                    >
                      <p className="text-xs text-muted-foreground">
                        + {csvPreview.parseResult.trades.length - 5} more trades will be imported
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Errors */}
              {csvPreview.parseResult.errors.length > 0 && (
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{
                    backgroundColor: `${alpha(themeColors.loss, '08')}`,
                    borderColor: `${alpha(themeColors.loss, '30')}`
                  }}
                >
                  <div
                    className="px-6 py-3 border-b"
                    style={{
                      backgroundColor: `${alpha(themeColors.loss, '15')}`,
                      borderColor: `${alpha(themeColors.loss, '30')}`
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" style={{ color: themeColors.loss }} />
                      <h3 className="font-semibold text-sm" style={{ color: themeColors.loss }}>
                        Import Warnings ({csvPreview.parseResult.errors.length})
                      </h3>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {csvPreview.parseResult.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: themeColors.loss }}></div>
                          <p style={{ color: themeColors.loss }}>{error}</p>
                        </div>
                      ))}
                      {csvPreview.parseResult.errors.length > 5 && (
                        <p className="text-xs pl-4" style={{ color: themeColors.loss }}>
                          + {csvPreview.parseResult.errors.length - 5} more errors...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col items-center gap-3 pt-4 border-t border-border flex-shrink-0">
                <div className="text-sm text-muted-foreground">
                  {csvPreview.parseResult.trades.length > 0 ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{ color: themeColors.profit }} />
                      Ready to import {csvPreview.parseResult.trades.length} trades
                    </span>
                  ) : (
                    <span className="flex items-center gap-2" style={{ color: themeColors.loss }}>
                      <AlertCircle className="h-4 w-4" />
                      No valid trades to import
                    </span>
                  )}
                </div>

                <p className="hidden sm:block text-xs text-muted-foreground text-center">
                  Already imported this file before? No worries — duplicate trades are automatically detected and skipped.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCsvPreview({ show: false, file: null, parseResult: null })}
                    className="hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmImport}
                    disabled={csvUploadState.isUploading || csvPreview.parseResult.trades.length === 0}
                    style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                    className="hover:opacity-90 shadow-lg px-6 font-medium"
                  >
                    {csvUploadState.isUploading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Importing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Import {csvPreview.parseResult.trades.length} Trades
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Progress Overlay */}
      {importProgress.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-[90vw] max-w-sm rounded-xl border bg-card p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: themeColors.primary, borderTopColor: 'transparent' }} />
              <p className="text-sm font-medium">{importProgress.phase}</p>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${importProgress.percent}%`, backgroundColor: themeColors.primary }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{importProgress.percent}%</p>
          </div>
        </div>
      )}

      </div>
      <AppFooter />
      <WhatsNewDialog open={showWhatsNew} onOpenChange={setShowWhatsNew} />
    </>
  )
}