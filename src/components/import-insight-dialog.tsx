import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Brain } from '@phosphor-icons/react';
import { useThemePresets } from '@/contexts/theme-presets';
import { useProStatus } from '@/contexts/pro-context';
import { useStreamingAI } from '@/hooks/use-streaming-ai';
import { useSettings } from '@/contexts/settings-context';
import { renderReviewMarkdown } from '@/components/ai-trade-review';
import { computeTradeAggregates } from '@/utils/trade-aggregates';
import { AIFeedback } from '@/components/ui/ai-feedback';
import { trackEvent } from '@/lib/analytics';

interface ImportedTradeLike {
  symbol?: string;
  pnl: number | string;
  exitTime?: Date | string;
  entryTime?: Date | string;
  side?: string;
  strategy?: string;
  riskReward?: number | string;
}

interface ImportInsightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The trades that were just imported (not the whole account). */
  trades: ImportedTradeLike[];
}

// The "aha" moment: streams an AI first-read of freshly imported history the
// moment the import lands. Auto-runs on open — the whole point is zero
// friction right when a new user is deciding whether the product is magic.
export function ImportInsightDialog({ open, onOpenChange, trades }: ImportInsightDialogProps) {
  const { themeColors, alpha } = useThemePresets();
  const { updateFreeAiQuota } = useProStatus();
  const { getCurrencySymbol } = useSettings();
  const { streamText, isStreaming, startStream, meta } = useStreamingAI();
  const [result, setResult] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (meta?.freeUsage) updateFreeAiQuota(meta.freeUsage);
  }, [meta, updateFreeAiQuota]);

  // Reset the run latch when the dialog closes so a SECOND qualifying import
  // in the same session gets its own fresh analysis instead of silently
  // re-showing the previous import's result.
  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      setResult(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || startedRef.current || trades.length === 0) return;
    startedRef.current = true;
    trackEvent('ai_import_insight_started', { count: trades.length });

    const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const when = (t: ImportedTradeLike) => {
      const raw = t.exitTime || t.entryTime;
      const ts = raw ? new Date(raw).getTime() : NaN;
      return Number.isNaN(ts) ? null : ts;
    };

    let wins = 0, netPnl = 0, sumWin = 0, sumLoss = 0, lossCount = 0;
    let first: number | null = null, last: number | null = null;
    const byDay = new Map<string, number>();

    for (const t of trades) {
      const pnl = num(t.pnl);
      netPnl += pnl;
      if (pnl > 0) { wins++; sumWin += pnl; }
      else if (pnl < 0) { lossCount++; sumLoss += pnl; }

      const ts = when(t);
      if (ts !== null) {
        if (first === null || ts < first) first = ts;
        if (last === null || ts > last) last = ts;
        // Local day, matching the app's day-bucketing standard
        const d = new Date(ts);
        const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        byDay.set(day, (byDay.get(day) || 0) + pnl);
      }
    }

    // Same sample-ranked, significance-flagged buckets the coach features use
    // (shared util) — replaces the ad-hoc count/winRate/netPnl grouping that
    // let a 3-trade symbol read like an edge in the first-impression insight.
    const agg = computeTradeAggregates(trades.map((t) => ({
      pnl: num(t.pnl),
      riskReward: num(t.riskReward),
      symbol: t.symbol,
      strategy: t.strategy,
      side: t.side,
      entryTime: t.entryTime ? new Date(t.entryTime) : null,
      exitTime: t.exitTime ? new Date(t.exitTime) : null,
      emotions: null,
    })));

    const dayPnls = Array.from(byDay.values());

    startStream('assist', {
      type: 'import_insight',
      payload: {
        currency: getCurrencySymbol(),
        stats: {
          tradeCount: trades.length,
          firstDate: first ? new Date(first).toISOString() : null,
          lastDate: last ? new Date(last).toISOString() : null,
          winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
          netPnl,
          avgWin: wins > 0 ? sumWin / wins : 0,
          avgLoss: lossCount > 0 ? Math.abs(sumLoss / lossCount) : 0,
          bestDay: dayPnls.length ? Math.max(...dayPnls) : 0,
          worstDay: dayPnls.length ? Math.min(...dayPnls) : 0,
          payoffRatio: agg.payoffRatio,
        },
        hasEnoughData: agg.hasEnoughData,
        significanceThreshold: agg.significanceThreshold,
        perSymbol: agg.perSymbol,
        perWeekday: agg.perWeekday,
        perSession: agg.perSession,
        perSide: agg.perSide,
      },
    })
      .then((text) => {
        setResult(text);
        trackEvent('ai_import_insight_used');
      })
      .catch((err: any) => {
        trackEvent('ai_import_insight_error', { message: err?.message });
        // Fail quietly — the import itself succeeded; this dialog is a bonus
        onOpenChange(false);
      });
  }, [open, trades, startStream, onOpenChange]);

  const displayText = isStreaming ? streamText : result;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" style={{ color: themeColors.primary }} />
            First read of your history
          </DialogTitle>
          <DialogDescription>
            {trades.length} imported trades, analyzed while they load in.
          </DialogDescription>
        </DialogHeader>

        {displayText ? (
          <>
            <div
              className="text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_h4]:text-foreground"
              dangerouslySetInnerHTML={{ __html: renderReviewMarkdown(displayText) }}
            />
            {!isStreaming && result && (
              <div className="pt-3 border-t border-border/50">
                <AIFeedback feature="Import First Read" />
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 py-10 justify-center">
            <div
              className="flex items-center gap-1 px-3 py-2.5 rounded-2xl"
              style={{ backgroundColor: alpha(themeColors.primary, '08') }}
              aria-label="Analyzing your history"
            >
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full animate-bounce"
                  style={{ backgroundColor: themeColors.primary, animationDelay: `${i * 160}ms`, animationDuration: '900ms' }}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Reading your trades...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
