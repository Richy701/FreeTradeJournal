import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { useThemePresets } from '@/contexts/theme-presets';
import { trackEvent } from '@/lib/analytics';
import { useSaleClock } from '@/hooks/use-sale-clock';
import {
  BLACK_FRIDAY_ENDS_AT,
  BLACK_FRIDAY_LIFETIME_PRICE,
  BLACK_FRIDAY_YEARLY_PRICE,
  isBlackFriday,
} from '@/constants/pricing';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const snoozeKey = (uid: string) => `black-friday-strip-snoozed-${uid}`;

function isSnoozed(uid: string, now: number): boolean {
  try {
    const until = parseInt(localStorage.getItem(snoozeKey(uid)) || '', 10);
    return Number.isFinite(until) && now < until;
  } catch {
    return false;
  }
}

// Last calendar day of the sale in New York, so "Ends tonight" is right for
// the people the deadline is quoted to.
function isLastDay(now: number): boolean {
  const ny = (t: number) => new Date(t).toLocaleDateString('en-US', { timeZone: 'America/New_York' });
  return ny(now) === ny(BLACK_FRIDAY_ENDS_AT);
}

/**
 * Black Friday 2026 strip across the top of the app, under the mobile header.
 * Signed-in users only; hidden for Yearly and Lifetime owners (nothing here
 * for them) and the demo. Monthly subscribers see it because Lifetime applies.
 * X hides it for a day. Disappears on its own at the deadline.
 */
export function BlackFridayStrip() {
  const { user, isDemo } = useAuth();
  const { isPro, subscription } = useProStatus();
  const { themeColors } = useThemePresets();
  const now = useSaleClock(30_000);
  const [dismissed, setDismissed] = useState(false);

  const plan = subscription?.planType;
  const ownsYearlyOrLifetime = isPro && (plan === 'yearly' || plan === 'lifetime');
  if (!user || isDemo || ownsYearlyOrLifetime || dismissed) return null;
  if (!isBlackFriday(now) || isSnoozed(user.uid, now)) return null;

  const lastDay = isLastDay(now);

  const handleSnooze = () => {
    try {
      localStorage.setItem(snoozeKey(user.uid), String(Date.now() + ONE_DAY_MS));
    } catch {
      // private mode: still hide for this session
    }
    trackEvent('black_friday_strip_dismissed', {});
    setDismissed(true);
  };

  return (
    <div role="region" aria-label="Black Friday offer">
      <div
        className="relative border-b px-3 py-2.5 sm:px-6"
        style={{ background: themeColors.primary, borderColor: `${themeColors.primary}80` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-black/25" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs font-medium text-white sm:text-sm">
            <span className="font-bold">
              {lastDay ? 'Black Friday ends tonight' : 'Black Friday'}
              <span className={lastDay ? 'hidden sm:inline' : undefined}>:</span>
            </span>
            <span className="hidden sm:inline">
              {' '}Yearly ${BLACK_FRIDAY_YEARLY_PRICE} first year, Lifetime ${BLACK_FRIDAY_LIFETIME_PRICE}.
              {lastDay ? ' Ends 11:59 PM New York.' : ' Ends Mon Nov 30.'}
            </span>
            {!lastDay && <span className="sm:hidden"> Pro from ${BLACK_FRIDAY_YEARLY_PRICE}/yr</span>}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/pricing?plan=yearly"
              onClick={() => trackEvent('pricing_cta_clicked', { plan: 'yearly', source: 'black_friday_strip' })}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/95 px-3.5 py-1 text-xs font-bold shadow-md transition-[colors,transform] hover:bg-white active:scale-95"
              style={{ color: themeColors.primary }}
            >
              See prices
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
            <button
              onClick={handleSnooze}
              className="touch-manipulation rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
              aria-label="Hide for today"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
