import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Brain, SpinnerGap, ArrowsClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useThemePresets } from '@/contexts/theme-presets';
import { useProStatus } from '@/contexts/pro-context';
import { useStreamingAI } from '@/hooks/use-streaming-ai';
import { useSettings } from '@/contexts/settings-context';
import { ProGate } from '@/components/pro-gate';
import { AIFeedback } from '@/components/ui/ai-feedback';
import { renderReviewMarkdown } from '@/components/ai-trade-review';
import { getAICache, setAICache } from '@/utils/ai-cache';
import { trackEvent } from '@/lib/analytics';

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days — refreshable any time
const PERIOD_DAYS = 30;
const MAX_ENTRIES = 15;

interface JournalEntryLike {
  id: string;
  title: string;
  content: string;
  date: Date;
  tags: string[];
  mood: string;
  emotions?: string[];
  accountId?: string;
}

interface TradeLike {
  pnl: number;
  exitTime: Date | string;
}

interface AIJournalReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: JournalEntryLike[];
  trades: TradeLike[];
}

export function AIJournalReview({ open, onOpenChange, entries, trades }: AIJournalReviewProps) {
  const { themeColors, alpha } = useThemePresets();
  const { updateFreeAiQuota } = useProStatus();
  const { getCurrencySymbol } = useSettings();
  const { streamText, isStreaming, startStream, meta } = useStreamingAI();
  const [review, setReview] = useState<string | null>(null);

  // Last PERIOD_DAYS of entries, newest first, capped — the same set the
  // server prompt is built from, so the cache key tracks it exactly
  const windowed = useMemo(() => {
    const cutoff = Date.now() - PERIOD_DAYS * 24 * 60 * 60 * 1000;
    return entries
      .filter((e) => new Date(e.date).getTime() >= cutoff)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_ENTRIES);
  }, [entries]);

  const cacheKey = `ftj-ai-journal-review-${windowed.length}-${windowed[0]?.id || 'none'}`;
  const cached = useMemo(() => getAICache<string>(cacheKey, CACHE_TTL), [cacheKey, review]);
  const displayText = isStreaming ? streamText : review || cached;

  if (meta?.freeUsage) updateFreeAiQuota(meta.freeUsage);

  const fetchReview = async () => {
    trackEvent('ai_journal_review_started', { entryCount: windowed.length });
    try {
      // Day P&L per calendar date so the model can connect words to results
      const cutoff = Date.now() - PERIOD_DAYS * 24 * 60 * 60 * 1000;
      const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayPnl: Record<string, number> = {};
      let wins = 0;
      let count = 0;
      let netPnl = 0;
      for (const t of trades) {
        const when = new Date(t.exitTime).getTime();
        if (Number.isNaN(when) || when < cutoff) continue;
        const day = localDay(new Date(t.exitTime));
        dayPnl[day] = (dayPnl[day] || 0) + (Number(t.pnl) || 0);
        netPnl += Number(t.pnl) || 0;
        if (Number(t.pnl) > 0) wins++;
        count++;
      }

      const result = await startStream('assist', {
        type: 'journal_review',
        payload: {
          currency: getCurrencySymbol(),
          periodDays: PERIOD_DAYS,
          entries: windowed.map((e) => ({
            date: localDay(new Date(e.date)),
            mood: e.mood,
            emotions: e.emotions || [],
            tags: e.tags || [],
            title: e.title,
            text: e.content,
            dayPnl: dayPnl[localDay(new Date(e.date))] ?? null,
          })),
          stats: {
            tradeCount: count,
            winRate: count > 0 ? Math.round((wins / count) * 100) : 0,
            netPnl,
            daysTraded: Object.keys(dayPnl).length,
          },
        },
      });

      setReview(result);
      setAICache(cacheKey, result);
      trackEvent('ai_journal_review_used');
    } catch (err: any) {
      trackEvent('ai_journal_review_error', { message: err?.message });
      toast.error(err?.message || 'Failed to review journal');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" style={{ color: themeColors.primary }} />
            AI Journal Review
          </DialogTitle>
          <DialogDescription>
            Connects what you wrote in your journal to how you actually traded over the last {PERIOD_DAYS} days.
          </DialogDescription>
        </DialogHeader>

        <ProGate featureName="AI Journal Review" featureDescription="AI-powered review connecting your journal entries to your trading results">
          {windowed.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No journal entries in the last {PERIOD_DAYS} days. Write a few entries about your trading days, then come back — the review gets sharper the more you write.
            </div>
          ) : isStreaming && !streamText ? (
            <div className="flex items-center gap-2 py-10 justify-center">
              <SpinnerGap className="h-4 w-4 animate-spin" style={{ color: themeColors.primary }} />
              <span className="text-sm text-muted-foreground">Reading your journal...</span>
            </div>
          ) : displayText ? (
            <>
              <div
                className="text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_h4]:text-foreground"
                dangerouslySetInnerHTML={{ __html: renderReviewMarkdown(displayText) }}
              />
              {!isStreaming && (
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
                  <AIFeedback feature="AI Journal Review" responseId={cacheKey} />
                  <Button variant="ghost" size="sm" onClick={fetchReview} className="gap-1.5 text-xs text-muted-foreground">
                    <ArrowsClockwise className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div
                className="mx-auto h-12 w-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: alpha(themeColors.primary, '12') }}
              >
                <Brain className="h-6 w-6" style={{ color: themeColors.primary }} />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <p className="text-sm font-medium">
                  {windowed.length} {windowed.length === 1 ? 'entry' : 'entries'} from the last {PERIOD_DAYS} days ready to review
                </p>
                <p className="text-xs text-muted-foreground">
                  Your journal text is sent to OpenAI for this analysis only — it is not stored by them or used for training.
                </p>
              </div>
              <Button onClick={fetchReview} style={{ backgroundColor: themeColors.primary, color: themeColors.primaryButtonText }}>
                <Brain className="mr-2 h-4 w-4" />
                Analyze my journal
              </Button>
            </div>
          )}
        </ProGate>
      </DialogContent>
    </Dialog>
  );
}
