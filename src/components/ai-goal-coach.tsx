import { useState, useEffect, useMemo } from 'react';
import { Brain, Loader2, RotateCcw, Target, Trophy, TrendingUp, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProGate } from '@/components/pro-gate';
import { useThemePresets } from '@/contexts/theme-presets';
import { useUserStorage } from '@/utils/user-storage';
import { useDemoData } from '@/hooks/use-demo-data';
import { getAICache, setAICache, clearAICache } from '@/utils/ai-cache';

const CACHE_KEY = 'ftj-ai-goal-coach';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

interface ParsedSection {
  title: string;
  content: string;
}

function parseSections(md: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const parts = md.split(/^## /m).filter(Boolean);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    if (nl === -1) continue;
    const title = part.substring(0, nl).trim();
    const content = part.substring(nl + 1).trim();
    if (title && content) sections.push({ title, content });
  }
  return sections;
}

function renderContent(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-3 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-3 list-decimal">$2</li>')
    .replace(/\n\n/g, '<br/>')
    .replace(/\n/g, ' ');
}

const sectionIcons: Record<string, typeof Brain> = {
  progress: TrendingUp,
  overview: TrendingUp,
  goal: Target,
  insight: Target,
  adjust: Lightbulb,
  recommend: Lightbulb,
  motiv: Trophy,
  encour: Trophy,
};

function getIcon(title: string) {
  const lower = title.toLowerCase();
  for (const [key, Icon] of Object.entries(sectionIcons)) {
    if (lower.includes(key)) return Icon;
  }
  return Brain;
}

const sectionColors = [
  'hsl(var(--chart-1, 220 70% 50%))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-5, 340 75% 55%))',
];

export function AIGoalCoach() {
  const { themeColors, alpha } = useThemePresets();
  const userStorage = useUserStorage();
  const { getTrades } = useDemoData();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const cached = getAICache<string>(CACHE_KEY, CACHE_TTL);
    if (cached) setResult(cached);
  }, []);

  const goalData = useMemo(() => {
    const trades = getTrades();
    const goalsRaw = userStorage.getItem('tradingGoals');
    const rulesRaw = userStorage.getItem('riskRules');
    let goals: any[] = [];
    let rules: any[] = [];
    try { goals = goalsRaw ? JSON.parse(goalsRaw) : []; } catch { /* corrupted */ }
    try { rules = rulesRaw ? JSON.parse(rulesRaw) : []; } catch { /* corrupted */ }

    // Compute basic stats
    const wins = trades.filter((t: any) => t.pnl > 0).length;
    const totalPnl = trades.reduce((s: number, t: any) => s + (t.pnl || 0), 0);
    const avgRR = trades.filter((t: any) => t.riskReward).length > 0
      ? trades.filter((t: any) => t.riskReward).reduce((s: number, t: any) => s + t.riskReward, 0) / trades.filter((t: any) => t.riskReward).length
      : 0;
    const grossWins = trades.filter((t: any) => t.pnl > 0).reduce((s: number, t: any) => s + t.pnl, 0);
    const grossLosses = Math.abs(trades.filter((t: any) => t.pnl < 0).reduce((s: number, t: any) => s + t.pnl, 0));
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0;

    const entryTimes = trades.map((t: any) => new Date(t.entryTime).getTime()).filter((n: number) => !isNaN(n));
    const firstTradeDate = entryTimes.length > 0 ? new Date(Math.min(...entryTimes)) : new Date();
    const daysSinceStart = Math.max(1, Math.round((Date.now() - firstTradeDate.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      goals: goals.map((g: any) => ({
        type: g.type,
        period: g.period,
        target: g.target,
        current: g.current,
        achieved: g.achieved,
        percentComplete: g.target > 0 ? ((g.current || 0) / g.target) * 100 : 0,
      })),
      riskRules: rules.map((r: any) => ({
        type: r.type,
        value: r.value,
        violations: r.violations || 0,
      })),
      stats: {
        winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
        avgRR,
        profitFactor: profitFactor === Infinity ? 999 : profitFactor,
        totalPnL: totalPnl,
      },
      tradeCount: trades.length,
      daysSinceStart,
    };
  }, [getTrades, userStorage]);

  const handleCoach = async () => {
    setLoading(true);
    try {
      const { requestAIAssist } = await import('@/services/ai-assist');
      const response = await requestAIAssist({
        type: 'goal_coach',
        payload: goalData,
      });

      setResult(response.result);
      setAICache(CACHE_KEY, response.result);
      toast.success('Coaching ready');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to get coaching');
    } finally {
      setLoading(false);
    }
  };

  const sections = result ? parseSections(result) : [];

  return (
    <Card>
      <ProGate featureName="AI Goal Coach">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ backgroundColor: alpha(themeColors.primary, '1f') }}
              >
                <Brain className="h-4.5 w-4.5" style={{ color: themeColors.primary }} />
              </div>
              AI Goal Coach
            </CardTitle>
            {result && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setResult(null); clearAICache(CACHE_KEY); }}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!result && !loading ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Get personalised coaching on your trading goals — what's working, what to adjust, and how to stay on track.
              </p>
              <Button
                onClick={handleCoach}
                disabled={goalData.goals.length === 0 && goalData.tradeCount === 0}
                style={{ backgroundColor: themeColors.primary }}
              >
                <Brain className="mr-2 h-4 w-4" />
                Get Coaching
              </Button>
              {goalData.goals.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Set some goals above first for the best coaching results.
                </p>
              )}
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: themeColors.primary }} />
              <p className="text-sm text-muted-foreground">Analysing your goals...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, i) => {
                const Icon = getIcon(section.title);
                const color = sectionColors[i % sectionColors.length];
                return (
                  <div
                    key={i}
                    className="rounded-lg p-4 bg-card border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                      <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                    </div>
                    <div
                      className="text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_li]:py-0.5"
                      dangerouslySetInnerHTML={{ __html: renderContent(section.content) }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </ProGate>
    </Card>
  );
}
