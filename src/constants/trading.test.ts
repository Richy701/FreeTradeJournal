import { describe, it, expect } from 'vitest';
import {
  MARKET_INSTRUMENTS,
  MARKET_INSTRUMENT_GROUPS,
  instrumentGroupsFor,
  type MarketType,
} from './trading';

const MARKETS: MarketType[] = ['forex', 'futures', 'indices'];

const symbolsIn = (market: MarketType) =>
  MARKET_INSTRUMENT_GROUPS[market].flatMap(g => g.instruments.map(i => i.symbol));

describe('instrument lists', () => {
  // The Dashboard quick add and the calendar used a short list from this file
  // while TradeLog had its own longer one, so a futures trader could pick MNQ
  // in one form and not the others.
  it('offers the micro futures every futures trader actually uses', () => {
    for (const symbol of ['MNQ', 'MES', 'MYM', 'M2K']) {
      expect(symbolsIn('futures')).toContain(symbol);
    }
  });

  it('keeps both index CFDs and index ETFs selectable', () => {
    const indices = symbolsIn('indices');
    expect(indices).toContain('SPX500');
    expect(indices).toContain('SPY');
  });

  it('has no duplicate symbols within a market', () => {
    for (const market of MARKETS) {
      const symbols = symbolsIn(market);
      expect(new Set(symbols).size).toBe(symbols.length);
    }
  });

  it('keeps the flat list in step with the groups', () => {
    for (const market of MARKETS) {
      expect([...MARKET_INSTRUMENTS[market]]).toEqual(symbolsIn(market));
    }
  });
});

describe('instrumentGroupsFor', () => {
  it('returns the plain groups for a symbol that is already listed', () => {
    expect(instrumentGroupsFor('futures', 'MNQ')).toEqual(MARKET_INSTRUMENT_GROUPS.futures);
  });

  it('returns the plain groups when no symbol is given', () => {
    expect(instrumentGroupsFor('forex')).toEqual(MARKET_INSTRUMENT_GROUPS.forex);
  });

  // Imported trades carry any ticker (TSLA, SPCX), and remembered defaults can
  // outlive a list change. Without this the field renders blank and the trade
  // saves with no instrument.
  it('adds an unlisted symbol so it stays selectable', () => {
    const groups = instrumentGroupsFor('indices', 'TSLA');
    expect(groups[0].instruments).toEqual([{ symbol: 'TSLA' }]);
    expect(groups.slice(1)).toEqual(MARKET_INSTRUMENT_GROUPS.indices);
  });
});
