/**
 * Remembers the last trade a user logged so the next Add Trade form opens
 * pre-filled instead of snapping back to forex every time.
 *
 * Every trade form (TradeLog, the Dashboard quick add, and the calendar's
 * add-trade dialog) used to hardcode `market: 'forex'`, so anyone who trades
 * futures re-picked the market and the instrument on every single entry.
 *
 * Only the fields that stay the same trade-to-trade are remembered. Side is
 * deliberately excluded: carrying direction over would silently log a short as
 * a long. Prices, SL/TP, notes, strategy, and tags are per-trade and stay blank.
 *
 * Stored per account (brokers and instruments differ between them) and kept
 * local — this is a device convenience, not journal data, so it skips cloud sync.
 */

export type TradeMarket = 'forex' | 'futures' | 'indices';

export interface TradeDefaults {
  market: TradeMarket;
  symbol: string;
  lotSize: string;
  commission: string;
  fees: string;
}

const STORAGE_KEY = 'lastTradeDefaults';
/** Bucket used before an account exists (fresh signup, demo sandbox). */
const NO_ACCOUNT = '__default';

export const FALLBACK_TRADE_DEFAULTS: TradeDefaults = {
  market: 'forex',
  symbol: '',
  lotSize: '',
  commission: '',
  fees: '',
};

const VALID_MARKETS: TradeMarket[] = ['forex', 'futures', 'indices'];

type Storage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string, skipSync?: boolean) => Promise<void> | void;
};

function readAll(storage: Storage): Record<string, TradeDefaults> {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Defaults for the next trade on this account. Always returns a complete object,
 * falling back to the old hardcoded forex defaults when nothing is remembered yet.
 */
export function getTradeDefaults(storage: Storage, accountId?: string | null): TradeDefaults {
  const saved = readAll(storage)[accountId || NO_ACCOUNT];
  if (!saved || typeof saved !== 'object') return { ...FALLBACK_TRADE_DEFAULTS };
  return {
    market: VALID_MARKETS.includes(saved.market) ? saved.market : FALLBACK_TRADE_DEFAULTS.market,
    symbol: typeof saved.symbol === 'string' ? saved.symbol : '',
    lotSize: typeof saved.lotSize === 'string' ? saved.lotSize : '',
    commission: typeof saved.commission === 'string' ? saved.commission : '',
    fees: typeof saved.fees === 'string' ? saved.fees : '',
  };
}

/**
 * Records the trade that was just saved as the defaults for the next one.
 * Fire-and-forget: a failed write only costs the pre-fill, never the trade.
 */
export function rememberTradeDefaults(
  storage: Storage,
  accountId: string | null | undefined,
  trade: Partial<TradeDefaults>,
): void {
  const all = readAll(storage);
  const key = accountId || NO_ACCOUNT;
  const previous = all[key] || FALLBACK_TRADE_DEFAULTS;
  all[key] = {
    market: VALID_MARKETS.includes(trade.market as TradeMarket)
      ? (trade.market as TradeMarket)
      : previous.market,
    symbol: trade.symbol ?? previous.symbol,
    lotSize: trade.lotSize ?? previous.lotSize,
    commission: trade.commission ?? previous.commission,
    fees: trade.fees ?? previous.fees,
  };
  try {
    void Promise.resolve(storage.setItem(STORAGE_KEY, JSON.stringify(all), true))?.catch?.(() => {});
  } catch {
    /* a lost pre-fill is not worth surfacing */
  }
}

/** Number fields are stored as strings so the two quick-add forms (which keep
 *  their inputs as strings) and TradeLog's numeric form can share one shape. */
export function toNumericDefault(value: string, fallback: number): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
