import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useThemePresets } from '@/contexts/theme-presets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // unused
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Edit, Trash2, Upload, Download, BarChart3, FileText } from 'lucide-react';
// Removed unused: TrendingUp, DollarSign, Crosshair
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDollarSign, 
  faBullseye, 
  faTrophy, 
  faBalanceScale, 
  faChartLine, 
  faArrowTrendUp, 
  faArrowTrendDown, 
  faFire, 
  faStar, 
  faTimesCircle, 
  faCalendar, 
  faCheckCircle, 
  faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';
import { startOfYear, endOfYear, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth } from 'date-fns';
import { DateTimePicker } from '@/components/ui/date-picker';
import { parseCSV, validateCSVFile } from '@/utils/csv-parser';
import { SiteHeader } from '@/components/site-header';

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

export default function TradeLog() {
  const { themeColors } = useThemePresets();
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

  const getInstrumentsByMarket = (market: string) => {
    switch (market) {
      case 'forex':
        return [
          { category: 'Major Pairs', instruments: [
            'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'
          ]},
          { category: 'Cross Pairs', instruments: [
            'EURJPY', 'GBPJPY', 'EURGBP', 'CHFJPY', 'CADCHF', 'AUDCHF'
          ]},
          { category: 'Minor Pairs', instruments: [
            'USDSEK', 'USDNOK', 'USDDKK', 'EURAUD', 'EURNZD', 'GBPAUD'
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
    localStorage.setItem('trades', JSON.stringify(updatedTrades));
    calculateQuickStats(updatedTrades);
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
    } else {
      // Alternative R:R calculations when SL/TP not available
      const actualPnL = Math.abs(exitPrice - entryPrice);
      
      // Method 1: Assume risk was 1% of entry price (common swing trading rule)
      const estimatedRisk = entryPrice * 0.01;
      if (estimatedRisk > 0) {
        riskReward = actualPnL / estimatedRisk;
      }
      
      // Method 2: For futures, assume risk was $50-100 per contract (adjust based on instrument)
      // if (market === 'futures') {
      //   const estimatedRiskDollars = 75; // $75 risk per contract
      //   const actualMoveDollars = actualPnL * lotSize;
      //   riskReward = actualMoveDollars / estimatedRiskDollars;
      // }
    }
    
    return { pnl, pnlPercentage, riskReward };
  };

  const onSubmit = (data: TradeFormData) => {
    let pnl: number;
    let pnlPercentage: number;
    let riskReward: number;
    
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
      } else {
        // Estimate based on 1% risk assumption
        const estimatedRisk = data.entryPrice * 0.01;
        const actualMove = Math.abs(data.exitPrice - data.entryPrice);
        riskReward = estimatedRisk > 0 ? actualMove / estimatedRisk : 0;
      }
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
    const updatedTrades = trades.filter((t) => t.id !== id);
    saveTrades(updatedTrades);
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setCsvUploadState({ isUploading: true });
    let allImportedTrades: Trade[] = [];
    let allErrors: string[] = [];
    let totalSuccessful = 0;
    let totalFailed = 0;

    try {
      // Process each file
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];
        try {
          const content = await validateCSVFile(file);
          const result = parseCSV(content);
          
          if (result.success) {
            // Convert parsed trades to Trade format
            const importedTrades: Trade[] = result.trades.map((trade, index) => {
              const tradeFormData: TradeFormData = {
                symbol: trade.symbol,
                side: trade.side,
                entryPrice: parseFloat(trade.entryPrice) || 0,
                exitPrice: parseFloat(trade.exitPrice) || 0,
                lotSize: parseFloat(trade.quantity) || 1,
                entryTime: new Date(trade.date),
                exitTime: new Date(trade.date),
                spread: 0,
                commission: 0,
                swap: 0,
                market: 'futures', // Assume futures since your data is MNQU5
              };

              const { pnl, pnlPercentage, riskReward } = calculatePnL(tradeFormData);
              
              return {
                id: `import-${Date.now()}-${fileIndex}-${index}`,
                ...tradeFormData,
                pnl: parseFloat(trade.pnl) || pnl, // Use actual PnL from CSV if available
                pnlPercentage,
                riskReward,
                entryTime: new Date(trade.date),
                exitTime: new Date(trade.date),
                notes: `Imported from ${file.name}`,
                strategy: '',
              };
            });
            
            allImportedTrades.push(...importedTrades);
            totalSuccessful += result.summary.successfulParsed;
            totalFailed += result.summary.failed;
            
          } else {
            allErrors.push(`${file.name}: ${result.errors.join(', ')}`);
          }
        } catch (fileError) {
          allErrors.push(`${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
        }
      }
      
      // Add all imported trades to existing trades
      if (allImportedTrades.length > 0) {
        saveTrades([...trades, ...allImportedTrades]);
      }
      
      // Show comprehensive success/error toast
      if (totalSuccessful > 0) {
        toast.success(`CSV Import ${allErrors.length > 0 ? 'Partially ' : ''}Successful!`, {
          description: `Imported ${totalSuccessful} trades from ${files.length} file${files.length > 1 ? 's' : ''}${
            totalFailed > 0 ? `. ${totalFailed} rows were skipped due to errors.` : ''
          }${
            allErrors.length > 0 ? ` Some files had errors.` : ''
          }`,
          duration: 8000
        });
      } else {
        toast.error('CSV Import Failed', {
          description: allErrors.length > 0 ? allErrors.slice(0, 2).join('; ') + (allErrors.length > 2 ? '...' : '') : 'No valid trades found in any file',
          duration: 8000
        });
      }
      
      setCsvUploadState({ isUploading: false });
      
    } catch (error) {
      // Show error toast
      toast.error('Import Error', {
        description: error instanceof Error ? error.message : 'Failed to process CSV files',
        duration: 8000
      });
      setCsvUploadState({ isUploading: false });
    }

    // Reset file input
    event.target.value = '';
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
        netPnL: totalPnL - totalCommission - totalSwap,
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
        `${format(new Date(t.exitTime), 'MM/dd/yyyy HH:mm')},${t.symbol},${t.market || 'forex'},${t.side},${t.entryPrice},${t.exitPrice},${t.lotSize},${t.spread},${t.commission},${t.swap},${t.pnl.toFixed(2)},${t.riskReward ? t.riskReward.toFixed(2) : ''},${t.strategy || ''},"${t.notes || ''}"`
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
      const savedTrades = localStorage.getItem('trades');
      if (savedTrades) {
        try {
          const parsedTrades = JSON.parse(savedTrades);
          const tradesWithDates = parsedTrades.map((trade: any) => {
            const tradeWithDates = {
              ...trade,
              entryTime: new Date(trade.entryTime),
              exitTime: new Date(trade.exitTime)
            };

            // Recalculate RR if missing
            if (tradeWithDates.riskReward === undefined || tradeWithDates.riskReward === null) {
              let riskReward = 0;
              if (trade.stopLoss && trade.takeProfit && trade.entryPrice) {
                // Calculate R:R based on trade direction
                let risk = 0;
                let reward = 0;
                
                if (trade.side === 'long') {
                  // Long trade: risk = entry - stop, reward = target - entry
                  risk = trade.entryPrice - trade.stopLoss;
                  reward = trade.takeProfit - trade.entryPrice;
                } else {
                  // Short trade: risk = stop - entry, reward = entry - target
                  risk = trade.stopLoss - trade.entryPrice;
                  reward = trade.entryPrice - trade.takeProfit;
                }
                
                // Ensure both risk and reward are positive for valid R:R calculation
                if (risk > 0 && reward > 0) {
                  riskReward = reward / risk;
                } else {
                  riskReward = 0; // Invalid stop/target levels for this trade direction
                }
              } else {
                // Alternative R:R calculations when SL/TP not available
                const actualPnL = Math.abs(trade.exitPrice - trade.entryPrice);
                
                // Method 1: Assume risk was 1% of entry price (common swing trading rule)
                const estimatedRisk = trade.entryPrice * 0.01;
                if (estimatedRisk > 0) {
                  riskReward = actualPnL / estimatedRisk;
                }
              }
              tradeWithDates.riskReward = riskReward;
            }

            return tradeWithDates;
          });
          
          setTrades(tradesWithDates);
          calculateQuickStats(tradesWithDates);
          
          // Save the updated trades with RR calculations back to localStorage
          localStorage.setItem('trades', JSON.stringify(tradesWithDates));
        } catch (error) {
          console.error('Error loading trades:', error);
          setTrades([]);
        }
      }

      // Check for prefilled trade form data
      const prefilledTradeForm = localStorage.getItem('prefilledTradeForm');
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
          localStorage.removeItem('prefilledTradeForm');
        } catch (error) {
          console.error('Error parsing prefilled trade form data:', error);
          // Clear invalid data
          localStorage.removeItem('prefilledTradeForm');
        }
      }
      
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
        <SiteHeader />
        {/* Header Skeleton */}
        <div className="border-b bg-card/80 backdrop-blur-xl">
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
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-muted rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-muted rounded"></div>
                      <div className="h-6 w-20 bg-muted rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
                <div className="h-9 w-24 bg-muted animate-pulse rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 w-full bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
      <SiteHeader />
      {/* Enhanced Header Section */}
      <div className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-20 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent" 
                  style={{backgroundImage: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.primary}DD)`}}>
                Trade Log
              </h1>
              <p className="text-muted-foreground text-lg">
                Track, analyze, and improve your trading performance
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm"
                onClick={() => {
                  setEditingTrade(null);
                  form.reset();
                  setIsDialogOpen(true);
                }}
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
                accept=".csv"
                className="hidden"
                onChange={handleCSVImport}
              />
              
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
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="text-lg">
                                      <SelectValue placeholder={`Select ${watchedMarket || 'forex'} instrument`} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {marketInstruments.map((category) => (
                                      <div key={category.category}>
                                        <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">
                                          {category.category}
                                        </div>
                                        {category.instruments.map((instrument) => {
                                          if (typeof instrument === 'string') {
                                            // Forex pairs - just the symbol
                                            return (
                                              <SelectItem key={instrument} value={instrument}>
                                                {instrument}
                                              </SelectItem>
                                            );
                                          } else {
                                            // Futures/Indices - symbol with description
                                            return (
                                              <SelectItem key={instrument.symbol} value={instrument.symbol}>
                                                {instrument.symbol} - {instrument.name}
                                              </SelectItem>
                                            );
                                          }
                                        })}
                                      </div>
                                    ))}
                                  </SelectContent>
                                </Select>
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
                                  placeholder="1.0" 
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
                                  placeholder="0.0002" 
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
                                  placeholder="7.00" 
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
                                  placeholder="-2.50" 
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
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300"
                                  checked={field.value}
                                  onChange={(e) => field.onChange(e.target.checked)}
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
                                placeholder="e.g., Trend Following, Mean Reversion, Breakout" 
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
                              <textarea 
                                className="w-full min-h-[120px] rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                            background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.primary}CC)`,
                            color: 'white'
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
        {/* Enhanced Trading Statistics */}
        <div className="space-y-6 mb-8">
          {/* Primary Stats Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in slide-in-from-bottom-2 duration-500">
            {/* Total P&L Card */}
            <Card className="relative overflow-hidden border-border/50 hover:shadow-lg transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-background"></div>
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total P&L</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-black tracking-tight" 
                         style={{ color: quickStats.totalPnL >= 0 ? themeColors.profit : themeColors.loss }}>
                        {quickStats.totalPnL >= 0 ? '+' : ''}${Math.abs(quickStats.totalPnL).toFixed(0)}
                      </p>
                      <span className="text-sm font-medium text-muted-foreground">
                        .{(Math.abs(quickStats.totalPnL) % 1).toFixed(2).slice(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <FontAwesomeIcon 
                        icon={quickStats.totalPnL >= 0 ? faArrowTrendUp : faArrowTrendDown} 
                        className="h-3 w-3"
                        style={{ color: quickStats.totalPnL >= 0 ? themeColors.profit : themeColors.loss }}
                      />
                      <span className="text-muted-foreground font-medium">
                        {((quickStats.totalPnL / 10000) * 100).toFixed(1)}% from initial
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg shadow-sm" 
                       style={{ backgroundColor: `${quickStats.totalPnL >= 0 ? themeColors.profit : themeColors.loss}20` }}>
                    <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4" 
                                   style={{ color: quickStats.totalPnL >= 0 ? themeColors.profit : themeColors.loss }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Win Rate Card */}
            <Card className="relative overflow-hidden border-border/50 hover:shadow-lg transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-background"></div>
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Win Rate</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-black tracking-tight" style={{ color: themeColors.primary }}>
                        {quickStats.winRate.toFixed(0)}
                      </p>
                      <span className="text-lg font-bold text-muted-foreground">%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span style={{ color: themeColors.profit }} className="font-semibold">
                          {trades.filter(t => t.pnl > 0).length}W
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span style={{ color: themeColors.loss }} className="font-semibold">
                          {trades.filter(t => t.pnl < 0).length}L
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg shadow-sm" style={{ backgroundColor: `${themeColors.primary}20` }}>
                    <FontAwesomeIcon icon={faBullseye} className="h-4 w-4" style={{ color: themeColors.primary }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Trade Card */}
            <Card className="relative overflow-hidden border-border/50 hover:shadow-lg transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-background"></div>
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Best Trade</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-black tracking-tight" style={{ color: themeColors.profit }}>
                        +${trades.length > 0 ? Math.max(0, ...trades.map(t => t.pnl)).toFixed(0) : '0'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground font-medium">
                        {trades.length > 0 ? (trades.find(t => t.pnl === Math.max(0, ...trades.map(t => t.pnl)))?.symbol || '--') : '--'}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg shadow-sm" style={{ backgroundColor: `${themeColors.profit}20` }}>
                    <FontAwesomeIcon icon={faTrophy} className="h-4 w-4" style={{ color: themeColors.profit }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average R:R Card */}
            <Card className="relative overflow-hidden border-border/50 hover:shadow-lg transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-background"></div>
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg R:R</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-black tracking-tight" style={{ color: themeColors.primary }}>
                        {quickStats.avgRR > 0 ? quickStats.avgRR.toFixed(1) : '--'}
                      </p>
                      <span className="text-lg font-bold text-muted-foreground">:1</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <FontAwesomeIcon 
                        icon={quickStats.avgRR >= 1.5 ? faCheckCircle : faExclamationTriangle}
                        className="h-3 w-3"
                        style={{ color: quickStats.avgRR >= 1.5 ? themeColors.profit : themeColors.loss }}
                      />
                      <span className="text-muted-foreground font-medium">
                        {quickStats.avgRR >= 1.5 ? 'Good ratio' : 'Needs work'}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg shadow-sm" style={{ backgroundColor: `${themeColors.primary}20` }}>
                    <FontAwesomeIcon icon={faBalanceScale} className="h-4 w-4" style={{ color: themeColors.primary }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 animate-in slide-in-from-bottom-2 duration-500 delay-100">
            {/* Total Trades */}
            <Card className="border-border/30 hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 text-center">
                <div className="space-y-1">
                  <FontAwesomeIcon icon={faChartLine} className="h-4 w-4 mx-auto" style={{ color: themeColors.primary }} />
                  <p className="text-lg font-bold text-foreground">{quickStats.totalTrades}</p>
                  <p className="text-xs text-muted-foreground font-medium">Total Trades</p>
                </div>
              </CardContent>
            </Card>

            {/* Average Win */}
            <Card className="border-border/30 hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 text-center">
                <div className="space-y-1">
                  <FontAwesomeIcon icon={faArrowTrendUp} className="h-4 w-4 mx-auto" style={{ color: themeColors.profit }} />
                  <p className="text-lg font-bold" style={{ color: themeColors.profit }}>
                    ${(() => {
                      const winningTrades = trades.filter(t => t.pnl > 0);
                      return winningTrades.length > 0 
                        ? (winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length).toFixed(0)
                        : '0';
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">Avg Win</p>
                </div>
              </CardContent>
            </Card>

            {/* Average Loss */}
            <Card className="border-border/30 hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 text-center">
                <div className="space-y-1">
                  <FontAwesomeIcon icon={faArrowTrendDown} className="h-4 w-4 mx-auto" style={{ color: themeColors.loss }} />
                  <p className="text-lg font-bold" style={{ color: themeColors.loss }}>
                    ${(() => {
                      const losingTrades = trades.filter(t => t.pnl < 0);
                      return losingTrades.length > 0 
                        ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length).toFixed(0)
                        : '0';
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">Avg Loss</p>
                </div>
              </CardContent>
            </Card>

            {/* Profit Factor */}
            <Card className="border-border/30 hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 text-center">
                <div className="space-y-1">
                  <FontAwesomeIcon icon={faFire} className="h-4 w-4 mx-auto" style={{ color: themeColors.primary }} />
                  <p className="text-lg font-bold text-foreground">
                    {(() => {
                      const totalWins = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
                      const totalLosses = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
                      if (totalLosses === 0 && totalWins > 0) return '∞';
                      if (totalLosses === 0) return '--';
                      return (totalWins / totalLosses).toFixed(1);
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">Profit Factor</p>
                </div>
              </CardContent>
            </Card>

            {/* Current Streak */}
            <Card className="border-border/30 hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 text-center">
                <div className="space-y-1">
                  {(() => {
                    if (trades.length === 0) return <FontAwesomeIcon icon={faStar} className="h-4 w-4 mx-auto text-muted-foreground" />
                    const lastTrade = trades[trades.length - 1];
                    let streak = 0;
                    let isWinning = lastTrade.pnl > 0;
                    for (let i = trades.length - 1; i >= 0; i--) {
                      if ((trades[i].pnl > 0) === isWinning) {
                        streak++;
                      } else {
                        break;
                      }
                    }
                    return (
                      <>
                        <FontAwesomeIcon 
                          icon={isWinning ? faFire : faTimesCircle} 
                          className="h-4 w-4 mx-auto" 
                          style={{ color: isWinning ? themeColors.profit : themeColors.loss }} 
                        />
                        <p className="text-lg font-bold" style={{ color: isWinning ? themeColors.profit : themeColors.loss }}>
                          {streak}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {isWinning ? 'Win' : 'Loss'} Streak
                        </p>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* This Month */}
            <Card className="border-border/30 hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 text-center">
                <div className="space-y-1">
                  <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 mx-auto" style={{ color: themeColors.primary }} />
                  <p className="text-lg font-bold" style={{ 
                    color: (() => {
                      const now = new Date();
                      const thisMonth = now.getMonth();
                      const thisYear = now.getFullYear();
                      const monthlyPnL = trades
                        .filter(t => {
                          const tradeDate = new Date(t.exitTime);
                          return tradeDate.getMonth() === thisMonth && tradeDate.getFullYear() === thisYear;
                        })
                        .reduce((sum, t) => sum + t.pnl, 0);
                      return monthlyPnL >= 0 ? themeColors.profit : themeColors.loss;
                    })()
                  }}>
                    {(() => {
                      const now = new Date();
                      const thisMonth = now.getMonth();
                      const thisYear = now.getFullYear();
                      const monthlyPnL = trades
                        .filter(t => {
                          const tradeDate = new Date(t.exitTime);
                          return tradeDate.getMonth() === thisMonth && tradeDate.getFullYear() === thisYear;
                        })
                        .reduce((sum, t) => sum + t.pnl, 0);
                      return `${monthlyPnL >= 0 ? '+' : ''}$${monthlyPnL.toFixed(0)}`;
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">This Month</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trades Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Trades</CardTitle>
                <CardDescription>
                  View and manage your trading records
                </CardDescription>
              </div>
              <Badge variant="outline">
                {trades.length} {trades.length === 1 ? 'Trade' : 'Trades'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {trades.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No trades recorded yet</h3>
                <p className="text-muted-foreground mb-6">
                  Click "Add Trade" to record your first trade or import from CSV.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => {
                      setEditingTrade(null);
                      form.reset();
                      setIsDialogOpen(true);
                    }}
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
                    <TableRow className="border-b hover:bg-transparent">
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground py-4">Date</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Symbol</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Market</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Side</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Entry</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Exit</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Lots</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">P&L</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">R:R</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Strategy</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade) => (
                      <TableRow key={trade.id} className="hover:bg-muted/20 transition-colors duration-200 border-b border-border/50">
                        <TableCell className="font-medium py-6 text-sm text-muted-foreground">{format(new Date(trade.exitTime), 'MM/dd/yy')}</TableCell>
                        <TableCell className="font-bold text-base">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-medium px-2 py-0.5 ${
                              trade.market === 'forex' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400' :
                              trade.market === 'futures' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400' :
                              'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400'
                            }`}
                          >
                            {trade.market?.toUpperCase() || 'FX'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`font-medium text-xs px-2 py-0.5 ${
                              trade.side === 'long' 
                                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30' 
                                : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
                            }`}
                            variant="outline"
                          >
                            {trade.side.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm tabular-nums">{trade.entryPrice.toFixed(trade.symbol?.includes('JPY') ? 3 : 5)}</TableCell>
                        <TableCell className="font-medium text-sm tabular-nums">{trade.exitPrice.toFixed(trade.symbol?.includes('JPY') ? 3 : 5)}</TableCell>
                        <TableCell className="font-medium text-sm">{trade.lotSize}</TableCell>
                        <TableCell className={`font-bold text-base ${
                          trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
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
                              className="hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-950 transition-all duration-200 hover:shadow-md"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(trade.id)}
                              className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 transition-all duration-200 hover:shadow-md"
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
              <div className="md:hidden space-y-4">
                {trades.map((trade) => (
                  <Card key={trade.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{trade.symbol}</span>
                            <Badge 
                              className={`font-medium text-xs px-2 py-0.5 ${
                                trade.side === 'long' 
                                  ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                                  : 'bg-red-500/10 text-red-600 border-red-500/20'
                              }`}
                            >
                              {trade.side.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(trade.exitTime), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className={`font-bold text-xl ${
                          trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Entry:</span>
                          <span className="ml-2 font-medium">{trade.entryPrice.toFixed(trade.symbol?.includes('JPY') ? 3 : 5)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Exit:</span>
                          <span className="ml-2 font-medium">{trade.exitPrice.toFixed(trade.symbol?.includes('JPY') ? 3 : 5)}</span>
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
                      
                      <div className="flex gap-2 mt-4 pt-3 border-t">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}