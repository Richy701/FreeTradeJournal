import { describe, it, expect } from 'vitest';
import { computeTradeAggregates, SIGNIFICANCE_THRESHOLD, MAX_BUCKETS } from './trade-aggregates';
import type { AggregatableTrade } from './trade-aggregates';

const mk = (over: Partial<AggregatableTrade>): AggregatableTrade => ({
  pnl: 10, symbol: 'EURUSD', side: 'long', ...over,
});

describe('computeTradeAggregates', () => {
  it('ranks groups by sample size, never by dollar P&L (the anti-MGCJ6 guard)', () => {
    const trades = [
      // 2-trade symbol with huge P&L
      mk({ symbol: 'MGCJ6', pnl: 5000 }), mk({ symbol: 'MGCJ6', pnl: 4000 }),
      // 30-trade symbol with modest P&L
      ...Array.from({ length: 30 }, (_, i) => mk({ symbol: 'EURUSD', pnl: i % 2 ? 5 : -4 })),
    ];
    const agg = computeTradeAggregates(trades);
    expect(agg.perSymbol[0].key).toBe('EURUSD');
    expect(agg.perSymbol[0].significant).toBe(true);
    const mgc = agg.perSymbol.find(g => g.key === 'MGCJ6')!;
    expect(mgc.significant).toBe(false); // 2 trades, below threshold
  });

  it('computes win rate, payoff ratio, and net P&L correctly', () => {
    const agg = computeTradeAggregates([
      mk({ pnl: 30 }), mk({ pnl: 10 }), mk({ pnl: -20 }), mk({ pnl: 0 }),
    ]);
    const g = agg.perSymbol[0];
    expect(g.count).toBe(4);
    expect(g.winRate).toBeCloseTo(50, 5); // 2 wins of 4; breakeven is neither
    expect(g.netPnl).toBeCloseTo(20, 5);
    expect(g.payoffRatio).toBeCloseTo(20 / 20, 5); // avgWin 20 / |avgLoss| 20
  });

  it('treats payoff ratio as null without both a win and a loss', () => {
    const winsOnly = computeTradeAggregates([mk({ pnl: 5 }), mk({ pnl: 7 })]);
    expect(winsOnly.perSymbol[0].payoffRatio).toBeNull();
    expect(winsOnly.payoffRatio).toBeNull();
  });

  it('only counts planned R:R when set (> 0), and reports the sample honestly', () => {
    const agg = computeTradeAggregates([
      mk({ riskReward: 2 }), mk({ riskReward: 3 }), mk({ riskReward: 0 }), mk({}),
    ]);
    expect(agg.avgPlannedRR).toBeCloseTo(2.5, 5);
    expect(agg.rrSampleCount).toBe(2);
  });

  it('never coerces a missing side to long, and drops unknown from perSide', () => {
    const agg = computeTradeAggregates([
      mk({ side: 'long' }), mk({ side: 'short' }), mk({ side: undefined }),
    ]);
    expect(agg.perSide.map(g => g.key).sort()).toEqual(['long', 'short']);
  });

  it('excludes Untagged from perStrategy and gates strategiesTagged at 20%', () => {
    const oneTagged = computeTradeAggregates([
      mk({ strategy: 'breakout' }),
      ...Array.from({ length: 9 }, () => mk({})),
    ]);
    expect(oneTagged.perStrategy.map(g => g.key)).toEqual(['breakout']);
    expect(oneTagged.strategiesTagged).toBe(false); // 10% < 20%

    const enoughTagged = computeTradeAggregates([
      mk({ strategy: 'breakout' }), mk({ strategy: 'breakout' }),
      ...Array.from({ length: 8 }, () => mk({})),
    ]);
    expect(enoughTagged.strategiesTagged).toBe(true); // exactly 20%
  });

  it('counts a multi-emotion trade once per emotion tag', () => {
    const agg = computeTradeAggregates([
      mk({ emotions: 'fear, greed' }), mk({ emotions: 'fear' }),
    ]);
    const fear = agg.perEmotion.find(g => g.key === 'fear')!;
    const greed = agg.perEmotion.find(g => g.key === 'greed')!;
    expect(fear.count).toBe(2);
    expect(greed.count).toBe(1);
  });

  it('caps bucket lists at MAX_BUCKETS and flags overall sufficiency', () => {
    const trades = Array.from({ length: SIGNIFICANCE_THRESHOLD }, (_, i) =>
      mk({ symbol: `SYM${i % 10}` }));
    const agg = computeTradeAggregates(trades);
    expect(agg.perSymbol.length).toBeLessThanOrEqual(MAX_BUCKETS);
    expect(agg.hasEnoughData).toBe(true);
    expect(computeTradeAggregates(trades.slice(0, 5)).hasEnoughData).toBe(false);
  });

  it('survives NaN and undefined pnl without polluting totals', () => {
    const agg = computeTradeAggregates([
      mk({ pnl: NaN }), mk({ pnl: undefined }), mk({ pnl: 10 }),
    ]);
    expect(agg.perSymbol[0].netPnl).toBe(10);
    expect(Number.isFinite(agg.avgWin)).toBe(true);
  });
});
