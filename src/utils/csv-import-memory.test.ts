import { describe, it, expect, vi, beforeEach } from 'vitest';
import { headerSignature, rememberMapping, recallMapping, REQUIRED_ROLES } from './csv-import-memory';

// Analytics is a side-effect we don't exercise here; stub it out.
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    _map: map,
  };
}

// A NinjaTrader-style header + a mapping the user would confirm in the dialog.
const HEADERS = ['Instrument', 'Account', 'Market pos.', 'Qty', 'Entry time', 'Exit time', 'Entry price', 'Exit price', 'Profit', 'Commission'];
const MAPPING: Record<string, number> = {
  symbol: 0, side: 2, quantity: 3, openTime: 4, closeTime: 5, openPrice: 6, closePrice: 7, pnl: 8,
};

describe('csv-import-memory', () => {
  let storage: ReturnType<typeof fakeStorage>;
  beforeEach(() => { storage = fakeStorage(); });

  it('headerSignature is order-independent and case/space-insensitive', () => {
    const a = headerSignature(HEADERS);
    const shuffled = [...HEADERS].reverse().map(h => ` ${h.toUpperCase()} `);
    expect(headerSignature(shuffled)).toBe(a);
  });

  it('recall returns null when nothing is remembered', () => {
    expect(recallMapping(storage, HEADERS)).toBeNull();
  });

  it('round-trips a confirmed mapping', () => {
    rememberMapping(storage, HEADERS, MAPPING);
    expect(recallMapping(storage, HEADERS)).toEqual(MAPPING);
  });

  it('re-resolves column names even if the export reorders columns', () => {
    rememberMapping(storage, HEADERS, MAPPING);
    // Same columns, different order — indices must be recomputed, not replayed.
    const reordered = ['Profit', 'Instrument', 'Market pos.', 'Qty', 'Entry price', 'Exit price', 'Entry time', 'Exit time', 'Account', 'Commission'];
    const recalled = recallMapping(storage, reordered);
    expect(recalled).not.toBeNull();
    expect(reordered[recalled!.symbol]).toBe('Instrument');
    expect(reordered[recalled!.side]).toBe('Market pos.');
    expect(reordered[recalled!.pnl]).toBe('Profit');
  });

  it('returns null if a required column disappeared (falls back to manual mapping)', () => {
    rememberMapping(storage, HEADERS, MAPPING);
    // Drop "Market pos." (side) — signature differs, so no match, but assert the
    // required-role guard directly with a same-signature-minus behaviour:
    const remembered = recallMapping(storage, HEADERS.map(h => h === 'Market pos.' ? 'Market pos.' : h));
    expect(remembered).toEqual(MAPPING); // sanity: unchanged still matches

    // A stored mapping whose side column is absent must not be usable.
    const s2 = fakeStorage();
    rememberMapping(s2, HEADERS, MAPPING);
    // Hand-corrupt: replace the side column name so it can't resolve.
    const raw = JSON.parse(s2._map.get('csvImportMappings')!);
    const sig = headerSignature(HEADERS);
    raw[sig].columns.side = 'NonexistentColumn';
    s2._map.set('csvImportMappings', JSON.stringify(raw));
    expect(recallMapping(s2, HEADERS)).toBeNull();
  });

  it('exposes the required roles the guard checks', () => {
    expect(REQUIRED_ROLES).toContain('side');
    expect(REQUIRED_ROLES).toContain('pnl');
  });
});
