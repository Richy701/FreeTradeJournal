import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, ArrowRight } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { useThemePresets } from '@/contexts/theme-presets';
import { trackEvent } from '@/lib/analytics';
import { BIRTHDAY_LIFETIME_PRICE, PRICING_PLANS } from '@/constants/pricing';
import {
  birthdayCountdownBadge,
  birthdayDaysLeft,
  isBirthdayDialogAudience,
  isBirthdayDialogPending,
  markBirthdayDialogSeen,
} from '@/lib/birthday-lifetime';

// Same delay as the farewell dialog: let the app settle before a modal
// steals focus.
const OPEN_DELAY_MS = 1400;

const monthlyPrice = PRICING_PLANS.find((plan) => plan.interval === 'monthly')?.price ?? 12.99;
const lifetimeListPrice = PRICING_PLANS.find((plan) => plan.interval === 'lifetime')?.price ?? 249;

const onPrimary = (color: string) =>
  `linear-gradient(rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.28)), ${color}`;

/**
 * One-time modal for the birthday lifetime week (28 Aug to 4 Sep 2026).
 * Marks itself seen on display, so the banner takes every load after it.
 * Dev-only ?birthday=preview forces it open without marking or tracking.
 */
export function BirthdayLifetimeDialog() {
  const { user, isDemo } = useAuth();
  const { isPro, trialEndsAt } = useProStatus();
  const { themeColors, alpha } = useThemePresets();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const isTrialing = !!trialEndsAt;
  const isPayingPro = isPro && !trialEndsAt;

  // Dev-only: ?birthday=preview or sessionStorage birthday-preview=preview
  // (the latter survives the demo-mode entry, which is an in-memory state).
  const [preview] = useState(
    () =>
      import.meta.env.DEV &&
      (new URLSearchParams(window.location.search).get('birthday') === 'preview' ||
        sessionStorage.getItem('birthday-preview') === 'preview')
  );

  const [pending] = useState(() => isBirthdayDialogPending(user?.uid));
  const eligible =
    preview ||
    (pending && isBirthdayDialogAudience({ uid: user?.uid, isDemo, isPayingPro, isTrialing }));

  useEffect(() => {
    if (triggered || !eligible) return;
    const timer = setTimeout(() => {
      if (!preview) {
        markBirthdayDialogSeen(user?.uid);
        trackEvent('birthday_lifetime_dialog_shown', { days_left: birthdayDaysLeft() });
      }
      setTriggered(true);
      setOpen(true);
    }, preview ? 200 : OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [eligible, triggered, preview, user?.uid]);

  if (!triggered && !eligible) return null;

  const lastDay = birthdayDaysLeft() <= 0;

  const handleCta = () => {
    if (!preview) trackEvent('pricing_cta_clicked', { plan: 'lifetime', source: 'birthday_dialog' });
    setOpen(false);
    navigate('/pricing');
  };

  const handleDismiss = (next: boolean) => {
    if (!next && !preview) trackEvent('birthday_lifetime_dialog_dismissed');
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        {/* Birthday band: the one place in the app that goes full primary */}
        <div
          className="px-6 pt-7 pb-6 sm:px-8"
          style={{ background: onPrimary(themeColors.primary) }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
            28 August 2025 to 28 August 2026
          </p>
          <p className="mt-1 text-6xl font-extrabold leading-none tracking-tighter text-white">1</p>
          <DialogTitle className="mt-3 text-xl font-bold tracking-tight text-white">
            FreeTradeJournal is one year old.
          </DialogTitle>
        </div>

        <div className="p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
            style={{
              color: themeColors.primary,
              borderColor: alpha(themeColors.primary, '40'),
              backgroundColor: alpha(themeColors.primary, '14'),
            }}
          >
            <Timer className="h-3 w-3" aria-hidden="true" />
            {birthdayCountdownBadge()}
          </span>

          <p className="mt-3 text-lg font-bold tracking-tight">Lifetime Pro is back for one week.</p>

          <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Lifetime came off sale on the 7th of August. For the birthday week it is back. Pay once
            and you get every Pro feature for good, including anything added later.
          </DialogDescription>

          <div
            className="mt-4 rounded-xl border p-4"
            style={{
              backgroundColor: alpha(themeColors.primary, '10'),
              borderColor: alpha(themeColors.primary, '40'),
            }}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">${BIRTHDAY_LIFETIME_PRICE}</span>
              <span className="text-sm text-muted-foreground line-through">${lifetimeListPrice}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              One payment. No renewal. Pro is otherwise ${monthlyPrice} a month.
            </p>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {lastDay
              ? 'It closes tonight at 11:59 PM UTC, then the plan comes off the pricing page again.'
              : 'It closes on Friday the 4th of September at 11:59 PM UTC, then the plan comes off the pricing page again.'}
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={handleCta}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{ background: onPrimary(themeColors.primary) }}
            >
              See the birthday price
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => handleDismiss(false)}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Not today
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
