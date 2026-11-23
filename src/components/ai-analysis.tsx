import { useState, useEffect } from 'react';
import { Brain, ArrowCounterClockwise, TrendUp, MagnifyingGlass, Trophy, Warning, Target } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProGate } from '@/components/pro-gate';
import { AIFeedback } from '@/components/ai-feedback';
import { AnalysisUpgradeOffer } from '@/components/analysis-upgrade-offer';
import { useThemePresets } from '@/contexts/theme-presets';
import { useSettings } from '@/contexts/settings-context';
import { useProStatus } from '@/contexts/pro-context';
import { useAuth } from '@/contexts/auth-context';
import { useAccounts } from '@/contexts/account-context';
import { useStreamingAI } from '@/hooks/use-streaming-ai';
import { getDemoAIResponse, DEMO_AI_TRADE_COUNT, DEMO_AI_USAGE } from '@/lib/demo-ai';
import { trackEvent } from '@/lib/analytics';
import type { AIAnalysisResponse } from '@/services/ai-analysis';
import DOMPurify from 'dompurify';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ReferenceLine } from 'recharts';

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
  emotions?: string;
}

interface AIAnalysisProps {
  embedded?: boolean;
  reportDesign?: boolean;
  hideReportHeading?: boolean;
  setupLayout?: 'split' | 'stacked';
  trades: Trade[];
}

type Period = 'recent' | 'last30' | 'all';

const CACHE_KEY = 'ftj-ai-analysis-cache';

// Cap what a single analysis ships to the backend — "All trades" on a large
// log would otherwise send thousands of rows in one request body.
const MAX_ANALYSIS_TRADES = 200;

// Scope the cache per user (matching UserStorage's `user_<uid>_` scheme) AND
// per trading account, so one account's private analysis can never surface for
// another user or after an account switch. clearUserData() still wipes it
// (prefix match on `user_<uid>_`).
function scopedCacheKey(uid: string | null, accountId?: string | null): string {
  const base = uid ? `user_${uid}_${CACHE_KEY}` : `guest_${CACHE_KEY}`;
  return accountId ? `${base}_${accountId}` : base;
}

interface CachedAnalysis {
  analysis: string;
  usage: AIAnalysisResponse['usage'];
  timestamp: number;
  period: Period;
  tradeCount: number;
}

function getCachedAnalysis(uid: string | null, accountId?: string | null): CachedAnalysis | null {
  try {
    const raw = localStorage.getItem(scopedCacheKey(uid, accountId));
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedAnalysis;
    if (Date.now() - cached.timestamp > 24 * 60 * 60 * 1000) return null;
    return cached;
  } catch {
    return null;
  }
}

function setCachedAnalysis(uid: string | null, accountId: string | null | undefined, data: CachedAnalysis) {
  localStorage.setItem(scopedCacheKey(uid, accountId), JSON.stringify(data));
}

function filterTrades(trades: Trade[], period: Period): Trade[] {
  const now = new Date();
  switch (period) {
    case 'recent': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return trades.filter(t => new Date(t.exitTime) >= d);
    }
    case 'last30': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return trades.filter(t => new Date(t.exitTime) >= d);
    }
    case 'all':
      return trades;
  }
}

interface ParsedSection {
  title: string;
  content: string;
}

function parseAnalysis(md: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const parts = md.split(/^## /m).filter(Boolean);

  for (const part of parts) {
    const newlineIdx = part.indexOf('\n');
    if (newlineIdx === -1) continue;
    const title = part.substring(0, newlineIdx).trim();
    const content = part.substring(newlineIdx + 1).trim();
    if (title && content) {
      sections.push({ title, content });
    }
  }

  return sections;
}

// Replace the em/en dashes the model favours with plain punctuation.
function cleanDashes(s: string): string {
  return s.replace(/ +[—–] +/g, ', ').replace(/[—–]/g, '-');
}

function renderSectionContent(content: string): string {
  const inline = (s: string) =>
    s
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-xs font-mono">$1</code>');

  const out: string[] = [];
  let listBuf: string[] = [];
  let counter = 0; // number ordered items sequentially so they never restart at 1

  const flushList = () => {
    if (listBuf.length) {
      out.push(`<ul class="space-y-1.5 my-2">${listBuf.join('')}</ul>`);
      listBuf = [];
    }
  };

  for (const raw of cleanDashes(content).split('\n')) {
    const line = raw.trim();
    if (!line) { flushList(); continue; }
    const bullet = line.match(/^- (.+)$/);
    const numbered = line.match(/^\d+\. (.+)$/);
    if (bullet) {
      listBuf.push(`<li>${inline(bullet[1])}</li>`);
    } else if (numbered) {
      flushList();
      counter += 1;
      out.push(`<p class="mt-2">${counter}. ${inline(numbered[1])}</p>`);
    } else {
      flushList();
      out.push(`<p class="mt-2">${inline(line)}</p>`);
    }
  }
  flushList();

  // Sanitize HTML to prevent XSS attacks from AI-generated content
  return DOMPurify.sanitize(out.join(''), {
    ALLOWED_TAGS: ['strong', 'code', 'li', 'ul', 'p'],
    ALLOWED_ATTR: ['class']
  });
}

const sectionConfig: Record<string, { icon: typeof Brain; color: string }> = {
  'Performance Snapshot': { icon: TrendUp, color: 'hsl(var(--chart-1, 220 70% 50%))' },
  'Key Patterns Detected': { icon: MagnifyingGlass, color: 'hsl(var(--chart-2, 160 60% 45%))' },
  'Strengths to Double Down On': { icon: Trophy, color: 'hsl(var(--chart-3, 30 80% 55%))' },
  'Critical Improvements': { icon: Warning, color: 'hsl(var(--chart-4, 280 65% 60%))' },
  'Action Plan': { icon: Target, color: 'hsl(var(--chart-5, 340 75% 55%))' },
};

function getSectionConfig(title: string) {
  for (const [key, config] of Object.entries(sectionConfig)) {
    if (title.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(title.toLowerCase())) {
      return config;
    }
  }
  // Fuzzy match on keywords
  const lower = title.toLowerCase();
  if (lower.includes('pattern') || lower.includes('detect')) return sectionConfig['Key Patterns Detected'];
  if (lower.includes('strength') || lower.includes('well') || lower.includes('double')) return sectionConfig['Strengths to Double Down On'];
  if (lower.includes('improve') || lower.includes('critical') || lower.includes('weak')) return sectionConfig['Critical Improvements'];
  if (lower.includes('action') || lower.includes('plan') || lower.includes('goal') || lower.includes('next')) return sectionConfig['Action Plan'];
  if (lower.includes('snapshot') || lower.includes('performance') || lower.includes('overview') || lower.includes('summary')) return sectionConfig['Performance Snapshot'];
  return { icon: Brain, color: 'hsl(var(--primary))' };
}

function SnapshotChart({ metric }: { metric: string }) {
  const { themeColors } = useThemePresets();
  const text = metric.replace(/\*\*/g, '');
  const win = /win\s*rate[^\d]*(\d+(?:\.\d+)?)%/i.exec(text);
  const ratio = /(?:R:R|risk.*reward)[^\d]*(\d+(?:\.\d+)?):1/i.exec(text);
  const pnl = /(?:P&L|profit)[^\d+\-]*([+\-]?[\s$£€¥]*[\d,]+(?:\.\d+)?)/i.exec(text);
  if (win) {
    const value = Number(win[1]);
    if (value < 0 || value > 100) return null;
    return <ChartContainer aria-label={`${value}% win rate`} config={{value:{label:'Share'}}} className="h-16 w-16 shrink-0 aspect-square"><PieChart><ChartTooltip content={<ChartTooltipContent hideLabel formatter={(v, name) => `${name}: ${v}%`} />} /><Pie data={[{name:'Wins',value},{name:'Other outcomes',value:100-value}]} dataKey="value" nameKey="name" innerRadius={20} outerRadius={29} strokeWidth={0} isAnimationActive={false}><Cell fill={themeColors.profit} /><Cell fill="hsl(var(--muted))" /></Pie></PieChart></ChartContainer>;
  }
  if (ratio) {
    const reward = Number(ratio[1]);
    return <ChartContainer aria-label={`Risk 1 to reward ${reward}`} config={{risk:{label:'Risk',color:themeColors.loss},reward:{label:'Reward',color:themeColors.profit}}} className="h-16 w-24 shrink-0 aspect-auto"><BarChart layout="vertical" data={[{risk:1,reward}]} margin={{left:0,right:0}}><XAxis type="number" hide domain={[0,1+reward]} /><YAxis type="category" hide /><ChartTooltip content={<ChartTooltipContent hideLabel formatter={(v,name)=>`${name === 'risk' ? 'Risk' : 'Reward'}: ${v}R`} />} /><Bar dataKey="risk" stackId="ratio" fill="var(--color-risk)" barSize={12} radius={[4,0,0,4]} isAnimationActive={false} /><Bar dataKey="reward" stackId="ratio" fill="var(--color-reward)" barSize={12} radius={[0,4,4,0]} isAnimationActive={false} /></BarChart></ChartContainer>;
  }
  if (pnl) {
    const value = Number(pnl[1].replace(/[^\d.+-]/g,''));
    const extent = Math.max(Math.abs(value)*1.2,1);
    return <ChartContainer aria-label={`Net profit and loss ${value}, relative to zero`} config={{value:{label:'Net P&L',color:value>=0?themeColors.profit:themeColors.loss}}} className="h-16 w-16 shrink-0 aspect-square"><BarChart data={[{value}]} margin={{top:3,bottom:3,left:3,right:3}}><XAxis hide /><YAxis hide domain={[-extent,extent]} /><ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" /><ChartTooltip content={<ChartTooltipContent hideLabel />} /><Bar dataKey="value" fill="var(--color-value)" barSize={22} radius={3} isAnimationActive={false} /></BarChart></ChartContainer>;
  }
  return null;
}

function AnalysisSection({ section, report = false }: { section: ParsedSection; report?: boolean }) {
  const config = getSectionConfig(section.title);
  const Icon = config.icon;
  const snapshot = /snapshot|performance|overview|summary/i.test(section.title);
  const paired = /strength|improvement|weakness/i.test(section.title);

  if (report) {
    const patterns = /pattern|detect/i.test(section.title);
    const action = /action|plan|next|goal/i.test(section.title);
    const risk = /improv|critical|weak/i.test(section.title);
    const blocks = section.content.split(/\n+/).map(line => line.trim()).filter(Boolean);
    const html = (text: string) => ({ __html: renderSectionContent(text) });
    return (
      <section className={`${paired ? '' : 'lg:col-span-2'} ${paired ? 'rounded-lg border p-5' : ''}`}>
        <div className="mb-4 flex items-center gap-2">
          {!snapshot && <Icon className="h-4 w-4" style={{ color: risk ? 'hsl(var(--destructive))' : config.color }} />}
          <h3 className="text-sm font-semibold">{section.title}</h3>
        </div>
        {snapshot ? (
          <div className="rounded-lg border overflow-hidden">
            <div className="grid sm:grid-cols-3 bg-muted/30">
              {(blocks[0] ?? '').split(' · ').map((metric, index) => <div key={index} className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r last:border-0 flex items-center justify-between gap-3 min-w-0"><div className="text-sm [&_strong]:block [&_strong]:text-lg [&_strong]:font-semibold [&_p]:!mt-0" dangerouslySetInnerHTML={html(metric)} /><SnapshotChart metric={metric} /></div>)}
            </div>
            {blocks.length > 1 && <div className="border-t px-4 py-3 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground" dangerouslySetInnerHTML={html(blocks.slice(1).join('\n\n'))} />}
          </div>
        ) : (
          <div className={patterns ? 'grid gap-3 md:grid-cols-3' : action ? 'divide-y border-y' : 'space-y-4'}>
            {blocks.map((block, index) => (
              <div key={index} className={patterns ? 'rounded-lg bg-muted/35 p-4 border border-border/60' : action ? 'flex gap-4 py-4' : 'flex gap-3'}>
                {action ? <span className="text-xl tabular-nums text-muted-foreground/60 font-medium">{String(index + 1).padStart(2, '0')}</span> : paired ? <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${risk ? 'bg-destructive' : 'bg-primary'}`} /> : null}
                <div className={`text-sm leading-relaxed text-muted-foreground [&_p]:!mt-0 [&_strong]:text-foreground ${patterns ? '[&_strong]:block [&_strong]:mb-2' : ''}`} dangerouslySetInnerHTML={html(block.replace(/^(?:- |\d+\. )/, ''))} />
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={report ? `${paired ? '' : 'lg:col-span-2'} ${snapshot ? 'rounded-lg bg-muted/30 p-4' : 'border-t pt-4'}` : 'py-4 first:pt-0 last:pb-0'}>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="h-4 w-4 shrink-0" style={{ color: config.color }} />
        <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
      </div>
      <div
        className="max-w-[90ch] text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:py-0.5"
        dangerouslySetInnerHTML={{ __html: renderSectionContent(section.content) }}
      />
    </section>
  );
}

const SAMPLE_SECTIONS = [
  {
    title: 'Performance Snapshot',
    content: '**Win rate: 54%** across 38 trades · Avg R:R **1.8:1** · Net P&L **+$1,240**\n\nBest pair: **GBPUSD** (68% win rate). Worst day: **Thursday** (avg -$180 per session). Your best sessions cluster between **9–11am EST**.',
  },
  {
    title: 'Key Patterns Detected',
    content: '- **Overtrading on Tuesdays** — averaging 8 trades vs 3.2 on other days, with a 41% win rate on those days\n- **Revenge trading signals** detected in 3 of your last 5 losing streaks — position size increases 60%+ after consecutive losses\n- **Inconsistent sizing** — coefficient of variation 47%, suggesting emotional position decisions',
  },
  {
    title: 'Strengths to Build On',
    content: '- You cut losers quickly — avg losing trade held **18 minutes**, well below the 45-minute danger zone\n- **EURUSD stop placement** is consistent and rarely hit prematurely\n- Morning sessions (pre-noon) outperform afternoon by **+$340 avg** — you trade better fresh',
  },
  {
    title: 'Critical Improvements',
    content: '- **Thursday is an outlier** — 6 of your 9 largest drawdown days are Thursdays. Consider halving size or sitting out entirely until you identify the cause\n- Tuesday overtrading correlates directly with your worst win rates. A hard cap of 4 trades/day would have saved an estimated **$520** last month',
  },
  {
    title: 'Action Plan',
    content: '1. Set a **hard daily trade limit of 4** — log a reason when you feel the urge to take a 5th\n2. Review all Thursday losing trades for a common pattern (news events, fatigue, specific pairs)\n3. Before sizing up after a loss, wait **30 minutes** — add this as a rule in your journal',
  },
];

function SampleAnalysisPreview() {
  const { getCurrencySymbol } = useSettings();
  const sym = getCurrencySymbol();
  return (
    <div>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10">
            <Brain className="h-4.5 w-4.5 text-amber-500" />
          </div>
          AI Trade Analysis
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-amber-500 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full">
            Sample
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border/60">
          {SAMPLE_SECTIONS.map((section, i) => (
            <AnalysisSection
              key={i}
              section={{ ...section, content: section.content.replace(/\$/g, sym).replace(/ EST\b/g, '') }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground pt-3 text-right border-t border-border/50 mt-4">
          Based on 38 trades · Sample output. Your analysis will use your real trades
        </p>
      </CardContent>
    </div>
  );
}

export function AIAnalysis({ trades, embedded = false, setupLayout = 'split', reportDesign = false, hideReportHeading = false }: AIAnalysisProps) {
  const { themeColors, alpha } = useThemePresets();
  const { getCurrencySymbol } = useSettings();
  const { hasAIAccess, updateFreeAiQuota } = useProStatus();
  const { user, isDemo } = useAuth();
  const { activeAccount, isAllAccounts, allAccountsCurrency } = useAccounts();
  // Cache per scope: the combined view analyzes a different trade set than the
  // member account, so it must not share the single account's cache slot.
  const cacheAccountId = isAllAccounts ? `all-${allAccountsCurrency}` : activeAccount?.id;
  const { streamText, isStreaming, startStream, meta, abort } = useStreamingAI();
  const [period, setPeriod] = useState<Period>('last30');
  const [result, setResult] = useState<CachedAnalysis | null>(null);

  useEffect(() => () => abort(), [abort]);

  useEffect(() => {
    // In demo mode, auto-show the shared canned analysis (single source of
    // truth) so the feature is visible without a backend call — and never read
    // the cache, which belongs to whatever real user last used this browser.
    if (isDemo) {
      setResult({
        analysis: getDemoAIResponse('analysis', null),
        usage: DEMO_AI_USAGE,
        timestamp: Date.now(),
        period: 'last30',
        tradeCount: DEMO_AI_TRADE_COUNT,
      });
      return;
    }
    // Account-scoped: switching accounts must never keep showing the previous
    // account's analysis, so a missing cache clears the panel.
    const cached = getCachedAnalysis(user?.uid ?? null, cacheAccountId);
    setResult(cached);
    if (cached) setPeriod(cached.period);
  }, [isDemo, user?.uid, cacheAccountId]);

  useEffect(() => {
    if (meta?.freeUsage) updateFreeAiQuota(meta.freeUsage);
  }, [meta, updateFreeAiQuota]);

  // `meta` lands after handleAnalyze's closure has already cached a fallback
  // usage object — patch the real numbers in once they arrive.
  useEffect(() => {
    if (!meta?.usage) return;
    setResult(prev => {
      if (!prev) return prev;
      const next = { ...prev, usage: meta.usage };
      if (!isDemo) setCachedAnalysis(user?.uid ?? null, cacheAccountId, next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.usage]);

  if (!hasAIAccess && !result?.analysis && !isStreaming) {
    return (
      <Card>
        <ProGate featureName="AI Trade Analysis">
          <SampleAnalysisPreview />
        </ProGate>
      </Card>
    );
  }

  const filteredTrades = filterTrades(trades, period);

  const handleAnalyze = async () => {
    if (!hasAIAccess) return;
    // Demo mode never calls the backend — re-show the pre-built analysis.
    if (isDemo) {
      setResult({
        analysis: getDemoAIResponse('analysis', null),
        usage: DEMO_AI_USAGE,
        timestamp: Date.now(),
        period,
        tradeCount: filteredTrades.length || DEMO_AI_TRADE_COUNT,
      });
      return;
    }

    if (filteredTrades.length < 3) {
      toast.warning('Need at least 3 trades in this period to analyze.');
      return;
    }

    trackEvent('ai_analysis_started', { period, tradeCount: filteredTrades.length });

    // Most recent trades first, capped — see MAX_ANALYSIS_TRADES.
    const payloadTrades = [...filteredTrades]
      .sort((a, b) => new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime())
      .slice(0, MAX_ANALYSIS_TRADES);

    try {
      const analysis = await startStream('analysis', {
        currency: getCurrencySymbol(),
        trades: payloadTrades.map(t => ({
          symbol: t.symbol,
          side: t.side,
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          lotSize: t.lotSize,
          entryTime: new Date(t.entryTime).toISOString(),
          exitTime: new Date(t.exitTime).toISOString(),
          pnl: t.pnl,
          strategy: t.strategy,
          riskReward: t.riskReward,
          emotions: t.emotions,
        })),
        analysisType: period === 'recent' ? 'recent' : 'period',
      });

      const cached: CachedAnalysis = {
        analysis,
        usage: meta?.usage || { used: 0, limit: 10, remaining: 10 },
        timestamp: Date.now(),
        period,
        tradeCount: payloadTrades.length,
      };
      setCachedAnalysis(user?.uid ?? null, cacheAccountId, cached);
      setResult(cached);
      trackEvent('ai_analysis_succeeded', { period, tradeCount: payloadTrades.length });
    } catch (err: any) {
      const msg = err?.message || 'Failed to analyze trades';
      trackEvent('ai_analysis_error', { period, message: msg });
      if (msg.includes('Daily') && msg.includes('limit')) {
        toast.warning('Daily limit reached. Resets at midnight UTC.');
      } else {
        toast.error(msg);
      }
    }
  };

  const displayText = isStreaming ? streamText : result?.analysis || '';
  const sections = displayText ? parseAnalysis(displayText) : [];

  return (
    <Card className={embedded ? "rounded-none border-0 bg-transparent shadow-none" : undefined}>
      <ProGate featureName="AI Trade Analysis" completedAIResult={!!result?.analysis || isStreaming}>
        {(!embedded || reportDesign || result || isStreaming) && <CardHeader className={embedded ? "px-0 pb-2 pt-0 sm:px-0 sm:pt-0" : "pb-3"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
            {reportDesign && !hideReportHeading && <><h2 className="text-base font-semibold">AI Trade Analysis</h2><p className="mt-1 text-sm text-muted-foreground">Your results, the patterns behind them, and what to work on next.</p></>}
            <CardTitle className="flex items-center gap-2 text-lg">
              {!embedded && <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ backgroundColor: alpha(themeColors.primary, '1f') }}
              >
                <Brain className="h-4.5 w-4.5" style={{ color: themeColors.primary }} />
              </div>}
              {!embedded && 'AI Trade Analysis'}
              {isStreaming && (
                <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              )}
            </CardTitle>
            </div>
            {result && !isStreaming && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted">
                  {result.usage.remaining}/{result.usage.limit} remaining
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResult(null);
                    localStorage.removeItem(scopedCacheKey(user?.uid ?? null, cacheAccountId));
                  }}
                >
                  <ArrowCounterClockwise className="mr-1.5 h-3.5 w-3.5" />
                  New
                </Button>
              </div>
            )}
          </div>
        </CardHeader>}
        <CardContent className={embedded ? "px-0 pb-0 sm:px-0 sm:pb-0" : undefined}>
          {!result && !isStreaming && !streamText ? (
            <div className={setupLayout === 'stacked' ? "space-y-5" : embedded ? "grid gap-5 border-t pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start" : "space-y-5"}>
              {!embedded && <p className="text-sm text-muted-foreground">
                Get personalised feedback on your trading patterns, strengths, and areas to improve — powered by AI.
              </p>}
              <div className={setupLayout === 'stacked' ? "flex flex-wrap gap-x-5 gap-y-3" : embedded ? "flex flex-wrap content-start gap-2" : "grid grid-cols-2 sm:grid-cols-5 gap-2"}>
                {[
                  { icon: TrendUp, label: 'Performance' },
                  { icon: MagnifyingGlass, label: 'Patterns' },
                  { icon: Trophy, label: 'Strengths' },
                  { icon: Warning, label: 'Weaknesses' },
                  { icon: Target, label: 'Action Plan' },
                ].map(({ icon: Icon, label }) => (
                  setupLayout === 'stacked' ? <span key={label} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="h-4 w-4 shrink-0" />{label}
                  </span> : embedded ? <Badge key={label} variant="secondary" className="gap-1.5 rounded-md px-2 py-1 font-normal">
                    <Icon className="h-3.5 w-3.5 shrink-0" />{label}
                  </Badge> : <div key={label} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: alpha(themeColors.primary, '15'), backgroundColor: alpha(themeColors.primary, '05') }}>
                    <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: themeColors.primary }} /><span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
              <div className={setupLayout === 'stacked' ? "grid gap-3 border-t pt-4 sm:grid-cols-[auto_1fr_auto] sm:items-center" : embedded ? "grid gap-3 sm:grid-cols-2" : "flex flex-col sm:flex-row items-stretch sm:items-center gap-3"}>
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                  <SelectTrigger aria-label="Analysis period" className={setupLayout === 'stacked' ? "w-full sm:w-48" : embedded ? "w-full" : "w-full sm:w-48"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Last 7 days</SelectItem>
                    <SelectItem value="last30">Last 30 days</SelectItem>
                    <SelectItem value="all">All trades</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAnalyze}
                  disabled={filteredTrades.length < 3}
                  style={{ backgroundColor: themeColors.primary }}
                  className={setupLayout === 'stacked' ? "order-last text-primary-foreground sm:justify-self-end" : "text-primary-foreground"}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Analyse My Trades
                </Button>
                <span className={setupLayout === 'stacked' ? "text-xs text-muted-foreground" : embedded ? "text-xs text-muted-foreground sm:col-span-2" : "text-xs text-muted-foreground sm:ml-1"} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''} in this period
                  {filteredTrades.length < 3 && ' — need at least 3'}
                  {filteredTrades.length > MAX_ANALYSIS_TRADES && ` — the ${MAX_ANALYSIS_TRADES} most recent are analysed`}
                </span>
              </div>
            </div>
          ) : sections.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
                {sections.map((section, i) => (
                  <AnalysisSection key={i} section={section} report={reportDesign} />
                ))}
              </div>
              {!isStreaming && result && (
                <>
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <AIFeedback feature="AI Trade Analysis" responseId={String(result.timestamp)} />
                    <p className="text-xs text-muted-foreground">
                      Based on {result.tradeCount} trades · {new Date(result.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <AnalysisUpgradeOffer tradeCount={trades.length} />
                </>
              )}
            </div>
          ) : isStreaming ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full animate-pulse"
                style={{ backgroundColor: alpha(themeColors.primary, '1f') }}
              >
                <Brain className="h-6 w-6" style={{ color: themeColors.primary }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Analysing your trades...</p>
                <p className="text-xs text-muted-foreground mt-1">Results will appear as they're generated</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </ProGate>
    </Card>
  );
}
