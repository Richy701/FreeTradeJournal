import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { trackEvent } from '@/lib/analytics';
import { useSaleClock } from '@/hooks/use-sale-clock';
import { SaleCountdown } from '@/components/sale-countdown';
import { BLACK_FRIDAY_LIFETIME_PRICE, BLACK_FRIDAY_YEARLY_PRICE, PRICING_PLANS, isBlackFriday } from '@/constants/pricing';

export function BlackFridayLandingPill() {
  const now = useSaleClock(1000);
  if (!isBlackFriday(now)) return null;
  const offers = [
    { name: 'Pro Yearly', price: BLACK_FRIDAY_YEARLY_PRICE, regular: PRICING_PLANS.find(plan => plan.interval === 'yearly')!.price, terms: 'First year, then $99.99/year', saving: 'Save $20' },
    { name: 'Pro Lifetime', price: BLACK_FRIDAY_LIFETIME_PRICE, regular: PRICING_PLANS.find(plan => plan.interval === 'lifetime')!.price, terms: 'One payment. No renewal.', saving: 'Save $70' },
  ];
  return (
    <div className="w-full border-b border-foreground/15 pb-7 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-[clamp(2rem,3vw,3rem)] font-extrabold uppercase leading-none tracking-[-0.04em] text-amber-600 dark:text-amber-400">Black Friday</span>
        <SaleCountdown prominent />
      </div>
      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        {offers.map((offer, index) => (
          <div key={offer.name} className={index ? 'border-t border-foreground/15 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0' : ''}>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm"><span className="font-medium">{offer.name}</span><span className="text-amber-600 dark:text-amber-400">{offer.saving}</span></div>
            <div className="flex flex-wrap items-baseline gap-3"><strong className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl"><span className="mr-1 align-top text-xl leading-relaxed text-muted-foreground">$</span>{offer.price}</strong><s className="text-lg text-muted-foreground">${offer.regular}</s><span className="text-xs text-muted-foreground">USD</span></div>
            <p className="mt-2 text-xs text-muted-foreground">{offer.terms}</p>
          </div>
        ))}
        <Link to="/pricing?plan=yearly" onClick={() => trackEvent('pricing_cta_clicked', { plan: 'yearly', source: 'black_friday_landing_pill' })} className="inline-flex min-h-11 items-center justify-center gap-3 self-end rounded-lg bg-amber-400 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500">
          View offers <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
