import { useState, useEffect } from 'react';
import { Brain, Loader2, RotateCcw, TrendingUp, Search, Trophy, AlertTriangle, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProGate } from '@/components/pro-gate';
import { useThemePresets } from '@/contexts/theme-presets';
import type { AIAnalysisResponse } from '@/services/ai-analysis';
import DOMPurify from 'dompurify';

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

interface AIAnalysisProps {
  trades: Trade[];
}

type Period = 'recent' | 'last30' | 'all';

const CACHE_KEY = 'ftj-ai-analysis-cache';

interface CachedAnalysis {
  analysis: string;
  usage: AIAnalysisResponse['usage'];
  timestamp: number;
  period: Period;
  tradeCount: number;
}

function getCachedAnalysis(): CachedAnalysis | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedAnalysis;
    if (Date.now() - cached.timestamp > 24 * 60 * 60 * 1000) return null;
    return cached;
  } catch {
    return null;
  }
}

function setCachedAnalysis(data: CachedAnalysis) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
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

function renderSectionContent(content: string): string {
  const html = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-xs font-mono">$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      const isOrdered = /^\d+\./.test(content);
      const tag = isOrdered ? 'ol' : 'ul';
      return `<${tag} class="space-y-1.5 my-2">${match}</${tag}>`;
    })
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, ' ');

  // Sanitize HTML to prevent XSS attacks from AI-generated content
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'code', 'li', 'ul', 'ol', 'p'],
    ALLOWED_ATTR: ['class']
  });
}

const sectionConfig: Record<string, { icon: typeof Brain; color: string }> = {
  'Performance Snapshot': { icon: TrendingUp, color: 'hsl(var(--chart-1, 220 70% 50%))' },
  'Key Patterns Detected': { icon: Search, color: 'hsl(var(--chart-2, 160 60% 45%))' },
  'Strengths to Double Down On': { icon: Trophy, color: 'hsl(var(--chart-3, 30 80% 55%))' },
  'Critical Improvements': { icon: AlertTriangle, color: 'hsl(var(--chart-4, 280 65% 60%))' },
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

function AnalysisSection({ section }: { section: ParsedSection }) {
  const config = getSectionConfig(section.title);
  const Icon = config.icon;
  const isSnapshot = section.title.toLowerCase().includes('snapshot') || section.title.toLowerCase().includes('performance');

  return (
    <div className={`rounded-lg p-4 bg-card border border-border ${isSnapshot ? 'bg-muted/30' : ''}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="h-4 w-4 shrink-0" style={{ color: config.color }} />
        <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
      </div>
      <div
        className="text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:py-0.5"
        dangerouslySetInnerHTML={{ __html: renderSectionContent(section.content) }}
      />
    </div>
  );
}

export function AIAnalysis({ trades }: AIAnalysisProps) {
  const { themeColors, alpha } = useThemePresets();
  const [period, setPeriod] = useState<Period>('last30');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CachedAnalysis | null>(null);

  useEffect(() => {
    const cached = getCachedAnalysis();
    if (cached) {
      setResult(cached);
      setPeriod(cached.period);
    }
  }, []);

  const filteredTrades = filterTrades(trades, period);

  const handleAnalyze = async () => {
    if (filteredTrades.length < 3) {
      toast.error('Need at least 3 trades in this period to analyze.');
      return;
    }

    setLoading(true);
    try {
      const { requestAIAnalysis } = await import('@/services/ai-analysis');
      const response = await requestAIAnalysis({
        trades: filteredTrades.map(t => ({
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
        })),
        analysisType: period === 'recent' ? 'recent' : 'period',
      });

      const cached: CachedAnalysis = {
        analysis: response.analysis,
        usage: response.usage,
        timestamp: Date.now(),
        period,
        tradeCount: filteredTrades.length,
      };
      setCachedAnalysis(cached);
      setResult(cached);
      toast.success('Analysis complete');
    } catch (err: any) {
      const msg = err?.message || 'Failed to analyze trades';
      if (msg.includes('Daily AI analysis limit')) {
        toast.error('Daily limit reached. Resets at midnight UTC.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const sections = result ? parseAnalysis(result.analysis) : [];

  return (
    <Card>
      <ProGate featureName="AI Trade Analysis">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ backgroundColor: alpha(themeColors.primary, '1f') }}
              >
                <Brain className="h-4.5 w-4.5" style={{ color: themeColors.primary }} />
              </div>
              AI Trade Analysis
            </CardTitle>
            {result && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted">
                  {result.usage.remaining}/{result.usage.limit} remaining
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setResult(null); localStorage.removeItem(CACHE_KEY); }}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  New
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Get personalised feedback on your trading patterns, strengths, and areas to improve — powered by AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                  <SelectTrigger className="w-full sm:w-48">
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
                  disabled={loading || filteredTrades.length < 3}
                  style={{ backgroundColor: themeColors.primary }}
                  className="text-primary-foreground"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analysing...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Analyse My Trades
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''} in this period
                {filteredTrades.length < 3 && ' — need at least 3'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, i) => (
                <AnalysisSection key={i} section={section} />
              ))}
              <p className="text-xs text-muted-foreground pt-2 text-right">
                Based on {result.tradeCount} trades · {new Date(result.timestamp).toLocaleDateString()}
              </p>
            </div>
          )}

          {loading && !result && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full animate-pulse"
                style={{ backgroundColor: alpha(themeColors.primary, '1f') }}
              >
                <Brain className="h-6 w-6" style={{ color: themeColors.primary }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Analysing your trades...</p>
                <p className="text-xs text-muted-foreground mt-1">This usually takes 5-10 seconds</p>
              </div>
            </div>
          )}
        </CardContent>
      </ProGate>
    </Card>
  );
}
