import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { firstTradeFlagKey, recordFirstTradeIfNeeded } from '@/lib/first-trade';

export function useFirstTradeCelebration(tradeCount: number) {
  const { user, isDemo } = useAuth();
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user || isDemo || tradeCount === 0) {
      prevCountRef.current = tradeCount;
      return;
    }

    // Confetti + toast only on a genuine live 0 -> positive transition observed
    // within this mount. Returning users who already had trades get nothing.
    const wasZero = prevCountRef.current === 0;
    if (wasZero && tradeCount > 0) {
      const flagKey = firstTradeFlagKey(user.uid);
      if (!localStorage.getItem(flagKey)) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff', '#10b981'],
        });

        toast.success('First trade logged!', {
          description: 'Your dashboard is now live. Keep building that edge.',
          duration: 6000,
        });
      }
    }

    // Tracking fires whenever a signed-in, non-demo user has trades and the flag
    // is not yet set -- regardless of whether a live transition was observed.
    // This back-fills existing activated-but-untracked users. The helper guards
    // on the localStorage flag, so this is idempotent and non-blocking.
    recordFirstTradeIfNeeded(user.uid);

    prevCountRef.current = tradeCount;
  }, [tradeCount, user, isDemo]);
}
