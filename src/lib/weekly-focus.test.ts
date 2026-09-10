import { describe, expect, it } from 'vitest';
import { addDays, appendFocusRecord, plansForAccount, readFocusRecords, summarizeFocus, type FocusPlan, type FocusRecord } from './weekly-focus';
import { mergeCollectionById } from './account-merge';

const plan: FocusPlan = { kind: 'plan', id: 'focus-1', accountId: 'account-a', createdAt: '2026-09-10T12:00:00Z', startDate: '2026-09-10', habit: 'Write my entry reason before each trade.' };
const check = (date: string, status: 'followed' | 'missed' | 'no_trading', id = date): FocusRecord => ({kind: 'checkin', id, planId: plan.id, accountId: plan.accountId, createdAt: `${date}T18:00:00Z`, date, status});

describe('weekly coaching follow-through', () => {
  it('uses seven calendar days across month, year and daylight-saving boundaries', () => {
    expect(addDays('2026-12-29', 7)).toBe('2027-01-05');
    expect(addDays('2026-03-26', 7)).toBe('2026-04-02');
    expect(addDays('2026-10-22', 7)).toBe('2026-10-29');
    expect(summarizeFocus([plan], plan, '2026-09-16').due).toBe(false);
    expect(summarizeFocus([plan], plan, '2026-09-17').due).toBe(true);
  });
  it('excludes no-trade and unrecorded days from adherence', () => {
    const result = summarizeFocus([plan, check('2026-09-10', 'followed'), check('2026-09-11', 'missed'), check('2026-09-12', 'no_trading')], plan, '2026-09-17');
    expect(result).toMatchObject({ followed: 1, missed: 1, scored: 2, noTrading: 1, unrecorded: 4 });
  });
  it('uses the latest correction regardless of arrival order and does not double count', () => {
    const original = check('2026-09-10', 'missed');
    const correction = { ...check('2026-09-10', 'followed', 'correction'), createdAt: '2026-09-11T10:00:00Z' };
    const result = summarizeFocus([plan, correction, original], plan, '2026-09-12');
    expect(result).toMatchObject({ followed: 1, missed: 0, recorded: 1 });
  });
  it('keeps plans and check-ins isolated by account', () => {
    const other: FocusPlan = { ...plan, id: 'other', accountId: 'account-b' };
    const record = { ...check('2026-09-10', 'followed'), accountId: 'account-b' };
    expect(plansForAccount([plan, other], 'account-a')).toEqual([plan]);
    expect(summarizeFocus([plan, record], plan, '2026-09-10').recorded).toBe(0);
    expect(() => appendFocusRecord([plan], record, '2026-09-10')).toThrow('no longer available');
  });
  it('rejects future check-ins, out-of-week dates, and an overlapping focus', () => {
    expect(() => appendFocusRecord([plan], check('2026-09-11', 'followed'), '2026-09-10')).toThrow('already started');
    expect(() => appendFocusRecord([plan], check('2026-09-20', 'followed'), '2026-09-20')).toThrow('already started');
    expect(() => appendFocusRecord([plan], { ...plan, id: 'another' }, '2026-09-10')).toThrow('Finish reviewing');
  });
  it('requires a completed week or an explicit early finish, then allows the next focus', () => {
    const review: FocusRecord = { kind: 'review', id: 'review', accountId: plan.accountId, planId: plan.id, createdAt: '2026-09-17T12:00:00Z', reflection: 'Writing it down helped me follow my plan.' };
    expect(() => appendFocusRecord([plan], review, '2026-09-12')).toThrow('after seven days');
    expect(appendFocusRecord([plan], { ...review, endedEarly: true }, '2026-09-12')).toHaveLength(2);
    const completed = appendFocusRecord([plan], review, '2026-09-17');
    expect(() => appendFocusRecord(completed, check('2026-09-11', 'followed'), '2026-09-17')).toThrow('already been reviewed');
    expect(appendFocusRecord(completed, { ...plan, id: 'next', startDate: '2026-09-17', createdAt: '2026-09-17T12:01:00Z' }, '2026-09-17')).toHaveLength(3);
  });
  it('preserves distinct check-ins through existing collection merging', () => {
    const merged = mergeCollectionById(JSON.stringify([plan, check('2026-09-10', 'followed')]), JSON.stringify([plan, check('2026-09-11', 'missed')]));
    const records = readFocusRecords(merged);
    expect(summarizeFocus(records, plan, '2026-09-17')).toMatchObject({ followed: 1, missed: 1 });
  });
  it('does not accumulate unrecorded days after an early finish', () => {
    const review: FocusRecord = { kind: 'review', id: 'early', accountId: plan.accountId, planId: plan.id, createdAt: '2026-09-11T12:00:00Z', endDate: '2026-09-11', endedEarly: true, reflection: 'I want to choose a more specific habit.' };
    expect(summarizeFocus([plan, check('2026-09-10', 'followed'), review], plan, '2026-09-25')).toMatchObject({ followed: 1, unrecorded: 1 });
  });
  it('rejects corrupt and unsupported history instead of silently clearing it', () => {
    expect(() => readFocusRecords('{bad')).toThrow();
    expect(() => readFocusRecords('{}')).toThrow();
    expect(() => readFocusRecords(JSON.stringify([{ ...plan, startDate: '2026-02-31' }]))).toThrow();
    expect(() => readFocusRecords(JSON.stringify([{ ...plan, habit: ' ' }]))).toThrow();
    expect(readFocusRecords(JSON.stringify([plan]))).toEqual([plan]);
  });
});
