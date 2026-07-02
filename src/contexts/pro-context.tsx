import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getFirebaseFirestore } from '@/lib/firebase-lazy';
import { redirectToCheckout } from '@/lib/stripe';
import { trackEvent } from '@/lib/analytics';
import { toast } from 'sonner';
import { UserStorage } from '@/utils/user-storage';
import type { SubscriptionInfo } from '@/types/subscription';

export interface FreeAIQuota {
  used: number;
  limit: number;
  remaining: number;
}

interface ProContextType {
  isPro: boolean;
  isLoading: boolean;
  subscription: SubscriptionInfo | null;
  openCheckout: (priceId: string) => void;
  hasAIAccess: boolean;
  freeAiQuota: FreeAIQuota | null;
  updateFreeAiQuota: (quota: FreeAIQuota) => void;
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
const FREE_AI_CACHE_KEY = 'freeAiQuota';
const FREE_AI_MONTHLY_LIMIT = 20;

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
  const { user, isDemo } = useAuth();
  const uid = user?.uid || null;

  // Fast initial load from localStorage cache
  const cached = uid ? UserStorage.getItem(uid, PRO_CACHE_KEY) : null;
  const cachedSub: SubscriptionInfo | null = (() => {
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch (err) {
      console.error('[ProProvider] Failed to parse cached subscription:', err);
      // Clear corrupted cache
      if (uid) UserStorage.removeItem(uid, PRO_CACHE_KEY);
      return null;
    }
  })();

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(cachedSub);
  const [referralProExpiresAt, setReferralProExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!cachedSub && !!uid && !isDemo);

  const [freeAiQuota, setFreeAiQuota] = useState<FreeAIQuota | null>(() => {
    if (!uid) return null;
    const cached = UserStorage.getItem(uid, FREE_AI_CACHE_KEY);
    if (!cached) return { used: 0, limit: FREE_AI_MONTHLY_LIMIT, remaining: FREE_AI_MONTHLY_LIMIT };
    try {
      const parsed = JSON.parse(cached);
      const currentMonth = new Date().toISOString().slice(0, 7);
      if (parsed.month !== currentMonth) {
        return { used: 0, limit: FREE_AI_MONTHLY_LIMIT, remaining: FREE_AI_MONTHLY_LIMIT };
      }
      return parsed.quota as FreeAIQuota;
    } catch {
      return { used: 0, limit: FREE_AI_MONTHLY_LIMIT, remaining: FREE_AI_MONTHLY_LIMIT };
    }
  });

  const updateFreeAiQuota = useCallback((quota: FreeAIQuota) => {
    setFreeAiQuota(quota);
    if (uid) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      UserStorage.setItem(uid, FREE_AI_CACHE_KEY, JSON.stringify({ month: currentMonth, quota }));
    }
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
    }

    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const db = await getFirebaseFirestore();
        const { doc, onSnapshot } = await import('firebase/firestore');

        const userDocRef = doc(db, 'users', uid);
        unsubscribe = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data.subscription) {
                const sub = data.subscription as SubscriptionInfo;
                setSubscription(sub);
                UserStorage.setItem(uid, PRO_CACHE_KEY, JSON.stringify(sub));
              } else {
                setSubscription(null);
                UserStorage.removeItem(uid, PRO_CACHE_KEY);
              }
              setReferralProExpiresAt(data.referralProExpiresAt || null);
            } else {
              setSubscription(null);
              setReferralProExpiresAt(null);
              UserStorage.removeItem(uid, PRO_CACHE_KEY);
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
      unsubscribe?.();
    };
  }, [uid, isDemo]);

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

  const hasReferralPro = !!referralProExpiresAt && new Date(referralProExpiresAt) > new Date();

  // isPro means "actually entitled" — a paid subscription or referral perk.
  // Demo mode counts as Pro so the read-only demo showcases the full product
  // (every Pro feature visible and working with sample data). Edits are still
  // blocked by useDemoGuard, and AI calls are served canned responses (below),
  // so nothing real is mutated or charged.
  const isPro = isDemo || isActivePro(subscription) || hasReferralPro;
  // Demo gets AI access too. Safe: demo never calls the real (paid) AI backend —
  // the useStreamingAI hook and PropTracker AI handler serve canned sample
  // responses (src/lib/demo-ai.ts) instead. Components that auto-fetch when
  // hasAIAccess is true therefore auto-show sample output in demo.
  const hasAIAccess = isDemo || isPro || (freeAiQuota !== null && freeAiQuota.remaining > 0);

  const value: ProContextType = useMemo(() => ({
    isPro,
    isLoading,
    subscription,
    openCheckout: handleOpenCheckout,
    hasAIAccess,
    freeAiQuota: isPro || isDemo ? null : freeAiQuota,
    updateFreeAiQuota,
  }), [isPro, isDemo, isLoading, subscription, handleOpenCheckout, hasAIAccess, freeAiQuota, updateFreeAiQuota]);

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}
