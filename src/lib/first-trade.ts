const FLAG_PREFIX = 'first-trade-celebrated-';

export function firstTradeFlagKey(uid: string): string {
  return `${FLAG_PREFIX}${uid}`;
}

// uids with an in-flight markFirstTrade call this session — prevents a same-tick
// double-fire without persisting the flag before the call actually succeeds.
const inFlight = new Set<string>();

/**
 * Records a user's first trade in Firestore (via the markFirstTrade Cloud
 * Function) exactly once per user/device. Idempotent: guarded by the
 * `first-trade-celebrated-<uid>` localStorage flag, so it is safe to call on
 * every trade save / dashboard load. Non-blocking and swallows all errors.
 *
 * The flag is persisted only AFTER the call succeeds, so a transient failure
 * (offline / cold start) is retried on the next save or dashboard load rather
 * than being silently lost. The Cloud Function is server-side idempotent.
 */
export async function recordFirstTradeIfNeeded(uid: string): Promise<void> {
  const flagKey = firstTradeFlagKey(uid);
  if (localStorage.getItem(flagKey)) return;
  if (inFlight.has(uid)) return;
  inFlight.add(uid);

  try {
    const { httpsCallable } = await import('firebase/functions');
    const { getFirebaseFunctions } = await import('@/lib/firebase-lazy');
    const fns = await getFirebaseFunctions();
    const fn = httpsCallable(fns, 'markFirstTrade');
    await fn({});
    localStorage.setItem(flagKey, '1');
  } catch {
    // Leave the flag unset so a later save / dashboard load retries.
  } finally {
    inFlight.delete(uid);
  }
}
