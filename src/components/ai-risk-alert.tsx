import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Brain, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemePresets } from '@/contexts/theme-presets';
import { useProStatus } from '@/contexts/pro-context';
import { useAuth } from '@/contexts/auth-context';
import { useUserStorage } from '@/utils/user-storage';
import { getAICache, setAICache } from '@/utils/ai-cache';
import DOMPurify from 'dompurify';

interface Trade {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  pnl: number;
  entryTime: Date | string;
  exitTime: Date | string;
}

interface Alert {
  type: 'consecutiveLosses' | 'maxLossPerDay' | 'revengeTrading';
  title: string;
  advice: string | null;
}

const THROTTLE_TTL = 24 * 60 * 60 * 1000; // 1 alert per type per day

function renderAlertMarkdown(md: string): string {
  const html = md
    .replace(/## (.*)/g, '<h4 class="text-sm font-semibold mt-3 mb-1 text-foreground">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-3 list-disc text-sm">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-3 list-decimal text-sm">$2</li>')
    .replace(/\n\n/g, '<br/>')
    .replace(/\n/g, ' ');

  // Sanitize HTML to prevent XSS attacks from AI-generated content
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h4', 'strong', 'li', 'br'],
    ALLOWED_ATTR: ['class']
  });
}

function SampleRiskAlert() {
  const { themeColors, alpha } = useThemePresets();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="rounded-lg border p-4 relative"
      style={{
        backgroundColor: alpha(themeColors.loss, '08'),
        borderColor: alpha(themeColors.loss, '20'),
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: themeColors.loss }} />
          <span className="text-sm font-semibold">3 consecutive losing trades detected</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-3 ml-6 space-y-1.5 text-sm text-muted-foreground leading-relaxed blur-[3px] select-none pointer-events-none">
        <p><strong className="text-foreground">Step away.</strong> Three consecutive losses is a proven signal to pause — not push harder.</p>
        <p>Your last 3 losing trades averaged <strong className="text-foreground">-$87 each</strong>. Continuing now risks revenge trading, which historically costs you 2× more per trade.</p>
        <p>Suggested action: close your platform for 30 minutes, review what these 3 trades had in common, then decide if the session is worth continuing.</p>
      </div>
      <div className="mt-3 ml-6">
        <a
          href="/pricing"
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
        >
          Upgrade to Pro to unlock AI risk advice →
        </a>
      </div>
    </div>
  );
}

export function AIRiskAlertMonitor() {
  const { themeColors, alpha } = useThemePresets();
  const { isPro } = useProStatus();
  const { user, isDemo } = useAuth();
  const userStorage = useUserStorage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const detectPatterns = useCallback(() => {
    if (!user || isDemo || !isPro) return;

    const tradesRaw = userStorage.getItem('trades');
    if (!tradesRaw) return;

    let trades: Trade[];
    try {
      trades = JSON.parse(tradesRaw);
    } catch {
      return;
    }

    if (trades.length < 3) return;

    // Sort by exit time descending
    const sorted = [...trades].sort((a, b) =>
      new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime()
    );

    const today = new Date().toISOString().split('T')[0];
    const detected: Alert[] = [];

    // Check consecutive losses (last 3+ trades)
    let streak = 0;
    for (const t of sorted) {
      if (t.pnl < 0) streak++;
      else break;
    }
    if (streak >= 3) {
      const cacheKey = `ftj-risk-alert-consecutiveLosses-${today}`;
      if (!getAICache(cacheKey, THROTTLE_TTL)) {
        detected.push({
          type: 'consecutiveLosses',
          title: `${streak} consecutive losing trades`,
          advice: null,
        });
      }
    }

    // Check daily loss
    const rulesRaw = userStorage.getItem('riskRules');
    if (rulesRaw) {
      try {
        const rules = JSON.parse(rulesRaw);
        const maxLossRule = rules.find((r: any) => r.type === 'maxLossPerDay' && r.enabled);
        if (maxLossRule) {
          const todayTrades = sorted.filter(t =>
            new Date(t.exitTime).toISOString().split('T')[0] === today
          );
          const todayPnl = todayTrades.reduce((s, t) => s + t.pnl, 0);
          if (todayPnl < -maxLossRule.value) {
            const cacheKey = `ftj-risk-alert-maxLossPerDay-${today}`;
            if (!getAICache(cacheKey, THROTTLE_TTL)) {
              detected.push({
                type: 'maxLossPerDay',
                title: `Daily loss limit exceeded ($${Math.abs(todayPnl).toFixed(2)} / $${maxLossRule.value})`,
                advice: null,
              });
            }
          }
        }
      } catch { /* ignore */ }
    }

    // Check revenge trading (trade within 5 min of a loss)
    if (sorted.length >= 2) {
      const last = sorted[0];
      const prev = sorted[1];
      if (prev.pnl < 0) {
        const gap = (new Date(last.entryTime).getTime() - new Date(prev.exitTime).getTime()) / 60000;
        if (gap < 5 && gap >= 0) {
          const cacheKey = `ftj-risk-alert-revengeTrading-${today}`;
          if (!getAICache(cacheKey, THROTTLE_TTL)) {
            detected.push({
              type: 'revengeTrading',
              title: 'Possible revenge trade detected',
              advice: null,
            });
          }
        }
      }
    }

    if (detected.length > 0) {
      setAlerts(detected);
      // Auto-fetch AI advice for the first alert
      fetchAdvice(detected[0], sorted.slice(0, 10));
    }
  }, [user, isDemo, isPro, userStorage]);

  useEffect(() => {
    detectPatterns();
  }, [detectPatterns]);

  const fetchAdvice = async (alert: Alert, recentTrades: Trade[]) => {
    setLoading(prev => new Set(prev).add(alert.type));
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayTrades = recentTrades.filter(t =>
        new Date(t.exitTime).toISOString().split('T')[0] === today
      );
      const todayPnl = todayTrades.reduce((s, t) => s + t.pnl, 0);

      const rulesRaw = userStorage.getItem('riskRules');
      const rules = rulesRaw ? JSON.parse(rulesRaw) : [];
      const maxLossRule = rules.find((r: any) => r.type === 'maxLossPerDay' && r.enabled);

      const { requestAIAssist } = await import('@/services/ai-assist');
      const response = await requestAIAssist({
        type: 'risk_alert',
        payload: {
          violationType: alert.type,
          ruleValue: maxLossRule?.value || 0,
          actualValue: todayPnl,
          recentTrades: recentTrades.slice(0, 10).map(t => ({
            symbol: t.symbol,
            side: t.side,
            pnl: t.pnl,
          })),
          currentStreak: alert.type === 'consecutiveLosses' ? parseInt(alert.title) || 3 : 0,
          todayPnL: todayPnl,
        },
      });

      // Cache to throttle
      const cacheKey = `ftj-risk-alert-${alert.type}-${today}`;
      setAICache(cacheKey, true);

      setAlerts(prev =>
        prev.map(a => a.type === alert.type ? { ...a, advice: response.result } : a)
      );
    } catch (err: any) {
      // Show error message instead of silently failing
      setAlerts(prev =>
        prev.map(a => a.type === alert.type
          ? { ...a, advice: `⚠️ Unable to load AI advice: ${err?.message || 'Please try again later'}` }
          : a
        )
      );
    } finally {
      setLoading(prev => { const n = new Set(prev); n.delete(alert.type); return n; });
    }
  };

  const dismiss = (type: string) => {
    setDismissed(prev => new Set(prev).add(type));
  };

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.type));

  if (!isPro && !isDemo) return <SampleRiskAlert />;

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleAlerts.map(alert => (
        <div
          key={alert.type}
          className="rounded-lg border p-4"
          style={{
            backgroundColor: alpha(themeColors.loss, '08'),
            borderColor: alpha(themeColors.loss, '20'),
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: themeColors.loss }} />
              <span className="text-sm font-semibold">{alert.title}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => dismiss(alert.type)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {loading.has(alert.type) ? (
            <div className="flex items-center gap-2 mt-3 ml-6">
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: themeColors.primary }} />
              <span className="text-xs text-muted-foreground">Getting AI advice...</span>
            </div>
          ) : alert.advice ? (
            <div
              className="mt-3 ml-6 text-sm text-muted-foreground leading-relaxed [&_strong]:text-foreground [&_h4]:text-foreground [&_li]:py-0.5"
              dangerouslySetInnerHTML={{ __html: renderAlertMarkdown(alert.advice) }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
