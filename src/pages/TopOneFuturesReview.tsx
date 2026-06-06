import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { Footer7 } from '@/components/ui/footer-7';
import { footerConfig } from '@/components/ui/footer-config';
import { FAQSection } from '@/components/blocks/faq-section';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { ArrowRight, ExternalLink } from 'lucide-react';

const PROS = [
  { title: 'Futures-focused', desc: 'Built specifically for CME, CBOT, NYMEX, and COMEX traders -- not an afterthought.' },
  { title: 'Multiple eval options', desc: '1-step, 2-step, 3-step, and instant sim funded programs to match your style.' },
  { title: 'Up to $500K funding', desc: 'Larger maximum funding than most futures-only prop firms.' },
  { title: 'No scaling requirements', desc: 'Keep your funded account without hitting monthly profit targets.' },
  { title: 'All major contracts', desc: 'Trade ES, NQ, YM, RTY, CL, GC, and more via ProjectX/Tradovate or NinjaTrader.' },
  { title: '90% profit split', desc: 'Competitive split on all funded account types.' },
];

const CONS = [
  { title: 'Futures only', desc: 'No forex, stocks, indices, or crypto. If you trade multiple asset classes, look elsewhere.' },
  { title: 'Newer firm', desc: 'Less track record than established players like FTMO or The5%ers.' },
  { title: 'Fewer resources', desc: 'Limited educational content and community compared to larger firms.' },
  { title: 'Platform restrictions', desc: 'Only supports ProjectX/Tradovate and NinjaTrader -- no MT4/MT5 or cTrader.' },
];

const FAQS = [
  { question: 'What is Top One Futures?', answer: 'Top One Futures is a prop firm focused exclusively on futures trading. They offer multiple evaluation types -- 1-step, 2-step, 3-step, and instant sim funded -- for CME, CBOT, NYMEX, and COMEX products including ES, NQ, YM, CL, GC, and more. Accounts go up to $500K with a 90% profit split.' },
  { question: 'How does the Top One Futures evaluation work?', answer: 'Top One Futures offers 1-step, 2-step, and 3-step evaluations, plus an instant sim funded option. Hit your profit target while staying within the daily loss limit and max trailing drawdown. Most accounts have no time limit, so you can trade at your own pace. Pass and you get a funded account.' },
  { question: 'What futures contracts can I trade?', answer: 'You can trade all major CME Group products: E-mini S&P 500 (ES), E-mini Nasdaq (NQ), Dow (YM), Russell 2000 (RTY), Crude Oil (CL), Gold (GC), plus micro contracts, treasury bonds, and agricultural futures.' },
  { question: 'What is the profit split?', answer: 'Top One Futures offers up to 90% profit split on funded accounts across all program types.' },
  { question: 'How do payouts work at Top One Futures?', answer: 'Payouts are processed after meeting minimum trading day requirements on your funded account. Payment methods include bank transfer and crypto. Payout frequency varies by account type.' },
  { question: 'Can I use NinjaTrader or Tradovate?', answer: 'Yes. Top One Futures supports ProjectX/Tradovate and NinjaTrader for all account types.' },
  { question: 'Can I track my Top One Futures account with FreeTradeJournal?', answer: 'Yes. FreeTradeJournal supports CSV import from Tradovate and NinjaTrader. Use the Prop Firm Dashboard to track your evaluation progress, daily loss limits, and P&L in real time.' },
];

export default function TopOneFuturesReview() {
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
          title1="Top One Futures"
          title2="Review (2026)"
          subtitle="A futures-only prop firm with simple one-step evaluations and no scaling requirements. Here's our honest review."
          compact
          showCTA={false}
        />

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Overview</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                What is Top One<br />
                <span className="text-amber-500">Futures?</span>
              </h2>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <img src="/images/partners/toponetrader.svg" alt="Top One Futures logo" className="h-12 object-contain" />
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Top One Futures is a prop firm built specifically for futures traders. Unlike multi-asset firms that offer futures as an afterthought, Top One Futures focuses entirely on CME Group products -- ES, NQ, YM, RTY, CL, GC, and more.
              </p>
              <p>
                They offer multiple evaluation options: 1-step, 2-step, 3-step, and instant sim funded programs. Hit your profit target while staying within the drawdown rules and you get funded with accounts up to $500K. There are no scaling requirements to maintain your account, which means less pressure on funded traders.
              </p>
              <p>
                Top One Futures supports trading via ProjectX/Tradovate and NinjaTrader. With a 90% profit split and flexible evaluation paths, they are a strong choice for futures day traders and scalpers who want a focused platform without the noise of forex or stocks.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Pros & cons</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                The honest<br />
                <span className="text-amber-500">breakdown.</span>
              </h2>
            </div>

            <div className="space-y-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-4">What we like</p>
                <div className="divide-y divide-border/40">
                  {PROS.map((pro, i) => (
                    <div key={i} className="flex items-start gap-6 py-5">
                      <span className="text-[11px] font-mono text-emerald-500/50 pt-0.5 w-6 shrink-0 select-none">{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm">{pro.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{pro.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-4">Watch out for</p>
                <div className="divide-y divide-border/40">
                  {CONS.map((con, i) => (
                    <div key={i} className="flex items-start gap-6 py-5">
                      <span className="text-[11px] font-mono text-red-400/50 pt-0.5 w-6 shrink-0 select-none">{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm">{con.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{con.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a href="https://toponefutures.com/?linkId=lp_707970&sourceId=richmond-lamptey&tenantId=toponefutures" target="_blank" rel="noopener noreferrer sponsored">
                <Button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] motion-reduce:animate-none text-black font-semibold px-8 py-2.5 rounded-lg text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-[transform,box-shadow] duration-300">
                  Visit Top One Futures
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link to="/affiliate">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm px-4">
                  View all prop firms
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <FAQSection
          faqs={FAQS}
          title="Top One Futures"
          subtitle="Common questions about Top One Futures evaluations, contracts, payouts, and platform support"
          id="faq-structured-data-toponefutures"
        />

        <Footer7 {...footerConfig} />
      </div>
    </>
  );
}
