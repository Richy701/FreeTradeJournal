import { describe, expect, it } from 'vitest';
import { createDemoWeeklyFocus } from './demo-weekly-focus';
import { plansForAccount, readFocusRecords, summarizeFocus } from '@/lib/weekly-focus';

describe('weekly focus demo', () => {
  it.each(['2026-09-10', '2027-01-02', '2026-03-30'])('shows an active week and a completed review on %s', today => {
    const records = readFocusRecords(JSON.stringify(createDemoWeeklyFocus('demo-account', today)));
    const plans = plansForAccount(records, 'demo-account');
    expect(plans).toHaveLength(2);
    const current = summarizeFocus(records, plans[0], today);
    expect(current).toMatchObject({ followed: 2, missed: 1, noTrading: 1, recorded: 4, unrecorded: 1, due: false, review: null });
    expect(current.checks.has(today)).toBe(false);
    expect(current.days.filter(day => day > today)).toHaveLength(2);
    const previous = summarizeFocus(records, plans[1], today);
    expect(previous).toMatchObject({ followed: 4, missed: 1, noTrading: 2, recorded: 7, unrecorded: 0, due: true });
    expect(previous.review?.reflection).toContain('This week');
    expect(plansForAccount(records, 'real-account')).toEqual([]);
  });
});
