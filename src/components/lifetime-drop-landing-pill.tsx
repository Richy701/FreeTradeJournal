import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { trackEvent } from '@/lib/analytics';
import { LIFETIME_DROP_PRICE } from '@/constants/pricing';
import { LIFETIME_DROP_PATH, dropDaysLeft, effectiveDropPhase } from '@/lib/lifetime-drop';

/**
 * Logged-out hero eyebrow for the lifetime drop. The in-app strip only
 * reaches signed-in users; anyone arriving from a share or a forward lands
 * here first. Names the offer and the open time before, the deadline after,
 * nothing once the drop has closed.
 */
export function LifetimeDropLandingPill() {
  const phase = effectiveDropPhase();
  if (phase === 'closed') return null;
  const lastDay = phase === 'open' && dropDaysLeft() <= 0;

  return (
    <Link
      to={LIFETIME_DROP_PATH}
      onClick={() => trackEvent('pricing_cta_clicked', { plan: 'lifetime', source: `drop_landing_pill_${phase}` })}
      className="group inline-flex max-w-full items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 py-1.5 pl-1.5 pr-3.5 text-xs text-foreground/85 backdrop-blur-sm transition-colors hover:border-amber-500/50 hover:bg-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 sm:text-sm"
    >
      <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-black">
        ${LIFETIME_DROP_PRICE}
      </span>
      <span className="min-w-0 truncate">
        {phase === 'before' ? (
          <>
            <span className="font-semibold text-foreground">Lifetime Pro is back</span> Friday 9:30 AM New York
          </>
        ) : (
          <>
            <span className="font-semibold text-foreground">Lifetime Pro is back</span>
            {lastDay ? ' until tonight' : ' until Friday'}
          </>
        )}
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-amber-500 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}
