import { cachedFetch } from '@/utils/api-cache'
import { MARKET_DATA_ENABLED } from '@/config/market-data'

// Same-origin proxy (see api/finnhub) — API key is injected server-side.
const BASE_URL = '/api/finnhub'

const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

export interface NewsItem {
  id: string
  headline: string
  source: string
  url: string
  summary: string
  datetime: number
  image?: string
}

export async function getMarketNews(
  category: 'general' | 'forex' | 'crypto' = 'general'
): Promise<NewsItem[]> {
  if (!MARKET_DATA_ENABLED) return []

  return cachedFetch<NewsItem[]>(
    `ftj-news-${category}`,
    `${BASE_URL}/news?category=${category}`,
    CACHE_TTL,
    (raw: any) =>
      (Array.isArray(raw) ? raw : []).slice(0, 20).map((item: any) => ({
        id: String(item.id),
        headline: item.headline,
        source: item.source,
        url: item.url,
        summary: item.summary,
        datetime: item.datetime,
        image: item.image || undefined,
      }))
  )
}

export async function getSymbolNews(
  symbol: string,
  daysBack: number = 7
): Promise<NewsItem[]> {
  if (!MARKET_DATA_ENABLED) return []

  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - daysBack)

  const fromStr = from.toISOString().slice(0, 10)
  const toStr = to.toISOString().slice(0, 10)

  return cachedFetch<NewsItem[]>(
    `ftj-news-${symbol}-${fromStr}`,
    `${BASE_URL}/company-news?symbol=${symbol}&from=${fromStr}&to=${toStr}`,
    CACHE_TTL,
    (raw: any) =>
      (Array.isArray(raw) ? raw : []).slice(0, 8).map((item: any) => ({
        id: String(item.id),
        headline: item.headline,
        source: item.source,
        url: item.url,
        summary: item.summary,
        datetime: item.datetime,
        image: item.image || undefined,
      }))
  )
}
