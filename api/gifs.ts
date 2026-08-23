import type { VercelRequest, VercelResponse } from '@vercel/node';
// ESM loader does not resolve extensionless relative imports at runtime.
import { parseGifQuery, searchGifs } from './_lib/gifs.js';

// GIF search for the Trade Ideas composer. Same-origin proxy so the provider
// key stays server-side. The adapter lives in api/_lib/gifs.ts and is shared
// with the Vite dev twin.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).json({ error: 'GIF search not configured' });
    return;
  }

  const [, rawQuery = ''] = (req.url || '').split('?');
  const parsed = parseGifQuery(rawQuery);
  if (!parsed) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({ error: 'Invalid parameters' });
    return;
  }

  try {
    const page = await searchGifs(apiKey, parsed.q, parsed.offset);
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).json(page);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'GIF search unavailable' });
  }
}
