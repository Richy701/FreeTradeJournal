import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProGate } from '@/components/pro-gate';
import type { PDFReportOptions } from '@/services/pdf-report';

interface Trade {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  entryTime: Date;
  exitTime: Date;
  spread: number;
  commission: number;
  swap: number;
  pnl: number;
  riskReward?: number;
  strategy?: string;
  notes?: string;
  market?: string;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: string;
  tags?: string[];
}

interface PDFReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trades: Trade[];
  journalEntries?: JournalEntry[];
  accountName?: string;
}

type ReportPeriod = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export function PDFReportDialog({ open, onOpenChange, trades, journalEntries, accountName }: PDFReportDialogProps) {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    switch (period) {
      case 'monthly': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarterly': return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case 'yearly': return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom': return { start: new Date(startDate), end: new Date(endDate) };
    }
  };

  const getFilteredTrades = () => {
    const { start, end } = getDateRange();
    return trades.filter(t => {
      const d = new Date(t.exitTime);
      return d >= start && d <= end;
    });
  };

  const getFilteredJournal = () => {
    if (!journalEntries) return [];
    const { start, end } = getDateRange();
    return journalEntries.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });
  };

  const filteredCount = getFilteredTrades().length;
  const journalCount = getFilteredJournal().length;
  const canGenerate = period !== 'custom' || (startDate && endDate);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { generatePDFReport } = await import('@/services/pdf-report');
      const range = getDateRange();
      const options: PDFReportOptions = {
        trades: getFilteredTrades(),
        journalEntries: getFilteredJournal(),
        period: range,
        reportType: period,
        accountName,
      };
      await generatePDFReport(options);
      toast.success('PDF report downloaded');
      onOpenChange(false);
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to generate PDF report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-lg">
        <ProGate featureName="PDF Trade Reports">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Trading Wrapped</DialogTitle>
            <DialogDescription className="text-base">
              Your personalised trading recap — stats, patterns, and insights tailored to your trading.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Report Period</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
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

            {period === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
              </div>
            )}

            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Trades in period</span>
                <span className="text-sm font-bold">{filteredCount}</span>
              </div>
              {journalCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Journal entries</span>
                  <span className="text-sm font-bold">{journalCount}</span>
                </div>
              )}
              {canGenerate && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs">Period</span>
                  <span className="text-xs">
                    {format(getDateRange().start, 'MMM d, yyyy')} — {format(getDateRange().end, 'MMM d, yyyy')}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-border/50">
                <h4 className="font-semibold text-sm mb-1.5">Your Wrapped includes:</h4>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Your numbers — P&L, win rate, profit factor</li>
                  <li>• Top instrument & your money day</li>
                  <li>• Long vs Short breakdown</li>
                  <li>• Win/loss streaks & top strategy</li>
                  <li>• Your equity journey</li>
                  <li>• Your trader personality type</li>
                  <li>• Personalised key takeaway</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6">
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || generating || filteredCount === 0}
              className="px-6 bg-primary text-primary-foreground"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </ProGate>
      </DialogContent>
    </Dialog>
  );
}
