import { describe, it, expect } from 'vitest';
import {
  getTradeDefaults,
  rememberTradeDefaults,
  toNumericDefault,
  FALLBACK_TRADE_DEFAULTS,
} from './trade-defaults';

/** Minimal stand-in for the UserStorage hook surface the helper uses. */
function makeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe('trade defaults', () => {
  it('falls back to forex before anything is logged', () => {
    expect(getTradeDefaults(makeStorage(), 'acc-1')).toEqual(FALLBACK_TRADE_DEFAULTS);
  });

  it('remembers the last trade so the next one opens on the same instrument', () => {
    const storage = makeStorage();
    rememberTradeDefaults(storage, 'acc-1', {
      market: 'futures',
      symbol: 'MNQ',
      lotSize: '2',
      commission: '1.24',
      fees: '0.5',
    });

    expect(getTradeDefaults(storage, 'acc-1')).toEqual({
      market: 'futures',
      symbol: 'MNQ',
      lotSize: '2',
      commission: '1.24',
      fees: '0.5',
    });
  });

  it('keeps defaults separate per account', () => {
    const storage = makeStorage();
    rememberTradeDefaults(storage, 'futures-acc', { market: 'futures', symbol: 'ES' });
    rememberTradeDefaults(storage, 'forex-acc', { market: 'forex', symbol: 'EURUSD' });

    expect(getTradeDefaults(storage, 'futures-acc').symbol).toBe('ES');
    expect(getTradeDefaults(storage, 'forex-acc').symbol).toBe('EURUSD');
  });

  it('buckets trades logged without an account, and does not leak them to accounts', () => {
    const storage = makeStorage();
    rememberTradeDefaults(storage, null, { market: 'futures', symbol: 'MES' });

    expect(getTradeDefaults(storage, null).symbol).toBe('MES');
    expect(getTradeDefaults(storage, 'acc-1')).toEqual(FALLBACK_TRADE_DEFAULTS);
  });

  it('keeps previously remembered fields when a form omits them', () => {
    const storage = makeStorage();
    rememberTradeDefaults(storage, 'acc-1', {
      market: 'futures',
      symbol: 'MNQ',
      lotSize: '2',
      commission: '1.24',
      fees: '0.5',
    });
    // The quick-add forms have no commission/fees inputs
    rememberTradeDefaults(storage, 'acc-1', { market: 'futures', symbol: 'MES', lotSize: '3' });

    expect(getTradeDefaults(storage, 'acc-1')).toEqual({
      market: 'futures',
      symbol: 'MES',
      lotSize: '3',
      commission: '1.24',
      fees: '0.5',
    });
  });

  it('ignores corrupt or unexpected stored values', () => {
    expect(getTradeDefaults(makeStorage({ lastTradeDefaults: 'not json' }), 'acc-1'))
      .toEqual(FALLBACK_TRADE_DEFAULTS);
    expect(getTradeDefaults(makeStorage({ lastTradeDefaults: '[1,2]' }), 'acc-1'))
      .toEqual(FALLBACK_TRADE_DEFAULTS);
    expect(
      getTradeDefaults(
        makeStorage({ lastTradeDefaults: JSON.stringify({ 'acc-1': { market: 'options', symbol: 5 } }) }),
        'acc-1',
      ),
    ).toEqual({ market: 'forex', symbol: '', lotSize: '', commission: '', fees: '' });
  });

  it('reads numeric form fields with a fallback for blanks', () => {
    expect(toNumericDefault('2', 1)).toBe(2);
    expect(toNumericDefault('', 1)).toBe(1);
    expect(toNumericDefault('abc', 0)).toBe(0);
  });
});
