import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM = 'https://api.twelvedata.com';

// Only these upstream endpoints may be proxied — prevents the function being
// used as a general-purpose gateway for our API key.
const ALLOWED_PATHS = new Set(['quote']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.TWELVEDATA_API_KEY;
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
  const url = qs ? `${base}?${qs}&apikey=${apiKey}` : `${base}?apikey=${apiKey}`;

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
