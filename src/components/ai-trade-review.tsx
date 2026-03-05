import { useState, useEffect } from 'react';
import { Brain, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useThemePresets } from '@/contexts/theme-presets';
import { useProStatus } from '@/contexts/pro-context';
import { getAICache, setAICache } from '@/utils/ai-cache';

interface Trade {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  entryTime: Date;
  exitTime: Date;
  pnl: number;
  strategy?: string;
  riskReward?: number;
  notes?: string;
}

interface AITradeReviewProps {
  trade: Trade;
  surroundingTrades?: Trade[];
  onClose: () => void;
}

const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function renderReviewMarkdown(md: string): string {
  return md
    .replace(/## (.*)/g, '<h4 class="text-sm font-semibold mt-4 mb-1.5 text-foreground">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-3 list-disc text-sm leading-relaxed">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-3 list-decimal text-sm leading-relaxed">$2</li>')
    .replace(/\n\n/g, '<br/>')
    .replace(/\n/g, ' ');
}

export function AITradeReview({ trade, surroundingTrades, onClose }: AITradeReviewProps) {
  const { themeColors, alpha } = useThemePresets();
  const { isPro } = useProStatus();
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<string | null>(null);

  const cacheKey = `ftj-ai-review-${trade.id}`;

  useEffect(() => {
    const cached = getAICache<string>(cacheKey, CACHE_TTL);
    if (cached) {
      setReview(cached);
    } else if (isPro) {
      fetchReview();
    }
  }, [trade.id]);

  const fetchReview = async () => {
    setLoading(true);
    try {
      const { requestAIAssist } = await import('@/services/ai-assist');
      const response = await requestAIAssist({
        type: 'trade_review',
        payload: {
          symbol: trade.symbol,
          side: trade.side,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          lotSize: trade.lotSize,
          pnl: trade.pnl,
          entryTime: new Date(trade.entryTime).toISOString(),
          exitTime: new Date(trade.exitTime).toISOString(),
          strategy: trade.strategy,
          riskReward: trade.riskReward,
          notes: trade.notes,
          recentTrades: (surroundingTrades || []).slice(0, 5).map(t => ({
            symbol: t.symbol,
            side: t.side,
            pnl: t.pnl,
            entryTime: new Date(t.entryTime).toISOString(),
          })),
        },
      });

      setReview(response.result);
      setAICache(cacheKey, response.result);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to review trade');
    } finally {
      setLoading(false);
    }
  };

  if (!isPro) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        AI Trade Review is a Pro feature.{' '}
        <a href="/pricing" className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">Upgrade</a>
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-b-lg border-t-0 border"
      style={{
        backgroundColor: alpha(themeColors.primary, '06'),
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4" style={{ color: themeColors.primary }} />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            AI Review
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: themeColors.primary }} />
          <span className="text-sm text-muted-foreground">Reviewing trade...</span>
        </div>
      ) : review ? (
        <div
          className="text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_h4]:text-foreground"
          dangerouslySetInnerHTML={{ __html: renderReviewMarkdown(review) }}
        />
      ) : (
        <div className="text-center py-4">
          <Button size="sm" onClick={fetchReview} style={{ backgroundColor: themeColors.primary }}>
            <Brain className="mr-2 h-3.5 w-3.5" />
            Review This Trade
          </Button>
        </div>
      )}
    </div>
  );
}
