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

  // Forward ONLY validated, allowlisted params — never arbitrary ones. Anything
  // else lets anonymous callers cache-bust the edge and burn the upstream quota.
  const incoming = new URLSearchParams(rawQuery);
  const seriesId = incoming.get('series_id') || '';
  const sortOrder = incoming.get('sort_order') || 'desc';
  const limit = incoming.get('limit') || '12';
  const units = incoming.get('units') || '';

  if (
    !/^[A-Z0-9]{1,30}$/.test(seriesId) ||
    !['asc', 'desc'].includes(sortOrder) ||
    !/^\d{1,3}$/.test(limit) ||
    (units && !/^[a-z0-9_]{1,10}$/.test(units))
  ) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({ error: 'Invalid parameters' });
    return;
  }

  const params = new URLSearchParams({
    series_id: seriesId,
    sort_order: sortOrder,
    limit,
    api_key: apiKey,
    file_type: 'json',
  });
  if (units) params.set('units', units);

  const url = `${UPSTREAM}/${upstreamPath}?${params.toString()}`;

  try {
    const upstream = await fetch(url);
    const body = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    if (upstream.ok) {
      res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`);
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    res.status(upstream.status).send(body);
  } catch {
    res.status(502).json({ error: 'Upstream request failed' });
  }
}
