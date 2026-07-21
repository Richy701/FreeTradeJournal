import { describe, it, expect } from 'vitest';
import { buildImportedTrades, detectMarketFromSymbol } from './import-trades';
import type { ParsedTrade } from './csv-parser';

const baseTrade: ParsedTrade = {
  symbol: 'MNQ',
  side: 'long',
  entryPrice: '30220',
  exitPrice: '30245',
  quantity: '1',
  pnl: '48.10',
  date: '2026-07-02T09:12:00',
  entryDate: '2026-07-02T09:12:00',
  exitDate: '2026-07-02T09:13:00',
  commission: '0.78',
};

const opts = { fileName: 'test.csv', accountId: 'acct1' };

describe('buildImportedTrades — commission handling', () => {
  it('subtracts costs from GROSS broker P&L (default)', () => {
    const [t] = buildImportedTrades([baseTrade], opts);
    // 48.10 gross - 0.78 commission = 47.32 net; gross preserved as brokerPnL
    expect(t.pnl).toBeCloseTo(47.32, 2);
    expect(t.brokerPnL).toBeCloseTo(48.1, 2);
  });

  it('does NOT re-subtract commission when P&L is already net (NinjaTrader)', () => {
    const [t] = buildImportedTrades([{ ...baseTrade, pnlIsNet: true }], opts);
    // Profit is already net → net stays 48.10, gross reconstructed as 48.88
    expect(t.pnl).toBeCloseTo(48.1, 2);
    expect(t.brokerPnL).toBeCloseTo(48.88, 2);
    // Edit-time invariant: net === brokerPnL - commission - fees
    expect(t.brokerPnL - t.commission - t.fees).toBeCloseTo(t.pnl, 2);
  });

  it('keeps a net loss negative (no double-subtract flipping it)', () => {
    const [t] = buildImportedTrades([{ ...baseTrade, pnl: '-75.90', pnlIsNet: true }], opts);
    expect(t.pnl).toBeCloseTo(-75.9, 2);
    expect(t.brokerPnL - t.commission - t.fees).toBeCloseTo(t.pnl, 2);
  });
});

describe('detectMarketFromSymbol', () => {
  it('classifies plain stock tickers as indices, not forex', () => {
    // DAS/stock imports (Stella's SPCX/TSLA case) were all labeled FOREX
    expect(detectMarketFromSymbol('TSLA')).toBe('indices');
    expect(detectMarketFromSymbol('SPCX')).toBe('indices');
    expect(detectMarketFromSymbol('AAPL')).toBe('indices');
    expect(detectMarketFromSymbol('F')).toBe('indices');
  });

  it('keeps known forex pairs and currency-pair shapes as forex', () => {
    expect(detectMarketFromSymbol('EURUSD')).toBe('forex');
    expect(detectMarketFromSymbol('EUR/USD')).toBe('forex');
    expect(detectMarketFromSymbol('EURUSD.a')).toBe('forex'); // broker suffix
    expect(detectMarketFromSymbol('USDHUF')).toBe('forex');   // exotic, not in explicit list
    expect(detectMarketFromSymbol('XAUUSD')).toBe('forex');   // spot gold stays on forex lot math
  });

  it('keeps futures and index ETFs unchanged', () => {
    expect(detectMarketFromSymbol('MNQU5')).toBe('futures');
    expect(detectMarketFromSymbol('ES')).toBe('futures');
    expect(detectMarketFromSymbol('SPY')).toBe('indices');
  });
});
