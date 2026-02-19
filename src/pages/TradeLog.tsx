import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useThemePresets } from '@/contexts/theme-presets';
import { useSettings } from '@/contexts/settings-context';
import { useAuth } from '@/contexts/auth-context';
import { useAccounts } from '@/contexts/account-context';
import { useUserStorage } from '@/utils/user-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // unused
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Edit, Trash2, Upload, Download, BarChart3, FileText, Calendar } from 'lucide-react';
import { InstrumentCombobox } from '@/components/ui/instrument-combobox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDollarSign,
  faBullseye,
  faTrophy,
  faBalanceScale,
  faCheckCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { startOfYear, endOfYear, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth } from 'date-fns';
import { DateTimePicker } from '@/components/ui/date-picker';
import { parseCSV, validateCSVFile, parseCSVHeaders, parseCSVWithMappings, findColumnIndex, type CSVParseResult } from '@/utils/csv-parser';
import { SiteHeader } from '@/components/site-header';
import { Footer7 } from '@/components/ui/footer-7';
import { footerConfig } from '@/components/ui/footer-config';

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
  customMultiplier?: number
  propFirm?: string
  accountId?: string
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
  swap: number
  notes?: string
  strategy?: string
  market?: 'forex' | 'futures' | 'indices'
  tags?: string[]
  useManualPnL?: boolean
  manualPnL?: number
  customMultiplier?: number
  propFirm?: string
}

function formatPrice(price: number): string {
  return price.toFixed(2);
}

export default function TradeLog() {
  const { themeColors, alpha } = useThemePresets();
  const { settings } = useSettings();
  const { isDemo } = useAuth();
  const { activeAccount } = useAccounts();
  const userStorage = useUserStorage();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [csvUploadState, setCsvUploadState] = useState({
    isUploading: false,
  });
  const [csvPreview, setCsvPreview] = useState<{
    show: boolean;
    file: File | null;
    parseResult: CSVParseResult | null;
  }>({ show: false, file: null, parseResult: null });

  const [columnMapping, setColumnMapping] = useState<{
    show: boolean;
    headers: string[];
    file: File | null;
    csvContent: string;
    mappings: Record<string, number>;
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();
  const itemsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(trades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTrades = trades.slice(startIndex, endIndex);

  // Reset to first page when trades change
  useEffect(() => {
    setCurrentPage(1);
  }, [trades.length]);

  const form = useForm<TradeFormData>({
    defaultValues: {
      symbol: '',
      side: 'long',
      entryPrice: 0,
      exitPrice: 0,
      lotSize: 1,
      spread: 0,
      commission: 0,
      swap: 0,
      notes: '',
      strategy: '',
      market: 'forex',
      tags: [],
      propFirm: '',
    },
    mode: 'onChange',
  });

  // Watch the market type to filter instruments
  const watchedMarket = form.watch('market');

  // Function to detect market type based on symbol
  const detectMarketFromSymbol = (symbol: string): 'forex' | 'futures' | 'indices' => {
    const upperSymbol = symbol.toUpperCase();
    
    // Futures symbols (base symbols without month/year codes)
    const futuresSymbols = [
      'ES', 'NQ', 'YM', 'RTY', 'MES', 'MNQ', 'MYM', 'M2K',
      'CL', 'MCL', 'NG', 'RB', 'GC', 'MGC', 'SI', 'HG',
      'ZC', 'ZS', 'ZW', 'ZN', 'ZB', 'M6E', 'M6B',
      'NAS100', 'SPX500', 'US30', 'US100', 'GER40', 'UK100',
      'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD',  // Metals futures
      'USOIL', 'UKOIL', 'NATGAS'  // Energy futures
    ];
    
    // Check if it's a futures symbol (handle month/year codes like MNQU5, ESU24, etc.)
    if (futuresSymbols.some(fut => upperSymbol.startsWith(fut))) {
      return 'futures';
    }
    
    // Index ETF symbols
    const indexSymbols = ['SPY', 'QQQ', 'DIA', 'IWM', 'XLF', 'XLK', 'XLE', 'XLV', 'EFA', 'EEM', 'VGK'];
    if (indexSymbols.includes(upperSymbol)) {
      return 'indices';
    }
    
    // Known forex pairs for auto-detection
    const forexPairs = [
      'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
      'EURJPY', 'GBPJPY', 'EURGBP', 'EURAUD', 'EURNZD', 'EURCHF',
      'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPNZD',
      'AUDJPY', 'NZDJPY', 'CADJPY', 'CHFJPY', 'AUDCAD', 'AUDNZD',
      'USDSEK', 'USDNOK', 'USDDKK', 'USDSGD', 'USDMXN', 'USDZAR',
    ];
    if (forexPairs.includes(upperSymbol)) {
      return 'forex';
    }

    // Default to forex for currency pairs
    return 'forex';
  };

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

    // Merge with other accounts' trades to avoid overwriting them
    const currentAccountId = activeAccount?.id || 'default-main-account';
    try {
      const allSaved = userStorage.getItem('trades');
      if (allSaved) {
        const allTrades = JSON.parse(allSaved) as any[];
        const otherAccountTrades = allTrades.filter((t: any) =>
          t.accountId && t.accountId !== currentAccountId
        );
        userStorage.setItem('trades', JSON.stringify([...otherAccountTrades, ...updatedTrades]));
      } else {
        userStorage.setItem('trades', JSON.stringify(updatedTrades));
      }
    } catch {
      userStorage.setItem('trades', JSON.stringify(updatedTrades));
    }
  };

  const calculatePnL = (data: TradeFormData): { pnl: number; pnlPercentage: number; riskReward: number } => {
    const { side, entryPrice, exitPrice, stopLoss, takeProfit, lotSize, commission, swap, spread, market = 'forex', customMultiplier } = data;
    let grossPnL = 0;
    let multiplier = 1;
    let spreadCost = 0;
    
    // Use custom multiplier if provided
    if (customMultiplier && customMultiplier > 0) {
      multiplier = customMultiplier;
      spreadCost = spread * multiplier * lotSize;
    } else {
      // Set multipliers based on market type
      if (market === 'forex') {
      const symbol = data.symbol?.toUpperCase() || '';
      
      // For forex: 1 standard lot = 100,000 units of base currency
      // Pip value calculation depends on the pair
      if (symbol.includes('JPY') || symbol.includes('THB') || symbol.includes('HUF')) {
        // JPY pairs: price quoted to 2 decimals, 1 pip = 0.01
        // For 1 standard lot of USDJPY: 1 pip = 1000 JPY / current rate ≈ $10
        multiplier = 1000 * lotSize; // Yen per pip * lot size
      } else {
        // Standard pairs: price quoted to 4 decimals, 1 pip = 0.0001
        // For 1 standard lot: 1 pip = $10 (for USD quote currency)
        multiplier = 100000 * lotSize; // Standard lot size * lots
      }
      
      // Calculate spread cost (spread is in pips)
      const pipValue = 10; // $10 per pip for standard lot
      spreadCost = spread * lotSize * pipValue;
      
    } else if (market === 'futures') {
      // Check for micro futures based on symbol
      const symbol = data.symbol?.toUpperCase() || '';
      
      // Micro futures (1/10th of standard contracts)
      if (symbol.includes('MES')) {
        multiplier = 5; // Micro E-mini S&P 500 ($5 per point)
      } else if (symbol.includes('MNQ')) {
        multiplier = 2; // Micro E-mini Nasdaq ($2 per point)
      } else if (symbol.includes('MYM')) {
        multiplier = 0.5; // Micro E-mini Dow ($0.50 per point)
      } else if (symbol.includes('M2K')) {
        multiplier = 5; // Micro E-mini Russell 2000 ($5 per point)
      } else if (symbol.includes('MGC')) {
        multiplier = 10; // Micro Gold ($10 per troy ounce)
      } else if (symbol.includes('MCL')) {
        multiplier = 100; // Micro WTI Crude Oil ($100 per barrel)
      } else if (symbol.includes('M6E')) {
        multiplier = 1250; // Micro Euro FX ($1.25 per pip)
      } else if (symbol.includes('M6B')) {
        multiplier = 625; // Micro British Pound ($6.25 per pip)
      } else if (symbol.includes('ES')) {
        multiplier = 50; // E-mini S&P 500 ($50 per point)
      } else if (symbol.includes('NQ')) {
        multiplier = 20; // E-mini Nasdaq ($20 per point)
      } else if (symbol.includes('YM')) {
        multiplier = 5; // E-mini Dow ($5 per point)
      } else if (symbol.includes('RTY')) {
        multiplier = 50; // E-mini Russell 2000 ($50 per point)
      } else if (symbol.includes('GC')) {
        multiplier = 100; // Gold ($100 per troy ounce)
      } else if (symbol.includes('CL')) {
        multiplier = 1000; // WTI Crude Oil ($1000 per barrel)
      } else {
        multiplier = 1; // Default futures multiplier
      }
      
      // For futures, spread is usually in ticks, calculate cost based on contract
      spreadCost = spread * multiplier * lotSize;
      
    } else if (market === 'indices') {
      multiplier = 1; // Indices per point
      spreadCost = spread * lotSize; // Spread in points
    }
    }
    
    if (side === 'long') {
      grossPnL = (exitPrice - entryPrice) * multiplier;
    } else {
      grossPnL = (entryPrice - exitPrice) * multiplier;
    }
    
    // Use calculated spreadCost instead of spread * lotSize
    const pnl = grossPnL - commission - swap - spreadCost;
    const investment = entryPrice * (market === 'forex' ? 100000 * lotSize : lotSize * multiplier);
    const pnlPercentage = investment > 0 ? (pnl / investment) * 100 : 0;
    
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
    let pnl: number;
    let pnlPercentage: number;
    let riskReward: number = 0;

    if (data.useManualPnL && data.manualPnL !== undefined) {
      // Use manual P&L
      pnl = data.manualPnL;

      // Calculate percentage based on manual P&L
      const investment = data.entryPrice * data.lotSize * (data.market === 'forex' ? 100000 : 1);
      pnlPercentage = investment > 0 ? (pnl / investment) * 100 : 0;

      // Calculate risk-reward based on manual P&L
      if (data.stopLoss) {
        const risk = data.side === 'long'
          ? data.entryPrice - data.stopLoss
          : data.stopLoss - data.entryPrice;
        const actualMove = Math.abs(data.exitPrice - data.entryPrice);
        riskReward = risk > 0 ? actualMove / risk : 0;
      }
      // Without stop loss we can't determine R:R
    } else {
      // Use auto-calculated P&L
      const calculated = calculatePnL(data);
      pnl = calculated.pnl;
      pnlPercentage = calculated.pnlPercentage;
      riskReward = calculated.riskReward;
    }
    
    const newTrade: Trade = {
      id: editingTrade?.id || Date.now().toString(),
      ...data,
      pnl,
      pnlPercentage,
      riskReward,
      entryTime: new Date(data.entryTime),
      exitTime: new Date(data.exitTime),
      accountId: activeAccount?.id || 'default-main-account',
    };

    if (editingTrade) {
      const updatedTrades = trades.map((t) => (t.id === editingTrade.id ? newTrade : t));
      saveTrades(updatedTrades);
      setEditingTrade(null);
    } else {
      saveTrades([...trades, newTrade]);
    }

    form.reset();
    setIsDialogOpen(false);
  };

  const handleEdit = (trade: Trade) => {
    setEditingTrade(trade);
    form.reset({
      ...trade,
      entryTime: trade.entryTime as any,
      exitTime: trade.exitTime as any,
      useManualPnL: trade.useManualPnL || false,
      manualPnL: trade.manualPnL,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trade?')) return;
    const updatedTrades = trades.filter((t) => t.id !== id);
    saveTrades(updatedTrades);
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // For now, only handle single file preview
    const file = files[0];
    setCsvUploadState({ isUploading: true });

    try {
      const content = await validateCSVFile(file);
      const result = parseCSV(content);

      // If auto-detect failed due to missing columns, show column mapping dialog
      if (!result.success && result.errors.some(e => e.includes('Missing required columns'))) {
        const headers = parseCSVHeaders(content);
        const MAPPING_FIELDS: Record<string, string[]> = {
          symbol: ['Symbol', 'Instrument', 'Pair', 'ContractName', 'Contract'],
          side: ['Side', 'Type', 'Direction', 'Action'],
          openPrice: ['Open Price', 'Entry Price', 'Open', 'Entry', 'EntryPrice'],
          closePrice: ['Close Price', 'Exit Price', 'Close', 'Exit', 'ExitPrice'],
          quantity: ['Lots', 'Volume', 'Size', 'Quantity', 'Units'],
          pnl: ['PnL', 'Profit', 'P&L', 'Gain', 'Net P/L'],
          openTime: ['Open Time', 'Entry Time', 'Date', 'Time', 'Open Date', 'EnteredAt', 'TradeDay'],
          closeTime: ['Close Time', 'Exit Time', 'Close Date', 'ExitedAt'],
        };
        const guessedMappings: Record<string, number> = {};
        for (const [field, possibleNames] of Object.entries(MAPPING_FIELDS)) {
          guessedMappings[field] = findColumnIndex(headers, possibleNames);
        }
        setColumnMapping({
          show: true,
          headers,
          file,
          csvContent: content,
          mappings: guessedMappings,
        });
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
      // Clear file input
      event.target.value = '';
    }
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
        // Convert parsed trades to Trade format
        const importedTrades: Trade[] = result.trades.map((trade, index) => {
          const pnl = parseFloat(trade.pnl) || 0;
          return {
            id: `csv-${Date.now()}-${index}`,
            symbol: trade.symbol,
            side: trade.side,
            entryPrice: parseFloat(trade.entryPrice),
            exitPrice: parseFloat(trade.exitPrice),
            lotSize: parseFloat(trade.quantity) || 1,
            commission: 0,
            spread: 0,
            swap: 0,
            entryTime: new Date(`${trade.date}T00:00:00`),
            exitTime: new Date(`${trade.date}T00:00:00`),
            notes: `Imported from ${file.name}`,
            strategy: '',
            market: detectMarketFromSymbol(trade.symbol),
            pnl: pnl,
            pnlPercentage: 0, // Will be calculated
            riskReward: 0, // Will be calculated
            accountId: activeAccount?.id || 'default-main-account'
          };
        });
        
        // Deduplicate: fingerprint on key fields to skip already-imported trades
        const tradeFingerprint = (t: Trade) =>
          `${t.symbol}|${t.side}|${t.entryPrice}|${t.exitPrice}|${t.lotSize}|${t.pnl}|${new Date(t.entryTime).getTime()}|${new Date(t.exitTime).getTime()}`;

        const existingFingerprints = new Set(trades.map(tradeFingerprint));
        const newTrades = importedTrades.filter(t => !existingFingerprints.has(tradeFingerprint(t)));
        const skippedCount = importedTrades.length - newTrades.length;

        const updatedTrades = [...trades, ...newTrades];
        saveTrades(updatedTrades);

        const description = skippedCount > 0
          ? `${skippedCount} duplicate trade${skippedCount > 1 ? 's' : ''} skipped`
          : result.errors.length > 0
            ? `${result.summary.failed} rows had errors and were skipped`
            : 'P&L shown is gross (before broker commissions/fees)';

        toast.success(
          newTrades.length > 0
            ? `Imported ${newTrades.length} new trade${newTrades.length > 1 ? 's' : ''} from ${file.name}`
            : `No new trades to import from ${file.name}`,
          {
            description,
            duration: 6000
          }
        );
        
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
    const { csvContent, mappings, file } = columnMapping;

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
    setColumnMapping(null);
    setCsvPreview({
      show: true,
      file,
      parseResult: result,
    });
  };

  const handleCSVExport = () => {
    const headers = ['symbol', 'side', 'entryPrice', 'exitPrice', 'lotSize', 'entryTime', 'exitTime', 'spread', 'commission', 'swap', 'pnl', 'pnlPercentage', 'riskReward', 'strategy', 'market', 'notes'];
    const csvContent = [
      headers.join(','),
      ...trades.map(trade => 
        headers.map(header => {
          let value = trade[header as keyof Trade];
          if (header === 'lotSize' && !value) {
            value = (trade as any).quantity || 1;
          }
          if (value instanceof Date) {
            return format(value, 'yyyy-MM-dd HH:mm:ss');
          }
          return value?.toString() || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `trades_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    a.click();
  };

  const generateReport = () => {
    let filteredTrades = [...trades];
    const now = new Date();
    let reportStart: Date;
    let reportEnd: Date;

    switch (reportType) {
      case 'monthly':
        reportStart = startOfMonth(now);
        reportEnd = endOfMonth(now);
        break;
      case 'quarterly':
        reportStart = startOfQuarter(now);
        reportEnd = endOfQuarter(now);
        break;
      case 'yearly':
        reportStart = startOfYear(now);
        reportEnd = endOfYear(now);
        break;
      case 'custom':
        reportStart = new Date(reportStartDate);
        reportEnd = new Date(reportEndDate);
        break;
      default:
        return;
    }

    filteredTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.exitTime);
      return tradeDate >= reportStart && tradeDate <= reportEnd;
    });

    const wins = filteredTrades.filter(t => t.pnl > 0);
    const losses = filteredTrades.filter(t => t.pnl < 0);
    const totalPnL = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalCommission = filteredTrades.reduce((sum, t) => sum + t.commission, 0);
    const totalSwap = filteredTrades.reduce((sum, t) => sum + t.swap, 0);
    
    const symbolStats = new Map<string, { trades: number; pnl: number }>();
    const strategyStats = new Map<string, { trades: number; pnl: number }>();
    
    filteredTrades.forEach(trade => {
      const symbolStat = symbolStats.get(trade.symbol) || { trades: 0, pnl: 0 };
      symbolStats.set(trade.symbol, {
        trades: symbolStat.trades + 1,
        pnl: symbolStat.pnl + trade.pnl,
      });
      
      if (trade.strategy) {
        const strategyStat = strategyStats.get(trade.strategy) || { trades: 0, pnl: 0 };
        strategyStats.set(trade.strategy, {
          trades: strategyStat.trades + 1,
          pnl: strategyStat.pnl + trade.pnl,
        });
      }
    });

    const reportData = {
      period: { start: reportStart, end: reportEnd },
      summary: {
        totalTrades: filteredTrades.length,
        wins: wins.length,
        losses: losses.length,
        winRate: filteredTrades.length > 0 ? (wins.length / filteredTrades.length) * 100 : 0,
        totalPnL,
        totalCommission,
        totalSwap,
        netPnL: totalPnL,
        averagePnL: filteredTrades.length > 0 ? totalPnL / filteredTrades.length : 0,
        largestWin: wins.length > 0 ? Math.max(...wins.map(t => t.pnl)) : 0,
        largestLoss: losses.length > 0 ? Math.min(...losses.map(t => t.pnl)) : 0,
      },
      symbolBreakdown: Array.from(symbolStats.entries()).map(([symbol, data]) => ({
        symbol,
        ...data,
      })),
      strategyBreakdown: Array.from(strategyStats.entries()).map(([strategy, data]) => ({
        strategy,
        ...data,
      })),
      trades: filteredTrades,
    };

    exportReportCSV(reportData);
    setIsReportDialogOpen(false);
  };

  const exportReportCSV = (reportData: any) => {
    const headers = [
      'Trading Report',
      `Period: ${format(reportData.period.start, 'MM/dd/yyyy')} - ${format(reportData.period.end, 'MM/dd/yyyy')}`,
      '',
      'Summary Metrics',
      'Metric,Value',
      `Total Trades,${reportData.summary.totalTrades}`,
      `Winning Trades,${reportData.summary.wins}`,
      `Losing Trades,${reportData.summary.losses}`,
      `Win Rate,${reportData.summary.winRate.toFixed(2)}%`,
      `Total P&L,$${reportData.summary.totalPnL.toFixed(2)}`,
      `Total Commission,$${reportData.summary.totalCommission.toFixed(2)}`,
      `Total Swap/Rollover,$${reportData.summary.totalSwap.toFixed(2)}`,
      `Net P&L,$${reportData.summary.netPnL.toFixed(2)}`,
      `Average P&L per Trade,$${reportData.summary.averagePnL.toFixed(2)}`,
      `Largest Win,$${reportData.summary.largestWin.toFixed(2)}`,
      `Largest Loss,$${reportData.summary.largestLoss.toFixed(2)}`,
      '',
      'Performance by Symbol',
      'Symbol,Trades,P&L',
      ...reportData.symbolBreakdown.map((item: any) => `${item.symbol},${item.trades},$${item.pnl.toFixed(2)}`),
      '',
      'Performance by Strategy',
      'Strategy,Trades,P&L',
      ...reportData.strategyBreakdown.map((item: any) => `${item.strategy},${item.trades},$${item.pnl.toFixed(2)}`),
      '',
      'Individual Trade Details',
      'Date,Symbol,Market,Side,Entry,Exit,Lots,Spread,Commission,Swap,P&L,R:R,Strategy,Notes',
      ...reportData.trades.map((t: Trade) => 
        `${format(new Date(t.exitTime), 'MM/dd/yyyy HH:mm')},${t.symbol},${detectMarketFromSymbol(t.symbol)},${t.side},${t.entryPrice},${t.exitPrice},${t.lotSize},${t.spread},${t.commission},${t.swap},${t.pnl.toFixed(2)},${t.riskReward ? t.riskReward.toFixed(2) : ''},${t.strategy || ''},"${t.notes || ''}"`
      ),
    ];

    const csvContent = headers.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `trading_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    a.click();
  };

  // Enhanced loading and stats state
  const [isLoading, setIsLoading] = useState(true);
  const [quickStats, setQuickStats] = useState({
    totalPnL: 0,
    winRate: 0,
    totalTrades: 0,
    avgRR: 0
  });

  // Calculate quick stats
  const calculateQuickStats = (tradeList: Trade[]) => {
    const totalTrades = tradeList.length;
    const totalPnL = tradeList.reduce((sum, trade) => sum + trade.pnl, 0);
    const winners = tradeList.filter(trade => trade.pnl > 0);
    const winRate = totalTrades > 0 ? (winners.length / totalTrades) * 100 : 0;
    
    // Fix avgRR calculation with proper edge case handling
    const validRRTrades = tradeList.filter(trade => trade.riskReward && trade.riskReward > 0);
    const avgRR = validRRTrades.length > 0 
      ? validRRTrades.reduce((sum, trade) => sum + (trade.riskReward || 0), 0) / validRRTrades.length
      : 0;

    setQuickStats({ totalPnL, winRate, totalTrades, avgRR });
  };

  // Enhanced loading simulation
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const savedTrades = userStorage.getItem('trades');
      if (savedTrades) {
        try {
          const parsedTrades = JSON.parse(savedTrades);
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
            }
            // Cap any previously stored garbage values
            if (tradeWithDates.riskReward > 100) {
              tradeWithDates.riskReward = 0;
            }

            return tradeWithDates;
          });
          
          // Filter trades by active account
          const filteredTrades = tradesWithDates.filter((trade: any) => 
            !activeAccount || 
            trade.accountId === activeAccount.id || 
            (!trade.accountId && activeAccount.id.includes('default'))
          );
          
          setTrades(filteredTrades);
          calculateQuickStats(filteredTrades);
          
          // Save the updated trades with RR calculations back to localStorage
          userStorage.setItem('trades', JSON.stringify(tradesWithDates));
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
            swap: formData.swap || 0,
            notes: formData.notes || '',
            strategy: formData.strategy || '',
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
    }, 800);

    return () => clearTimeout(timer);
  }, [activeAccount]);

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-background">
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
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5">
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
      <div className="min-h-screen w-full bg-background">
      <SiteHeader />
      {/* Header */}
      <div className="border-b sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center lg:items-center gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="font-display text-2xl font-bold text-foreground">
                Trade Log
              </h1>
              <p className="text-sm text-muted-foreground">
                {trades.length} trades recorded
              </p>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
              {!isDemo && (
              <>
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
                <Upload className="mr-2 h-4 w-4" />
                {csvUploadState.isUploading ? 'Processing...' : 'Import'}
              </Button>
              <input
                id="csv-import"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleCSVImport}
              />
              </>
              )}

              <Button
                variant="outline"
                size="sm"
                disabled={trades.length === 0}
                onClick={handleCSVExport}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReportDialogOpen(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Report
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="w-[90vw] max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Generate Trading Report</DialogTitle>
                    <DialogDescription className="text-base">
                      Create a comprehensive performance report for analysis or tax purposes.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Report Period</Label>
                      <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                        <SelectTrigger className="text-lg h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Current Month</SelectItem>
                          <SelectItem value="quarterly">Current Quarter</SelectItem>
                          <SelectItem value="yearly">Current Year</SelectItem>
                          <SelectItem value="custom">Custom Date Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {reportType === 'custom' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-base font-semibold">Start Date</Label>
                          <Input 
                            type="date" 
                            value={reportStartDate}
                            onChange={(e) => setReportStartDate(e.target.value)}
                            className="text-lg h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-semibold">End Date</Label>
                          <Input 
                            type="date" 
                            value={reportEndDate}
                            onChange={(e) => setReportEndDate(e.target.value)}
                            className="text-lg h-12"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Report Includes:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Performance summary & key metrics</li>
                        <li>• Win/loss analysis & statistics</li>
                        <li>• Performance breakdown by symbol</li>
                        <li>• Performance breakdown by strategy</li>
                        <li>• Complete trade details for the period</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsReportDialogOpen(false)} className="px-6">
                      Cancel
                    </Button>
                    <Button 
                      onClick={generateReport} 
                      disabled={reportType === 'custom' && (!reportStartDate || !reportEndDate)}
                      className="px-6 bg-primary text-primary-foreground"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                </DialogContent>
      </Dialog>
              
      {/* Add Trade Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{editingTrade ? 'Edit Trade' : 'Add New Trade'}</DialogTitle>
                    <DialogDescription className="text-base">
                      Enter your trade details below. All fields marked with * are required.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Basic Trade Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FormField
                          control={form.control}
                          name="symbol"
                          rules={{ required: 'Symbol is required' }}
                          render={({ field }) => {
                            const marketInstruments = getInstrumentsByMarket(watchedMarket || 'forex');
                            return (
                              <FormItem>
                                <FormLabel className="text-base font-semibold">Instrument *</FormLabel>
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
                              <FormLabel className="text-base font-semibold">Direction *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="text-lg">
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
                        <FormField
                          control={form.control}
                          name="market"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Market Type</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                // Clear symbol when market type changes
                                form.setValue('symbol', '');
                              }} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="text-lg">
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
                          name="propFirm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Prop Firm</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="text-lg">
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

                      {/* Pricing */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="entryPrice"
                          rules={{ required: 'Entry price is required', min: 0 }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Entry Price *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.00001" 
                                  className="text-lg font-semibold"
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
                              <FormLabel className="text-base font-semibold">Exit Price *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.00001" 
                                  className="text-lg font-semibold"
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
                          rules={{ required: 'Lot size is required', min: 0 }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Lot Size *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="1.0…" 
                                  className="text-lg font-semibold"
                                  {...field} 
                                  onChange={e => field.onChange(parseFloat(e.target.value))} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Costs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="spread"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Spread</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.0001" 
                                  placeholder="0.0002…" 
                                  className="text-lg font-semibold"
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
                              <FormLabel className="text-base font-semibold">Commission</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="7.00…" 
                                  className="text-lg font-semibold"
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
                          name="swap"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Swap/Rollover</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="-2.50…" 
                                  className="text-lg font-semibold"
                                  {...field} 
                                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Timing */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="entryTime"
                          rules={{ required: 'Entry time is required' }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Entry Time *</FormLabel>
                              <FormControl>
                                <DateTimePicker
                                  date={field.value ? new Date(field.value) : undefined}
                                  onDateChange={(date) => field.onChange(date)}
                                  placeholder="Select entry date and time"
                                  className="text-lg"
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
                              <FormLabel className="text-base font-semibold">Exit Time *</FormLabel>
                              <FormControl>
                                <DateTimePicker
                                  date={field.value ? new Date(field.value) : undefined}
                                  onDateChange={(date) => field.onChange(date)}
                                  placeholder="Select exit date and time"
                                  className="text-lg"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Custom Multiplier Field */}
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="customMultiplier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">
                                Custom Multiplier (Optional)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="Leave blank to use default multiplier"
                                  className="text-lg"
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
                      </div>

                      {/* Contract Info Display for Futures */}
                      {watchedMarket === 'futures' && form.watch('symbol') && (
                        <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
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

                      {/* Manual P&L Override */}
                      <div className="space-y-4">
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
                              <FormLabel className="text-base font-semibold cursor-pointer">
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
                                <FormLabel className="text-base font-semibold">Manual P&L *</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="Enter exact P&L (e.g., -50.00 for loss, 100.00 for profit)"
                                    className="text-lg font-semibold"
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

                      {/* Additional Info */}
                      <FormField
                        control={form.control}
                        name="strategy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Strategy</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Trend Following, Mean Reversion, Breakout…" 
                                className="text-lg"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                className="min-h-[120px] px-4 py-3 text-base"
                                placeholder="Trade analysis, market conditions, lessons learned..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-4 pt-6">
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
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Total P&L */}
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faDollarSign} className="h-3 w-3" />
                  Total P&L
                </p>
                <p className="text-2xl font-bold tabular-nums"
                   style={{ color: quickStats.totalPnL >= 0 ? themeColors.profit : themeColors.loss }}>
                  {quickStats.totalPnL >= 0 ? '+' : '-'}${Math.abs(quickStats.totalPnL).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((quickStats.totalPnL / (activeAccount?.balance || settings.accountSize || 10000)) * 100).toFixed(1)}% of account
                </p>
              </CardContent>
            </Card>

            {/* Win Rate */}
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faBullseye} className="h-3 w-3" />
                  Win Rate
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {quickStats.winRate.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {trades.filter(t => t.pnl > 0).length}W / {trades.filter(t => t.pnl < 0).length}L
                </p>
              </CardContent>
            </Card>

            {/* Best Trade */}
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faTrophy} className="h-3 w-3" />
                  Best Trade
                </p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: themeColors.profit }}>
                  +${trades.length > 0 ? Math.max(0, ...trades.map(t => t.pnl)).toFixed(0) : '0'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {trades.length > 0 ? (trades.find(t => t.pnl === Math.max(0, ...trades.map(t => t.pnl)))?.symbol || '--') : '--'}
                </p>
              </CardContent>
            </Card>

            {/* Avg R:R */}
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faBalanceScale} className="h-3 w-3" />
                  Avg R:R
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {quickStats.avgRR > 0 ? `${quickStats.avgRR.toFixed(1)}:1` : '--'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(() => {
                    const validRRTrades = trades.filter(t => t.riskReward && t.riskReward > 0);
                    return `${validRRTrades.length} trades with R:R`;
                  })()}
                </p>
              </CardContent>
            </Card>
        </div>

        {/* Secondary stats strip */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6 px-1">
          <span>{quickStats.totalTrades} trades</span>
          <span className="hidden sm:inline text-border">|</span>
          <span>
            Avg win{' '}
            <span className="font-medium" style={{ color: themeColors.profit }}>
              ${(() => {
                const w = trades.filter(t => t.pnl > 0);
                return w.length > 0 ? (w.reduce((s, t) => s + t.pnl, 0) / w.length).toFixed(0) : '0';
              })()}
            </span>
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span>
            Avg loss{' '}
            <span className="font-medium" style={{ color: themeColors.loss }}>
              ${(() => {
                const l = trades.filter(t => t.pnl < 0);
                return l.length > 0 ? Math.abs(l.reduce((s, t) => s + t.pnl, 0) / l.length).toFixed(0) : '0';
              })()}
            </span>
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span>
            PF{' '}
            <span className="font-medium text-foreground">
              {(() => {
                const totalWins = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
                const totalLosses = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
                if (totalLosses === 0 && totalWins > 0) return '∞';
                if (totalLosses === 0) return '--';
                return (totalWins / totalLosses).toFixed(1);
              })()}
            </span>
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span>
            Streak{' '}
            {(() => {
              if (trades.length === 0) return <span className="font-medium text-foreground">--</span>;
              const lastTrade = trades[trades.length - 1];
              let streak = 0;
              const isWinning = lastTrade.pnl > 0;
              for (let i = trades.length - 1; i >= 0; i--) {
                if ((trades[i].pnl > 0) === isWinning) streak++;
                else break;
              }
              return (
                <span className="font-medium" style={{ color: isWinning ? themeColors.profit : themeColors.loss }}>
                  {streak}{isWinning ? 'W' : 'L'}
                </span>
              );
            })()}
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span>
            This month{' '}
            {(() => {
              const now = new Date();
              const monthlyPnL = trades
                .filter(t => {
                  const d = new Date(t.exitTime);
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                })
                .reduce((s, t) => s + t.pnl, 0);
              return (
                <span className="font-medium" style={{ color: monthlyPnL >= 0 ? themeColors.profit : themeColors.loss }}>
                  {monthlyPnL >= 0 ? '+' : ''}${monthlyPnL.toFixed(0)}
                </span>
              );
            })()}
          </span>
        </div>

        {/* Trades Table */}
        <Card className="">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">All Trades</CardTitle>
                <CardDescription>
                  {trades.length} {trades.length === 1 ? 'trade' : 'trades'} recorded
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {trades.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No trades recorded yet</h3>
                <p className="text-muted-foreground mb-6">
                  Click "Add Trade" to record your first trade or import from CSV/Excel.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
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
                    onClick={() => document.getElementById('csv-import')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                </div>
              </div>
            ) : (
              <>
              {/* Desktop Table View */}
              <div className="hidden md:block w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/30 hover:bg-transparent">
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/80 py-3">Date</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/80">Symbol</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/80">Market</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/80">Side</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/80">Entry</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/80">Exit</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/80">Lots</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/80">P&L</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/80">R:R</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/80">Strategy</TableHead>
                      <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/80">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTrades.map((trade) => (
                      <TableRow key={trade.id} className="hover:bg-black/[0.03] dark:hover:bg-white/[0.04] border-b border-border/20">
                        <TableCell className="font-medium py-6 text-sm text-muted-foreground">{format(new Date(trade.exitTime), 'MM/dd/yy')}</TableCell>
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
                        <TableCell className="font-medium text-sm tabular-nums">{formatPrice(trade.entryPrice)}</TableCell>
                        <TableCell className="font-medium text-sm tabular-nums">{formatPrice(trade.exitPrice)}</TableCell>
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
                              onClick={() => handleEdit(trade)}
                              className="hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-950 transition-shadow duration-200 hover:shadow-md"
                              aria-label="Edit trade"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(trade.id)}
                              className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 transition-shadow duration-200 hover:shadow-md"
                              aria-label="Delete trade"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
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
                          <span className="ml-2 font-medium">{formatPrice(trade.entryPrice)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Exit:</span>
                          <span className="ml-2 font-medium">{formatPrice(trade.exitPrice)}</span>
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
                      </div>
                      
                      {trade.strategy && (
                        <div className="mt-3">
                          <Badge variant="outline" className="bg-muted/50 font-medium">
                            {trade.strategy}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-4 pt-3 border-t border-border/20">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTrade(trade);
                            form.reset({
                              ...trade,
                              entryTime: trade.entryTime,
                              exitTime: trade.exitTime,
                            });
                            setIsDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Edit className="mr-2 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(trade.id)}
                          className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/30">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                  Showing {startIndex + 1} to {Math.min(endIndex, trades.length)} of {trades.length} trades
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
                          className="w-8 h-8 p-0"
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
      <Dialog open={!!columnMapping?.show} onOpenChange={(open) => { if (!open) setColumnMapping(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
                <DialogTitle>Map Your CSV Columns</DialogTitle>
                <DialogDescription>
                  We couldn't auto-detect your CSV format. Please map your columns below.
                </DialogDescription>
          </DialogHeader>

          {columnMapping && (
            <div className="space-y-4 overflow-auto pr-1">
              <div
                className="flex items-center gap-3 rounded-lg px-4 py-2.5 border"
                style={{
                  backgroundColor: `${alpha(themeColors.primary, '08')}`,
                  borderColor: `${alpha(themeColors.primary, '20')}`
                }}
              >
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate" title={columnMapping.file?.name}>{columnMapping.file?.name}</span>
                <span className="text-muted-foreground text-sm">—</span>
                <span className="text-sm text-muted-foreground">{columnMapping.headers.length} columns detected</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {([
                  { key: 'symbol', label: 'Symbol', required: true },
                  { key: 'side', label: 'Side (Buy/Sell)', required: true },
                  { key: 'openPrice', label: 'Entry / Open Price', required: true },
                  { key: 'closePrice', label: 'Exit / Close Price', required: true },
                  { key: 'quantity', label: 'Quantity / Size', required: true },
                  { key: 'pnl', label: 'P&L', required: true },
                  { key: 'openTime', label: 'Entry Time', required: false },
                  { key: 'closeTime', label: 'Exit Time', required: false },
                ] as const).map(({ key, label, required }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      {label}{required && <span style={{ color: themeColors.loss }}> *</span>}
                    </Label>
                    <Select
                      value={columnMapping.mappings[key] >= 0 ? String(columnMapping.mappings[key]) : '__none__'}
                      onValueChange={(val) => {
                        setColumnMapping(prev => prev ? {
                          ...prev,
                          mappings: {
                            ...prev.mappings,
                            [key]: val === '__none__' ? -1 : parseInt(val),
                          }
                        } : null);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a column..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- None / Not Available --</SelectItem>
                        {columnMapping.headers.map((header, idx) => (
                          <SelectItem key={idx} value={String(idx)}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setColumnMapping(null)}
                  className="hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMappingConfirm}
                  style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                  className="hover:opacity-90 shadow-lg px-6 font-medium"
                >
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4" />
                    Parse with These Mappings
                  </span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CSV Preview Dialog */}
      <Dialog open={csvPreview.show} onOpenChange={(open) => setCsvPreview(prev => ({ ...prev, show: open }))}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
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
                className="flex items-center gap-3 rounded-lg px-4 py-2.5 border"
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
                  <>
                    <span className="text-muted-foreground text-sm ml-auto">·</span>
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {csvPreview.parseResult.summary.dateRange.earliest} — {csvPreview.parseResult.summary.dateRange.latest}
                    </span>
                  </>
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
                  <div className="grid grid-cols-4 gap-3">
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
                      <BarChart3 className="h-4 w-4" style={{ color: themeColors.primary }} />
                      <h3 className="font-semibold text-foreground text-sm">
                        Trade Preview <span className="font-normal text-muted-foreground">(First 5 rows)</span>
                      </h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
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
                      <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" style={{ color: themeColors.loss }} />
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
                      <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4" style={{ color: themeColors.profit }} />
                      Ready to import {csvPreview.parseResult.trades.length} trades
                    </span>
                  ) : (
                    <span className="flex items-center gap-2" style={{ color: themeColors.loss }}>
                      <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
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
                        <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4" />
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
      <Footer7 {...footerConfig} />
    </>
  );
}