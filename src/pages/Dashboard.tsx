import { useThemePresets } from '@/contexts/theme-presets'
import { trackEvent } from '@/lib/analytics'
import { useAuth } from '@/contexts/auth-context'
import { useProStatus } from '@/contexts/pro-context'
import { useAccounts } from '@/contexts/account-context'
import { useSettings } from '@/contexts/settings-context'
import { notifyDataChange } from '@/contexts/sync-context'
import { buildImportedTrades, dedupeImportedTrades, buildColumnMapping, type ColumnMapping } from '@/utils/import-trades'
import { ColumnMappingDialog } from '@/components/column-mapping-dialog'
import { headerSignature, rememberMapping, trackImportMapped } from '@/utils/csv-import-memory'
import { rescueFailedImport } from '@/utils/csv-import-flow'
import { ErrorBoundary } from '@/components/error-boundary'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SiteHeader } from "@/components/site-header"
import { AppFooter } from "@/components/app-footer"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, CaretDown, UploadSimple, FileText, Calendar, CheckCircle, WarningCircle, TrendUp, UserPlus, Tag, Buildings, X, Crosshair, ChartLineUp, Lightbulb, Heart, ArrowsLeftRight, CurrencyDollar } from '@phosphor-icons/react'
import { useState, useEffect, useMemo, lazy, Suspense } from "react"
import { toast } from 'sonner'
import { parseCSV, parseCSVWithMappings, parseCSVHeaders, validateCSVFile, type CSVParseResult } from '@/utils/csv-parser'
import { useDemoData } from '@/hooks/use-demo-data'
import { useDemoGuard } from '@/hooks/use-demo-guard'
import { useUserStorage } from '@/utils/user-storage'
import { isIncognitoMode } from '@/utils/incognito-detection'
import { MARKET_INSTRUMENTS, type MarketType } from '@/constants/trading'
import { PropFirmSelect } from '@/components/prop-firm-select'
import { LATEST_CHANGELOG_VERSION } from '@/constants/changelog'
import { WhatsNewDialog } from '@/components/whats-new-dialog'
import { ProNudgeBanner } from '@/components/pro-nudge-banner'
import { ReferralBanner } from '@/components/referral-banner'
import { GettingStartedChecklist } from '@/components/getting-started-checklist'
import { useFirstTradeCelebration } from '@/hooks/use-first-trade-celebration'
import { recordFirstTradeIfNeeded } from '@/lib/first-trade'
import { trackTradeLogged } from '@/lib/track-trade'
import { useMilestoneCelebrations } from '@/hooks/use-milestone-celebrations'
import { SatisfactionPulse } from '@/components/satisfaction-pulse'
import { triggerFeedbackDialog } from '@/lib/feedback-trigger'
import { ShareStatsCard } from '@/components/share-stats-card'
import { Brain, ChartBar as BarChart3Icon } from '@phosphor-icons/react'
import { resolveDashboardLayout } from '@/components/dashboard/widget-registry'
import { CustomizeSheet } from '@/components/dashboard/customize-sheet'

// Lazy load chart components to reduce initial bundle size
const TradingViewMiniChart = lazy(() => import("@/components/tradingview-mini-chart").then(m => ({ default: m.TradingViewMiniChart })))
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function FreeAIBanner() {
  const { user, isDemo } = useAuth()
  const { isPro, isLoading, hasAIAccess, freeAiQuota } = useProStatus()
  const [visible, setVisible] = useState(false)

  // Month-scoped so the banner reappears when free AI quota resets, rather than
  // vanishing forever after one dismiss.
  const monthStr = new Date().toISOString().slice(0, 7)
  const dismissKey = user ? `free-ai-banner-${monthStr}-${user.uid}` : null

  useEffect(() => {
    if (!user || isDemo || isPro || isLoading || !dismissKey) return
    if (!hasAIAccess || !freeAiQuota || freeAiQuota.remaining === 0) return
    const dismissed = localStorage.getItem(dismissKey)
    if (!dismissed) setVisible(true)
  }, [user, isDemo, isPro, isLoading, hasAIAccess, freeAiQuota, dismissKey])

  if (!visible) return null

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start gap-3 relative">
      <Brain className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">You have {freeAiQuota!.remaining} free AI queries this month</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          Try Coach FTJ below -- ask it anything about your trading. Your free queries reset monthly.
        </p>
      </div>
      <button
        onClick={() => { setVisible(false); if (dismissKey) localStorage.setItem(dismissKey, '1') }}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function Dashboard() {
  const { themeColors, alpha } = useThemePresets()
  const { user, isDemo, exitDemoMode } = useAuth()
  const demoGuard = useDemoGuard()
  const { isPro } = useProStatus()
  const { activeAccount } = useAccounts()
  const { formatCurrency: formatCurrencyFromSettings, settings } = useSettings()
  const { getTrades } = useDemoData()
  const userStorage = useUserStorage()
  const [dataVersion, setDataVersion] = useState(0)
  const [showDataWarning, setShowDataWarning] = useState(true)
  const [showDealsBanner, setShowDealsBanner] = useState(() => !localStorage.getItem('ftj-dismiss-deals'))
  const [showTrackerBanner, setShowTrackerBanner] = useState(() => !localStorage.getItem('ftj-dismiss-tracker'))

  // Check for incognito mode (free users only)
  useEffect(() => {
    if (!isPro && !isDemo) {
      isIncognitoMode().then(isIncognito => {
        if (isIncognito) {
          toast.warning(
            'Incognito mode detected. Your data will be lost when you close this window. Use normal browsing or upgrade to Pro for cloud sync.',
            { duration: 10000 }
          );
        }
      });
    }
  }, [isPro, isDemo]);

  // Compute account balance
  const accountBalance = useMemo(() => {
    const tradesData = getTrades()
    const totalPnL = tradesData.reduce((sum: number, t: any) => sum + (Number(t.pnl) || 0), 0)
    return (activeAccount?.balance || settings.accountSize || 10000) + totalPnL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTrades, activeAccount, settings.accountSize, dataVersion])
  const tradeCount = useMemo(() => getTrades().length, [getTrades, dataVersion])
  useFirstTradeCelebration(tradeCount)
  useMilestoneCelebrations(tradeCount)

  const visibleWidgets = useMemo(
    () => resolveDashboardLayout(settings.dashboardLayout),
    [settings.dashboardLayout]
  )

  const [isLoading, setIsLoading] = useState(false)
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Drop newly-onboarded users straight into logging their first trade -- our
  // biggest activation and retention lever. One-time: clear the router state so a
  // refresh or back-navigation doesn't reopen the dialog.
  useEffect(() => {
    if ((location.state as { promptFirstTrade?: boolean } | null)?.promptFirstTrade) {
      setIsTradeModalOpen(true)
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Quick-log vs full form: show only the essentials (symbol, side, P&L) for new
  // users -- the activation moment -- and expand the optional fields for
  // returning users who already log richer detail.
  const [showTradeDetails, setShowTradeDetails] = useState(false)
  useEffect(() => {
    if (isTradeModalOpen) setShowTradeDetails(tradeCount > 0)
  }, [isTradeModalOpen, tradeCount])

  // Which tab the Log a Trade dialog opens on (manual quick-log vs CSV import).
  const [tradeDialogTab, setTradeDialogTab] = useState<'manual' | 'import'>('manual')

  const [csvUploadState, setCsvUploadState] = useState({
    isUploading: false,
  })
  const [isCsvDragging, setIsCsvDragging] = useState(false)
  const [csvPreview, setCsvPreview] = useState<{
    show: boolean;
    file: File | null;
    parseResult: CSVParseResult | null;
  }>({ show: false, file: null, parseResult: null })
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null)
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
    emotions: "",
    notes: "",
    propFirm: "none"
  })

  const getInstrumentsByMarket = (market: MarketType) => {
    return MARKET_INSTRUMENTS[market] || [];
  }

  const handleSaveTrade = () => {
    if (!tradeForm.symbol || !tradeForm.entryPrice || !tradeForm.exitPrice) return
    if (demoGuard('save your trades')) return

    const savedTrades = userStorage.getItem('trades')
    let trades = []
    
    if (savedTrades) {
      try {
        trades = JSON.parse(savedTrades)
      } catch {
        trades = []
      }
    }
    
    const entryPrice = parseFloat(tradeForm.entryPrice) || 0
    const exitPrice = parseFloat(tradeForm.exitPrice) || 0
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
      emotions: tradeForm.emotions || undefined,
      market: tradeForm.market,
      propFirm: tradeForm.propFirm === "none" ? "" : tradeForm.propFirm
    }
    
    trades.unshift(newTrade)
    userStorage.setItem('trades', JSON.stringify(trades))

    // Record activation + emit per-trade event the moment a trade is created
    // here (the Dashboard quick-add is a real first-trade path), instead of
    // relying on a later Dashboard remount catching the 0 -> positive transition.
    if (user && !isDemo) recordFirstTradeIfNeeded(user.uid)
    trackEvent('trade_created', { symbol: newTrade.symbol, side: newTrade.side, market: newTrade.market })
    trackTradeLogged(1, 'dashboard_quickadd')
    // Refresh widgets live without requiring a page refresh.
    notifyDataChange()

    // Referral nudge after a winning trade (max once per 7 days)
    if (pnl > 0 && user && !isDemo) {
      const NUDGE_KEY = 'ftj-referral-nudge-at';
      const lastNudge = localStorage.getItem(NUDGE_KEY);
      const daysSinceNudge = lastNudge ? (Date.now() - Number(lastNudge)) / (1000 * 60 * 60 * 24) : Infinity;
      if (daysSinceNudge > 7) {
        localStorage.setItem(NUDGE_KEY, String(Date.now()));
        const link = `https://www.freetradejournal.com/signup?ref=${user.uid}`;
        setTimeout(() => {
          toast('Nice win! Know a trader who could use a free journal?', {
            duration: 8000,
            action: {
              label: 'Copy referral link',
              onClick: () => {
                navigator.clipboard.writeText(link);
                toast.success('Referral link copied');
                trackEvent('referral_nudge_copied');
              },
            },
          });
          trackEvent('referral_nudge_shown');
        }, 1500);
      }
    }

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
      emotions: "",
      notes: "",
      propFirm: "none"
    })

    setIsTradeModalOpen(false)
  }

  const processCsvFile = async (file: File) => {
    setCsvUploadState({ isUploading: true });

    try {
      const content = await validateCSVFile(file);
      let result = parseCSV(content);

      setIsTradeModalOpen(false);

      // If auto-detect failed, try to rescue the import silently: replay a mapping
      // the user previously confirmed for this file shape, or (Pro only) ask the
      // LLM to map the columns, before falling back to the manual dialog.
      if (!result.success && result.trades.length === 0) {
        const rescued = await rescueFailedImport({
          content,
          headers: parseCSVHeaders(content),
          storage: userStorage,
          isPro,
          isDemo,
          source: 'dashboard',
        });
        if (rescued.kind === 'parsed') result = rescued.result;
      }

      // Still nothing: offer manual mapping (same as the Trade Log importer)
      // instead of dead-ending on an unrecognized format.
      if (!result.success && result.trades.length === 0) {
        // Telemetry: surface unsupported formats proactively. Column names only —
        // no row/trade data — so this carries no PII.
        const headers = parseCSVHeaders(content);
        trackEvent('csv_import_failed', {
          source: 'dashboard',
          signature: headerSignature(headers),
          column_count: headers.length,
          headers: headers.slice(0, 40),
          error: result.errors[0],
        });
        // Nudge free users toward the Pro AI auto-mapper.
        if (!isPro && !isDemo) {
          toast('Unrecognized format', {
            description: 'Map the columns below — or upgrade to Pro to auto-map any broker with AI.',
          });
        }
        setColumnMapping(buildColumnMapping(content, file));
      } else {
        setCsvPreview({
          show: true,
          file: file,
          parseResult: result
        });
      }

    } catch (error) {
      toast.error('File Import Error', {
        description: error instanceof Error ? error.message : 'Failed to read file',
        duration: 5000
      });
    } finally {
      setCsvUploadState({ isUploading: false });
    }
  };

  const handleMappingConfirm = () => {
    if (!columnMapping) return;
    const { csvContent, mappings, file, headers } = columnMapping;

    const requiredFields = ['symbol', 'side', 'openPrice', 'closePrice', 'quantity', 'pnl'];
    const unmapped = requiredFields.filter(f => mappings[f] === undefined || mappings[f] < 0);
    if (unmapped.length > 0) {
      toast.error('Missing required mappings', {
        description: `Please map: ${unmapped.join(', ')}`,
      });
      return;
    }

    const result = parseCSVWithMappings(csvContent, mappings);
    // Report + remember the mapping the user used to rescue this format so it
    // auto-imports next time (and informs a future built-in detector).
    if (result.success && result.trades.length > 0) {
      trackImportMapped('dashboard', headers, mappings);
      rememberMapping(userStorage, headers, mappings);
    }
    setColumnMapping(null);
    setCsvPreview({ show: true, file, parseResult: result });
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    await processCsvFile(files[0]);
    // Reset the file input so selecting the same file again re-triggers onChange
    event.target.value = '';
  };

  const handleCsvDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsCsvDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await processCsvFile(file);
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

        // Shared converter — identical to the Trade Log import so the same file
        // produces the same trades (correct dates, net P&L, market) either way.
        const importedTrades = buildImportedTrades(result.trades, {
          fileName: file.name,
          accountId: activeAccount?.id || 'default-main-account',
          source: 'Dashboard',
        });

        setImportProgress({ active: true, phase: 'Checking for duplicates...', percent: 70 });

        // Deduplicate against existing trades on key fields.
        const { newTrades, skippedCount } = dedupeImportedTrades(existingTrades, importedTrades);

        setImportProgress({ active: true, phase: 'Saving trades...', percent: 90 });

        const updatedTrades = [...existingTrades, ...newTrades];
        userStorage.setItem('trades', JSON.stringify(updatedTrades));
        // Record activation explicitly (instead of relying on the incidental
        // celebration-hook back-fill) and restore csv_imported visibility for
        // the Dashboard import surface.
        if (user && !isDemo && newTrades.length > 0) recordFirstTradeIfNeeded(user.uid);
        if (newTrades.length > 0) {
          trackEvent('csv_imported', { count: newTrades.length, source: 'dashboard' });
          trackTradeLogged(newTrades.length, 'csv_dashboard');
        }
        // Notify useDemoData subscribers so all widgets re-read trades live,
        // instead of requiring a page refresh to pick up the import.
        notifyDataChange();

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

        // Prompt for feedback after importing 5+ trades
        if (newTrades.length >= 5) {
          setTimeout(() => {
            toast('How was the import experience?', {
              description: 'Help us improve CSV imports for your broker.',
              duration: 8000,
              action: {
                label: 'Give feedback',
                onClick: () => triggerFeedbackDialog('CSV Import'),
              },
            });
          }, 2000);
        }

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
      return (
        <div className="flex flex-wrap items-center justify-start gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground/70">
            No trades yet -- log your first trade to see live stats
          </span>
        </div>
      )
    }

    const trades = tradesData.map((t: any) => ({
      pnl: Number(t.pnl) || 0,
      exitTime: new Date(t.exitTime),
    }))

    const totalPnl = trades.reduce((s: number, t: { pnl: number }) => s + t.pnl, 0)
    const wins = trades.filter((t: { pnl: number }) => t.pnl > 0).length
    const winRate = Math.round((wins / trades.length) * 100)

    const sorted = [...trades].sort((a: { exitTime: Date }, b: { exitTime: Date }) => b.exitTime.getTime() - a.exitTime.getTime())
    let streak = 0
    const streakPositive = sorted[0]?.pnl > 0
    for (const t of sorted) {
      if ((t.pnl > 0) === streakPositive && t.pnl !== 0) streak++
      else break
    }

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const thisWeek = trades.filter((t: { exitTime: Date }) => t.exitTime >= weekStart)
    const weekPnl = thisWeek.reduce((s: number, t: { pnl: number }) => s + t.pnl, 0)

    const pnlColor = totalPnl >= 0 ? themeColors.profit : themeColors.loss
    const weekPnlColor = weekPnl >= 0 ? themeColors.profit : themeColors.loss
    const winRateColor = winRate >= 50 ? themeColors.profit : themeColors.loss

    const chips: React.ReactNode[] = []

    chips.push(
      <span key="count" className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: alpha(themeColors.primary, '10'), color: themeColors.primary }}>
        <ChartLineUp className="h-3 w-3" weight="bold" />
        {trades.length} trades
      </span>
    )

    if (streak >= 3 && streakPositive) {
      chips.push(
        <span key="streak" className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: alpha(themeColors.profit, '10'), color: themeColors.profit }}>
          <TrendUp className="h-3 w-3" weight="bold" />
          {streak}-trade win streak
        </span>
      )
    }

    if (thisWeek.length > 0) {
      const sign = weekPnl >= 0 ? '+' : ''
      chips.push(
        <span key="week" className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: alpha(weekPnlColor, '10'), color: weekPnlColor }}>
          <CurrencyDollar className="h-3 w-3" weight="bold" />
          {sign}${weekPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} this week
        </span>
      )
    } else {
      const sign = totalPnl >= 0 ? '+' : ''
      chips.push(
        <span key="pnl" className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: alpha(pnlColor, '10'), color: pnlColor }}>
          <CurrencyDollar className="h-3 w-3" weight="bold" />
          {sign}${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} P&L
        </span>
      )
    }

    chips.push(
      <span key="wr" className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: alpha(winRateColor, '10'), color: winRateColor }}>
        <Crosshair className="h-3 w-3" weight="bold" />
        {winRate}% win rate
      </span>
    )

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {chips}
      </div>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTrades, themeColors.profit, themeColors.loss, themeColors.primary, alpha, dataVersion])

  // No loading state needed - render content immediately

  // Skeleton loader components
  const MetricCardSkeleton = () => (
    <div className="bg-muted/50 backdrop-blur-sm rounded-lg border-0 p-6 space-y-4">
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
    <div className={`bg-muted/50 backdrop-blur-sm rounded-lg border p-6 ${height}`}>
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

      <GettingStartedChecklist refreshKey={dataVersion} />
      <ProNudgeBanner />

      {/* Free User Data Warning Banner */}
      {!isPro && !isDemo && showDataWarning && (
        <div className="mx-4 mb-4 rounded-xl border px-4 py-3 flex items-start gap-3" style={{ backgroundColor: 'hsl(var(--amber-500) / 0.05)', borderColor: 'hsl(var(--amber-500) / 0.3)' }}>
              <WarningCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">
                  Your data is stored locally on this device only
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  Clearing browser data, using incognito mode, or switching devices will erase your trades.
                  <strong> Export backups regularly in Settings</strong> or upgrade to Pro for automatic cloud sync.
                </p>
                <Link to="/pricing">
                  <button className="text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg transition-colors duration-150">
                    Enable Cloud Sync →
                  </button>
                </Link>
              </div>
              <button
                onClick={() => setShowDataWarning(false)}
                className="text-muted-foreground hover:text-foreground flex-shrink-0 p-2 -m-1 flex items-center justify-center"
                aria-label="Close warning"
              >
                ✕
              </button>
        </div>
      )}

      {/* Deals & PropTracker Banner */}
      {(showDealsBanner || showTrackerBanner) && (
        <div className="mx-4 mb-4 rounded-xl border px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4" style={{borderColor: alpha(themeColors.primary, '30'), backgroundColor: alpha(themeColors.primary, '08')}}>
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 shrink-0" style={{color: themeColors.primary}} />
              <span className="text-sm">
                <span className="font-medium text-foreground">Prop firm deals</span>
                <span className="text-muted-foreground hidden sm:inline"> · The5ers, FTMO, Apex codes</span>
              </span>
            </div>
            <span className="hidden sm:block w-px h-4 bg-border/60 shrink-0" />
            <div className="flex items-center gap-2">
              <Buildings className="h-3.5 w-3.5 shrink-0" style={{color: themeColors.primary}} />
              <span className="text-sm">
                <span className="font-medium text-foreground">PropTracker</span>
                <span className="text-muted-foreground hidden sm:inline"> · Track P&L across every firm</span>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a href="/affiliate" target="_blank" rel="noopener noreferrer">
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors duration-150" style={{backgroundColor: themeColors.primary, color: themeColors.primaryButtonText}}>
                View Deals →
              </button>
            </a>
            <Link to="/prop-tracker">
              <button className="text-xs font-semibold border px-3 py-1.5 rounded-lg transition-colors duration-150" style={{borderColor: alpha(themeColors.primary, '40'), color: themeColors.primary}}>
                PropTracker →
              </button>
            </Link>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('ftj-dismiss-deals', '1');
              localStorage.setItem('ftj-dismiss-tracker', '1');
              setShowDealsBanner(false);
              setShowTrackerBanner(false);
            }}
            className="text-muted-foreground hover:text-foreground shrink-0 p-1 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <ReferralBanner />

      {/* Mobile-optimized Header Section */}
      <div className="border-b" style={{ contain: 'layout', transform: 'translate3d(0,0,0)' }}>
        <div className="w-full px-3 py-4 sm:px-6 lg:px-8 sm:py-6">
          <div className="flex flex-col gap-3">
            {/* Greeting + Date */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>
                {getGreeting()}
              </h1>
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            {/* Insight + action button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="max-w-2xl">
                {headerInsight}
              </div>

              {/* Quick Actions - inline with title on desktop */}
              <div className="flex items-center sm:justify-end gap-2 sm:gap-3 flex-shrink-0">
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
              <>
              {tradeCount > 0 && <ShareStatsCard />}
              <CustomizeSheet />
              <Dialog open={isTradeModalOpen} onOpenChange={(open) => { setIsTradeModalOpen(open); if (!open) setTradeDialogTab('manual'); }}>
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
                <DialogContent className="w-[95vw] max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                  <div className="px-5 pt-5 sm:px-6 sm:pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
                        <ChartLineUp className="h-4 w-4" style={{ color: themeColors.primary }} />
                      </div>
                      <div>
                        <DialogHeader className="text-left space-y-0.5">
                          <DialogTitle>Log a Trade</DialogTitle>
                          <DialogDescription>
                            Add trades manually or import from your broker.
                          </DialogDescription>
                        </DialogHeader>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 mt-4">
                  <Tabs value={tradeDialogTab} onValueChange={(v) => setTradeDialogTab(v as 'manual' | 'import')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-9 p-1 mb-5">
                      <TabsTrigger value="manual" className="text-xs sm:text-sm gap-1.5 flex items-center justify-center">
                        <Plus className="h-3.5 w-3.5" />
                        Manual
                      </TabsTrigger>
                      <TabsTrigger value="import" className="text-xs sm:text-sm gap-1.5 flex items-center justify-center">
                        <UploadSimple className="h-3.5 w-3.5" />
                        Import
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual" className="space-y-4 mt-0">
                    {/* Setup: what did you trade */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="trade-market" className="text-xs text-muted-foreground">Market</Label>
                        <Select value={tradeForm.market} onValueChange={(value: MarketType) => {
                          setTradeForm(prev => ({ ...prev, market: value, symbol: "" }))
                          userStorage.setItem('preferredMarket', value)
                        }}>
                          <SelectTrigger id="trade-market" className="h-10 bg-background/60 border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="forex">Forex</SelectItem>
                            <SelectItem value="futures">Futures</SelectItem>
                            <SelectItem value="indices">Indices</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="trade-symbol" className="text-xs text-muted-foreground">Symbol</Label>
                        <Select value={tradeForm.symbol} onValueChange={(value) => setTradeForm(prev => ({ ...prev, symbol: value }))}>
                          <SelectTrigger id="trade-symbol" className="h-10 bg-background/60 border-border/50">
                            <SelectValue placeholder="Select" />
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
                      <div className="space-y-1.5">
                        <Label htmlFor="trade-side" className="text-xs text-muted-foreground">Side</Label>
                        <Select value={tradeForm.side} onValueChange={(value: "long" | "short") => setTradeForm(prev => ({ ...prev, side: value }))}>
                          <SelectTrigger id="trade-side" className="h-10 bg-background/60 border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="long">Long</SelectItem>
                            <SelectItem value="short">Short</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Profit / Loss -- the hero field */}
                    <div className="space-y-1.5">
                      <Label htmlFor="trade-pnl" className="text-sm font-medium">Profit / Loss</Label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground pointer-events-none">$</span>
                        <Input
                          id="trade-pnl"
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="0.00"
                          className="h-14 pl-8 text-lg font-semibold bg-background/60 border-border/50"
                          style={tradeForm.pnl !== '' && !Number.isNaN(Number(tradeForm.pnl)) ? { color: Number(tradeForm.pnl) >= 0 ? themeColors.profit : themeColors.loss } : undefined}
                          value={tradeForm.pnl}
                          onChange={(e) => setTradeForm(prev => ({ ...prev, pnl: e.target.value }))}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Enter your result -- use a minus for a loss (e.g. -50). Or add entry and exit below to calculate it.</p>
                    </div>

                    {/* Progressive disclosure: every optional field lives here */}
                    <button
                      type="button"
                      onClick={() => setShowTradeDetails(v => !v)}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <CaretDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showTradeDetails ? 'rotate-180' : ''}`} />
                      {showTradeDetails ? 'Hide details' : 'Add details -- prices, strategy, emotions, notes'}
                    </button>

                    {showTradeDetails && (
                      <div className="space-y-4">
                        {/* Mini chart (shows when a symbol is selected) */}
                        {tradeForm.symbol && (
                          <Suspense fallback={null}>
                            <div className="rounded-xl border bg-card/50 overflow-hidden">
                              <TradingViewMiniChart symbol={tradeForm.symbol} height={180} />
                            </div>
                          </Suspense>
                        )}

                        {/* Prices -- optional; auto-calculate P&L and unlock price stats */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="entry-price" className="text-xs text-muted-foreground">Entry</Label>
                            <Input id="entry-price" type="number" step="0.00001" placeholder="e.g. 1.08450" className="h-10 bg-background/60 border-border/50" value={tradeForm.entryPrice} onChange={(e) => setTradeForm(prev => ({ ...prev, entryPrice: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="exit-price" className="text-xs text-muted-foreground">Exit</Label>
                            <Input id="exit-price" type="number" step="0.00001" placeholder="e.g. 1.08650" className="h-10 bg-background/60 border-border/50" value={tradeForm.exitPrice} onChange={(e) => setTradeForm(prev => ({ ...prev, exitPrice: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="lot-size" className="text-xs text-muted-foreground">Lot Size</Label>
                            <Input id="lot-size" type="number" step="0.01" placeholder="e.g. 1.00" className="h-10 bg-background/60 border-border/50" value={tradeForm.lotSize} onChange={(e) => setTradeForm(prev => ({ ...prev, lotSize: e.target.value }))} />
                          </div>
                        </div>

                        {/* Context */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="trade-strategy" className="text-xs text-muted-foreground">Strategy</Label>
                            <Input id="trade-strategy" placeholder="Breakout, S/R..." className="h-10 bg-background/60 border-border/50" value={tradeForm.strategy} onChange={(e) => setTradeForm(prev => ({ ...prev, strategy: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="trade-prop-firm" className="text-xs text-muted-foreground">Prop Firm</Label>
                            <PropFirmSelect triggerId="trade-prop-firm" triggerClassName="h-10 bg-background/60 border-border/50" value={tradeForm.propFirm} onChange={(value) => setTradeForm(prev => ({ ...prev, propFirm: value }))} />
                          </div>
                        </div>

                        {/* Emotions */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">How did you feel?</Label>
                            {tradeForm.emotions.split(',').filter(s => s.trim()).length > 0 && (
                              <span className="text-[10px] font-medium" style={{ color: themeColors.primary }}>
                                {tradeForm.emotions.split(',').filter(s => s.trim()).length} selected
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {['Confident', 'Disciplined', 'Patient', 'Anxious', 'Fearful', 'FOMO', 'Greedy', 'Revenge', 'Frustrated', 'Uncertain'].map(e => {
                              const selected = tradeForm.emotions.split(',').map(s => s.trim()).filter(Boolean);
                              const isActive = selected.includes(e);
                              return (
                                <button
                                  key={e}
                                  type="button"
                                  onClick={() => {
                                    const next = isActive ? selected.filter(s => s !== e) : [...selected, e];
                                    setTradeForm(prev => ({ ...prev, emotions: next.join(', ') }));
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 ${
                                    isActive
                                      ? ''
                                      : 'bg-muted/50 border-border/70 text-muted-foreground hover:border-border hover:text-foreground'
                                  }`}
                                  style={isActive ? { backgroundColor: alpha(themeColors.primary, '15'), borderColor: alpha(themeColors.primary, '40'), color: themeColors.primary } : undefined}
                                >
                                  {e}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                          <Label htmlFor="trade-notes" className="text-xs text-muted-foreground">Notes</Label>
                          <Textarea
                            id="trade-notes"
                            placeholder="What was your reasoning? What did you notice?"
                            value={tradeForm.notes}
                            onChange={(e) => setTradeForm(prev => ({ ...prev, notes: e.target.value }))}
                            className="min-h-[72px] resize-none text-sm bg-background/60 border-border/50"
                          />
                        </div>
                      </div>
                    )}

                    {/* -- Footer -- */}
                    <div className="flex items-center justify-between pt-2">
                      <Link to="/trades" onClick={() => setIsTradeModalOpen(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                        <FileText className="h-3 w-3" />
                        Full trade log
                      </Link>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsTradeModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="shadow-sm gap-2 px-5"
                          onClick={handleSaveTrade}
                          disabled={!tradeForm.symbol || (!tradeForm.pnl && (!tradeForm.entryPrice || !tradeForm.exitPrice))}
                          style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                        >
                          <CurrencyDollar className="h-3.5 w-3.5" />
                          Save Trade
                        </Button>
                      </div>
                    </div>
                    </TabsContent>

                    <TabsContent value="import" className="space-y-4 mt-0">
                      <div
                        className="rounded-xl border-2 border-dashed p-8 text-center space-y-4 transition-colors hover:border-primary/50 cursor-pointer"
                        style={{
                          borderColor: isCsvDragging ? themeColors.primary : alpha(themeColors.primary, '30'),
                          backgroundColor: isCsvDragging ? alpha(themeColors.primary, '08') : undefined,
                        }}
                        onClick={() => document.getElementById('dashboard-csv-import')?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsCsvDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsCsvDragging(false); }}
                        onDrop={handleCsvDrop}
                      >
                        <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: alpha(themeColors.primary, '12') }}>
                          <UploadSimple className="h-6 w-6" style={{ color: themeColors.primary }} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Import trades from CSV</p>
                          <p className="text-xs text-muted-foreground">
                            Drag and drop or click to browse
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                          {['MT4 / MT5', 'Tradovate', 'IBKR', 'NinjaTrader', 'TradeStation'].map(broker => (
                            <span key={broker} className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/50">
                              {broker}
                            </span>
                          ))}
                        </div>
                        <input
                          id="dashboard-csv-import"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          aria-label="Import CSV file"
                          onChange={handleCSVImport}
                        />
                      </div>

                      {csvUploadState.isUploading && (
                        <div className="rounded-xl border bg-card/50 p-4 text-center">
                          <p className="text-sm text-muted-foreground">Processing file...</p>
                        </div>
                      )}

                      <div className="rounded-xl border bg-card/50 p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">How it works</p>
                        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                          <li>Export your trade history as CSV from your broker</li>
                          <li>Upload the file here -- we auto-detect the format</li>
                          <li>Review the preview, then confirm the import</li>
                        </ol>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Link to="/trades" onClick={() => setIsTradeModalOpen(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                          <FileText className="h-3 w-3" />
                          Full trade log
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => setIsTradeModalOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                  </div>
                </DialogContent>
              </Dialog>
              </>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-optimized Main Content — registry-driven, reorderable widget stack */}
      <div className="w-full px-3 py-4 sm:px-6 lg:px-8 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* FreeAIBanner stays outside the registry (per gotchas) — kept above the
            reorderable stack so widget visibility/order changes never affect it. */}
        <FreeAIBanner />
        {tradeCount === 0 && !isDemo && (
          <div className="rounded-2xl border bg-card/50 px-6 py-10 sm:py-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: alpha(themeColors.primary, '12') }}>
              <ChartLineUp className="h-6 w-6" style={{ color: themeColors.primary }} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Log your first trade</h2>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
              Your P&L, win rate, and stats come to life the moment you add a trade. It takes about 15 seconds -- just symbol, side, and your result.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row items-center gap-2.5">
              <Button
                onClick={() => { setTradeDialogTab('manual'); setIsTradeModalOpen(true); }}
                className="gap-2 h-11 px-5"
                style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
              >
                <Plus className="h-4 w-4" />
                Log your first trade
              </Button>
              <Button
                variant="outline"
                onClick={() => { setTradeDialogTab('import'); setIsTradeModalOpen(true); }}
                className="gap-2 h-11 px-5"
              >
                <UploadSimple className="h-4 w-4" />
                Import from broker
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Once you have a few trades logged, Coach FTJ can analyze them -- you get 20 free AI queries every month.
            </p>
          </div>
        )}
        {visibleWidgets.map(w => {
          const node = w.render({ tradeCount, isDemo })
          // Isolate each widget: a single one throwing (e.g. on a bad date in
          // saved data) must not blank the entire dashboard.
          return node ? <ErrorBoundary key={w.id}>{node}</ErrorBoundary> : null
        })}
      </div>
      
      {/* Column Mapping Dialog */}
      <ColumnMappingDialog value={columnMapping} onChange={setColumnMapping} onConfirm={handleMappingConfirm} />

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
                      <p className="text-base sm:text-lg font-bold break-words" style={{ color: totalPnl >= 0 ? themeColors.profit : themeColors.loss }}>
                        {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                      <p className="text-base sm:text-lg font-bold break-words" style={{ color: winRate >= 50 ? themeColors.profit : themeColors.loss }}>
                        {winRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Best Trade</p>
                      <p className="text-base sm:text-lg font-bold break-words" style={{ color: themeColors.profit }}>
                        +${bestTrade.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Worst Trade</p>
                      <p className="text-base sm:text-lg font-bold break-words" style={{ color: themeColors.loss }}>
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
                      <TrendUp className="h-4 w-4" style={{ color: themeColors.primary }} />
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
                          <TableRow key={index} className="hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border-border">
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
                      <WarningCircle className="h-4 w-4" style={{ color: themeColors.loss }} />
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
                      <CheckCircle className="h-4 w-4" style={{ color: themeColors.profit }} />
                      Ready to import {csvPreview.parseResult.trades.length} trades
                    </span>
                  ) : (
                    <span className="flex items-center gap-2" style={{ color: themeColors.loss }}>
                      <WarningCircle className="h-4 w-4" />
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
                        <CheckCircle className="h-4 w-4" />
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
      <SatisfactionPulse tradeCount={tradeCount} />
      <WhatsNewDialog open={showWhatsNew} onOpenChange={setShowWhatsNew} />
    </>
  )
}