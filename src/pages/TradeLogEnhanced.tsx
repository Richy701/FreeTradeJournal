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
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle, Clock, Plus, Edit, Trash2, Upload, Download, BarChart3, TrendingUp, DollarSign, FileText, Search, Filter, SortAsc, SortDesc, Eye, EyeOff, RefreshCw, Target, PieChart, Calendar, Zap } from 'lucide-react';
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
  propFirm?: string
}

// Enhanced filter state
interface FilterState {
  search: string
  market: string
  strategy: string
  side: string
  profitLoss: string
  dateRange: string
  symbol: string
  propFirm: string
}

export default function TradeLogEnhanced() {
  const { themeColors } = useThemePresets();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof Trade>('exitTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [quickStats, setQuickStats] = useState({
    totalPnL: 0,
    winRate: 0,
    totalTrades: 0,
    avgRR: 0
  });

  // Enhanced filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    market: 'all',
    strategy: 'all',
    side: 'all',
    profitLoss: 'all',
    dateRange: 'all',
    symbol: 'all',
    propFirm: 'all'
  });

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

  // Enhanced loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedTrades = localStorage.getItem('trades');
      if (savedTrades) {
        try {
          const parsedTrades = JSON.parse(savedTrades);
          const tradesWithDates = parsedTrades.map((trade: any) => ({
            ...trade,
            entryTime: new Date(trade.entryTime),
            exitTime: new Date(trade.exitTime)
          }));
          setTrades(tradesWithDates);
          setFilteredTrades(tradesWithDates);
          calculateQuickStats(tradesWithDates);
        } catch (error) {
          console.error('Error loading trades:', error);
          setTrades([]);
          setFilteredTrades([]);
        }
      }
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Calculate quick stats
  const calculateQuickStats = (tradeList: Trade[]) => {
    const totalTrades = tradeList.length;
    const totalPnL = tradeList.reduce((sum, trade) => sum + trade.pnl, 0);
    const winners = tradeList.filter(trade => trade.pnl > 0);
    const winRate = totalTrades > 0 ? (winners.length / totalTrades) * 100 : 0;
    const avgRR = tradeList
      .filter(trade => trade.riskReward && trade.riskReward > 0)
      .reduce((sum, trade) => sum + (trade.riskReward || 0), 0) / 
      tradeList.filter(trade => trade.riskReward && trade.riskReward > 0).length || 0;

    setQuickStats({ totalPnL, winRate, totalTrades, avgRR });
  };

  // Enhanced filtering with real-time updates
  useEffect(() => {
    let filtered = [...trades];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(trade => 
        trade.symbol.toLowerCase().includes(searchLower) ||
        trade.strategy?.toLowerCase().includes(searchLower) ||
        trade.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Market filter
    if (filters.market !== 'all') {
      filtered = filtered.filter(trade => trade.market === filters.market);
    }

    // Strategy filter
    if (filters.strategy !== 'all') {
      filtered = filtered.filter(trade => trade.strategy === filters.strategy);
    }

    // Side filter
    if (filters.side !== 'all') {
      filtered = filtered.filter(trade => trade.side === filters.side);
    }

    // Profit/Loss filter
    if (filters.profitLoss !== 'all') {
      if (filters.profitLoss === 'profit') {
        filtered = filtered.filter(trade => trade.pnl > 0);
      } else if (filters.profitLoss === 'loss') {
        filtered = filtered.filter(trade => trade.pnl < 0);
      }
    }

    // Symbol filter
    if (filters.symbol !== 'all') {
      filtered = filtered.filter(trade => trade.symbol === filters.symbol);
    }

    // Prop firm filter
    if (filters.propFirm !== 'all') {
      filtered = filtered.filter(trade => trade.propFirm === filters.propFirm);
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      // Handle undefined values
      if (aVal === undefined && bVal === undefined) return 0;
      if (aVal === undefined) return sortOrder === 'asc' ? 1 : -1;
      if (bVal === undefined) return sortOrder === 'asc' ? -1 : 1;
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredTrades(filtered);
    calculateQuickStats(filtered);
  }, [trades, filters, sortBy, sortOrder]);

  // Get unique values for filter dropdowns
  const getUniqueValues = (key: keyof Trade) => {
    const values = trades
      .map(trade => trade[key])
      .filter((value): value is string => Boolean(value))
      .filter((value, index, array) => array.indexOf(value) === index);
    return values.sort();
  };

  const handleSort = (field: keyof Trade) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      market: 'all',
      strategy: 'all',
      side: 'all',
      profitLoss: 'all',
      dateRange: 'all',
      symbol: 'all',
      propFirm: 'all'
    });
  };

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header Skeleton */}
        <div className="border-b bg-card/80 backdrop-blur-xl">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
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
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-20" />
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
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-9 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
        {/* Enhanced Header Section */}
        <div className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-20 shadow-sm">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <h1 
                  className="text-3xl font-bold bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.primary}DD)`
                  }}
                >
                  Trade Journal
                </h1>
                <p className="text-muted-foreground text-lg">
                  Track, analyze, and improve your trading performance
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                      {Object.values(filters).some(f => f !== 'all' && f !== '') && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 rounded-full text-xs">
                          !
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle advanced filters</TooltipContent>
                </Tooltip>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('csv-import')?.click()}
                  disabled={csvUploadState.isUploading}
                  className="gap-2"
                >
                  {csvUploadState.isUploading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {csvUploadState.isUploading ? 'Processing...' : 'Import CSV'}
                </Button>
                
                <input
                  id="csv-import"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  // onChange={handleCSVImport}
                />
                
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={trades.length === 0}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Trade
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4" 
                  style={{ borderLeftColor: themeColors.primary }}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${themeColors.primary}20` }}>
                    <DollarSign className="h-6 w-6" style={{ color: themeColors.primary }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                    <p className={`text-2xl font-bold ${quickStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${quickStats.totalPnL >= 0 ? '+' : ''}
                      {quickStats.totalPnL.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4" 
                  style={{ borderLeftColor: themeColors.profit }}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${themeColors.profit}20` }}>
                    <Target className="h-6 w-6" style={{ color: themeColors.profit }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold" style={{ color: themeColors.profit }}>
                      {quickStats.winRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {quickStats.totalTrades}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg R:R</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {quickStats.avgRR > 0 ? quickStats.avgRR.toFixed(2) : '--'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Filters */}
          {showFilters && (
            <Card className="mb-8 animate-in slide-in-from-top-2 duration-300">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Advanced Filters</CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Symbol, strategy, notes..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Market</Label>
                    <Select
                      value={filters.market}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, market: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Markets</SelectItem>
                        <SelectItem value="forex">Forex</SelectItem>
                        <SelectItem value="futures">Futures</SelectItem>
                        <SelectItem value="indices">Indices</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Side</Label>
                    <Select
                      value={filters.side}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, side: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sides</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Outcome</Label>
                    <Select
                      value={filters.profitLoss}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, profitLoss: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Outcomes</SelectItem>
                        <SelectItem value="profit">Profitable</SelectItem>
                        <SelectItem value="loss">Losses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Trade Table */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Trade History
                  </CardTitle>
                  <CardDescription>
                    {filteredTrades.length} of {trades.length} trades
                    {filteredTrades.length !== trades.length && (
                      <Badge variant="secondary" className="ml-2">
                        Filtered
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('exitTime')}
                    className="gap-1"
                  >
                    Date
                    {sortBy === 'exitTime' && (
                      sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('pnl')}
                    className="gap-1"
                  >
                    P&L
                    {sortBy === 'pnl' && (
                      sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No trades found</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    {trades.length === 0 
                      ? "Start by adding your first trade or importing data from a CSV file."
                      : "Try adjusting your filters to see more results."}
                  </p>
                  {trades.length === 0 && (
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Trade
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead>Entry</TableHead>
                        <TableHead>Exit</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>P&L</TableHead>
                        <TableHead>R:R</TableHead>
                        <TableHead>Strategy</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrades.map((trade, index) => (
                        <TableRow 
                          key={trade.id} 
                          className="animate-in fade-in-0 hover:bg-muted/50 transition-colors"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <TableCell className="font-medium">
                            {format(trade.exitTime, 'MMM dd, HH:mm')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {trade.market?.toUpperCase() || 'FX'}
                              </Badge>
                              <span className="font-medium">{trade.symbol}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={trade.side === 'long' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {trade.side}
                            </Badge>
                          </TableCell>
                          <TableCell>{trade.entryPrice.toFixed(4)}</TableCell>
                          <TableCell>{trade.exitPrice.toFixed(4)}</TableCell>
                          <TableCell>{trade.lotSize}</TableCell>
                          <TableCell>
                            <span className={`font-semibold ${
                              trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {trade.riskReward ? (
                              <span className="text-sm font-medium">
                                1:{trade.riskReward.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">--</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {trade.strategy && (
                              <Badge variant="outline" className="text-xs">
                                {trade.strategy}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setEditingTrade(trade);
                                      setIsDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit trade</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete trade</TooltipContent>
                              </Tooltip>
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
    </TooltipProvider>
  );
}