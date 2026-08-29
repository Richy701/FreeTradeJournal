import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { trackEvent } from '@/lib/analytics';
import { BIRTHDAY_LIFETIME_PRICE, isBirthdayLifetimeWindow } from '@/constants/pricing';
import { birthdayDaysLeft } from '@/lib/birthday-lifetime';

/**
 * Logged-out hero eyebrow for the birthday lifetime week (28 Aug to 4 Sep
 * 2026). The in-app banner only reaches signed-in users; anyone arriving from
 * a share or a forward lands here first. Renders nothing outside the window.
 */
export function BirthdayLandingPill() {
  if (!isBirthdayLifetimeWindow()) return null;
  const lastDay = birthdayDaysLeft() <= 0;

  return (
    <Link
      to="/pricing"
      onClick={() => trackEvent('pricing_cta_clicked', { plan: 'lifetime', source: 'landing_pill' })}
      className="group inline-flex max-w-full items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 py-1.5 pl-1.5 pr-3.5 text-xs sm:text-sm text-foreground/85 backdrop-blur-sm transition-colors hover:border-amber-500/50 hover:bg-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
    >
      <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-black">
        We are one
      </span>
      <span className="min-w-0 truncate">
        <span className="font-semibold text-foreground">Lifetime Pro is ${BIRTHDAY_LIFETIME_PRICE}</span>
        {lastDay ? ' until tonight' : ' until Friday'}
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-amber-500 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}
