import { describe, it, expect } from 'vitest';
import { calculateGrossPnl, getFuturesMultiplier, futuresBaseSymbol } from './pnl';

describe('getFuturesMultiplier', () => {
  it('resolves plain base symbols', () => {
    expect(getFuturesMultiplier('ES')).toBe(50);
    expect(getFuturesMultiplier('NQ')).toBe(20);
    expect(getFuturesMultiplier('MNQ')).toBe(2);
    expect(getFuturesMultiplier('MES')).toBe(5);
  });

  it('strips month/year contract codes', () => {
    expect(futuresBaseSymbol('MNQH6')).toBe('MNQ');
    expect(futuresBaseSymbol('ESU24')).toBe('ES');
    expect(getFuturesMultiplier('MNQH6')).toBe(2);
    expect(getFuturesMultiplier('ESU24')).toBe(50);
    expect(getFuturesMultiplier('CLZ25')).toBe(1000);
  });

  it('does not confuse micro symbols with their parent contract', () => {
    // MES must never resolve via substring "ES"
    expect(getFuturesMultiplier('MESM5')).toBe(5);
    expect(getFuturesMultiplier('MYMZ4')).toBe(0.5);
  });

  it('uses corrected metal/energy multipliers', () => {
    expect(getFuturesMultiplier('SI')).toBe(5000);
    expect(getFuturesMultiplier('SIL')).toBe(1000);
    expect(getFuturesMultiplier('HG')).toBe(25000);
    expect(getFuturesMultiplier('MCL')).toBe(100);
    expect(getFuturesMultiplier('NG')).toBe(10000);
  });

  it('falls back to 1 for unknown symbols', () => {
    expect(getFuturesMultiplier('UNKNOWN')).toBe(1);
  });
});

describe('calculateGrossPnl — futures', () => {
  it('multiplies by contract count (the historical bug)', () => {
    // 5 ES contracts, 10-point winner: 10 * $50 * 5 = $2,500
    expect(calculateGrossPnl({
      symbol: 'ES', market: 'futures', side: 'long',
      entryPrice: 5000, exitPrice: 5010, quantity: 5,
    })).toBe(2500);
  });

  it('handles shorts with sign flipped', () => {
    // 2 MNQ short, price rises 20 points: -20 * $2 * 2 = -$80
    expect(calculateGrossPnl({
      symbol: 'MNQ', market: 'futures', side: 'short',
      entryPrice: 18000, exitPrice: 18020, quantity: 2,
    })).toBe(-80);
  });

  it('resolves dated contract symbols', () => {
    expect(calculateGrossPnl({
      symbol: 'MNQH6', market: 'futures', side: 'long',
      entryPrice: 18000, exitPrice: 18100, quantity: 1,
    })).toBe(200);
  });
});

describe('calculateGrossPnl — forex', () => {
  it('computes standard USD-quote pairs per 100k lot', () => {
    // EURUSD 1 lot, +10 pips: 0.0010 * 100000 = $100
    expect(calculateGrossPnl({
      symbol: 'EURUSD', market: 'forex', side: 'long',
      entryPrice: 1.1000, exitPrice: 1.1010, quantity: 1,
    })).toBeCloseTo(100, 5);
  });

  it('scales with fractional lots', () => {
    expect(calculateGrossPnl({
      symbol: 'GBPUSD', market: 'forex', side: 'long',
      entryPrice: 1.2500, exitPrice: 1.2550, quantity: 0.1,
    })).toBeCloseTo(50, 5);
  });

  it('converts JPY-quote P&L to USD at the exit rate', () => {
    // USDJPY 1 lot, +50 pips (0.50): ¥50,000 / 150.50 ≈ $332.23
    expect(calculateGrossPnl({
      symbol: 'USDJPY', market: 'forex', side: 'long',
      entryPrice: 150.00, exitPrice: 150.50, quantity: 1,
    })).toBeCloseTo(50000 / 150.5, 2);
  });

  it('converts other non-USD-quote pairs at the exit rate', () => {
    // USDCAD 1 lot, +100 pips: C$1,000 / 1.36 ≈ $735.29 (was reported as $1,000 before)
    expect(calculateGrossPnl({
      symbol: 'USDCAD', market: 'forex', side: 'long',
      entryPrice: 1.3500, exitPrice: 1.3600, quantity: 1,
    })).toBeCloseTo(1000 / 1.36, 2);
  });

  it('uses real lot sizes for spot metals', () => {
    // XAUUSD 1 lot = 100oz; $10 move = $1,000 (was reported as $1,000,000 before)
    expect(calculateGrossPnl({
      symbol: 'XAUUSD', market: 'forex', side: 'long',
      entryPrice: 2300, exitPrice: 2310, quantity: 1,
    })).toBe(1000);
  });
});

describe('calculateGrossPnl — indices and overrides', () => {
  it('treats indices as $1/point per contract, scaled by quantity', () => {
    expect(calculateGrossPnl({
      symbol: 'US30', market: 'indices', side: 'long',
      entryPrice: 39000, exitPrice: 39050, quantity: 3,
    })).toBe(150);
  });

  it('customMultiplier overrides everything', () => {
    expect(calculateGrossPnl({
      symbol: 'ES', market: 'futures', side: 'long',
      entryPrice: 100, exitPrice: 110, quantity: 5, customMultiplier: 7,
    })).toBe(70);
  });
});
