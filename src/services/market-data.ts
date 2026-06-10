import { getCached, setCache } from '@/utils/api-cache'
import { MARKET_DATA_ENABLED } from '@/config/market-data'

// Same-origin proxies (see api/twelvedata, api/finnhub) — API keys are injected server-side.
const TWELVEDATA_URL = '/api/twelvedata'
const FINNHUB_URL = '/api/finnhub'

const CACHE_TTL = 5 * 60 * 1000
const ERROR_CACHE_TTL = 60 * 1000

export interface MarketQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  isProxy?: boolean
}

type Provider = 'twelvedata' | 'finnhub'

interface SymbolResolution {
  provider: Provider
  apiSymbol: string
  displayName: string
  isProxy: boolean
}

// ── Forex → Twelve Data ──

const FOREX_MAP: Record<string, string> = {
  'EURUSD': 'EUR/USD', 'GBPUSD': 'GBP/USD', 'USDJPY': 'USD/JPY',
  'USDCHF': 'USD/CHF', 'AUDUSD': 'AUD/USD', 'USDCAD': 'USD/CAD',
  'NZDUSD': 'NZD/USD', 'EURJPY': 'EUR/JPY', 'GBPJPY': 'GBP/JPY',
  'EURGBP': 'EUR/GBP', 'EURAUD': 'EUR/AUD', 'EURNZD': 'EUR/NZD',
  'EURCHF': 'EUR/CHF', 'GBPAUD': 'GBP/AUD', 'GBPCAD': 'GBP/CAD',
  'GBPCHF': 'GBP/CHF', 'GBPNZD': 'GBP/NZD', 'AUDJPY': 'AUD/JPY',
  'NZDJPY': 'NZD/JPY', 'CADJPY': 'CAD/JPY', 'CHFJPY': 'CHF/JPY',
  'AUDCAD': 'AUD/CAD', 'AUDNZD': 'AUD/NZD',
}

// ── Commodity futures → Twelve Data spot prices ──

const COMMODITY_FUTURES: Record<string, { tdSymbol: string; display: string }> = {
  'GC':  { tdSymbol: 'XAU/USD', display: 'XAUUSD' },
  'MGC': { tdSymbol: 'XAU/USD', display: 'XAUUSD' },
  'SI':  { tdSymbol: 'XAG/USD', display: 'XAGUSD' },
}

// ── Currency futures → Twelve Data forex pairs ──

const CURRENCY_FUTURES: Record<string, string> = {
  '6E': 'EURUSD',
  '6B': 'GBPUSD',
  '6J': 'USDJPY',
  '6A': 'AUDUSD',
  '6C': 'USDCAD',
  '6S': 'USDCHF',
}

// ── Index/other futures → ETF proxy on Finnhub (% change only) ──

const FUTURES_MAP: Record<string, { etf: string; display: string }> = {
  'ES':  { etf: 'SPY',  display: 'SPY' },
  'MES': { etf: 'SPY',  display: 'SPY' },
  'NQ':  { etf: 'QQQ',  display: 'QQQ' },
  'MNQ': { etf: 'QQQ',  display: 'QQQ' },
  'YM':  { etf: 'DIA',  display: 'DIA' },
  'MYM': { etf: 'DIA',  display: 'DIA' },
  'RTY': { etf: 'IWM',  display: 'IWM' },
  'M2K': { etf: 'IWM',  display: 'IWM' },
  'HG':  { etf: 'CPER', display: 'CPER' },
  'PL':  { etf: 'PPLT', display: 'PPLT' },
  'CL':  { etf: 'USO',  display: 'USO' },
  'MCL': { etf: 'USO',  display: 'USO' },
  'NG':  { etf: 'UNG',  display: 'UNG' },
  'ZB':  { etf: 'TLT',  display: 'TLT' },
  'ZN':  { etf: 'IEF',  display: 'IEF' },
  'ZF':  { etf: 'IEI',  display: 'IEI' },
  'ZT':  { etf: 'SHY',  display: 'SHY' },
  'ZC':  { etf: 'CORN', display: 'CORN' },
  'ZS':  { etf: 'SOYB', display: 'SOYB' },
  'ZW':  { etf: 'WEAT', display: 'WEAT' },
}

// ── Index names → ETF proxy on Finnhub (% change only) ──

const INDEX_MAP: Record<string, { etf: string; display: string }> = {
  'SPX':  { etf: 'SPY', display: 'SPY' },
  'NDX':  { etf: 'QQQ', display: 'QQQ' },
  'DJI':  { etf: 'DIA', display: 'DIA' },
  'DJIA': { etf: 'DIA', display: 'DIA' },
  'RUT':  { etf: 'IWM', display: 'IWM' },
  'VIX':  { etf: 'VXX', display: 'VXX' },
  'DAX':  { etf: 'EWG', display: 'EWG' },
  'FTSE': { etf: 'EWU', display: 'EWU' },
  'N225': { etf: 'EWJ', display: 'EWJ' },
  'HSI':  { etf: 'EWH', display: 'EWH' },
}

// ── Crypto → Twelve Data ──

const CRYPTO_MAP: Record<string, { tdSymbol: string; display: string }> = {
  'BTC': { tdSymbol: 'BTC/USD', display: 'BTC' },
  'BTCUSD': { tdSymbol: 'BTC/USD', display: 'BTC' },
  'ETH': { tdSymbol: 'ETH/USD', display: 'ETH' },
  'ETHUSD': { tdSymbol: 'ETH/USD', display: 'ETH' },
  'SOL': { tdSymbol: 'SOL/USD', display: 'SOL' },
  'SOLUSD': { tdSymbol: 'SOL/USD', display: 'SOL' },
  'XRP': { tdSymbol: 'XRP/USD', display: 'XRP' },
  'XRPUSD': { tdSymbol: 'XRP/USD', display: 'XRP' },
  'DOGE': { tdSymbol: 'DOGE/USD', display: 'DOGE' },
  'DOGEUSD': { tdSymbol: 'DOGE/USD', display: 'DOGE' },
}

// ── Symbol resolution ──

const FUTURES_MONTH_CODES = 'FGHJKMNQUVXZ'

function isKnownFuturesRoot(root: string): boolean {
  return !!(FUTURES_MAP[root] || COMMODITY_FUTURES[root] || CURRENCY_FUTURES[root])
}

function parseFuturesRoot(symbol: string): string | null {
  const match = symbol.match(new RegExp(`^(.+?)[${FUTURES_MONTH_CODES}]\\d{1,2}$`))
  if (match && isKnownFuturesRoot(match[1])) return match[1]
  if (isKnownFuturesRoot(symbol)) return symbol
  return null
}

function resolveSymbol(symbol: string): SymbolResolution | null {
  const upper = symbol.toUpperCase()

  if (FOREX_MAP[upper]) {
    return { provider: 'twelvedata', apiSymbol: FOREX_MAP[upper], displayName: upper, isProxy: false }
  }

  if (CRYPTO_MAP[upper]) {
    const c = CRYPTO_MAP[upper]
    return { provider: 'twelvedata', apiSymbol: c.tdSymbol, displayName: c.display, isProxy: false }
  }

  const futuresRoot = parseFuturesRoot(upper)
  if (futuresRoot) {
    // Commodity futures → real spot prices via Twelve Data
    if (COMMODITY_FUTURES[futuresRoot]) {
      const c = COMMODITY_FUTURES[futuresRoot]
      return { provider: 'twelvedata', apiSymbol: c.tdSymbol, displayName: c.display, isProxy: false }
    }
    // Currency futures → real forex pairs via Twelve Data
    if (CURRENCY_FUTURES[futuresRoot]) {
      const forexKey = CURRENCY_FUTURES[futuresRoot]
      return { provider: 'twelvedata', apiSymbol: FOREX_MAP[forexKey], displayName: forexKey, isProxy: false }
    }
    // Index/other futures → ETF proxy
    const f = FUTURES_MAP[futuresRoot]
    if (f) {
      return { provider: 'finnhub', apiSymbol: f.etf, displayName: f.display, isProxy: true }
    }
  }

  if (INDEX_MAP[upper]) {
    const idx = INDEX_MAP[upper]
    return { provider: 'finnhub', apiSymbol: idx.etf, displayName: idx.display, isProxy: true }
  }

  if (/^[A-Z]{1,5}$/.test(upper)) {
    return { provider: 'finnhub', apiSymbol: upper, displayName: upper, isProxy: false }
  }

  return null
}

export function resolveDisplaySymbol(symbol: string): string {
  const resolved = resolveSymbol(symbol)
  return resolved?.displayName || symbol
}

// ── Provider fetch functions ──

async function fetchTwelveDataQuote(apiSymbol: string): Promise<Omit<MarketQuote, 'symbol'> | null> {
  const url = `${TWELVEDATA_URL}/quote?symbol=${encodeURIComponent(apiSymbol)}`
  const res = await fetch(url)

  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) return null

  const data = await res.json()
  if (data.code === 429) throw new Error('RATE_LIMIT')
  if (data.code || data.status === 'error' || !data.close) return null

  return {
    price: parseFloat(data.close),
    change: parseFloat(data.change || '0'),
    changePercent: parseFloat(data.percent_change || '0'),
  }
}

async function fetchFinnhubQuote(apiSymbol: string): Promise<Omit<MarketQuote, 'symbol'> | null> {
  const url = `${FINNHUB_URL}/quote?symbol=${apiSymbol}`
  const res = await fetch(url)

  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) return null

  const data = await res.json()
  if (!data.c || data.c === 0) return null

  return {
    price: data.c,
    change: data.d || 0,
    changePercent: data.dp || 0,
  }
}

// ── Public API ──

export async function fetchQuotes(symbols: string[]): Promise<MarketQuote[]> {
  if (symbols.length === 0) return []
  if (!MARKET_DATA_ENABLED) return []

  const resolutions: { resolved: SymbolResolution }[] = []
  const seenApi = new Set<string>()

  for (const sym of symbols) {
    const resolved = resolveSymbol(sym)
    if (!resolved) continue
    const dedup = `${resolved.provider}:${resolved.apiSymbol}`
    if (seenApi.has(dedup)) continue
    seenApi.add(dedup)
    resolutions.push({ resolved })
  }

  if (resolutions.length === 0) return []

  const cacheKey = `ftj-quotes-v3-${resolutions.map(r => r.resolved.apiSymbol).sort().join(',')}`
  const cached = getCached<MarketQuote[]>(cacheKey, CACHE_TTL)
  if (cached !== null) return cached

  const quotes: MarketQuote[] = []

  for (const { resolved } of resolutions) {
    const errKey = `ftj-quotes-err-${resolved.provider}`
    if (getCached<boolean>(errKey, ERROR_CACHE_TTL)) continue

    try {
      const fetcher = resolved.provider === 'twelvedata' ? fetchTwelveDataQuote : fetchFinnhubQuote
      const result = await fetcher(resolved.apiSymbol)

      if (result) {
        quotes.push({ symbol: resolved.displayName, ...result, isProxy: resolved.isProxy })
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'RATE_LIMIT') {
        setCache(errKey, true)
      }
      continue
    }
  }

  if (quotes.length > 0) {
    setCache(cacheKey, quotes)
  }
  return quotes
}

export async function fetchQuote(symbol: string): Promise<MarketQuote | null> {
  const quotes = await fetchQuotes([symbol])
  return quotes[0] ?? null
}
