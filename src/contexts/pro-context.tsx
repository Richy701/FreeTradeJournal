import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getFirebaseFirestore } from '@/lib/firebase-lazy';
import { redirectToCheckout } from '@/lib/stripe';
import { UserStorage } from '@/utils/user-storage';
import type { SubscriptionInfo } from '@/types/subscription';

interface ProContextType {
  isPro: boolean;
  isLoading: boolean;
  subscription: SubscriptionInfo | null;
  openCheckout: (priceId: string) => void;
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

function isActivePro(sub: SubscriptionInfo | null): boolean {
  if (!sub) return false;
  return sub.status === 'active' || sub.status === 'on_trial';
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
  const [isLoading, setIsLoading] = useState(!cachedSub && !!uid && !isDemo);

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
            } else {
              setSubscription(null);
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
      try {
        await redirectToCheckout(priceId);
      } catch (error) {
        console.error('Failed to open checkout:', error);
      }
    },
    [],
  );

  const value: ProContextType = useMemo(() => ({
    isPro: isDemo || isActivePro(subscription),
    isLoading,
    subscription,
    openCheckout: handleOpenCheckout,
  }), [isDemo, subscription, isLoading, handleOpenCheckout]);

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}
