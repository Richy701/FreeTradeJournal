import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
interface Trade {
  id: string
  symbol: string
  side: 'long' | 'short'
  entryPrice: number
  exitPrice: number
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
import { Plus, Edit, Trash2, Upload, Download, BarChart3, TrendingUp, DollarSign } from 'lucide-react';

export default function TradeLog() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
  });

  useEffect(() => {
    const savedTrades = localStorage.getItem('trades');
    if (savedTrades) {
      setTrades(JSON.parse(savedTrades));
    }
  }, []);

  const saveTrades = (updatedTrades: Trade[]) => {
    setTrades(updatedTrades);
    localStorage.setItem('trades', JSON.stringify(updatedTrades));
  };

  const calculatePnL = (data: TradeFormData): { pnl: number; pnlPercentage: number; riskReward: number } => {
    const { side, entryPrice, exitPrice, lotSize, commission, swap, spread } = data;
    let grossPnL = 0;
    
    if (side === 'long') {
      grossPnL = (exitPrice - entryPrice) * lotSize;
    } else {
      grossPnL = (entryPrice - exitPrice) * lotSize;
    }
    
    // Calculate net P&L including all costs
    const pnl = grossPnL - commission - swap - (spread * lotSize);
    const pnlPercentage = ((pnl / (entryPrice * lotSize)) * 100);
    
    // Calculate risk/reward ratio (simplified)
    const riskReward = Math.abs(exitPrice - entryPrice) / (entryPrice * 0.02); // Assume 2% risk
    
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

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const importedTrades: Trade[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const tradeData: any = {};
        
        headers.forEach((header, index) => {
          tradeData[header] = values[index];
        });
        
        const { pnl, pnlPercentage, riskReward } = calculatePnL({
          side: tradeData.side || 'long',
          entryPrice: parseFloat(tradeData.entryPrice) || 0,
          exitPrice: parseFloat(tradeData.exitPrice) || 0,
          lotSize: parseFloat(tradeData.lotSize || tradeData.quantity) || 1,
          spread: parseFloat(tradeData.spread) || 0,
          commission: parseFloat(tradeData.commission) || 0,
          swap: parseFloat(tradeData.swap) || 0,
          market: tradeData.market || 'forex',
        } as TradeFormData);
        
        importedTrades.push({
          id: Date.now().toString() + i,
          symbol: tradeData.symbol || '',
          side: tradeData.side || 'long',
          entryPrice: parseFloat(tradeData.entryPrice) || 0,
          exitPrice: parseFloat(tradeData.exitPrice) || 0,
          lotSize: parseFloat(tradeData.lotSize || tradeData.quantity) || 1,
          entryTime: new Date(tradeData.entryTime || Date.now()),
          exitTime: new Date(tradeData.exitTime || Date.now()),
          spread: parseFloat(tradeData.spread) || 0,
          commission: parseFloat(tradeData.commission) || 0,
          swap: parseFloat(tradeData.swap) || 0,
          pnl,
          pnlPercentage,
          riskReward,
          notes: tradeData.notes || '',
          strategy: tradeData.strategy || '',
          market: tradeData.market || 'forex',
        });
      }
      
      saveTrades([...trades, ...importedTrades]);
    };
    
    reader.readAsText(file);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trade Log</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => document.getElementById('csv-import')?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <input
            id="csv-import"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVImport}
          />
          <Button variant="outline" onClick={handleCSVExport} disabled={trades.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTrade(null);
                form.reset();
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Trade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTrade ? 'Edit Trade' : 'Add New Trade'}</DialogTitle>
                <DialogDescription>
                  Enter your trade details below. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="symbol"
                      rules={{ required: 'Symbol is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Symbol *</FormLabel>
                          <FormControl>
                            <Input placeholder="EURUSD, ES, NQ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="side"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Side *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select side" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="long">Long</SelectItem>
                              <SelectItem value="short">Short</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="entryPrice"
                      rules={{ required: 'Entry price is required', min: 0 }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entry Price *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                          <FormLabel>Exit Price *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="lotSize"
                      rules={{ required: 'Lot size is required', min: 0 }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lot Size *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="1.0" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="market"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Market Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
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

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="spread"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Spread</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.0001" placeholder="0.0002" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
                          <FormLabel>Commission</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="7.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
                          <FormLabel>Swap/Rollover</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="-2.50" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="entryTime"
                      rules={{ required: 'Entry time is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entry Time *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} value={field.value as any} />
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
                          <FormLabel>Exit Time *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} value={field.value as any} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="strategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strategy</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Breakout, Mean Reversion" {...field} />
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
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <textarea 
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Trade notes and observations..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingTrade ? 'Update Trade' : 'Add Trade'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Trades</CardTitle>
          <CardDescription>
            View and manage all your trading records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No trades recorded yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click "Add Trade" to record your first trade or import from CSV.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead>Lots</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>R:R</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>{format(new Date(trade.exitTime), 'MM/dd/yy')}</TableCell>
                    <TableCell className="font-medium">{trade.symbol}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {trade.market?.toUpperCase() || 'FX'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={trade.side === 'long' ? 'default' : 'secondary'}>
                        {trade.side.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{trade.entryPrice.toFixed(trade.symbol?.includes('JPY') ? 3 : 5)}</TableCell>
                    <TableCell>{trade.exitPrice.toFixed(trade.symbol?.includes('JPY') ? 3 : 5)}</TableCell>
                    <TableCell>{trade.lotSize || (trade as any).quantity || 1}</TableCell>
                    <TableCell className={trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                      ${trade.pnl.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {trade.riskReward ? `${trade.riskReward.toFixed(2)}:1` : '-'}
                    </TableCell>
                    <TableCell>{trade.strategy || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(trade)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(trade.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}