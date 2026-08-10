import { describe, it, expect } from 'vitest';
import { parseCSV, parseCSVWithMappings } from './csv-parser';
import { dedupeImportedTrades } from './import-trades';

// Regression suite for the 2026-08-10 "Orders history.csv" incident: a
// TopstepX-style per-order export fell through to manual mapping, the price
// column got mapped to entry, exit AND P&L (making every "trade" worth the
// MNQ contract price, ~$29,400), and duplicate rows inside the file were
// never deduped. Real stored outcome: 40 trades, +$1,177,280 "P&L".

const ORDERS_CSV = [
  'Timestamp,Contract,Side,Qty,Price,Status',
  '2026-08-06 10:00:00,MNQU26,Buy,1,29400.00,Filled',
  '2026-08-06 10:10:00,MNQU26,Sell,1,29420.00,Filled',
  '2026-08-06 11:00:00,MNQU26,Sell,2,29450.00,Filled',
  '2026-08-06 11:30:00,MNQU26,Buy,2,29430.00,Filled',
  '2026-08-06 12:00:00,MNQU26,Buy,1,29500.00,Cancelled',
].join('\n');

describe('generic orders-export detection (parseCSV)', () => {
  it('FIFO-pairs an order-per-row export instead of falling through', () => {
    const result = parseCSV(ORDERS_CSV, { fileName: 'Orders history.csv' });
    expect(result.success).toBe(true);
    expect(result.trades).toHaveLength(2);

    // Long: buy 1 @ 29400 -> sell 1 @ 29420 = +20pts x $2 (MNQ) = $40
    const long = result.trades.find(t => t.side === 'long')!;
    expect(long.symbol).toBe('MNQU26');
    expect(parseFloat(long.entryPrice)).toBe(29400);
    expect(parseFloat(long.exitPrice)).toBe(29420);
    expect(parseFloat(long.pnl)).toBeCloseTo(40);

    // Short: sell 2 @ 29450 -> buy 2 @ 29430 = +20pts x 2 x $2 = $80
    const short = result.trades.find(t => t.side === 'short')!;
    expect(parseFloat(short.entryPrice)).toBe(29450);
    expect(parseFloat(short.exitPrice)).toBe(29430);
    expect(parseFloat(short.pnl)).toBeCloseTo(80);
  });

  it('ignores cancelled/rejected orders', () => {
    // The cancelled 12:00 buy must not open a phantom position.
    const result = parseCSV(ORDERS_CSV);
    const entries = result.trades.map(t => parseFloat(t.entryPrice));
    expect(entries).not.toContain(29500);
  });

  it('does not hijack files that carry their own P&L column', () => {
    const withPnl = [
      'Symbol,Side,Open Price,Close Price,Quantity,PnL,Open Time',
      'EURUSD,buy,1.1000,1.1050,1,50,2026-08-06 10:00:00',
    ].join('\n');
    const result = parseCSV(withPnl);
    expect(result.success).toBe(true);
    expect(result.trades).toHaveLength(1);
    expect(parseFloat(result.trades[0].pnl)).toBe(50);
  });
});

describe('mapped-import price-as-pnl guard (parseCSVWithMappings)', () => {
  it('refuses an import where every row has pnl === entry === exit', () => {
    // Simulates mapping the single Price column into entry, exit AND pnl.
    const result = parseCSVWithMappings(ORDERS_CSV, {
      symbol: 1, side: 2, openPrice: 4, closePrice: 4, quantity: 3, pnl: 4,
      openTime: 0, closeTime: -1, commission: -1, fees: -1,
    });
    expect(result.success).toBe(false);
    expect(result.trades).toHaveLength(0);
    expect(result.errors.join(' ')).toMatch(/price column/i);
  });
});

describe('intra-batch duplicate rows (dedupeImportedTrades)', () => {
  it('drops identical rows within one import batch', () => {
    const t = {
      symbol: 'MNQU26', side: 'long', entryPrice: 29400, exitPrice: 29420,
      lotSize: 1, pnl: 40,
      entryTime: new Date('2026-08-06T10:00:00Z'), exitTime: new Date('2026-08-06T10:10:00Z'),
    };
    const { newTrades, skippedCount } = dedupeImportedTrades([], [{ ...t }, { ...t }]);
    expect(newTrades).toHaveLength(1);
    expect(skippedCount).toBe(1);
  });
});
