import { lazy, type ComponentType } from 'react';

const RELOAD_KEY = 'chunk-reload-attempted';

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
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const component = await factory();
      window.sessionStorage.removeItem(RELOAD_KEY);
      return component;
    } catch (error) {
      const alreadyReloaded = window.sessionStorage.getItem(RELOAD_KEY) === 'true';
      if (!alreadyReloaded) {
        window.sessionStorage.setItem(RELOAD_KEY, 'true');
        window.location.reload();
        // Never resolve — the reload is in flight; avoids flashing an error boundary.
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
