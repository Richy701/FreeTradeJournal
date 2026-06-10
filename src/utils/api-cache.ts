interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function getCached<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch { /* quota exceeded */ }
}

export async function cachedFetch<T>(
  cacheKey: string,
  url: string,
  ttlMs: number,
  transform?: (data: unknown) => T
): Promise<T> {
  const cached = getCached<T>(cacheKey, ttlMs);
  if (cached !== null) return cached;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const raw = await res.json();
  const data = transform ? transform(raw) : (raw as T);
  setCache(cacheKey, data);
  return data;
}
