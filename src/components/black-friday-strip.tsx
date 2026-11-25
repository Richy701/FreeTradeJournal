import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { trackEvent } from '@/lib/analytics';
import { useSaleClock } from '@/hooks/use-sale-clock';
import {
  BLACK_FRIDAY_ENDS_AT,
  BLACK_FRIDAY_LIFETIME_PRICE,
  BLACK_FRIDAY_YEARLY_PRICE,
  PRICING_PLANS,
  isBlackFriday,
} from '@/constants/pricing';

// Classic Black Friday look on every theme: black strip, gold accents.
const GOLD = '#fbbf24';

const listPrice = (interval: 'yearly' | 'lifetime') =>
  PRICING_PLANS.find(p => p.interval === interval)?.price;

// "5d 07h 12m" / "07h 12m" on the last day
function timeLeft(now: number): string {
  const mins = Math.max(0, Math.floor((BLACK_FRIDAY_ENDS_AT - now) / 60_000));
  const d = Math.floor(mins / 1440);
  const h = String(Math.floor(mins / 60) % 24).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
}

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

  const yearlyList = listPrice('yearly');
  const lifetimeList = listPrice('lifetime');

  return (
    <div role="region" aria-label="Black Friday offer">
      <div className="border-b border-white/10 bg-[#0a0a0a] px-3 py-3 text-white sm:px-6 sm:py-3.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 sm:gap-5">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
            <span
              className="shrink-0 rounded-md px-2 py-1 text-[11px] font-extrabold uppercase leading-none tracking-[0.06em] text-black sm:px-2.5 sm:text-xs sm:tracking-[0.12em]"
              style={{ background: GOLD }}
            >
              {lastDay ? 'Ends tonight' : 'Black Friday'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold sm:text-base">
                {lastDay && <span className="sr-only">Black Friday ends tonight. </span>}
                {/* Phone: just the headline price */}
                <span className="sm:hidden">
                  <span style={{ color: GOLD }}>${BLACK_FRIDAY_YEARLY_PRICE}</span>/yr
                </span>
                <span className="hidden sm:inline">
                  Yearly <span style={{ color: GOLD }}>${BLACK_FRIDAY_YEARLY_PRICE}</span>
                  {yearlyList && <s className="ml-1.5 text-xs font-normal text-white/45 sm:text-sm">${yearlyList}</s>}
                  <span className="mx-2 text-white/30">·</span>
                  Lifetime <span style={{ color: GOLD }}>${BLACK_FRIDAY_LIFETIME_PRICE}</span>
                  {lifetimeList && <s className="ml-1.5 text-xs font-normal text-white/45 sm:text-sm">${lifetimeList}</s>}
                </span>
              </p>
              <p className="mt-0.5 hidden text-xs text-white/60 md:block">
                Yearly price is for your first year · {lastDay ? 'Ends 11:59 PM New York' : 'Ends Mon Nov 30'} ·{' '}
                <span role="timer" aria-live="off" className="font-medium tabular-nums text-white/85">{timeLeft(now)} left</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              to="/pricing?plan=yearly"
              onClick={() => trackEvent('pricing_cta_clicked', { plan: 'yearly', source: 'black_friday_strip' })}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold sm:px-4 sm:py-2 sm:text-sm text-black shadow-md transition-[filter,transform] hover:brightness-110 active:scale-95"
              style={{ background: GOLD }}
            >
              See prices
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <button
              onClick={handleSnooze}
              className="touch-manipulation rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Hide for today"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
