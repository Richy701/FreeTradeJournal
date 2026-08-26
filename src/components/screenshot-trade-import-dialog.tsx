import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UploadSimple, ArrowLeft, Camera } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useThemePresets } from '@/contexts/theme-presets';
import { useProStatus } from '@/contexts/pro-context';
import { requestScreenshotTrades, type ScreenshotUsage } from '@/services/ai-analysis';
import { fileToBase64, screenshotTradesToReview, type ReviewTrade } from '@/utils/screenshot-import';
import { buildImportedTrades, tradeFingerprint, type ImportedTrade } from '@/utils/import-trades';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  brokerTimezone?: string;
  // Fingerprintable existing trades for duplicate detection.
  existingTrades: Parameters<typeof tradeFingerprint>[0][];
  // Receives fully built trades; the caller saves and toasts (same as CSV).
  onImport: (trades: ImportedTrade[]) => void;
}

const FREE_TOTAL = 3;
const PRO_DAILY = 20;

// Screenshot → AI → editable review table → the shared CSV import sink.
// Modelled on PropTracker's billing screenshot dialog; nothing is saved until
// the user confirms the reviewed rows.
export function ScreenshotTradeImportDialog({ open, onOpenChange, accountId, brokerTimezone, existingTrades, onImport }: Props) {
  const { themeColors } = useThemePresets();
  const { isPro } = useProStatus();
  const navigate = useNavigate();
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [rows, setRows] = useState<ReviewTrade[]>([]);
  const [usage, setUsage] = useState<ScreenshotUsage | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [shotCount, setShotCount] = useState(0);

  const reset = () => {
    setStep('upload');
    setLoading(false);
    setDragOver(false);
    setRows([]);
    setWarnings([]);
    setShotCount(0);
  };

  const close = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  // Build with the current edits so the fingerprint reflects what would be saved.
  const toBuilt = (list: ReviewTrade[]) =>
    buildImportedTrades(list, { fileName: 'screenshot', accountId, brokerTimezone, idPrefix: 'shot' });

  const markDuplicates = (incoming: ReviewTrade[], already: ReviewTrade[]): ReviewTrade[] => {
    const seen = new Set(existingTrades.map(tradeFingerprint));
    for (const t of toBuilt(already.filter((r) => r.date))) seen.add(tradeFingerprint(t));
    const out: ReviewTrade[] = [];
    for (const r of incoming) {
      if (!r.date) { out.push(r); continue; }
      const fp = tradeFingerprint(toBuilt([r])[0]);
      const dup = seen.has(fp);
      if (!dup) seen.add(fp);
      out.push(dup ? { ...r, duplicate: true, keep: false } : r);
    }
    return out;
  };

  const processFiles = async (files: File[]) => {
    if (!files.length) return;
    const bad = files.find((f) => !f.type.startsWith('image/'));
    if (bad) { toast.warning('Please upload image files only'); return; }
    setLoading(true);
    setDragOver(false);
    try {
      let collected: ReviewTrade[] = [];
      let newWarnings: string[] = [];
      let lastUsage: ScreenshotUsage | null = null;
      for (const file of files) {
        const base64 = await fileToBase64(file);
        const res = await requestScreenshotTrades(base64, file.type);
        lastUsage = res.usage;
        newWarnings = newWarnings.concat(res.warnings || []);
        const mapped = screenshotTradesToReview(res.trades).map((r) => ({ ...r, id: `${r.id}-${file.name}-${collected.length}` }));
        collected = collected.concat(mapped);
      }
      if (lastUsage) setUsage(lastUsage);
      setShotCount((n) => n + files.length);
      if (!collected.length) {
        toast.warning('No closed trades found in that screenshot', {
          description: newWarnings[0] || 'Try a screenshot of your history or closed-positions list, zoomed in enough to read.',
        });
        setLoading(false);
        return;
      }
      const deduped = markDuplicates(collected, rows);
      const dupCount = deduped.filter((r) => r.duplicate).length;
      if (dupCount) toast.info(`${dupCount} duplicate${dupCount === 1 ? '' : 's'} found, unticked`);
      setRows((prev) => prev.concat(deduped));
      setWarnings((prev) => prev.concat(newWarnings));
      setStep('review');
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === 'functions/resource-exhausted') {
        toast.error(e.message || 'Screenshot import limit reached', {
          action: isPro ? undefined : { label: 'See Pro', onClick: () => navigate('/pricing') },
          duration: 8000,
        });
      } else {
        toast.error(e?.message || 'Failed to read screenshot');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (id: string, patch: Partial<ReviewTrade>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const kept = rows.filter((r) => r.keep && r.date);
  const allKept = rows.length > 0 && rows.every((r) => r.keep || !r.date);

  const confirm = () => {
    if (!kept.length) return;
    onImport(toBuilt(kept));
    close(false);
  };

  const usageLine = (() => {
    if (usage) {
      return usage.scope === 'day'
        ? `${usage.remaining} of ${usage.limit} screenshot imports left today`
        : `${usage.remaining} of ${usage.limit} free screenshot imports left`;
    }
    return isPro ? `Pro: ${PRO_DAILY} screenshot imports a day` : `Free plan: ${FREE_TOTAL} screenshot imports included`;
  })();

  const cellInput = 'h-8 px-2 text-xs';

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className={step === 'review' ? 'max-w-6xl' : 'sm:max-w-2xl'}>
        <DialogHeader>
          <DialogTitle>Import from Screenshot</DialogTitle>
          <DialogDescription>
            {step === 'upload'
              ? 'Upload a screenshot of your closed trades or history. We read the trades out and show them to you before anything is saved.'
              : 'Check each row and fix anything the AI misread. Only ticked rows are imported.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <label
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/50 hover:bg-muted/40'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                processFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/')));
              }}
            >
              {loading ? (
                <>
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: themeColors.primary, borderTopColor: 'transparent' }} />
                  <p className="text-sm text-muted-foreground">Reading trades…</p>
                </>
              ) : (
                <>
                  <UploadSimple className={`h-8 w-8 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} style={dragOver ? { color: themeColors.primary } : {}} />
                  <div className="text-center">
                    <p className="text-sm font-medium">{dragOver ? 'Drop to upload' : 'Drag & drop or click to upload'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Multiple files supported · PNG, JPG, WEBP</p>
                  </div>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={loading}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  processFiles(files);
                }}
              />
            </label>

            <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground space-y-1.5">
              <p className="flex items-start gap-2"><Camera className="h-3.5 w-3.5 mt-0.5 shrink-0" />Works with MT4/MT5 (phone or desktop), TradingView, TopstepX, Tradovate, NinjaTrader and most broker apps. Screenshot the closed trades or history list.</p>
              <p>Screenshots are sent to our AI provider to read the trade data and are not stored. Crop out anything you don't want to share.</p>
            </div>

            <p className="text-xs text-muted-foreground text-center">{usageLine}</p>
          </div>
        )}

        {step === 'review' && (
          // min-w-0: DialogContent is a grid, so without it this item grows to
          // the table's intrinsic width and the table escapes the dialog
          // instead of scrolling inside it.
          <div className="space-y-3 min-w-0">
            {warnings.length > 0 && (
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {warnings.slice(0, 3).map((w, i) => <p key={i}>{w}</p>)}
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 text-left w-8">
                      <Checkbox
                        checked={allKept}
                        onCheckedChange={(v) => setRows((prev) => prev.map((r) => (r.date ? { ...r, keep: !!v } : r)))}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-2 py-2 text-left font-medium">Symbol</th>
                    <th className="px-2 py-2 text-left font-medium">Side</th>
                    <th className="px-2 py-2 text-left font-medium">Entry</th>
                    <th className="px-2 py-2 text-left font-medium">Exit</th>
                    <th className="px-2 py-2 text-left font-medium">Size</th>
                    <th className="px-2 py-2 text-left font-medium">P&amp;L</th>
                    <th className="px-2 py-2 text-left font-medium">Opened</th>
                    <th className="px-2 py-2 text-left font-medium">Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-t border-border/60 align-top ${r.duplicate ? 'opacity-50' : ''} ${r.lowConfidence && !r.duplicate ? 'bg-amber-500/[0.06]' : ''}`}
                    >
                      <td className="px-2 py-1.5">
                        <Checkbox
                          checked={r.keep}
                          disabled={!r.date}
                          onCheckedChange={(v) => updateRow(r.id, { keep: !!v })}
                          aria-label="Import this trade"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input className={`${cellInput} w-24`} value={r.symbol} onChange={(e) => updateRow(r.id, { symbol: e.target.value.toUpperCase() })} />
                        {(r.duplicate || !r.date || r.lowConfidence) && (
                          <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                            {r.duplicate ? 'Duplicate' : !r.date ? 'Add a date' : 'Check this row'}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <Select value={r.side} onValueChange={(v) => updateRow(r.id, { side: v as 'long' | 'short' })}>
                          <SelectTrigger className="h-8 w-[5.5rem] px-2 text-xs" aria-label="Side">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="long">Long</SelectItem>
                            <SelectItem value="short">Short</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5"><Input className={`${cellInput} w-24`} inputMode="decimal" value={r.entryPrice} onChange={(e) => updateRow(r.id, { entryPrice: e.target.value })} /></td>
                      <td className="px-2 py-1.5"><Input className={`${cellInput} w-24`} inputMode="decimal" value={r.exitPrice} onChange={(e) => updateRow(r.id, { exitPrice: e.target.value })} /></td>
                      <td className="px-2 py-1.5"><Input className={`${cellInput} w-16`} inputMode="decimal" value={r.quantity} onChange={(e) => updateRow(r.id, { quantity: e.target.value })} /></td>
                      <td className="px-2 py-1.5"><Input className={`${cellInput} w-20`} inputMode="decimal" value={r.pnl} onChange={(e) => updateRow(r.id, { pnl: e.target.value })} /></td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="datetime-local"
                          step={1}
                          className={`${cellInput} w-44`}
                          value={r.entryDate || ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateRow(r.id, { entryDate: v || undefined, date: v, keep: r.keep || (!!v && !r.duplicate) });
                          }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="datetime-local"
                          step={1}
                          className={`${cellInput} w-44`}
                          value={r.exitDate || ''}
                          onChange={(e) => updateRow(r.id, { exitDate: e.target.value || undefined })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span className="shrink-0">{shotCount} screenshot{shotCount === 1 ? '' : 's'} · {rows.length} row{rows.length === 1 ? '' : 's'} · {usageLine}</span>
              <span>P&amp;L is the figure shown on your platform. Commission and swap are subtracted when they were visible.</span>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="ghost" onClick={() => setStep('upload')} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Add more
              </Button>
              <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
              <Button
                onClick={confirm}
                disabled={!kept.length}
                style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}
              >
                Import {kept.length} trade{kept.length === 1 ? '' : 's'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
