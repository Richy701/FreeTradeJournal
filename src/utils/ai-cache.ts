interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// AI responses are cached in localStorage. Keys are scoped to the current user
// (matching UserStorage's `user_<uid>_` scheme) so one account's private AI
// output can never surface for another user — including the demo user — and so
// clearDemoStorage()/clearUserData() also wipe them. AuthProvider keeps this in
// sync via setAICacheUser whenever the signed-in user (or demo) changes.
let currentUid: string | null = null;

export function setAICacheUser(uid: string | null): void {
  currentUid = uid;
}

function scopedKey(key: string): string {
  return currentUid ? `user_${currentUid}_${key}` : `guest_${key}`;
}

export function getAICache<T>(key: string, ttlMs: number): T | null {
  try {
    const scoped = scopedKey(key);
    const raw = localStorage.getItem(scoped);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > ttlMs) {
      localStorage.removeItem(scoped);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setAICache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(scopedKey(key), JSON.stringify(entry));
  } catch { /* quota exceeded — best-effort cache */ }
}

export function clearAICache(key: string): void {
  localStorage.removeItem(scopedKey(key));
}
