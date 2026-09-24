import {
  LIFETIME_DROP_ENDS_AT,
  LIFETIME_DROP_STARTS_AT,
  lifetimeDropPhase,
  type LifetimeDropPhase,
} from '@/constants/pricing';
import { hasLoggedAnyTrade } from '@/lib/lifetime-farewell';

export const LIFETIME_DROP_PATH = '/lifetime-drop';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Dev-only phase override so every state of the drop can be looked at before
 * the clock reaches it: ?drop=before|open|closed, or sessionStorage
 * `lifetime-drop-preview` (survives the demo-mode entry). Production ignores it.
 */
export function previewDropPhase(): LifetimeDropPhase | null {
  if (!import.meta.env.DEV) return null;
  try {
    const raw =
      new URLSearchParams(window.location.search).get('drop') ||
      sessionStorage.getItem('lifetime-drop-preview');
    return raw === 'before' || raw === 'open' || raw === 'closed' ? raw : null;
  } catch {
    return null;
  }
}

/** The phase to render: the real clock, unless a dev preview overrides it. */
export function effectiveDropPhase(now: number = Date.now()): LifetimeDropPhase {
  return previewDropPhase() ?? lifetimeDropPhase(now);
}

/** The instant the current phase ends: the open (before) or the close (open). */
export function dropTargetFor(phase: LifetimeDropPhase): number {
  return phase === 'before' ? LIFETIME_DROP_STARTS_AT : LIFETIME_DROP_ENDS_AT;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function countdownParts(target: number, now: number = Date.now()): CountdownParts {
  const total = Math.max(0, target - now);
  return {
    total,
    days: Math.floor(total / ONE_DAY_MS),
    hours: Math.floor(total / 3_600_000) % 24,
    minutes: Math.floor(total / 60_000) % 60,
    seconds: Math.floor(total / 1_000) % 60,
  };
}

/**
 * Whole days until the close, counted in New York (the deadline is 11:59 PM
 * there). Used for the "Last day" wording so it flips when New York's last
 * day begins rather than a UTC midnight.
 */
export function dropDaysLeft(now: number = Date.now()): number {
  const NY_OFFSET_MS = 4 * 60 * 60 * 1000; // EDT for the whole window
  const dayIndex = (ms: number) => Math.floor((ms - NY_OFFSET_MS) / ONE_DAY_MS);
  return Math.max(0, dayIndex(LIFETIME_DROP_ENDS_AT) - dayIndex(now));
}

/** "Six days left", "One day left", "Last day". */
export function dropCountdownBadge(now: number = Date.now()): string {
  const days = dropDaysLeft(now);
  if (days <= 0) return 'Last day';
  const words = ['zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
  return `${words[days] ?? days} day${days === 1 ? '' : 's'} left`;
}

/** Short "1d 04h 12m" for the in-app strip, where a full clock is too loud. */
export function shortCountdown(target: number, now: number = Date.now()): string {
  const { days, hours, minutes } = countdownParts(target, now);
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return days > 0 ? `${days}d ${hh}h ${mm}m` : `${hh}h ${mm}m`;
}

/**
 * Who sees the in-app strip. Paying Pro (lifetime owners included) and the
 * demo never do. Everyone else does, including people who have never logged
 * a trade: a one-line strip is not the modal that hurt activation before.
 */
export function isDropStripAudience(opts: { uid: string | undefined; isDemo: boolean; isPayingPro: boolean }): boolean {
  if (!opts.uid || opts.isDemo || opts.isPayingPro) return false;
  return true;
}

/** Warm users get the strip's stronger wording during the open week. */
export function isActivatedUser(uid: string | undefined): boolean {
  return hasLoggedAnyTrade(uid);
}

const snoozeKeyFor = (uid: string | undefined, phase: LifetimeDropPhase) =>
  `lifetime-drop-strip-snoozed-${phase}-${uid || 'anon'}`;

/** X on the strip hides it for a day. Each phase gets its own snooze so the
 *  open flips it back on even if the teaser was dismissed. */
export function isDropStripSnoozed(uid: string | undefined, phase: LifetimeDropPhase, now: number = Date.now()): boolean {
  try {
    const until = localStorage.getItem(snoozeKeyFor(uid, phase));
    if (!until) return false;
    const untilMs = parseInt(until, 10);
    if (now >= untilMs) return false;
    // On the last day an earlier snooze is stale ("closes tonight" is new).
    if (phase === 'open' && dropDaysLeft(now) <= 0 && dropDaysLeft(untilMs - ONE_DAY_MS) > 0) return false;
    return true;
  } catch {
    return true;
  }
}

export function snoozeDropStrip(uid: string | undefined, phase: LifetimeDropPhase): void {
  try {
    localStorage.setItem(snoozeKeyFor(uid, phase), String(Date.now() + ONE_DAY_MS));
  } catch {
    // noop
  }
}

/** Opening and closing moments in the three cities the emails quote. */
export const DROP_CITY_TIMES = {
  opens: [
    { city: 'New York', time: 'Fri 9:30 AM' },
    { city: 'London', time: 'Fri 2:30 PM' },
    { city: 'Sydney', time: 'Fri 11:30 PM' },
  ],
  closes: [
    { city: 'New York', time: 'Fri 11:59 PM' },
    { city: 'London', time: 'Sat 4:59 AM' },
    { city: 'Sydney', time: 'Sat 1:59 PM' },
  ],
} as const;
