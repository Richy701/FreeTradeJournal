import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  hasLoggedAnyTrade,
  isLifetimeFarewellAudience,
  isLifetimeFarewellPending,
  lifetimeCountdownBadge,
  lifetimeCountdownPhrase,
  lifetimeDaysLeft,
  markLifetimeFarewellSeen,
} from './lifetime-farewell';
import { UserStorage } from '@/utils/user-storage';

const UID = 'user-1';
const at = (iso: string) => Date.parse(iso);

describe('lifetime farewell countdown', () => {
  it('counts whole calendar days to the retirement date', () => {
    expect(lifetimeDaysLeft(at('2026-08-03T10:00:00Z'))).toBe(4);
    expect(lifetimeDaysLeft(at('2026-08-06T10:00:00Z'))).toBe(1);
    expect(lifetimeDaysLeft(at('2026-08-07T10:00:00Z'))).toBe(0);
  });

  it('never goes negative once the offer has retired', () => {
    expect(lifetimeDaysLeft(at('2026-09-01T10:00:00Z'))).toBe(0);
  });

  // The copy is written into the dialog once; only these helpers keep it true.
  it('spells the countdown so the copy ages correctly on its own', () => {
    expect(lifetimeCountdownPhrase(at('2026-08-03T10:00:00Z'))).toBe('Four days left');
    expect(lifetimeCountdownPhrase(at('2026-08-05T10:00:00Z'))).toBe('Two days left');
    expect(lifetimeCountdownPhrase(at('2026-08-06T10:00:00Z'))).toBe('One day left');
    expect(lifetimeCountdownPhrase(at('2026-08-07T10:00:00Z'))).toBe('Today is the last day');
  });

  it('shortens the badge on the final day', () => {
    expect(lifetimeCountdownBadge(at('2026-08-03T10:00:00Z'))).toBe('Last 4 days');
    expect(lifetimeCountdownBadge(at('2026-08-07T10:00:00Z'))).toBe('Final day');
  });
});

describe('isLifetimeFarewellPending', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('is pending before the deadline for a user who has not seen it', () => {
    vi.setSystemTime(at('2026-08-03T10:00:00Z'));
    expect(isLifetimeFarewellPending(UID)).toBe(true);
  });

  it('stops once the user has been shown it', () => {
    vi.setSystemTime(at('2026-08-03T10:00:00Z'));
    markLifetimeFarewellSeen(UID);
    expect(isLifetimeFarewellPending(UID)).toBe(false);
  });

  it('stops once the offer has retired', () => {
    vi.setSystemTime(at('2026-08-08T10:00:00Z'));
    expect(isLifetimeFarewellPending(UID)).toBe(false);
  });

  it('is tracked per user, not globally', () => {
    vi.setSystemTime(at('2026-08-03T10:00:00Z'));
    markLifetimeFarewellSeen(UID);
    expect(isLifetimeFarewellPending('user-2')).toBe(true);
  });

  // The final-day dialog is a different message with its own once-ever flag.
  it('comes back on the final day for a user who saw the earlier dialog', () => {
    vi.setSystemTime(at('2026-08-03T10:00:00Z'));
    markLifetimeFarewellSeen(UID);
    vi.setSystemTime(at('2026-08-07T10:00:00Z'));
    expect(isLifetimeFarewellPending(UID)).toBe(true);
  });

  it('shows the final-day dialog only once too', () => {
    vi.setSystemTime(at('2026-08-07T10:00:00Z'));
    markLifetimeFarewellSeen(UID);
    expect(isLifetimeFarewellPending(UID)).toBe(false);
  });
});

describe('hasLoggedAnyTrade', () => {
  beforeEach(() => localStorage.clear());

  it('is false for a user with no trades', () => {
    expect(hasLoggedAnyTrade(UID)).toBe(false);
  });

  it('is true once the activation flag is set', () => {
    localStorage.setItem(`first-trade-celebrated-${UID}`, '1');
    expect(hasLoggedAnyTrade(UID)).toBe(true);
  });

  // The activation flag only lands after a successful Cloud Function call, so
  // an offline user can be genuinely activated without it.
  it('falls back to stored trades when the activation flag never landed', async () => {
    await UserStorage.setItem(UID, 'trades', '[{"id":"t1"}]');
    expect(hasLoggedAnyTrade(UID)).toBe(true);
  });

  it('treats an empty trade list as not activated', async () => {
    await UserStorage.setItem(UID, 'trades', '[]');
    expect(hasLoggedAnyTrade(UID)).toBe(false);
  });
});

describe('isLifetimeFarewellAudience', () => {
  const base = { uid: UID, isDemo: false, isPayingPro: false, isTrialing: false };

  // The audience widens on the final day, so pin these to mid-campaign.
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(at('2026-08-03T10:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('includes trial users even with no trades logged', () => {
    expect(isLifetimeFarewellAudience({ ...base, isTrialing: true })).toBe(true);
  });

  it('includes free users who have actually logged a trade', () => {
    localStorage.setItem(`first-trade-celebrated-${UID}`, '1');
    expect(isLifetimeFarewellAudience(base)).toBe(true);
  });

  // The whole point of the narrower targeting: a $149 up-front pitch on top of
  // the empty state that is supposed to be driving their first trade.
  it('excludes free users who have never logged a trade', () => {
    expect(isLifetimeFarewellAudience(base)).toBe(false);
  });

  it('excludes paying subscribers', () => {
    localStorage.setItem(`first-trade-celebrated-${UID}`, '1');
    expect(isLifetimeFarewellAudience({ ...base, isPayingPro: true })).toBe(false);
  });

  it('excludes demo accounts', () => {
    localStorage.setItem(`first-trade-celebrated-${UID}`, '1');
    expect(isLifetimeFarewellAudience({ ...base, isDemo: true })).toBe(false);
  });

  it('excludes logged-out visitors', () => {
    expect(isLifetimeFarewellAudience({ ...base, uid: undefined })).toBe(false);
  });

  // Final day: reach beats onboarding protection — there is no tomorrow left.
  it('includes free users with no trades on the final day', () => {
    vi.setSystemTime(at('2026-08-07T10:00:00Z'));
    expect(isLifetimeFarewellAudience(base)).toBe(true);
  });

  it('still excludes paying, demo, and logged-out users on the final day', () => {
    vi.setSystemTime(at('2026-08-07T10:00:00Z'));
    expect(isLifetimeFarewellAudience({ ...base, isPayingPro: true })).toBe(false);
    expect(isLifetimeFarewellAudience({ ...base, isDemo: true })).toBe(false);
    expect(isLifetimeFarewellAudience({ ...base, uid: undefined })).toBe(false);
  });
});
