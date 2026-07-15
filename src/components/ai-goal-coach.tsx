import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Brain, SpinnerGap, ArrowCounterClockwise, Target, Trophy, TrendUp, Lightbulb } from '@phosphor-icons/react';
import { toast } from 'sonner'
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AIFeedback } from '@/components/ui/ai-feedback';
import { ProGate } from '@/components/pro-gate';
import { useThemePresets } from '@/contexts/theme-presets';
import { useSettings } from '@/contexts/settings-context';
import { useProStatus } from '@/contexts/pro-context';
import { useStreamingAI } from '@/hooks/use-streaming-ai';
import { useUserStorage } from '@/utils/user-storage';
import { useDemoData } from '@/hooks/use-demo-data';
import { onSyncChange } from '@/contexts/sync-context';
import { computeGoalProgress } from '@/lib/goal-progress';
import { getAICache, setAICache, clearAICache } from '@/utils/ai-cache';
import DOMPurify from 'dompurify';

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
  const html = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-3 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-3 list-decimal">$2</li>')
    .replace(/\n\n/g, '<br/>')
    .replace(/\n/g, ' ');

  // Sanitize HTML to prevent XSS attacks from AI-generated content
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'li', 'br'],
    ALLOWED_ATTR: ['class']
  });
}

const sectionIcons: Record<string, typeof Brain> = {
  progress: TrendUp,
  overview: TrendUp,
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

const GOAL_COACH_SAMPLE_SECTIONS = [
  {
    title: 'Progress Summary',
    content: 'You\'re **68% of the way** to your monthly profit goal of $1,000. With 9 trading days left, you need **$47/day** to hit target — well within your recent average of $62/day on winning sessions.',
  },
  {
    title: 'What\'s Working',
    content: '- Your **win streak discipline** is solid — you\'ve stuck to your max 5 trades/day rule for 14 straight days\n- **GBPUSD longs** are consistently outperforming your other setups this month (+$420 combined)\n- Risk per trade has stayed below 1.5% — exactly where it should be',
  },
  {
    title: 'Recommendations',
    content: '- Your drawdown goal (max 5%) is at risk on Thursdays — consider sitting out or reducing size by 50% on that day until you identify the cause\n- You\'ve missed your journaling goal 4 times this week — traders who journal daily improve 23% faster on average\n- Consider raising your daily profit target slightly — you\'re consistently hitting it early and then over-trading',
  },
  {
    title: 'This Week\'s Focus',
    content: '1. **Journal every trade** — even just one sentence on why you took it\n2. **Thursday rule**: max 2 trades, reduce size to 0.5%\n3. Don\'t chase the monthly goal — let your edge play out and the number will follow',
  },
];

function GoalCoachSamplePreview() {
  const { themeColors, alpha } = useThemePresets();
  const { getCurrencySymbol } = useSettings();
  const sym = getCurrencySymbol();
  return (
    <div>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: alpha(themeColors.primary, '15') }}>
            <Brain className="h-4.5 w-4.5" style={{ color: themeColors.primary }} />
          </div>
          AI Goal Coach
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: themeColors.primary, borderColor: alpha(themeColors.primary, '30'), backgroundColor: alpha(themeColors.primary, '10'), borderWidth: 1 }}>
            Sample
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {GOAL_COACH_SAMPLE_SECTIONS.map((section, i) => {
            const Icon = getIcon(section.title);
            const color = sectionColors[i % sectionColors.length];
            return (
              <div key={i} className="rounded-lg p-4 bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                  <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_li]:py-0.5"
                  dangerouslySetInnerHTML={{ __html: renderContent(section.content.replace(/\$/g, sym)) }}
                />
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground pt-2 text-right">
            Sample output — your coaching will be based on your real goals & trades
          </p>
        </div>
      </CardContent>
    </div>
  );
}

export function AIGoalCoach() {
  const { themeColors, alpha } = useThemePresets();
  const { getCurrencySymbol } = useSettings();
  const { hasAIAccess, updateFreeAiQuota } = useProStatus();
  const { streamText, isStreaming, startStream, meta, abort } = useStreamingAI();
  const userStorage = useUserStorage();
  const { getTrades } = useDemoData();
  const [result, setResult] = useState<string | null>(null);
  // Guards a slow first request from overwriting a newer one (double-click),
  // and lets unmount abort an in-flight stream.
  const callSeq = useRef(0);

  useEffect(() => () => abort(), [abort]);

  // Refresh the data snapshot when goals/trades change elsewhere (sync pull,
  // other tabs, Trade Log writes) so coaching isn't built on a mount-time read.
  const [dataVersion, setDataVersion] = useState(0);
  useEffect(() => {
    const bump = () => setDataVersion(v => v + 1);
    window.addEventListener('storage', bump);
    window.addEventListener('tradesUpdated', bump);
    const offSync = onSyncChange(bump);
    return () => {
      window.removeEventListener('storage', bump);
      window.removeEventListener('tradesUpdated', bump);
      offSync?.();
    };
  }, []);

  useEffect(() => {
    if (meta?.freeUsage) updateFreeAiQuota(meta.freeUsage);
  }, [meta, updateFreeAiQuota]);

  // Fresh read every call — goals edited moments ago in the component above
  // must reach the model, so nothing here is cached beyond the render.
  const buildGoalData = useCallback(() => {
    const trades = getTrades();
    const goalsRaw = userStorage.getItem('tradingGoals');
    const rulesRaw = userStorage.getItem('riskRules');
    let goals: any[] = [];
    let rules: any[] = [];
    try { goals = goalsRaw ? JSON.parse(goalsRaw) : []; } catch { /* corrupted */ }
    try { rules = rulesRaw ? JSON.parse(rulesRaw) : []; } catch { /* corrupted */ }

    // `current` is never persisted on stored goals — derive real progress the
    // same way the Goals UI does, or the model is told every goal is at 0%.
    const progress = computeGoalProgress(goals as any[], trades as any[]);

    // Compute basic stats
    let wins = 0, totalPnl = 0, grossWins = 0, grossLosses = 0, rrSum = 0, rrCount = 0;
    const entryTimes: number[] = [];
    for (const t of trades as any[]) {
      const pnl = t.pnl || 0;
      totalPnl += pnl;
      if (pnl > 0) { wins++; grossWins += pnl; }
      else if (pnl < 0) { grossLosses += Math.abs(pnl); }
      if (t.riskReward) { rrSum += t.riskReward; rrCount++; }
      const time = new Date(t.entryTime).getTime();
      if (!isNaN(time)) entryTimes.push(time);
    }
    const avgRR = rrCount > 0 ? rrSum / rrCount : 0;
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0;
    const firstTradeDate = entryTimes.length > 0 ? new Date(Math.min(...entryTimes)) : new Date();
    const daysSinceStart = Math.max(1, Math.round((Date.now() - firstTradeDate.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      currency: getCurrencySymbol(),
      goals: progress.map(g => ({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTrades, userStorage, getCurrencySymbol, dataVersion]);

  const goalData = useMemo(() => buildGoalData(), [buildGoalData]);

  // Cache is only valid for the goals/trades it was generated from.
  const cacheFingerprint = (d: ReturnType<typeof buildGoalData>) =>
    `${d.goals.map(g => `${g.type}:${g.period}:${g.target}`).join('|')}#${d.tradeCount}`;

  useEffect(() => {
    const cached = getAICache<{ fp: string; text: string }>(CACHE_KEY, CACHE_TTL);
    if (cached && typeof cached === 'object' && cached.fp === cacheFingerprint(goalData)) {
      setResult(cached.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCoach = async () => {
    trackEvent('ai_goal_coach_started');
    const seq = ++callSeq.current;
    try {
      const data = buildGoalData();
      const coachResult = await startStream('assist', {
        type: 'goal_coach',
        payload: data,
      });

      // A newer call (or an abort) superseded this one — don't cache its
      // possibly-truncated output.
      if (seq !== callSeq.current || !coachResult) return;

      setResult(coachResult);
      setAICache(CACHE_KEY, { fp: cacheFingerprint(data), text: coachResult });
      trackEvent('ai_goal_coach_used');
    } catch (err: any) {
      trackEvent('ai_goal_coach_error', { message: err?.message });
      toast.error(err?.message || 'Failed to get coaching');
    }
  };

  const displayText = isStreaming ? streamText : result;
  const sections = displayText ? parseSections(displayText) : [];

  if (!hasAIAccess) {
    return (
      <Card>
        <ProGate featureName="AI Goal Coach">
          <GoalCoachSamplePreview />
        </ProGate>
      </Card>
    );
  }

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
              {isStreaming && (
                <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              )}
            </CardTitle>
            {result && !isStreaming && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setResult(null); clearAICache(CACHE_KEY); }}
              >
                <ArrowCounterClockwise className="mr-1.5 h-3.5 w-3.5" />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!result && !isStreaming && !streamText ? (
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
          ) : isStreaming && !streamText ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <SpinnerGap className="h-5 w-5 animate-spin" style={{ color: themeColors.primary }} />
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
              {!isStreaming && result && (
                <div className="pt-3 border-t border-border/50">
                  <AIFeedback feature="AI Goal Coach" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </ProGate>
    </Card>
  );
}
