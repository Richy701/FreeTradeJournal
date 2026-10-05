import { useMemo } from 'react';
import { format } from 'date-fns';
import { FileCsv, FileText, Warning } from '@phosphor-icons/react';
import { Line, LineChart } from 'recharts';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useThemePresets } from '@/contexts/theme-presets';
import { useSettings } from '@/contexts/settings-context';
import { formatPrice } from '@/lib/format-price';
import type { CSVParseResult } from '@/utils/csv-parser';
import type { ImportedTrade, planImport } from '@/utils/import-trades';

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName?: string;
  parseResult: CSVParseResult | null;
  /** What confirming will actually save (net P&L, duplicates removed). */
  plan: ReturnType<typeof planImport> | null;
  importing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// The list scrolls, but a multi-year export shouldn't put thousands of rows
// in the dialog.
const MAX_ROWS = 200;
const MAX_CURVE_POINTS = 150;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function dateRange(trades: ImportedTrade[]): { start: Date; end: Date } | null {
  let min = Infinity;
  let max = -Infinity;
  for (const t of trades) {
    const a = t.entryTime.getTime();
    const b = t.exitTime.getTime();
    if (Number.isFinite(a)) min = Math.min(min, a);
    if (Number.isFinite(b)) max = Math.max(max, b);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { start: new Date(min), end: new Date(Math.max(min, max)) };
}

function formatRange({ start, end }: { start: Date; end: Date }): string {
  if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) return format(start, 'MMM d, yyyy');
  if (start.getFullYear() === end.getFullYear()) return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}

// The one preview both the Dashboard and the Trade Log show before a CSV
// import is saved.
export function ImportPreviewDialog({
  open, onOpenChange, fileName, parseResult, plan, importing, onCancel, onConfirm,
}: ImportPreviewDialogProps) {
  const { themeColors, alpha } = useThemePresets();
  const { formatCurrency } = useSettings();

  const parsedCount = parseResult?.trades.length ?? 0;
  const newTrades = plan?.newTrades ?? [];
  const newCount = newTrades.length;
  const skipped = plan?.skippedCount ?? 0;
  const failed = parseResult?.summary.failed ?? 0;
  const errors = parseResult?.errors ?? [];
  const blocked = !!plan?.blockedReason;
  const canImport = newCount > 0 && !blocked;

  // The file's own span, whether or not its trades are new.
  const range = dateRange(plan?.built ?? []);
  const newRange = dateRange(newTrades);
  const sameYear = !newRange || newRange.start.getFullYear() === newRange.end.getFullYear();
  const day = (d: Date) => (Number.isFinite(d.getTime()) ? format(d, sameYear ? 'MMM d' : 'MMM d, yyyy') : '-');

  const pnlStyle = (v: number) => (v === 0 ? undefined : { color: v > 0 ? themeColors.profit : themeColors.loss });
  const pnlClass = (v: number) => (v === 0 ? 'text-muted-foreground' : '');
  const sideStyle = (side: string) => ({ color: side === 'long' ? themeColors.profit : themeColors.loss });
  const sideLabel = (side: string) => (side === 'long' ? 'Long' : 'Short');
  const size = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 4 });

  const title = blocked
    ? "Can't import this file yet"
    : newCount > 0
      ? `Import ${plural(newCount, 'trade')}`
      : parsedCount > 0
        ? 'Nothing new to import'
        : 'No trades found';

  const stats = useMemo(() => {
    if (newTrades.length === 0) return null;
    let net = 0, wins = 0, losses = 0;
    let best = newTrades[0], worst = newTrades[0];
    for (const t of newTrades) {
      net += t.pnl;
      if (t.pnl > 0) wins++;
      else if (t.pnl < 0) losses++;
      if (t.pnl > best.pnl) best = t;
      if (t.pnl < worst.pnl) worst = t;
    }
    // Running P&L in the order the trades closed, thinned for long files.
    const sorted = [...newTrades].sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime());
    const step = Math.max(1, Math.ceil(sorted.length / MAX_CURVE_POINTS));
    const curve: { pnl: number }[] = [{ pnl: 0 }];
    let cum = 0;
    sorted.forEach((t, i) => {
      cum += t.pnl;
      if (i % step === step - 1 || i === sorted.length - 1) curve.push({ pnl: cum });
    });
    return { net, wins, losses, winRate: (wins / newTrades.length) * 100, best, worst, curve };
  }, [newTrades]);

  const segments = [
    { key: 'new', count: newCount, label: 'new', color: themeColors.primary, numberColor: themeColors.primary },
    {
      key: 'journal',
      count: skipped,
      label: newCount === 0 ? 'already in your journal' : 'already in journal',
      color: 'hsl(var(--muted-foreground) / 0.35)',
      numberColor: undefined,
    },
    { key: 'unreadable', count: failed, label: 'unreadable', color: themeColors.loss, numberColor: themeColors.loss },
  ].filter((s) => s.count > 0);

  const compact = newCount === 0;
  const FileIcon = /\.csv$/i.test(fileName ?? '') ? FileCsv : FileText;
  const curveColor = stats && stats.net < 0 ? themeColors.loss : themeColors.profit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-[95vw] max-w-md max-h-[90svh] overflow-hidden flex flex-col ${compact ? '' : 'sm:max-w-2xl'}`}
      >
        <DialogHeader className="flex-shrink-0 pr-8">
          <DialogTitle>{title}</DialogTitle>
          {!compact && (
            <DialogDescription className="sr-only">Review the trades in this file before importing.</DialogDescription>
          )}
        </DialogHeader>

        {parseResult && (
          <>
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* The file and how its rows split up */}
              <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <FileIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium break-words">{fileName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {range && `${formatRange(range)} · `}
                    {plural(parsedCount, 'trade')} in file
                  </p>
                  {segments.length > 0 && (
                    <>
                      <div
                        className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full"
                        role="img"
                        aria-label={segments.map((s) => `${s.count} ${s.label}`).join(', ')}
                      >
                        {segments.map((s) => (
                          <div key={s.key} className="min-w-1.5" style={{ flexGrow: s.count, flexBasis: 0, backgroundColor: s.color }} />
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {segments.map((s) => (
                          <span key={s.key}>
                            <span
                              className={`font-semibold tabular-nums ${s.numberColor ? '' : 'text-foreground'}`}
                              style={s.numberColor ? { color: s.numberColor } : undefined}
                            >
                              {s.count}
                            </span>{' '}
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {compact && !blocked && (
                <DialogDescription className="text-sm text-foreground">
                  {parsedCount > 0
                    ? parsedCount === 1
                      ? 'The trade in this file is already in your journal, so nothing was added.'
                      : `All ${parsedCount} trades in this file are already in your journal, so nothing was added.`
                    : "We couldn't read any trades from this file."}
                </DialogDescription>
              )}

              {stats && (
                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-[1.2fr_0.8fr_1fr_1fr]">
                  {/* Phone: curve beside the number. Wider: curve underneath it. */}
                  <div className="col-span-3 flex items-center justify-between gap-4 bg-card px-4 py-3 sm:col-span-1 sm:block">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Net P&L</p>
                      <p className={`mt-1 text-base font-semibold tabular-nums ${pnlClass(stats.net)}`} style={pnlStyle(stats.net)}>
                        {formatCurrency(stats.net, true)}
                      </p>
                    </div>
                    {stats.curve.length > 2 && (
                      <div className="h-10 w-28 flex-shrink-0 sm:mt-1 sm:h-7 sm:w-full" aria-hidden="true">
                        <ChartContainer config={{ pnl: { label: 'P&L', color: curveColor } }} className="h-full w-full aspect-auto">
                          <LineChart data={stats.curve} margin={{ top: 3, right: 2, bottom: 3, left: 2 }}>
                            <Line dataKey="pnl" type="monotone" stroke={curveColor} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" dot={false} isAnimationActive={false} />
                          </LineChart>
                        </ChartContainer>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 bg-card px-3 py-3 sm:px-4">
                    <p className="text-xs text-muted-foreground">Win rate</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums sm:text-base">{stats.winRate.toFixed(1)}%</p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{stats.wins} W · {stats.losses} L</p>
                  </div>
                  {[
                    { label: 'Best trade', trade: stats.best },
                    { label: 'Worst trade', trade: stats.worst },
                  ].map(({ label, trade }) => (
                    <div key={label} className="min-w-0 bg-card px-3 py-3 sm:px-4">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p
                        className={`mt-1 text-sm font-semibold tabular-nums break-words sm:text-base ${pnlClass(trade.pnl)}`}
                        style={pnlStyle(trade.pnl)}
                      >
                        {formatCurrency(trade.pnl, true)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        <span className="hidden sm:inline">{trade.symbol} · </span>
                        {day(trade.exitTime)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {newCount > 0 && (
                <div className="overflow-hidden rounded-lg border bg-card">
                  {/* Phone: one compact row per trade */}
                  <div className="max-h-64 divide-y overflow-y-auto sm:hidden">
                    {newTrades.slice(0, MAX_ROWS).map((t) => (
                      <div key={t.id} className="space-y-1 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-baseline gap-2">
                            <span className="truncate font-semibold">{t.symbol}</span>
                            <span className="text-xs font-medium" style={sideStyle(t.side)}>{sideLabel(t.side)}</span>
                          </div>
                          <span className={`text-sm font-semibold tabular-nums ${pnlClass(t.pnl)}`} style={pnlStyle(t.pnl)}>
                            {formatCurrency(t.pnl, true)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {day(t.exitTime)} · {formatPrice(t.entryPrice, t.symbol)} → {formatPrice(t.exitPrice, t.symbol)} · Size {size(t.lotSize)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Plain <table> so the header can stick inside this scroller */}
                  <div className="hidden max-h-[262px] overflow-y-auto sm:block">
                    <table className="w-full caption-bottom text-sm">
                      <TableHeader className="[&_tr]:border-0">
                        <TableRow className="hover:bg-transparent">
                          {[
                            { label: 'Date', cls: 'pl-4' },
                            { label: 'Symbol', cls: '' },
                            { label: 'Side', cls: '' },
                            { label: 'Entry', cls: 'text-right' },
                            { label: 'Exit', cls: 'text-right' },
                            { label: 'Size', cls: 'text-right' },
                            { label: 'P&L', cls: 'pr-4 text-right' },
                          ].map((c) => (
                            <TableHead
                              key={c.label}
                              className={`sticky top-0 z-10 h-9 bg-card text-xs shadow-[inset_0_-1px_0_hsl(var(--border))] ${c.cls}`}
                            >
                              {c.label}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newTrades.slice(0, MAX_ROWS).map((t) => (
                          <TableRow key={t.id} className="hover:bg-transparent">
                            <TableCell className="py-2.5 pl-4 text-muted-foreground whitespace-nowrap">{day(t.exitTime)}</TableCell>
                            <TableCell className="py-2.5 font-medium">{t.symbol}</TableCell>
                            <TableCell className="py-2.5 font-medium" style={sideStyle(t.side)}>{sideLabel(t.side)}</TableCell>
                            <TableCell className="py-2.5 text-right tabular-nums">{formatPrice(t.entryPrice, t.symbol)}</TableCell>
                            <TableCell className="py-2.5 text-right tabular-nums">{formatPrice(t.exitPrice, t.symbol)}</TableCell>
                            <TableCell className="py-2.5 text-right tabular-nums">{size(t.lotSize)}</TableCell>
                            <TableCell
                              className={`py-2.5 pr-4 text-right font-semibold tabular-nums whitespace-nowrap ${pnlClass(t.pnl)}`}
                              style={pnlStyle(t.pnl)}
                            >
                              {formatCurrency(t.pnl, true)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </table>
                  </div>

                  {newCount > MAX_ROWS && (
                    <p className="border-t px-4 py-2 text-xs text-muted-foreground">
                      Showing the first {MAX_ROWS} of {newCount}. All {newCount} will be imported.
                    </p>
                  )}
                </div>
              )}

              {errors.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
                  <Warning className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: themeColors.loss }} />
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">
                      {failed > 0
                        ? `${plural(failed, 'row')} couldn't be read and will be skipped`
                        : `${plural(errors.length, 'problem')} found in this file`}
                    </p>
                    <ul className="max-h-28 space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
                      {errors.slice(0, 5).map((error, i) => (
                        <li key={i} className="break-words">{error}</li>
                      ))}
                      {errors.length > 5 && <li>and {errors.length - 5} more</li>}
                    </ul>
                  </div>
                </div>
              )}

              {blocked && (
                <div
                  className="flex items-start gap-2 rounded-lg border px-4 py-3 text-sm"
                  style={{ backgroundColor: alpha(themeColors.loss, '08'), borderColor: alpha(themeColors.loss, '20') }}
                >
                  <Warning className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: themeColors.loss }} />
                  <span>{plan!.blockedReason}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 flex-shrink-0 sm:flex-row sm:items-center sm:justify-between">
              {blocked && (
                <p className="text-xs text-muted-foreground">Import blocked until the dates are right.</p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row sm:flex-shrink-0">
                {newCount > 0 ? (
                  <>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button
                      onClick={onConfirm}
                      disabled={importing || !canImport}
                      style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                      className="hover:opacity-90"
                    >
                      {importing ? 'Importing...' : `Import ${plural(newCount, 'trade')}`}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={onCancel}
                    style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
                    className="hover:opacity-90 sm:min-w-24"
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
