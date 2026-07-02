import { describe, it, expect } from 'vitest';
import { parseCSV, findColumnIndex, parseCSVHeaders } from './csv-parser';

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

describe('parseCSV — Tradovate Trades / Performance export', () => {
  // Real Tradovate "Trades" export: one row per completed round-trip, with no
  // Side column (direction implied by which leg filled first) and P&L already
  // realized in accounting format ("$(400.00)" = a $400 loss).
  const csv = [
    'symbol,_priceFormat,_priceFormatType,_tickSize,buyFillId,sellFillId,qty,buyPrice,sellPrice,pnl,boughtTimestamp,soldTimestamp,duration',
    'MNQM6,-2,0,0.25,537862110007,537862110018,5,28531.75,28491.75,$(400.00),06/10/2026 16:00:05,06/10/2026 16:00:29,24sec',
    'MNQM6,-2,0,0.25,537862110155,537862110184,5,29262.00,29382.00,"$1,200.00",06/12/2026 09:45:49,06/12/2026 09:57:07,11min 18sec',
  ].join('\n');

  it('imports the performance export without manual column mapping', () => {
    const r = parseCSV(csv);
    expect(r.success).toBe(true);
    expect(r.summary.successfulParsed).toBe(2);
    expect(r.summary.failed).toBe(0);
  });

  it('parses accounting-style P&L (parentheses = loss, $ and commas stripped)', () => {
    const [a, b] = parseCSV(csv).trades;
    expect(a.pnl).toBe('-400.00');
    expect(b.pnl).toBe('1200.00');
  });

  it('derives side from leg order and maps entry/exit prices accordingly', () => {
    const [a] = parseCSV(csv).trades;
    expect(a.side).toBe('long'); // bought before sold
    expect(a.entryPrice).toBe('28531.750000');
    expect(a.exitPrice).toBe('28491.750000');
    expect(a.entryDate).toBe('2026-06-10T16:00:05');
    expect(a.exitDate).toBe('2026-06-10T16:00:29');
  });
});

describe('parseCSV — NinjaTrader Grid (Trade Performance) export', () => {
  // NinjaTrader's "Trades" grid export: one row per completed round-trip. The
  // side lives in a "Market pos." column (Long/Short), Profit uses accounting
  // negatives ("($75.90)" = a loss), and the file ends with blank separator rows.
  const csv = [
    'Instrument,Account,Market pos.,Qty,Entry time,Exit time,Entry price,Exit price,Profit,Commission',
    'MNQ SEP26,DEMO6557236,Long,1,7/2/2026 9:12,7/2/2026 9:13,30220,30245,$48.10 ,$0.78 ',
    'MNQ SEP26,DEMO6557236,Long,1,7/2/2026 9:23,7/2/2026 9:23,30123.75,30086.75,($75.90),$0.78 ',
    ',,,,,,,,,',
    ',,,,,,,,,',
  ].join('\n');

  it('imports without manual mapping and ignores trailing blank rows', () => {
    const r = parseCSV(csv);
    expect(r.success, `errors: ${r.errors.join('; ')}`).toBe(true);
    expect(r.summary.successfulParsed).toBe(2);
    expect(r.summary.failed).toBe(0);
  });

  it('maps "Market pos." to side and honors accounting-negative P&L', () => {
    const [win, loss] = parseCSV(csv).trades;
    expect(win.side).toBe('long');
    expect(win.pnl).toBe('48.1');
    expect(loss.side).toBe('long');
    expect(loss.pnl).toBe('-75.9'); // ($75.90) is a loss, not a gain
  });
});

describe('parseCSV — Tradovate Orders History export', () => {
  // Real Tradovate "Orders History" export: one row per ORDER (including
  // Canceled working orders), with the leading "orderId" column and no
  // open/close-price or P&L column names the generic parser recognises. A blank
  // cell in the first data row previously fooled findStandardHeaderRow into
  // treating that data row as the header, so the real header (and the Tradovate
  // detector) never ran. Filled rows must pair into completed trades.
  const csv = [
    'orderId,Account,Order ID,B/S,Contract,Product,Product Description,avgPrice,filledQty,Fill Time,lastCommandId,Status,_priceFormat,_priceFormatType,_tickSize,spreadDefinitionId,Version ID,Timestamp,Date,Quantity,Text,Type,Limit Price,Stop Price,decimalLimit,decimalStop,Filled Qty,Avg Fill Price,decimalFillAvg,Venue,Notional Value,Currency',
    '537862110004,TDFYSL50309938221,537862110004, Buy,MNQM6,MNQ,Micro E-mini NASDAQ-100,28531.75,5,06/10/2026 16:00:05,537862110004, Filled,-2,0,0.25,,537862110004,06/10/2026 16:00:04,6/10/26,5,Chart, Market,,,,,5,28531.75,28531.75,,"285,317.50",USD',
    '537862110015,TDFYSL50309938221,537862110015, Sell,MNQM6,MNQ,Micro E-mini NASDAQ-100,28491.75,5,06/10/2026 16:00:29,537862110015, Filled,-2,0,0.25,,537862110015,06/10/2026 16:00:29,6/10/26,5,multibracket, Market,,,,,5,28491.75,28491.75,,"284,917.50",USD',
    '537862110026,TDFYSL50309938221,537862110026, Buy,MNQM6,MNQ,Micro E-mini NASDAQ-100,,,,537862110036, Canceled,-2,0,0.25,,537862110036,06/10/2026 16:00:29,6/10/26,5,multibracket, Limit,27891.75,,27891.75,,,,,,,USD',
  ].join('\n');

  it('detects the Orders History layout despite blank cells in the first data row', () => {
    const r = parseCSV(csv);
    expect(r.success).toBe(true);
    expect(r.trades).toHaveLength(1); // one Buy+Sell round-trip; Canceled order ignored
    expect(r.summary.failed).toBe(0);
  });

  it('pairs the filled fills into a long trade with multiplier-aware P&L', () => {
    const [t] = parseCSV(csv).trades;
    expect(t.symbol).toBe('MNQM6');
    expect(t.side).toBe('long'); // bought then sold
    expect(t.entryPrice).toBe('28531.750000');
    expect(t.exitPrice).toBe('28491.750000');
    expect(t.quantity).toBe('5');
    expect(t.pnl).toBe('-400.00'); // (28491.75 - 28531.75) * 5 * 2 (MNQ multiplier)
  });
});

describe('parseCSV — MT5 / IC Markets position history', () => {
  // Real IC Markets "Mt5 Position History List" shape: two title rows above the
  // header, each position split into an opening + closing leg sharing a Position
  // id, both prices in the single "Open Price" column, profit on the close leg.
  const csv = [
    'Report,,,,,,,,',
    'Name: Mt5 Position History List ,Produced At: 17/06/2026 19:49,,,,,,,',
    'Symbol,Account Number,Position,Position Status,Date Time,Transaction Type,Trade Volume Lots,Open Price,Profit',
    'XAUUSD    ,7390495,4272445503,Closed,3/2/2026 1:47:41 AM,Trade Buy In,0.01,5385.06,0',
    'XAUUSD    ,7390495,4272445503,Closed,3/2/2026 2:01:35 AM,Trade Sell Out,0.01,5377.31,-5.78',
    'XAUUSD    ,7390495,4299999999,Closed,5/14/2026 12:52:45 PM,Trade Sell In,0.02,5400.00,0',
    'XAUUSD    ,7390495,4299999999,Closed,5/14/2026 1:42:02 PM,Trade Buy Out,0.02,5390.00,20.00',
  ].join('\n');

  it('skips the preamble and pairs two legs into one trade per position', () => {
    const r = parseCSV(csv);
    expect(r.success).toBe(true);
    expect(r.trades).toHaveLength(2);
    expect(r.summary.successfulParsed).toBe(2);
  });

  it('derives side, entry/exit price, lots and pnl from the paired legs', () => {
    const [long, short] = parseCSV(csv).trades;
    expect(long.symbol).toBe('XAUUSD');
    expect(long.side).toBe('long');
    expect(long.entryPrice).toBe('5385.060000');
    expect(long.exitPrice).toBe('5377.310000');
    expect(long.quantity).toBe('0.01');
    expect(long.pnl).toBe('-5.78');

    expect(short.side).toBe('short');
    expect(short.entryPrice).toBe('5400.000000');
    expect(short.exitPrice).toBe('5390.000000');
    expect(short.pnl).toBe('20.00');
  });

  it('parses AM/PM timestamps without collapsing PM into the AM hour', () => {
    const short = parseCSV(csv).trades[1];
    expect(short.entryDate).toBe('2026-05-14T12:52:45');
    expect(short.exitDate).toBe('2026-05-14T13:42:02');
  });
});

describe('parseCSV — cross-broker robustness', () => {
  it('maps B/S single-letter sides correctly (B = long, not short)', () => {
    const csv = [
      'Symbol,Side,Open Price,Close Price,Volume,Profit,Open Time',
      'EURUSD,B,1.0850,1.0900,1,50,2026-01-15 10:00:00',
      'EURUSD,S,1.0900,1.0850,1,50,2026-01-16 10:00:00',
    ].join('\n');
    const [a, b] = parseCSV(csv).trades;
    expect(a.side).toBe('long');
    expect(b.side).toBe('short');
  });

  it('parses 12-hour AM/PM times without collapsing PM into AM', () => {
    const csv = [
      'Symbol,Type,Entry Price,Exit Price,Qty,PnL,Open Time,Close Time',
      'AAPL,Long,150.00,152.00,10,20,01/15/2026 09:30:00 AM,01/15/2026 03:45:00 PM',
    ].join('\n');
    const [t] = parseCSV(csv).trades;
    expect(t.entryDate).toBe('2026-01-15T09:30:00');
    expect(t.exitDate).toBe('2026-01-15T15:45:00');
    expect(t.quantity).toBe('10'); // "Qty" synonym recognized
  });

  it('infers DD/MM (day-first) for the whole file when a value proves it', () => {
    // 20/03 is unambiguous day-first, so 07/03 must be 7 March (not 3 July).
    const csv = [
      'Symbol,Side,Open Price,Close Price,Lots,Profit,Open Time',
      'EURUSD,buy,1.085,1.090,1,50,07/03/2026 10:00:00',
      'GBPUSD,sell,1.27,1.26,1,90,20/03/2026 11:00:00',
    ].join('\n');
    const [a] = parseCSV(csv).trades;
    expect(a.entryDate).toBe('2026-03-07T10:00:00');
  });

  it('handles European semicolon-delimited files with decimal commas', () => {
    const csv = [
      'Symbol;Side;Open Price;Close Price;Lots;Profit;Open Time',
      'EURUSD;buy;1,0850;1,0900;1;50,50;2026-01-15 10:00:00',
    ].join('\n');
    const r = parseCSV(csv);
    expect(r.success).toBe(true);
    const [t] = r.trades;
    expect(t.entryPrice).toBe('1.0850');
    expect(t.exitPrice).toBe('1.0900');
    expect(t.pnl).toBe('50.5');
  });

  it('handles tab-separated files', () => {
    const csv = [
      'Symbol\tSide\tOpen Price\tClose Price\tLots\tProfit',
      'EURUSD\tbuy\t1.0850\t1.0900\t1\t50',
    ].join('\n');
    const [t] = parseCSV(csv).trades;
    expect(t.entryPrice).toBe('1.0850');
    expect(t.exitPrice).toBe('1.0900');
  });

  it('skips a preamble/title row above the real header (non-MT5)', () => {
    const csv = [
      'Account Statement - Generated 2026-01-20',
      'Symbol,Side,Open Price,Close Price,Lots,Profit,Open Time',
      'EURUSD,buy,1.0850,1.0900,1,50,2026-01-15 10:00:00',
    ].join('\n');
    const r = parseCSV(csv);
    expect(r.success).toBe(true);
    expect(r.trades).toHaveLength(1);
  });

  it('rejects unparseable files instead of importing one-field garbage', () => {
    const csv = ['random junk line', 'another junk line'].join('\n');
    const r = parseCSV(csv);
    expect(r.success).toBe(false);
    expect(r.trades).toHaveLength(0);
  });

  it('skips rows with invalid prices rather than importing entry=exit=0', () => {
    const csv = [
      'Symbol,Side,Open Price,Close Price,Lots,Profit',
      'EURUSD,buy,not-a-number,also-bad,1,50',
      'GBPUSD,sell,1.27,1.26,1,90',
    ].join('\n');
    const r = parseCSV(csv);
    expect(r.summary.successfulParsed).toBe(1);
    expect(r.summary.failed).toBe(1);
    expect(r.trades[0].symbol).toBe('GBPUSD');
  });

  it('still imports a normal US comma CSV unchanged', () => {
    const csv = [
      'Symbol,Side,Open Price,Close Price,Lots,Profit,Open Time',
      'EURUSD,buy,1.0850,1.0900,1,50,2026-01-15 10:00:00',
    ].join('\n');
    const [t] = parseCSV(csv).trades;
    expect(t.side).toBe('long');
    expect(t.entryPrice).toBe('1.0850');
    expect(t.pnl).toBe('50');
  });
});

describe('parseCSVHeaders — header-row detection for arbitrary formats', () => {
  it('skips a title/preamble row and returns the real header of an unknown format', () => {
    // Unknown broker: no symbol/price-named columns the generic heuristic knows,
    // plus a junk preamble row on top. The structural fallback should still pick
    // the textual header row, not the numeric data row, so the mapping dialog
    // shows real column names.
    const csv = [
      'My Broker Export,,,,',
      'Ticker,Direction,In,Out,Net',
      'AAPL,long,180.5,185.0,450',
      'TSLA,short,250.0,240.0,1000',
    ].join('\n');
    expect(parseCSVHeaders(csv)).toEqual(['Ticker', 'Direction', 'In', 'Out', 'Net']);
  });

  it('does not mistake a data row with blank cells for the header', () => {
    // Regression: a blank cell used to match every column candidate, letting the
    // first data row pose as the header.
    const csv = [
      'orderId,B/S,Contract,Status,Avg Fill Price,Filled Qty,Product',
      '1, Buy,MNQM6, Filled,28531.75,5,MNQ',
      '2, Buy,MNQM6, Canceled,,,MNQ',
    ].join('\n');
    expect(parseCSVHeaders(csv)[0]).toBe('orderId');
  });
});
