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

  // Forward the original query params (minus Vercel's catch-all param) plus the key.
  const params = new URLSearchParams(rawQuery);
  params.delete('...path');
  params.delete('path');
  params.set('apikey', apiKey);

  const url = `${UPSTREAM}/${subPath}?${params.toString()}`;

  try {
    const upstream = await fetch(url);
    const body = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    res.status(upstream.status).send(body);
  } catch {
    res.status(502).json({ error: 'Upstream request failed' });
  }
}
