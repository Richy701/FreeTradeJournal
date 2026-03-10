import { useState, useEffect } from 'react';
import { Brain, Loader2, PenLine, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useThemePresets } from '@/contexts/theme-presets';
import { useProStatus } from '@/contexts/pro-context';
import { getAICache, setAICache } from '@/utils/ai-cache';

interface Trade {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  strategy?: string;
  riskReward?: number;
  entryTime: Date;
  exitTime: Date;
}

interface AIJournalPromptsProps {
  trade: Trade | null;
  onClose: () => void;
}

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export function AIJournalPrompts({ trade, onClose }: AIJournalPromptsProps) {
  const { themeColors, alpha } = useThemePresets();
  const { isPro } = useProStatus();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trade || !isPro) return;

    const cacheKey = `ftj-ai-prompts-${trade.id}`;
    const cached = getAICache<string>(cacheKey, CACHE_TTL);
    if (cached) {
      setPrompts(cached);
    } else {
      fetchPrompts();
    }
  }, [trade?.id, isPro]);

  const fetchPrompts = async () => {
    if (!trade) return;
    setLoading(true);
    setError(null);
    try {
      const holdMins = (new Date(trade.exitTime).getTime() - new Date(trade.entryTime).getTime()) / 60000;
      const { requestAIAssist } = await import('@/services/ai-assist');
      const response = await requestAIAssist({
        type: 'journal_prompts',
        payload: {
          symbol: trade.symbol,
          side: trade.side,
          pnl: trade.pnl,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          strategy: trade.strategy,
          riskReward: trade.riskReward,
          holdTimeMinutes: holdMins,
        },
      });

      setPrompts(response.result);
      setAICache(`ftj-ai-prompts-${trade.id}`, response.result);
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to generate prompts';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!trade) return null;

  const outcome = trade.pnl > 0 ? 'profit' : trade.pnl < 0 ? 'loss' : 'breakeven';

  return (
    <Dialog open={!!trade} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[90vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" style={{ color: themeColors.primary }} />
            Journal This Trade
          </DialogTitle>
        </DialogHeader>

        <div
          className="rounded-lg p-3 flex items-center justify-between"
          style={{ backgroundColor: alpha(themeColors.primary, '0a') }}
        >
          <div>
            <span className="font-bold">{trade.symbol}</span>
            <span className="text-muted-foreground text-sm ml-2">{trade.side.toUpperCase()}</span>
          </div>
          <span
            className="font-bold"
            style={{ color: outcome === 'profit' ? themeColors.profit : outcome === 'loss' ? themeColors.loss : themeColors.primary }}
          >
            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
          </span>
        </div>

        {!isPro ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-sm text-muted-foreground">AI journal prompts are a Pro feature.</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
              Upgrade to Pro
            </Button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: themeColors.primary }} />
            <p className="text-sm text-muted-foreground">Generating prompts...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <p className="text-sm text-muted-foreground text-center">{error}</p>
            <Button
              size="sm"
              onClick={fetchPrompts}
              style={{ backgroundColor: themeColors.primary }}
            >
              Retry
            </Button>
          </div>
        ) : prompts ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Reflect on this trade
            </p>
            <div className="space-y-3">
              {prompts.split(/\d+\.\s+/).filter(Boolean).map((q, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 bg-card border border-border"
                >
                  <p className="text-sm leading-relaxed">{q.trim()}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            <X className="mr-2 h-4 w-4" />
            Skip
          </Button>
          <Button
            onClick={() => { navigate('/journal'); onClose(); }}
            className="flex-1"
            style={{ backgroundColor: themeColors.primary }}
          >
            <PenLine className="mr-2 h-4 w-4" />
            Write Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
