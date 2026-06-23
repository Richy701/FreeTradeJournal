/**
 * Records logged trades server-side via the `trackTradeLogged` Cloud Function.
 *
 * Client-side `trade_created` analytics are ~91% undeliverable (ad blockers,
 * consent memory-persistence, no identify), so per-trade volume cannot be
 * measured from the browser. This authenticated call captures a gate-independent
 * "trade logged" event in PostHog and increments a server-truth counter.
 *
 * Non-blocking and swallows all errors — tracking must never break a trade save.
 * Call it from every path that creates or imports trades (manual add, quick-add,
 * CSV import, onboarding). Pass the number of trades and a short source label.
 */
export async function trackTradeLogged(count: number, source: string): Promise<void> {
  if (!Number.isFinite(count) || count <= 0) return;
  try {
    const { httpsCallable } = await import('firebase/functions');
    const { getFirebaseFunctions } = await import('@/lib/firebase-lazy');
    const fns = await getFirebaseFunctions();
    const fn = httpsCallable(fns, 'trackTradeLogged');
    await fn({ count, source });
  } catch {
    // Server-side tracking is best-effort; never surface to the user.
  }
}
