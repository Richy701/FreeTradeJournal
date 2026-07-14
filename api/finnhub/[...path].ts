import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM = 'https://finnhub.io/api/v1';
const PREFIX = '/api/finnhub/';

// Map the (single-segment) client path -> the real Finnhub endpoint. Keeping the
// client path single-segment avoids Vercel's flaky multi-segment catch-all routing.
const ROUTES: Record<string, string> = {
  quote: 'quote',
  news: 'news',
  'company-news': 'company-news',
};

// Longer edge cache for slower-moving data, short for quotes.
const CACHE_SECONDS: Record<string, number> = {
  quote: 60,
  news: 900,
  'company-news': 900,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Market data not configured' });
    return;
  }

  // Derive the sub-path from the URL directly. Vercel exposes the [...path]
  // catch-all param under an unstable key, so we don't rely on req.query.
  const rawUrl = req.url || '';
  const [pathname, rawQuery = ''] = rawUrl.split('?');
  const subPath = (pathname.split(PREFIX)[1] || '').replace(/^\/+|\/+$/g, '');

  const upstreamPath = ROUTES[subPath];
  if (!upstreamPath) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  // Forward ONLY validated, allowlisted params — never arbitrary ones. Anything
  // else lets anonymous callers cache-bust the edge and burn the upstream quota.
  const incoming = new URLSearchParams(rawQuery);
  const params = new URLSearchParams({ token: apiKey });
  const SYMBOL = /^[A-Z][A-Z0-9.]{0,9}$/;
  const DATE = /^\d{4}-\d{2}-\d{2}$/;

  let valid = true;
  if (subPath === 'quote') {
    const symbol = incoming.get('symbol') || '';
    valid = SYMBOL.test(symbol);
    if (valid) params.set('symbol', symbol);
  } else if (subPath === 'news') {
    const category = incoming.get('category') || 'general';
    valid = ['general', 'forex', 'crypto'].includes(category);
    if (valid) params.set('category', category);
  } else if (subPath === 'company-news') {
    const symbol = incoming.get('symbol') || '';
    const from = incoming.get('from') || '';
    const to = incoming.get('to') || '';
    valid = SYMBOL.test(symbol) && DATE.test(from) && DATE.test(to);
    if (valid) {
      params.set('symbol', symbol);
      params.set('from', from);
      params.set('to', to);
    }
  }
  if (!valid) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({ error: 'Invalid parameters' });
    return;
  }

  const url = `${UPSTREAM}/${upstreamPath}?${params.toString()}`;
  const maxAge = CACHE_SECONDS[subPath] ?? 60;

  try {
    const upstream = await fetch(url);
    const body = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    if (upstream.ok) {
      res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    res.status(upstream.status).send(body);
  } catch {
    res.status(502).json({ error: 'Upstream request failed' });
  }
}
