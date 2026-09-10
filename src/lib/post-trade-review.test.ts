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
});
