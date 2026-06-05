import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { Footer7 } from '@/components/ui/footer-7';
import { footerConfig } from '@/components/ui/footer-config';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { FAQSection } from '@/components/blocks/faq-section';
import { ExternalLink, Copy, Check } from 'lucide-react';

const AFFILIATE_FAQS = [
  {
    question: 'Are these prop firm discount codes legit?',
    answer: 'Yes. Every code on this page is an official affiliate partnership negotiated directly with the prop firm. The discounts are verified and updated regularly. You pay less, and FreeTradeJournal earns a small commission at no extra cost to you.',
  },
  {
    question: 'Which prop firm is best for beginners?',
    answer: 'The5%ers is a great starting point with instant funding options and flexible evaluation programs. FTMO is another solid choice with a well-structured two-step evaluation. Both have clear rules and strong reputations that make them easier to trust while you build consistency.',
  },
  {
    question: 'What is the cheapest prop firm challenge?',
    answer: 'Prices vary by account size and evaluation type. The5%ers offers challenges starting around $39, and Apex frequently runs promotions with 50-80% off. Use the discount codes on this page to save even more on your first challenge.',
  },
  {
    question: 'Can I use FreeTradeJournal to track my prop firm challenge?',
    answer: 'Yes. FreeTradeJournal has a dedicated Prop Firm Dashboard that tracks your evaluation progress, daily loss limits, max drawdown, and payout history. The PropTracker tool also calculates your true net P&L after fees, resets, and payouts across all your accounts.',
  },
  {
    question: 'Do I need a Pro subscription to track prop firm trades?',
    answer: 'No. Trade logging, analytics, the prop firm dashboard, and PropTracker are all free. Pro adds AI-powered trade coaching, automated reviews, cloud sync, and advanced exports starting at $12.99/mo with a 14-day free trial.',
  },
  {
    question: 'What markets do these prop firms support?',
    answer: 'It depends on the firm. FTMO and FundedNext support forex, indices, commodities, stocks, and crypto. Apex and Top One Futures focus exclusively on CME futures (ES, NQ, CL, GC). The5%ers covers forex, metals, and indices. Check each firm\'s page for the full instrument list.',
  },
  {
    question: 'How do prop firm payouts work?',
    answer: 'After passing your evaluation and trading a funded account profitably, you request a payout. Most firms pay via bank transfer, crypto, or Rise. Profit splits range from 70% to 90% depending on the firm and account level. Payout schedules vary from bi-weekly to monthly.',
  },
  {
    question: 'Will more prop firms be added?',
    answer: 'Yes. We are actively negotiating partnerships with additional firms. If there is a specific prop firm you would like to see listed, let us know via the Telegram community.',
  },
];

type Market = 'Futures' | 'Forex' | 'Forex + Futures';

interface PropFirm {
  id: string;
  name: string;
  logo: string;
  market: Market;
  blurb: string;
  discount: string;
  code?: string;
  url: string;
}

const FIRMS: PropFirm[] = [
  {
    id: 'the5ers',
    name: 'The5%ers',
    logo: '/images/partners/the5ers.svg',
    market: 'Forex',
    blurb: 'Instant funding up to $4M with scaling. Trade forex, metals, and indices with flexible evaluation programs and fast payouts.',
    discount: '5% off your first challenge',
    code: 'ZBY34',
    url: 'https://www.the5ers.com/?afmc=1buq',
  },
  {
    id: 'ftmo',
    name: 'FTMO',
    logo: '/images/partners/ftmo.png',
    market: 'Forex + Futures',
    blurb: 'Industry-leading prop firm with a two-step evaluation. Trade forex, indices, commodities, stocks, and crypto with up to $200K funding.',
    discount: '',
    url: 'https://trader.ftmo.com/?affiliates=PYpnfPHLxoLexQHIwIhm',
  },
  {
    id: 'fundednext',
    name: 'FundedNext',
    logo: '/images/partners/fundednext.svg',
    market: 'Forex',
    blurb: 'Get funded up to $4M with profit sharing from day one of your challenge. Multiple evaluation models and 90% profit split on funded accounts.',
    discount: '',
    url: '',
  },
  {
    id: 'top-one-futures',
    name: 'Top One Futures',
    logo: '/images/partners/toponetrader.svg',
    market: 'Futures',
    blurb: 'Futures-focused prop firm with straightforward evaluations and no scaling requirements. Trade CME, CBOT, NYMEX, and COMEX products.',
    discount: '',
    url: 'https://toponefutures.com/?linkId=lp_707970&sourceId=richmond-lamptey&tenantId=toponefutures',
  },
  {
    id: 'apex',
    name: 'Apex Trader Funding',
    logo: '/images/partners/apex.webp',
    market: 'Futures',
    blurb: 'One-step evaluation for futures traders. No daily drawdown, trade full-sized contracts, and keep 100% of your first $25K in profits.',
    discount: '',
    url: '',
  },
];

const MARKET_STYLES: Record<Market, string> = {
  Forex: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Futures: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Forex + Futures': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-background/80 border border-amber-500/30 text-sm font-mono text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/50 transition-all duration-200 cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          {code}
        </>
      )}
    </button>
  );
}

function FirmRow({ firm }: { firm: PropFirm }) {
  const hasUrl = firm.url !== '';
  const hasDeal = firm.discount || firm.code;

  return (
    <div className="group rounded-2xl border border-border/40 bg-card hover:border-amber-500/25 transition-all duration-300 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Logo */}
        <div className="md:w-52 lg:w-60 shrink-0 flex items-center justify-center p-8 md:p-6 bg-white/[0.04] border-b md:border-b-0 md:border-r border-border/50">
          <img
            src={firm.logo}
            alt={`${firm.name} logo`}
            className="max-h-14 lg:max-h-16 max-w-[160px] object-contain"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <h3 className="text-lg font-bold text-foreground">{firm.name}</h3>
              <Badge className={`${MARKET_STYLES[firm.market]} text-[11px]`}>
                {firm.market}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {firm.blurb}
            </p>
          </div>

          {/* Deal + CTA */}
          <div className="sm:w-52 lg:w-56 shrink-0 flex flex-col gap-3 sm:items-end sm:justify-center">
            {hasDeal && (
              <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/20 px-4 py-3 w-full">
                {firm.discount && (
                  <p className="text-sm font-semibold text-amber-500 mb-2">{firm.discount}</p>
                )}
                {firm.code && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Code:</span>
                    <CopyButton code={firm.code} />
                  </div>
                )}
              </div>
            )}

            {hasUrl ? (
              <a
                href={firm.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="w-full"
              >
                <Button className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] motion-reduce:animate-none text-black font-semibold rounded-lg text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-[transform,box-shadow] duration-300">
                  Visit {firm.name}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            ) : (
              <Button
                disabled
                variant="outline"
                className="w-full rounded-lg text-sm font-semibold border-border/50 text-muted-foreground cursor-not-allowed"
              >
                Coming Soon
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Affiliate() {
  return (
    <>
      <SEOMeta />
      <StructuredData />
      <div className="min-h-screen bg-background flex flex-col">

        <header className="absolute top-0 left-0 right-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <img src="/favicon.svg" alt="FTJ" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex-shrink-0" />
              <span className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 truncate">FreeTradeJournal</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Link to="/pricing" className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium px-3 py-2 rounded-md text-sm sm:text-base hidden sm:block">Pricing</Link>
              <Link to="/login" className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium px-3 py-2 rounded-md text-sm sm:text-base">Sign In</Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <HeroGeometric
          title1="Prop Firm"
          title2="Affiliate Partners"
          subtitle="Exclusive discounts on the best prop firm challenges. Use the codes below to save on your next evaluation."
          compact
          showCTA={false}
        />

        <section className="px-4 sm:px-6 -mt-16 relative z-10">
          <div className="container mx-auto max-w-4xl">
            <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm px-5 py-4 text-sm text-muted-foreground leading-relaxed flex items-start gap-3">
              <span className="text-amber-500/70 text-base leading-none mt-0.5 shrink-0">*</span>
              <p>
                <span className="font-semibold text-foreground">Affiliate disclosure</span>{' '}
                These are affiliate links. FreeTradeJournal may earn a commission if you sign up through them, at no extra cost to you. We only list firms we believe are reputable.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/50 pb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Partner firms</p>
                <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                  Save on your next<br />
                  <span className="text-amber-500">challenge.</span>
                </h2>
              </div>
              <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                Exclusive codes and discounts negotiated for FreeTradeJournal users.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {FIRMS.map((firm) => (
                <FirmRow key={firm.id} firm={firm} />
              ))}
            </div>
          </div>
        </section>

        <FAQSection
          faqs={AFFILIATE_FAQS}
          title="Prop Firm"
          subtitle="Common questions about prop firm challenges, discounts, and how to track your funded accounts"
          id="faq-structured-data-affiliate"
        />

        <Footer7 {...footerConfig} />
      </div>
    </>
  );
}