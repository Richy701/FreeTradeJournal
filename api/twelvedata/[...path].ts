import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM = 'https://api.twelvedata.com';
const PREFIX = '/api/twelvedata/';

// Only these upstream endpoints may be proxied — prevents the function being
// used as a general-purpose gateway for our API key.
const ALLOWED_PATHS = new Set(['quote']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Market data not configured' });
    return;
  }

  // Derive the sub-path from the URL directly. Vercel exposes the [...path]
  // catch-all param under an unstable key, so we don't rely on req.query.
  const rawUrl = req.url || '';
  const [pathname, rawQuery = ''] = rawUrl.split('?');
  const subPath = (pathname.split(PREFIX)[1] || '').replace(/^\/+|\/+$/g, '');

  if (!ALLOWED_PATHS.has(subPath)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  // Forward ONLY a validated symbol — never arbitrary params. Anything else
  // lets anonymous callers cache-bust the edge and burn the upstream quota.
  const symbol = new URLSearchParams(rawQuery).get('symbol') || '';
  if (!/^[A-Z]{1,10}\/[A-Z]{1,6}$/.test(symbol)) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({ error: 'Invalid symbol' });
    return;
  }
  const params = new URLSearchParams({ symbol, apikey: apiKey });

  const url = `${UPSTREAM}/${subPath}?${params.toString()}`;

  try {
    const upstream = await fetch(url);
    const body = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    // Quotes refresh client-side every 5 min, so edge-cache successes for the
    // same window; never cache upstream errors (e.g. 429 quota rejections).
    if (upstream.ok) {
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    res.status(upstream.status).send(body);
  } catch {
    res.status(502).json({ error: 'Upstream request failed' });
  }
}
