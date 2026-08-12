import { lazy, type ComponentType } from 'react';

const RELOAD_KEY = 'chunk-reload-at';

// A stale-chunk reload is only useful once per deploy window. A second failure
// arriving inside this window means the reload didn't heal anything, so the
// error belongs on screen rather than in another reload.
const RELOAD_COOLDOWN_MS = 30_000;

// The service worker can stall; never let the update pass outlive the reload.
const SW_UPDATE_TIMEOUT_MS = 2000;

/**
 * Drop-in replacement for React.lazy that self-heals stale-chunk failures.
 *
 * After a deploy, an already-open tab holds an old index.html that references
 * chunk hashes which no longer exist on the CDN. The dynamic import then 404s
 * and falls through to the SPA rewrite (index.html, text/html), so the browser
 * throws "Failed to fetch dynamically imported module" and the page goes blank.
 *
 * On the first such failure we force one full reload to pull a fresh index.html
 * with current hashes. If the import still fails after that reload, we rethrow
 * so a genuine error surfaces instead of looping.
 *
 * The guard is a timestamp rather than a boolean, and nothing clears it on
 * success. An earlier version cleared it whenever *any* chunk resolved, which
 * defeated it entirely: App.tsx mounts several of these unconditionally, so a
 * cache-warm chunk would wipe the flag on every load while the failing chunk
 * re-armed it — an unbounded reload loop instead of a single retry.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() => loadWithRetry(factory));
}

/** Exported for tests; use lazyWithRetry in app code. */
export async function loadWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  let mod: { default: T } | undefined;
  try {
    mod = await factory();
  } catch (error) {
    if (!attemptStaleChunkReload()) throw error;
    // Never resolve — the reload is in flight; avoids flashing an error boundary.
    return new Promise<{ default: T }>(() => {});
  }
  // The vite:preloadError listener preventDefault()s a failure it is already
  // healing, which makes the import resolve with no module. Suspend forever —
  // the reload it started is about to replace this document.
  if (!mod) return new Promise<{ default: T }>(() => {});
  return mod;
}

/**
 * Single reload-or-surface decision shared by every stale-chunk recovery path.
 * True = a healing reload has been initiated; false = the guard says this
 * failure must surface (a reload already ran and didn't heal, or storage is
 * blocked — Safari private mode — so the guard can't survive a reload and the
 * only safe number of reloads is zero).
 */
export function attemptStaleChunkReload(): boolean {
  if (Date.now() - readLastReload() < RELOAD_COOLDOWN_MS) return false;
  if (!markReload()) return false;
  void refreshServiceWorker().then(() => window.location.reload());
  return true;
}

/**
 * Vite fires a cancelable vite:preloadError for every failed chunk or CSS
 * preload, including dynamic imports that don't go through lazyWithRetry
 * (firebase-lazy, widget registry). Route them all through the same guard;
 * preventDefault() stops Vite from rethrowing a failure we're already healing,
 * so tabs holding a pre-deploy index.html reload instead of logging an
 * unhandled "Failed to fetch dynamically imported module".
 */
export function installStaleChunkReloadListener(): void {
  window.addEventListener('vite:preloadError', (event) => {
    if (attemptStaleChunkReload()) event.preventDefault();
  });
}

function readLastReload(): number {
  try {
    return Number(window.sessionStorage.getItem(RELOAD_KEY)) || 0;
  } catch {
    return 0;
  }
}

function markReload(): boolean {
  try {
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

/**
 * sw.ts serves navigations from the precached index.html, so a plain reload
 * replays the very same dead chunk hashes. Give the service worker a chance to
 * pick up the new precache first, but never block the reload on it.
 */
async function refreshServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const update = (async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    } catch {
      // Best effort — the reload happens either way.
    }
  })();

  await Promise.race([
    update,
    new Promise<void>((resolve) => setTimeout(resolve, SW_UPDATE_TIMEOUT_MS)),
  ]);
}
