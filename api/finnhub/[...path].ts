import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM = 'https://finnhub.io/api/v1';

// Only these upstream endpoints may be proxied — prevents the function being
// used as a general-purpose gateway for our API key.
const ALLOWED_PATHS = new Set(['quote', 'news', 'company-news', 'calendar/economic']);

// Longer edge cache for slower-moving data, short for quotes.
const CACHE_SECONDS: Record<string, number> = {
  quote: 60,
  news: 900,
  'company-news': 900,
  'calendar/economic': 1800,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Market data not configured' });
    return;
  }

  const segments = req.query.path;
  const subPath = Array.isArray(segments) ? segments.join('/') : (segments || '');
  if (!ALLOWED_PATHS.has(subPath)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const qs = req.url?.includes('?') ? req.url.split('?').slice(1).join('?') : '';
  const base = `${UPSTREAM}/${subPath}`;
  const url = qs ? `${base}?${qs}&token=${apiKey}` : `${base}?token=${apiKey}`;

  const maxAge = CACHE_SECONDS[subPath] ?? 60;

  try {
    const upstream = await fetch(url);
    const body = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
    res.status(upstream.status).send(body);
  } catch {
    res.status(502).json({ error: 'Upstream request failed' });
  }
}
