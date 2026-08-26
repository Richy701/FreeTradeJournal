import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, endOfDay, subMonths } from 'date-fns';
import { Check, FileArrowDown, SpinnerGap } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/date-picker';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProGate } from '@/components/pro-gate';
import { useSettings } from '@/contexts/settings-context';
import type { PDFReportOptions } from '@/services/pdf-report';
import { SegmentedControl } from '@/components/ui/segmented-control'

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

type ReportPeriod = 'monthly' | 'lastMonth' | 'quarterly' | 'yearly' | 'custom';

export function PDFReportDialog({ open, onOpenChange, trades, journalEntries, accountName }: PDFReportDialogProps) {
  const { getCurrencySymbol } = useSettings();
  const currencySymbol = getCurrencySymbol();
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [generating, setGenerating] = useState(false);

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    switch (period) {
      case 'monthly': return { start: startOfMonth(now), end: endOfMonth(now) };
      // The report people most often want: the month that just finished.
      // Without this, a completed month was only reachable via custom dates.
      case 'lastMonth': {
        const prev = subMonths(now, 1);
        return { start: startOfMonth(prev), end: endOfMonth(prev) };
      }
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

  const filtered = getFilteredTrades();
  const filteredCount = filtered.length;
  const journalCount = getFilteredJournal().length;
  const daysTraded = new Set(filtered.map(t => format(new Date(t.exitTime), 'yyyy-MM-dd'))).size;
  const canGenerate = period !== 'custom' || (!!startDate && !!endDate);

  // Live cover-preview numbers for the selected period
  const totalPnL = filtered.reduce((s, t) => s + t.pnl, 0);
  const winRate = filteredCount > 0
    ? (filtered.filter(t => t.pnl > 0).length / filteredCount) * 100
    : 0;
  const pnlLabel = `${totalPnL >= 0 ? '+' : '-'}${currencySymbol}${Math.abs(totalPnL).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

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
        currencySymbol,
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
      {/* p-0 alone doesn't beat the base dialog's sm:p-6 (twMerge keeps other
          breakpoints) — without sm:p-0 the dark hero renders inset in a light
          gutter on desktop. */}
      <DialogContent className="w-[90vw] max-w-lg p-0 sm:p-0 gap-0 overflow-hidden [&>button]:text-white/70 [&>button:hover]:text-white">
        <ProGate featureName="PDF Trade Reports">
          {/* Hero — a live miniature of the report's dark cover page, with the
              selected period's real numbers. Deliberately NOT themed: the PDF
              itself is always amber-on-black, and the hero previews the PDF. */}
          <div className="relative overflow-hidden bg-[#09090c] px-6 pt-6 pb-6">
            <div
              className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full blur-3xl"
              style={{ backgroundColor: 'rgba(251, 191, 36, 0.07)' }}
            />
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md bg-amber-400 flex items-center justify-center">
                  <span className="text-[7px] font-bold text-zinc-950">FTJ</span>
                </div>
                <span className="text-xs text-zinc-500">FreeTradeJournal</span>
              </div>
              <DialogHeader className="space-y-0 text-left">
                <DialogTitle asChild>
                  <h2 className="font-display mt-4 text-[2rem] leading-[1.05] font-bold tracking-tight text-white">
                    Your Trading
                    <br />
                    <span className="text-amber-400">Wrapped.</span>
                  </h2>
                </DialogTitle>
                <DialogDescription asChild>
                  <p className="!mt-3 text-xs text-zinc-500">
                    {canGenerate
                      ? `${format(getDateRange().start, 'MMM d')} – ${format(getDateRange().end, 'MMM d, yyyy')}`
                      : 'Pick a date range'}
                    {accountName ? ` · ${accountName}` : ''}
                  </p>
                </DialogDescription>
              </DialogHeader>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  {
                    value: filteredCount > 0 ? pnlLabel : '—',
                    label: 'P&L',
                    color: filteredCount === 0 ? '#71717a' : totalPnL >= 0 ? '#34d399' : '#f87171',
                  },
                  {
                    value: filteredCount > 0 ? `${winRate.toFixed(0)}%` : '—',
                    label: 'Win rate',
                    color: '#fbbf24',
                  },
                  { value: String(filteredCount), label: 'Trades', color: '#fff' },
                ].map(chip => (
                  <div key={chip.label} className="rounded-lg bg-zinc-900/90 border border-zinc-800 px-3 py-2.5">
                    <p className="text-base font-bold tabular-nums leading-none" style={{ color: chip.color }}>
                      {chip.value}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1.5">{chip.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Period</Label>
              <SegmentedControl
                value={period}
                onChange={setPeriod}
                fullWidth
                aria-label="Report period"
                options={[
                  { value: 'monthly', label: 'This month' },
                  { value: 'lastMonth', label: 'Last month' },
                  { value: 'quarterly', label: 'Quarter' },
                  { value: 'yearly', label: 'Year' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
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

            <p className="text-xs text-muted-foreground">
              {filteredCount === 0 && canGenerate
                ? 'No trades in this range — pick another period to generate a report.'
                : `${daysTraded} day${daysTraded !== 1 ? 's' : ''} traded · ${journalCount} journal ${journalCount === 1 ? 'entry' : 'entries'} included`}
            </p>

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
              className="bg-amber-400 text-zinc-950 hover:bg-amber-300"
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
