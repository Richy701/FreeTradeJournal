/**
 * Server-side activity events via the `trackActivity` Cloud Function.
 *
 * Client posthog-js is ad-blocker-lossy, and the things reported here (still
 * active on day N, saved a journal entry, hit a client-only plan gate) never
 * otherwise reach the server because free users' data lives in localStorage.
 * The function captures the event in PostHog with the uid and, for
 * session_seen, stamps users/{uid}.lastActiveAt.
 *
 * Fire-and-forget: never awaited by callers, never throws, skipped in demo.
 */

export type ActivityEvent = 'session_seen' | 'journal_entry_saved' | 'gate_hit';
export type ActivityGate =
  | 'journal_cap'
  | 'account_cap'
  | 'prop_cap'
  | 'analytics_window'
  | 'period_pills'
  | 'pdf'
  | 'theme_studio'
  | 'prop_panel'
  | 'cloud_sync';

// Per-page-load dedupe so a re-rendering gate or a hot effect reports once.
const sentOnce = new Set<string>();

export function trackActivity(
  event: ActivityEvent,
  props?: Record<string, string | number | boolean>,
  opts?: { onceKey?: string },
): void {
  // Demo mode has no real backend user (see auth-context: dataset.demo).
  if (typeof document !== 'undefined' && document.documentElement.dataset.demo) return;
  if (opts?.onceKey) {
    if (sentOnce.has(opts.onceKey)) return;
    sentOnce.add(opts.onceKey);
  }
  void (async () => {
    try {
      const [{ httpsCallable }, { getFirebaseFunctions }] = await Promise.all([
        import('firebase/functions'),
        import('@/lib/firebase-lazy'),
      ]);
      const fns = await getFirebaseFunctions();
      await httpsCallable(fns, 'trackActivity')({ event, props });
    } catch {
      // Telemetry is best-effort; never surface to the user.
    }
  })();
}

/** Report a plan-limit hit once per page load per gate. */
export function trackGateHit(gate: ActivityGate, props?: Record<string, string | number | boolean>): void {
  trackActivity('gate_hit', { gate, ...props }, { onceKey: `gate:${gate}` });
}
