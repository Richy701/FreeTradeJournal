import { describe, it, expect } from 'vitest';
import { parseCSV, findColumnIndex } from './csv-parser';

describe('findColumnIndex', () => {
  it('prefers an exact header match over a substring collision', () => {
    // "Exit" must not match the "ExitedAt" timestamp column that precedes "ExitPrice".
    const headers = ['EnteredAt', 'ExitedAt', 'EntryPrice', 'ExitPrice'];
    const closePrice = findColumnIndex(headers, ['Close Price', 'Exit Price', 'Close', 'Exit', 'ExitPrice']);
    expect(headers[closePrice]).toBe('ExitPrice');
  });

  it('still falls back to substring matching when there is no exact match', () => {
    const headers = ['Net P/L'];
    expect(findColumnIndex(headers, ['PnL', 'P&L', 'Net P/L'])).toBe(0);
  });
});

describe('parseCSV — Topstep Trades export', () => {
  // Native Topstep "Trades" layout: timestamps BEFORE prices, plus a Fees column.
  // Previously this required manually renaming columns to import correctly.
  const csv = [
    'Id,ContractName,EnteredAt,ExitedAt,EntryPrice,ExitPrice,Fees,PnL,Size,Type',
    '1,MNQ,01/28/2026 14:30:00,01/28/2026 15:05:00,21450.25,21475.75,1.34,51.00,1,Long',
    '2,NQ,01/29/2026 09:31:00,01/29/2026 09:48:00,21500.00,21480.00,2.68,-400.00,1,Short',
  ].join('\n');

  it('imports natively without renaming columns', () => {
    const r = parseCSV(csv);
    expect(r.success).toBe(true);
    expect(r.summary.successfulParsed).toBe(2);
    expect(r.summary.failed).toBe(0);
  });

  it('maps entry/exit prices, not the timestamp columns', () => {
    const [a, b] = parseCSV(csv).trades;
    expect(a.entryPrice).toBe('21450.25');
    expect(a.exitPrice).toBe('21475.75');
    expect(b.entryPrice).toBe('21500.00');
    expect(b.exitPrice).toBe('21480.00');
  });

  it('normalizes side and pulls the Fees column into the fees field', () => {
    const [a, b] = parseCSV(csv).trades;
    expect(a.side).toBe('long');
    expect(b.side).toBe('short');
    expect(a.fees).toBe('1.34');
    expect(b.fees).toBe('2.68');
  });

  it('keeps separate entry and exit timestamps', () => {
    const [a] = parseCSV(csv).trades;
    expect(a.entryDate).toBe('2026-01-28T14:30:00');
    expect(a.exitDate).toBe('2026-01-28T15:05:00');
  });
});

describe('parseCSV — Topstep Trades export with separate Fees and Commissions', () => {
  // Real Topstep "Trades Export" layout: GROSS PnL plus distinct Fees and
  // Commissions columns. Both must be captured separately so net = PnL − both.
  const csv = [
    'Id,ContractName,Entry Time,Exit Time,Entry,Exit,Fees,PnL,Size,Type,TradeDay,TradeDuration,Commissions',
    '1,NQM6,06/03/2026 08:51:06 -05:00,06/03/2026 08:51:37 -05:00,"$30,562.25 ","$30,578.25 ",14,1600,5,Long,06/03/2026 08:51:06 -05:00,00:30.4,5',
    '2,NQM6,06/05/2026 08:44:14 -05:00,06/05/2026 08:44:22 -05:00,"$29,946.00 ","$29,956.00 ",14,-1000,5,Short,06/05/2026 08:44:14 -05:00,00:08.2,5',
  ].join('\n');

  it('reads Fees and Commissions as distinct fields without dropping either', () => {
    const [a, b] = parseCSV(csv).trades;
    expect(a.commission).toBe('5');
    expect(a.fees).toBe('14');
    expect(b.commission).toBe('5');
    expect(b.fees).toBe('14');
  });

  it('parses gross PnL and prices through currency formatting', () => {
    const [a] = parseCSV(csv).trades;
    expect(a.pnl).toBe('1600');
    expect(a.side).toBe('long');
    expect(a.entryPrice).toBe('30562.25');
    expect(a.exitPrice).toBe('30578.25');
  });
});
