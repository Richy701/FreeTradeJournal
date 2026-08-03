import { LIFETIME_RETIRES_AT } from '@/constants/pricing';
import { firstTradeFlagKey } from '@/lib/first-trade';
import { UserStorage } from '@/utils/user-storage';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Has this user actually used the product? Checks the activation flag first
 * (set once the markFirstTrade call lands) and falls back to counting stored
 * trades, which stays true even if that call never succeeded offline.
 */
export function hasLoggedAnyTrade(uid: string | undefined): boolean {
  if (!uid) return false;

  try {
    if (localStorage.getItem(firstTradeFlagKey(uid))) return true;
  } catch {
    // Storage blocked — fall through to the trade count, which uses the same
    // storage and will simply return false.
  }

  try {
    const raw = UserStorage.getItem(uid, 'trades');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

/**
 * Who gets the farewell dialog.
 *
 * Deliberately narrower than the founder banner's rule. A $149 up-front
 * commitment means nothing to someone who has never logged a trade, and a
 * startup dialog would land on top of the empty state whose whole job is
 * getting them to log one — activation is the bottleneck, not monetisation.
 * So: people who have actually used the product, plus anyone on a trial
 * (warmest audience with a deadline four days out). Never demo accounts,
 * never existing paying subscribers, never lifetime owners.
 */
export function isLifetimeFarewellAudience(opts: {
  uid: string | undefined;
  isDemo: boolean;
  isPayingPro: boolean;
  isTrialing: boolean;
}): boolean {
  if (!opts.uid || opts.isDemo || opts.isPayingPro) return false;
  return opts.isTrialing || hasLoggedAnyTrade(opts.uid);
}

const seenKeyFor = (uid: string | undefined) => `lifetime-farewell-seen-${uid || 'anon'}`;

export function hasSeenLifetimeFarewell(uid: string | undefined): boolean {
  try {
    return localStorage.getItem(seenKeyFor(uid)) === 'true';
  } catch {
    // Storage blocked — treat as seen so a user in private mode isn't shown the
    // dialog on every single page load.
    return true;
  }
}

export function markLifetimeFarewellSeen(uid: string | undefined): void {
  try {
    localStorage.setItem(seenKeyFor(uid), 'true');
  } catch {
    // noop — worst case they see it once more.
  }
}

/**
 * True while this user still has the farewell dialog coming. The founder banner
 * keys off this so the two never stack on the same screen: the dialog takes the
 * first load, the banner takes every load after it.
 */
export function isLifetimeFarewellPending(uid: string | undefined): boolean {
  return Date.now() < LIFETIME_RETIRES_AT && !hasSeenLifetimeFarewell(uid);
}

/**
 * Whole calendar days between now and the retirement date, so "four days left"
 * on the 3rd becomes "three" on the 4th without anyone editing copy. UTC-based:
 * far-east timezones can see it tick over a few hours early, which is the safe
 * direction for a deadline.
 */
export function lifetimeDaysLeft(now: number = Date.now()): number {
  const dayIndex = (ms: number) => Math.floor(ms / ONE_DAY_MS);
  return Math.max(0, dayIndex(LIFETIME_RETIRES_AT) - dayIndex(now));
}

const NUMBER_WORDS = ['zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

/** Sentence-initial countdown, e.g. "Four days left" or "Today is the last day". */
export function lifetimeCountdownPhrase(now: number = Date.now()): string {
  const days = lifetimeDaysLeft(now);
  if (days <= 0) return 'Today is the last day';
  if (days === 1) return 'One day left';
  return `${NUMBER_WORDS[days] ?? days} days left`;
}

/** Short badge, e.g. "Last 4 days" or "Final day". */
export function lifetimeCountdownBadge(now: number = Date.now()): string {
  const days = lifetimeDaysLeft(now);
  if (days <= 0) return 'Final day';
  if (days === 1) return 'Final day';
  return `Last ${days} days`;
}
