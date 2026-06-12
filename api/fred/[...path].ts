import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM = 'https://api.stlouisfed.org/fred';
const PREFIX = '/api/fred/';

// Map the (single-segment) client path -> the real FRED endpoint. Keeping the
// client path single-segment avoids Vercel's flaky multi-segment catch-all routing.
const ROUTES: Record<string, string> = {
  observations: 'series/observations',
};

// Macro series update at most daily (most monthly), so cache hard at the edge.
const CACHE_SECONDS = 6 * 60 * 60; // 6h

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.FRED_API_KEY;
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

  // Forward the original query params (minus Vercel's catch-all param) plus the key.
  const params = new URLSearchParams(rawQuery);
  params.delete('...path');
  params.delete('path');
  params.set('api_key', apiKey);
  params.set('file_type', 'json');

  const url = `${UPSTREAM}/${upstreamPath}?${params.toString()}`;

  try {
    const upstream = await fetch(url);
    const body = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`);
    res.status(upstream.status).send(body);
  } catch {
    res.status(502).json({ error: 'Upstream request failed' });
  }
}
