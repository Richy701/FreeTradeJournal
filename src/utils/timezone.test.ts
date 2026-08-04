import { describe, it, expect } from 'vitest';
import { zonedTimeToUtc, BROKER_TIMEZONES } from './timezone';

// These assertions are absolute UTC instants, so they hold regardless of the
// TZ the test process runs in — that independence is the entire point of the
// fix (the bug was that stored epochs varied with the importing machine's TZ).
describe('zonedTimeToUtc', () => {
  it('converts MT5 server time (EEST, UTC+3 in summer) to true UTC', () => {
    const d = zonedTimeToUtc('2026-08-04T13:44:30', 'Europe/Athens');
    expect(d.toISOString()).toBe('2026-08-04T10:44:30.000Z');
  });

  it('handles the winter offset of the same zone (EET, UTC+2)', () => {
    const d = zonedTimeToUtc('2026-01-15T10:00:00', 'Europe/Athens');
    expect(d.toISOString()).toBe('2026-01-15T08:00:00.000Z');
  });

  it('converts US Central (Tradovate-style) wall-clock in DST', () => {
    const d = zonedTimeToUtc('2026-08-04T09:30:00', 'America/Chicago');
    expect(d.toISOString()).toBe('2026-08-04T14:30:00.000Z');
  });

  it('accepts a space separator and missing seconds', () => {
    const d = zonedTimeToUtc('2026-08-04 13:44', 'UTC');
    expect(d.toISOString()).toBe('2026-08-04T13:44:00.000Z');
  });

  it('passes non-naive strings through untouched (already have an offset)', () => {
    const d = zonedTimeToUtc('2026-08-04T10:44:30Z', 'Europe/Athens');
    expect(d.toISOString()).toBe('2026-08-04T10:44:30.000Z');
  });

  it('falls back to legacy local parsing on an invalid zone id', () => {
    const naive = '2026-08-04T13:44:30';
    const d = zonedTimeToUtc(naive, 'Not/AZone');
    expect(d.getTime()).toBe(new Date(naive).getTime());
  });

  it('every preset zone id is valid for Intl', () => {
    for (const z of BROKER_TIMEZONES) {
      if (!z.value) continue; // the "device" sentinel has no zone
      expect(() => new Intl.DateTimeFormat('en-US', { timeZone: z.value })).not.toThrow();
    }
  });
});
