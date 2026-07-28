import { useEffect, useState } from 'react';
import { Brain, SpinnerGap, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AIFeedback } from '@/components/ui/ai-feedback';
import { useThemePresets } from '@/contexts/theme-presets';
import { useProStatus } from '@/contexts/pro-context';
import { trackEvent } from '@/lib/analytics';

export interface OnSaveCoachData {
  content: string;
  mood: string;
  emotions: string[];
  entryType: string;
  currency: string;
  dayStats: { tradeCount: number; dayPnl: number };
  trade?: { symbol: string; side: string; pnl: number };
}

interface AIJournalOnSaveProps {
  data: OnSaveCoachData | null;
  onClose: () => void;
  onDisable: () => void;
}

// Fires automatically after a journal entry is saved: the coach reads the
// entry and reacts with one observation and one question. The entry is
// already safely persisted before this mounts, so every failure path here is
// silent — a coach hiccup must never read as a save problem.
export function AIJournalOnSave({ data, onClose, onDisable }: AIJournalOnSaveProps) {
  const { themeColors, alpha } = useThemePresets();
  const { updateFreeAiQuota } = useProStatus();
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!data) {
      setResponse(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      trackEvent('ai_journal_onsave_started');
      try {
        const { requestAIAssist } = await import('@/services/ai-assist');
        const res = await requestAIAssist({
          type: 'journal_assist',
          payload: {
            mode: 'onSave',
            currency: data.currency,
            draft: data.content.slice(0, 1200),
            mood: data.mood,
            emotions: data.emotions,
            entryType: data.entryType,
            dayStats: data.dayStats,
            trade: data.trade,
          },
        });
        if (cancelled) return;
        if (res.freeUsage) updateFreeAiQuota(res.freeUsage);
        setResponse(res.result);
        trackEvent('ai_journal_onsave_shown');
      } catch (err: unknown) {
        trackEvent('ai_journal_onsave_error', { message: err instanceof Error ? err.message : String(err) });
        if (!cancelled) onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (!data) return null;

  const dismiss = () => {
    trackEvent('ai_journal_onsave_dismissed', { hadResponse: !!response });
    onClose();
  };

  return (
    <Dialog open={!!data} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="w-[90vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" style={{ color: themeColors.primary }} />
            Coach's read on your entry
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <SpinnerGap className="h-5 w-5 animate-spin" style={{ color: themeColors.primary }} />
            <p className="text-sm text-muted-foreground">Reading your entry...</p>
          </div>
        ) : response ? (
          <div className="space-y-4">
            <div
              className="rounded-lg p-4 border border-border"
              style={{ backgroundColor: alpha(themeColors.primary, '05') }}
            >
              {response.split(/\n{2,}/).filter(Boolean).map((para, i) => (
                <p key={i} className={`text-sm leading-relaxed ${i > 0 ? 'mt-3' : ''}`}>
                  {para.trim()}
                </p>
              ))}
            </div>
            <AIFeedback feature="Journal On-Save Coach" className="pt-1" />
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => {
              trackEvent('ai_journal_onsave_disabled');
              onDisable();
            }}
          >
            Don't show this again
          </Button>
          <Button variant="outline" size="sm" onClick={dismiss}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
