import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { ArrowRight, SealCheck, Check, X } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { trackEvent } from '@/lib/analytics';
import { ThemeToggle } from '@/components/theme-toggle';
import { Footer7 } from '@/components/ui/footer-7';
import { footerConfig } from '@/components/ui/footer-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FREE_FEATURES, PRO_FEATURES, PRICING_PLANS } from '@/constants/pricing';
import { cn } from '@/lib/utils';
import { SEOMeta } from '@/components/seo-meta';
import { useThemePresets } from '@/contexts/theme-presets';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FREQUENCIES = ['monthly', 'yearly'] as const;
type Frequency = typeof FREQUENCIES[number];

// ─── Frequency Toggle Tab ────────────────────────────────────
function FrequencyTab({
  text,
  selected,
  onSelect,
  discount,
}: {
  text: string;
  selected: boolean;
  onSelect: (t: string) => void;
  discount?: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(text)}
      className={cn(
        'relative w-fit px-4 py-2 text-sm font-semibold capitalize text-foreground transition-colors',
        discount && 'flex items-center justify-center gap-2.5',
      )}
    >
      <span className="relative z-10">{text}</span>
      {selected && (
        <motion.span
          layoutId="pricing-tab"
          transition={{ type: 'spring', duration: 0.4 }}
          className="absolute inset-0 z-0 rounded-full bg-background shadow-sm"
        />
      )}
      {discount && (
        <Badge
          className={cn(
            'relative z-10 whitespace-nowrap text-xs shadow-none border-0',
            selected
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15'
              : 'bg-muted text-muted-foreground hover:bg-muted',
          )}
        >
          Save 36%
        </Badge>
      )}
    </button>
  );
}

// ─── Pricing Card ────────────────────────────────────────────
interface CardProps {
  name: string;
  price: number | string;
  subtitle: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  popular?: boolean;
  isCurrentPlan?: boolean;
  onCtaClick?: () => void;
  disabled?: boolean;
}

function PricingCard({
  name,
  price,
  subtitle,
  description,
  features,
  cta,
  highlighted,
  popular,
  isCurrentPlan,
  onCtaClick,
  disabled,
}: CardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-6 overflow-hidden rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md',
        'bg-background text-foreground',
        popular && 'outline outline-2 outline-amber-500 lg:scale-[1.06] lg:shadow-xl lg:shadow-amber-500/5 lg:z-10',
        highlighted && 'border-amber-500/30 bg-amber-500/[0.03] dark:bg-amber-500/[0.06]',
      )}
    >
      {/* Header */}
      <h2 className="relative flex items-center gap-3 text-xl font-medium">
        {name}
        {popular && (
          <Badge className="bg-amber-600 px-1.5 py-0 text-white text-[11px] hover:bg-amber-600 border-0">
            Most Popular
          </Badge>
        )}
      </h2>

      {/* Price */}
      <div className="relative h-16">
        {typeof price === 'number' ? (
          <>
            <NumberFlow
              format={{ style: 'currency', currency: 'USD' }}
              value={price}
              className="text-4xl font-medium"
            />
            <p className="-mt-1 text-xs font-medium text-muted-foreground">
              {subtitle}
            </p>
          </>
        ) : (
          <>
            <span className="text-4xl font-medium">{price}</span>
            <p className="-mt-1 text-xs font-medium text-muted-foreground">
              {subtitle}
            </p>
          </>
        )}
      </div>

      {/* Features */}
      <div className="relative flex-1 space-y-2">
        <p className="text-sm font-medium text-foreground/80">
          {description}
        </p>
        <ul className="space-y-2">
          {features.map((feature) => (
            <li
              key={feature}
              className={cn(
                'flex items-center gap-2 text-sm font-medium',
                'text-foreground/60',
              )}
            >
              <SealCheck strokeWidth={1.5} size={16} className="flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="relative">
        {isCurrentPlan ? (
          <Badge
            variant="outline"
            className="w-full justify-center py-2.5 text-sm font-medium border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
          >
            Current Plan
          </Badge>
        ) : (
          <Button
            className={cn(
              'group w-full h-11 rounded-lg font-semibold gap-0 overflow-hidden',
              popular && 'bg-amber-500 text-white hover:bg-amber-600',
            )}
            variant={popular ? 'default' : 'outline'}
            onClick={onCtaClick}
            disabled={disabled}
          >
            {cta}
            <span className="inline-flex w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:w-5 group-hover:pl-2 group-hover:opacity-100">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Feature Comparison Row ──────────────────────────────────
function ComparisonRow({ feature, free, pro }: { feature: string; free: boolean; pro: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <span className="text-sm text-foreground/80">{feature}</span>
      <div className="flex items-center gap-8 sm:gap-16">
        <span className="w-8 flex justify-center">
          {free ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground/30" />
          )}
        </span>
        <span className="w-8 flex justify-center">
          {pro ? (
            <Check className="h-4 w-4 text-amber-500" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground/30" />
          )}
        </span>
      </div>
    </div>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Is the free plan really free forever?',
    a: 'Yes. No credit card required. The core journal — unlimited trades, analytics, and up to 100 journal entries — is free for life. Upgrade to Pro for unlimited journal entries.',
  },
  {
    q: 'How does the 14-day free trial work?',
    a: 'Start a monthly or yearly Pro subscription and get 14 days free — no charge until the trial ends. Cancel anytime before then and you will not be billed.',
  },
  {
    q: 'Can I cancel my Pro subscription anytime?',
    a: 'Yes, cancel from Settings → Subscription at any time. You keep Pro access until the end of your billing period.',
  },
  {
    q: 'What happens to my data if I downgrade?',
    a: 'Nothing is deleted. Your trades, journal entries, and goals are all still there. You just lose access to Pro features.',
  },
  {
    q: 'Is cloud sync included in the free plan?',
    a: 'Free users store data locally in the browser. Pro includes cloud sync across devices so your journal is available everywhere.',
  },
  {
    q: 'What AI features does Pro include?',
    a: 'Coach FTJ, AI Trade Analysis, AI Trade Review, AI Strategy Tagger, AI Risk Alerts, and AI Goal Coach — all powered by GPT-4.',
  },
  {
    q: 'Is the lifetime deal really one payment?',
    a: 'Yes. Pay once, own it forever. All future Pro features included at no extra cost.',
  },
];

// ─── Main Pricing Page ───────────────────────────────────────
export default function Pricing() {
  const { user } = useAuth();
  const { isPro, subscription, openCheckout } = useProStatus();
  const navigate = useNavigate();
  const { themeColors, alpha } = useThemePresets();
  const [frequency, setFrequency] = useState<Frequency>('yearly');

  const handleUpgrade = (priceId: string, plan: string) => {
    trackEvent('pricing_cta_clicked', { plan });
    if (!user) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }
    trackEvent('checkout_started', { plan, priceId });
    openCheckout(priceId);
  };

  const currentPlan = subscription?.planType || null;

  // The active Pro plan based on toggle
  const activePlan = PRICING_PLANS.find((p) => p.interval === frequency)!;
  const lifetimePlan = PRICING_PLANS.find((p) => p.interval === 'lifetime')!;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOMeta />
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <img src="/favicon.svg" alt="FTJ" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex-shrink-0" />
            <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              FreeTradeJournal
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {!user && (
              <Link
                to="/login"
                className="text-foreground/80 hover:text-foreground transition-colors font-medium px-3 py-2 rounded-md text-sm"
              >
                Sign In
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero + Toggle */}
      <section className="flex flex-col items-center gap-8 py-14 sm:py-20 px-4">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">
            <span className="flex -space-x-2">
              {['JM','AR','KT'].map((i) => (
                <span key={i} className="w-6 h-6 rounded-full bg-amber-500 ring-2 ring-background flex items-center justify-center text-[8px] font-bold text-black">{i}</span>
              ))}
            </span>
            3,000+ traders already journaling
          </div>
          <h1 className="font-display text-4xl font-bold md:text-5xl tracking-tight">
            Free Trading Journal, <span className="text-amber-500">Pro When You Need It</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            The core journal is free forever. Upgrade to Pro for AI coaching, trade analysis, cloud sync, and tools that help you find your edge faster.
          </p>
        </div>

        {/* Monthly / Yearly Toggle */}
        <div className="flex w-fit rounded-full bg-muted/60 p-1">
          {FREQUENCIES.map((freq) => (
            <FrequencyTab
              key={freq}
              text={freq}
              selected={frequency === freq}
              onSelect={(t) => setFrequency(t as Frequency)}
              discount={freq === 'yearly'}
            />
          ))}
        </div>
      </section>

      {/* Cards — 3 columns */}
      <section className="px-4 pb-16 sm:pb-24">
        <div className="grid w-full max-w-5xl mx-auto gap-6 lg:grid-cols-3">
          {/* Free */}
          <PricingCard
            name="Free"
            price="$0"
            subtitle="Free forever"
            description="Log, review, and improve"
            features={FREE_FEATURES}
            cta={user ? 'Current Plan' : 'Get Started Free'}
            isCurrentPlan={!!user && !isPro}
            onCtaClick={() => {
              if (!user) {
                trackEvent('pricing_cta_clicked', { plan: 'free' });
                navigate('/signup');
              }
            }}
            disabled={!!user && !isPro}
          />

          {/* Pro — toggles between monthly/yearly */}
          <PricingCard
            name={`Pro ${activePlan.name}`}
            price={activePlan.price}
            subtitle={frequency === 'monthly' ? 'Per month · 14-day free trial' : 'Per year · Save 36% · 14-day free trial'}
            description="For traders who want an edge"
            features={activePlan.features}
            cta="Start free trial"
            popular
            isCurrentPlan={isPro && currentPlan === activePlan.interval}
            onCtaClick={() => handleUpgrade(activePlan.priceId, activePlan.interval)}
            disabled={isPro && currentPlan === 'lifetime'}
          />

          {/* Lifetime — solid dark, no grid overlay */}
          <PricingCard
            name="Pro Lifetime"
            price={lifetimePlan.price}
            subtitle="One-time payment, yours forever"
            description="Never pay again"
            features={lifetimePlan.features}
            cta="Get Lifetime Access"
            highlighted
            isCurrentPlan={isPro && currentPlan === 'lifetime'}
            onCtaClick={() => handleUpgrade(lifetimePlan.priceId, 'lifetime')}
          />
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="px-4 pb-16 sm:pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Free vs <span className="text-amber-500">Pro</span></h2>
            <p className="text-muted-foreground text-base">Everything in Free, plus powerful tools to level up</p>
          </div>

          <div className="rounded-2xl border bg-background p-6 sm:p-8">
            {/* Column Headers */}
            <div className="flex items-center justify-between pb-4 mb-2 border-b">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Features</span>
              <div className="flex items-center gap-8 sm:gap-16">
                <span className="w-8 text-center text-sm font-semibold text-muted-foreground">Free</span>
                <span className="w-8 text-center text-sm font-semibold text-amber-600 dark:text-amber-400">Pro</span>
              </div>
            </div>

            {/* Free features — included in both */}
            <div className="space-y-0 divide-y divide-border/50">
              {FREE_FEATURES.map((f) => (
                <ComparisonRow key={f} feature={f} free pro />
              ))}
            </div>

            {/* Divider */}
            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-amber-500/20" />
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs hover:bg-amber-500/10">
                Pro only
              </Badge>
              <div className="flex-1 h-px bg-amber-500/20" />
            </div>

            {/* Pro-only features */}
            <div className="space-y-0 divide-y divide-border/50">
              {PRO_FEATURES.map((f) => (
                <ComparisonRow key={f} feature={f} free={false} pro />
              ))}
            </div>

            {/* CTA */}
            {!isPro && (
              <div className="mt-8 text-center space-y-2">
                <Button
                  className="bg-amber-500 text-white hover:bg-amber-600 font-semibold px-8"
                  onClick={() => {
                    trackEvent('pricing_cta_clicked', { plan: user ? activePlan.interval : 'free', source: 'comparison_table' });
                    user ? openCheckout(activePlan.priceId) : navigate('/signup');
                  }}
                >
                  {user ? 'Start free trial' : 'Get Started Free'}
                </Button>
                <p className="text-xs text-muted-foreground">14-day free trial · Cancel anytime · No hidden fees</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="px-4 pb-16 sm:pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">How we <span className="text-amber-500">compare</span></h2>
            <p className="text-muted-foreground text-base">Same features, fraction of the price</p>
          </div>

          <div className="rounded-2xl border bg-background overflow-hidden">
            {/* FTJ Row */}
            <div className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4 bg-amber-500/[0.06] border-b-2 border-amber-500/20">
              <img src="/favicon.svg" alt="FTJ" className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm sm:text-base truncate">FreeTradeJournal</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                    You
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-amber-500/10 max-w-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-amber-500"
                    initial={{width: 0}}
                    whileInView={{width: '17%'}}
                    viewport={{once: true}}
                    transition={{duration: 0.8, ease: 'easeOut'}}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl sm:text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">$12.99</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
            </div>

            {/* Competitor Rows */}
            {[
              {name: 'Tradervue', logo: '/logos/tradervue.png', price: '$49', unit: '/mo', bar: '100%', multiplier: '3.8x', delay: 0.1},
              {name: 'TraderSync', logo: '/logos/tradersync.png', price: '$29.95', unit: '/mo', bar: '61%', multiplier: '2.3x', delay: 0.2},
              {name: 'TradeZella', logo: '/logos/tradezella.png', price: '$29', unit: '/mo', bar: '59%', multiplier: '2.2x', delay: 0.3},
              {name: 'Edgewonk', logo: '/logos/edgewonk.png', price: '$169', unit: '/yr', bar: '29%', multiplier: '1.7x', delay: 0.4},
            ].map((comp) => (
              <div key={comp.name} className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3.5 border-b border-border/50 last:border-0">
                <img src={comp.logo} alt={comp.name} className="h-7 w-7 rounded-md shrink-0 bg-muted/50 p-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground/80 truncate">{comp.name}</span>
                    <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                      {comp.multiplier}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted/60 max-w-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-muted-foreground/20"
                      initial={{width: 0}}
                      whileInView={{width: comp.bar}}
                      viewport={{once: true}}
                      transition={{duration: 0.8, delay: comp.delay, ease: 'easeOut'}}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-semibold tabular-nums text-foreground/60">{comp.price}</span>
                  <span className="text-xs text-muted-foreground">{comp.unit}</span>
                </div>
              </div>
            ))}

            {/* Savings Footer */}
            <div className="px-5 sm:px-6 py-4 bg-amber-500/[0.04] border-t border-amber-500/10">
              <p className="text-sm text-center text-foreground/70">
                Save up to <span className="font-bold text-amber-600 dark:text-amber-400">$488/year</span> compared to Tradervue — with AI features they don't even offer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-16 sm:pb-24">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-2">Common <span className="text-amber-500">questions</span></h2>
            <p className="text-muted-foreground text-base">Everything you need to know before upgrading</p>
          </motion.div>

          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
                viewport={{ once: true, margin: '-30px' }}
              >
                <AccordionItem value={`faq-${index}`} className="border-b border-border py-1">
                  <AccordionTrigger className="text-left hover:no-underline hover:text-amber-500 transition-colors duration-200 py-4">
                    <span className="text-base font-medium pr-4">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-4 pr-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      <div className="mt-auto">
        <Footer7 {...footerConfig} />
      </div>
    </div>
  );
}
