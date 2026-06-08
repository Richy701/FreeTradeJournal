import type { VercelRequest, VercelResponse } from '@vercel/node';

const POSTHOG_HOST = 'https://eu.i.posthog.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathSegments = req.query.path;
  const subPath = Array.isArray(pathSegments) ? pathSegments.join('/') : (pathSegments || '');
  const search = req.url?.includes('?') ? '?' + req.url.split('?').slice(1).join('?') : '';
  const posthogUrl = `${POSTHOG_HOST}/${subPath}${search}`;

  try {
    const response = await fetch(posthogUrl, {
      method: req.method || 'POST',
      headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
      body: req.method !== 'GET' && req.method !== 'HEAD'
        ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
        : undefined,
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch {
    res.status(502).json({ error: 'Failed to proxy to PostHog' });
  }
}
