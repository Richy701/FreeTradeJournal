import { describe, it, expect } from 'vitest';
import { normalizeScreenshotTime, screenshotTradesToReview } from './screenshot-import';
import { buildImportedTrades } from './import-trades';
import type { ScreenshotTrade } from '@/services/ai-analysis';

const row = (over: Partial<ScreenshotTrade> = {}): ScreenshotTrade => ({
  symbol: 'eurusd.m',
  side: 'long',
  entryPrice: 1.0854,
  exitPrice: 1.0872,
  quantity: 0.5,
  pnl: 90,
  commission: -3.5,
  swap: -0.42,
  fees: null,
  openTime: '2026-08-14 09:12:00',
  closeTime: '2026-08-14 11:40:15',
  confidence: 'high',
  ...over,
});

describe('normalizeScreenshotTime', () => {
  it('turns the model format into naive ISO', () => {
    expect(normalizeScreenshotTime('2026-08-14 09:12:00')).toBe('2026-08-14T09:12:00');
    expect(normalizeScreenshotTime('2026-8-4 9:05')).toBe('2026-08-04T09:05:00');
  });
  it('handles bare dates and MT dotted dates', () => {
    expect(normalizeScreenshotTime('2026-08-14')).toBe('2026-08-14T00:00:00');
    expect(normalizeScreenshotTime('2026.08.14 09:12')).toBe('2026-08-14T09:12:00');
    expect(normalizeScreenshotTime('14.08.2026 09:12:33')).toBe('2026-08-14T09:12:33');
    expect(normalizeScreenshotTime('19-08-2026 13:35')).toBe('2026-08-19T13:35:00');
  });
  it('returns empty for nothing usable', () => {
    expect(normalizeScreenshotTime('')).toBe('');
    expect(normalizeScreenshotTime(null)).toBe('');
    expect(normalizeScreenshotTime('n/a')).toBe('');
  });
});

describe('screenshotTradesToReview', () => {
  it('maps to ParsedTrade with positive costs and uppercase symbol', () => {
    const [r] = screenshotTradesToReview([row()]);
    expect(r.symbol).toBe('EURUSD.M');
    expect(r.commission).toBe('3.5');
    expect(r.swap).toBe('0.42');
    expect(r.fees).toBeUndefined();
    expect(r.entryDate).toBe('2026-08-14T09:12:00');
    expect(r.exitDate).toBe('2026-08-14T11:40:15');
    expect(r.keep).toBe(true);
    expect(r.lowConfidence).toBe(false);
  });
  it('flips a positive swap credit into a negative cost', () => {
    const [r] = screenshotTradesToReview([row({ swap: 1.2 })]);
    expect(r.swap).toBe('-1.2');
  });
  it('unticks and flags rows with no usable time', () => {
    const [r] = screenshotTradesToReview([row({ openTime: '', closeTime: '' })]);
    expect(r.keep).toBe(false);
    expect(r.lowConfidence).toBe(true);
    expect(r.date).toBe('');
  });
  it('falls back to open time when close time is missing', () => {
    const [r] = screenshotTradesToReview([row({ closeTime: '' })]);
    expect(r.exitDate).toBe('2026-08-14T09:12:00');
  });
  it('produces the right net P&L through buildImportedTrades', () => {
    const [r] = screenshotTradesToReview([row()]);
    const [t] = buildImportedTrades([r], { fileName: 'shot.png', accountId: 'a1', idPrefix: 'shot' });
    // 90 gross - 3.5 commission - 0.42 swap
    expect(t.pnl).toBeCloseTo(86.08, 5);
    expect(t.brokerPnL).toBe(90);
    expect(t.swap).toBe(0.42);
    expect(t.id.startsWith('shot-')).toBe(true);
    expect(t.entryTime.getFullYear()).toBe(2026);
  });
});
