// Trading constants that can be configured

export const PROP_FIRMS = [
  "E8 Markets",
  "Funded FX", 
  "FundingPips",
  "TopStep",
  "FTMO",
  "Alpha Capital Group",
  "Apex Trader Funding",
  "The5ers"
] as const;

export const FOREX_INSTRUMENTS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 
  'AUDUSD', 'USDCAD', 'NZDUSD', 'EURJPY', 
  'GBPJPY', 'EURGBP'
] as const;

export const FUTURES_INSTRUMENTS = [
  'ES', 'NQ', 'YM', 'RTY', 'CL', 'GC', 'SI', 'ZB', 'ZN', 'ZF'
] as const;

export const INDICES_INSTRUMENTS = [
  'SPX500', 'NAS100', 'US30', 'GER40', 
  'UK100', 'FRA40', 'JPN225', 'AUS200'
] as const;

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

export const MARKET_INSTRUMENTS = {
  forex: FOREX_INSTRUMENTS,
  futures: FUTURES_INSTRUMENTS,
  indices: INDICES_INSTRUMENTS,
  // crypto: CRYPTO_INSTRUMENTS // Coming Soon
} as const;

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
export type PropFirm = typeof PROP_FIRMS[number];
export type Currency = typeof SUPPORTED_CURRENCIES[number]['code'];