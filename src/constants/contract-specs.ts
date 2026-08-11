// Contract specifications for the position size calculator.
// Futures specs are the official CME/CBOT/NYMEX/COMEX values, checked against
// the exchange contract pages on 2026-08-11. Re-verify before editing.

export interface ForexPairSpec {
  symbol: string
  /** Quote currency — pip value is denominated in this before conversion. */
  quote: string
  /** Price increment that counts as one pip (0.0001 majors, 0.01 JPY pairs). */
  pipSize: number
  /** Units per standard lot. */
  contractSize: number
  group: 'Majors' | 'Crosses' | 'Metals'
  /** Note shown next to the pair when pip conventions vary between brokers. */
  note?: string
}

export const FOREX_PAIRS: ForexPairSpec[] = [
  { symbol: 'EURUSD', quote: 'USD', pipSize: 0.0001, contractSize: 100_000, group: 'Majors' },
  { symbol: 'GBPUSD', quote: 'USD', pipSize: 0.0001, contractSize: 100_000, group: 'Majors' },
  { symbol: 'USDJPY', quote: 'JPY', pipSize: 0.01, contractSize: 100_000, group: 'Majors' },
  { symbol: 'USDCHF', quote: 'CHF', pipSize: 0.0001, contractSize: 100_000, group: 'Majors' },
  { symbol: 'USDCAD', quote: 'CAD', pipSize: 0.0001, contractSize: 100_000, group: 'Majors' },
  { symbol: 'AUDUSD', quote: 'USD', pipSize: 0.0001, contractSize: 100_000, group: 'Majors' },
  { symbol: 'NZDUSD', quote: 'USD', pipSize: 0.0001, contractSize: 100_000, group: 'Majors' },
  { symbol: 'EURGBP', quote: 'GBP', pipSize: 0.0001, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'EURJPY', quote: 'JPY', pipSize: 0.01, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'GBPJPY', quote: 'JPY', pipSize: 0.01, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'AUDJPY', quote: 'JPY', pipSize: 0.01, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'CADJPY', quote: 'JPY', pipSize: 0.01, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'CHFJPY', quote: 'JPY', pipSize: 0.01, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'NZDJPY', quote: 'JPY', pipSize: 0.01, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'EURAUD', quote: 'AUD', pipSize: 0.0001, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'EURCHF', quote: 'CHF', pipSize: 0.0001, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'EURCAD', quote: 'CAD', pipSize: 0.0001, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'EURNZD', quote: 'NZD', pipSize: 0.0001, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'GBPAUD', quote: 'AUD', pipSize: 0.0001, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'GBPCAD', quote: 'CAD', pipSize: 0.0001, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'GBPCHF', quote: 'CHF', pipSize: 0.0001, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'GBPNZD', quote: 'NZD', pipSize: 0.0001, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'AUDCAD', quote: 'CAD', pipSize: 0.0001, contractSize: 100_000, group: 'Crosses' },
  { symbol: 'AUDNZD', quote: 'NZD', pipSize: 0.0001, contractSize: 100_000, group: 'Crosses' },
  {
    symbol: 'XAUUSD', quote: 'USD', pipSize: 0.01, contractSize: 100, group: 'Metals',
    note: '1 lot = 100 oz, 1 pip = $0.01 move ($1 per lot)',
  },
  {
    symbol: 'XAGUSD', quote: 'USD', pipSize: 0.001, contractSize: 5_000, group: 'Metals',
    note: '1 lot = 5,000 oz, 1 pip = $0.001 move ($5 per lot)',
  },
]

export interface FuturesContractSpec {
  symbol: string
  name: string
  /** Minimum price fluctuation in points. */
  tickSize: number
  /** Dollar value of one tick per contract. */
  tickValue: number
  group: 'Equity index' | 'Energy' | 'Metals' | 'Rates' | 'Currencies' | 'Grains'
}

export const FUTURES_CONTRACTS: FuturesContractSpec[] = [
  { symbol: 'ES', name: 'E-mini S&P 500', tickSize: 0.25, tickValue: 12.5, group: 'Equity index' },
  { symbol: 'MES', name: 'Micro E-mini S&P 500', tickSize: 0.25, tickValue: 1.25, group: 'Equity index' },
  { symbol: 'NQ', name: 'E-mini Nasdaq-100', tickSize: 0.25, tickValue: 5, group: 'Equity index' },
  { symbol: 'MNQ', name: 'Micro E-mini Nasdaq-100', tickSize: 0.25, tickValue: 0.5, group: 'Equity index' },
  { symbol: 'YM', name: 'E-mini Dow', tickSize: 1, tickValue: 5, group: 'Equity index' },
  { symbol: 'MYM', name: 'Micro E-mini Dow', tickSize: 1, tickValue: 0.5, group: 'Equity index' },
  { symbol: 'RTY', name: 'E-mini Russell 2000', tickSize: 0.1, tickValue: 5, group: 'Equity index' },
  { symbol: 'M2K', name: 'Micro E-mini Russell 2000', tickSize: 0.1, tickValue: 0.5, group: 'Equity index' },
  { symbol: 'CL', name: 'Crude Oil', tickSize: 0.01, tickValue: 10, group: 'Energy' },
  { symbol: 'MCL', name: 'Micro Crude Oil', tickSize: 0.01, tickValue: 1, group: 'Energy' },
  { symbol: 'NG', name: 'Natural Gas', tickSize: 0.001, tickValue: 10, group: 'Energy' },
  { symbol: 'GC', name: 'Gold', tickSize: 0.1, tickValue: 10, group: 'Metals' },
  { symbol: 'MGC', name: 'Micro Gold', tickSize: 0.1, tickValue: 1, group: 'Metals' },
  { symbol: 'SI', name: 'Silver', tickSize: 0.005, tickValue: 25, group: 'Metals' },
  { symbol: 'SIL', name: 'Micro Silver', tickSize: 0.005, tickValue: 5, group: 'Metals' },
  { symbol: 'HG', name: 'Copper', tickSize: 0.0005, tickValue: 12.5, group: 'Metals' },
  { symbol: 'ZB', name: '30-Year T-Bond', tickSize: 0.03125, tickValue: 31.25, group: 'Rates' },
  { symbol: 'ZN', name: '10-Year T-Note', tickSize: 0.015625, tickValue: 15.625, group: 'Rates' },
  { symbol: '6E', name: 'Euro FX', tickSize: 0.00005, tickValue: 6.25, group: 'Currencies' },
  { symbol: '6B', name: 'British Pound', tickSize: 0.0001, tickValue: 6.25, group: 'Currencies' },
  { symbol: '6J', name: 'Japanese Yen', tickSize: 0.0000005, tickValue: 6.25, group: 'Currencies' },
  { symbol: 'ZC', name: 'Corn', tickSize: 0.25, tickValue: 12.5, group: 'Grains' },
  { symbol: 'ZS', name: 'Soybeans', tickSize: 0.25, tickValue: 12.5, group: 'Grains' },
  { symbol: 'ZW', name: 'Wheat', tickSize: 0.25, tickValue: 12.5, group: 'Grains' },
]

export const ACCOUNT_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'] as const
export type AccountCurrency = (typeof ACCOUNT_CURRENCIES)[number]

export const CURRENCY_SYMBOLS: Record<AccountCurrency, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥',
  AUD: 'A$', CAD: 'C$', CHF: 'CHF ', NZD: 'NZ$',
}
