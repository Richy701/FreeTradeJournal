import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { ArrowRight, BadgeCheck, Check, ChevronDown, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useProStatus } from '@/contexts/pro-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { Footer7 } from '@/components/ui/footer-7';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FREE_FEATURES, PRO_FEATURES, PRICING_PLANS } from '@/constants/pricing';
import { cn } from '@/lib/utils';

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
          Save 30%
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
      <div className="relative h-12">
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
              <BadgeCheck strokeWidth={1.5} size={16} className="flex-shrink-0" />
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
    a: 'Yes. No credit card, no trial period, no hidden limits. The core journal — unlimited trades, analytics, and journaling — is free for life.',
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
    a: 'AI Trading Coach, AI Trade Analysis, AI Trade Review, AI Strategy Tagger, AI Risk Alerts, and AI Goal Coach — all powered by GPT-4.',
  },
  {
    q: 'Is the lifetime deal really one payment?',
    a: 'Yes. Pay once, own it forever. All future Pro features included at no extra cost.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <p className="text-sm text-muted-foreground pb-4 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

// ─── Main Pricing Page ───────────────────────────────────────
export default function Pricing() {
  const { user } = useAuth();
  const { isPro, subscription, openCheckout } = useProStatus();
  const navigate = useNavigate();
  const [frequency, setFrequency] = useState<Frequency>('yearly');

  const handleUpgrade = (priceId: string) => {
    if (!user) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }
    openCheckout(priceId);
  };

  const currentPlan = subscription?.planType || null;

  // The active Pro plan based on toggle
  const activePlan = PRICING_PLANS.find((p) => p.interval === frequency)!;
  const lifetimePlan = PRICING_PLANS.find((p) => p.interval === 'lifetime')!;

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
                className="text-foreground/70 hover:text-foreground transition-colors font-medium px-3 py-2 rounded-md text-sm"
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
            Trade smarter, <span className="text-amber-500">not harder</span>
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
            onCtaClick={() => !user && navigate('/signup')}
            disabled={!!user && !isPro}
          />

          {/* Pro — toggles between monthly/yearly */}
          <PricingCard
            name={`Pro ${activePlan.name}`}
            price={activePlan.price}
            subtitle={frequency === 'monthly' ? 'Per month' : 'Per year'}
            description="For traders who want an edge"
            features={activePlan.features}
            cta="Upgrade to Pro"
            popular
            isCurrentPlan={isPro && currentPlan === activePlan.interval}
            onCtaClick={() => handleUpgrade(activePlan.priceId)}
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
            onCtaClick={() => handleUpgrade(lifetimePlan.priceId)}
          />
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="px-4 pb-16 sm:pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Free vs <span className="text-amber-500">Pro</span></h2>
            <p className="text-foreground/70 text-base">Everything in Free, plus powerful tools to level up</p>
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
                  onClick={() => user ? openCheckout(activePlan.priceId) : navigate('/signup')}
                >
                  {user ? 'Upgrade to Pro' : 'Get Started Free'}
                </Button>
                <p className="text-xs text-muted-foreground">Cancel anytime · No hidden fees</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-16 sm:pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Common questions</h2>
            <p className="text-foreground/70 text-base">Everything you need to know before upgrading</p>
          </div>
          <div className="rounded-2xl border bg-background px-6 sm:px-8 py-2">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      <div className="mt-auto">
        <Footer7
          logo={{ url: "/", src: "", alt: "FreeTradeJournal Logo", title: "FreeTradeJournal" }}
          description="Track every trade, spot what's working, and build consistency — with professional analytics, journaling, and performance tools. Free forever, no credit card required."
          sections={[
            {
              title: "Product",
              links: [
                { name: "Features", href: "/#features" },
                { name: "Dashboard", href: "/dashboard" },
                { name: "Trade Log", href: "/trades" },
                { name: "Goals", href: "/goals" },
              ],
            },
            {
              title: "Trading Tools",
              links: [
                { name: "Forex Trading Journal", href: "/forex-trading-journal" },
                { name: "Futures Trading Tracker", href: "/futures-trading-tracker" },
                { name: "Prop Firm Dashboard", href: "/prop-firm-dashboard" },
              ],
            },
            {
              title: "Resources",
              links: [
                { name: "Documentation", href: "/documentation" },
                { name: "Changelog", href: "/changelog" },
                { name: "Pricing", href: "/pricing" },
              ],
            },
            {
              title: "Legal",
              links: [
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms & Conditions", href: "/terms" },
                { name: "Cookie Policy", href: "/cookie-policy" },
              ],
            },
          ]}
          socialLinks={[
            {
              icon: <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
              href: "https://x.com/richytiup",
              label: "Follow on X",
            },
          ]}
          copyright="&copy; 2026 FreeTradeJournal. All rights reserved."
          legalLinks={[
            { name: "Privacy Policy", href: "/privacy" },
            { name: "Terms and Conditions", href: "/terms" },
          ]}
        />
      </div>
    </div>
  );
}
