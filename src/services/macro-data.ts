import { getCached, setCache } from '@/utils/api-cache'
import { MARKET_DATA_ENABLED } from '@/config/market-data'

// Same-origin proxy (see api/fred) — API key is injected server-side.
const FRED_URL = '/api/fred'

// Macro series move slowly (daily at most, monthly for CPI/unemployment).
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6h
const ERROR_CACHE_TTL = 5 * 60 * 1000

export interface MacroIndicator {
  id: string
  label: string
  value: number   // latest observation (already YoY % for pc1 series)
  prior: number    // prior observation, for the trend arrow
  change: number   // value - prior, in the series' native units
  unit: '%' | 'pp' // pp = percentage points (spreads), % = level/rate
  date: string     // observation date of the latest value
}

interface SeriesConfig {
  id: string        // FRED series id
  label: string
  unit: '%' | 'pp'
  units?: 'pc1'     // FRED transform: pc1 = percent change from a year ago
}

// Rates + inflation set — chosen for index/rate futures traders.
const SERIES: SeriesConfig[] = [
  { id: 'DFF',      label: 'Fed Funds', unit: '%' },
  { id: 'DGS10',    label: '10Y',       unit: '%' },
  { id: 'DGS2',     label: '2Y',        unit: '%' },
  { id: 'T10Y2Y',   label: '10Y-2Y',    unit: 'pp' },
  { id: 'CPIAUCSL', label: 'CPI',       unit: '%', units: 'pc1' },
  { id: 'UNRATE',   label: 'Unemp',     unit: '%' },
]

interface FredObservation {
  date: string
  value: string
}

async function fetchSeries(cfg: SeriesConfig): Promise<MacroIndicator | null> {
  const params = new URLSearchParams({
    series_id: cfg.id,
    sort_order: 'desc',
    // Fetch a few extra: FRED returns "." for missing days (weekends/holidays)
    // which we skip, so we need headroom to still land two valid points.
    limit: '12',
  })
  if (cfg.units) params.set('units', cfg.units)

  let data: { observations?: FredObservation[] }
  try {
    const res = await fetch(`${FRED_URL}/observations?${params.toString()}`)
    if (!res.ok) return null
    data = await res.json()
  } catch {
    // Network error or non-JSON body (e.g. dev SPA fallback) — fail this one
    // series only, never the whole snapshot.
    return null
  }

  const observations: FredObservation[] = data?.observations ?? []

  // Keep only numeric observations, newest first (already desc-sorted).
  const valid = observations
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }))
    .filter((o) => Number.isFinite(o.value))

  if (valid.length === 0) return null

  const latest = valid[0]
  const prior = valid[1] ?? latest

  return {
    id: cfg.id,
    label: cfg.label,
    value: latest.value,
    prior: prior.value,
    change: latest.value - prior.value,
    unit: cfg.unit,
    date: latest.date,
  }
}

export async function fetchMacroSnapshot(): Promise<MacroIndicator[]> {
  if (!MARKET_DATA_ENABLED) return []

  const cacheKey = 'ftj-macro-v1'
  const cached = getCached<MacroIndicator[]>(cacheKey, CACHE_TTL)
  if (cached !== null) return cached

  // Back off briefly if the proxy is unconfigured / rate-limited so we don't
  // hammer it on every Dashboard mount.
  const errKey = 'ftj-macro-err'
  if (getCached<boolean>(errKey, ERROR_CACHE_TTL)) return []

  try {
    const results = await Promise.all(SERIES.map(fetchSeries))
    const indicators = results.filter((r): r is MacroIndicator => r !== null)

    if (indicators.length === 0) {
      setCache(errKey, true)
      return []
    }

    setCache(cacheKey, indicators)
    return indicators
  } catch {
    setCache(errKey, true)
    return []
  }
}
