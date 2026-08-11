// Trading constants that can be configured

export const PROP_FIRMS = [
  "Alpha Capital Group",
  "Alpha Futures",
  "Apex Trader Funding",
  "Aqua Funded",
  "E8 Markets",
  "FTMO",
  "Funded FX",
  "Funded Trading Plus",
  "FundedNext",
  "Funding Pips",
  "Lucid Trading",
  "My Funded Futures (MFFU)",
  "Take Profit Trader",
  "The5ers",
  "TopStep",
  "Tradeday",
  "Tradeify",
] as const;

/**
 * The instruments offered by every Add Trade form.
 *
 * This used to exist twice: this file (used by the Dashboard quick add and the
 * calendar dialog) and a second, richer list hardcoded inside TradeLog. They
 * drifted, so the two quick forms were missing every micro future — MNQ, MES,
 * MYM, M2K — and offered a completely different set of indices. Everything now
 * reads from the groups below.
 *
 * Grouped because the futures list is long, and a flat list of 20+ tickers is
 * hard to scan. `name` is optional: forex pairs are self-describing, futures
 * codes are not.
 */
export type Instrument = { symbol: string; name?: string };
export type InstrumentGroup = { category: string; instruments: readonly Instrument[] };

const sym = (...symbols: string[]): Instrument[] => symbols.map(symbol => ({ symbol }));

export const FOREX_INSTRUMENT_GROUPS: readonly InstrumentGroup[] = [
  { category: 'Major Pairs', instruments: sym(
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  ) },
  { category: 'Cross Pairs', instruments: sym(
    'EURJPY', 'GBPJPY', 'EURGBP', 'EURAUD', 'EURNZD', 'EURCHF',
    'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPNZD',
    'AUDJPY', 'NZDJPY', 'CADJPY', 'CHFJPY', 'AUDCAD', 'AUDNZD',
  ) },
  { category: 'Exotic Pairs', instruments: sym(
    'USDSEK', 'USDNOK', 'USDDKK', 'USDSGD', 'USDMXN', 'USDZAR',
  ) },
];

export const FUTURES_INSTRUMENT_GROUPS: readonly InstrumentGroup[] = [
  { category: 'Micro Index Futures', instruments: [
    { symbol: 'MES', name: 'Micro E-mini S&P 500' },
    { symbol: 'MNQ', name: 'Micro E-mini Nasdaq 100' },
    { symbol: 'MYM', name: 'Micro E-mini Dow Jones' },
    { symbol: 'M2K', name: 'Micro E-mini Russell 2000' },
  ] },
  { category: 'Standard Index Futures', instruments: [
    { symbol: 'ES', name: 'E-mini S&P 500' },
    { symbol: 'NQ', name: 'E-mini Nasdaq 100' },
    { symbol: 'YM', name: 'E-mini Dow Jones' },
    { symbol: 'RTY', name: 'E-mini Russell 2000' },
  ] },
  { category: 'Micro Energy', instruments: [
    { symbol: 'MCL', name: 'Micro Crude Oil' },
  ] },
  { category: 'Standard Energy', instruments: [
    { symbol: 'CL', name: 'Crude Oil' },
    { symbol: 'NG', name: 'Natural Gas' },
    { symbol: 'RB', name: 'Gasoline' },
  ] },
  { category: 'Micro Metals', instruments: [
    { symbol: 'MGC', name: 'Micro Gold' },
  ] },
  { category: 'Standard Metals', instruments: [
    { symbol: 'GC', name: 'Gold' },
    { symbol: 'SI', name: 'Silver' },
    { symbol: 'HG', name: 'Copper' },
  ] },
  { category: 'Agriculture', instruments: [
    { symbol: 'ZC', name: 'Corn' },
    { symbol: 'ZS', name: 'Soybeans' },
    { symbol: 'ZW', name: 'Wheat' },
  ] },
  { category: 'Bonds', instruments: [
    { symbol: 'ZN', name: '10-Year Treasury' },
    { symbol: 'ZF', name: '5-Year Treasury' },
    { symbol: 'ZB', name: '30-Year Treasury' },
  ] },
];

// Indices is the catch-all for anything that is not forex or futures, so it
// carries index CFDs, index ETFs and single stocks. CSV imports classify plain
// tickers (TSLA, AAPL) here too, which is why the forms must also accept a
// symbol that appears in no group.
export const INDICES_INSTRUMENT_GROUPS: readonly InstrumentGroup[] = [
  { category: 'Index CFDs', instruments: [
    { symbol: 'SPX500', name: 'S&P 500' },
    { symbol: 'NAS100', name: 'Nasdaq 100' },
    { symbol: 'US30', name: 'Dow Jones 30' },
    { symbol: 'GER40', name: 'DAX 40' },
    { symbol: 'UK100', name: 'FTSE 100' },
    { symbol: 'FRA40', name: 'CAC 40' },
    { symbol: 'JPN225', name: 'Nikkei 225' },
    { symbol: 'AUS200', name: 'ASX 200' },
  ] },
  { category: 'US Index ETFs', instruments: [
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
    { symbol: 'DIA', name: 'SPDR Dow Jones ETF' },
    { symbol: 'IWM', name: 'iShares Russell 2000 ETF' },
  ] },
  { category: 'Sector ETFs', instruments: [
    { symbol: 'XLF', name: 'Financial Sector SPDR' },
    { symbol: 'XLK', name: 'Technology Sector SPDR' },
    { symbol: 'XLE', name: 'Energy Sector SPDR' },
    { symbol: 'XLV', name: 'Health Care Sector SPDR' },
  ] },
  { category: 'International ETFs', instruments: [
    { symbol: 'EFA', name: 'iShares MSCI EAFE ETF' },
    { symbol: 'EEM', name: 'iShares MSCI Emerging Markets ETF' },
    { symbol: 'VGK', name: 'Vanguard European ETF' },
  ] },
];

const flatten = (groups: readonly InstrumentGroup[]): string[] =>
  groups.flatMap(group => group.instruments.map(instrument => instrument.symbol));

export const FOREX_INSTRUMENTS = flatten(FOREX_INSTRUMENT_GROUPS);
export const FUTURES_INSTRUMENTS = flatten(FUTURES_INSTRUMENT_GROUPS);
export const INDICES_INSTRUMENTS = flatten(INDICES_INSTRUMENT_GROUPS);

// Coming Soon - Crypto instruments
export const CRYPTO_INSTRUMENTS = [
  'BTCUSD', 'ETHUSD', 'BNBUSD', 'ADAUSD', 'SOLUSD',
  'XRPUSD', 'DOTUSD', 'LINKUSD', 'AVAXUSD', 'MATICUSD'
] as const;

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$' }
] as const;

export const MARKET_INSTRUMENT_GROUPS = {
  forex: FOREX_INSTRUMENT_GROUPS,
  futures: FUTURES_INSTRUMENT_GROUPS,
  indices: INDICES_INSTRUMENT_GROUPS,
  // crypto: CRYPTO_INSTRUMENT_GROUPS // Coming Soon
} as const;

export const MARKET_INSTRUMENTS = {
  forex: FOREX_INSTRUMENTS,
  futures: FUTURES_INSTRUMENTS,
  indices: INDICES_INSTRUMENTS,
  // crypto: CRYPTO_INSTRUMENTS // Coming Soon
} as const;

/**
 * Groups for a market, with `symbol` added as its own group when it is not
 * already listed. A remembered or imported symbol (any stock ticker, or one
 * saved before a list changed) must stay selectable, otherwise the field
 * silently renders blank and the trade saves with no instrument.
 */
export function instrumentGroupsFor(
  market: MarketType,
  symbol?: string,
): readonly InstrumentGroup[] {
  const groups = MARKET_INSTRUMENT_GROUPS[market] || [];
  if (!symbol) return groups;
  const known = groups.some(group => group.instruments.some(i => i.symbol === symbol));
  return known ? groups : [{ category: 'Your instrument', instruments: [{ symbol }] }, ...groups];
}

// Default configuration values
export const DEFAULT_VALUES = {
  ACCOUNT_NAME: 'Main Account',
  STARTING_BALANCE: 10000,
  CURRENCY: 'USD' as const,
  ACCOUNT_TYPE: 'demo' as const,
  BROKER: 'Demo Broker',
  COMMISSION: 0,
  RISK_PER_TRADE: 2, // percentage
  TIMEZONE: 'America/New_York'
} as const;

export type MarketType = keyof typeof MARKET_INSTRUMENTS;

// One quantity concept, three market dialects: forex trades in lots,
// futures in contracts, indices in units.
export function quantityLabelForMarket(market: string | undefined): string {
  if (market === 'futures') return 'Contracts';
  if (market === 'forex') return 'Lot Size';
  return 'Quantity';
}

export type PropFirm = typeof PROP_FIRMS[number];
export type Currency = typeof SUPPORTED_CURRENCIES[number]['code'];