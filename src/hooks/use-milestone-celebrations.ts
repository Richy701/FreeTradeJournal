import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { triggerFeedbackDialog } from '@/lib/feedback-trigger';

const MILESTONES = [
  { count: 10, title: 'Double digits', message: '10 trades logged. Your data is starting to tell a story.' },
  { count: 25, title: 'Quarter century', message: '25 trades in the book. Patterns are emerging.' },
  { count: 50, title: 'Fifty and counting', message: '50 trades tracked. You\'re building a real edge.' },
  { count: 100, title: 'Triple digits', message: '100 trades logged. Serious trader territory.' },
  { count: 250, title: 'Relentless', message: '250 trades. Your journal is a weapon now.' },
  { count: 500, title: 'Half a thousand', message: '500 trades. You\'re in the top tier of journalers.' },
  { count: 1000, title: 'The thousand club', message: '1,000 trades. Legendary discipline.' },
] as const;

const FLAG_PREFIX = 'milestone-celebrated-';

export function useMilestoneCelebrations(tradeCount: number) {
  const { user, isDemo } = useAuth();
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user || isDemo || tradeCount === 0) {
      prevCountRef.current = tradeCount;
      return;
    }

    const prev = prevCountRef.current;
    prevCountRef.current = tradeCount;

    if (prev === null || prev === tradeCount) return;

    for (const milestone of MILESTONES) {
      if (prev < milestone.count && tradeCount >= milestone.count) {
        const flagKey = `${FLAG_PREFIX}${user.uid}-${milestone.count}`;
        if (localStorage.getItem(flagKey)) continue;

        confetti({
          particleCount: 80 + milestone.count / 5,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#10b981', '#3b82f6'],
        });

        toast.success(milestone.title, {
          description: milestone.message,
          duration: 6000,
        });

        // After a short delay, prompt for feedback at key milestones
        if (milestone.count >= 25) {
          setTimeout(() => {
            toast('How are you finding FreeTradeJournal?', {
              description: 'Your feedback helps us build a better tool for traders.',
              duration: 10000,
              action: {
                label: 'Share feedback',
                onClick: () => triggerFeedbackDialog(`Milestone: ${milestone.count} trades`),
              },
            });
          }, 3000);
        }

        localStorage.setItem(flagKey, '1');
        break;
      }
    }
  }, [tradeCount, user, isDemo]);
}
