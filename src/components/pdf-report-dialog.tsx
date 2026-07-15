import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, endOfDay } from 'date-fns';
import { Check, FileArrowDown, SpinnerGap } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProGate } from '@/components/pro-gate';
import { useSettings } from '@/contexts/settings-context';
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
  const { getCurrencySymbol } = useSettings();
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [generating, setGenerating] = useState(false);

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    switch (period) {
      case 'monthly': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarterly': return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case 'yearly': return { start: startOfYear(now), end: endOfYear(now) };
      // End of the chosen day, so trades ON the end date are included
      case 'custom': return { start: startDate ?? now, end: endOfDay(endDate ?? now) };
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
  const canGenerate = period !== 'custom' || (!!startDate && !!endDate);

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
        currencySymbol: getCurrencySymbol(),
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
      {/* [&>button] targets the built-in close X so it stays visible over the dark hero */}
      <DialogContent className="w-[90vw] max-w-lg p-0 gap-0 overflow-hidden [&>button]:text-white/70 [&>button:hover]:text-white">
        <ProGate featureName="PDF Trade Reports">
          {/* Hero — previews the dark Wrapped cover the report actually has */}
          <div className="bg-zinc-950 px-6 pt-6 pb-5">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                Your Trading <span className="text-amber-400">Wrapped.</span>
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-400">
                A personalised recap of your trading — stats, patterns, and insights, styled to share.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Period</Label>
              <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
                {([
                  ['monthly', 'Month'],
                  ['quarterly', 'Quarter'],
                  ['yearly', 'Year'],
                  ['custom', 'Custom'],
                ] as [ReportPeriod, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPeriod(value)}
                    aria-pressed={period === value}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      period === value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {period === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">From</Label>
                  <DatePicker
                    date={startDate}
                    onDateChange={setStartDate}
                    placeholder="Start date"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">To</Label>
                  <DatePicker
                    date={endDate}
                    onDateChange={setEndDate}
                    placeholder="End date"
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-lg font-bold tabular-nums leading-none">{filteredCount}</p>
                <p className="text-xs text-muted-foreground mt-1.5">Trades</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-lg font-bold tabular-nums leading-none">{journalCount}</p>
                <p className="text-xs text-muted-foreground mt-1.5">Journal entries</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-lg font-bold leading-none">9</p>
                <p className="text-xs text-muted-foreground mt-1.5">Pages</p>
              </div>
            </div>
            {canGenerate && (
              <p className="text-xs text-muted-foreground -mt-2">
                {format(getDateRange().start, 'MMM d, yyyy')} — {format(getDateRange().end, 'MMM d, yyyy')}
              </p>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">What's inside</Label>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {[
                  'P&L, win rate, profit factor',
                  'Top instrument',
                  'Your money day & peak hour',
                  'Long vs Short breakdown',
                  'Streaks & top strategy',
                  'Equity journey',
                  'Trader personality type',
                  'Personalised takeaway',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 shrink-0 text-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t px-6 py-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || generating || filteredCount === 0}
            >
              {generating ? (
                <>
                  <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileArrowDown className="mr-2 h-4 w-4" />
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
