// CSV Parser for trading platform data
export interface ParsedTrade {
  symbol: string;
  side: 'long' | 'short';
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  pnl: string;
  date: string;
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
    symbol: ['Symbol', 'Instrument', 'Pair', 'ContractName', 'Contract'],
    side: ['Side', 'Type', 'Direction', 'Action'],
    openPrice: ['Open Price', 'Entry Price', 'Open', 'Entry', 'EntryPrice'],
    closePrice: ['Close Price', 'Exit Price', 'Close', 'Exit', 'ExitPrice'],
    quantity: ['Lots', 'Volume', 'Size', 'Quantity', 'Units'],
    pnl: ['PnL', 'Profit', 'P&L', 'Gain', 'Net P/L'],
    openTime: ['Open Time', 'Entry Time', 'Date', 'Time', 'Open Date', 'EnteredAt', 'TradeDay'],
    closeTime: ['Close Time', 'Exit Time', 'Close Date', 'ExitedAt'],
  }
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
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
  for (const name of possibleNames) {
    const index = headers.findIndex(h =>
      h.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(h.toLowerCase())
    );
    if (index !== -1) return index;
  }
  return -1;
}

function parseCurrency(value: string): number {
  // Remove currency symbols and parse
  const cleaned = value.replace(/[$£€¥₹,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

function parseDateString(dateStr: string): string {
  try {
    // Strip timezone offset suffix like "+00:00" or "-06:00"
    const cleaned = dateStr.replace(/\s*[+-]\d{2}:\d{2}\s*$/, '').trim();

    let date: Date;

    // Format with slashes: could be DD/MM/YYYY or MM/DD/YYYY
    if (cleaned.includes('/')) {
      const [datePart] = cleaned.split(' ');
      const parts = datePart.split('/');
      const a = parseInt(parts[0]);
      const b = parseInt(parts[1]);
      const year = parseInt(parts[2]);

      // If second part > 12, it must be MM/DD/YYYY (e.g. 01/28/2026 from Topstep)
      // If first part > 12, it must be DD/MM/YYYY (e.g. 28/08/2025 from MT5)
      // If both <= 12, try MM/DD/YYYY first (US format, more common in prop firm exports)
      if (b > 12) {
        // MM/DD/YYYY
        date = new Date(year, a - 1, b);
      } else if (a > 12) {
        // DD/MM/YYYY
        date = new Date(year, b - 1, a);
      } else {
        // Ambiguous — try MM/DD/YYYY first (US format)
        date = new Date(year, a - 1, b);
      }
    }
    // Format: "2025-08-28" or "2025-08-28 00:37:54"
    else if (cleaned.includes('-')) {
      date = new Date(cleaned.split(' ')[0]);
    }
    // Fallback
    else {
      date = new Date(cleaned);
    }

    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }

    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function normalizeSide(side: string): 'long' | 'short' {
  const normalized = side.toLowerCase().trim();
  if (normalized === 'buy' || normalized === 'long' || normalized === 'l' || normalized === 'bid') {
    return 'long';
  }
  return 'short';
}

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

          const tradeDate = parseDateString(order.tradeDay || open.tradeDay || order.filledAt);
          dates.push(tradeDate);

          result.trades.push({
            symbol: order.contractName,
            side: isLong ? 'long' : 'short',
            entryPrice: open.price.toFixed(6),
            exitPrice: exitPrice.toFixed(6),
            quantity: matched.toString(),
            pnl: pnlRaw.toFixed(2),
            date: tradeDate,
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

export function parseCSV(csvContent: string): CSVParseResult {
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
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      result.errors.push('CSV file must contain at least a header row and one data row');
      return result;
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);

    // Check if this is a TopStep order-level export
    if (isTopStepOrderFormat(headers)) {
      return parseTopStepOrders(lines, headers);
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
    };


    // Validate required columns
    const requiredColumns = ['symbol', 'side', 'openPrice', 'closePrice', 'quantity', 'pnl'];
    const missingColumns = requiredColumns.filter(col => columnIndices[col as keyof typeof columnIndices] === -1);

    if (missingColumns.length > 0) {
      result.errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
      result.errors.push(`Available columns: ${headers.join(', ')}`);
      return result;
    }

    // Parse data rows
    const dates: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      result.summary.totalRows++;

      try {
        const fields = parseCSVLine(lines[i]);

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
        const dateField = columnIndices.openTime !== -1 ? fields[columnIndices.openTime] :
                         columnIndices.closeTime !== -1 ? fields[columnIndices.closeTime] : '';

        // Validate required fields
        if (!symbol || !side || !openPrice || !closePrice) {
          result.errors.push(`Row ${i + 1}: Missing required data (symbol: ${symbol}, side: ${side}, openPrice: ${openPrice}, closePrice: ${closePrice})`);
          result.summary.failed++;
          continue;
        }

        const parsedDate = parseDateString(dateField);
        dates.push(parsedDate);

        const trade: ParsedTrade = {
          symbol: symbol.trim(),
          side: normalizeSide(side),
          entryPrice: openPrice.replace(/[^0-9.-]/g, ''),
          exitPrice: closePrice.replace(/[^0-9.-]/g, ''),
          quantity: quantity.replace(/[^0-9.-]/g, '') || '1',
          pnl: parseCurrency(pnl).toString(),
          date: parsedDate
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
  const firstLine = cleaned.trim().split('\n')[0] || '';
  return parseCSVLine(firstLine);
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
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      result.errors.push('CSV file must contain at least a header row and one data row');
      return result;
    }

    const dates: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      result.summary.totalRows++;

      try {
        const fields = parseCSVLine(line);

        const symbol = mappings.symbol >= 0 ? (fields[mappings.symbol] || '') : '';
        const side = mappings.side >= 0 ? (fields[mappings.side] || '') : '';
        const openPrice = mappings.openPrice >= 0 ? (fields[mappings.openPrice] || '') : '';
        const closePrice = mappings.closePrice >= 0 ? (fields[mappings.closePrice] || '') : '';
        const quantity = mappings.quantity >= 0 ? (fields[mappings.quantity] || '') : '';
        const pnl = mappings.pnl >= 0 ? (fields[mappings.pnl] || '') : '';

        const dateField = mappings.openTime >= 0 ? (fields[mappings.openTime] || '') :
                          mappings.closeTime >= 0 ? (fields[mappings.closeTime] || '') : '';

        if (!symbol || !side || !openPrice || !closePrice) {
          result.errors.push(`Row ${i + 1}: Missing required data (symbol: ${symbol}, side: ${side}, openPrice: ${openPrice}, closePrice: ${closePrice})`);
          result.summary.failed++;
          continue;
        }

        const parsedDate = parseDateString(dateField);
        dates.push(parsedDate);

        const trade: ParsedTrade = {
          symbol: symbol.trim(),
          side: normalizeSide(side),
          entryPrice: openPrice.replace(/[^0-9.-]/g, ''),
          exitPrice: closePrice.replace(/[^0-9.-]/g, ''),
          quantity: quantity.replace(/[^0-9.-]/g, '') || '1',
          pnl: parseCurrency(pnl).toString(),
          date: parsedDate
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
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
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
