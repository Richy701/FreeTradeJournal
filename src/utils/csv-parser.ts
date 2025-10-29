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
  // Your current format (MT5-like)
  standard: {
    symbol: ['Symbol', 'Instrument', 'Pair'],
    side: ['Side', 'Type', 'Direction', 'Action'],
    openPrice: ['Open Price', 'Entry Price', 'Open', 'Entry'],
    closePrice: ['Close Price', 'Exit Price', 'Close', 'Exit'],
    quantity: ['Lots', 'Volume', 'Size', 'Quantity', 'Units'],
    pnl: ['PnL', 'Profit', 'P&L', 'Gain', 'Net P/L'],
    openTime: ['Open Time', 'Entry Time', 'Date', 'Time', 'Open Date'],
    closeTime: ['Close Time', 'Exit Time', 'Close Date'],
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

function findColumnIndex(headers: string[], possibleNames: string[]): number {
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
    // Handle various date formats
    let date: Date;
    
    // Format: "28/08/2025 00:37:54" or "28/08/2025"
    if (dateStr.includes('/')) {
      const [datePart] = dateStr.split(' ');
      const [day, month, year] = datePart.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Format: "2025-08-28" or "2025-08-28 00:37:54"
    else if (dateStr.includes('-')) {
      date = new Date(dateStr.split(' ')[0]);
    }
    // Fallback
    else {
      date = new Date(dateStr);
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
  if (normalized === 'buy' || normalized === 'long' || normalized === 'l') {
    return 'long';
  }
  return 'short';
}

export function parseCSV(csvContent: string): CSVParseResult {
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