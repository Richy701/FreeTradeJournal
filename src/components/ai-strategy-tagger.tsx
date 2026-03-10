import { useState } from 'react';
import { Brain, Loader2, Check, X, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProGate } from '@/components/pro-gate';
import { useThemePresets } from '@/contexts/theme-presets';

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
}

interface TagResult {
  id: string;
  strategy: string;
  confidence: number;
}

interface AIStrategyTaggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trades: Trade[];
  onTagsApplied: (updates: { id: string; strategy: string }[]) => void;
}

const STRATEGY_COLORS: Record<string, string> = {
  breakout: 'hsl(220 70% 50%)',
  pullback: 'hsl(160 60% 45%)',
  reversal: 'hsl(340 75% 55%)',
  momentum: 'hsl(30 80% 55%)',
  range: 'hsl(280 65% 60%)',
  scalp: 'hsl(200 70% 50%)',
  news: 'hsl(0 70% 55%)',
  'trend-follow': 'hsl(120 60% 40%)',
  other: 'hsl(0 0% 50%)',
};

export function AIStrategyTagger({ open, onOpenChange, trades, onTagsApplied }: AIStrategyTaggerProps) {
  const { themeColors, alpha } = useThemePresets();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<TagResult[]>([]);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());

  const untaggedTrades = trades.filter(t => !t.strategy);
  const selectableTrades = results.length > 0 ? trades : untaggedTrades.length > 0 ? untaggedTrades : trades;

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === selectableTrades.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableTrades.map(t => t.id)));
    }
  };

  const handleTag = async () => {
    const selectedTrades = trades.filter(t => selected.has(t.id));
    if (selectedTrades.length === 0) {
      toast.error('Select at least one trade to tag.');
      return;
    }

    setLoading(true);
    let rawResponse: any;
    try {
      const { requestAIAssist } = await import('@/services/ai-assist');
      const response = await requestAIAssist({
        type: 'strategy_tagger',
        payload: {
          trades: selectedTrades.slice(0, 30).map(t => ({
            id: t.id,
            symbol: t.symbol,
            side: t.side,
            entryPrice: t.entryPrice,
            exitPrice: t.exitPrice,
            pnl: t.pnl,
            entryTime: new Date(t.entryTime).toISOString(),
            exitTime: new Date(t.exitTime).toISOString(),
            riskReward: t.riskReward,
          })),
        },
      });

      rawResponse = response.result;

      // Clean the response - remove markdown code blocks if present
      let cleanedResult = response.result.trim();
      if (cleanedResult.startsWith('```')) {
        cleanedResult = cleanedResult.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed: TagResult[] = JSON.parse(cleanedResult);
      setResults(parsed);
      setAccepted(new Set(parsed.map(r => r.id)));
      setRejected(new Set());
      toast.success(`Tagged ${parsed.length} trades`);
    } catch (err: any) {
      console.error('Strategy tagger error:', err);
      console.error('Raw response:', rawResponse);

      if (err instanceof SyntaxError) {
        toast.error('AI returned invalid format. Please try again.');
      } else {
        toast.error(err?.message || 'Failed to tag trades');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    const updates = results
      .filter(r => accepted.has(r.id))
      .map(r => ({ id: r.id, strategy: r.strategy }));

    if (updates.length === 0) {
      toast.error('No tags accepted.');
      return;
    }

    onTagsApplied(updates);
    toast.success(`Applied ${updates.length} strategy tags`);
    onOpenChange(false);
    setResults([]);
    setSelected(new Set());
    setAccepted(new Set());
    setRejected(new Set());
  };

  const toggleAccept = (id: string) => {
    if (accepted.has(id)) {
      setAccepted(prev => { const n = new Set(prev); n.delete(id); return n; });
      setRejected(prev => new Set(prev).add(id));
    } else {
      setRejected(prev => { const n = new Set(prev); n.delete(id); return n; });
      setAccepted(prev => new Set(prev).add(id));
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setResults([]);
      setSelected(new Set());
      setAccepted(new Set());
      setRejected(new Set());
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] max-w-lg max-h-[80vh] flex flex-col">
        <ProGate featureName="AI Strategy Tagger">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" style={{ color: themeColors.primary }} />
              AI Strategy Tagger
            </DialogTitle>
            <DialogDescription>
              Auto-classify your trades by strategy pattern using AI.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {results.length === 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {untaggedTrades.length} untagged trade{untaggedTrades.length !== 1 ? 's' : ''}
                  </p>
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    {selected.size === selectableTrades.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                  {selectableTrades.map(trade => (
                    <label
                      key={trade.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selected.has(trade.id)}
                        onCheckedChange={() => toggleSelect(trade.id)}
                      />
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{trade.symbol}</span>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5"
                            style={{
                              color: trade.side === 'long' ? themeColors.profit : themeColors.loss,
                              borderColor: alpha(trade.side === 'long' ? themeColors.profit : themeColors.loss, '30'),
                            }}
                          >
                            {trade.side.toUpperCase()}
                          </Badge>
                        </div>
                        <span
                          className="text-sm font-medium"
                          style={{ color: trade.pnl >= 0 ? themeColors.profit : themeColors.loss }}
                        >
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Review AI-suggested strategies. Accept or reject each one.
                </p>

                <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                  {results.map(result => {
                    const trade = trades.find(t => t.id === result.id);
                    if (!trade) return null;
                    const isAccepted = accepted.has(result.id);
                    const color = STRATEGY_COLORS[result.strategy] || STRATEGY_COLORS.other;

                    return (
                      <div
                        key={result.id}
                        className="flex items-center gap-3 p-2.5 rounded-md border"
                        style={{
                          borderColor: isAccepted ? `${color}40` : 'hsl(var(--border))',
                          backgroundColor: isAccepted ? `${color}08` : undefined,
                          opacity: !isAccepted ? 0.5 : 1,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{trade.symbol}</span>
                            <Badge
                              className="text-[10px] px-1.5 font-semibold"
                              style={{
                                backgroundColor: `${color}20`,
                                color,
                                borderColor: `${color}40`,
                              }}
                              variant="outline"
                            >
                              {result.strategy}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {Math.round(result.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleAccept(result.id)}
                        >
                          {isAccepted ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-400" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-3 border-t">
            {results.length === 0 ? (
              <Button
                onClick={handleTag}
                disabled={loading || selected.size === 0}
                className="flex-1"
                style={{ backgroundColor: themeColors.primary }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Classifying...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Tag {selected.size} Trade{selected.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setResults([]); setSelected(new Set()); }} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleApply}
                  className="flex-1"
                  style={{ backgroundColor: themeColors.primary }}
                  disabled={accepted.size === 0}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Apply {accepted.size} Tag{accepted.size !== 1 ? 's' : ''}
                </Button>
              </>
            )}
          </div>
        </ProGate>
      </DialogContent>
    </Dialog>
  );
}
