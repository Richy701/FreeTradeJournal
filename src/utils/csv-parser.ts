// CSV Parser for trading platform data
export interface ParsedTrade {
  symbol: string;
  side: 'long' | 'short';
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  pnl: string;
  date: string;
  entryDate?: string;
  exitDate?: string;
  commission?: string;
  fees?: string;
}

export interface CSVParseResult {
  success: boolean;
  trades: ParsedTrade[];
  errors: string[];
  summary: {
    totalRows: number;
    successfulParsed: number;
    failed: number;
    dateRange: {
      earliest: string;
      latest: string;
    } | null;
  };
}

// Common column mappings for different trading platforms
const COLUMN_MAPPINGS = {
  // Your current format (MT5-like) + Topstep + other prop firms
  standard: {
    symbol: ['Symbol', 'Instrument', 'Pair', 'ContractName', 'Contract', 'Market'],
    side: ['Side', 'Type', 'Direction', 'Action', 'B/S', 'Buy/Sell'],
    openPrice: ['Open Price', 'Entry Price', 'Open', 'Entry', 'EntryPrice', 'Avg Entry Price'],
    closePrice: ['Close Price', 'Exit Price', 'Close', 'Exit', 'ExitPrice', 'Avg Exit Price'],
    quantity: ['Lots', 'Volume', 'Size', 'Quantity', 'Units', 'Qty', 'Filled Qty', 'Shares', 'Amount'],
    pnl: ['PnL', 'Profit', 'P&L', 'Gain', 'Net P/L', 'Realized P/L', 'Realized P&L', 'Net Profit'],
    openTime: ['Open Time', 'Entry Time', 'Date', 'Time', 'Open Date', 'EnteredAt', 'TradeDay'],
    closeTime: ['Close Time', 'Exit Time', 'Close Date', 'ExitedAt'],
    commission: ['Commission', 'Commissions'],
    fees: ['Fees', 'Fee', 'Total Fees', 'Net Fees', 'Exchange Fees'],
  }
};

// Sniff the field delimiter from the header line. European brokers export
// semicolon-delimited CSVs (with decimal commas), and some platforms export
// tab-separated — both produce single-column garbage if we assume a comma.
function detectDelimiter(lines: string[]): string {
  const sample = lines.find(l => l.trim()) || '';
  const counts: Record<string, number> = {
    ',': (sample.match(/,/g) || []).length,
    ';': (sample.match(/;/g) || []).length,
    '\t': (sample.match(/\t/g) || []).length,
  };
  let best = ',';
  for (const d of [';', '\t']) {
    if (counts[d] > counts[best]) best = d;
  }
  return best;
}

function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result.map(field => field.replace(/^["']|["']$/g, ''));
}

export function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const normalized = headers.map(h => h.trim().toLowerCase());

  // Pass 1: exact (case-insensitive) match. This is the most reliable and avoids
  // substring collisions — e.g. a "Close Price" candidate of "Exit" must not match
  // the "ExitedAt" timestamp column that some brokers (Topstep) place before the
  // real "ExitPrice" column.
  for (const name of possibleNames) {
    const target = name.trim().toLowerCase();
    const exact = normalized.indexOf(target);
    if (exact !== -1) return exact;
  }

  // Pass 2: substring match as a fallback for headers that aren't exact (e.g. a
  // "P/L" header matching a "Net P/L" candidate).
  for (const name of possibleNames) {
    const target = name.trim().toLowerCase();
    const index = normalized.findIndex(h => h.includes(target) || target.includes(h));
    if (index !== -1) return index;
  }

  return -1;
}

// Normalize a numeric string to a JS-parseable form. When `decimalComma` is set
// (European exports), "1.234,56" → "1234.56"; otherwise "1,234.56" → "1234.56".
function cleanNumeric(value: string, decimalComma: boolean = false): string {
  let s = (value || '').replace(/[$£€¥₹\s]/g, '');
  if (decimalComma) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  return s.replace(/[^0-9.\-]/g, '');
}

function parseCurrency(value: string, decimalComma: boolean = false): number {
  return parseFloat(cleanNumeric(value, decimalComma)) || 0;
}

function formatLocalDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:${s}`;
}

// Parse a clock string "HH:MM[:SS] [AM|PM]" into 24-hour components. Returns
// null if it isn't a clock. Handles AM/PM, which broker exports commonly use and
// which a naive split(':') mangles (seconds become NaN, every PM collapses to AM).
function parseClock(timePart: string): { h: number; m: number; s: number } | null {
  const m = timePart.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const ap = (m[4] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return { h, m: parseInt(m[2], 10), s: m[3] ? parseInt(m[3], 10) : 0 };
}

// `dayFirst`: true = DD/MM, false = MM/DD, undefined = auto (per-value heuristic,
// US default when ambiguous). Inferred for the whole file by detectDayFirst().
function parseDateString(dateStr: string, dayFirst?: boolean): string {
  try {
    // Strip timezone offset suffix like "+00:00" or "-06:00"
    const cleaned = dateStr.replace(/\s*[+-]\d{2}:\d{2}\s*$/, '').trim();

    let date: Date;

    // Format with slashes or dots: DD/MM/YYYY or MM/DD/YYYY, optionally with time.
    // (MT4/European exports use "2025.08.28" or "28.08.2025"; treat '.' like '/'.)
    const slashDate = /^\d{1,2}[./]\d{1,2}[./]\d{2,4}/.test(cleaned);
    if (slashDate) {
      const spaceIdx = cleaned.search(/[ T]/);
      const datePart = spaceIdx >= 0 ? cleaned.slice(0, spaceIdx) : cleaned;
      const timePart = spaceIdx >= 0 ? cleaned.slice(spaceIdx + 1).trim() : '';
      const parts = datePart.split(/[./]/);
      const a = parseInt(parts[0]);
      const b = parseInt(parts[1]);
      const year = parseInt(parts[2]);

      let month: number, day: number;
      // A value > 12 is unambiguous. Otherwise honor the file-level dayFirst hint;
      // fall back to MM/DD (US) when there's no hint.
      if (a > 12) {
        month = b - 1; day = a;
      } else if (b > 12) {
        month = a - 1; day = b;
      } else if (dayFirst === true) {
        month = b - 1; day = a;
      } else {
        month = a - 1; day = b;
      }

      const clock = timePart ? parseClock(timePart) : null;
      date = clock
        ? new Date(year, month, day, clock.h, clock.m, clock.s)
        : new Date(year, month, day);
    }
    // Format: "2025-08-28" or "2025-08-28 00:37:54" or "2025-08-28T14:30:00",
    // optionally with an AM/PM clock.
    else if (cleaned.includes('-')) {
      const sep = cleaned.search(/[ T]/);
      if (sep >= 0) {
        const [y, m, d] = cleaned.slice(0, sep).split('-').map(Number);
        const clock = parseClock(cleaned.slice(sep + 1));
        date = clock
          ? new Date(y, m - 1, d, clock.h, clock.m, clock.s)
          : new Date(cleaned.replace(' ', 'T'));
      } else {
        const [y, m, d] = cleaned.split('-').map(Number);
        date = new Date(y, m - 1, d);
      }
      if (isNaN(date.getTime())) {
        const [y, m, d] = cleaned.split(/[\sT]/)[0].split('-').map(Number);
        date = new Date(y, m - 1, d);
      }
    }
    // Fallback
    else {
      date = new Date(cleaned);
    }

    if (isNaN(date.getTime())) {
      return formatLocalDateTime(new Date());
    }

    return formatLocalDateTime(date);
  } catch {
    return formatLocalDateTime(new Date());
  }
}

function normalizeSide(side: string): 'long' | 'short' {
  const normalized = side.toLowerCase().trim();
  // Include single-letter "B" (Buy) and bare "bought" — some brokers/cTrader use
  // B/S, which previously fell through to 'short' and inverted every long.
  if (['buy', 'long', 'l', 'bid', 'b', 'bought'].includes(normalized)) {
    return 'long';
  }
  return 'short';
}

// Infer whether a column of slash/dot dates is DD/MM (day-first) or MM/DD by
// scanning every value: a first part > 12 proves day-first, a second part > 12
// proves month-first. Returns undefined when the file is genuinely ambiguous
// (no value exceeds 12) or self-contradictory, so the caller can fall back.
function detectDayFirst(dateStrings: string[]): boolean | undefined {
  let sawDayFirst = false;
  let sawMonthFirst = false;
  for (const s of dateStrings) {
    const m = (s || '').trim().match(/^(\d{1,2})[./](\d{1,2})[./]\d{2,4}/);
    if (!m) continue;
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    if (a > 12) sawDayFirst = true;
    if (b > 12) sawMonthFirst = true;
  }
  if (sawDayFirst && !sawMonthFirst) return true;
  if (sawMonthFirst && !sawDayFirst) return false;
  return undefined;
}

// ─── IBKR Detection & Parsing ───────────────────────────────

// IBKR FlexQuery date format: "20241128" or "20241128;10:30:45" or "2024-11-28 10:30:45"
function parseIBKRDate(dateStr: string): string {
  if (!dateStr) return formatLocalDateTime(new Date());
  const cleaned = dateStr.trim().replace(';', ' ');
  // YYYYMMDD or YYYYMMDD HH:MM:SS format
  if (/^\d{8}/.test(cleaned)) {
    const y = cleaned.slice(0, 4);
    const m = cleaned.slice(4, 6);
    const d = cleaned.slice(6, 8);
    const timePart = cleaned.slice(8).trim();
    if (timePart) {
      const tp = timePart.split(':').map(Number);
      return formatLocalDateTime(new Date(+y, +m - 1, +d, tp[0] || 0, tp[1] || 0, tp[2] || 0));
    }
    return `${y}-${m}-${d}T00:00:00`;
  }
  return parseDateString(cleaned);
}

// Detect IBKR Closed Positions format: has OpenDateTime + CloseDateTime + FifoPnlRealized
function isIBKRClosedPositions(headers: string[]): boolean {
  const h = headers.map(x => x.toLowerCase());
  return (
    h.some(x => x === 'opendatetime' || x === 'opendate') &&
    h.some(x => x === 'closedatetime' || x === 'closedate') &&
    h.some(x => x.includes('fifopnl') || x.includes('realizedpnl'))
  );
}

// Detect IBKR Trades/Executions format: has Open/CloseIndicator + FifoPnlRealized
function isIBKRTradesFormat(headers: string[]): boolean {
  const h = headers.map(x => x.toLowerCase());
  return (
    h.some(x => x === 'open/closeindicator' || x === 'openclose') &&
    h.some(x => x.includes('fifopnl') || x.includes('tradeprice'))
  );
}

function parseIBKRClosedPositions(lines: string[], headers: string[]): CSVParseResult {
  const result: CSVParseResult = {
    success: false, trades: [], errors: [],
    summary: { totalRows: 0, successfulParsed: 0, failed: 0, dateRange: null },
  };

  const h = headers.map(x => x.toLowerCase());
  const col = {
    symbol:     h.findIndex(x => x === 'symbol'),
    buySell:    h.findIndex(x => x === 'buy/sell' || x === 'buysell'),
    quantity:   h.findIndex(x => x === 'quantity'),
    openPrice:  h.findIndex(x => x === 'tradeprice' || x === 'openprice' || x === 'open price'),
    closePrice: h.findIndex(x => x === 'closeprice' || x === 'close price'),
    pnl:        h.findIndex(x => x.includes('fifopnl') || x.includes('realizedpnl') || x === 'realizedpl'),
    openDate:   h.findIndex(x => x === 'opendatetime' || x === 'opendate'),
    closeDate:  h.findIndex(x => x === 'closedatetime' || x === 'closedate'),
  };

  const dates: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    result.summary.totalRows++;

    try {
      const fields = parseCSVLine(line);
      const symbol = col.symbol >= 0 ? fields[col.symbol]?.trim() : '';
      const buySell = col.buySell >= 0 ? fields[col.buySell]?.trim().toUpperCase() : '';
      const quantity = col.quantity >= 0 ? Math.abs(parseFloat(fields[col.quantity]) || 0) : 0;
      const openPrice = col.openPrice >= 0 ? parseFloat(fields[col.openPrice]) : NaN;
      const closePrice = col.closePrice >= 0 ? parseFloat(fields[col.closePrice]) : NaN;
      const pnl = col.pnl >= 0 ? parseFloat(fields[col.pnl]) : NaN;
      const openDateStr = col.openDate >= 0 ? parseIBKRDate(fields[col.openDate] || '') : '';
      const closeDateStr = col.closeDate >= 0 ? parseIBKRDate(fields[col.closeDate] || '') : '';
      const date = closeDateStr || openDateStr || formatLocalDateTime(new Date());

      if (!symbol || !buySell || !quantity || isNaN(pnl)) {
        result.errors.push(`Row ${i + 1}: Missing required fields`);
        result.summary.failed++;
        continue;
      }

      // In closed positions: BUY/SELL refers to the closing trade direction
      // SELL to close = was long; BUY to close = was short
      const side: 'long' | 'short' = buySell === 'SELL' ? 'long' : 'short';

      // Calculate entry price if not directly available
      let entryPrice = openPrice;
      let exitPrice = closePrice;
      if (isNaN(entryPrice) && !isNaN(exitPrice) && quantity > 0) {
        entryPrice = side === 'long'
          ? exitPrice - pnl / quantity
          : exitPrice + pnl / quantity;
      } else if (isNaN(exitPrice) && !isNaN(entryPrice) && quantity > 0) {
        exitPrice = side === 'long'
          ? entryPrice + pnl / quantity
          : entryPrice - pnl / quantity;
      }

      dates.push(date);
      result.trades.push({
        symbol,
        side,
        entryPrice: isNaN(entryPrice) ? '0' : entryPrice.toFixed(6),
        exitPrice: isNaN(exitPrice) ? '0' : exitPrice.toFixed(6),
        quantity: quantity.toString(),
        pnl: pnl.toFixed(2),
        date,
        entryDate: openDateStr || date,
        exitDate: closeDateStr || date,
      });
      result.summary.successfulParsed++;
    } catch {
      result.errors.push(`Row ${i + 1}: Parse error`);
      result.summary.failed++;
    }
  }

  if (dates.length > 0) {
    const sorted = dates.sort();
    result.summary.dateRange = { earliest: sorted[0], latest: sorted[sorted.length - 1] };
  }
  result.success = result.trades.length > 0;
  if (!result.success) result.errors.push('No completed trades found in IBKR Closed Positions export');
  return result;
}

function parseIBKRTrades(lines: string[], headers: string[]): CSVParseResult {
  const result: CSVParseResult = {
    success: false, trades: [], errors: [],
    summary: { totalRows: 0, successfulParsed: 0, failed: 0, dateRange: null },
  };

  const h = headers.map(x => x.toLowerCase());
  const col = {
    symbol:    h.findIndex(x => x === 'symbol'),
    buySell:   h.findIndex(x => x === 'buy/sell' || x === 'buysell'),
    quantity:  h.findIndex(x => x === 'quantity'),
    price:     h.findIndex(x => x === 'tradeprice' || x === 'price'),
    pnl:       h.findIndex(x => x.includes('fifopnl') || x === 'realizedpnl'),
    indicator: h.findIndex(x => x === 'open/closeindicator' || x === 'openclose'),
    dateTime:  h.findIndex(x => x === 'datetime' || x === 'tradedate' || x === 'date'),
  };

  // We pair O (open) executions with C (close) executions by symbol+side, FIFO
  type Execution = { price: number; quantity: number; date: string; side: string };
  const openQueues = new Map<string, Execution[]>(); // key = symbol:side
  const dates: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    result.summary.totalRows++;

    try {
      const fields = parseCSVLine(line);
      const symbol = col.symbol >= 0 ? fields[col.symbol]?.trim() : '';
      const buySell = col.buySell >= 0 ? fields[col.buySell]?.trim().toUpperCase() : '';
      const quantity = Math.abs(parseFloat(col.quantity >= 0 ? fields[col.quantity] : '0') || 0);
      const price = parseFloat(col.price >= 0 ? fields[col.price] : '0');
      const pnlRaw = col.pnl >= 0 ? parseFloat(fields[col.pnl]) : NaN;
      const indicator = col.indicator >= 0 ? fields[col.indicator]?.trim().toUpperCase() : '';
      const date = parseIBKRDate(col.dateTime >= 0 ? fields[col.dateTime] : '');

      if (!symbol || !buySell || !quantity || isNaN(price)) {
        result.errors.push(`Row ${i + 1}: Missing required fields`);
        result.summary.failed++;
        continue;
      }

      if (indicator === 'O' || indicator === 'OPEN') {
        // Opening execution — push to queue
        const key = `${symbol}:${buySell}`;
        if (!openQueues.has(key)) openQueues.set(key, []);
        openQueues.get(key)!.push({ price, quantity, date, side: buySell });
      } else if (indicator === 'C' || indicator === 'CLOSE') {
        // Closing execution — BUY to close = was short, SELL to close = was long
        const isLong = buySell === 'SELL';
        const openKey = `${symbol}:${isLong ? 'BUY' : 'SELL'}`;
        const queue = openQueues.get(openKey) || [];

        let remaining = quantity;
        while (remaining > 0 && queue.length > 0) {
          const open = queue[0];
          const matched = Math.min(remaining, open.quantity);

          const pnl = !isNaN(pnlRaw) ? pnlRaw * (matched / quantity)
            : isLong
              ? (price - open.price) * matched
              : (open.price - price) * matched;

          dates.push(date);
          result.trades.push({
            symbol,
            side: isLong ? 'long' : 'short',
            entryPrice: open.price.toFixed(6),
            exitPrice: price.toFixed(6),
            quantity: matched.toString(),
            pnl: pnl.toFixed(2),
            date,
            entryDate: open.date,
            exitDate: date,
          });
          result.summary.successfulParsed++;

          remaining -= matched;
          open.quantity -= matched;
          if (open.quantity <= 0) queue.shift();
        }

        if (remaining > 0) {
          result.errors.push(`${symbol}: Could not match ${remaining} closing units to an open position`);
        }
      }
      // Rows with no indicator treated as complete trades if they have P&L
      else if (!indicator && !isNaN(pnlRaw) && pnlRaw !== 0) {
        const side: 'long' | 'short' = buySell === 'SELL' ? 'long' : 'short';
        const entryPrice = side === 'long' ? price - pnlRaw / quantity : price + pnlRaw / quantity;
        dates.push(date);
        result.trades.push({
          symbol, side,
          entryPrice: entryPrice.toFixed(6),
          exitPrice: price.toFixed(6),
          quantity: quantity.toString(),
          pnl: pnlRaw.toFixed(2),
          date,
          entryDate: date,
          exitDate: date,
        });
        result.summary.successfulParsed++;
      }
    } catch {
      result.errors.push(`Row ${i + 1}: Parse error`);
      result.summary.failed++;
    }
  }

  if (dates.length > 0) {
    const sorted = dates.sort();
    result.summary.dateRange = { earliest: sorted[0], latest: sorted[sorted.length - 1] };
  }
  result.success = result.trades.length > 0;
  if (!result.success) result.errors.push('No completed trades found. Ensure your FlexQuery includes both opening and closing executions with the Open/CloseIndicator field.');
  return result;
}

// ─── Tradovate Detection & Parsing ─────────────────────────

function isTradovateFormat(headers: string[]): boolean {
  const h = headers.map(x => x.toLowerCase().trim());
  return (
    h.some(x => x === 'b/s') &&
    h.some(x => x === 'product' || x === 'product description') &&
    h.some(x => x === 'avg fill price' || x === 'avgprice') &&
    h.some(x => x === 'filled qty' || x === 'filledqty') &&
    h.some(x => x === 'status')
  );
}

function parseTradovateTimestamp(ts: string): number {
  if (!ts) return 0;
  const cleaned = ts.replace(/\s*[+-]\d{2}:\d{2}\s*$/, '').trim();
  // Try ISO-ish: "2026-04-02T22:42:07.000Z" or "2026-04-02 22:42:07"
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d.getTime();
  // Try MM/DD/YYYY HH:MM:SS
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, mm, dd, yyyy, hh, min, ss] = match;
    return new Date(+yyyy, +mm - 1, +dd, +hh, +min, +ss).getTime();
  }
  return 0;
}

function parseTradovateOrders(lines: string[], headers: string[]): CSVParseResult {
  const result: CSVParseResult = {
    success: false,
    trades: [],
    errors: [],
    summary: { totalRows: 0, successfulParsed: 0, failed: 0, dateRange: null },
  };

  const h = headers.map(x => x.toLowerCase().trim());
  const col = {
    buySell:     h.findIndex(x => x === 'b/s'),
    contract:    h.findIndex(x => x === 'contract'),
    product:     h.findIndex(x => x === 'product'),
    avgPrice:    h.findIndex(x => x === 'avg fill price'),
    avgPrice2:   h.findIndex(x => x === 'avgprice'),
    filledQty:   h.findIndex(x => x === 'filled qty'),
    filledQty2:  h.findIndex(x => x === 'filledqty'),
    fillTime:    h.findIndex(x => x === 'fill time'),
    date:        h.findIndex(x => x === 'date'),
    status:      h.findIndex(x => x === 'status'),
  };

  interface TradovateFill {
    symbol: string;
    product: string;
    side: 'Buy' | 'Sell';
    price: number;
    qty: number;
    fillTime: string;
    date: string;
  }

  const fills: TradovateFill[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    result.summary.totalRows++;

    const fields = parseCSVLine(line);
    const status = (fields[col.status] || '').trim();

    if (status !== 'Filled') continue;

    const buySell = (fields[col.buySell] || '').trim();
    if (buySell !== 'Buy' && buySell !== 'Sell') {
      result.errors.push(`Row ${i + 1}: Unexpected B/S value "${buySell}"`);
      result.summary.failed++;
      continue;
    }

    const priceIdx = col.avgPrice >= 0 ? col.avgPrice : col.avgPrice2;
    const qtyIdx = col.filledQty >= 0 ? col.filledQty : col.filledQty2;
    const price = parseFloat(fields[priceIdx] || '');
    const qty = parseInt(fields[qtyIdx] || '', 10);

    if (!price || isNaN(price) || !qty || qty <= 0) {
      result.errors.push(`Row ${i + 1}: Missing price or quantity`);
      result.summary.failed++;
      continue;
    }

    const contract = (fields[col.contract] || '').trim();
    const product = (fields[col.product] || '').trim();
    const fillTime = col.fillTime >= 0 ? (fields[col.fillTime] || '').trim() : '';
    const dateStr = col.date >= 0 ? (fields[col.date] || '').trim() : '';

    fills.push({
      symbol: contract || product,
      product: product || contract.replace(/[FGHJKMNQUVXZ]\d{1,2}$/, ''),
      side: buySell as 'Buy' | 'Sell',
      price,
      qty,
      fillTime,
      date: dateStr,
    });
  }

  fills.sort((a, b) => {
    const tA = parseTradovateTimestamp(a.fillTime) || parseTradovateTimestamp(a.date);
    const tB = parseTradovateTimestamp(b.fillTime) || parseTradovateTimestamp(b.date);
    return tA - tB;
  });

  // Group by product to pair buys with sells
  const groups = new Map<string, TradovateFill[]>();
  for (const fill of fills) {
    const key = fill.product;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(fill);
  }

  const dates: string[] = [];

  for (const [, productFills] of groups) {
    // Net position tracking with FIFO queue
    // Position > 0 = long, < 0 = short
    type OpenEntry = { price: number; qty: number; fillTime: string; date: string; symbol: string };
    const openQueue: OpenEntry[] = [];
    let position = 0; // net signed position

    for (const fill of productFills) {
      const signedQty = fill.side === 'Buy' ? fill.qty : -fill.qty;
      const prevPosition = position;
      const newPosition = position + signedQty;

      // Check if this fill is (partially) closing an existing position
      // Closing = moving position toward zero (opposite direction of current position)
      const isClosing = prevPosition !== 0 && Math.sign(signedQty) !== Math.sign(prevPosition);

      if (isClosing) {
        let closingQty = Math.min(Math.abs(signedQty), Math.abs(prevPosition));
        const exitPrice = fill.price;
        const isLong = prevPosition > 0;
        const multiplier = getFuturesMultiplier(fill.symbol);

        let remaining = closingQty;
        while (remaining > 0 && openQueue.length > 0) {
          const open = openQueue[0];
          const matched = Math.min(remaining, open.qty);

          const pnl = isLong
            ? (exitPrice - open.price) * matched * multiplier
            : (open.price - exitPrice) * matched * multiplier;

          const entryDateStr = parseDateString(open.fillTime || open.date);
          const exitDateStr = parseDateString(fill.fillTime || fill.date);
          const tradeDate = exitDateStr;
          dates.push(tradeDate);

          result.trades.push({
            symbol: fill.symbol,
            side: isLong ? 'long' : 'short',
            entryPrice: open.price.toFixed(6),
            exitPrice: exitPrice.toFixed(6),
            quantity: matched.toString(),
            pnl: pnl.toFixed(2),
            date: tradeDate,
            entryDate: entryDateStr,
            exitDate: exitDateStr,
          });
          result.summary.successfulParsed++;

          remaining -= matched;
          open.qty -= matched;
          if (open.qty <= 0) openQueue.shift();
        }

        // If the fill flipped position (crossed zero), the remainder is a new opening
        const overflowQty = Math.abs(signedQty) - closingQty;
        if (overflowQty > 0) {
          openQueue.push({
            price: fill.price,
            qty: overflowQty,
            fillTime: fill.fillTime,
            date: fill.date,
            symbol: fill.symbol,
          });
        }
      } else {
        // Pure opening fill (same direction as position, or position is flat)
        openQueue.push({
          price: fill.price,
          qty: fill.qty,
          fillTime: fill.fillTime,
          date: fill.date,
          symbol: fill.symbol,
        });
      }

      position = newPosition;
    }

    const unmatchedQty = openQueue.reduce((sum, o) => sum + o.qty, 0);
    if (unmatchedQty > 0) {
      result.errors.push(
        `${productFills[0].product}: ${unmatchedQty} contract(s) still open (no matching close)`
      );
    }
  }

  if (dates.length > 0) {
    const sorted = dates.sort();
    result.summary.dateRange = { earliest: sorted[0], latest: sorted[sorted.length - 1] };
  }

  result.success = result.trades.length > 0;
  if (!result.success) {
    result.errors.push('No completed trades found. Ensure your Tradovate Orders export contains both opening and closing fills.');
  }
  return result;
}

// ─── Tradovate Trades / Performance Export ─────────────────

// Tradovate's "Trades" (performance) export is a SECOND, unrelated layout to the
// Orders export above: one row per completed round-trip trade, with realized P&L
// already computed. Columns:
//   symbol,_priceFormat,_priceFormatType,_tickSize,buyFillId,sellFillId,qty,
//   buyPrice,sellPrice,pnl,boughtTimestamp,soldTimestamp,duration
// There is no Side column — direction is implied by which leg filled first
// (bought-then-sold = long). P&L is given directly (accounting format like
// "$(400.00)" for losses), so no contract multiplier is needed.
function isTradovatePerformanceFormat(headers: string[]): boolean {
  const h = headers.map(x => x.toLowerCase().trim());
  return (
    h.includes('symbol') &&
    h.includes('buyprice') &&
    h.includes('sellprice') &&
    h.includes('pnl') &&
    h.includes('boughttimestamp') &&
    h.includes('soldtimestamp')
  );
}

// Parse Tradovate's accounting-style currency: "$(400.00)" → -400, "$1,200.00" →
// 1200, "$800.00" → 800. Parentheses denote a negative (a loss).
function parseTradovatePnl(raw: string): number {
  const s = (raw || '').trim();
  const negative = s.includes('(');
  const num = parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
  return negative ? -num : num;
}

function parseTradovatePerformance(lines: string[], headers: string[]): CSVParseResult {
  const result: CSVParseResult = {
    success: false, trades: [], errors: [],
    summary: { totalRows: 0, successfulParsed: 0, failed: 0, dateRange: null },
  };

  const h = headers.map(x => x.toLowerCase().trim());
  const col = {
    symbol:    h.indexOf('symbol'),
    qty:       h.indexOf('qty'),
    buyPrice:  h.indexOf('buyprice'),
    sellPrice: h.indexOf('sellprice'),
    pnl:       h.indexOf('pnl'),
    bought:    h.indexOf('boughttimestamp'),
    sold:      h.indexOf('soldtimestamp'),
  };

  const dates: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    result.summary.totalRows++;

    try {
      const fields = parseCSVLine(line);
      const symbol = (fields[col.symbol] || '').trim();
      const qty = Math.abs(parseInt(fields[col.qty] || '', 10) || 0);
      const buyPrice = parseFloat(fields[col.buyPrice] || '');
      const sellPrice = parseFloat(fields[col.sellPrice] || '');
      const pnl = parseTradovatePnl(fields[col.pnl] || '');
      const boughtStr = (fields[col.bought] || '').trim();
      const soldStr = (fields[col.sold] || '').trim();

      if (!symbol || !qty || isNaN(buyPrice) || isNaN(sellPrice)) {
        result.errors.push(`Row ${i + 1}: Missing symbol, quantity, or price`);
        result.summary.failed++;
        continue;
      }

      // Side is implied by which leg executed first: bought-then-sold = long,
      // sold-then-bought = short (sell opened the position, buy covered it).
      const boughtMs = parseTradovateTimestamp(boughtStr);
      const soldMs = parseTradovateTimestamp(soldStr);
      const isLong = boughtMs && soldMs ? boughtMs <= soldMs : true;

      const entryPrice = isLong ? buyPrice : sellPrice;
      const exitPrice = isLong ? sellPrice : buyPrice;
      const entryDate = parseDateString(isLong ? boughtStr : soldStr);
      const exitDate = parseDateString(isLong ? soldStr : boughtStr);
      dates.push(exitDate);

      result.trades.push({
        symbol,
        side: isLong ? 'long' : 'short',
        entryPrice: entryPrice.toFixed(6),
        exitPrice: exitPrice.toFixed(6),
        quantity: qty.toString(),
        pnl: pnl.toFixed(2),
        date: exitDate,
        entryDate,
        exitDate,
      });
      result.summary.successfulParsed++;
    } catch {
      result.errors.push(`Row ${i + 1}: Parse error`);
      result.summary.failed++;
    }
  }

  if (dates.length > 0) {
    const sorted = dates.sort();
    result.summary.dateRange = { earliest: sorted[0], latest: sorted[sorted.length - 1] };
  }
  result.success = result.trades.length > 0;
  if (!result.success) {
    result.errors.push('No completed trades found in the Tradovate performance export');
  }
  return result;
}

// ─── TopStep Detection ───────────────────────────────────────

// Detect if this is a TopStep order-level export
function isTopStepOrderFormat(headers: string[]): boolean {
  const hasExecutePrice = headers.some(h => h.trim().toLowerCase() === 'executeprice');
  const hasPositionDisposition = headers.some(h => h.trim().toLowerCase() === 'positiondisposition');
  const hasStatus = headers.some(h => h.trim().toLowerCase() === 'status');
  return hasExecutePrice && hasPositionDisposition && hasStatus;
}

// Futures contract dollar-per-point multipliers
// The symbol in the CSV includes month/year code (e.g. MNQH6), so we match by base prefix
const FUTURES_MULTIPLIERS: Record<string, number> = {
  // Micro E-minis
  MNQ: 2,    // Micro E-mini Nasdaq — $0.50/tick (0.25pt) = $2/pt
  MES: 5,    // Micro E-mini S&P 500 — $1.25/tick (0.25pt) = $5/pt
  MYM: 0.5,  // Micro E-mini Dow — $0.50/tick (1pt) = $0.50/pt
  M2K: 5,    // Micro E-mini Russell — $0.50/tick (0.10pt) = $5/pt
  // E-minis
  NQ: 20,    // E-mini Nasdaq — $5.00/tick (0.25pt) = $20/pt
  ES: 50,    // E-mini S&P 500 — $12.50/tick (0.25pt) = $50/pt
  YM: 5,     // E-mini Dow — $5.00/tick (1pt) = $5/pt
  RTY: 50,   // E-mini Russell — $5.00/tick (0.10pt) = $50/pt
  // Metals
  MGC: 10,   // Micro Gold — $1.00/tick (0.10pt) = $10/pt
  GC: 100,   // Gold — $10.00/tick (0.10pt) = $100/pt
  SIL: 5,    // Micro Silver — $0.005/tick = $5/tick (tick=0.005)... $1000/pt
  SI: 50,    // Silver (5000oz) — $25/tick (0.005pt) = $5000/pt... simplified
  HG: 250,   // Copper — $12.50/tick (0.0005pt) = $250 per full pt? Actually per 0.01 = $2.50
  // Energy
  MCL: 10,   // Micro Crude — $1.00/tick (0.01pt) = $100/pt? Actually $10 per $1
  CL: 1000,  // Crude Oil — $10.00/tick (0.01pt) = $1000/pt
  MNG: 1,    // Micro Natural Gas
  NG: 10,    // Natural Gas
  // Grains
  ZC: 50,    // Corn — $12.50/tick (0.25¢) = $50/pt
  ZS: 50,    // Soybeans
  ZW: 50,    // Wheat
  // Treasuries
  ZN: 1000,  // 10-Year T-Note
  ZB: 1000,  // 30-Year T-Bond
  // Currency micros
  M6E: 12500, // Micro Euro
  M6B: 6250,  // Micro British Pound
};

function getFuturesMultiplier(contractName: string): number {
  // Strip month code + year digits from the end (e.g. MNQH6 → MNQ, ESU24 → ES)
  // Month codes: F,G,H,J,K,M,N,Q,U,V,X,Z followed by 1-2 digits
  const base = contractName.replace(/[FGHJKMNQUVXZ]\d{1,2}$/, '');
  return FUTURES_MULTIPLIERS[base] || 1;
}

interface TopStepOrder {
  contractName: string;
  size: number;
  side: string;
  filledAt: string;
  tradeDay: string;
  executePrice: number;
  positionDisposition: string;
}

function parseTopStepTimestamp(ts: string): number {
  const cleaned = ts.replace(/\s*[+-]\d{2}:\d{2}\s*$/, '').trim();
  const match = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    const [, mm, dd, yyyy, hh, min, ss] = match;
    return new Date(+yyyy, +mm - 1, +dd, +hh, +min, +ss).getTime();
  }
  return new Date(cleaned).getTime() || 0;
}

function parseTopStepOrders(lines: string[], headers: string[]): CSVParseResult {
  const result: CSVParseResult = {
    success: false,
    trades: [],
    errors: [],
    summary: {
      totalRows: 0,
      successfulParsed: 0,
      failed: 0,
      dateRange: null
    }
  };

  // Find TopStep column indices
  const col = {
    contractName: headers.findIndex(h => h.trim().toLowerCase() === 'contractname'),
    status: headers.findIndex(h => h.trim().toLowerCase() === 'status'),
    size: headers.findIndex(h => h.trim().toLowerCase() === 'size'),
    side: headers.findIndex(h => h.trim().toLowerCase() === 'side'),
    filledAt: headers.findIndex(h => h.trim().toLowerCase() === 'filledat'),
    tradeDay: headers.findIndex(h => h.trim().toLowerCase() === 'tradeday'),
    executePrice: headers.findIndex(h => h.trim().toLowerCase() === 'executeprice'),
    positionDisposition: headers.findIndex(h => h.trim().toLowerCase() === 'positiondisposition'),
  };

  // Parse all filled orders
  const orders: TopStepOrder[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    result.summary.totalRows++;

    const fields = parseCSVLine(line);
    const status = fields[col.status]?.trim();

    // Skip non-filled orders (cancelled, rejected, etc.)
    if (status !== 'Filled') continue;

    const executePrice = parseFloat(fields[col.executePrice]);
    if (!executePrice || isNaN(executePrice)) {
      result.errors.push(`Row ${i + 1}: Filled order with no execute price`);
      result.summary.failed++;
      continue;
    }

    const disposition = fields[col.positionDisposition]?.trim();
    if (disposition !== 'Opening' && disposition !== 'Closing') {
      result.errors.push(`Row ${i + 1}: Unknown position disposition "${disposition}"`);
      result.summary.failed++;
      continue;
    }

    orders.push({
      contractName: fields[col.contractName]?.trim() || '',
      size: parseInt(fields[col.size]) || 0,
      side: fields[col.side]?.trim() || '',
      filledAt: fields[col.filledAt]?.trim() || '',
      tradeDay: fields[col.tradeDay]?.trim() || '',
      executePrice,
      positionDisposition: disposition,
    });
  }

  // Sort by filledAt timestamp
  orders.sort((a, b) => {
    const timeA = parseTopStepTimestamp(a.filledAt);
    const timeB = parseTopStepTimestamp(b.filledAt);
    return timeA - timeB;
  });

  // Group by contract name
  const groups = new Map<string, TopStepOrder[]>();
  for (const order of orders) {
    if (!groups.has(order.contractName)) groups.set(order.contractName, []);
    groups.get(order.contractName)!.push(order);
  }

  // Pair opening orders with closing orders (FIFO) within each contract
  // Separate queues by side: Bid(Buy) openings close with Ask(Sell) closings and vice versa
  const dates: string[] = [];

  for (const [, contractOrders] of groups) {
    type OpenEntry = { size: number; price: number; side: string; time: string; tradeDay: string };
    const bidOpenQueue: OpenEntry[] = []; // Buy/Bid openings (longs)
    const askOpenQueue: OpenEntry[] = []; // Sell/Ask openings (shorts)

    for (const order of contractOrders) {
      if (order.positionDisposition === 'Opening') {
        const entry: OpenEntry = {
          size: order.size,
          price: order.executePrice,
          side: order.side,
          time: order.filledAt,
          tradeDay: order.tradeDay,
        };
        if (order.side.toLowerCase() === 'bid') {
          bidOpenQueue.push(entry);
        } else {
          askOpenQueue.push(entry);
        }
      } else {
        // Closing order — match against the OPPOSITE side's open queue
        // Sell/Ask closing → closes a long (bid open queue)
        // Buy/Bid closing → closes a short (ask open queue)
        const isClosingSell = order.side.toLowerCase() === 'ask';
        const openQueue = isClosingSell ? bidOpenQueue : askOpenQueue;
        const isLong = isClosingSell; // Sell close = was long; Buy close = was short

        // Emit one trade per opening fill (matches how TopStep counts trades)
        let remainingSize = order.size;
        const exitPrice = order.executePrice;
        const multiplier = getFuturesMultiplier(order.contractName);

        while (remainingSize > 0 && openQueue.length > 0) {
          const open = openQueue[0];
          const matched = Math.min(remainingSize, open.size);

          const pnlRaw = isLong
            ? (exitPrice - open.price) * matched * multiplier
            : (open.price - exitPrice) * matched * multiplier;

          const entryDateStr = parseDateString(open.time || open.tradeDay);
          const exitDateStr = parseDateString(order.filledAt || order.tradeDay);
          const tradeDate = exitDateStr;
          dates.push(tradeDate);

          result.trades.push({
            symbol: order.contractName,
            side: isLong ? 'long' : 'short',
            entryPrice: open.price.toFixed(6),
            exitPrice: exitPrice.toFixed(6),
            quantity: matched.toString(),
            pnl: pnlRaw.toFixed(2),
            date: tradeDate,
            entryDate: entryDateStr,
            exitDate: exitDateStr,
          });
          result.summary.successfulParsed++;

          remainingSize -= matched;
          open.size -= matched;

          if (open.size <= 0) {
            openQueue.shift();
          }
        }

        if (remainingSize > 0) {
          result.errors.push(
            `${order.contractName}: Closing order for ${order.size} contracts but only ${order.size - remainingSize} were matched to open positions`
          );
        }
      }
    }

    // Warn about unmatched opening orders
    const totalUnmatched = bidOpenQueue.reduce((sum, o) => sum + o.size, 0)
      + askOpenQueue.reduce((sum, o) => sum + o.size, 0);
    if (totalUnmatched > 0) {
      result.errors.push(
        `${contractOrders[0].contractName}: ${totalUnmatched} opening contract(s) had no matching close — position may still be open`
      );
    }
  }

  // Calculate date range
  if (dates.length > 0) {
    const sortedDates = dates.sort();
    result.summary.dateRange = {
      earliest: sortedDates[0],
      latest: sortedDates[sortedDates.length - 1]
    };
  }

  result.success = result.trades.length > 0;

  if (result.trades.length === 0) {
    result.errors.push('No completed trades were found (need matching opening + closing orders)');
  }

  return result;
}

// ─── MT5 / IC Markets Deal-History Detection & Parsing ───────

// MetaTrader 5 "Position history" exports (IC Markets, Pepperstone, etc.) are
// shaped unlike a one-row-per-trade CSV:
//   • 2 preamble rows ("Report", "Name: ... Produced At: ...") sit ABOVE the
//     real "Symbol,...,Profit" header, so lines[0] is not the header.
//   • Each closed position spans TWO rows keyed by a shared Position id: an
//     opening leg (Trade Buy In / Trade Sell In) and a closing leg
//     (Trade Sell Out / Trade Buy Out). Partial closes add more legs.
//   • Entry AND exit prices both live in the single "Open Price" column — there
//     is no separate close-price column, and no long/short side column.
//   • Profit appears only on the closing leg(s).
// We must group by Position, pair the legs, and synthesize a completed trade.

// MT5 timestamps are "M/D/YYYY h:mm:ss AM/PM" — parseDateString has no AM/PM
// handling and would collapse every PM into the AM hour, scrambling leg order.
function parseMT5DateTime(s: string): string {
  if (!s) return formatLocalDateTime(new Date());
  const str = s.trim();
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?$/i);
  if (m) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    // Same DD/MM vs MM/DD disambiguation as parseDateString (US default).
    let month: number, day: number;
    if (b > 12) { month = a - 1; day = b; }
    else if (a > 12) { month = b - 1; day = a; }
    else { month = a - 1; day = b; }
    let hour = parseInt(m[4], 10);
    const ap = (m[7] || '').toUpperCase();
    if (ap === 'PM' && hour < 12) hour += 12;
    if (ap === 'AM' && hour === 12) hour = 0;
    const date = new Date(year, month, day, hour, parseInt(m[5], 10), parseInt(m[6], 10));
    if (!isNaN(date.getTime())) return formatLocalDateTime(date);
  }
  return parseDateString(str);
}

// Scan the first rows for the real MT5 header (it sits below preamble rows).
function findMT5HeaderRow(lines: string[]): number {
  const limit = Math.min(lines.length, 15);
  for (let i = 0; i < limit; i++) {
    const cells = parseCSVLine(lines[i]).map(c => c.trim().toLowerCase());
    if (
      cells.includes('position') &&
      cells.includes('transaction type') &&
      cells.some(c => c === 'open price' || c === 'price') &&
      cells.includes('profit')
    ) {
      return i;
    }
  }
  return -1;
}

function isMT5DealHistory(lines: string[]): boolean {
  return findMT5HeaderRow(lines) !== -1;
}

function parseMT5DealHistory(lines: string[], headerRow: number): CSVParseResult {
  const result: CSVParseResult = {
    success: false, trades: [], errors: [],
    summary: { totalRows: 0, successfulParsed: 0, failed: 0, dateRange: null },
  };

  const headers = parseCSVLine(lines[headerRow]).map(h => h.trim().toLowerCase());
  const col = {
    symbol:     headers.indexOf('symbol'),
    position:   headers.indexOf('position'),
    dateTime:   headers.findIndex(h => h === 'date time' || h === 'datetime' || h === 'time'),
    txType:     headers.findIndex(h => h === 'transaction type' || h === 'type'),
    lots:       headers.findIndex(h => h === 'trade volume lots' || h === 'volume' || h === 'lots'),
    price:      headers.findIndex(h => h === 'open price' || h === 'price'),
    profit:     headers.indexOf('profit'),
    commission: headers.findIndex(h => h === 'commission' || h === 'commissions'),
    swap:       headers.indexOf('swap'),
  };

  type Leg = {
    isOpen: boolean; isBuy: boolean; price: number; lots: number;
    profit: number; commission: number; swap: number; time: string;
  };
  const groups = new Map<string, { symbol: string; legs: Leg[] }>();

  for (let i = headerRow + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    result.summary.totalRows++;

    try {
      const fields = parseCSVLine(line);
      const positionId = col.position >= 0 ? (fields[col.position] || '').trim() : '';
      const symbol = col.symbol >= 0 ? (fields[col.symbol] || '').trim() : '';
      const txType = (col.txType >= 0 ? fields[col.txType] || '' : '').trim().toLowerCase();

      if (!positionId || !symbol || !txType) {
        result.errors.push(`Row ${i + 1}: Missing position id, symbol, or transaction type`);
        result.summary.failed++;
        continue;
      }

      // "trade buy in" / "trade sell out" → last word is in/out, buy/sell anywhere.
      const isOpen = /\bin$/.test(txType);
      const isBuy = /buy/.test(txType);
      const leg: Leg = {
        isOpen,
        isBuy,
        price:      col.price >= 0 ? parseFloat(fields[col.price]) || 0 : 0,
        lots:       col.lots >= 0 ? Math.abs(parseFloat(fields[col.lots]) || 0) : 0,
        profit:     col.profit >= 0 ? parseCurrency(fields[col.profit] || '0') : 0,
        commission: col.commission >= 0 ? parseCurrency(fields[col.commission] || '0') : 0,
        swap:       col.swap >= 0 ? parseCurrency(fields[col.swap] || '0') : 0,
        time:       col.dateTime >= 0 ? parseMT5DateTime(fields[col.dateTime] || '') : '',
      };

      if (!groups.has(positionId)) groups.set(positionId, { symbol, legs: [] });
      groups.get(positionId)!.legs.push(leg);
    } catch {
      result.errors.push(`Row ${i + 1}: Parse error`);
      result.summary.failed++;
    }
  }

  const dates: string[] = [];

  for (const [positionId, { symbol, legs }] of groups) {
    const opens = legs.filter(l => l.isOpen);
    const closes = legs.filter(l => !l.isOpen);

    if (!opens.length || !closes.length) {
      result.errors.push(`Position ${positionId} (${symbol}): still open or missing a leg — skipped`);
      result.summary.failed++;
      continue;
    }

    const openLots = opens.reduce((s, l) => s + l.lots, 0);
    const closeLots = closes.reduce((s, l) => s + l.lots, 0);
    const wAvg = (ls: Leg[], total: number) =>
      total > 0 ? ls.reduce((s, l) => s + l.price * l.lots, 0) / total : (ls[0]?.price || 0);

    const entryPrice = wAvg(opens, openLots);
    const exitPrice = wAvg(closes, closeLots);
    const side: 'long' | 'short' = opens[0].isBuy ? 'long' : 'short';
    const pnl = legs.reduce((s, l) => s + l.profit, 0);
    const commission = legs.reduce((s, l) => s + l.commission, 0);
    const swap = legs.reduce((s, l) => s + l.swap, 0);

    const openTimes = opens.map(l => l.time).filter(Boolean).sort();
    const closeTimes = closes.map(l => l.time).filter(Boolean).sort();
    const entryDate = openTimes[0] || formatLocalDateTime(new Date());
    const exitDate = closeTimes[closeTimes.length - 1] || entryDate;
    dates.push(exitDate);

    result.trades.push({
      symbol,
      side,
      entryPrice: entryPrice.toFixed(6),
      exitPrice: exitPrice.toFixed(6),
      quantity: (openLots || closeLots).toString(),
      pnl: pnl.toFixed(2),
      date: exitDate,
      entryDate,
      exitDate,
      commission: commission ? Math.abs(commission).toString() : undefined,
      fees: swap ? Math.abs(swap).toString() : undefined,
    });
    result.summary.successfulParsed++;
  }

  if (dates.length > 0) {
    const sorted = dates.sort();
    result.summary.dateRange = { earliest: sorted[0], latest: sorted[sorted.length - 1] };
  }
  result.success = result.trades.length > 0;
  if (!result.success) {
    result.errors.push('No completed positions found in the MT5 position-history export');
  }
  return result;
}

// Skip preamble/title rows: find the first row that parses to a header with at
// least a symbol column and a price-or-P&L column. Falls back to row 0 (the
// common case where the first line is already the header).
function findStandardHeaderRow(lines: string[], delimiter: string): number {
  const limit = Math.min(lines.length, 15);
  for (let i = 0; i < limit; i++) {
    const headers = parseCSVLine(lines[i], delimiter);
    if (headers.filter(h => h.trim()).length < 2) continue;
    const hasSymbol = findColumnIndex(headers, COLUMN_MAPPINGS.standard.symbol) !== -1;
    const hasPriceOrPnl =
      findColumnIndex(headers, COLUMN_MAPPINGS.standard.openPrice) !== -1 ||
      findColumnIndex(headers, COLUMN_MAPPINGS.standard.pnl) !== -1;
    if (hasSymbol && hasPriceOrPnl) return i;
  }
  return 0;
}

export function parseCSV(csvContent: string, options?: { dayFirst?: boolean }): CSVParseResult {
  // Strip BOM character that some exports (e.g. Topstep) include
  csvContent = csvContent.replace(/^\uFEFF/, '');

  const result: CSVParseResult = {
    success: false,
    trades: [],
    errors: [],
    summary: {
      totalRows: 0,
      successfulParsed: 0,
      failed: 0,
      dateRange: null
    }
  };

  try {
    const rawLines = csvContent.trim().split('\n');
    if (rawLines.length < 2) {
      result.errors.push('CSV file must contain at least a header row and one data row');
      return result;
    }

    // MT5 / IC Markets position-history: header sits below preamble rows and the
    // layout is two legs per position, so detect it before anything else.
    const mt5HeaderRow = findMT5HeaderRow(rawLines);
    if (mt5HeaderRow !== -1) {
      return parseMT5DealHistory(rawLines, mt5HeaderRow);
    }

    // Sniff the delimiter (comma / semicolon / tab) and whether numbers use a
    // decimal comma (European exports). Then skip any preamble rows.
    const delimiter = detectDelimiter(rawLines);
    const decimalComma = delimiter === ';';
    const headerRow = findStandardHeaderRow(rawLines, delimiter);
    const lines = rawLines.slice(headerRow);

    const headers = parseCSVLine(lines[0], delimiter);

    // Garbage guard: a single detected column means we couldn't understand the
    // file's structure. Fail loudly instead of importing one-field junk as trades.
    if (headers.filter(h => h.trim()).length < 2) {
      result.errors.push('Could not detect columns \u2014 the file may use an unsupported delimiter or format.');
      return result;
    }

    // Broker-specific detectors are comma-delimited US formats.
    if (delimiter === ',') {
      if (isIBKRClosedPositions(headers)) return parseIBKRClosedPositions(lines, headers);
      if (isIBKRTradesFormat(headers)) return parseIBKRTrades(lines, headers);
      if (isTopStepOrderFormat(headers)) return parseTopStepOrders(lines, headers);
      if (isTradovateFormat(headers)) return parseTradovateOrders(lines, headers);
      if (isTradovatePerformanceFormat(headers)) return parseTradovatePerformance(lines, headers);
    }

    // Find column indices
    const columnIndices = {
      symbol: findColumnIndex(headers, COLUMN_MAPPINGS.standard.symbol),
      side: findColumnIndex(headers, COLUMN_MAPPINGS.standard.side),
      openPrice: findColumnIndex(headers, COLUMN_MAPPINGS.standard.openPrice),
      closePrice: findColumnIndex(headers, COLUMN_MAPPINGS.standard.closePrice),
      quantity: findColumnIndex(headers, COLUMN_MAPPINGS.standard.quantity),
      pnl: findColumnIndex(headers, COLUMN_MAPPINGS.standard.pnl),
      openTime: findColumnIndex(headers, COLUMN_MAPPINGS.standard.openTime),
      closeTime: findColumnIndex(headers, COLUMN_MAPPINGS.standard.closeTime),
      commission: findColumnIndex(headers, COLUMN_MAPPINGS.standard.commission),
      fees: findColumnIndex(headers, COLUMN_MAPPINGS.standard.fees),
    };


    // Validate required columns
    const requiredColumns = ['symbol', 'side', 'openPrice', 'closePrice', 'quantity', 'pnl'];
    const missingColumns = requiredColumns.filter(col => columnIndices[col as keyof typeof columnIndices] === -1);

    if (missingColumns.length > 0) {
      result.errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
      result.errors.push(`Available columns: ${headers.join(', ')}`);
      return result;
    }

    // Decide DD/MM vs MM/DD for the whole file: explicit option wins, otherwise
    // infer from every date value, otherwise fall back to MM/DD (US default).
    let dayFirst = options?.dayFirst;
    if (dayFirst === undefined) {
      const dateCol = columnIndices.openTime !== -1 ? columnIndices.openTime : columnIndices.closeTime;
      if (dateCol !== -1) {
        const samples: string[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const f = parseCSVLine(lines[i], delimiter);
          if (f[dateCol]) samples.push(f[dateCol]);
        }
        dayFirst = detectDayFirst(samples);
      }
    }

    // Parse data rows
    const dates: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      result.summary.totalRows++;

      try {
        const fields = parseCSVLine(lines[i], delimiter);

        if (fields.length < headers.length) {
          result.errors.push(`Row ${i + 1}: Insufficient columns (${fields.length} vs ${headers.length} expected)`);
          result.summary.failed++;
          continue;
        }

        // Extract data
        const symbol = fields[columnIndices.symbol] || '';
        const side = fields[columnIndices.side] || '';
        const openPrice = fields[columnIndices.openPrice] || '';
        const closePrice = fields[columnIndices.closePrice] || '';
        const quantity = fields[columnIndices.quantity] || '';
        const pnl = fields[columnIndices.pnl] || '';

        // Use open time if available, otherwise close time, otherwise current date
        const openTimeField = columnIndices.openTime !== -1 ? fields[columnIndices.openTime] : '';
        const closeTimeField = columnIndices.closeTime !== -1 ? fields[columnIndices.closeTime] : '';
        const commissionField = columnIndices.commission !== -1 ? fields[columnIndices.commission] : '';
        const feesField = columnIndices.fees !== -1 ? fields[columnIndices.fees] : '';
        const dateField = openTimeField || closeTimeField;

        // Validate required fields
        if (!symbol || !side || !openPrice || !closePrice) {
          result.errors.push(`Row ${i + 1}: Missing required data (symbol: ${symbol}, side: ${side}, openPrice: ${openPrice}, closePrice: ${closePrice})`);
          result.summary.failed++;
          continue;
        }

        // Garbage guard: prices must parse to finite, positive numbers. Catches
        // mis-delimited rows that would otherwise import as entry=exit=NaN/0.
        const entryNum = parseFloat(cleanNumeric(openPrice, decimalComma));
        const exitNum = parseFloat(cleanNumeric(closePrice, decimalComma));
        if (!isFinite(entryNum) || !isFinite(exitNum) || entryNum <= 0 || exitNum <= 0) {
          result.errors.push(`Row ${i + 1}: Invalid price (entry: ${openPrice}, exit: ${closePrice})`);
          result.summary.failed++;
          continue;
        }

        const parsedDate = parseDateString(dateField, dayFirst);
        const entryDate = openTimeField ? parseDateString(openTimeField, dayFirst) : parsedDate;
        const exitDate = closeTimeField ? parseDateString(closeTimeField, dayFirst) : parsedDate;
        dates.push(parsedDate);

        const trade: ParsedTrade = {
          symbol: symbol.trim(),
          side: normalizeSide(side),
          entryPrice: cleanNumeric(openPrice, decimalComma),
          exitPrice: cleanNumeric(closePrice, decimalComma),
          quantity: cleanNumeric(quantity, decimalComma) || '1',
          pnl: parseCurrency(pnl, decimalComma).toString(),
          date: parsedDate,
          entryDate,
          exitDate,
          commission: commissionField ? Math.abs(parseCurrency(commissionField, decimalComma)).toString() : undefined,
          fees: feesField ? Math.abs(parseCurrency(feesField, decimalComma)).toString() : undefined,
        };

        result.trades.push(trade);
        result.summary.successfulParsed++;

      } catch (error) {
        result.errors.push(`Row ${i + 1}: Parse error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.summary.failed++;
      }
    }

    // Calculate date range
    if (dates.length > 0) {
      const sortedDates = dates.sort();
      result.summary.dateRange = {
        earliest: sortedDates[0],
        latest: sortedDates[sortedDates.length - 1]
      };
    }

    result.success = result.trades.length > 0;

    if (result.trades.length === 0) {
      result.errors.push('No valid trades were parsed from the CSV file');
    }

  } catch (error) {
    result.errors.push(`General parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

export function parseCSVHeaders(csvContent: string): string[] {
  const cleaned = csvContent.replace(/^\uFEFF/, '');
  const lines = cleaned.trim().split('\n');
  if (!lines.length) return [];
  const delimiter = detectDelimiter(lines);
  const headerRow = findStandardHeaderRow(lines, delimiter);
  return parseCSVLine(lines[headerRow] || '', delimiter);
}

export function parseCSVWithMappings(csvContent: string, mappings: Record<string, number>): CSVParseResult {
  csvContent = csvContent.replace(/^\uFEFF/, '');

  const result: CSVParseResult = {
    success: false,
    trades: [],
    errors: [],
    summary: {
      totalRows: 0,
      successfulParsed: 0,
      failed: 0,
      dateRange: null
    }
  };

  try {
    const rawLines = csvContent.trim().split('\n');
    if (rawLines.length < 2) {
      result.errors.push('CSV file must contain at least a header row and one data row');
      return result;
    }

    // Use the same delimiter + preamble detection as parseCSVHeaders so the
    // mapped column indices line up and data starts after the real header row.
    const delimiter = detectDelimiter(rawLines);
    const decimalComma = delimiter === ';';
    const headerRow = findStandardHeaderRow(rawLines, delimiter);
    const lines = rawLines.slice(headerRow);

    // Infer DD/MM vs MM/DD across the chosen date column.
    let dayFirst: boolean | undefined;
    const dateCol = mappings.openTime >= 0 ? mappings.openTime : mappings.closeTime;
    if (dateCol >= 0) {
      const samples: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const f = parseCSVLine(lines[i], delimiter);
        if (f[dateCol]) samples.push(f[dateCol]);
      }
      dayFirst = detectDayFirst(samples);
    }

    const dates: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      result.summary.totalRows++;

      try {
        const fields = parseCSVLine(line, delimiter);

        const symbol = mappings.symbol >= 0 ? (fields[mappings.symbol] || '') : '';
        const side = mappings.side >= 0 ? (fields[mappings.side] || '') : '';
        const openPrice = mappings.openPrice >= 0 ? (fields[mappings.openPrice] || '') : '';
        const closePrice = mappings.closePrice >= 0 ? (fields[mappings.closePrice] || '') : '';
        const quantity = mappings.quantity >= 0 ? (fields[mappings.quantity] || '') : '';
        const pnl = mappings.pnl >= 0 ? (fields[mappings.pnl] || '') : '';

        const openTimeField = mappings.openTime >= 0 ? (fields[mappings.openTime] || '') : '';
        const closeTimeField = mappings.closeTime >= 0 ? (fields[mappings.closeTime] || '') : '';
        const commissionField = mappings.commission >= 0 ? (fields[mappings.commission] || '') : '';
        const feesField = mappings.fees >= 0 ? (fields[mappings.fees] || '') : '';
        const dateField = openTimeField || closeTimeField;

        if (!symbol || !side || !openPrice || !closePrice) {
          result.errors.push(`Row ${i + 1}: Missing required data (symbol: ${symbol}, side: ${side}, openPrice: ${openPrice}, closePrice: ${closePrice})`);
          result.summary.failed++;
          continue;
        }

        const entryNum = parseFloat(cleanNumeric(openPrice, decimalComma));
        const exitNum = parseFloat(cleanNumeric(closePrice, decimalComma));
        if (!isFinite(entryNum) || !isFinite(exitNum) || entryNum <= 0 || exitNum <= 0) {
          result.errors.push(`Row ${i + 1}: Invalid price (entry: ${openPrice}, exit: ${closePrice})`);
          result.summary.failed++;
          continue;
        }

        const parsedDate = parseDateString(dateField, dayFirst);
        const entryDate = openTimeField ? parseDateString(openTimeField, dayFirst) : parsedDate;
        const exitDate = closeTimeField ? parseDateString(closeTimeField, dayFirst) : parsedDate;
        dates.push(parsedDate);

        const trade: ParsedTrade = {
          symbol: symbol.trim(),
          side: normalizeSide(side),
          entryPrice: cleanNumeric(openPrice, decimalComma),
          exitPrice: cleanNumeric(closePrice, decimalComma),
          quantity: cleanNumeric(quantity, decimalComma) || '1',
          pnl: parseCurrency(pnl, decimalComma).toString(),
          date: parsedDate,
          entryDate,
          exitDate,
          commission: commissionField ? Math.abs(parseCurrency(commissionField, decimalComma)).toString() : undefined,
          fees: feesField ? Math.abs(parseCurrency(feesField, decimalComma)).toString() : undefined,
        };

        result.trades.push(trade);
        result.summary.successfulParsed++;
      } catch (error) {
        result.errors.push(`Row ${i + 1}: Parse error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.summary.failed++;
      }
    }

    if (dates.length > 0) {
      const sortedDates = dates.sort();
      result.summary.dateRange = {
        earliest: sortedDates[0],
        latest: sortedDates[sortedDates.length - 1]
      };
    }

    result.success = result.trades.length > 0;

    if (result.trades.length === 0) {
      result.errors.push('No valid trades were parsed from the CSV file');
    }
  } catch (error) {
    result.errors.push(`General parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

export function validateCSVFile(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isCSV && !isExcel) {
      reject(new Error('Please select a CSV or Excel file'));
      return;
    }

    if (file.size === 0) {
      reject(new Error('The selected file is empty'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      reject(new Error('File size too large. Please select a file smaller than 10MB'));
      return;
    }

    try {
      if (isExcel) {
        // Handle Excel files
        const [XLSX, arrayBuffer] = await Promise.all([
          import('xlsx'),
          file.arrayBuffer(),
        ]);
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        resolve(csvData);
      } else {
        // Handle CSV files
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          resolve(content);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read the file'));
        };
        reader.readAsText(file);
      }
    } catch (error) {
      reject(new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}
