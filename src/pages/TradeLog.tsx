import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Edit, Trash2, Upload, Download, BarChart3, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { startOfYear, endOfYear, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth } from 'date-fns';
import { DateTimePicker } from '@/components/ui/date-picker';
import { parseCSV, validateCSVFile } from '@/utils/csv-parser';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    uploadSuccess: false,
    uploadError: '',
    parseResult: null as any,
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
          { category: 'Energy', instruments: [
            { symbol: 'CL', name: 'Crude Oil' },
            { symbol: 'NG', name: 'Natural Gas' },
            { symbol: 'RB', name: 'Gasoline' }
          ]},
          { category: 'Metals', instruments: [
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
          { category: 'US Indices', instruments: [
            { symbol: 'ES', name: 'S&P 500' },
            { symbol: 'NQ', name: 'Nasdaq 100' },
            { symbol: 'YM', name: 'Dow Jones' },
            { symbol: 'RTY', name: 'Russell 2000' }
          ]}
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    const savedTrades = localStorage.getItem('trades');
    if (savedTrades) {
      try {
        const parsedTrades = JSON.parse(savedTrades);
        // Ensure dates are properly parsed
        const tradesWithDates = parsedTrades.map((trade: any) => ({
          ...trade,
          entryTime: new Date(trade.entryTime),
          exitTime: new Date(trade.exitTime)
        }));
        setTrades(tradesWithDates);
      } catch (error) {
        console.error('Error loading trades:', error);
        setTrades([]);
      }
    }
  }, []);

  const saveTrades = (updatedTrades: Trade[]) => {
    setTrades(updatedTrades);
    localStorage.setItem('trades', JSON.stringify(updatedTrades));
  };

  const calculatePnL = (data: TradeFormData): { pnl: number; pnlPercentage: number; riskReward: number } => {
    const { side, entryPrice, exitPrice, stopLoss, takeProfit, lotSize, commission, swap, spread, market = 'forex' } = data;
    let grossPnL = 0;
    let multiplier = 1;
    
    // Set multipliers based on market type
    if (market === 'forex') {
      multiplier = 100000; // Standard lot for most forex pairs
    } else if (market === 'futures') {
      multiplier = 1; // Futures are already per point
    } else if (market === 'indices') {
      multiplier = 1; // Indices per point
    }
    
    if (side === 'long') {
      grossPnL = (exitPrice - entryPrice) * lotSize * multiplier;
    } else {
      grossPnL = (entryPrice - exitPrice) * lotSize * multiplier;
    }
    
    const pnl = grossPnL - commission - swap - (spread * lotSize);
    const investment = entryPrice * lotSize * multiplier;
    const pnlPercentage = investment > 0 ? (pnl / investment) * 100 : 0;
    
    // Calculate Risk-Reward ratio properly
    let riskReward = 0;
    if (stopLoss && takeProfit) {
      // If we have SL and TP, calculate based on planned levels
      const risk = Math.abs(entryPrice - stopLoss);
      const reward = Math.abs(takeProfit - entryPrice);
      riskReward = risk > 0 ? reward / risk : 0;
    } else {
      // If no SL/TP, calculate based on actual result vs entry
      const actualMove = Math.abs(exitPrice - entryPrice);
      // Estimate risk as a percentage of the move (this is approximate)
      const estimatedRisk = actualMove * 0.5; // Assume risk was half the move
      riskReward = estimatedRisk > 0 ? actualMove / estimatedRisk : 0;
    }
    
    return { pnl, pnlPercentage, riskReward };
  };

  const onSubmit = (data: TradeFormData) => {
    const { pnl, pnlPercentage, riskReward } = calculatePnL(data);
    
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
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updatedTrades = trades.filter((t) => t.id !== id);
    saveTrades(updatedTrades);
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvUploadState({
      isUploading: true,
      uploadSuccess: false,
      uploadError: '',
      parseResult: null
    });

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
            id: `import-${Date.now()}-${index}`,
            ...tradeFormData,
            pnl: parseFloat(trade.pnl) || pnl, // Use actual PnL from CSV if available
            pnlPercentage,
            riskReward,
            entryTime: new Date(trade.date),
            exitTime: new Date(trade.date),
            notes: `Imported from CSV`,
            strategy: '',
          };
        });
        
        // Add imported trades to existing trades
        saveTrades([...trades, ...importedTrades]);
        
        setCsvUploadState({
          isUploading: false,
          uploadSuccess: true,
          uploadError: '',
          parseResult: result
        });
        
      } else {
        setCsvUploadState({
          isUploading: false,
          uploadSuccess: false,
          uploadError: result.errors.join('; '),
          parseResult: result
        });
      }
      
    } catch (error) {
      setCsvUploadState({
        isUploading: false,
        uploadSuccess: false,
        uploadError: error instanceof Error ? error.message : 'Failed to parse CSV file',
        parseResult: null
      });
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

  return (
    <div className="min-h-screen w-full">
      {/* Header Section */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Trade Journal
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track and analyze your forex & futures trades
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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
              
              {/* CSV Upload Feedback */}
              {csvUploadState.uploadError && (
                <div className="w-full">
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{csvUploadState.uploadError}</AlertDescription>
                  </Alert>
                </div>
              )}

              {csvUploadState.uploadSuccess && csvUploadState.parseResult && (
                <div className="w-full">
                  <Alert className="mt-2">
                    <Upload className="h-4 w-4" />
                    <AlertDescription>
                      Successfully imported {csvUploadState.parseResult.summary.successfulParsed} trades
                      {csvUploadState.parseResult.summary.dateRange && (
                        <span> from {csvUploadState.parseResult.summary.dateRange.earliest} to {csvUploadState.parseResult.summary.dateRange.latest}</span>
                      )}
                      {csvUploadState.parseResult.summary.failed > 0 && (
                        <span>. {csvUploadState.parseResult.summary.failed} rows had issues and were skipped.</span>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={trades.length === 0}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Report
                  </Button>
                </DialogTrigger>
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
                      <div className="grid grid-cols-2 gap-4">
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
                      className="px-6"
                      className="px-6 bg-primary text-primary-foreground"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setEditingTrade(null);
                      form.reset();
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Trade
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{editingTrade ? 'Edit Trade' : 'Add New Trade'}</DialogTitle>
                    <DialogDescription className="text-base">
                      Enter your trade details below. All fields marked with * are required.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Basic Trade Info */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      </div>

                      {/* Pricing */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Stats Overview */}
        {trades.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold mt-1">{trades.length}</p>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold mt-1">
                    {trades.length > 0 ? ((trades.filter(t => t.pnl > 0).length / trades.length) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    trades.reduce((sum, t) => sum + t.pnl, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${trades.reduce((sum, t) => sum + t.pnl, 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg R:R</p>
                  <p className="text-2xl font-bold mt-1">
                    {trades.filter(t => t.riskReward).length > 0 ? 
                      (trades.filter(t => t.riskReward).reduce((sum, t) => sum + (t.riskReward || 0), 0) / 
                       trades.filter(t => t.riskReward).length).toFixed(2) : '0.00'}:1
                  </p>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          </div>
        )}

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
              <div className="w-full overflow-x-auto">
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
                              className="hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-950 transition-all duration-200 hover:scale-110"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(trade.id)}
                              className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 transition-all duration-200 hover:scale-110"
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}