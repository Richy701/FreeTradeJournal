import { useState, useEffect, useCallback, useRef } from 'react';
import { Warning, SpinnerGap, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { AIFeedback } from '@/components/ui/ai-feedback';
import { useThemePresets } from '@/contexts/theme-presets';
import { useProStatus } from '@/contexts/pro-context';
import { useAuth } from '@/contexts/auth-context';
import { useSettings } from '@/contexts/settings-context';
import { useDemoData } from '@/hooks/use-demo-data';
import { useUserStorage } from '@/utils/user-storage';
import { getAICache, setAICache } from '@/utils/ai-cache';
import { trackEvent } from '@/lib/analytics';
import { isFreeAiQuotaError, notifyFreeAiQuotaExhausted } from '@/lib/ai-quota';
import DOMPurify from 'dompurify';

// Local YYYY-MM-DD, matching the app's day-bucketing standard — a UTC key
// mis-bucketed late-evening trades and skewed "today's loss" near midnight.
function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

// The monitor re-checks when trades change in another tab. Only these
// localStorage keys can change the outcome; everything else (PostHog
// persistence, theme, caches) must be ignored — on 2026-08-17 two tabs fed each
// other through PostHog's localStorage writes and sent 1,551 denied calls in
// seven seconds.
const RELEVANT_STORAGE_KEYS = /(^|_)(trades|riskRules|accounts)$/;

function renderAlertMarkdown(md: string): string {
  // Build real block structure (headings, paragraphs, lists) instead of
  // <br/>-based spacing — stacked <br/>s made ragged gaps between sections.
  const headingClass = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-1.5 first:mt-0';
  const listClass = 'ml-4 my-1 space-y-1.5';

  let html = '';
  let openList: 'ol' | 'ul' | null = null;
  const closeList = () => {
    if (openList) {
      html += `</${openList}>`;
      openList = null;
    }
  };

  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }

    const heading = line.match(/^#{1,4} (.+)$/);
    if (heading) {
      closeList();
      html += `<h4 class="${headingClass}">${heading[1]}</h4>`;
      continue;
    }

    const ordered = line.match(/^\d+\. (.+)$/);
    if (ordered) {
      if (openList !== 'ol') { closeList(); html += `<ol class="list-decimal ${listClass}">`; openList = 'ol'; }
      html += `<li class="pl-1">${ordered[1]}</li>`;
      continue;
    }

    const unordered = line.match(/^- (.+)$/);
    if (unordered) {
      if (openList !== 'ul') { closeList(); html += `<ul class="list-disc ${listClass}">`; openList = 'ul'; }
      html += `<li class="pl-1">${unordered[1]}</li>`;
      continue;
    }

    closeList();
    html += `<p class="my-1">${line}</p>`;
  }
  closeList();

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Sanitize HTML to prevent XSS attacks from AI-generated content
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h4', 'strong', 'li', 'ol', 'ul', 'p'],
    ALLOWED_ATTR: ['class']
  });
}

function SampleRiskAlert() {
  const { themeColors, alpha } = useThemePresets();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="rounded-lg border p-4 relative mt-6"
      style={{
        backgroundColor: alpha(themeColors.loss, '08'),
        borderColor: alpha(themeColors.loss, '20'),
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Warning className="h-4 w-4 shrink-0" style={{ color: themeColors.loss }} />
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
  const { getCurrencySymbol } = useSettings();
  const { isPro, hasAIAccess, updateFreeAiQuota } = useProStatus();
  const { user, isDemo } = useAuth();
  const { getTrades } = useDemoData();
  const userStorage = useUserStorage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  // Alert types with a request in flight or already attempted this mount.
  // State updates re-run detection; this ref keeps that from re-asking.
  const attemptedRef = useRef<Set<string>>(new Set());

  const detectPatterns = useCallback(() => {
    if (!user || isDemo || !hasAIAccess) return;

    // Account-scoped via useDemoData — the raw localStorage read mixed every
    // account's trades into risk detection.
    let trades: Trade[];
    try {
      trades = getTrades() as Trade[];
    } catch {
      return;
    }

    if (trades.length < 3) return;

    // Sort by exit time descending
    const sorted = [...trades].sort((a, b) =>
      new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime()
    );

    const today = localDayKey(new Date());
    const sym = getCurrencySymbol();
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
            localDayKey(new Date(t.exitTime)) === today
          );
          const todayPnl = todayTrades.reduce((s, t) => s + t.pnl, 0);
          if (todayPnl < -maxLossRule.value) {
            const cacheKey = `ftj-risk-alert-maxLossPerDay-${today}`;
            if (!getAICache(cacheKey, THROTTLE_TTL)) {
              detected.push({
                type: 'maxLossPerDay',
                title: `Daily loss limit exceeded (${sym}${Math.abs(todayPnl).toFixed(2)} / ${sym}${maxLossRule.value})`,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isDemo, hasAIAccess, userStorage, getTrades, getCurrencySymbol]);

  useEffect(() => {
    detectPatterns();
  }, [detectPatterns]);

  // A risk MONITOR must see trades as they happen — re-run detection when
  // trades change anywhere (Trade Log, quick add, import, other tabs).
  useEffect(() => {
    const rerun = () => detectPatterns();
    const onStorage = (e: StorageEvent) => {
      // key === null means localStorage.clear(); otherwise only trade-shaped
      // keys matter (see RELEVANT_STORAGE_KEYS).
      if (e.key !== null && !RELEVANT_STORAGE_KEYS.test(e.key)) return;
      detectPatterns();
    };
    window.addEventListener('tradesUpdated', rerun);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('tradesUpdated', rerun);
      window.removeEventListener('storage', onStorage);
    };
  }, [detectPatterns]);

  const fetchAdvice = async (alert: Alert, recentTrades: Trade[]) => {
    if (attemptedRef.current.has(alert.type)) return;
    attemptedRef.current.add(alert.type);
    const today = localDayKey(new Date());
    // One ask per alert type per day, success or failure. Written BEFORE the
    // request (and in localStorage, so other tabs see it): a denied or failed
    // call must not be re-asked on the next detection pass.
    setAICache(`ftj-risk-alert-${alert.type}-${today}`, true);
    setLoading(prev => new Set(prev).add(alert.type));
    trackEvent('ai_risk_alert_started', { violationType: alert.type });
    try {
      const todayTrades = recentTrades.filter(t =>
        localDayKey(new Date(t.exitTime)) === today
      );
      const todayPnl = todayTrades.reduce((s, t) => s + t.pnl, 0);

      const rulesRaw = userStorage.getItem('riskRules');
      const rules = rulesRaw ? JSON.parse(rulesRaw) : [];
      const maxLossRule = rules.find((r: any) => r.type === 'maxLossPerDay' && r.enabled);

      const { requestAIAssist } = await import('@/services/ai-assist');
      const response = await requestAIAssist({
        type: 'risk_alert',
        payload: {
          currency: getCurrencySymbol(),
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

      if (response.freeUsage) updateFreeAiQuota(response.freeUsage);
      trackEvent('ai_risk_alert_used');
      setAlerts(prev =>
        prev.map(a => a.type === alert.type ? { ...a, advice: response.result } : a)
      );
    } catch (err: any) {
      trackEvent('ai_risk_alert_error', { message: err?.message });
      // The server said the free quota is gone: tell pro-context so
      // hasAIAccess flips off for every auto-firing feature in this tab.
      if (isFreeAiQuotaError(err)) notifyFreeAiQuotaExhausted();
      // Show error message instead of silently failing
      setAlerts(prev =>
        prev.map(a => a.type === alert.type
          ? { ...a, advice: `Unable to load AI advice: ${err?.message || 'Please try again later'}` }
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

  if (!hasAIAccess && !isDemo) return <SampleRiskAlert />;

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="mt-6 space-y-3">
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
              <Warning className="h-4 w-4 shrink-0" style={{ color: themeColors.loss }} />
              <span className="text-sm font-semibold">{alert.title}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 -m-1.5 shrink-0" onClick={() => dismiss(alert.type)} aria-label="Dismiss alert">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {loading.has(alert.type) ? (
            <div className="flex items-center gap-2 mt-3 ml-6">
              <SpinnerGap className="h-3.5 w-3.5 animate-spin" style={{ color: themeColors.primary }} />
              <span className="text-xs text-muted-foreground">Getting AI advice...</span>
            </div>
          ) : alert.advice ? (
            <>
              <div
                className="mt-3 ml-6 max-w-3xl text-sm text-muted-foreground leading-relaxed [&_strong]:font-medium [&_strong]:text-foreground"
                dangerouslySetInnerHTML={{ __html: renderAlertMarkdown(alert.advice) }}
              />
              <div
                className="mt-4 ml-6 max-w-3xl border-t pt-3"
                style={{ borderColor: alpha(themeColors.loss, '15') }}
              >
                <AIFeedback feature="AI Risk Alert" responseId={alert.type} />
              </div>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}
