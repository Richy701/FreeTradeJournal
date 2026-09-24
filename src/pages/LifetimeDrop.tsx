import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import NumberFlow from '@number-flow/react';
import {
  ArrowRight,
  Check,
  ChartLineUp,
  CloudArrowUp,
  FilePdf,
  Infinity as InfinityIcon,
  Sparkle,
  SpinnerGap,
  Timer,
} from '@phosphor-icons/react';
import { SEOMeta } from '@/components/seo-meta';
import { MarketingHeader } from '@/components/marketing-header';
import { Footer7 } from '@/components/blocks/footer-7';
import { footerConfig } from '@/components/blocks/footer-config';
import { GeometricBackdrop } from '@/components/blocks/shape-landing-hero';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { LIFETIME_DROP_PRICE, LIFETIME_DROP_PROMO_CODE, PRICING_PLANS, type LifetimeDropPhase } from '@/constants/pricing';
import {
  DROP_CITY_TIMES,
  LIFETIME_DROP_PATH,
  countdownParts,
  dropDaysLeft,
  dropTargetFor,
  effectiveDropPhase,
} from '@/lib/lifetime-drop';

const lifetimePlan = PRICING_PLANS.find((plan) => plan.interval === 'lifetime')!;
const monthlyPlan = PRICING_PLANS.find((plan) => plan.interval === 'monthly')!;
const yearlyPlan = PRICING_PLANS.find((plan) => plan.interval === 'yearly')!;

// Break-even against the recurring plans, rounded up to whole periods so the
// claim is never generous: 199 / 12.99 = 15.3 months, 199 / 99.99 = 1.99 years.
const MONTHS_TO_BREAK_EVEN = Math.ceil(LIFETIME_DROP_PRICE / monthlyPlan.price);
const YEARS_TO_BREAK_EVEN = Math.ceil(LIFETIME_DROP_PRICE / yearlyPlan.price);

const INCLUDES = [
  { icon: ChartLineUp, label: 'Full analytics history', desc: 'Every stat and chart across your whole trading history, not just the last 30 days.' },
  { icon: Sparkle, label: 'Coach FTJ and AI reviews', desc: 'Trade reviews, risk alerts, strategy tagging and journal coaching with no monthly cap.' },
  { icon: CloudArrowUp, label: 'Cloud sync', desc: 'Your journal backed up and available on every device you sign in on.' },
  { icon: InfinityIcon, label: 'No limits anywhere', desc: 'Unlimited journal entries, trading accounts and PropTracker accounts.' },
  { icon: FilePdf, label: 'PDF trade reports', desc: 'Export a clean report for a prop firm, a mentor or your own records.' },
  { icon: Check, label: 'Everything added later', desc: 'Every Pro feature that ships after you buy is included. No upgrade fee, ever.' },
];

const FAQS = [
  { question: 'Is it really one payment?', answer: `Yes. You pay $${LIFETIME_DROP_PRICE} once and Lifetime Pro is yours for good. There is no renewal, no annual fee and nothing to cancel.` },
  { question: 'I already pay monthly or yearly. What happens?', answer: 'Buying Lifetime replaces your plan. The subscription is cancelled for you at the moment of purchase and you keep Pro without a gap.' },
  { question: 'Do I need a code?', answer: `No. The $${LIFETIME_DROP_PRICE} price is applied for you at checkout. If for any reason it is not, enter ${LIFETIME_DROP_PROMO_CODE} on the payment page.` },
  { question: 'Will Lifetime come back after this week?', answer: 'There is no date for the next one. Lifetime came off sale on 7 August and only returns for short windows like this. After Friday 2 October it comes off the pricing page again.' },
];

// ─── Small pieces ────────────────────────────────────────────
function InlineClock({ target, now, ariaLabel }: { target: number; now: number; ariaLabel: string }) {
  const p = countdownParts(target, now);
  const seg = (v: number, unit: string, pad = true) => (
    <span className="flex items-baseline">
      <NumberFlow value={v} format={pad ? { minimumIntegerDigits: 2 } : undefined} />
      <span className="ml-0.5 text-[0.55em] font-semibold uppercase tracking-wider opacity-60">{unit}</span>
    </span>
  );
  return (
    <span role="timer" aria-label={ariaLabel} className="inline-flex items-baseline gap-2 font-display tabular-nums">
      {p.days > 0 && seg(p.days, 'd', false)}
      {seg(p.hours, 'h')}
      {seg(p.minutes, 'm')}
      {seg(p.seconds, 's')}
    </span>
  );
}

function CityRow({ times }: { times: readonly { city: string; time: string }[] }) {
  return (
    <dl className="mt-3 grid grid-cols-3 gap-3">
      {times.map(({ city, time }) => (
        <div key={city}>
          <dt className="text-xs text-muted-foreground">{city}</dt>
          <dd className="mt-0.5 text-sm font-semibold sm:text-base">{time}</dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Hero action area (the one thing that changes with the phase) ───
function HeroAction({ phase, now }: { phase: LifetimeDropPhase | null; now: number | null }) {
  const { user } = useAuth();
  const { isPro, subscription, openCheckout } = useProStatus();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const autoBought = useRef(false);
  const ownsLifetime = isPro && subscription?.planType === 'lifetime';

  const buy = async (source: string) => {
    if (loading || ownsLifetime || phase !== 'open') return;
    trackEvent('pricing_cta_clicked', { plan: 'lifetime', source });
    if (!user) {
      // pro-context resumes the checkout the moment the user is signed in.
      sessionStorage.setItem('pendingCheckoutPriceId', lifetimePlan.priceId);
      navigate('/login', { state: { from: { pathname: LIFETIME_DROP_PATH } } });
      return;
    }
    trackEvent('checkout_started', { plan: 'lifetime', priceId: lifetimePlan.priceId, source });
    setLoading(true);
    try {
      await openCheckout(lifetimePlan.priceId);
    } finally {
      setLoading(false);
    }
  };

  // Email buttons deep-link to ?buy=1 so one click from the inbox goes
  // straight into checkout once the page has the user.
  useEffect(() => {
    if (autoBought.current || phase !== 'open' || searchParams.get('buy') !== '1' || !user) return;
    autoBought.current = true;
    void buy('drop_page_email_link');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, phase, searchParams]);

  const button =
    'inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-bold transition-[transform,background-color] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto sm:min-w-[300px]';

  if (phase === null || now === null) {
    return <div aria-hidden="true" className="h-[58px] w-full max-w-[300px] rounded-xl bg-muted/40" />;
  }

  if (phase === 'closed') {
    return (
      <div>
        <Link to="/pricing" className={cn(button, 'bg-amber-500 text-black hover:bg-amber-400')}>
          See current pricing
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <p className="mt-3 text-sm text-muted-foreground">
          The drop closed on Friday 2 October. Pro is ${monthlyPlan.price} a month or ${yearlyPlan.price} a year.
        </p>
      </div>
    );
  }

  if (phase === 'before') {
    return (
      <div>
        <div className={cn(button, 'cursor-default border border-amber-500/40 bg-amber-500/10 text-foreground')}>
          <Timer className="h-4 w-4 text-amber-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-muted-foreground">Opens in</span>
          <span className="text-lg">
            <InlineClock target={dropTargetFor('before')} now={now} ariaLabel="Time until the drop opens" />
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {user ? (
            <>This page turns into the checkout at 9:30 AM New York. You will get an email at the same moment.</>
          ) : (
            <>
              <Link to="/signup" className="font-semibold text-foreground underline underline-offset-4 hover:text-amber-500">
                Sign up free
              </Link>{' '}
              now and you are one click away when the doors open.
            </>
          )}
        </p>
      </div>
    );
  }

  const lastDay = dropDaysLeft(now) <= 0;
  return (
    <div>
      {ownsLifetime ? (
        <div className={cn(button, 'cursor-default border border-amber-500/40 bg-amber-500/10 text-foreground')}>
          <Check className="h-4 w-4 text-amber-500" aria-hidden="true" />
          You already own Lifetime Pro
        </div>
      ) : (
        <button
          onClick={() => void buy('drop_page')}
          disabled={loading}
          className={cn(button, 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-70')}
        >
          {loading ? <SpinnerGap className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
          {loading ? 'Opening checkout' : `Get Lifetime Pro for $${LIFETIME_DROP_PRICE}`}
          {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      )}
      <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <Timer className="h-4 w-4 text-amber-500" aria-hidden="true" />
          {lastDay ? 'Closes tonight, 11:59 PM New York' : 'Closes in'}
        </span>
        {!lastDay && (
          <span className="text-base text-foreground">
            <InlineClock target={dropTargetFor('open')} now={now} ariaLabel="Time until the drop closes" />
          </span>
        )}
      </p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────
/**
 * Public page for the lifetime drop (Fri 25 Sep 9:30 AM New York to Fri 2 Oct
 * 11:59 PM New York 2026). The one link every email, banner and post points
 * at. Says exactly what is on offer from the first second; only the action
 * area changes with the phase: a live countdown before the open, the buy
 * button during the week, a pointer to pricing after.
 *
 * One continuous surface, same backdrop as the landing hero, hairlines instead
 * of card grids. The clock starts after mount so the prerendered HTML carries
 * the offer copy but no phase (build time would otherwise be baked in).
 */
export default function LifetimeDrop() {
  const [now, setNow] = useState<number | null>(null);
  const tracked = useRef<LifetimeDropPhase | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const phase: LifetimeDropPhase | null = now === null ? null : effectiveDropPhase(now);

  useEffect(() => {
    if (!phase || tracked.current === phase) return;
    tracked.current = phase;
    trackEvent('lifetime_drop_viewed', { phase });
  }, [phase]);

  const closed = phase === 'closed';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOMeta />
      <MarketingHeader />

      {/* Hero: the landing page's backdrop, centred copy, the real dashboard under it */}
      <section className="relative overflow-hidden bg-background noise-overlay">
        <GeometricBackdrop />
        <div className="container relative z-10 mx-auto max-w-5xl px-4 pb-10 pt-32 text-center sm:px-6 sm:pt-40">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            {closed ? 'Closed Friday 2 October' : 'Friday 25 September to Friday 2 October'}
          </p>
          <h1 className="font-display mx-auto mt-5 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl">
            {closed ? 'The Lifetime Pro drop has closed.' : (
              <>
                Lifetime Pro is back. <span className="text-amber-500">One week only.</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {closed
              ? 'Lifetime came off the pricing page again on 2 October. Pro is still there monthly or yearly, and the free journal stays free.'
              : `Pay once, keep every Pro feature for good, including everything added later. From 9:30 AM New York on Friday it is $${LIFETIME_DROP_PRICE} instead of $${lifetimePlan.price}. Then it goes again.`}
          </p>

          {!closed && (
            <p className="mt-8 flex items-baseline justify-center gap-3">
              <span className="font-display text-6xl font-bold leading-none tracking-tighter tabular-nums sm:text-7xl">${LIFETIME_DROP_PRICE}</span>
              <span className="text-xl text-muted-foreground line-through sm:text-2xl">${lifetimePlan.price}</span>
            </p>
          )}

          <div className="mx-auto mt-8 flex max-w-md flex-col items-center [&>div]:w-full [&>div]:text-center [&_p]:justify-center">
            <HeroAction phase={phase} now={now} />
          </div>
        </div>

        <div className="container relative z-10 mx-auto max-w-5xl px-4 pb-6 sm:px-6">
          <img
            src="/images/screenshots/trading-dashboard-screenshot-1280w.webp"
            srcSet="/images/screenshots/trading-dashboard-screenshot-640w.webp 640w, /images/screenshots/trading-dashboard-screenshot-1280w.webp 1280w"
            sizes="(min-width: 1024px) 1024px, 100vw"
            alt="The FreeTradeJournal dashboard: P&L, win rate, trade count and profit factor"
            width={1280}
            height={706}
            className="w-full rounded-2xl border border-border/60 shadow-2xl shadow-black/40"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </section>

      <main className="container mx-auto max-w-5xl px-4 sm:px-6">
        {/* The maths: one ledger row, no cards */}
        <section className="py-20 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">The maths</p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Same Pro. Paid once instead of forever.</h2>
              <p className="mt-4 text-muted-foreground">
                Lifetime pays for itself in {MONTHS_TO_BREAK_EVEN} months against monthly and in {YEARS_TO_BREAK_EVEN} years
                against yearly. After that, every month of Pro is free.
              </p>
            </div>
            <dl className="divide-y divide-border/60 border-y border-border/60 lg:col-span-7">
              {[
                { name: 'Monthly', price: `$${monthlyPlan.price}`, per: 'a month', line: `$${(monthlyPlan.price * 12).toFixed(2)} a year, every year`, hot: false },
                { name: 'Yearly', price: `$${yearlyPlan.price}`, per: 'a year', line: `$${(yearlyPlan.price * 2).toFixed(2)} over two years`, hot: false },
                { name: 'Lifetime', price: `$${LIFETIME_DROP_PRICE}`, per: 'once', line: 'Nothing more, ever', hot: true },
              ].map((plan) => (
                <div key={plan.name} className="grid grid-cols-[6rem_1fr] items-baseline gap-4 py-5 sm:grid-cols-[8rem_1fr_1fr]">
                  <dt className={cn('text-sm font-semibold', plan.hot && 'text-amber-600 dark:text-amber-400')}>{plan.name}</dt>
                  <dd className="flex items-baseline gap-1.5">
                    <span className="font-display text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.per}</span>
                  </dd>
                  <dd className={cn('col-start-2 text-sm sm:col-start-3 sm:text-right', plan.hot ? 'font-semibold' : 'text-muted-foreground')}>{plan.line}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* What is included: a spec list, not a card grid */}
        <section className="border-t border-border/60 py-20 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">What you get</p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Every Pro feature. Every future one too.</h2>
              <p className="mt-4 text-muted-foreground">
                The same Pro that monthly and yearly subscribers get, with nothing held back for a higher tier. There is no higher tier.
              </p>
            </div>
            <ul className="divide-y divide-border/60 border-y border-border/60 lg:col-span-7">
              {INCLUDES.map(({ icon: Icon, label, desc }) => (
                <li key={label} className="flex items-start gap-4 py-5">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">{label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* The window: one strip, two halves */}
        {!closed && (
          <section className="border-t border-border/60 py-20 sm:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">The window</p>
            <h2 className="font-display mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Open for one week. Not a day longer.</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              When it closes, the plan comes off the pricing page and the code stops working. The last two windows closed on the minute.
            </p>
            <div className="mt-10 grid border-y border-border/60 sm:grid-cols-2 sm:divide-x sm:divide-border/60">
              <div className="py-6 sm:pr-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Opens Friday 25 September</p>
                <CityRow times={DROP_CITY_TIMES.opens} />
              </div>
              <div className="border-t border-border/60 py-6 sm:border-t-0 sm:pl-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Closes Friday 2 October</p>
                <CityRow times={DROP_CITY_TIMES.closes} />
              </div>
            </div>
          </section>
        )}

        {/* Questions: plain, no accordion */}
        <section className="border-t border-border/60 py-20 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Questions</p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Straight answers before you pay once.</h2>
            </div>
            <dl className="divide-y divide-border/60 border-y border-border/60 lg:col-span-7">
              {FAQS.map((faq) => (
                <div key={faq.question} className="py-5">
                  <dt className="font-semibold">{faq.question}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {!closed && (
          <section className="border-t border-border/60 py-20 text-center sm:py-24">
            <h2 className="font-display mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Lifetime Pro, ${LIFETIME_DROP_PRICE}, one week. Then it goes again.
            </h2>
            <div className="mx-auto mt-8 flex max-w-md flex-col items-center [&>div]:w-full [&>div]:text-center [&_p]:justify-center">
              <HeroAction phase={phase} now={now} />
            </div>
          </section>
        )}
      </main>

      <Footer7 {...footerConfig} />
    </div>
  );
}
