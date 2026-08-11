import { cachedFetch } from '@/utils/api-cache'
import { MARKET_DATA_ENABLED } from '@/config/market-data'

// Same-origin proxy (see api/finnhub) — API key is injected server-side.
const BASE_URL = '/api/finnhub'

const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

export interface NewsItem {
  id: string
  headline: string
  source: string
  author?: string
  url: string
  summary: string
  datetime: number
  image?: string
}

export type FeedTab = 'forex' | 'markets'

// Aggregated RSS from trader-focused outlets via our own /api/news proxy
// (see api/_lib/market-feed.ts) — replaced Finnhub's category news, whose
// free-tier General feed went empty.
export async function getMarketFeed(tab: FeedTab): Promise<NewsItem[]> {
  if (!MARKET_DATA_ENABLED) return []

  return cachedFetch<NewsItem[]>(
    `ftj-feed-${tab}`,
    `/api/news?tab=${tab}`,
    CACHE_TTL,
    (raw: any) =>
      (Array.isArray(raw) ? raw : []).map((item: any) => ({
        id: String(item.id),
        headline: item.headline,
        source: item.source,
        author: item.author || undefined,
        url: item.url,
        summary: '',
        datetime: item.datetime,
      })),
    // Don't pin an empty result for the whole TTL.
    (data) => data.length > 0
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
