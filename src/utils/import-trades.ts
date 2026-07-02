// Shared CSV-import helpers used by BOTH the Trade Log and the Dashboard import
// flows, so a file produces identical trades no matter where it is dropped.
// (Previously each page converted ParsedTrade -> Trade differently, which is how
// the dashboard import shipped invalid dates and dropped commissions/fees.)
import { findColumnIndex, parseCSVHeaders, type ParsedTrade } from './csv-parser';

// Column synonyms offered when auto-detection fails and the user maps manually.
// Kept in one place so the Trade Log and Dashboard mapping dialogs stay in sync.
export const MAPPING_FIELDS: Record<string, string[]> = {
  symbol: ['Symbol', 'Instrument', 'Pair', 'ContractName', 'Contract', 'Market'],
  side: ['Side', 'Type', 'Direction', 'Action', 'B/S', 'Buy/Sell', 'Market pos.', 'Market position'],
  openPrice: ['Open Price', 'Entry Price', 'Open', 'Entry', 'EntryPrice', 'Avg Entry Price'],
  closePrice: ['Close Price', 'Exit Price', 'Close', 'Exit', 'ExitPrice', 'Avg Exit Price'],
  quantity: ['Lots', 'Volume', 'Size', 'Quantity', 'Units', 'Qty', 'Filled Qty', 'Shares', 'Amount'],
  pnl: ['PnL', 'Profit', 'P&L', 'Gain', 'Net P/L', 'Realized P/L', 'Realized P&L', 'Net Profit'],
  openTime: ['Open Time', 'Entry Time', 'Date', 'Time', 'Open Date', 'EnteredAt', 'TradeDay'],
  closeTime: ['Close Time', 'Exit Time', 'Close Date', 'ExitedAt'],
};

export interface ColumnMapping {
  show: boolean;
  headers: string[];
  file: File | null;
  csvContent: string;
  mappings: Record<string, number>;
}

// Build the initial mapping state (with best-guess column matches) for the
// manual-mapping dialog when parseCSV can't auto-detect the format.
export function buildColumnMapping(csvContent: string, file: File): ColumnMapping {
  const headers = parseCSVHeaders(csvContent);
  const mappings: Record<string, number> = {};
  for (const [field, names] of Object.entries(MAPPING_FIELDS)) {
    mappings[field] = findColumnIndex(headers, names);
  }
  return { show: true, headers, file, csvContent, mappings };
}

export type ImportMarket = 'forex' | 'futures' | 'indices';

// The full stored-trade shape the app persists. Structurally assignable to the
// page-level Trade interfaces (which carry the same required fields).
export interface ImportedTrade {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  entryTime: Date;
  exitTime: Date;
  spread: number;
  commission: number;
  fees: number;
  swap: number;
  pnl: number;
  brokerPnL: number;
  pnlPercentage: number;
  riskReward: number;
  notes: string;
  strategy: string;
  market: ImportMarket;
  accountId: string;
}

const FUTURES_PREFIXES = [
  'ES', 'NQ', 'YM', 'RTY', 'MES', 'MNQ', 'MYM', 'M2K',
  'CL', 'MCL', 'NG', 'RB', 'GC', 'MGC', 'SI', 'HG',
  'ZC', 'ZS', 'ZW', 'ZN', 'ZB', 'M6E', 'M6B',
  'NAS100', 'SPX500', 'US30', 'US100', 'GER40', 'UK100',
  'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD',   // Metals
  'USOIL', 'UKOIL', 'NATGAS',               // Energy
];

const INDEX_SYMBOLS = new Set(['SPY', 'QQQ', 'DIA', 'IWM', 'XLF', 'XLK', 'XLE', 'XLV', 'EFA', 'EEM', 'VGK']);

const FOREX_PAIRS = new Set([
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'EURJPY', 'GBPJPY', 'EURGBP', 'EURAUD', 'EURNZD', 'EURCHF',
  'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPNZD',
  'AUDJPY', 'NZDJPY', 'CADJPY', 'CHFJPY', 'AUDCAD', 'AUDNZD',
  'USDSEK', 'USDNOK', 'USDDKK', 'USDSGD', 'USDMXN', 'USDZAR',
]);

export function detectMarketFromSymbol(symbol: string): ImportMarket {
  const upper = (symbol || '').toUpperCase();
  // Handle month/year codes like MNQU5, ESU24 via prefix match.
  if (FUTURES_PREFIXES.some(fut => upper.startsWith(fut))) return 'futures';
  if (INDEX_SYMBOLS.has(upper)) return 'indices';
  if (FOREX_PAIRS.has(upper)) return 'forex';
  return 'forex'; // default for currency-pair-like symbols
}

// Convert parsed CSV rows into stored trades. Broker P&L is gross (before costs):
// commission + fees are subtracted so the dashboard shows true net immediately,
// while the gross value is preserved as brokerPnL — the source of truth on edits.
export function buildImportedTrades(
  trades: ParsedTrade[],
  opts: { fileName: string; accountId: string; source?: string }
): ImportedTrade[] {
  const stamp = Date.now();
  return trades.map((trade, index) => {
    const reportedPnl = parseFloat(trade.pnl) || 0;
    const commission = trade.commission ? parseFloat(trade.commission) || 0 : 0;
    const fees = trade.fees ? parseFloat(trade.fees) || 0 : 0;
    // Most brokers report GROSS P&L, so net = gross - costs. NinjaTrader's
    // "Profit" is already NET of commissions (pnlIsNet): keep it as the net and
    // reconstruct gross (net + costs) so we never subtract commissions twice and
    // the edit-time invariant (net = brokerPnL - commission - fees) still holds.
    const netPnl = trade.pnlIsNet ? reportedPnl : reportedPnl - commission - fees;
    const grossPnl = trade.pnlIsNet ? reportedPnl + commission + fees : reportedPnl;
    return {
      id: `csv-${stamp}-${index}`,
      symbol: trade.symbol,
      side: trade.side,
      entryPrice: parseFloat(trade.entryPrice) || 0,
      exitPrice: parseFloat(trade.exitPrice) || 0,
      lotSize: parseFloat(trade.quantity) || 1,
      entryTime: new Date(trade.entryDate || trade.date),
      exitTime: new Date(trade.exitDate || trade.date),
      spread: 0,
      commission,
      fees,
      swap: 0,
      pnl: netPnl,
      brokerPnL: grossPnl,
      pnlPercentage: 0,
      riskReward: 0,
      notes: opts.source
        ? `Imported from ${opts.fileName} via ${opts.source}`
        : `Imported from ${opts.fileName}`,
      strategy: '',
      market: detectMarketFromSymbol(trade.symbol),
      accountId: opts.accountId,
    };
  });
}

type Fingerprintable = {
  symbol: string;
  side: string;
  entryPrice: number;
  exitPrice: number;
  lotSize?: number;
  quantity?: number;
  pnl: number;
  entryTime: Date | string | number;
  exitTime: Date | string | number;
};

export function tradeFingerprint(t: Fingerprintable): string {
  const lot = t.lotSize ?? t.quantity ?? 0;
  return `${t.symbol}|${t.side}|${t.entryPrice}|${t.exitPrice}|${lot}|${t.pnl}|${new Date(t.entryTime).getTime()}|${new Date(t.exitTime).getTime()}`;
}

// Skip trades already present (same symbol/side/prices/size/pnl/timestamps).
export function dedupeImportedTrades<T extends Fingerprintable>(
  existing: Fingerprintable[],
  incoming: T[]
): { newTrades: T[]; skippedCount: number } {
  const seen = new Set(existing.map(tradeFingerprint));
  const newTrades = incoming.filter(t => !seen.has(tradeFingerprint(t)));
  return { newTrades, skippedCount: incoming.length - newTrades.length };
}
