import { describe, it, expect } from 'vitest';
import { buildImportedTrades, countFutureTrades, dedupeImportedTrades, detectMarketFromSymbol, futureImportMessage, planImport } from './import-trades';
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

  it('computes pnlPercentage instead of hardcoding 0', () => {
    const [t] = buildImportedTrades([baseTrade], opts);
    // MNQ futures: notional = 30220 × 2 (multiplier) × 1 contract = 60440;
    // 47.32 net / 60440 × 100 — same formula as manually entered trades
    expect(t.pnlPercentage).toBeCloseTo((47.32 / 60440) * 100, 4);
    expect(t.pnlPercentage).not.toBe(0);
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

describe('buildImportedTrades — broker timezone', () => {
  it('stores true UTC when the account has a broker timezone', () => {
    // MT5 server (EEST, UTC+3): wall-clock 13:44:30 is really 10:44:30 UTC.
    const [t] = buildImportedTrades([baseTrade], { ...opts, brokerTimezone: 'Europe/Athens' });
    expect(t.entryTime.toISOString()).toBe('2026-07-02T06:12:00.000Z');
    expect(t.exitTime.toISOString()).toBe('2026-07-02T06:13:00.000Z');
  });

  it('keeps legacy behavior byte-for-byte when no broker timezone is set', () => {
    const [t] = buildImportedTrades([baseTrade], opts);
    // Legacy contract: naive string interpreted in the importing machine's TZ.
    expect(t.entryTime.getTime()).toBe(new Date('2026-07-02T09:12:00').getTime());
    expect(t.exitTime.getTime()).toBe(new Date('2026-07-02T09:13:00').getTime());
  });

  it('survives a corrupt timezone value without breaking the import', () => {
    const [t] = buildImportedTrades([baseTrade], { ...opts, brokerTimezone: 'Garbage/Zone' });
    expect(t.entryTime.getTime()).toBe(new Date('2026-07-02T09:12:00').getTime());
  });
});

describe('re-import after a cost-handling change', () => {
  // Trades imported before the Sep 2026 "Net P/L" fix were saved with
  // commission taken off twice. Re-importing the same file now yields a
  // different P&L; the duplicate check must still recognise the trades.
  it('skips trades that match on everything but P&L', () => {
    const [before] = buildImportedTrades([baseTrade], opts);
    const [after] = buildImportedTrades([{ ...baseTrade, pnlIsNet: true }], opts);
    expect(after.pnl).not.toBeCloseTo(before.pnl, 2);
    const { newTrades, skippedCount } = dedupeImportedTrades([before], [after]);
    expect(newTrades).toHaveLength(0);
    expect(skippedCount).toBe(1);
  });
});

describe('planImport (what the preview shows)', () => {
  it('reports net P&L and the duplicates the import will skip', () => {
    const second = { ...baseTrade, entryDate: '2026-07-02T10:00:00', exitDate: '2026-07-02T10:05:00', pnl: '20' };
    const [existing] = buildImportedTrades([baseTrade], opts);
    const plan = planImport([baseTrade, second], [existing], opts);
    expect(plan.built).toHaveLength(2); // index-aligned with the parsed rows
    expect(plan.skippedCount).toBe(1);
    expect(plan.newTrades).toHaveLength(1);
    // 20 gross - 0.78 commission: the preview total is what gets saved
    expect(plan.newTrades[0].pnl).toBeCloseTo(19.22, 2);
  });
});

describe('planImport — trades dated after the import (wrong broker time zone)', () => {
  // Christian, Sep 2026: Tradovate file in Jakarta wall-clock, account set to
  // US Central, every trade stored 12h late. The file was imported minutes
  // after the last trade closed, so the converted times sat hours in the future.
  const jakartaWall = { ...baseTrade, entryDate: '2026-09-23T21:30:00', exitDate: '2026-09-23T21:53:00' };
  const importedAt = Date.UTC(2026, 8, 23, 15, 16); // 22:16 Jakarta, 23 minutes after the close

  it('blocks when the chosen zone pushes trades past the import time', () => {
    const plan = planImport([jakartaWall], [], { ...opts, brokerTimezone: 'America/Chicago' }, importedAt);
    expect(plan.futureTradeCount).toBe(1);
    expect(plan.blockedReason).toContain('closes in the future');
    expect(plan.blockedReason).toContain('US Central');
    expect(plan.blockedReason).toContain('Same as this device');
  });

  it('passes when the zone matches the file', () => {
    const plan = planImport([jakartaWall], [], { ...opts, brokerTimezone: 'Asia/Jakarta' }, importedAt);
    expect(plan.futureTradeCount).toBe(0);
    expect(plan.blockedReason).toBeNull();
  });

  it('tolerates a device clock that is a few minutes off', () => {
    const exit = new Date(importedAt + 10 * 60 * 1000);
    expect(countFutureTrades([{ exitTime: exit }], importedAt)).toBe(0);
    expect(countFutureTrades([{ exitTime: new Date(importedAt + 60 * 60 * 1000) }], importedAt)).toBe(1);
  });

  it('gives a clock/date hint when no zone is set', () => {
    expect(futureImportMessage(2)).toContain("your computer's clock");
    expect(futureImportMessage(2)).toContain('2 trades');
  });
});
