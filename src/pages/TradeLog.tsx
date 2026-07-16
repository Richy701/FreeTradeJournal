import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import { calculateGrossPnl, getFuturesMultiplier, computePnlPercentage } from '@/lib/pnl';
import { triggerFeedbackDialog } from '@/lib/feedback-trigger';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useThemePresets } from '@/contexts/theme-presets';
import { useSettings } from '@/contexts/settings-context';
import { useAuth } from '@/contexts/auth-context';
import { useAccounts } from '@/contexts/account-context';
import { useUserStorage } from '@/utils/user-storage';
import { recordFirstTradeIfNeeded } from '@/lib/first-trade';
import { trackTradeLogged } from '@/lib/track-trade';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // unused
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Plus, PencilSimple, Trash, UploadSimple, DownloadSimple, ChartBar, FileText, FileArrowDown, Calendar, Brain, Tag, BookOpen } from '@phosphor-icons/react';
import { PDFReportDialog } from '@/components/pdf-report-dialog';
import { InstrumentCombobox } from '@/components/ui/instrument-combobox';
import { CurrencyDollar, Target, Trophy, Scales, CheckCircle, Warning, TrendUp, TrendDown, ChartLineUp, Clock, Coins, Sliders, Note, ArrowRight, Crosshair, ArrowsLeftRight, Lightbulb } from '@phosphor-icons/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart, Sector } from "recharts";
import { startOfYear, endOfYear, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth } from 'date-fns';
import { DateTimePicker, DatePicker } from '@/components/ui/date-picker';
import { parseCSV, validateCSVFile, parseCSVWithMappings, parseCSVHeaders, type CSVParseResult } from '@/utils/csv-parser';
import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { useDemoData } from '@/hooks/use-demo-data';
import { useDemoGuard } from '@/hooks/use-demo-guard';
import { TradeLogFilters, TradeLogFilterPills, EMPTY_FILTERS, countActiveFilters, type TradeFilters } from '@/components/trade-log-filters';
import { AIJournalPrompts } from '@/components/ai-journal-prompts';
import { ImportInsightDialog } from '@/components/import-insight-dialog';
import { AITradeReview } from '@/components/ai-trade-review';
import { AIStrategyTagger } from '@/components/ai-strategy-tagger';
import { AIRiskAlertMonitor } from '@/components/ai-risk-alert';
import { ProUpgradeCard } from '@/components/pro-upgrade-card';
import { useProStatus } from '@/contexts/pro-context';
import { notifyDataChange } from '@/contexts/sync-context';
import { buildImportedTrades, dedupeImportedTrades, detectMarketFromSymbol, buildColumnMapping, type ColumnMapping } from '@/utils/import-trades';
import { ColumnMappingDialog } from '@/components/column-mapping-dialog';
import { headerSignature, rememberMapping, trackImportMapped } from '@/utils/csv-import-memory';
import { rescueFailedImport } from '@/utils/csv-import-flow';
import { cn } from '@/lib/utils';
import { belongsToAccount } from '@/lib/account-scope';
import { quantityLabelForMarket } from '@/constants/trading';
import { lazy, Suspense } from 'react';
const TradingViewMiniChart = lazy(() => import("@/components/tradingview-mini-chart").then(m => ({ default: m.TradingViewMiniChart })));
const MarketNewsFeed = lazy(() => import("@/components/market-news-feed").then(m => ({ default: m.MarketNewsFeed })));

interface Trade {
  id: string
  symbol: string
  side: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  stopLoss?: number
  takeProfit?: number
  lotSize: number
  entryTime: Date
  exitTime: Date
  spread: number
  commission: number
  fees: number
  swap: number
  pnl: number
  pnlPercentage: number
  riskReward?: number
  notes?: string
  strategy?: string
  tags?: string[]
  screenshots?: string[]
  market?: 'forex' | 'futures' | 'indices'
  useManualPnL?: boolean
  manualPnL?: number
  /** Original P&L from a broker CSV import — treated as the gross source of truth. */
  brokerPnL?: number
  customMultiplier?: number
  propFirm?: string
  accountId?: string
  emotions?: string
}

interface TradeFormData {
  symbol: string
  side: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  stopLoss?: number
  takeProfit?: number
  lotSize: number
  entryTime: Date
  exitTime: Date
  spread: number
  commission: number
  fees: number
  swap: number
  notes?: string
  strategy?: string
  emotions?: string
  market?: 'forex' | 'futures' | 'indices'
  tags?: string[]
  useManualPnL?: boolean
  manualPnL?: number
  manualRR?: number
  /** How Stop Loss / Take Profit are entered: absolute price, pips (forex), or points (futures/indices). */
  slTpUnit?: 'price' | 'pips' | 'points'
  customMultiplier?: number
  propFirm?: string
}

// Forex quotes need their full precision (1.08523, not 1.09); JPY-style pairs
// quote to 3 decimals. Futures/indices stay at 2.
function formatPrice(price: number, symbol?: string): string {
  if (symbol && detectMarketFromSymbol(symbol) === 'forex') {
    return price.toFixed(/JPY|HUF|THB/.test(symbol.toUpperCase()) ? 3 : 5);
  }
  return price.toFixed(2);
}

export default function TradeLog() {
  const { themeColors, alpha } = useThemePresets();
  const { settings, getCurrencySymbol } = useSettings();
  const currencySymbol = getCurrencySymbol();
  const { user, isDemo } = useAuth();
  const demoGuard = useDemoGuard();
  const { isPro, hasAIAccess } = useProStatus();
  // Freshly imported trades queued for the AI first-read dialog
  const [importInsightTrades, setImportInsightTrades] = useState<any[] | null>(null);
  const { activeAccount } = useAccounts();
  const userStorage = useUserStorage();
  const { getTrades: getDemoTrades, getJournalEntries } = useDemoData();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [csvUploadState, setCsvUploadState] = useState({
    isUploading: false,
  });
  const [isCsvDragging, setIsCsvDragging] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{
    show: boolean;
    file: File | null;
    parseResult: CSVParseResult | null;
  }>({ show: false, file: null, parseResult: null });

  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);

  // AI feature state
  const [journalPromptTrade, setJournalPromptTrade] = useState<Trade | null>(null);
  const [reviewingTradeId, setReviewingTradeId] = useState<string | null>(null);
  const [isStrategyTaggerOpen, setIsStrategyTaggerOpen] = useState(false);

  // Bulk selection state
  const [selectedTradeIds, setSelectedTradeIds] = useState<Set<string>>(new Set());

  // CSV export filter state
  const [exportPopoverOpen, setExportPopoverOpen] = useState(false);
  const [exportFrom, setExportFrom] = useState<Date | undefined>(undefined);
  const [exportTo, setExportTo] = useState<Date | undefined>(undefined);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const itemsPerPage = 10;

  // Filter state (persisted per user)
  const [filters, setFilters] = useState<TradeFilters>(() => {
    try {
      const saved = userStorage.getItem('tradeLogFilters');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...EMPTY_FILTERS,
          ...parsed,
          dateFrom: parsed.dateFrom ? new Date(parsed.dateFrom) : undefined,
          dateTo: parsed.dateTo ? new Date(parsed.dateTo) : undefined,
        } as TradeFilters;
      }
    } catch { /* ignore corrupt filter state */ }
    return { ...EMPTY_FILTERS };
  });

  // Persist filters whenever they change
  useEffect(() => {
    userStorage.setItem('tradeLogFilters', JSON.stringify(filters));
  }, [filters]);

  // Apply active filters to the account-scoped trade list
  const displayedTrades = useMemo(() => {
    const filtered = trades.filter((trade) => {
      if (filters.symbols.length > 0 && !filters.symbols.includes(trade.symbol)) return false;
      if (filters.sides.length > 0 && !filters.sides.includes(trade.side)) return false;
      if (filters.markets.length > 0 && !filters.markets.includes(detectMarketFromSymbol(trade.symbol))) return false;
      if (filters.strategies.length > 0 && !filters.strategies.includes(trade.strategy || '')) return false;
      if (filters.outcome === 'win' && !(trade.pnl > 0)) return false;
      if (filters.outcome === 'loss' && !(trade.pnl < 0)) return false;
      if (filters.outcome === 'breakeven' && trade.pnl !== 0) return false;
      if (filters.dateFrom || filters.dateTo) {
        const d = trade.exitTime instanceof Date ? trade.exitTime : new Date(trade.exitTime);
        if (filters.dateFrom && d < filters.dateFrom) return false;
        if (filters.dateTo) {
          const end = new Date(filters.dateTo);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
      }
      return true;
    });

    const dir = filters.sortDir === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      let cmp = 0;
      if (filters.sortBy === 'pnl') {
        cmp = a.pnl - b.pnl;
      } else if (filters.sortBy === 'symbol') {
        cmp = a.symbol.localeCompare(b.symbol);
      } else {
        const da = (a.exitTime instanceof Date ? a.exitTime : new Date(a.exitTime)).getTime();
        const db = (b.exitTime instanceof Date ? b.exitTime : new Date(b.exitTime)).getTime();
        cmp = da - db;
      }
      return cmp * dir;
    });
  }, [trades, filters]);

  // Trades in true time order (oldest → newest). The `trades` array is in
  // insertion order — CSV imports append in file order — so anything that
  // means "recent" or "surrounding" chronologically must read this instead.
  const chronoTrades = useMemo(
    () =>
      [...trades].sort(
        (a, b) =>
          (a.exitTime instanceof Date ? a.exitTime : new Date(a.exitTime)).getTime() -
          (b.exitTime instanceof Date ? b.exitTime : new Date(b.exitTime)).getTime(),
      ),
    [trades],
  );

  // Filter option lists derived from the loaded trades
  const symbolOptions = useMemo(
    () => Array.from(new Set(trades.map((t) => t.symbol))).sort(),
    [trades],
  );
  const marketOptions = useMemo(
    () => Array.from(new Set(trades.map((t) => detectMarketFromSymbol(t.symbol)))).sort(),
    [trades],
  );
  const strategyOptions = useMemo(
    () => Array.from(new Set(trades.map((t) => t.strategy).filter((s): s is string => !!s))).sort(),
    [trades],
  );

  const activeFilterCount = countActiveFilters(filters);

  // The calendar span the user's trades cover, e.g. "Jan 3 – Jun 12, 2026".
  const tradeDateSpan = useMemo(() => {
    if (trades.length === 0) return '';
    let min = Infinity;
    let max = -Infinity;
    for (const t of trades) {
      const ms = (t.exitTime instanceof Date ? t.exitTime : new Date(t.exitTime)).getTime();
      if (Number.isNaN(ms)) continue;
      if (ms < min) min = ms;
      if (ms > max) max = ms;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return '';
    const a = new Date(min);
    const b = new Date(max);
    if (format(a, 'yyyy-MM-dd') === format(b, 'yyyy-MM-dd')) return format(a, 'MMM d, yyyy');
    if (a.getFullYear() === b.getFullYear()) return `${format(a, 'MMM d')} – ${format(b, 'MMM d, yyyy')}`;
    return `${format(a, 'MMM d, yyyy')} – ${format(b, 'MMM d, yyyy')}`;
  }, [trades]);

  // Calculate pagination over the filtered list
  const totalPages = Math.ceil(displayedTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTrades = displayedTrades.slice(startIndex, endIndex);

  // Selection state derived for the current page (the header checkbox acts on the page,
  // while a banner lets the user extend selection to every matching trade).
  const pageSelectedCount = paginatedTrades.reduce((n, t) => n + (selectedTradeIds.has(t.id) ? 1 : 0), 0);
  const allPageSelected = paginatedTrades.length > 0 && pageSelectedCount === paginatedTrades.length;
  const somePageSelected = pageSelectedCount > 0 && !allPageSelected;

  // Reset to first page when the result set changes (load or filter change)
  useEffect(() => {
    setCurrentPage(1);
  }, [displayedTrades.length]);

  // Keep quick stats in sync with the currently displayed (filtered) trades
  useEffect(() => {
    calculateQuickStats(displayedTrades);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedTrades]);

  const form = useForm<TradeFormData>({
    defaultValues: {
      symbol: '',
      side: 'long',
      entryPrice: 0,
      exitPrice: 0,
      lotSize: 1,
      spread: 0,
      commission: 0,
      fees: 0,
      swap: 0,
      notes: '',
      strategy: '',
      emotions: '',
      market: 'forex',
      tags: [],
      propFirm: '',
      slTpUnit: 'price',
    },
    mode: 'onChange',
  });

  // Watch the market type to filter instruments
  const watchedMarket = form.watch('market');

  // Function to detect market type based on symbol
  const getInstrumentsByMarket = (market: string) => {
    switch (market) {
      case 'forex':
        return [
          { category: 'Major Pairs', instruments: [
            'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'
          ]},
          { category: 'Cross Pairs', instruments: [
            'EURJPY', 'GBPJPY', 'EURGBP', 'EURAUD', 'EURNZD', 'EURCHF',
            'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPNZD',
            'AUDJPY', 'NZDJPY', 'CADJPY', 'CHFJPY', 'AUDCAD', 'AUDNZD'
          ]},
          { category: 'Exotic Pairs', instruments: [
            'USDSEK', 'USDNOK', 'USDDKK', 'USDSGD', 'USDMXN', 'USDZAR'
          ]}
        ];
      case 'futures':
        return [
          { category: 'Micro Index Futures', instruments: [
            { symbol: 'MES', name: 'Micro E-mini S&P 500' },
            { symbol: 'MNQ', name: 'Micro E-mini Nasdaq 100' },
            { symbol: 'MYM', name: 'Micro E-mini Dow Jones' },
            { symbol: 'M2K', name: 'Micro E-mini Russell 2000' }
          ]},
          { category: 'Standard Index Futures', instruments: [
            { symbol: 'ES', name: 'E-mini S&P 500' },
            { symbol: 'NQ', name: 'E-mini Nasdaq 100' },
            { symbol: 'YM', name: 'E-mini Dow Jones' },
            { symbol: 'RTY', name: 'E-mini Russell 2000' }
          ]},
          { category: 'Micro Energy', instruments: [
            { symbol: 'MCL', name: 'Micro Crude Oil' }
          ]},
          { category: 'Standard Energy', instruments: [
            { symbol: 'CL', name: 'Crude Oil' },
            { symbol: 'NG', name: 'Natural Gas' },
            { symbol: 'RB', name: 'Gasoline' }
          ]},
          { category: 'Micro Metals', instruments: [
            { symbol: 'MGC', name: 'Micro Gold' }
          ]},
          { category: 'Standard Metals', instruments: [
            { symbol: 'GC', name: 'Gold' },
            { symbol: 'SI', name: 'Silver' },
            { symbol: 'HG', name: 'Copper' }
          ]},
          { category: 'Agriculture', instruments: [
            { symbol: 'ZC', name: 'Corn' },
            { symbol: 'ZS', name: 'Soybeans' },
            { symbol: 'ZW', name: 'Wheat' }
          ]},
          { category: 'Bonds', instruments: [
            { symbol: 'ZN', name: '10-Year Treasury' },
            { symbol: 'ZB', name: '30-Year Treasury' }
          ]}
        ];
      case 'indices':
        return [
          { category: 'US Index ETFs', instruments: [
            { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
            { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
            { symbol: 'DIA', name: 'SPDR Dow Jones ETF' },
            { symbol: 'IWM', name: 'iShares Russell 2000 ETF' }
          ]},
          { category: 'Sector ETFs', instruments: [
            { symbol: 'XLF', name: 'Financial Sector SPDR' },
            { symbol: 'XLK', name: 'Technology Sector SPDR' },
            { symbol: 'XLE', name: 'Energy Sector SPDR' },
            { symbol: 'XLV', name: 'Health Care Sector SPDR' }
          ]},
          { category: 'International ETFs', instruments: [
            { symbol: 'EFA', name: 'iShares MSCI EAFE ETF' },
            { symbol: 'EEM', name: 'iShares MSCI Emerging Markets ETF' },
            { symbol: 'VGK', name: 'Vanguard European ETF' }
          ]}
        ];
      default:
        return [];
    }
  };

  // This useEffect is replaced by the enhanced loading simulation below

  const saveTrades = (updatedTrades: Trade[]) => {
    setTrades(updatedTrades);
    calculateQuickStats(updatedTrades);

    // Record the user's first trade for activation tracking the moment it is
    // logged here (the real logging point), instead of relying on a Dashboard
    // remount catching a 0 -> positive transition. Idempotent + non-blocking;
    // the localStorage guard inside makes this safe to call on every save.
    if (user && !isDemo && updatedTrades.length >= 1) {
      recordFirstTradeIfNeeded(user.uid);
    }

    // Merge with other accounts' trades to avoid overwriting them.
    // "Other" must be the exact complement of belongsToAccount, or legacy
    // (accountId-less) trades would land in both halves and duplicate.
    const currentAccountId = activeAccount?.id || 'default-main-account';
    try {
      const allSaved = userStorage.getItem('trades');
      if (allSaved) {
        const allTrades = JSON.parse(allSaved) as any[];
        const otherAccountTrades = allTrades.filter((t: any) => !belongsToAccount(t, currentAccountId));
        userStorage.setItem('trades', JSON.stringify([...otherAccountTrades, ...updatedTrades]));
      } else {
        userStorage.setItem('trades', JSON.stringify(updatedTrades));
      }
    } catch {
      // Do NOT write current-account trades over the whole key here: if the
      // existing blob couldn't be read, overwriting it would silently destroy
      // every other account's trades. Surface the failure instead.
      toast.error('Could not save: your existing trades failed to load. Refresh and try again.');
      return;
    }

    // Notify useDemoData subscribers (dashboard widgets, etc.) so they re-read
    // trades live after import/add/edit/delete instead of needing a refresh.
    notifyDataChange();
  };

  // Size of one pip/point for converting SL/TP distances into a price move.
  const pipSizeFor = (market?: string, symbol?: string): number => {
    if (market === 'forex') {
      const s = (symbol || '').toUpperCase();
      return /JPY|HUF|THB/.test(s) ? 0.01 : 0.0001;
    }
    return 1; // futures/indices are entered in points
  };

  // Convert a Stop Loss / Take Profit entered as pips or points into an absolute
  // price level. Values entered as 'price' (the default) pass through unchanged.
  const resolveSlTpPrice = (
    value: number | undefined,
    kind: 'sl' | 'tp',
    data: TradeFormData
  ): number | undefined => {
    if (value === undefined || value === null || isNaN(value)) return undefined;
    const unit = data.slTpUnit || 'price';
    if (unit === 'price') return value;
    const distance = unit === 'pips' ? value * pipSizeFor(data.market, data.symbol) : value;
    const entry = data.entryPrice || 0;
    const isLong = data.side === 'long';
    if (kind === 'sl') return isLong ? entry - distance : entry + distance;
    return isLong ? entry + distance : entry - distance;
  };

  // Inverse of resolveSlTpPrice: express an absolute price level as the value
  // shown in the chosen unit (price / pips / points), relative to entry + side.
  // Used when the user switches the SL/TP unit so the displayed number keeps
  // meaning the same price level instead of being silently reinterpreted.
  const priceToUnit = (
    price: number | undefined,
    kind: 'sl' | 'tp',
    unit: 'price' | 'pips' | 'points',
    data: TradeFormData
  ): number | undefined => {
    if (price === undefined || price === null || isNaN(price)) return undefined;
    if (unit === 'price') return Math.round(price * 1e8) / 1e8;
    const entry = data.entryPrice || 0;
    const isLong = data.side === 'long';
    const distance = kind === 'sl'
      ? (isLong ? entry - price : price - entry)
      : (isLong ? price - entry : entry - price);
    const value = unit === 'pips' ? distance / pipSizeFor(data.market, data.symbol) : distance;
    return unit === 'pips' ? Math.round(value * 10) / 10 : Math.round(value * 100) / 100;
  };

  const calculatePnL = (data: TradeFormData): { pnl: number; pnlPercentage: number; riskReward: number } => {
    const { side, entryPrice, exitPrice, stopLoss, takeProfit, lotSize, commission, fees, swap, spread, market = 'forex', customMultiplier } = data;
    const symbol = data.symbol?.toUpperCase() || '';

    // Gross P&L (contract multipliers, lot/contract count, quote-currency
    // conversion) lives in the shared module used by all entry paths.
    const grossPnL = calculateGrossPnl({ symbol, market, side, entryPrice, exitPrice, quantity: lotSize, customMultiplier });

    // Spread cost — spread is entered in pips (forex) / ticks or points (futures, indices)
    let spreadCost = 0;
    if (customMultiplier && customMultiplier > 0) {
      spreadCost = spread * customMultiplier * lotSize;
    } else if (market === 'forex') {
      spreadCost = spread * lotSize * 10; // ≈$10 per pip per standard lot
    } else if (market === 'futures') {
      spreadCost = spread * getFuturesMultiplier(symbol) * lotSize;
    } else if (market === 'indices') {
      spreadCost = spread * lotSize;
    }

    const pnl = grossPnL - commission - (fees || 0) - swap - spreadCost;
    const pnlPercentage = computePnlPercentage({ pnl, symbol, market, entryPrice, quantity: lotSize, customMultiplier });
    
    // Calculate Risk-Reward ratio properly
    let riskReward = 0;
    if (stopLoss && takeProfit) {
      // If we have SL and TP, calculate based on planned levels and trade direction
      let risk = 0;
      let reward = 0;
      
      if (side === 'long') {
        // Long trade: risk = entry - stop, reward = target - entry
        risk = entryPrice - stopLoss;
        reward = takeProfit - entryPrice;
      } else {
        // Short trade: risk = stop - entry, reward = entry - target
        risk = stopLoss - entryPrice;
        reward = entryPrice - takeProfit;
      }
      
      // Ensure both risk and reward are positive for valid R:R calculation
      if (risk > 0 && reward > 0) {
        riskReward = reward / risk;
      } else {
        riskReward = 0; // Invalid stop/target levels for this trade direction
      }
    }
    // Without SL/TP we can't calculate a meaningful R:R
    
    return { pnl, pnlPercentage, riskReward };
  };

  const onSubmit = (data: TradeFormData) => {
    if (demoGuard('save your trades')) return;

    // Normalize SL/TP to absolute price levels (they may be entered as pips/points)
    const stopLoss = resolveSlTpPrice(data.stopLoss, 'sl', data);
    const takeProfit = resolveSlTpPrice(data.takeProfit, 'tp', data);
    const calcData: TradeFormData = { ...data, stopLoss, takeProfit };

    let pnl: number;
    let pnlPercentage: number;
    let riskReward: number = 0;

    if (data.useManualPnL && data.manualPnL !== undefined) {
      pnl = data.manualPnL;
      pnlPercentage = computePnlPercentage({ pnl, symbol: data.symbol || '', market: data.market || 'forex', entryPrice: data.entryPrice, quantity: data.lotSize, customMultiplier: data.customMultiplier });

      if (stopLoss) {
        const risk = data.side === 'long'
          ? data.entryPrice - stopLoss
          : stopLoss - data.entryPrice;
        const actualMove = Math.abs(data.exitPrice - data.entryPrice);
        riskReward = risk > 0 ? actualMove / risk : 0;
      }
    } else if (editingTrade?.brokerPnL !== undefined) {
      // Imported trade: the broker's P&L is the source of truth (gross of fees).
      // Editing other fields should NOT re-derive it from prices — only subtract
      // the commission/fees/swap the user adds. This prevents the P&L from jumping
      // to a wrong value on edit.
      pnl = editingTrade.brokerPnL - (data.commission || 0) - (data.fees || 0) - (data.swap || 0);
      pnlPercentage = computePnlPercentage({ pnl, symbol: data.symbol || '', market: data.market || 'forex', entryPrice: data.entryPrice, quantity: data.lotSize, customMultiplier: data.customMultiplier });
      riskReward = calculatePnL(calcData).riskReward;
    } else {
      const calculated = calculatePnL(calcData);
      pnl = calculated.pnl;
      pnlPercentage = calculated.pnlPercentage;
      riskReward = calculated.riskReward;
    }

    if (data.manualRR && data.manualRR > 0) {
      riskReward = data.manualRR;
    }

    const newTrade: Trade = {
      id: editingTrade?.id || Date.now().toString(),
      ...data,
      stopLoss,
      takeProfit,
      brokerPnL: editingTrade?.brokerPnL,
      pnl,
      pnlPercentage,
      riskReward,
      entryTime: new Date(data.entryTime),
      exitTime: new Date(data.exitTime),
      accountId: activeAccount?.id, // undefined = legacy-default bucket, still visible on default accounts
    };

    if (editingTrade) {
      const updatedTrades = trades.map((t) => (t.id === editingTrade.id ? newTrade : t));
      saveTrades(updatedTrades);
      trackEvent('trade_edited', { symbol: newTrade.symbol, side: newTrade.side });
      toast.success(`${newTrade.symbol} trade updated`);
      setEditingTrade(null);
    } else {
      saveTrades([...trades, newTrade]);
      trackEvent('trade_created', { symbol: newTrade.symbol, side: newTrade.side, market: newTrade.market });
      trackTradeLogged(1, 'manual');
      toast.success(`${newTrade.symbol} trade saved`);
      setJournalPromptTrade(newTrade);
      // Check risk rules after saving (warn only, never block)
      if (pnl < 0) checkRiskRules(pnl, newTrade.exitTime);

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
    }

    form.reset();
    setIsDialogOpen(false);
  };

  const handleEdit = (trade: Trade) => {
    setEditingTrade(trade);
    const hasAutoRR = trade.stopLoss && trade.takeProfit;
    form.reset({
      ...trade,
      entryTime: trade.entryTime as any,
      exitTime: trade.exitTime as any,
      slTpUnit: 'price', // stored SL/TP are always absolute price levels
      useManualPnL: trade.useManualPnL || false,
      manualPnL: trade.manualPnL,
      manualRR: !hasAutoRR && trade.riskReward ? trade.riskReward : undefined,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (demoGuard('delete trades')) return;
    if (!window.confirm('Are you sure you want to delete this trade?')) return;
    const updatedTrades = trades.filter((t) => t.id !== id);
    saveTrades(updatedTrades);
    trackEvent('trade_deleted');
  };

  const handleBulkDelete = () => {
    if (demoGuard('delete trades')) return;
    if (selectedTradeIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedTradeIds.size} selected trade${selectedTradeIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    const updatedTrades = trades.filter((t) => !selectedTradeIds.has(t.id));
    saveTrades(updatedTrades);
    setSelectedTradeIds(new Set());
    toast.success(`Deleted ${selectedTradeIds.size} trade${selectedTradeIds.size > 1 ? 's' : ''}`);
  };

  const toggleTradeSelection = (id: string) => {
    setSelectedTradeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Header checkbox: select/deselect every row on the current page, keeping any
  // selections made on other pages intact.
  const toggleSelectPage = () => {
    const pageIds = paginatedTrades.map(t => t.id);
    const everyPageRowSelected = pageIds.length > 0 && pageIds.every(id => selectedTradeIds.has(id));
    setSelectedTradeIds(prev => {
      const next = new Set(prev);
      pageIds.forEach(id => (everyPageRowSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  // Banner action: select every trade that matches the current filters, across all pages.
  const selectAllMatching = () => {
    setSelectedTradeIds(new Set(displayedTrades.map(t => t.id)));
  };

  const checkRiskRules = (newPnl: number, tradeDate: Date): void => {
    try {
      const rulesRaw = userStorage.getItem('riskRules');
      if (!rulesRaw) return;
      const rules: { id: string; type: string; value: number; enabled: boolean; violations?: number }[] = JSON.parse(rulesRaw);
      const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const today = dayKey(tradeDate);
      const violations: { id: string; type: string; value: number; enabled: boolean; violations?: number }[] = [];

      for (const rule of rules) {
        if (!rule.enabled) continue;

        if (rule.type === 'maxLossPerDay' && newPnl < 0) {
          const todayPnl = trades
            .filter(t => dayKey(new Date(t.exitTime)) === today)
            .reduce((sum, t) => sum + t.pnl, 0) + newPnl;
          if (todayPnl < -rule.value) {
            violations.push(rule);
            toast.warning(`Daily loss limit breached`, {
              description: `Today's P&L is -${currencySymbol}${Math.abs(todayPnl).toFixed(2)}, exceeding your ${currencySymbol}${rule.value} limit.`,
              duration: 6000,
            });
          }
        }

        if (rule.type === 'maxLossPerTrade' && newPnl < -rule.value) {
          violations.push(rule);
          toast.warning(`Per-trade loss limit breached`, {
            description: `This trade lost ${currencySymbol}${Math.abs(newPnl).toFixed(2)}, exceeding your ${currencySymbol}${rule.value} limit.`,
            duration: 6000,
          });
        }
      }

      if (violations.length > 0) {
        const updatedRules = rules.map(r =>
          violations.some(v => v.id === r.id)
            ? { ...r, violations: (r.violations || 0) + 1 }
            : r
        );
        userStorage.setItem('riskRules', JSON.stringify(updatedRules));
      }
    } catch {
      // Non-critical
    }
  };

  const processCsvFile = async (file: File) => {
    setCsvUploadState({ isUploading: true });

    try {
      const content = await validateCSVFile(file);
      let result = parseCSV(content);

      // If auto-detect failed, try to rescue the import silently before bothering
      // the user: replay a mapping they previously confirmed for this file shape,
      // or (Pro only) ask the LLM to map the columns. The app learns each user's
      // brokers; Pro users get any broker auto-mapped.
      if (!result.success && result.trades.length === 0) {
        const rescued = await rescueFailedImport({
          content,
          headers: parseCSVHeaders(content),
          storage: userStorage,
          isPro,
          isDemo,
          source: 'tradelog',
        });
        if (rescued.kind === 'parsed') result = rescued.result;
      }

      // Still nothing: offer manual column mapping instead of dead-ending on an
      // unrecognized format.
      if (!result.success && result.trades.length === 0) {
        // Telemetry: surface unsupported formats proactively. Column names only —
        // no row/trade data — so this carries no PII.
        const headers = parseCSVHeaders(content);
        trackEvent('csv_import_failed', {
          source: 'tradelog',
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
        // Show preview dialog (existing behavior)
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

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (demoGuard('import trades')) { event.target.value = ''; return; }

    await processCsvFile(files[0]);
    // Clear file input so re-selecting the same file re-triggers onChange
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
    
    setCsvUploadState({ isUploading: true });
    setCsvPreview({ show: false, file: null, parseResult: null });
    
    const result = csvPreview.parseResult;
    const file = csvPreview.file;
    
    try {
      if (result.success) {
        // Shared converter: gross broker P&L minus commission/fees as net, gross
        // preserved as brokerPnL, real entry/exit dates, market auto-detected.
        const importedTrades = buildImportedTrades(result.trades, {
          fileName: file.name,
          accountId: activeAccount?.id || '', // '' = legacy-default bucket, still visible on default accounts
        });

        // Deduplicate against existing trades on key fields.
        const { newTrades, skippedCount } = dedupeImportedTrades(trades, importedTrades);

        const updatedTrades = [...trades, ...newTrades] as Trade[];
        saveTrades(updatedTrades);

        const description = skippedCount > 0
          ? `${skippedCount} duplicate trade${skippedCount > 1 ? 's' : ''} skipped`
          : result.errors.length > 0
            ? `${result.summary.failed} rows had errors and were skipped`
            : 'P&L is net — broker commissions and fees subtracted automatically';

        if (newTrades.length > 0) {
          trackEvent('csv_imported', { count: newTrades.length });
          trackTradeLogged(newTrades.length, 'csv');
        }
        toast.success(
          newTrades.length > 0
            ? `Imported ${newTrades.length} new trade${newTrades.length > 1 ? 's' : ''} from ${file.name}`
            : `No new trades to import from ${file.name}`,
          {
            description,
            duration: 6000
          }
        );

        // The activation moment: stream an AI first-read of a meaningful import.
        // When it shows, hold the feedback toast — one ask at a time.
        const showInsight = newTrades.length >= 10 && hasAIAccess && !isDemo;
        if (showInsight) setImportInsightTrades(newTrades);

        if (newTrades.length >= 5 && !showInsight) {
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

        // Dialog already closed at start of function
        
      } else {
        toast.error('Failed to import file', {
          description: result.errors.join(', ')
        });
      }
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import file');
    } finally {
      setCsvUploadState({ isUploading: false });
      // Reset the file input
      const fileInput = document.getElementById('csv-import') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleMappingConfirm = () => {
    if (!columnMapping) return;
    const { csvContent, mappings, file, headers } = columnMapping;

    // Validate that all required fields are mapped
    const requiredFields = ['symbol', 'side', 'openPrice', 'closePrice', 'quantity', 'pnl'];
    const unmapped = requiredFields.filter(f => mappings[f] === undefined || mappings[f] < 0);
    if (unmapped.length > 0) {
      toast.error('Missing required mappings', {
        description: `Please map: ${unmapped.join(', ')}`,
      });
      return;
    }

    const result = parseCSVWithMappings(csvContent, mappings);
    // The user rescued an unrecognized format: report the mapping (a spec for a
    // future built-in detector) and remember it so this broker auto-imports next
    // time. Only when it actually yielded trades.
    if (result.success && result.trades.length > 0) {
      trackImportMapped('tradelog', headers, mappings);
      rememberMapping(userStorage, headers, mappings);
    }
    setColumnMapping(null);
    setCsvPreview({
      show: true,
      file,
      parseResult: result,
    });
  };

  const handleCSVExport = (fromDate?: Date, toDate?: Date) => {
    const escapeCSV = (val: unknown): string => {
      let s: string;
      if (val instanceof Date) s = format(val, 'yyyy-MM-dd HH:mm:ss');
      else if (val === undefined || val === null) s = '';
      else s = String(val);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    let exportTrades = trades;
    if (fromDate || toDate) {
      const to = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59) : null;
      // Filter on exitTime — the same date every other surface (table, filters,
      // stats) uses — so "This month" exports the trades "This month" shows.
      exportTrades = trades.filter(t => {
        const d = t.exitTime instanceof Date ? t.exitTime : new Date(t.exitTime);
        if (fromDate && d < fromDate) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    // Every stored field the user can enter — an export must survive a
    // re-import (or an Excel round trip) without losing SL/TP, emotions, etc.
    const headers = ['symbol', 'side', 'entryPrice', 'exitPrice', 'lotSize', 'entryTime', 'exitTime', 'spread', 'commission', 'fees', 'swap', 'pnl', 'pnlPercentage', 'riskReward', 'strategy', 'market', 'notes', 'stopLoss', 'takeProfit', 'emotions', 'tags', 'propFirm', 'useManualPnL', 'manualPnL', 'customMultiplier'];
    const csvContent = [
      headers.join(','),
      ...exportTrades.map(trade =>
        headers.map(header => {
          if (header === 'lotSize' && !trade[header as keyof Trade]) {
            return escapeCSV((trade as any).quantity || 1);
          }
          return escapeCSV(trade[header as keyof Trade]);
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `trades_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    a.click();
    toast.success(`${exportTrades.length} trade${exportTrades.length === 1 ? '' : 's'} exported`);
    setExportPopoverOpen(false);
  };


  // Enhanced loading and stats state
  const [isLoading, setIsLoading] = useState(true);
  const [quickStats, setQuickStats] = useState({
    totalPnL: 0,
    winRate: 0,
    totalTrades: 0,
    avgRR: 0,
    winCount: 0,
    lossCount: 0,
    avgWin: 0,
    avgLoss: 0,
    bestTrade: 0,
    bestTradeSymbol: '--',
    worstTrade: 0,
    profitFactor: 0,
    pnlPct: 0,
    validRRCount: 0,
  });

  // Calculate quick stats
  const calculateQuickStats = (tradeList: Trade[]) => {
    const totalTrades = tradeList.length;
    const totalPnL = tradeList.reduce((sum, trade) => sum + trade.pnl, 0);
    const winners = tradeList.filter(trade => trade.pnl > 0);
    const losers = tradeList.filter(trade => trade.pnl < 0);
    const winRate = totalTrades > 0 ? (winners.length / totalTrades) * 100 : 0;

    const validRRTrades = tradeList.filter(trade => trade.riskReward && trade.riskReward > 0);
    const avgRR = validRRTrades.length > 0
      ? validRRTrades.reduce((sum, trade) => sum + (trade.riskReward || 0), 0) / validRRTrades.length
      : 0;

    const winCount = winners.length;
    const lossCount = losers.length;
    const avgWin = winCount > 0 ? winners.reduce((s, t) => s + t.pnl, 0) / winCount : 0;
    const avgLoss = lossCount > 0 ? Math.abs(losers.reduce((s, t) => s + t.pnl, 0) / lossCount) : 0;
    const bestTradeVal = tradeList.length > 0 ? Math.max(0, ...tradeList.map(t => t.pnl)) : 0;
    const bestTradeSymbol = tradeList.find(t => t.pnl === bestTradeVal)?.symbol || '--';
    const worstTrade = tradeList.length > 0 ? Math.min(0, ...tradeList.map(t => t.pnl)) : 0;
    const grossProfit = winners.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losers.reduce((s, t) => s + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
    const accountSize = activeAccount?.balance || settings.accountSize || 10000;
    const pnlPct = Math.abs((totalPnL / accountSize) * 100);

    setQuickStats({
      totalPnL, winRate, totalTrades, avgRR,
      winCount, lossCount, avgWin, avgLoss,
      bestTrade: bestTradeVal, bestTradeSymbol,
      worstTrade, profitFactor, pnlPct,
      validRRCount: validRRTrades.length,
    });
  };

  // Load trades — synchronous localStorage read, no artificial delay (the old
  // 800ms setTimeout showed a fake skeleton on every visit).
  useEffect(() => {
    setIsLoading(true);
    const loadTrades = () => {
      // Demo mode: load demo trades directly
      if (isDemo) {
        const demoTrades = getDemoTrades().map((trade: any) => ({
          ...trade,
          entryTime: new Date(trade.entryTime),
          exitTime: new Date(trade.exitTime),
        }));
        setTrades(demoTrades);
        calculateQuickStats(demoTrades);
        setIsLoading(false);
        return;
      }

      const savedTrades = userStorage.getItem('trades');
      if (savedTrades) {
        try {
          const parsedTrades = JSON.parse(savedTrades);
          let rrBackfilled = false;
          const tradesWithDates = parsedTrades.map((trade: any) => {
            const tradeWithDates = {
              ...trade,
              entryTime: new Date(trade.entryTime),
              exitTime: new Date(trade.exitTime)
            };

            // Recalculate RR if missing — only when SL and TP are set
            if (tradeWithDates.riskReward === undefined || tradeWithDates.riskReward === null) {
              let riskReward = 0;
              if (trade.stopLoss && trade.takeProfit && trade.entryPrice) {
                let risk = 0;
                let reward = 0;

                if (trade.side === 'long') {
                  risk = trade.entryPrice - trade.stopLoss;
                  reward = trade.takeProfit - trade.entryPrice;
                } else {
                  risk = trade.stopLoss - trade.entryPrice;
                  reward = trade.entryPrice - trade.takeProfit;
                }

                if (risk > 0 && reward > 0) {
                  riskReward = reward / risk;
                }
              }
              // Without SL/TP we can't know the R:R — leave as 0
              tradeWithDates.riskReward = riskReward;
              rrBackfilled = true;
            }
            // Cap any previously stored garbage values
            if (tradeWithDates.riskReward > 100) {
              tradeWithDates.riskReward = 0;
              rrBackfilled = true;
            }

            return tradeWithDates;
          });
          
          // Filter trades by active account
          const filteredTrades = tradesWithDates.filter((trade: any) =>
            !activeAccount || belongsToAccount(trade, activeAccount.id)
          );
          
          setTrades(filteredTrades);
          calculateQuickStats(filteredTrades);
          
          // Persist only when the backfill actually changed a trade — an
          // unconditional write pushed the full blob to cloud sync every visit
          // and could race a stale device against newer remote data.
          if (rrBackfilled) {
            userStorage.setItem('trades', JSON.stringify(tradesWithDates));
          }
        } catch (error) {
          console.error('Error loading trades:', error);
          setTrades([]);
        }
      }

      // Check for prefilled trade form data
      const prefilledTradeForm = userStorage.getItem('prefilledTradeForm');
      if (prefilledTradeForm) {
        try {
          const formData = JSON.parse(prefilledTradeForm);
          
          // Set form values
          form.reset({
            symbol: formData.symbol || '',
            side: formData.side || 'long',
            entryPrice: formData.entryPrice || 0,
            exitPrice: formData.exitPrice || 0,
            stopLoss: formData.stopLoss,
            takeProfit: formData.takeProfit,
            lotSize: formData.lotSize || 1,
            entryTime: formData.entryTime ? new Date(formData.entryTime) : new Date(),
            exitTime: formData.exitTime ? new Date(formData.exitTime) : new Date(),
            spread: formData.spread || 0,
            commission: formData.commission || 0,
            fees: formData.fees || 0,
            swap: formData.swap || 0,
            notes: formData.notes || '',
            strategy: formData.strategy || '',
            emotions: formData.emotions || '',
            market: formData.market || 'forex',
            tags: formData.tags || [],
            useManualPnL: formData.useManualPnL || false,
            manualPnL: formData.manualPnL,
            customMultiplier: formData.customMultiplier,
            propFirm: formData.propFirm || '',
          });
          
          // Open the dialog
          setIsDialogOpen(true);
          
          // Clear the prefilled data from localStorage
          userStorage.removeItem('prefilledTradeForm');
        } catch (error) {
          console.error('Error parsing prefilled trade form data:', error);
          // Clear invalid data
          userStorage.removeItem('prefilledTradeForm');
        }
      }
      
      setIsLoading(false);
    };
    loadTrades();
  }, [activeAccount]);

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-background">
        <SiteHeader />
        {/* Header Skeleton */}
        <div className="border-b">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-96 bg-muted animate-pulse rounded"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-24 bg-muted animate-pulse rounded"></div>
                <div className="h-9 w-24 bg-muted animate-pulse rounded"></div>
                <div className="h-9 w-32 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-muted rounded"></div>
                      <div className="h-8 w-24 bg-muted rounded"></div>
                      <div className="h-3 w-20 bg-muted rounded"></div>
                    </div>
                    <div className="h-10 w-10 bg-muted rounded-lg"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table Skeleton */}
          <Card className="">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-5 w-28 bg-muted animate-pulse rounded"></div>
                    <div className="h-3 w-44 bg-muted animate-pulse rounded"></div>
                  </div>
                <div className="h-6 w-20 bg-muted animate-pulse rounded-full"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 w-full bg-muted/50 animate-pulse rounded-lg"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-screen flex flex-col w-full bg-background relative"
        onDragOver={(e) => { e.preventDefault(); if (!isCsvDragging) setIsCsvDragging(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsCsvDragging(false); }}
        onDrop={handleCsvDrop}
      >
      {isCsvDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
          <div
            className="rounded-2xl border-2 border-dashed px-10 py-8 text-center space-y-3 bg-card shadow-xl"
            style={{ borderColor: themeColors.primary }}
          >
            <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: alpha(themeColors.primary, '12') }}>
              <UploadSimple className="h-6 w-6" style={{ color: themeColors.primary }} />
            </div>
            <p className="text-sm font-medium">Drop CSV to import</p>
            <p className="text-xs text-muted-foreground">MT4 / MT5, Tradovate, IBKR, NinjaTrader, TradeStation</p>
          </div>
        </div>
      )}
      <SiteHeader />
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row justify-between items-center lg:items-center gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
                <ChartLineUp className="h-5 w-5" style={{ color: themeColors.primary }} />
              </div>
              <div className="space-y-0.5">
                <h1 className="font-display text-2xl font-bold" style={{ color: themeColors.primary }}>Trade Log</h1>
                <p className="text-sm text-muted-foreground">Record, review, and analyze every trade.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                onClick={() => {
                  setEditingTrade(null);
                  form.reset();
                  setIsDialogOpen(true);
                }}
                style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Trade
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('csv-import')?.click()}
                disabled={csvUploadState.isUploading}
              >
                <UploadSimple className="mr-2 h-4 w-4" />
                {csvUploadState.isUploading ? 'Processing...' : 'Import'}
              </Button>
              <input
                id="csv-import"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleCSVImport}
              />

              <Popover open={exportPopoverOpen} onOpenChange={setExportPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" disabled={trades.length === 0}>
                    <DownloadSimple className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(24rem,calc(100vw-2rem))] p-4 space-y-3" align="end">
                  <p className="text-sm font-medium">Export trades as CSV</p>
                  <div className="flex gap-1.5">
                    {[
                      { label: 'This month', from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
                      { label: 'This quarter', from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) },
                      { label: 'This year', from: startOfYear(new Date()), to: endOfYear(new Date()) },
                    ].map(({ label, from, to }) => (
                      <button
                        key={label}
                        className="flex-1 text-xs rounded-md border px-1.5 py-1 hover:bg-muted transition-colors"
                        onClick={() => { setExportFrom(from); setExportTo(to); }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <DatePicker date={exportFrom} onDateChange={setExportFrom} placeholder="Start date" className="w-full h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <DatePicker date={exportTo} onDateChange={setExportTo} placeholder="End date" className="w-full h-8 text-sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">Leave blank to export all trades</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-8" onClick={() => handleCSVExport(exportFrom, exportTo)}>
                      Download
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-muted-foreground" onClick={() => { setExportFrom(undefined); setExportTo(undefined); }}>
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>


              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPdfDialogOpen(true)}
                disabled={trades.length === 0}
              >
                <FileArrowDown className="mr-2 h-4 w-4" />
                PDF
              </Button>

              {/* AI Auto-Tag calls the auth-required aiAssist backend and has no
                  canned demo path, so it can't work for the fake demo user —
                  hide it in demo rather than show a button that only errors. */}
              {!isDemo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsStrategyTaggerOpen(true)}
                  disabled={trades.length === 0}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  AI Auto-Tag
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Risk Alerts */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <AIRiskAlertMonitor />
      </div>

      {/* Pro nudge — contextual after trades list */}
      {!isPro && !isDemo && trades.length >= 5 && (
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <ProUpgradeCard
            icon={FileArrowDown}
            title="Generate professional PDF reports"
            description={`Export your ${trades.length} trades as a detailed performance report — perfect for prop firm applications or tracking progress.`}
            cta="Unlock with Pro"
            dismissKey="tradelog-pdf"
          />
        </div>
      )}


      {/* PDF Report Dialog */}
      <PDFReportDialog
        open={isPdfDialogOpen}
        onOpenChange={setIsPdfDialogOpen}
        trades={trades}
        journalEntries={getJournalEntries()}
        accountName={activeAccount?.name}
      />

      {/* Add Trade Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-4xl max-h-[90svh] sm:max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
                        <ChartLineUp className="h-4 w-4" style={{ color: themeColors.primary }} />
                      </div>
                      {editingTrade ? 'Edit Trade' : 'Add New Trade'}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      Enter your trade details below. All fields marked with * are required.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Crosshair className="h-4 w-4" style={{ color: themeColors.primary }} />
                          <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Setup</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="market"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Market Type</FormLabel>
                                <Select onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue('symbol', '');
                                }} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-background/60 border-border/50">
                                      <SelectValue placeholder="Select market" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="forex">Forex</SelectItem>
                                    <SelectItem value="futures">Futures</SelectItem>
                                    <SelectItem value="indices">Indices</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="symbol"
                            rules={{ required: 'Symbol is required' }}
                            render={({ field }) => {
                              const marketInstruments = getInstrumentsByMarket(watchedMarket || 'forex');
                              return (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Instrument *</FormLabel>
                                  <FormControl>
                                    <InstrumentCombobox
                                      value={field.value}
                                      onChange={(value) => {
                                        field.onChange(value);
                                        const detectedMarket = detectMarketFromSymbol(value);
                                        form.setValue('market', detectedMarket);
                                      }}
                                      categories={marketInstruments}
                                      placeholder={`Select ${watchedMarket || 'forex'} instrument`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                          <FormField
                            control={form.control}
                            name="side"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Direction *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-background/60 border-border/50">
                                      <SelectValue placeholder="Select side" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="long">Long (Buy)</SelectItem>
                                    <SelectItem value="short">Short (Sell)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="propFirm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Prop Firm</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-background/60 border-border/50">
                                    <SelectValue placeholder="Select prop firm" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="E8 Markets">E8 Markets</SelectItem>
                                  <SelectItem value="Funded FX">Funded FX</SelectItem>
                                  <SelectItem value="FundingPips">FundingPips</SelectItem>
                                  <SelectItem value="TopStep">TopStep</SelectItem>
                                  <SelectItem value="FTMO">FTMO</SelectItem>
                                  <SelectItem value="Alpha Capital Group">Alpha Capital Group</SelectItem>
                                  <SelectItem value="Apex Trader Funding">Apex Trader Funding</SelectItem>
                                  <SelectItem value="The5ers">The5ers</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <ArrowsLeftRight className="h-4 w-4" style={{ color: themeColors.primary }} />
                          <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Execution</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="entryPrice"
                            rules={{ required: 'Entry price is required', min: 0 }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Entry Price *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.00001"
                                    className="bg-background/60 border-border/50 font-semibold"
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="exitPrice"
                            rules={{ required: 'Exit price is required', min: 0 }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Exit Price *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.00001"
                                    className="bg-background/60 border-border/50 font-semibold"
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lotSize"
                            rules={{ required: 'Quantity is required', min: 0 }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">{quantityLabelForMarket(watchedMarket)} *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder={watchedMarket === 'futures' ? '2' : '1.0'}
                                    className="bg-background/60 border-border/50 font-semibold"
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="entryTime"
                            rules={{ required: 'Entry time is required' }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Entry Time *</FormLabel>
                                <FormControl>
                                  <DateTimePicker
                                    date={field.value ? new Date(field.value) : undefined}
                                    onDateChange={(date) => field.onChange(date)}
                                    placeholder="Select entry date and time"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="exitTime"
                            rules={{ required: 'Exit time is required' }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Exit Time *</FormLabel>
                                <FormControl>
                                  <DateTimePicker
                                    date={field.value ? new Date(field.value) : undefined}
                                    onDateChange={(date) => field.onChange(date)}
                                    placeholder="Select exit date and time"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Crosshair className="h-4 w-4" style={{ color: themeColors.primary }} />
                            <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Risk Management</span>
                          </div>
                          <FormField
                            control={form.control}
                            name="slTpUnit"
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <Select value={field.value ?? 'price'} onValueChange={(newUnit) => {
                                  const oldUnit = (field.value ?? 'price') as 'price' | 'pips' | 'points';
                                  if (newUnit === oldUnit) return;
                                  const ctx = {
                                    entryPrice: form.getValues('entryPrice'),
                                    side: form.getValues('side'),
                                    market: form.getValues('market'),
                                    symbol: form.getValues('symbol'),
                                  } as TradeFormData;
                                  const slRaw = form.getValues('stopLoss');
                                  const tpRaw = form.getValues('takeProfit');
                                  field.onChange(newUnit);
                                  // Nothing entered yet — just switch the unit.
                                  if (slRaw === undefined && tpRaw === undefined) return;
                                  // Converting to/from pips/points needs an entry price as the
                                  // reference. Without one, any prior value is meaningless — clear it.
                                  if (!ctx.entryPrice || isNaN(ctx.entryPrice)) {
                                    form.setValue('stopLoss', undefined);
                                    form.setValue('takeProfit', undefined);
                                    toast.info('Enter an entry price first, then set SL/TP.');
                                    return;
                                  }
                                  // Re-express the same price level in the new unit.
                                  const slPrice = resolveSlTpPrice(slRaw, 'sl', { ...ctx, slTpUnit: oldUnit });
                                  const tpPrice = resolveSlTpPrice(tpRaw, 'tp', { ...ctx, slTpUnit: oldUnit });
                                  form.setValue('stopLoss', priceToUnit(slPrice, 'sl', newUnit as 'price' | 'pips' | 'points', ctx));
                                  form.setValue('takeProfit', priceToUnit(tpPrice, 'tp', newUnit as 'price' | 'pips' | 'points', ctx));
                                }}>
                                  <FormControl>
                                    <SelectTrigger className="h-8 w-full sm:w-[150px] bg-background/60 border-border/50 text-xs">
                                      <SelectValue placeholder="Units" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="price">Price level</SelectItem>
                                    {watchedMarket === 'forex'
                                      ? <SelectItem value="pips">Pips from entry</SelectItem>
                                      : <SelectItem value="points">Points from entry</SelectItem>}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>
                        {(() => {
                          const unit = form.watch('slTpUnit') || 'price';
                          const isPrice = unit === 'price';
                          const unitLabel = unit === 'pips' ? ' (pips)' : unit === 'points' ? ' (points)' : '';
                          const slStep = isPrice ? '0.00001' : '0.1';
                          const slPlaceholder = isPrice ? 'e.g. 1.0850' : unit === 'pips' ? 'e.g. 20' : 'e.g. 10';
                          const tpPlaceholder = isPrice ? 'e.g. 1.0950' : unit === 'pips' ? 'e.g. 40' : 'e.g. 20';
                          return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="stopLoss"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Stop Loss{unitLabel}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step={slStep}
                                    placeholder={slPlaceholder}
                                    className="bg-background/60 border-border/50 font-semibold"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="takeProfit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Take Profit{unitLabel}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step={slStep}
                                    placeholder={tpPlaceholder}
                                    className="bg-background/60 border-border/50 font-semibold"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="manualRR"
                            render={({ field }) => {
                              const side = form.watch('side');
                              const entry = form.watch('entryPrice');
                              const partial = {
                                entryPrice: entry,
                                side,
                                market: form.watch('market'),
                                symbol: form.watch('symbol'),
                                slTpUnit: form.watch('slTpUnit'),
                              } as TradeFormData;
                              const sl = resolveSlTpPrice(form.watch('stopLoss'), 'sl', partial);
                              const tp = resolveSlTpPrice(form.watch('takeProfit'), 'tp', partial);
                              let autoRR = '';
                              if (sl && tp && entry) {
                                const risk = side === 'long' ? entry - sl : sl - entry;
                                const reward = side === 'long' ? tp - entry : entry - tp;
                                if (risk > 0 && reward > 0) autoRR = (reward / risk).toFixed(2);
                              }
                              const isAuto = (field.value === undefined || field.value === null) && !!autoRR;
                              return (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">R:R Ratio</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="e.g. 2.5"
                                      className="bg-background/60 border-border/50 font-semibold"
                                      {...field}
                                      value={field.value ?? (autoRR || '')}
                                      onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                  </FormControl>
                                  {isAuto && (
                                    <p className="text-xs text-muted-foreground">
                                      Auto-calculated from SL/TP — type to override
                                    </p>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>
                          );
                        })()}
                      </div>

                      <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4" style={{ color: themeColors.primary }} />
                          <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Costs</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                          <FormField
                            control={form.control}
                            name="spread"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Spread</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.0001"
                                    placeholder="0.0002"
                                    className="bg-background/60 border-border/50 font-semibold"
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="commission"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Commission</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="7.00"
                                    className="bg-background/60 border-border/50 font-semibold"
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="fees"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Fees</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="1.34"
                                    className="bg-background/60 border-border/50 font-semibold"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="swap"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Swap/Rollover</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="-2.50"
                                    className="bg-background/60 border-border/50 font-semibold"
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" style={{ color: themeColors.primary }} />
                          <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Context</span>
                        </div>
                        <FormField
                          control={form.control}
                          name="strategy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Strategy</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Trend Following, Mean Reversion, Breakout"
                                  className="bg-background/60 border-border/50"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="emotions"
                          render={({ field }) => {
                            const selected = field.value ? field.value.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                            const toggle = (emotion: string) => {
                              const next = selected.includes(emotion) ? selected.filter((e: string) => e !== emotion) : [...selected, emotion];
                              field.onChange(next.join(', '));
                            };
                            return (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Emotions</FormLabel>
                                <div className="flex flex-wrap gap-2">
                                  {['Confident', 'Disciplined', 'Patient', 'Anxious', 'Fearful', 'FOMO', 'Greedy', 'Revenge', 'Frustrated', 'Uncertain'].map(e => (
                                    <button
                                      key={e}
                                      type="button"
                                      onClick={() => toggle(e)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-150 ${
                                        selected.includes(e)
                                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
                                          : 'bg-muted/50 border-border/70 text-muted-foreground hover:border-border hover:text-foreground'
                                      }`}
                                    >
                                      {e}
                                    </button>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="min-h-[100px] px-4 py-3 text-sm bg-background/60 border-border/50"
                                  placeholder="Trade analysis, market conditions, lessons learned..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="rounded-xl border bg-card/50 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Sliders className="h-4 w-4" style={{ color: themeColors.primary }} />
                          <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Advanced</span>
                        </div>
                        <FormField
                          control={form.control}
                          name="customMultiplier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                Custom Multiplier (Optional)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Leave blank to use default multiplier"
                                  className="bg-background/60 border-border/50"
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                />
                              </FormControl>
                              <p className="text-sm text-muted-foreground">
                                Override the default multiplier for custom contracts or specific broker settings
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {watchedMarket === 'futures' && form.watch('symbol') && (
                          <div className="p-4 bg-muted/50 rounded-lg border border-border/70">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-muted-foreground">Contract Details</p>
                                <p className="text-lg font-bold">
                                  {(() => {
                                    const symbol = form.watch('symbol')?.toUpperCase() || '';
                                    if (symbol.includes('MES')) return 'Micro E-mini S&P 500 - $5 per point';
                                    if (symbol.includes('MNQ')) return 'Micro E-mini Nasdaq - $2 per point';
                                    if (symbol.includes('MYM')) return 'Micro E-mini Dow - $0.50 per point';
                                    if (symbol.includes('M2K')) return 'Micro Russell 2000 - $5 per point';
                                    if (symbol.includes('MGC')) return 'Micro Gold - $10 per oz';
                                    if (symbol.includes('MCL')) return 'Micro Crude Oil - $100 per barrel';
                                    if (symbol.includes('ES')) return 'E-mini S&P 500 - $50 per point';
                                    if (symbol.includes('NQ')) return 'E-mini Nasdaq - $20 per point';
                                    if (symbol.includes('YM')) return 'E-mini Dow - $5 per point';
                                    if (symbol.includes('RTY')) return 'Russell 2000 - $50 per point';
                                    if (symbol.includes('GC')) return 'Gold - $100 per oz';
                                    if (symbol.includes('CL')) return 'Crude Oil - $1,000 per barrel';
                                    return 'Custom Contract - $1 per point';
                                  })()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                  {form.watch('lotSize') || 1} contract{(form.watch('lotSize') || 1) !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        <FormField
                          control={form.control}
                          name="useManualPnL"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-medium cursor-pointer">
                                Use Manual P&L (Override Auto-Calculation)
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        {form.watch('useManualPnL') && (
                          <FormField
                            control={form.control}
                            name="manualPnL"
                            rules={{ required: form.watch('useManualPnL') ? 'Manual P&L is required when override is enabled' : false }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Manual P&L *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter exact P&L (e.g., -50.00 for loss, 100.00 for profit)"
                                    className="bg-background/60 border-border/50 font-semibold"
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                                <p className="text-sm text-muted-foreground mt-1">
                                  Enter the exact profit/loss from your broker statement
                                </p>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      {/* Chart + News context for the selected symbol */}
                      {editingTrade && form.watch('symbol') && (
                        <Suspense fallback={null}>
                          <div className="space-y-3 pt-2">
                            <div className="rounded-xl border bg-card/50 overflow-hidden">
                              <TradingViewMiniChart symbol={form.watch('symbol')} height={180} />
                            </div>
                            <MarketNewsFeed symbol={form.watch('symbol')} maxItems={3} />
                          </div>
                        </Suspense>
                      )}

                      <div className="flex justify-end gap-4 pt-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="px-8">
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="px-8"
                          style={{
                            backgroundColor: themeColors.primary,
                            color: themeColors.primaryButtonText
                          }}
                        >
                          {editingTrade ? 'Update Trade' : 'Add Trade'}
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Stats */}
        <TooltipProvider>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 2xl:grid-cols-4 mb-6">
            {/* Total P&L */}
            <Card className="relative overflow-visible hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                      style={{ color: quickStats.totalPnL >= 0 ? themeColors.profit : themeColors.loss }}
                    >
                      {quickStats.totalPnL >= 0 ? <TrendUp className="h-3 w-3" /> : <TrendDown className="h-3 w-3" />}
                      {quickStats.totalPnL >= 0 ? '+' : '-'}{quickStats.pnlPct.toFixed(1)}%
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="p-2 border bg-popover">
                    <p className="text-xs">Percentage of account balance</p>
                  </TooltipContent>
                </Tooltip>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight tabular-nums"
                   style={{ color: quickStats.totalPnL >= 0 ? themeColors.profit : themeColors.loss }}>
                  {quickStats.totalPnL >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(quickStats.totalPnL).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
                <div className="mt-3 space-y-0.5">
                  <p className="text-sm font-medium" style={{ color: themeColors.primary }}>
                    Avg {quickStats.totalTrades > 0 ? (quickStats.totalPnL / quickStats.totalTrades >= 0 ? '+' : '-') + currencySymbol + Math.abs(quickStats.totalPnL / quickStats.totalTrades).toFixed(0) : currencySymbol + '0'} per trade
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quickStats.totalTrades} trades recorded
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Win Rate */}
            <Card className="relative overflow-visible hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                <div
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                  style={{ color: quickStats.winRate >= 50 ? themeColors.profit : themeColors.loss }}
                >
                  {quickStats.winCount}W / {quickStats.lossCount}L
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-3xl font-bold tracking-tight tabular-nums"
                         style={{ color: quickStats.winRate >= 50 ? themeColors.profit : themeColors.loss }}>
                      {quickStats.winRate.toFixed(1)}%
                    </div>
                    <div className="mt-3 space-y-0.5">
                      <p className="text-sm font-medium" style={{ color: quickStats.winRate >= 50 ? themeColors.profit : themeColors.loss }}>
                        {Math.abs(quickStats.winRate - 50).toFixed(0)}pts {quickStats.winRate >= 50 ? 'above' : 'below'} 50%
                      </p>
                      <p className="text-xs">
                        <span style={{ color: themeColors.profit }}>{currencySymbol}{quickStats.avgWin.toFixed(0)} avg win</span>
                        {' / '}
                        <span style={{ color: themeColors.loss }}>{currencySymbol}{quickStats.avgLoss.toFixed(0)} avg loss</span>
                      </p>
                    </div>
                  </div>
                  <div className="w-16 h-16 relative">
                    <ChartContainer
                      config={{
                        wins: { label: "Wins", color: themeColors.profit },
                        losses: { label: "Losses", color: themeColors.loss }
                      }}
                      className="w-full h-full"
                    >
                      <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie
                          data={[
                            { type: "wins", count: quickStats.winCount, fill: themeColors.profit },
                            { type: "losses", count: quickStats.lossCount, fill: themeColors.loss }
                          ]}
                          dataKey="count"
                          nameKey="type"
                          innerRadius={16}
                          outerRadius={28}
                          strokeWidth={0}
                          activeIndex={0}
                          activeShape={({ outerRadius = 0, ...props }: any) => (
                            <Sector {...props} outerRadius={outerRadius + 2} />
                          )}
                        />
                      </PieChart>
                    </ChartContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Trade */}
            <Card className="relative overflow-visible hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Best Trade</CardTitle>
                <div
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                  style={{ color: themeColors.profit }}
                >
                  <Trophy className="h-3 w-3" />
                  {quickStats.bestTradeSymbol}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight tabular-nums" style={{ color: themeColors.profit }}>
                  +${quickStats.bestTrade.toFixed(0)}
                </div>
                <div className="mt-3 space-y-0.5">
                  <p className="text-sm font-medium" style={{ color: themeColors.loss }}>
                    Worst: {quickStats.worstTrade < 0 ? '-' : ''}{currencySymbol}{Math.abs(quickStats.worstTrade).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quickStats.totalTrades} total trades
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Avg R:R */}
            <Card className="relative overflow-visible hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg R:R</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                        quickStats.validRRCount === 0 && 'text-muted-foreground',
                      )}
                      style={quickStats.validRRCount > 0 ? { color: quickStats.avgRR >= 1.5 ? themeColors.profit : quickStats.avgRR >= 1 ? themeColors.primary : themeColors.loss } : undefined}
                    >
                      {quickStats.validRRCount > 0 && (quickStats.avgRR >= 1 ? <TrendUp className="h-3 w-3" /> : <TrendDown className="h-3 w-3" />)}
                      {quickStats.validRRCount === 0 ? 'No data' : quickStats.avgRR >= 2 ? 'Excellent' : quickStats.avgRR >= 1.5 ? 'Good' : quickStats.avgRR >= 1 ? 'Okay' : 'Low'}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="p-2 border bg-popover">
                    <p className="text-xs">Average reward-to-risk ratio (higher is better)</p>
                  </TooltipContent>
                </Tooltip>
              </CardHeader>
              <CardContent>
                <div className={cn('text-3xl font-bold tracking-tight tabular-nums', quickStats.validRRCount === 0 && 'text-muted-foreground')}
                     style={quickStats.validRRCount > 0 ? { color: quickStats.avgRR >= 1 ? themeColors.profit : themeColors.loss } : undefined}>
                  {quickStats.avgRR > 0 ? `${quickStats.avgRR.toFixed(1)}:1` : '--'}
                </div>
                <div className="mt-3 space-y-0.5">
                  <p className="text-sm font-medium" style={{ color: themeColors.primary }}>
                    PF: {quickStats.profitFactor >= 999 ? '∞' : quickStats.profitFactor.toFixed(2)}x
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quickStats.validRRCount} trades with R:R data
                  </p>
                </div>
              </CardContent>
            </Card>
        </div>
        </TooltipProvider>

        {/* Secondary stats strip */}
        <Card className="border-border/60 mb-2">
          <CardContent className="px-4 !py-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                   style={{ backgroundColor: alpha(themeColors.primary, '10'), color: themeColors.primary }}>
                {quickStats.totalTrades} trades
              </div>
              <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                   style={{ backgroundColor: alpha(themeColors.profit, '10') }}>
                <span className="text-muted-foreground">Avg win</span>
                <span style={{ color: themeColors.profit }}>{currencySymbol}{quickStats.avgWin.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                   style={{ backgroundColor: alpha(themeColors.loss, '10') }}>
                <span className="text-muted-foreground">Avg loss</span>
                <span style={{ color: themeColors.loss }}>{currencySymbol}{quickStats.avgLoss.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium">
                <span className="text-muted-foreground">PF</span>
                <span className="text-foreground">
                  {quickStats.profitFactor >= 999 ? '∞' : quickStats.profitFactor === 0 ? '--' : quickStats.profitFactor.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium">
                <span className="text-muted-foreground">Streak</span>
                {(() => {
                  // Same semantics as the Dashboard streak: chronological, and a
                  // breakeven trade ends the run.
                  let streak = 0;
                  let dir: 'win' | 'loss' | null = null;
                  for (let i = chronoTrades.length - 1; i >= 0; i--) {
                    if (chronoTrades[i].pnl === 0) break;
                    const d = chronoTrades[i].pnl > 0 ? 'win' : 'loss';
                    if (!dir) dir = d;
                    if (d !== dir) break;
                    streak++;
                  }
                  if (!dir) return <span className="text-foreground">--</span>;
                  return (
                    <span style={{ color: dir === 'win' ? themeColors.profit : themeColors.loss }}>
                      {streak}{dir === 'win' ? 'W' : 'L'}
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium">
                <span className="text-muted-foreground">This month</span>
                {(() => {
                  const now = new Date();
                  const monthlyPnL = trades
                    .filter(t => {
                      const d = new Date(t.exitTime);
                      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    })
                    .reduce((s, t) => s + t.pnl, 0);
                  return (
                    <span style={{ color: monthlyPnL >= 0 ? themeColors.profit : themeColors.loss }}>
                      {monthlyPnL >= 0 ? '+' : ''}${monthlyPnL.toFixed(0)}
                    </span>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trades Table */}
        <Card className="">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold">All Trades</CardTitle>
                  {trades.length > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                      {activeFilterCount > 0 ? `${displayedTrades.length} of ${trades.length}` : trades.length}
                    </span>
                  )}
                </div>
                <CardDescription>
                  {trades.length === 0
                    ? 'No trades logged yet'
                    : activeFilterCount > 0
                      ? `Showing ${displayedTrades.length} ${displayedTrades.length === 1 ? 'trade' : 'trades'} · ${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} active`
                      : tradeDateSpan
                        ? `Your trades from ${tradeDateSpan}`
                        : `${trades.length} ${trades.length === 1 ? 'trade' : 'trades'} logged`}
                </CardDescription>
              </div>
              {trades.length > 0 && (
                <TradeLogFilters
                  filters={filters}
                  onChange={setFilters}
                  symbolOptions={symbolOptions}
                  marketOptions={marketOptions}
                  strategyOptions={strategyOptions}
                />
              )}
            </div>
            {activeFilterCount > 0 && (
              <div className="pt-3">
                <TradeLogFilterPills filters={filters} onChange={setFilters} />
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {trades.length === 0 ? (
              <div className="px-6 py-14 flex flex-col items-center text-center gap-8">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
                  <ChartBar className="h-8 w-8" style={{ color: themeColors.primary }} />
                </div>

                <div className="space-y-2 max-w-xs">
                  <h3 className="text-xl font-bold tracking-tight">Your trade log is empty</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Add your first trade manually or import a CSV export from your broker. Your analytics, win rate, and P&L will appear automatically.
                  </p>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => { setEditingTrade(null); form.reset(); setIsDialogOpen(true); }}
                    style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Trade
                  </Button>
                  <Button variant="outline" onClick={() => document.getElementById('csv-import')?.click()}>
                    <UploadSimple className="mr-2 h-4 w-4" />
                    Import CSV
                  </Button>
                </div>

                {/* Tips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left">
                  {([
                    { Icon: UploadSimple, title: 'Import from broker', body: 'Export a CSV from MT4/MT5, IBKR, or Tradovate and import it in one click.' },
                    { Icon: PencilSimple, title: 'Log manually', body: 'Record entry/exit prices, lot size, spread, commission and let us calculate your P&L.' },
                    { Icon: Brain, title: 'AI insights unlock', body: 'Your AI Coach is in the sidebar already; deeper trade analysis and strategy tagging unlock once you log trades.' },
                  ] as const).map((tip) => (
                    <div key={tip.title} className="rounded-xl border border-border/60 bg-muted/50 p-4 space-y-2">
                      <tip.Icon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold text-foreground">{tip.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{tip.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : displayedTrades.length === 0 ? (
              <div className="px-6 py-14 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
                  <ChartBar className="h-6 w-6" style={{ color: themeColors.primary }} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold">No trades match your filters</h3>
                  <p className="text-sm text-muted-foreground">Try removing a filter to see more trades.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setFilters({ ...EMPTY_FILTERS })}>
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
              {/* Bulk actions bar */}
              {selectedTradeIds.size > 0 && (
                <div className="flex items-center gap-3 px-1 py-2 mb-2 rounded-lg bg-muted/60 border border-border/60">
                  <span className="text-sm font-medium text-muted-foreground ml-1">
                    {selectedTradeIds.size} selected
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                    className="h-7 text-xs px-3"
                  >
                    <Trash className="h-3 w-3 mr-1" />
                    Delete selected
                  </Button>
                  {allPageSelected && selectedTradeIds.size < displayedTrades.length && (
                    <button
                      onClick={selectAllMatching}
                      className="text-xs font-medium hover:underline"
                      style={{ color: themeColors.primary }}
                    >
                      Select all {displayedTrades.length} matching
                    </button>
                  )}
                  {selectedTradeIds.size === displayedTrades.length && displayedTrades.length > paginatedTrades.length && (
                    <span className="text-xs text-muted-foreground">All {displayedTrades.length} selected</span>
                  )}
                  <button
                    onClick={() => setSelectedTradeIds(new Set())}
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors mr-2"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Desktop Table View */}
              <div className="hidden md:block w-full overflow-x-auto scrollbar-hide">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/70 hover:bg-transparent">
                      <TableHead className="w-10 py-3">
                        <Checkbox
                          checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
                          onCheckedChange={toggleSelectPage}
                          aria-label="Select all on this page"
                        />
                      </TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground py-3">Date</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Symbol</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Market</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Side</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Entry</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Exit</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Lots</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">P&L</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">R:R</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Strategy</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTrades.map((trade) => (
                      <React.Fragment key={trade.id}>
                      <TableRow className="hover:bg-black/[0.05] dark:hover:bg-white/[0.04] border-b border-border/20">
                        <TableCell className="py-6 w-10">
                          <Checkbox
                            checked={selectedTradeIds.has(trade.id)}
                            onCheckedChange={() => toggleTradeSelection(trade.id)}
                            aria-label="Select trade"
                          />
                        </TableCell>
                        <TableCell className="font-medium py-6 text-sm text-muted-foreground">
                          <div>{format(new Date(trade.exitTime), 'MM/dd/yy')}</div>
                          {(() => {
                            const d = new Date(trade.exitTime);
                            return (d.getHours() !== 0 || d.getMinutes() !== 0) ? (
                              <div className="text-xs text-muted-foreground">{format(d, 'h:mm a')}</div>
                            ) : null;
                          })()}
                        </TableCell>
                        <TableCell className="font-bold text-base">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="text-xs font-medium px-2 py-0.5"
                            style={{
                              backgroundColor: `${alpha(themeColors.primary, '15')}`,
                              color: themeColors.primary,
                              borderColor: `${alpha(themeColors.primary, '30')}`
                            }}
                          >
                            {detectMarketFromSymbol(trade.symbol).toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className="font-medium text-xs px-2 py-0.5"
                            style={{
                              backgroundColor: `${alpha(trade.side === 'long' ? themeColors.profit : themeColors.loss, '15')}`,
                              color: trade.side === 'long' ? themeColors.profit : themeColors.loss,
                              borderColor: `${alpha(trade.side === 'long' ? themeColors.profit : themeColors.loss, '30')}`
                            }}
                            variant="outline"
                          >
                            {trade.side.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm tabular-nums">{formatPrice(trade.entryPrice, trade.symbol)}</TableCell>
                        <TableCell className="font-medium text-sm tabular-nums">{formatPrice(trade.exitPrice, trade.symbol)}</TableCell>
                        <TableCell className="font-medium text-sm">{trade.lotSize}</TableCell>
                        <TableCell 
                          className="font-bold text-base"
                          style={{ color: trade.pnl >= 0 ? themeColors.profit : themeColors.loss }}
                        >
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-medium text-sm text-muted-foreground">
                          {trade.riskReward ? `${trade.riskReward.toFixed(2)}:1` : '-'}
                        </TableCell>
                        <TableCell>
                          {trade.strategy ? (
                            <Badge variant="outline" className="bg-muted/50 font-medium">
                              {trade.strategy}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground font-medium">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setReviewingTradeId(reviewingTradeId === trade.id ? null : trade.id)}
                              className="transition-shadow duration-200 hover:shadow-md"
                              style={{ color: reviewingTradeId === trade.id ? themeColors.primary : undefined }}
                              aria-label="AI review"
                            >
                              <Brain className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/journal?trade=${trade.id}`)}
                              className="transition-shadow duration-200 hover:shadow-md"
                              aria-label="Journal this trade"
                            >
                              <BookOpen className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(trade)}
                              className="hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-950 transition-shadow duration-200 hover:shadow-md"
                              aria-label="Edit trade"
                            >
                              <PencilSimple className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(trade.id)}
                              className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 transition-shadow duration-200 hover:shadow-md"
                              aria-label="Delete trade"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {reviewingTradeId === trade.id && (
                        <TableRow>
                          <TableCell colSpan={12} className="p-0">
                            <AITradeReview
                              trade={trade}
                              surroundingTrades={chronoTrades.slice(Math.max(0, chronoTrades.indexOf(trade) - 2), chronoTrades.indexOf(trade) + 3)}
                              onClose={() => setReviewingTradeId(null)}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 px-4 pb-4">
                {paginatedTrades.map((trade) => (
                  <div key={trade.id} className="rounded-lg border border-border overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{trade.symbol}</span>
                            <Badge 
                              className="font-medium text-xs px-2 py-0.5"
                              style={{
                                backgroundColor: `${alpha(trade.side === 'long' ? themeColors.profit : themeColors.loss, '15')}`,
                                color: trade.side === 'long' ? themeColors.profit : themeColors.loss,
                                borderColor: `${alpha(trade.side === 'long' ? themeColors.profit : themeColors.loss, '30')}`
                              }} 
                            >
                              {trade.side.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(trade.exitTime), 'MMM dd, yyyy')}
                            {(() => {
                              const d = new Date(trade.exitTime);
                              return (d.getHours() !== 0 || d.getMinutes() !== 0) ? ` ${format(d, 'h:mm a')}` : '';
                            })()}
                          </p>
                        </div>
                        <div 
                          className="font-bold text-xl"
                          style={{ color: trade.pnl >= 0 ? themeColors.profit : themeColors.loss }}
                        >
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Entry:</span>
                          <span className="ml-2 font-medium">{formatPrice(trade.entryPrice, trade.symbol)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Exit:</span>
                          <span className="ml-2 font-medium">{formatPrice(trade.exitPrice, trade.symbol)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lots:</span>
                          <span className="ml-2 font-medium">{trade.lotSize}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">R:R:</span>
                          <span className="ml-2 font-medium">
                            {trade.riskReward ? `${trade.riskReward.toFixed(2)}:1` : '-'}
                          </span>
                        </div>
                        {trade.stopLoss && (
                          <div>
                            <span className="text-muted-foreground">SL:</span>
                            <span className="ml-2 font-medium">{formatPrice(trade.stopLoss, trade.symbol)}</span>
                          </div>
                        )}
                        {trade.takeProfit && (
                          <div>
                            <span className="text-muted-foreground">TP:</span>
                            <span className="ml-2 font-medium">{formatPrice(trade.takeProfit, trade.symbol)}</span>
                          </div>
                        )}
                      </div>
                      
                      {(trade.strategy || trade.emotions) && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {trade.strategy && (
                            <Badge variant="outline" className="bg-muted/50 font-medium">
                              {trade.strategy}
                            </Badge>
                          )}
                          {trade.emotions && trade.emotions.split(',').map(e => e.trim()).filter(Boolean).map(e => (
                            <Badge key={e} variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-500 font-medium text-xs">
                              {e}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/20">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReviewingTradeId(reviewingTradeId === trade.id ? null : trade.id)}
                          style={{ color: reviewingTradeId === trade.id ? themeColors.primary : undefined }}
                          aria-label="AI review"
                          className="h-10 justify-center"
                        >
                          <Brain className="mr-1.5 h-3 w-3" />
                          AI
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/journal?trade=${trade.id}`)}
                          className="h-10 justify-center"
                        >
                          <BookOpen className="mr-2 h-3 w-3" />
                          Journal
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(trade)}
                          className="h-10 justify-center"
                        >
                          <PencilSimple className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(trade.id)}
                          className="h-10 justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash className="mr-2 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                      {reviewingTradeId === trade.id && (
                        <AITradeReview
                          trade={trade}
                          surroundingTrades={chronoTrades.slice(Math.max(0, chronoTrades.indexOf(trade) - 2), chronoTrades.indexOf(trade) + 3)}
                          onClose={() => setReviewingTradeId(null)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/70">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                  Showing {startIndex + 1} to {Math.min(endIndex, displayedTrades.length)} of {displayedTrades.length} trades
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }, (_, i) => {
                      const maxVisible = isMobile ? 3 : 5;
                      let pageNumber;
                      if (totalPages <= maxVisible) {
                        pageNumber = i + 1;
                      } else if (currentPage <= Math.ceil(maxVisible / 2)) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - Math.floor(maxVisible / 2)) {
                        pageNumber = totalPages - maxVisible + 1 + i;
                      } else {
                        pageNumber = currentPage - Math.floor(maxVisible / 2) + i;
                      }
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className="w-9 h-9 p-0"
                          aria-label={`Page ${pageNumber}`}
                          aria-current={currentPage === pageNumber ? 'page' : undefined}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Column Mapping Dialog */}
      <ColumnMappingDialog value={columnMapping} onChange={setColumnMapping} onConfirm={handleMappingConfirm} />

      {/* CSV Preview Dialog */}
      <Dialog open={csvPreview.show} onOpenChange={(open) => setCsvPreview(prev => ({ ...prev, show: open }))}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-2xl lg:max-w-6xl max-h-[90svh] overflow-hidden">
          <DialogHeader>
                <DialogTitle>Import Preview</DialogTitle>
                <DialogDescription>
                  Review your trading data before importing.
                </DialogDescription>
          </DialogHeader>

          {csvPreview.parseResult && (
            <div className="space-y-4 overflow-auto pr-1">
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
                        {worstTrade < 0 ? '-' : ''}{currencySymbol}{Math.abs(worstTrade).toFixed(2)}
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
                      <ChartBar className="h-4 w-4" style={{ color: themeColors.primary }} />
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
                          <span>{parseFloat(trade.entryPrice).toFixed(5)} → {parseFloat(trade.exitPrice).toFixed(5)}</span>
                          <span>·</span>
                          <span>{trade.quantity} lots</span>
                          <span>·</span>
                          <span>{new Date(trade.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table view */}
                  <div className="hidden sm:block overflow-x-auto scrollbar-hide">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                          <TableHead className="font-semibold">Symbol</TableHead>
                          <TableHead className="font-semibold">Side</TableHead>
                          <TableHead className="font-semibold">Entry</TableHead>
                          <TableHead className="font-semibold">Exit</TableHead>
                          <TableHead className="font-semibold">Size</TableHead>
                          <TableHead className="font-semibold">P&L</TableHead>
                          <TableHead className="font-semibold">Date</TableHead>
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
                            <TableCell className="text-muted-foreground">
                              {parseFloat(trade.entryPrice).toFixed(5)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {parseFloat(trade.exitPrice).toFixed(5)}
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
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(trade.date).toLocaleDateString()}
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

              {/* Errors - Theme Aware */}
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
                      <Warning className="h-4 w-4" style={{ color: themeColors.loss }} />
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
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {csvPreview.parseResult.trades.length > 0 ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" style={{ color: themeColors.profit }} />
                      Ready to import {csvPreview.parseResult.trades.length} trades
                    </span>
                  ) : (
                    <span className="flex items-center gap-2" style={{ color: themeColors.loss }}>
                      <Warning className="h-4 w-4" />
                      No valid trades found
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
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


      
      </div>
      {/* AI Features */}
      <AIJournalPrompts
        trade={journalPromptTrade}
        onClose={() => setJournalPromptTrade(null)}
      />
      <ImportInsightDialog
        open={!!importInsightTrades}
        onOpenChange={(o) => { if (!o) setImportInsightTrades(null); }}
        trades={importInsightTrades || []}
      />
      <AIStrategyTagger
        open={isStrategyTaggerOpen}
        onOpenChange={setIsStrategyTaggerOpen}
        trades={trades}
        onTagsApplied={(updates) => {
          const updatedTrades = trades.map(t => {
            const update = updates.find(u => u.id === t.id);
            return update ? { ...t, strategy: update.strategy } : t;
          });
          saveTrades(updatedTrades);
        }}
      />
      <AppFooter />
    </>
  );
}