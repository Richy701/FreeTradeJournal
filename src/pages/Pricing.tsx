import * as React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NumberFlow from '@number-flow/react';
import { ArrowRight, Check } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { trackEvent } from '@/lib/analytics';
import { MarketingHeader } from '@/components/marketing-header';
import { Footer7 } from '@/components/blocks/footer-7';
import { footerConfig } from '@/components/blocks/footer-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Item, ItemActions, ItemGroup, ItemSeparator, ItemTitle } from '@/components/ui/item';
import { Spinner } from '@/components/ui/spinner';
import { ANALYSIS_UPGRADE_SOURCE, FREE_ANALYTICS_WINDOW_DAYS, FREE_JOURNAL_ENTRY_LIMIT, PLAN_CARD_FREE_FEATURES, PLAN_LIMIT_ROWS, PLAN_PRO_ONLY_ROWS, PRICING_PLANS, isLifetimeOnSale, isBirthdayLifetimeWindow, lifetimeSaleEndsAt, currentLifetimePrice } from '@/constants/pricing';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SEOMeta } from '@/components/seo-meta';
import { TestimonialsSection } from '@/components/blocks/testimonials-section';
import { redirectToPortal } from '@/lib/stripe';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FREQUENCIES = ['monthly', 'yearly'] as const;
type Frequency = typeof FREQUENCIES[number];

// ─── Lifetime Retirement Countdown ───────────────────────────
function LifetimeCountdown() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = lifetimeSaleEndsAt(now) - now;
  if (remaining <= 0 || !isLifetimeOnSale(now)) return null;

  const segments = [
    { value: Math.floor(remaining / 86_400_000), unit: 'd', pad: false },
    { value: Math.floor(remaining / 3_600_000) % 24, unit: 'h', pad: true },
    { value: Math.floor(remaining / 60_000) % 60, unit: 'm', pad: true },
    { value: Math.floor(remaining / 1_000) % 60, unit: 's', pad: true },
  ];

  return (
    <div
      role="timer"
      aria-label="Time left before the lifetime plan goes off sale"
      className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2"
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
        Ends in
      </span>
      <span className="flex items-baseline gap-1.5 text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400">
        {segments.map(({ value, unit, pad }) => (
          <span key={unit} className="flex items-baseline">
            <NumberFlow value={value} format={pad ? { minimumIntegerDigits: 2 } : undefined} />
            <span className="ml-px text-[10px] font-medium opacity-70">{unit}</span>
          </span>
        ))}
      </span>
    </div>
  );
}

// ─── Pricing Card ────────────────────────────────────────────
interface CardProps {
  name: string;
  price: number | string;
  // List price shown struck through next to a discounted `price`
  originalPrice?: number;
  subtitle: string;
  description: string;
  // Real limits shown as label / value rows above the feature list
  limits?: { label: string; value: string }[];
  features: string[];
  cta: string;
  banner?: React.ReactNode;
  highlighted?: boolean;
  popular?: boolean;
  isCurrentPlan?: boolean;
  onCtaClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function PricingCard({
  name,
  price,
  originalPrice,
  subtitle,
  description,
  limits,
  features,
  cta,
  banner,
  highlighted,
  popular,
  isCurrentPlan,
  onCtaClick,
  disabled,
  loading,
}: CardProps) {
  return (
    <Card className={cn('flex flex-col', (popular || highlighted) && 'border-amber-500/60')}>
      <CardHeader className="space-y-4">
        <CardTitle className="flex min-h-8 items-center gap-3 text-xl font-medium">
          {name}
          {popular && (
            <Badge className="border-0 bg-amber-500 px-1.5 py-0 text-[11px] text-amber-950 hover:bg-amber-500">
              Most Popular
            </Badge>
          )}
        </CardTitle>
        <div>
          {/* Fixed height: NumberFlow renders taller than plain text, which pushed the Pro price below Free's. */}
          <div className="flex h-12 items-center gap-2">
            {typeof price === 'number' && originalPrice !== undefined && (
              <span className="text-xl font-medium text-muted-foreground line-through">${originalPrice}</span>
            )}
            {typeof price === 'number' ? (
              <NumberFlow format={{ style: 'currency', currency: 'USD' }} value={price} className="text-4xl font-medium" />
            ) : (
              <span className="text-4xl font-medium">{price}</span>
            )}
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{subtitle}</p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {banner}
        {limits && (
          <ItemGroup className="rounded-lg border border-border/60">
            {limits.map((row, i) => (
              <React.Fragment key={row.label}>
                {i > 0 && <ItemSeparator className="bg-border/60" />}
                <Item size="sm" className="rounded-none">
                  <ItemTitle className="font-normal text-muted-foreground">{row.label}</ItemTitle>
                  <ItemActions className="ml-auto shrink-0 text-sm font-medium text-foreground">{row.value}</ItemActions>
                </Item>
              </React.Fragment>
            ))}
          </ItemGroup>
        )}
        <p className="text-sm font-medium text-foreground/80">{description}</p>
        <ul className="space-y-2.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrentPlan ? (
          <Button variant="outline" className="h-11 w-full" disabled>
            Current Plan
          </Button>
        ) : (
          <Button
            className={cn('h-11 w-full font-semibold', popular && 'bg-amber-500 text-amber-950 hover:bg-amber-600')}
            variant={popular ? 'default' : 'outline'}
            onClick={onCtaClick}
            disabled={disabled || loading}
          >
            {loading && <Spinner className="mr-2" />}
            {cta}
            {popular && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ─── Feature Comparison Row ──────────────────────────────────


// ─── Competitor comparison ───────────────────────────────────
// Cheapest PAID plan for every journal, so the comparison is like for like.
// TradeZella, TraderSync and Edgewonk figures match the verified tables on
// their /…-alternative pages (July 2026); Tradervue from tradervue.com/site/pricing
// (Sep 2026: Silver $29.95/mo, no annual price published, so 12 x monthly).
// Re-verify before editing, and keep the alternative pages in step.
const COMPETITORS: { name: string; logo: string; freePlan: string; cheapest: string; perYear: string; own?: boolean }[] = [
  { name: 'FreeTradeJournal', logo: '/favicon.svg', freePlan: 'Yes, free forever', cheapest: '$12.99/month', perYear: '$99.99', own: true },
  { name: 'Tradervue', logo: '/logos/tradervue.png', freePlan: 'Yes', cheapest: '$29.95/month (Silver)', perYear: '$359.40' },
  { name: 'TradeZella', logo: '/logos/tradezella.png', freePlan: 'No', cheapest: '$35/month (Essential)', perYear: '$315' },
  { name: 'TraderSync', logo: '/logos/tradersync.png', freePlan: 'No', cheapest: '$29.95/month (Pro)', perYear: '$312.60' },
  { name: 'Edgewonk', logo: '/logos/edgewonk.png', freePlan: 'No', cheapest: '$197 paid upfront', perYear: '$197' },
];

// ─── FAQ ─────────────────────────────────────────────────────
// Answers restate the app's real limits and the Terms (billing, cancellation,
// refunds) — change those first, then these.
const FAQS: { q: string; a: string; lifetime?: boolean }[] = [
  {
    q: 'What do I get on the free plan, and for how long?',
    a: `The free plan does not expire and needs no card. You can log unlimited trades, import from CSV or Excel, and use goals, risk rules and the calendar heatmap. The limits are dashboard analytics over the last ${FREE_ANALYTICS_WINDOW_DAYS} days, up to ${FREE_JOURNAL_ENTRY_LIMIT} journal entries, 2 trading accounts, 1 prop firm account and a monthly allowance of AI queries.`,
  },
  {
    q: 'When am I charged if I upgrade?',
    a: 'Straight away. There is no trial period on Pro, because the free plan is the trial. Monthly and yearly plans are billed at the start of each billing period and renew automatically until you cancel.',
  },
  {
    q: 'Can I cancel, and can I get a refund?',
    a: 'Cancel any time from Settings → Subscription and you keep Pro until the end of the period you paid for. Monthly and yearly subscriptions may be eligible for a refund within 7 days of the first charge if you have not used Pro features extensively. Email support@freetradejournal.com to ask.',
  },
  {
    q: 'What happens to my trades and journal if I stop paying?',
    a: `Nothing is deleted. Your trades, journal entries and goals all stay, and you can still export everything. Dashboard analytics go back to the last ${FREE_ANALYTICS_WINDOW_DAYS} days, and if you have more than ${FREE_JOURNAL_ENTRY_LIMIT} journal entries you keep and can edit them, but cannot add new ones until you are under the limit or back on Pro.`,
  },
  {
    q: 'Can I switch between monthly and yearly?',
    a: 'Yes. If you already subscribe, the button on the Pro card opens your billing portal, where you can change the billing interval without starting a second subscription.',
  },
  {
    q: 'Can I import trades from my broker or prop firm?',
    a: 'Yes, on both plans. Import a CSV or Excel export from any broker, including MetaTrader 4 and 5, cTrader, NinjaTrader and DAS Trader. If a column layout is not recognised, you map it once and the mapping is remembered. You can also import trades from a screenshot.',
  },
  {
    q: 'Is my trading data private?',
    a: 'Your journal is stored on your own device by default. It only goes to our servers if you turn on cloud sync, which is a Pro feature, or use an AI feature. AI requests are processed through OpenAI, are not used to train models, and are not stored permanently on our servers.',
  },
  {
    q: 'Is the lifetime deal really one payment?',
    a: 'Yes. Pay once, own it forever. All future Pro features included at no extra cost. The lifetime plan retires on August 7, 2026 — existing owners keep it for good.',
    lifetime: true,
  },
];

// ─── Main Pricing Page ───────────────────────────────────────
export default function Pricing() {
  const { user } = useAuth();
  const { isPro, subscription, openCheckout } = useProStatus();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const offerSource = searchParams.get('source') === ANALYSIS_UPGRADE_SOURCE ? ANALYSIS_UPGRADE_SOURCE : undefined;
  const [frequency, setFrequency] = useState<Frequency>(() => searchParams.get('plan') === 'monthly' ? 'monthly' : 'yearly');
  useEffect(() => {
    if (offerSource) setFrequency(searchParams.get('plan') === 'monthly' ? 'monthly' : 'yearly');
  }, [searchParams, offerSource]);
  // priceId currently being sent to Stripe — the checkout Cloud Function can
  // cold-start for several seconds, so CTAs must show progress and block
  // double-clicks (each click would create another checkout session).
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Dedicated funnel step so pricing → cta → checkout_started → checkout_completed
  // can be built as one funnel in PostHog
  useEffect(() => {
    trackEvent('pricing_viewed', { logged_in: !!user, is_pro: isPro, ...(offerSource ? { offer_source: offerSource } : {}) });
    // Stripe sends cancelled checkouts back here — say so instead of
    // silently landing on the page the user just left.
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'cancelled') {
      trackEvent('checkout_cancelled');
      toast.info('Checkout cancelled — you have not been charged.');
      navigate('/pricing', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = async (priceId: string, plan: string, source?: string) => {
    if (checkoutLoading) return;
    trackEvent('pricing_cta_clicked', { plan, ...(source ? { source } : {}), ...(offerSource ? { offer_source: offerSource } : {}) });
    if (!user) {
      sessionStorage.setItem('pendingCheckoutPriceId', priceId);
      navigate('/signup');
      return;
    }
    trackEvent('checkout_started', { plan, priceId, ...(offerSource ? { offer_source: offerSource } : {}) });
    setCheckoutLoading(priceId);
    try {
      // openCheckout toasts on failure and resolves either way; on success the
      // Stripe redirect takes over before the reset below matters.
      await openCheckout(priceId);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const currentPlan = subscription?.planType || null;

  // Subscribers switch intervals through the Stripe portal — a fresh checkout
  // session would stack a second subscription on the same customer (the
  // checkout Cloud Function rejects it too; this path is just better UX).
  const hasActiveSubscription = isPro && (currentPlan === 'monthly' || currentPlan === 'yearly');
  const handleSwitchPlan = async () => {
    if (portalLoading) return;
    trackEvent('pricing_cta_clicked', { plan: activePlan.interval, source: 'plan_switch_portal' });
    setPortalLoading(true);
    try {
      await redirectToPortal();
    } catch {
      toast.error('Could not open the billing portal — try again from Settings → Subscription.');
    } finally {
      setPortalLoading(false);
    }
  };

  // The active Pro plan based on toggle
  const activePlan = PRICING_PLANS.find((p) => p.interval === frequency)!;
  const lifetimePlan = PRICING_PLANS.find((p) => p.interval === 'lifetime')!;

  // Lifetime is retired after this date — the card disappears here and the
  // checkout Cloud Function rejects the price, so stale tabs can't buy it.
  // Existing lifetime owners keep their plan (their card renders as current).
  const lifetimeAvailable = isLifetimeOnSale() || currentPlan === 'lifetime';
  const birthdayWeek = isBirthdayLifetimeWindow();

  return (
    <div className="min-h-screen flex flex-col bg-background pt-16 sm:pt-20">
      <SEOMeta />
      <MarketingHeader />

      {/* Every section below shares one width so cards, tables and the FAQ
          start and end on the same edges. */}
      <main className={cn('mx-auto w-full px-4 sm:px-6', lifetimeAvailable ? 'max-w-5xl' : 'max-w-4xl')}>
        {/* Hero + billing toggle */}
        <section className="flex flex-col items-center gap-8 py-14 text-center sm:py-20">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              3,000+ traders already journaling
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
              Free Trading Journal, <span className="text-amber-500">Pro When You Need It</span>
            </h1>
            <p className="mx-auto max-w-lg text-muted-foreground">
              The core journal is free forever. Upgrade to Pro for AI coaching, trade analysis, cloud sync, and tools that help you find your edge faster.
            </p>
          </div>

          <Tabs value={frequency} onValueChange={(value) => setFrequency(value as Frequency)}>
            <TabsList>
              {FREQUENCIES.map((freq) => (
                <TabsTrigger key={freq} value={freq} className="gap-2 px-4 capitalize">
                  {freq}
                  {freq === 'yearly' && (
                    <Badge className="border-0 bg-amber-500/15 px-1.5 py-0 text-[11px] text-amber-700 shadow-none hover:bg-amber-500/15 dark:text-amber-400">
                      Save 36%
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </section>

        {/* Plans */}
        <section className={cn('grid gap-6 pb-20', lifetimeAvailable ? 'lg:grid-cols-3' : 'md:grid-cols-2')}>
          {/* Free */}
          <PricingCard
            name="Free"
            price="$0"
            subtitle="Free forever"
            description="Log, review, and improve"
            limits={PLAN_LIMIT_ROWS.map((row) => ({ label: row.feature, value: row.free }))}
            features={PLAN_CARD_FREE_FEATURES}
            cta={!user ? 'Get Started Free' : isPro ? 'Included with Pro' : 'Current Plan'}
            isCurrentPlan={!!user && !isPro}
            onCtaClick={() => {
              if (!user) {
                trackEvent('pricing_cta_clicked', { plan: 'free' });
                navigate('/signup');
              }
            }}
            disabled={!!user}
          />

          {/* Pro — toggles between monthly/yearly */}
          <PricingCard
            name={`Pro ${activePlan.name}`}
            price={activePlan.price}
            subtitle={frequency === 'monthly' ? 'Per month · Cancel anytime' : 'Per year · Save 36%'}
            description="Everything in Free, plus"
            limits={PLAN_LIMIT_ROWS.map((row) => ({ label: row.feature, value: row.pro }))}
            features={PLAN_PRO_ONLY_ROWS}
            cta={
              !user
                ? 'Get Pro'
                : hasActiveSubscription
                  ? 'Switch plan'
                  : 'Get Pro'
            }
            popular
            isCurrentPlan={isPro && currentPlan === activePlan.interval}
            onCtaClick={() =>
              hasActiveSubscription
                ? handleSwitchPlan()
                : handleUpgrade(activePlan.priceId, activePlan.interval)
            }
            disabled={isPro && currentPlan === 'lifetime'}
            loading={checkoutLoading === activePlan.priceId || portalLoading}
          />

          {/* Lifetime — retired; only renders while on sale or for existing owners */}
          {lifetimeAvailable && (
            <PricingCard
              name="Pro Lifetime"
              price={currentLifetimePrice()}
              originalPrice={currentLifetimePrice() < lifetimePlan.price ? lifetimePlan.price : undefined}
              subtitle={birthdayWeek ? 'One-time birthday price · yours forever' : 'One-time founding price · yours forever'}
              description="Never pay again"
              features={lifetimePlan.features}
              cta="Get Lifetime Access"
              banner={<LifetimeCountdown />}
              highlighted
              isCurrentPlan={isPro && currentPlan === 'lifetime'}
              onCtaClick={() => handleUpgrade(lifetimePlan.priceId, 'lifetime')}
              loading={checkoutLoading === lifetimePlan.priceId}
            />
          )}
        </section>

        {/* Competitor comparison */}
        <section className="pb-20">
          <h2 className="text-2xl font-bold">How we <span className="text-amber-500">compare</span></h2>
          <p className="mt-2 text-muted-foreground">The cheapest paid plan from each journal, side by side</p>

          {/* Four columns do not fit a phone: the table is desktop-only and phones get one card per journal. */}
          <Card className="mt-8 hidden overflow-hidden md:block">
          <Table className="[&_td:first-child]:pl-6 [&_th:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:last-child]:pr-6">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Journal</TableHead>
                <TableHead>Free plan</TableHead>
                <TableHead>Cheapest paid plan</TableHead>
                <TableHead className="text-right">Cost per year</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPETITORS.map((row) => (
                <TableRow key={row.name}>
                  <TableCell>
                    <span className={cn('flex items-center gap-3', row.own ? 'font-semibold' : 'text-foreground/80')}>
                      <img src={row.logo} alt="" className={cn('h-7 w-7 shrink-0 rounded-md', !row.own && 'bg-muted/50 p-0.5')} />
                      {row.name}
                    </span>
                  </TableCell>
                  <TableCell className={row.own ? 'font-medium text-foreground' : 'text-muted-foreground'}>{row.freePlan}</TableCell>
                  <TableCell className={row.own ? 'font-medium text-foreground' : 'text-muted-foreground'}>{row.cheapest}</TableCell>
                  <TableCell className={cn('text-right tabular-nums', row.own ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-foreground/70')}>
                    {row.perYear}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="border-t px-6 py-3 text-xs text-muted-foreground">
            Cheapest paid plan for each journal. Prices checked July to September 2026.
          </p>
          </Card>

          <div className="mt-8 grid gap-4 md:hidden">
            {COMPETITORS.map((journal) => (
              <Card key={journal.name} className={cn(journal.own && 'border-amber-500/60')}>
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  <img src={journal.logo} alt="" className={cn('h-8 w-8 rounded-md', !journal.own && 'bg-muted/50 p-0.5')} />
                  <CardTitle className={cn('text-base', journal.own && 'text-amber-600 dark:text-amber-400')}>{journal.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ItemGroup className="rounded-lg border border-border/60">
                    {([['Free plan', journal.freePlan], ['Cheapest paid plan', journal.cheapest], ['Cost per year', journal.perYear]] as const).map(([label, value], i) => (
                      <React.Fragment key={label}>
                        {i > 0 && <ItemSeparator className="bg-border/60" />}
                        <Item size="sm" className="rounded-none">
                          <ItemTitle className="font-normal text-muted-foreground">{label}</ItemTitle>
                          <ItemActions className="ml-auto shrink-0 text-right text-sm font-medium text-foreground">{value}</ItemActions>
                        </Item>
                      </React.Fragment>
                    ))}
                  </ItemGroup>
                </CardContent>
              </Card>
            ))}
            <p className="text-xs text-muted-foreground">
              Cheapest paid plan for each journal. Prices checked July to September 2026.
            </p>
          </div>
        </section>
      </main>

      {/* Real approved testimonials from Firestore — renders nothing until some exist */}
      <TestimonialsSection />

      {/* FAQ */}
      <section className={cn('mx-auto w-full px-4 pb-16 sm:px-6 sm:pb-24', lifetimeAvailable ? 'max-w-5xl' : 'max-w-4xl')}>
        <h2 className="text-2xl font-bold">Common <span className="text-amber-500">questions</span></h2>
        <p className="mt-2 text-muted-foreground">Billing, limits, your data and imports</p>

        <Accordion type="single" collapsible className="mt-6 w-full">
          {FAQS.filter((faq) => !faq.lifetime || lifetimeAvailable).map((faq, index) => (
            <AccordionItem key={faq.q} value={`faq-${index}`}>
              <AccordionTrigger className="py-4 text-left text-base font-medium hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <div className="mt-auto">
        <Footer7 {...footerConfig} />
      </div>
    </div>
  );
}
