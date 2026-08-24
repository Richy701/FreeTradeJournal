import { BIRTHDAY_LIFETIME_ENDS_AT, isBirthdayLifetimeWindow } from '@/constants/pricing';
import { hasLoggedAnyTrade } from '@/lib/lifetime-farewell';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole calendar days (UTC) until the birthday lifetime week closes. Same
 * shape as lifetimeDaysLeft so the countdown copy behaves the same way: the
 * far east sees it tick over a few hours early, which is the safe direction.
 */
export function birthdayDaysLeft(now: number = Date.now()): number {
  const dayIndex = (ms: number) => Math.floor(ms / ONE_DAY_MS);
  return Math.max(0, dayIndex(BIRTHDAY_LIFETIME_ENDS_AT) - dayIndex(now));
}

/** "Six days left", "One day left", "Last day". */
export function birthdayCountdownBadge(now: number = Date.now()): string {
  const days = birthdayDaysLeft(now);
  if (days <= 0) return 'Last day';
  const words = ['zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
  return `${words[days] ?? days} day${days === 1 ? '' : 's'} left`;
}

/**
 * Who gets the one-time birthday dialog. Same reasoning as the farewell
 * dialog: a modal on top of the empty state hurts activation, so only people
 * who have logged a trade or are on a trial. Never demo, never paying Pro
 * (lifetime owners included: their plan is "lifetime", isPro, no trial).
 */
export function isBirthdayDialogAudience(opts: {
  uid: string | undefined;
  isDemo: boolean;
  isPayingPro: boolean;
  isTrialing: boolean;
}): boolean {
  if (!opts.uid || opts.isDemo || opts.isPayingPro) return false;
  return opts.isTrialing || hasLoggedAnyTrade(opts.uid);
}

const seenKeyFor = (uid: string | undefined) => `birthday-lifetime-dialog-seen-${uid || 'anon'}`;

export function hasSeenBirthdayDialog(uid: string | undefined): boolean {
  try {
    return localStorage.getItem(seenKeyFor(uid)) === 'true';
  } catch {
    // Storage blocked: treat as seen so private mode is not nagged every load.
    return true;
  }
}

export function markBirthdayDialogSeen(uid: string | undefined): void {
  try {
    localStorage.setItem(seenKeyFor(uid), 'true');
  } catch {
    // noop
  }
}

/** True while the window is open and this user has not yet had the dialog. */
export function isBirthdayDialogPending(uid: string | undefined): boolean {
  return isBirthdayLifetimeWindow() && !hasSeenBirthdayDialog(uid);
}
