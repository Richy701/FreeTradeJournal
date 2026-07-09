import { describe, it, expect } from 'vitest';
import { windowAnalyticsTrades } from './analytics-window';

const NOW = new Date('2026-07-09T12:00:00Z').getTime();
const daysAgo = (n: number) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();

describe('windowAnalyticsTrades', () => {
  it('keeps trades inside the window and counts the hidden ones', () => {
    const trades = [
      { exitTime: daysAgo(1) },
      { exitTime: daysAgo(29) },
      { exitTime: daysAgo(31) },
      { exitTime: daysAgo(400) },
    ];
    const result = windowAnalyticsTrades(trades, 30, NOW);
    expect(result.trades).toHaveLength(2);
    expect(result.hiddenCount).toBe(2);
  });

  it('falls back to entryTime when exitTime is missing', () => {
    const trades = [{ entryTime: daysAgo(5) }, { entryTime: daysAgo(60) }];
    const result = windowAnalyticsTrades(trades, 30, NOW);
    expect(result.trades).toHaveLength(1);
    expect(result.hiddenCount).toBe(1);
  });

  it('never hides trades with unparseable dates', () => {
    const trades = [{ exitTime: 'not-a-date' }, { exitTime: daysAgo(90) }];
    const result = windowAnalyticsTrades(trades, 30, NOW);
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].exitTime).toBe('not-a-date');
  });

  it('never hides trades missing both timestamps (no epoch-0 fallback)', () => {
    const trades = [{ pnl: 100 }, { exitTime: '', entryTime: '' }, { exitTime: daysAgo(90) }];
    const result = windowAnalyticsTrades(trades, 30, NOW);
    expect(result.trades).toHaveLength(2);
    expect(result.hiddenCount).toBe(1);
  });

  it('returns everything with zero hidden when all trades are recent', () => {
    const trades = [{ exitTime: daysAgo(2) }, { exitTime: daysAgo(10) }];
    const result = windowAnalyticsTrades(trades, 30, NOW);
    expect(result.trades).toHaveLength(2);
    expect(result.hiddenCount).toBe(0);
  });
});
