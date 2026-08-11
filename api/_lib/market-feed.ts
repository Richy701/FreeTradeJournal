// Trader-focused news over public RSS — no key, no quota. Shared by the
// production function (api/news.ts) and the vite dev middleware; keep this
// the ONLY copy of the feed list and parser.

export interface FeedPost {
  id: string
  headline: string
  source: string
  author?: string
  url: string
  datetime: number // unix seconds
}

const FEEDS: Record<string, { source: string; url: string }[]> = {
  forex: [
    // ForexLive rebranded to investingLive in 2026; the old feed URL redirects.
    { source: 'investingLive', url: 'https://www.forexlive.com/feed/news' },
    { source: 'FXStreet', url: 'https://www.fxstreet.com/rss/news' },
  ],
  markets: [
    { source: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
    { source: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories' },
  ],
}

export const FEED_TABS = Object.keys(FEEDS)

const PER_FEED_CAP = 20
const MERGED_CAP = 40
const FEED_TIMEOUT_MS = 8000

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

// First <tag> value in the item, unwrapping CDATA. Tags may be namespaced
// (dc:creator), so the name is used verbatim.
function field(item: string, tag: string): string {
  const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  if (!m) return ''
  const inner = m[1].trim()
  const cdata = inner.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/)
  return decodeEntities((cdata ? cdata[1] : inner).trim())
}

function parseRss(xml: string, source: string): FeedPost[] {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []
  const posts: FeedPost[] = []
  for (const item of items.slice(0, PER_FEED_CAP)) {
    const headline = field(item, 'title')
    const url = field(item, 'link')
    const pubDate = field(item, 'pubDate')
    const parsed = Date.parse(pubDate)
    if (!headline || !url || Number.isNaN(parsed)) continue
    const author = field(item, 'dc:creator') || field(item, 'author')
    // Author fields are often the outlet itself ("investinglive.com"), an
    // email, or a domain — only keep ones that read like a person's name.
    const isPerson =
      !!author && author !== source && !author.includes('@') && !/\.(com|net|org|io)\b/i.test(author)
    posts.push({
      id: url,
      headline,
      source,
      author: isPerson ? author : undefined,
      url,
      datetime: Math.floor(parsed / 1000),
    })
  }
  return posts
}

export async function fetchMarketFeed(tab: string): Promise<FeedPost[]> {
  const feeds = FEEDS[tab]
  if (!feeds) return []

  const results = await Promise.allSettled(
    feeds.map(async ({ source, url }) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS)
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FreeTradeJournal/1.0; +https://freetradejournal.com)',
            Accept: 'application/rss+xml, application/xml, text/xml, */*',
          },
        })
        if (!res.ok) return []
        return parseRss(await res.text(), source)
      } finally {
        clearTimeout(timer)
      }
    })
  )

  return results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => b.datetime - a.datetime)
    .slice(0, MERGED_CAP)
}
