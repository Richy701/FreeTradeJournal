import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

const FLAG_PREFIX = 'first-trade-celebrated-';

export function useFirstTradeCelebration(tradeCount: number) {
  const { user, isDemo } = useAuth();
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user || isDemo || tradeCount === 0) {
      prevCountRef.current = tradeCount;
      return;
    }

    const flagKey = `${FLAG_PREFIX}${user.uid}`;
    const alreadyCelebrated = localStorage.getItem(flagKey);
    if (alreadyCelebrated) {
      prevCountRef.current = tradeCount;
      return;
    }

    const wasZero = prevCountRef.current === 0;
    const isNowPositive = tradeCount > 0;

    if (wasZero && isNowPositive) {
      // Fire confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff', '#10b981'],
      });

      // Toast
      toast.success('First trade logged! 🎉', {
        description: 'Your dashboard is now live. Keep building that edge.',
        duration: 6000,
      });

      // Mark celebrated
      localStorage.setItem(flagKey, '1');

      // Write flag to Firestore via Cloud Function (client can't write users doc directly)
      markFirstTradeInFirestore();
    }

    prevCountRef.current = tradeCount;
  }, [tradeCount, user, isDemo]);
}

async function markFirstTradeInFirestore() {
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const fn = httpsCallable(getFunctions(), 'markFirstTrade');
    await fn({});
  } catch {
    // Non-critical
  }
}
