import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
const suggestMock = vi.fn();
vi.mock('@/lib/csv-ai-mapping', () => ({ suggestCsvMappingAI: (...args: any[]) => suggestMock(...args) }));

import { rescueFailedImport } from './csv-import-flow';
import { rememberMapping } from './csv-import-memory';

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
  };
}

// A NinjaTrader-style export (unknown to auto-detect in this test — we call
// rescue directly). Columns match the AI mapping returned below.
const CONTENT = [
  'Instrument,Account,Market pos.,Qty,Entry time,Exit time,Entry price,Exit price,Profit,Commission',
  'MNQ SEP26,DEMO,Long,1,7/2/2026 9:12,7/2/2026 9:13,30220,30245,$48.10 ,$0.78 ',
].join('\n');
const HEADERS = ['Instrument', 'Account', 'Market pos.', 'Qty', 'Entry time', 'Exit time', 'Entry price', 'Exit price', 'Profit', 'Commission'];
const AI_MAPPING = {
  mapping: {
    symbol: 'Instrument', side: 'Market pos.', openPrice: 'Entry price', closePrice: 'Exit price',
    quantity: 'Qty', pnl: 'Profit', openTime: 'Entry time', closeTime: 'Exit time', commission: 'Commission', fees: null,
  },
  dayFirst: false,
  confidence: 0.95,
};

const base = { content: CONTENT, headers: HEADERS, source: 'test' };

describe('rescueFailedImport — Pro-gated LLM mapping', () => {
  beforeEach(() => { suggestMock.mockReset(); });

  it('free user: never calls the LLM, returns manual', async () => {
    const out = await rescueFailedImport({ ...base, storage: fakeStorage(), isPro: false, isDemo: false });
    expect(out.kind).toBe('manual');
    expect(suggestMock).not.toHaveBeenCalled();
  });

  it('demo user (even if Pro): never calls the LLM', async () => {
    const out = await rescueFailedImport({ ...base, storage: fakeStorage(), isPro: true, isDemo: true });
    expect(out.kind).toBe('manual');
    expect(suggestMock).not.toHaveBeenCalled();
  });

  it('Pro user: LLM maps the file, parses, and is remembered for next time', async () => {
    suggestMock.mockResolvedValue(AI_MAPPING);
    const storage = fakeStorage();
    const out = await rescueFailedImport({ ...base, storage, isPro: true, isDemo: false });
    expect(suggestMock).toHaveBeenCalledOnce();
    expect(out.kind).toBe('parsed');
    if (out.kind === 'parsed') {
      expect(out.via).toBe('ai');
      expect(out.result.trades.length).toBe(1);
    }
    // Persisted, so a second (free) import of the same shape hits memory, no LLM.
    suggestMock.mockClear();
    const again = await rescueFailedImport({ ...base, storage, isPro: false, isDemo: false });
    expect(again.kind).toBe('parsed');
    if (again.kind === 'parsed') expect(again.via).toBe('memory');
    expect(suggestMock).not.toHaveBeenCalled();
  });

  it('Pro user: unusable LLM mapping (missing required role) falls back to manual', async () => {
    suggestMock.mockResolvedValue({ ...AI_MAPPING, mapping: { ...AI_MAPPING.mapping, side: null } });
    const out = await rescueFailedImport({ ...base, storage: fakeStorage(), isPro: true, isDemo: false });
    expect(out.kind).toBe('manual');
  });

  it('memory takes priority over the LLM for any user', async () => {
    const storage = fakeStorage();
    rememberMapping(storage, HEADERS, {
      symbol: 0, side: 2, quantity: 3, openTime: 4, closeTime: 5, openPrice: 6, closePrice: 7, pnl: 8,
    });
    const out = await rescueFailedImport({ ...base, storage, isPro: true, isDemo: false });
    expect(out.kind).toBe('parsed');
    if (out.kind === 'parsed') expect(out.via).toBe('memory');
    expect(suggestMock).not.toHaveBeenCalled();
  });
});
