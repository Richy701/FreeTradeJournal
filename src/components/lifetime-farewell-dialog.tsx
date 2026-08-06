import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, ArrowRight } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { useThemePresets } from '@/contexts/theme-presets';
import { trackEvent } from '@/lib/analytics';
import { FOUNDER_LIFETIME_PRICE, LIFETIME_RETIRES_AT, PRICING_PLANS } from '@/constants/pricing';
import {
  isLifetimeFarewellAudience,
  isLifetimeFarewellPending,
  lifetimeCountdownBadge,
  lifetimeCountdownPhrase,
  lifetimeDaysLeft,
  markLifetimeFarewellSeen,
} from '@/lib/lifetime-farewell';

// Let the app paint and settle before interrupting it. Longer than the founder
// banner's 800ms because a modal steals focus.
const OPEN_DELAY_MS = 1400;

const monthlyPrice = PRICING_PLANS.find((plan) => plan.interval === 'monthly')?.price ?? 12.99;
const yearlyListPrice = PRICING_PLANS.find((plan) => plan.interval === 'yearly')?.price ?? 99.99;
const lifetimeListPrice = PRICING_PLANS.find((plan) => plan.interval === 'lifetime')?.price ?? 249;
const yearlyCost = (monthlyPrice * 12).toFixed(2);

// Hours until the cutoff, rendered as "about 26 hours" — a local-time stamp
// was tried here and read as nonsense east of UTC, where 11:59 PM UTC Friday
// lands on Saturday. A countdown is unambiguous in every time zone.
const hoursLeftPhrase = () => {
  const hours = Math.max(1, Math.round((LIFETIME_RETIRES_AT - Date.now()) / 3_600_000));
  return hours === 1 ? 'about an hour' : `about ${hours} hours`;
};

/**
 * White text sits on top of the theme's primary colour in the badge and the
 * CTA. Presets range from dark to pale, so layer a fixed black wash underneath
 * rather than trusting every preset to be dark enough on its own.
 */
const onPrimary = (color: string) =>
  `linear-gradient(rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.28)), ${color}`;

export function LifetimeFarewellDialog() {
  const { user, isDemo } = useAuth();
  const { isPro, trialEndsAt } = useProStatus();
  const { themeColors, alpha } = useThemePresets();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const isTrialing = !!trialEndsAt;
  const isPayingPro = isPro && !trialEndsAt;

  // Dev-only escape hatch: ?farewell=preview forces the dialog open regardless
  // of targeting, so the copy can be reviewed from an account that would never
  // qualify; ?farewell=preview-final previews the final-day variant early.
  // Never fires in a production build, never marks itself seen, and never
  // emits analytics — so repeated previews can't pollute the real numbers.
  const [previewParam] = useState(
    () => (import.meta.env.DEV ? new URLSearchParams(window.location.search).get('farewell') : null)
  );
  const preview = previewParam === 'preview' || previewParam === 'preview-final';

  // The closing window (last two days) drops the joke: same dialog, straight
  // last-call copy. "Tonight" vs "tomorrow night" tracks the actual deadline.
  const finalDay = previewParam === 'preview-final' || lifetimeDaysLeft() <= 1;
  const endsTonight = lifetimeDaysLeft() <= 0;

  // Read the seen flag once at mount. Recomputing it every render would make
  // the component erase itself: the effect marks the dialog seen just before
  // opening it, so a live read flips false on that very re-render and returns
  // null before anything paints. ProtectedRoute guarantees a resolved uid by
  // the time Layout mounts, so the lazy initializer is safe here.
  const [pending] = useState(() => isLifetimeFarewellPending(user?.uid));

  // Pro status can still be settling at mount, so the audience check stays live
  // — a subscription resolving inside the delay window cancels the timer.
  const eligible =
    preview ||
    (pending && isLifetimeFarewellAudience({ uid: user?.uid, isDemo, isPayingPro, isTrialing }));

  useEffect(() => {
    if (triggered || !eligible) return;

    const timer = setTimeout(() => {
      if (!preview) {
        // Marked on display, not on dismissal — closing the tab still counts as
        // shown, so nobody gets interrupted twice.
        markLifetimeFarewellSeen(user?.uid);
        trackEvent('lifetime_farewell_shown', { days_left: lifetimeCountdownBadge() });
      }
      setTriggered(true);
      setOpen(true);
    }, preview ? 200 : OPEN_DELAY_MS);

    return () => clearTimeout(timer);
  }, [eligible, triggered, preview, user?.uid]);

  // Once it has opened, keep rendering it regardless of the flags it just set.
  if (!triggered && !eligible) return null;

  const handleCta = () => {
    if (!preview) trackEvent('pricing_cta_clicked', { plan: 'lifetime', source: 'farewell_dialog' });
    setOpen(false);
    navigate('/pricing');
  };

  const handleDismiss = (next: boolean) => {
    if (!next && !preview) trackEvent('lifetime_farewell_dismissed');
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        <div className="p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
            style={{ background: onPrimary(themeColors.primary) }}
          >
            <Timer className="h-3 w-3" aria-hidden="true" />
            {finalDay && !endsTonight ? 'Ends tomorrow' : lifetimeCountdownBadge()}
          </span>

          <DialogTitle className="mt-4 text-2xl font-bold tracking-tight">
            {finalDay
              ? endsTonight
                ? 'Lifetime Pro ends tonight'
                : 'Lifetime Pro ends tomorrow night'
              : "It's not you, it's the pricing"}
          </DialogTitle>

          <DialogDescription className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {finalDay ? (
              <>
                Sales close {endsTonight ? 'tonight' : 'tomorrow night'} at 11:59 PM UTC —{' '}
                {hoursLeftPhrase()} from now. Pay ${FOUNDER_LIFETIME_PRICE} once with code{' '}
                <strong className="font-semibold text-foreground">FOUNDER149</strong> and you have
                Pro forever.
              </>
            ) : (
              <>
                Lifetime Pro retires on Friday. We did the maths, and one payment only really works
                out for one of us. You can probably guess which.
              </>
            )}
          </DialogDescription>

          {/* The arithmetic is the punchline, so let it carry the weight visually. */}
          <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border">
            <div
              className="p-4"
              style={{
                backgroundColor: alpha(themeColors.primary, '14'),
                borderRight: `1px solid ${alpha(themeColors.primary, '30')}`,
              }}
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight">${FOUNDER_LIFETIME_PRICE}</span>
                <span className="text-xs text-muted-foreground line-through">
                  ${lifetimeListPrice}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Once
              </p>
              <p className="mt-2 text-xs" style={{ color: themeColors.primary }}>
                And never again
              </p>
            </div>

            <div className="bg-muted/40 p-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-muted-foreground">
                  ${monthlyPrice}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Every month
              </p>
              <p className="mt-2 text-xs text-muted-foreground">${yearlyCost} a year, forever</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {finalDay ? (
              <>
                After {endsTonight ? 'tonight' : 'tomorrow night'}, Pro is ${monthlyPrice} a month
                or ${yearlyListPrice} a year — this option won't come back. Everyone who already
                owns it keeps it for good.
              </>
            ) : (
              <>
                {lifetimeCountdownPhrase()} to take advantage of us. Everyone who already owns it
                keeps it for good.
              </>
            )}
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={handleCta}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{ background: onPrimary(themeColors.primary) }}
            >
              Take the deal
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => handleDismiss(false)}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {finalDay ? 'No thanks' : 'Not today'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
