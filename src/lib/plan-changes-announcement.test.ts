import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PLAN_CHANGES_ANNOUNCEMENT_ENDS_AT,
  hasSeenPlanChanges,
  isPlanChangesAudience,
  isPlanChangesPending,
  markPlanChangesSeen,
} from './plan-changes-announcement';

const UID = 'user-1';
const at = (iso: string) => Date.parse(iso);

// A day either side of the 2026-08-07T23:59:59Z cutoff.
const PRE_CUTOFF_ACCOUNT = at('2026-07-02T10:00:00Z');
const POST_CUTOFF_ACCOUNT = at('2026-08-08T01:06:00Z');

const base = {
  uid: UID,
  isDemo: false,
  isPayingPro: false,
  accountCreatedAt: PRE_CUTOFF_ACCOUNT,
};

describe('isPlanChangesAudience', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(at('2026-08-08T09:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('includes an account that existed before the cutoff', () => {
    expect(isPlanChangesAudience(base)).toBe(true);
  });

  // The whole point of the creation-date gate: someone who signed up after the
  // change never had a card-free trial, so "your trial ended" would be a lie.
  it('excludes accounts created after the cutoff', () => {
    expect(isPlanChangesAudience({ ...base, accountCreatedAt: POST_CUTOFF_ACCOUNT })).toBe(false);
  });

  it('excludes accounts with no known creation date rather than guessing', () => {
    expect(isPlanChangesAudience({ ...base, accountCreatedAt: null })).toBe(false);
  });

  it('excludes paying subscribers and lifetime owners — neither change costs them anything', () => {
    expect(isPlanChangesAudience({ ...base, isPayingPro: true })).toBe(false);
  });

  it('excludes demo mode', () => {
    expect(isPlanChangesAudience({ ...base, isDemo: true })).toBe(false);
  });

  it('excludes signed-out visitors', () => {
    expect(isPlanChangesAudience({ ...base, uid: undefined })).toBe(false);
  });

  // Someone returning months later should meet the current pricing page, not a
  // modal about something that happened in August.
  it('stops showing once the announcement window has passed', () => {
    vi.setSystemTime(PLAN_CHANGES_ANNOUNCEMENT_ENDS_AT + 1);
    expect(isPlanChangesAudience(base)).toBe(false);
  });

  it('still shows on the last day of the window', () => {
    vi.setSystemTime(PLAN_CHANGES_ANNOUNCEMENT_ENDS_AT - 1);
    expect(isPlanChangesAudience(base)).toBe(true);
  });
});

describe('isPlanChangesPending', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(at('2026-08-08T09:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('is pending until the dialog has been shown', () => {
    expect(isPlanChangesPending(UID)).toBe(true);
  });

  // Marked on display rather than dismissal, so nobody is interrupted twice.
  it('never returns for a user who has already seen it', () => {
    markPlanChangesSeen(UID);
    expect(hasSeenPlanChanges(UID)).toBe(true);
    expect(isPlanChangesPending(UID)).toBe(false);
  });

  it('tracks the flag per user, not globally', () => {
    markPlanChangesSeen(UID);
    expect(isPlanChangesPending('user-2')).toBe(true);
  });

  it('treats blocked storage as seen so private mode is not nagged every load', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    expect(hasSeenPlanChanges(UID)).toBe(true);
    expect(isPlanChangesPending(UID)).toBe(false);
    getItem.mockRestore();
  });
});
