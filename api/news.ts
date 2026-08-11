import type { VercelRequest, VercelResponse } from '@vercel/node';
// The .js extension is required: this compiles to an ESM module, and Node's
// ESM loader does not resolve extensionless relative imports at runtime.
import { fetchMarketFeed, FEED_TABS } from './_lib/market-feed.js';

// Aggregated trader news from public RSS feeds (see api/_lib/market-feed.ts).
// Edge-cached so the upstream outlets see a handful of requests per hour, not
// one per visitor.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawUrl = req.url || '';
  const tab = new URL(rawUrl, 'http://localhost').searchParams.get('tab') || 'forex';

  if (!FEED_TABS.includes(tab)) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({ error: 'Invalid tab' });
    return;
  }

  try {
    const posts = await fetchMarketFeed(tab);
    if (posts.length === 0) {
      // Every upstream feed failed — don't cache the outage.
      res.setHeader('Cache-Control', 'no-store');
      res.status(503).json({ error: 'Feeds unavailable' });
      return;
    }
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    res.status(200).json(posts);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'Feed fetch failed' });
  }
}
