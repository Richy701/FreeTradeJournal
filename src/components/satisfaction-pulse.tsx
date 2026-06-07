import { useState, useEffect } from 'react';
import { X, Chat } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useThemePresets } from '@/contexts/theme-presets';
import { trackEvent } from '@/lib/analytics';
import { triggerFeedbackDialog } from '@/lib/feedback-trigger';

const PULSE_KEY = 'ftj-satisfaction-pulse';
const PULSE_INTERVAL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const MIN_TRADES = 5;
const MIN_DAYS_SINCE_SIGNUP = 7;

interface SatisfactionPulseProps {
  tradeCount: number;
}

export function SatisfactionPulse({ tradeCount }: SatisfactionPulseProps) {
  const { user, isDemo } = useAuth();
  const { themeColors, alpha } = useThemePresets();
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user || isDemo || tradeCount < MIN_TRADES) return;

    const createdAt = user.metadata?.creationTime
      ? new Date(user.metadata.creationTime).getTime()
      : 0;
    const daysSinceSignup = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceSignup < MIN_DAYS_SINCE_SIGNUP) return;

    const stored = localStorage.getItem(PULSE_KEY);
    if (stored) {
      const lastShown = parseInt(stored, 10);
      if (Date.now() - lastShown < PULSE_INTERVAL_MS) return;
    }

    // Show after a short delay so it doesn't compete with page load
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, [user, isDemo, tradeCount]);

  function handleScore(value: number) {
    setScore(value);
    setSubmitted(true);
    localStorage.setItem(PULSE_KEY, String(Date.now()));

    trackEvent('nps_score_submitted', { score: value });

    // Send to backend
    sendNPSFeedback(value);

    // If score is high, prompt for full feedback after a delay
    if (value >= 9) {
      setTimeout(() => {
        triggerFeedbackDialog('NPS Score: ' + value);
      }, 1500);
    }
  }

  function dismiss() {
    setVisible(false);
    localStorage.setItem(PULSE_KEY, String(Date.now()));
    trackEvent('nps_dismissed');
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-6 z-50 max-w-[380px] w-full rounded-2xl border shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-500",
        "bg-card backdrop-blur-sm"
      )}
      style={{ borderColor: alpha(themeColors.primary, '20') }}
    >
      {/* Decorative top gradient bar */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${themeColors.primary}40, ${themeColors.primary}, ${themeColors.primary}40)` }}
      />

      <div className="p-5">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/80 transition-all"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {!submitted ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold pr-6">
                How likely are you to recommend FreeTradeJournal?
              </p>
              <p className="text-xs text-muted-foreground">
                One tap — we use this to prioritise what to build next.
              </p>
            </div>
            <div className="flex gap-[3px]">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleScore(i)}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-semibold transition-all duration-150",
                    "border hover:scale-[1.15] hover:-translate-y-0.5 hover:shadow-sm active:scale-95",
                    i <= 6
                      ? "border-red-200/80 dark:border-red-900/30 hover:bg-red-500/15 text-muted-foreground hover:text-red-500 dark:hover:text-red-400"
                      : i <= 8
                      ? "border-amber-200/80 dark:border-amber-900/30 hover:bg-amber-500/15 text-muted-foreground hover:text-amber-500 dark:hover:text-amber-400"
                      : "border-green-200/80 dark:border-green-900/30 hover:bg-green-500/15 text-muted-foreground hover:text-green-500 dark:hover:text-green-400"
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground/50 px-0.5">
              <span>Not likely</span>
              <span>Extremely likely</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-2 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping opacity-30" />
              <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-green-500/10 border border-green-500/20">
                <Chat className="h-4.5 w-4.5 text-green-500" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Thanks for the feedback!</p>
              <p className="text-xs text-muted-foreground">
                {score !== null && score >= 9
                  ? "We'd love to hear more..."
                  : "We'll use this to improve."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function sendNPSFeedback(score: number) {
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const fn = httpsCallable(getFunctions(), 'sendFeedback');
    await fn({
      type: 'nps',
      message: `NPS Score: ${score}/10`,
      rating: Math.round(score / 2),
      page: 'NPS Pulse',
      wantFollowUp: false,
    });
  } catch {
    // Non-critical
  }
}
