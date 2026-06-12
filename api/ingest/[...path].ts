import type { VercelRequest, VercelResponse } from '@vercel/node';

const POSTHOG_INGEST_HOST = 'https://eu.i.posthog.com';
const POSTHOG_ASSETS_HOST = 'https://eu-assets.i.posthog.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathSegments = req.query.path;
  const subPath = Array.isArray(pathSegments) ? pathSegments.join('/') : (pathSegments || '');
  const search = req.url?.includes('?') ? '?' + req.url.split('?').slice(1).join('?') : '';
  // Static assets (config.js, toolbar.js, recorder, etc.) live on the assets host;
  // ingestion (e/, flags/, decide/) lives on the main host. Routing both to the main
  // host makes /static/ and /array/ 404 and return text/plain, which the browser refuses.
  const isAsset = subPath.startsWith('static/') || subPath.startsWith('array/');
  const host = isAsset ? POSTHOG_ASSETS_HOST : POSTHOG_INGEST_HOST;
  const posthogUrl = `${host}/${subPath}${search}`;

  try {
    const response = await fetch(posthogUrl, {
      method: req.method || 'POST',
      headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
      body: req.method !== 'GET' && req.method !== 'HEAD'
        ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
        : undefined,
    });

    // Forward the upstream Content-Type so JS assets execute (res.send defaults to text/html).
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    const cacheControl = response.headers.get('cache-control');
    if (cacheControl) res.setHeader('Cache-Control', cacheControl);

    const data = await response.text();
    res.status(response.status).send(data);
  } catch {
    res.status(502).json({ error: 'Failed to proxy to PostHog' });
  }
}
