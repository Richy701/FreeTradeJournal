import { detectMarketFromSymbol } from '@/utils/import-trades';

// Forex quotes need their full precision (1.08523, not 1.09); JPY-style pairs
// quote to 3 decimals. Futures/indices stay at 2.
// Stored trades can carry null/NaN prices (manual-P&L trades saved without
// prices round-trip NaN → JSON null) — render those as '-' instead of crashing
// the whole table on null.toFixed.
export function formatPrice(price: number | null | undefined, symbol?: string): string {
  if (price == null || !Number.isFinite(price)) return '-';
  if (symbol && detectMarketFromSymbol(symbol) === 'forex') {
    return price.toFixed(/JPY|HUF|THB/.test(symbol.toUpperCase()) ? 3 : 5);
  }
  return price.toFixed(2);
}
