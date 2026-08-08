import { LIFETIME_RETIRES_AT } from '@/constants/pricing';

/**
 * The announcement stops showing a month after the change. Someone who comes
 * back in December does not need a modal about what happened in August — by
 * then the pricing page simply is the current state of things.
 */
export const PLAN_CHANGES_ANNOUNCEMENT_ENDS_AT = LIFETIME_RETIRES_AT + 30 * 24 * 60 * 60 * 1000;

/**
 * Who gets the "what changed" dialog.
 *
 * Only accounts that existed BEFORE the cutoff, because only they experienced
 * the thing that changed: they were given 14 days of Pro at signup and can no
 * longer be given another. To someone who joined this morning nothing changed
 * at all, and telling them a trial they never had has ended is just confusing.
 *
 * Never demo accounts, and never paying subscribers or lifetime owners —
 * neither change costs them anything, so it would be pure interruption. People
 * on a running signup trial DO see it: they are the ones with a date coming up.
 */
export function isPlanChangesAudience(opts: {
  uid: string | undefined;
  isDemo: boolean;
  isPayingPro: boolean;
  accountCreatedAt: number | null;
}): boolean {
  if (!opts.uid || opts.isDemo || opts.isPayingPro) return false;
  if (Date.now() > PLAN_CHANGES_ANNOUNCEMENT_ENDS_AT) return false;
  // No creation date (older auth records can omit it) — leave them out rather
  // than risk telling a new user their trial ended.
  if (!opts.accountCreatedAt) return false;
  return opts.accountCreatedAt < LIFETIME_RETIRES_AT;
}

const seenKeyFor = (uid: string | undefined) => `plan-changes-seen-${uid || 'anon'}`;

export function hasSeenPlanChanges(uid: string | undefined): boolean {
  try {
    return localStorage.getItem(seenKeyFor(uid)) === 'true';
  } catch {
    // Storage blocked — treat as seen so a user in private mode isn't shown the
    // dialog on every single page load.
    return true;
  }
}

export function markPlanChangesSeen(uid: string | undefined): void {
  try {
    localStorage.setItem(seenKeyFor(uid), 'true');
  } catch {
    // noop — worst case they see it once more.
  }
}

/** True while this user still has the announcement coming. */
export function isPlanChangesPending(uid: string | undefined): boolean {
  return Date.now() <= PLAN_CHANGES_ANNOUNCEMENT_ENDS_AT && !hasSeenPlanChanges(uid);
}
