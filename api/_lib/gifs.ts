// GIF search shared by api/gifs.ts (Vercel) and the dev twin in
// vite.config.ts, so there is exactly one adapter.
//
// Provider: GIPHY (GIPHY_API_KEY from developers.giphy.com). Tenor's third-
// party API was shut down on 30 June 2026, so it is not an option. Klipy can
// be added as a second adapter once we have a key to test against.

export const GIF_PAGE_SIZE = 24;

export interface GifPickerResult {
  id: string;
  title: string;
  url: string;
  preview: string;
  width: number;
  height: number;
}

export interface GifPage {
  results: GifPickerResult[];
  next: string;
  provider: 'giphy';
}

interface GiphyImage { url: string; width?: string; height?: string }
interface GiphyItem { id: string; title?: string; images?: Record<string, GiphyImage> }

/** Validates the picker's query string. Returns null when it is not acceptable. */
export function parseGifQuery(rawQuery: string): { q: string; offset: number } | null {
  const incoming = new URLSearchParams(rawQuery);
  const q = (incoming.get('q') || '').trim().slice(0, 60);
  const pos = (incoming.get('pos') || '').trim();
  if (pos && !/^\d{1,6}$/.test(pos)) return null;
  return { q, offset: pos ? Number(pos) : 0 };
}

export async function searchGifs(apiKey: string, q: string, offset: number): Promise<GifPage> {
  const params = new URLSearchParams({
    api_key: apiKey,
    limit: String(GIF_PAGE_SIZE),
    offset: String(offset),
    rating: 'pg-13',
    bundle: 'messaging_non_clips',
  });
  if (q) params.set('q', q);
  const url = `https://api.giphy.com/v1/gifs/${q ? 'search' : 'trending'}?${params.toString()}`;
  const upstream = await fetch(url);
  if (!upstream.ok) throw new Error(`giphy ${upstream.status}`);
  const data = (await upstream.json()) as {
    data?: GiphyItem[];
    pagination?: { total_count?: number; count?: number; offset?: number };
  };
  const results = (data.data || [])
    .map((g): GifPickerResult | null => {
      const full = g.images?.downsized_medium?.url ? g.images.downsized_medium : g.images?.original;
      const small = g.images?.fixed_height_small ?? g.images?.fixed_height;
      if (!full?.url || !small?.url) return null;
      return {
        id: g.id,
        title: g.title || '',
        url: full.url,
        preview: small.url,
        width: Number(small.width) || 0,
        height: Number(small.height) || 0,
      };
    })
    .filter((r): r is GifPickerResult => r !== null);
  const p = data.pagination || {};
  const nextOffset = (p.offset ?? offset) + (p.count ?? results.length);
  const more = typeof p.total_count === 'number' ? nextOffset < p.total_count : results.length === GIF_PAGE_SIZE;
  return { results, next: more ? String(nextOffset) : '', provider: 'giphy' };
}
