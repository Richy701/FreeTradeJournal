import { describe, expect, it } from 'vitest';
import { findTradeReview, readReviewEntries, saveTradeReview } from './post-trade-review';

const trade = { id: 'trade-a', symbol: 'EURUSD', accountId: 'account-a', strategy: 'Breakout', emotions: 'Calm, Focused' };
const now = '2026-09-10T12:00:00Z';
describe('post-trade journal reviews', () => {
  it('creates a linked entry without replacing an existing journal note', () => {
    const note = { id: 'note', title: 'My plan', content: 'Keep this', tradeId: trade.id, accountId: trade.accountId };
    const { entries, entry } = saveTradeReview([note], trade, 'partly', ' Wait for confirmation. ', now);
    expect(entries[1]).toBe(note);
    expect(entry).toMatchObject({ content: 'Wait for confirmation.', entryType: 'post-trade', tradeIds: [trade.id], accountId: trade.accountId, emotions: ['Calm', 'Focused'] });
  });
  it('updates the same review and preserves journal edits, screenshots and metadata', () => {
    const first = saveTradeReview([], trade, 'yes', 'Good entry', now).entry;
    const edited = { ...first, title: 'Custom title', screenshots: ['idb:image'], tags: ['custom'] };
    const result = saveTradeReview([edited], trade, 'no', 'Review revised', now);
    expect(result.entries).toHaveLength(1);
    expect(result.entry).toMatchObject({ id: first.id, title: 'Custom title', screenshots: ['idb:image'], tags: ['custom'], quickReview: { plan: 'no' } });
  });
  it('does not match a review from a different account', () => {
    const entry = saveTradeReview([], trade, 'yes', 'Reflection', now).entry;
    expect(findTradeReview([entry], { ...trade, accountId: 'account-b' })).toBeUndefined();
  });
  it('rejects corrupt storage instead of replacing the journal', () => {
    for (const raw of ['broken', '{}', '[null]', '[{"id":"one"}]']) expect(() => readReviewEntries(raw)).toThrow();
  });
  it('rejects blank and overlong reflections', () => {
    for (const content of ['  ', 'x'.repeat(5001)]) expect(() => saveTradeReview([], trade, 'yes', content, now)).toThrow();
  });
  it('replaces only this account’s pinned lesson and preserves earlier lessons', () => {
    const lesson = { emotion: 'calm', lesson: ' Wait for confirmation. ', carryForward: true };
    const first = saveTradeReview([], trade, 'yes', 'Good entry', now, lesson).entry;
    const other = { ...first, id: 'other-account', accountId: 'account-b' };
    const result = saveTradeReview([first, other], { ...trade, id: 'trade-b' }, 'partly', 'Late entry', now, { ...lesson, lesson: 'Respect my entry trigger.' });
    expect(result.entry).toMatchObject({ lesson: 'Respect my entry trigger.', lessonPinned: true, emotions: ['calm'] });
    expect(result.entries.find(entry => entry.id === first.id)).toMatchObject({ lesson: 'Wait for confirmation.', lessonPinned: false });
    expect(result.entries.find(entry => entry.id === other.id)?.lessonPinned).toBe(true);
  });
  it('preserves lessons through the existing trade-log save and allows unpinning', () => {
    const first = saveTradeReview([], trade, 'yes', 'Good entry', now, { emotion: 'calm', lesson: 'Wait.', carryForward: true }).entry;
    expect(saveTradeReview([first], trade, 'no', 'Revised', now).entry).toMatchObject({ lesson: 'Wait.', lessonPinned: true });
    expect(saveTradeReview([first], trade, 'no', 'Revised', now, { emotion: '', lesson: 'Wait.', carryForward: false }).entry).toMatchObject({ lesson: 'Wait.', lessonPinned: false });
  });
  it('rejects an empty or overlong carried lesson', () => {
    for (const lesson of [' ', 'x'.repeat(301)]) expect(() => saveTradeReview([], trade, 'yes', 'Reflection', now, { emotion: '', lesson, carryForward: true })).toThrow();
  });
});
