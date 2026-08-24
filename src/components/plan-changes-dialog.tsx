import { isBirthdayLifetimeWindow } from '@/constants/pricing';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, ArrowRight } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { useThemePresets } from '@/contexts/theme-presets';
import { trackEvent } from '@/lib/analytics';
import { FREE_ANALYTICS_WINDOW_DAYS, PRICING_PLANS } from '@/constants/pricing';
import {
  isPlanChangesAudience,
  isPlanChangesPending,
  markPlanChangesSeen,
} from '@/lib/plan-changes-announcement';

// Let the app paint and settle before interrupting it, same as the farewell
// dialog — a modal steals focus, so it should never race the first render.
const OPEN_DELAY_MS = 1400;

const monthlyPrice = PRICING_PLANS.find((plan) => plan.interval === 'monthly')?.price ?? 12.99;
const yearlyPrice = PRICING_PLANS.find((plan) => plan.interval === 'yearly')?.price ?? 99.99;

// Derived from the prices rather than hardcoded, so the "save 36%" claim can
// never drift out of date behind a price change.
const yearlyAtMonthly = (monthlyPrice * 12).toFixed(2);
const yearlyPerMonth = (yearlyPrice / 12).toFixed(2);
const yearlySavingPercent = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);

/**
 * White text sits on top of the theme's primary colour in the badge and the
 * CTA. Presets range from dark to pale, so layer a fixed black wash underneath
 * rather than trusting every preset to be dark enough on its own.
 */
const onPrimary = (color: string) =>
  `linear-gradient(rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.28)), ${color}`;

export function PlanChangesDialog() {
  const { user, isDemo } = useAuth();
  const { isPro, trialEndsAt } = useProStatus();
  const { themeColors, alpha } = useThemePresets();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const isPayingPro = isPro && !trialEndsAt;
  const accountCreatedAt = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).getTime()
    : null;

  // Dev-only escape hatch: ?planchanges=preview forces the dialog open
  // regardless of targeting, so the copy can be reviewed from an account that
  // would never qualify. Never fires in a production build, never marks itself
  // seen, and never emits analytics — so previews can't pollute the numbers.
  const [previewParam] = useState(() =>
    import.meta.env.DEV ? new URLSearchParams(window.location.search).get('planchanges') : null
  );
  const preview = previewParam === 'preview';

  // Read the seen flag once at mount. Recomputing it every render would make
  // the component erase itself: the effect marks the dialog seen just before
  // opening it, so a live read flips false on that very re-render and returns
  // null before anything paints.
  const [pending] = useState(() => isPlanChangesPending(user?.uid));

  // Pro status can still be settling at mount, so the audience check stays live
  // — a subscription resolving inside the delay window cancels the timer.
  const eligible =
    preview ||
    (pending && isPlanChangesAudience({ uid: user?.uid, isDemo, isPayingPro, accountCreatedAt }));

  useEffect(() => {
    if (triggered || !eligible) return;

    const timer = setTimeout(
      () => {
        if (!preview) {
          // Marked on display, not on dismissal — closing the tab still counts
          // as shown, so nobody gets interrupted twice.
          markPlanChangesSeen(user?.uid);
          trackEvent('plan_changes_shown');
        }
        setTriggered(true);
        setOpen(true);
      },
      preview ? 200 : OPEN_DELAY_MS
    );

    return () => clearTimeout(timer);
  }, [eligible, triggered, preview, user?.uid]);

  // Once it has opened, keep rendering it regardless of the flags it just set.
  if (!triggered && !eligible) return null;

  const handleCta = () => {
    if (!preview) trackEvent('pricing_cta_clicked', { plan: 'pro', source: 'plan_changes_dialog' });
    setOpen(false);
    navigate('/pricing');
  };

  const handleDismiss = (next: boolean) => {
    if (!next && !preview) trackEvent('plan_changes_dismissed');
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      {/* Wider than the farewell dialog on purpose: that one carried four short
          lines and a price grid, this one carries prose. At max-w-md the lines
          run ~40 characters and the buttons fall below the fold. */}
      <DialogContent className="max-w-xl gap-0 p-0 overflow-hidden">
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
            style={{ background: onPrimary(themeColors.primary) }}
          >
            <Info className="h-3 w-3" aria-hidden="true" />
            Plan update
          </span>

          <DialogTitle className="mt-4 text-2xl font-bold tracking-tight">
            Two things changed, and here's why
          </DialogTitle>

          <DialogDescription className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Nothing you have logged is affected. Two things about Pro changed this week, and you
            should hear why from us rather than notice it yourself.
          </DialogDescription>

          <div
            className="mt-5 rounded-xl p-4"
            style={{ backgroundColor: alpha(themeColors.primary, '14') }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pro trials now start at checkout
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              Every new account used to get 14 days of Pro, no card needed. That worked until people
              started deleting their accounts and signing up again to get another 14 days, then
              again after that.
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              So the trial now sits at checkout instead. Pick monthly or yearly, the first 14 days
              are free, and you can cancel before day 14 without being charged.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              If you already had your 14 days, upgrading now starts your plan straight away.
            </p>
          </div>

          <div className="mt-3 rounded-xl bg-muted/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Lifetime Pro has retired
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              Lifetime went off sale on the 7th of August 2026. It was a founding member price from when
              the app was new. One payment does not cover something that costs money to run
              every month for years.
              {isBirthdayLifetimeWindow() && (
                <> One exception: for FreeTradeJournal&apos;s first birthday it is back on the
                pricing page until 4 September at $199, then it goes again.</>
              )}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              If you bought it, nothing changes. You keep every Pro feature permanently, with
              nothing to renew and nothing to pay again. For everyone else it is monthly or yearly
              from here.
            </p>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Your free plan is untouched and still needs no card. Pro is for when{' '}
            {FREE_ANALYTICS_WINDOW_DAYS} days of analytics stops being enough — your whole history
            in the numbers, AI coaching on your own trades without a monthly cap, and every device
            in sync.
          </p>

          {/* Yearly leads on the left: it is the anchor now that lifetime is gone. */}
          <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-xl border">
            <div
              className="p-4"
              style={{
                backgroundColor: alpha(themeColors.primary, '14'),
                borderRight: `1px solid ${alpha(themeColors.primary, '30')}`,
              }}
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight">${yearlyPrice}</span>
                <span className="text-xs text-muted-foreground line-through">${yearlyAtMonthly}</span>
              </div>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Best value · every year
              </p>
              <p className="mt-2 text-xs" style={{ color: themeColors.primary }}>
                Save {yearlySavingPercent}% — works out at ${yearlyPerMonth} a month
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
              <p className="mt-2 text-xs text-muted-foreground">Cancel whenever you like</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={handleCta}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{ background: onPrimary(themeColors.primary) }}
            >
              Get Pro
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => handleDismiss(false)}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Got it
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
