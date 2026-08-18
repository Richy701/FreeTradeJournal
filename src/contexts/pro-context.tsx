import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { FREE_AI_QUOTA_EXHAUSTED_EVENT } from '@/lib/ai-quota';
import { useAuth } from '@/contexts/auth-context';
import { getFirebaseFirestore } from '@/lib/firebase-lazy';
import { redirectToCheckout } from '@/lib/stripe';
import { trackEvent } from '@/lib/analytics';
import { toast } from 'sonner';
import { UserStorage } from '@/utils/user-storage';
import type { SubscriptionInfo } from '@/types/subscription';

// Free-tier AI allowance as the server reports it (getFreeAIQuota / the
// freeUsage block on every AI response). Top-level numbers are the COACHING
// allowance — the one users are gated on. `utility` covers import first-read.
// Auto-fired features (coach tips, journal prompts, risk alerts, on-save
// coach) are capped per day on the server and are not the user's credits, so
// they have no client-side counter.
export interface FreeAIQuota {
  used: number;
  limit: number;
  remaining: number;
  utility?: { used: number; limit: number; remaining: number };
  charged?: 'coaching' | 'utility' | 'auto';
}

interface ProContextType {
  isPro: boolean;
  isLoading: boolean;
  subscription: SubscriptionInfo | null;
  openCheckout: (priceId: string) => void;
  /** Coaching AI (analysis, review, chat, goal coach…): Pro, demo, or free coaching runs left. */
  hasAIAccess: boolean;
  /** Utility AI (import first-read): Pro, demo, or free import reads left. */
  hasUtilityAIAccess: boolean;
  /** Auto-fired AI (coach tips, journal prompts, risk alerts, on-save coach):
   * any signed-in user once Pro status has resolved — the server caps it per day. */
  hasAutoAIAccess: boolean;
  freeAiQuota: FreeAIQuota | null;
  updateFreeAiQuota: (quota: FreeAIQuota) => void;
  /** ISO date the signup Pro trial ends — set only while the trial is the
   * user's sole Pro entitlement (null for paid, referral, expired, demo). */
  trialEndsAt: string | null;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

export function useProStatus() {
  const context = useContext(ProContext);
  if (context === undefined) {
    throw new Error('useProStatus must be used within a ProProvider');
  }
  return context;
}

const PRO_CACHE_KEY = 'proStatus';
// Trial/referral expiry dates cached alongside the subscription so an entitled
// user doesn't flash (or, offline, get stuck in) the free experience while the
// Firestore snapshot is still loading.
const ENTITLEMENT_CACHE_KEY = 'proEntitlements';
const FREE_AI_CACHE_KEY = 'freeAiQuota';
// Mirrors FREE_AI_LIMITS.coaching in functions/src/index.ts.
const FREE_AI_COACHING_LIMIT = 5;
const FREE_AI_UTILITY_LIMIT = 20;
const FRESH_FREE_AI_QUOTA: FreeAIQuota = {
  used: 0, limit: FREE_AI_COACHING_LIMIT, remaining: FREE_AI_COACHING_LIMIT,
  utility: { used: 0, limit: FREE_AI_UTILITY_LIMIT, remaining: FREE_AI_UTILITY_LIMIT },
};

function isFutureIso(date: string | null | undefined): boolean {
  return !!date && new Date(date) > new Date();
}

function isActivePro(sub: SubscriptionInfo | null): boolean {
  if (!sub) return false;
  // past_due = Stripe is still retrying the card (dunning, up to ~2 weeks).
  // Locking out on the first failed charge churned users whose card recovered
  // on retry; if dunning fails Stripe moves the sub to cancelled/unpaid,
  // which ends access here.
  return sub.status === 'active' || sub.status === 'on_trial' || sub.status === 'past_due';
}

interface ProProviderProps {
  children: ReactNode;
}

export function ProProvider({ children }: ProProviderProps) {
  const { user, isDemo, loading: authLoading, hadSession } = useAuth();
  const uid = user?.uid || null;

  // Fast initial load from localStorage cache
  const cached = uid ? UserStorage.getItem(uid, PRO_CACHE_KEY) : null;
  const cachedSub: SubscriptionInfo | null = (() => {
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached);
      // TTL: the cache is only an optimistic bridge until the live snapshot
      // arrives. Without expiry, a device that stays offline (or whose
      // listener errors) kept Pro entitlement forever after a downgrade.
      // Caches written before the TTL existed have no _cachedAt — treat those
      // as expired too, or they're exempt from expiry forever.
      if (!parsed?._cachedAt || Date.now() - parsed._cachedAt > 7 * 24 * 60 * 60 * 1000) {
        if (uid) UserStorage.removeItem(uid, PRO_CACHE_KEY);
        return null;
      }
      return parsed;
    } catch (err) {
      console.error('[ProProvider] Failed to parse cached subscription:', err);
      // Clear corrupted cache
      if (uid) UserStorage.removeItem(uid, PRO_CACHE_KEY);
      return null;
    }
  })();

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(cachedSub);
  const cachedEntitlements: { trial?: string | null; referral?: string | null } = (() => {
    if (!uid) return {};
    try {
      return JSON.parse(UserStorage.getItem(uid, ENTITLEMENT_CACHE_KEY) || '{}');
    } catch {
      return {};
    }
  })();
  const [referralProExpiresAt, setReferralProExpiresAt] = useState<string | null>(cachedEntitlements.referral || null);
  // Signup reverse trial: every new account gets full Pro for 14 days, written
  // server-side by the onUserCreated function. Expiry-date based, no card.
  const [trialProExpiresAt, setTrialProExpiresAt] = useState<string | null>(cachedEntitlements.trial || null);
  const [isLoading, setIsLoading] = useState(!cachedSub && !!uid && !isDemo);

  const [freeAiQuota, setFreeAiQuota] = useState<FreeAIQuota | null>(() => {
    if (!uid) return null;
    const cached = UserStorage.getItem(uid, FREE_AI_CACHE_KEY);
    if (!cached) return FRESH_FREE_AI_QUOTA;
    try {
      const parsed = JSON.parse(cached);
      const currentMonth = new Date().toISOString().slice(0, 7);
      // A cache from the old single-counter scheme (limit 20) is not comparable;
      // start fresh and let the server refresh below correct it.
      if (parsed.month !== currentMonth || parsed.quota?.limit !== FREE_AI_COACHING_LIMIT) {
        return FRESH_FREE_AI_QUOTA;
      }
      return parsed.quota as FreeAIQuota;
    } catch {
      return FRESH_FREE_AI_QUOTA;
    }
  });

  const updateFreeAiQuota = useCallback((quota: FreeAIQuota) => {
    setFreeAiQuota(quota);
    if (uid) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      UserStorage.setItem(uid, FREE_AI_CACHE_KEY, JSON.stringify({ month: currentMonth, quota }));
    }
  }, [uid]);

  // The server denied an AI call for quota: this tab's cached quota was stale.
  // Mark it exhausted so hasAIAccess flips off and every auto-firing feature
  // (risk alerts, coach tips, journal prompts) stops asking until next month.
  useEffect(() => {
    const onExhausted = () => {
      setFreeAiQuota((prev) => {
        const next: FreeAIQuota = { ...(prev ?? FRESH_FREE_AI_QUOTA), used: FREE_AI_COACHING_LIMIT, limit: FREE_AI_COACHING_LIMIT, remaining: 0 };
        if (uid) UserStorage.setItem(uid, FREE_AI_CACHE_KEY, JSON.stringify({ month: new Date().toISOString().slice(0, 7), quota: next }));
        return next;
      });
    };
    window.addEventListener(FREE_AI_QUOTA_EXHAUSTED_EVENT, onExhausted);
    return () => window.removeEventListener(FREE_AI_QUOTA_EXHAUSTED_EVENT, onExhausted);
  }, [uid]);

  // Firestore real-time listener
  useEffect(() => {
    if (!uid || isDemo) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    // If uid just became available (fresh login, no cached sub), mark as loading
    // so dependents like useAutoRestore wait before making decisions
    if (!cachedSub) {
      setIsLoading(true);
    } else {
      // The uid was null on first render, so useState never saw this cache.
      // Apply it now so a cached-Pro user paints Pro on the next frame; the
      // snapshot below confirms or corrects it.
      setSubscription(cachedSub);
      setReferralProExpiresAt(cachedEntitlements.referral || null);
      setTrialProExpiresAt(cachedEntitlements.trial || null);
    }

    let unsubscribe: (() => void) | undefined;
    // The listener attaches after two awaits; if the effect cleans up first
    // (logout, uid change, StrictMode), detach immediately instead of leaking.
    let cancelled = false;

    (async () => {
      try {
        const db = await getFirebaseFirestore();
        const { doc, onSnapshot } = await import('firebase/firestore');
        if (cancelled) return;

        const userDocRef = doc(db, 'users', uid);
        unsubscribe = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data.subscription) {
                const sub = data.subscription as SubscriptionInfo;
                setSubscription(sub);
                UserStorage.setItem(uid, PRO_CACHE_KEY, JSON.stringify({ ...sub, _cachedAt: Date.now() }));
              } else {
                setSubscription(null);
                UserStorage.removeItem(uid, PRO_CACHE_KEY);
              }
              setReferralProExpiresAt(data.referralProExpiresAt || null);
              setTrialProExpiresAt(data.trialProExpiresAt || null);
              UserStorage.setItem(uid, ENTITLEMENT_CACHE_KEY, JSON.stringify({
                trial: data.trialProExpiresAt || null,
                referral: data.referralProExpiresAt || null,
              }));
            } else {
              setSubscription(null);
              setReferralProExpiresAt(null);
              setTrialProExpiresAt(null);
              UserStorage.removeItem(uid, PRO_CACHE_KEY);
              UserStorage.removeItem(uid, ENTITLEMENT_CACHE_KEY);
            }
            setIsLoading(false);
          },
          () => {
            // On error, fall back to cached value
            setIsLoading(false);
          },
        );
      } catch {
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [uid, isDemo]);

  // Server is the source of truth for the free AI quota — the local cache is
  // optimistic and starts fresh on a new device/month, so a new session could
  // show a full quota to a user with none left until their next call fails.
  useEffect(() => {
    if (!uid || isDemo || isLoading) return;
    if (isActivePro(subscription) || isFutureIso(referralProExpiresAt) || isFutureIso(trialProExpiresAt)) return;
    let cancelled = false;
    (async () => {
      try {
        const { getFirebaseFunctions } = await import('@/lib/firebase-lazy');
        const { httpsCallable } = await import('firebase/functions');
        const fns = await getFirebaseFunctions();
        const res = await httpsCallable(fns, 'getFreeAIQuota')();
        if (!cancelled && res.data) updateFreeAiQuota(res.data as FreeAIQuota);
      } catch {
        // Keep the cached value; the next AI call will surface the real state.
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, isDemo, isLoading]);

  const handleOpenCheckout = useCallback(
    async (priceId: string) => {
      if (!priceId) {
        // Empty priceId means a missing VITE_STRIPE_PRICE_* env var at build time
        console.error('Checkout blocked: no Stripe price ID configured');
        trackEvent('checkout_failed', { reason: 'missing_price_id' });
        toast.error('Checkout is temporarily unavailable. Please try again later or contact support.');
        return;
      }
      try {
        await redirectToCheckout(priceId);
      } catch (error) {
        console.error('Failed to open checkout:', error);
        trackEvent('checkout_failed', { priceId, reason: 'session_error' });
        toast.error('Could not start checkout. Please try again, or contact support if it keeps happening.');
      }
    },
    [],
  );

  // Resume a checkout the user started while logged out: Pricing stashes the
  // priceId in sessionStorage (survives the full-page Stripe redirect, OAuth,
  // and the /verify-email hop) before sending them to login/signup. Once the
  // Firebase user is available, finish the checkout exactly once.
  useEffect(() => {
    if (!uid || isDemo) return;
    const priceId = sessionStorage.getItem('pendingCheckoutPriceId');
    if (!priceId) return;
    sessionStorage.removeItem('pendingCheckoutPriceId');
    trackEvent('checkout_started', { priceId, resumed: true });
    handleOpenCheckout(priceId);
  }, [uid, isDemo, handleOpenCheckout]);

  const hasReferralPro = isFutureIso(referralProExpiresAt);
  const hasTrialPro = isFutureIso(trialProExpiresAt);

  // isPro means "actually entitled" — a paid subscription or referral perk.
  // Demo mode counts as Pro so the read-only demo showcases the full product
  // (every Pro feature visible and working with sample data). Edits are still
  // blocked by useDemoGuard, and AI calls are served canned responses (below),
  // so nothing real is mutated or charged.
  const isPro = isDemo || isActivePro(subscription) || hasReferralPro || hasTrialPro;
  // Surface the countdown only when the trial is what's granting Pro
  const trialEndsAt = !isDemo && !isActivePro(subscription) && !hasReferralPro && hasTrialPro
    ? trialProExpiresAt
    : null;
  // Demo gets AI access too. Safe: demo never calls the real (paid) AI backend —
  // the useStreamingAI hook and PropTracker AI handler serve canned sample
  // responses (src/lib/demo-ai.ts) instead. Components that auto-fetch when
  // hasAIAccess is true therefore auto-show sample output in demo.
  const hasAIAccess = isDemo || isPro || (freeAiQuota !== null && freeAiQuota.remaining > 0);
  const hasUtilityAIAccess = isDemo || isPro || (freeAiQuota !== null && (freeAiQuota.utility?.remaining ?? FREE_AI_UTILITY_LIMIT) > 0);

  // Before auth resolves, uid is null and the state above reads "not loading,
  // not Pro" — which painted the free UI for a frame on every reload. For a
  // returning user, that window IS loading. (Strangers with no session hint
  // don't wait, so the logged-out landing page stays instant.)
  const authPending = authLoading && hadSession && !isDemo;
  const effectiveLoading = isLoading || authPending;
  // Auto-fired features are the app's calls, not the user's credits: on once
  // we know who the user is. (Demo shows canned output; see hasAIAccess.)
  const hasAutoAIAccess = isDemo || isPro || (!!uid && !effectiveLoading);

  const value: ProContextType = useMemo(() => ({
    isPro,
    isLoading: effectiveLoading,
    subscription,
    openCheckout: handleOpenCheckout,
    hasAIAccess,
    hasUtilityAIAccess,
    hasAutoAIAccess,
    freeAiQuota: isPro || isDemo ? null : freeAiQuota,
    updateFreeAiQuota,
    trialEndsAt,
  }), [isPro, isDemo, effectiveLoading, subscription, handleOpenCheckout, hasAIAccess, hasUtilityAIAccess, hasAutoAIAccess, freeAiQuota, updateFreeAiQuota, trialEndsAt]);

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}
