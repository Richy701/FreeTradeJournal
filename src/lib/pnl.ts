// Single source of truth for P&L math. TradeLog's manual form, the Dashboard
// quick-add, and the CSV importers must all compute gross P&L through this
// module — do not add another inline formula or multiplier table elsewhere.

// Dollars per 1.0 price-unit move, per single contract.
// CSV symbols include month/year codes (e.g. MNQH6) — resolve via
// getFuturesMultiplier, which strips them. Longer keys must be matched before
// their substrings (MES before ES), which lookup handles by exact base match.
export const FUTURES_MULTIPLIERS: Record<string, number> = {
  // Micro E-minis
  MNQ: 2,     // Micro E-mini Nasdaq — $0.50/tick (0.25pt)
  MES: 5,     // Micro E-mini S&P 500 — $1.25/tick (0.25pt)
  MYM: 0.5,   // Micro E-mini Dow — $0.50/tick (1pt)
  M2K: 5,     // Micro E-mini Russell — $0.50/tick (0.10pt)
  // E-minis
  NQ: 20,     // E-mini Nasdaq — $5.00/tick (0.25pt)
  ES: 50,     // E-mini S&P 500 — $12.50/tick (0.25pt)
  YM: 5,      // E-mini Dow — $5.00/tick (1pt)
  RTY: 50,    // E-mini Russell — $5.00/tick (0.10pt)
  // Metals
  MGC: 10,    // Micro Gold (10oz) — $1.00/tick (0.10pt)
  GC: 100,    // Gold (100oz) — $10.00/tick (0.10pt)
  SIL: 1000,  // Micro Silver (1,000oz) — $5.00/tick (0.005pt)
  SI: 5000,   // Silver (5,000oz) — $25.00/tick (0.005pt)
  MHG: 2500,  // Micro Copper (2,500lb) — $1.25/tick (0.0005pt)
  HG: 25000,  // Copper (25,000lb) — $12.50/tick (0.0005pt)
  // Energy
  MCL: 100,   // Micro Crude (100bbl) — $1.00/tick (0.01pt)
  CL: 1000,   // Crude Oil (1,000bbl) — $10.00/tick (0.01pt)
  QM: 500,    // E-mini Crude (500bbl) — $12.50/tick (0.025pt)
  MNG: 1000,  // Micro Natural Gas (1,000 MMBtu) — $1.00/tick (0.001pt)
  NG: 10000,  // Natural Gas (10,000 MMBtu) — $10.00/tick (0.001pt)
  // Grains (quoted in cents/bushel; 5,000bu = $50 per 1¢)
  ZC: 50,     // Corn
  ZS: 50,     // Soybeans
  ZW: 50,     // Wheat
  // Treasuries (per full point of par)
  ZN: 1000,   // 10-Year T-Note
  ZB: 1000,   // 30-Year T-Bond
  // Currency futures
  M6E: 12500,  // Micro Euro (€12,500)
  M6B: 6250,   // Micro British Pound (£6,250)
  '6E': 125000, // Euro FX (€125,000)
  '6B': 62500,  // British Pound (£62,500)
};

// Spot-metal lot sizes (forex-broker symbols): ounces per 1.0 lot.
const SPOT_METAL_LOT_UNITS: Record<string, number> = {
  XAU: 100,   // Gold — 100oz per standard lot
  XAG: 5000,  // Silver — 5,000oz per standard lot
};

const FOREX_UNITS_PER_LOT = 100000;

// ISO codes we accept as a quote currency. Broker symbols carry suffixes
// (EURUSDm, EURUSD.a) whose trailing letters would otherwise be mistaken for
// the quote ("SDM"), wrongly triggering quote→USD conversion on every trade.
const CURRENCY_CODES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
  'SEK', 'NOK', 'DKK', 'SGD', 'HKD', 'MXN', 'ZAR', 'TRY',
  'PLN', 'CZK', 'HUF', 'CNH', 'CNY',
]);

/** Quote currency of a forex-style symbol, or null when we can't tell.
    Prefers the 3-letter code at positions 3-6 (EURUSDm → USD) and only falls
    back to the last 3 letters when they form a known code. */
export function forexQuoteCurrency(symbol: string): string | null {
  const letters = (symbol || '').toUpperCase().replace(/[^A-Z]/g, '');
  const base = letters.slice(0, 3);
  const quote = letters.slice(3, 6);
  if (letters.length >= 6 && (CURRENCY_CODES.has(base) || SPOT_METAL_LOT_UNITS[base]) && CURRENCY_CODES.has(quote)) {
    return quote;
  }
  const tail = letters.slice(-3);
  return CURRENCY_CODES.has(tail) ? tail : null;
}

/** Strip the month/year code from a futures contract name (MNQH6 → MNQ, ESU24 → ES). */
export function futuresBaseSymbol(contractName: string): string {
  return contractName.trim().toUpperCase().replace(/[FGHJKMNQUVXZ]\d{1,2}$/, '');
}

/** Dollars per 1.0 price move for ONE contract. Falls back to 1 for unknown symbols. */
export function getFuturesMultiplier(contractName: string): number {
  return FUTURES_MULTIPLIERS[futuresBaseSymbol(contractName)] || 1;
}

export type PnlSide = 'long' | 'short';

export interface GrossPnlInput {
  symbol: string;
  /** 'forex' | 'futures' | 'indices' (anything else falls back to price-diff × quantity) */
  market: string;
  side: PnlSide;
  entryPrice: number;
  exitPrice: number;
  /** Lots for forex, contracts for futures/indices. */
  quantity: number;
  /** Per-contract override of the symbol/market multiplier when > 0:
      gross = diff × customMultiplier × quantity. */
  customMultiplier?: number;
}

/**
 * Gross P&L in account (USD) terms, before commissions/fees/swap/spread.
 *
 * forex: standard 100k-unit lots; spot metals (XAU/XAG) use their real lot
 * sizes. When the quote currency is not USD (USDJPY, USDCAD, EURJPY…) the
 * quote-currency P&L is converted to USD at the exit rate — exact for
 * USD-base pairs, an approximation for crosses (the true conversion needs
 * the USD rate of the quote currency, which we don't have at entry time).
 *
 * futures: per-contract dollar multiplier × number of contracts.
 * indices: 1 point = $1 per contract (CFD-style) × number of contracts.
 */
export function calculateGrossPnl(input: GrossPnlInput): number {
  const { symbol, market, side, entryPrice, exitPrice, quantity, customMultiplier } = input;
  const diff = (exitPrice - entryPrice) * (side === 'long' ? 1 : -1);

  if (customMultiplier && customMultiplier > 0) {
    return diff * customMultiplier * quantity;
  }

  const sym = (symbol || '').toUpperCase();

  if (market === 'forex') {
    const metal = Object.keys(SPOT_METAL_LOT_UNITS).find(m => sym.startsWith(m));
    const unitsPerLot = metal ? SPOT_METAL_LOT_UNITS[metal] : FOREX_UNITS_PER_LOT;
    const pnlInQuoteCurrency = diff * unitsPerLot * quantity;

    // Convert only when we positively identify a non-USD quote currency —
    // unknown/suffixed symbols stay unconverted rather than being divided by
    // an unrelated exit price.
    const quote = forexQuoteCurrency(sym);
    if (quote && quote !== 'USD' && exitPrice > 0) {
      return pnlInQuoteCurrency / exitPrice;
    }
    return pnlInQuoteCurrency;
  }

  if (market === 'futures') {
    return diff * getFuturesMultiplier(sym) * quantity;
  }

  // indices, stocks, anything else: price difference × quantity
  return diff * quantity;
}

export interface PnlPercentageInput {
  pnl: number;
  symbol: string;
  market: string;
  entryPrice: number;
  /** Lots for forex, contracts for futures/indices. */
  quantity: number;
  customMultiplier?: number;
}

/**
 * P&L as a percentage of the position's notional value at entry. This is THE
 * definition — every entry path (TradeLog calculated/manual/edit, Dashboard
 * quick-add, calendar quick-add) must use it. Historical bug: three inline
 * formulas disagreed by up to 500x because two dropped the futures contract
 * multiplier and the forex 100k lot size from the denominator.
 *
 * Returns 0 when the notional can't be established (no entry price/quantity).
 */
export function computePnlPercentage(input: PnlPercentageInput): number {
  const { pnl, symbol, market, entryPrice, quantity, customMultiplier } = input;
  if (!(entryPrice > 0) || !(quantity > 0)) return 0;

  const sym = (symbol || '').toUpperCase();
  let unitsPerContract: number;
  if (customMultiplier && customMultiplier > 0) {
    unitsPerContract = customMultiplier;
  } else if (market === 'forex') {
    const metal = Object.keys(SPOT_METAL_LOT_UNITS).find(m => sym.startsWith(m));
    unitsPerContract = metal ? SPOT_METAL_LOT_UNITS[metal] : FOREX_UNITS_PER_LOT;
  } else if (market === 'futures') {
    unitsPerContract = getFuturesMultiplier(sym);
  } else {
    unitsPerContract = 1;
  }

  const notional = entryPrice * unitsPerContract * quantity;
  return notional > 0 ? (pnl / notional) * 100 : 0;
}
