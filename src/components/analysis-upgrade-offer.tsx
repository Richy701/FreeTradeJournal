import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { PRICING_PLANS, ANALYSIS_UPGRADE_SOURCE } from '@/constants/pricing';
import { trackEvent } from '@/lib/analytics';

const DAY = 86_400_000;
const yearly = PRICING_PLANS.find(plan => plan.interval === 'yearly')!;
const monthly = PRICING_PLANS.find(plan => plan.interval === 'monthly')!;
const dollars = (price: number) => `$${price.toFixed(2)}`;

// Mount only below a completed, non-empty analysis. No trade content is sent
// to analytics; the count is the current local account scope, not a server total.
export function AnalysisUpgradeOffer({ tradeCount }: { tradeCount: number }) {
  const { user, isDemo, hadSession } = useAuth();
  const { isPro, isLoading } = useProStatus();
  if (!user || isDemo || isLoading || isPro || !hadSession || tradeCount < 10) return null;
  const createdAt = Date.parse(user.metadata?.creationTime ?? '');
  if (!Number.isFinite(createdAt) || Date.now() - createdAt < DAY) return null;

  return <EligibleOffer key={user.uid} uid={user.uid} tradeCount={tradeCount} />;
}

function EligibleOffer({ uid, tradeCount }: { uid: string; tradeCount: number }) {
  const storageKey = `user_${uid}_${ANALYSIS_UPGRADE_SOURCE}_dismissed`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return Number(localStorage.getItem(storageKey)) > Date.now() - 30 * DAY;
    } catch { return false; }
  });
  const element = useRef<HTMLElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (dismissed || !element.current || tracked.current) return;
    const observer = new IntersectionObserver(entries => {
      if (tracked.current || !entries.some(entry => entry.isIntersecting)) return;
      tracked.current = true;
      trackEvent('analysis_upgrade_offer_shown', { source: ANALYSIS_UPGRADE_SOURCE, trade_count: tradeCount });
      observer.disconnect();
    }, { threshold: 0.5 });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, [dismissed, tradeCount]);

  if (dismissed) return null;

  const trackClick = (plan: string) => trackEvent('analysis_upgrade_offer_clicked', {
    source: ANALYSIS_UPGRADE_SOURCE, plan, trade_count: tradeCount,
  });

  return (
    <aside ref={element} aria-label="Continue your reviews with Pro" className="relative mt-5 rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
      <Button
        variant="ghost" size="icon" className="absolute right-1 top-1 h-10 w-10 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss Pro offer for 30 days"
        onClick={() => {
          setDismissed(true);
          try { localStorage.setItem(storageKey, String(Date.now())); } catch { /* Dismiss still works this visit. */ }
          trackEvent('analysis_upgrade_offer_dismissed', { source: ANALYSIS_UPGRADE_SOURCE });
        }}
      ><X className="h-4 w-4" /></Button>
      <p className="pr-9 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your next review</p>
      <h3 className="mt-1 pr-9 text-base font-semibold text-foreground">Make this a weekly habit</h3>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Keep reviewing your trading patterns with Pro AI coaching, and compare your full analytics history as you go.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-semibold text-foreground">{dollars(yearly.price)}<span className="text-sm font-normal text-muted-foreground"> / year</span></p>
          <p className="text-xs text-muted-foreground">USD · Billed annually · Renews yearly until cancelled</p>
        </div>
        <Button asChild className="shrink-0">
          <Link to={`/pricing?plan=yearly&source=${ANALYSIS_UPGRADE_SOURCE}`} onClick={() => trackClick('yearly')}>View annual Pro</Link>
        </Button>
      </div>
      <Link
        to={`/pricing?plan=monthly&source=${ANALYSIS_UPGRADE_SOURCE}`}
        onClick={() => trackClick('monthly')}
        className="mt-3 inline-flex min-h-10 items-center rounded text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >Prefer monthly? {dollars(monthly.price)}/month</Link>
    </aside>
  );
}
