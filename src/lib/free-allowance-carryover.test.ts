// Covers functions/src/free-allowance.ts: free AI counts carried across
// delete-and-resignup via the email-hash tombstone.
import { describe, it, expect } from 'vitest';
import { mergeFreeAiUsage } from '../../functions/src/free-allowance';

const MONTH = '2026-09';
const TODAY = '2026-09-11';

describe('mergeFreeAiUsage', () => {
  it('carries a deleted account\'s spent allowance onto the new account', () => {
    const tombstone = { month: MONTH, count: 20, coaching: 5, utility: 15, autoDay: TODAY, auto: 8 };
    expect(mergeFreeAiUsage(undefined, tombstone, MONTH, TODAY)).toEqual(tombstone);
  });

  it('keeps the higher count per counter, whichever side it comes from', () => {
    const fresh = { month: MONTH, count: 1, coaching: 0, utility: 1, autoDay: TODAY, auto: 3 };
    const tombstone = { month: MONTH, count: 5, coaching: 5, utility: 0, autoDay: TODAY, auto: 1 };
    expect(mergeFreeAiUsage(fresh, tombstone, MONTH, TODAY)).toEqual({
      month: MONTH, count: 5, coaching: 5, utility: 1, autoDay: TODAY, auto: 3,
    });
  });

  it('an account deleted before any AI use does not erase an earlier account\'s usage', () => {
    const earlier = { month: MONTH, count: 4, coaching: 4, utility: 0, autoDay: null, auto: 0 };
    expect(mergeFreeAiUsage(earlier, undefined, MONTH, TODAY)).toEqual(earlier);
  });

  it('drops last month\'s counters and yesterday\'s auto cap (normal resets still happen)', () => {
    const stale = { month: '2026-08', count: 20, coaching: 5, utility: 15, autoDay: '2026-09-10', auto: 8 };
    expect(mergeFreeAiUsage(stale, undefined, MONTH, TODAY)).toBeNull();
  });

  it('returns null when there is nothing to carry', () => {
    expect(mergeFreeAiUsage(undefined, undefined, MONTH, TODAY)).toBeNull();
  });
});
