import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { Footer7 } from '@/components/ui/footer-7';
import { footerConfig } from '@/components/ui/footer-config';
import { FAQSection } from '@/components/blocks/faq-section';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { ArrowRight, ArrowSquareOut } from '@phosphor-icons/react';

const PROS = [
  { title: 'Industry reputation', desc: 'Operating since 2010 with a proven track record and thousands of funded traders worldwide.' },
  { title: 'Up to $2M funding', desc: '$200K initial funding with a scaling plan up to $2M for consistent performers.' },
  { title: 'Multi-asset trading', desc: 'Trade forex, indices, commodities, metals, and crypto on MT4, MT5, cTrader, or DXtrade.' },
  { title: '80--90% profit split', desc: '80% on two-step, 90% on one-step or via the scaling plan.' },
  { title: 'Free verification retake', desc: 'If you pass the challenge but fail verification, you get a free retake.' },
  { title: 'Reliable payouts', desc: 'Bi-weekly payouts via bank transfer, Skrill, or crypto with a strong track record of on-time payments.' },
];

const CONS = [
  { title: 'Two-step can be slow', desc: 'The standard two-step evaluation requires passing two phases, which takes longer than one-step alternatives.' },
  { title: 'Strict risk limits', desc: '5% max daily loss and 10% max overall loss with no exceptions.' },
  { title: 'Higher challenge fees', desc: 'Pricing is higher than some newer competitors, especially at the $100K+ account sizes.' },
  { title: 'No futures contracts', desc: 'Despite supporting many asset classes, FTMO does not offer CME futures trading.' },
];

const FAQS = [
  { question: 'How does the FTMO challenge work?', answer: 'FTMO uses a two-step evaluation. Step 1 (Challenge) requires you to hit a 10% profit target within 30 days. Step 2 (Verification) requires 5% profit within 60 days. Both steps have a 5% daily loss limit and 10% max loss limit. Pass both and you get a funded account.' },
  { question: 'How much does an FTMO challenge cost?', answer: 'Prices vary by account size. A $10K account starts around $155, $25K is $250, $50K is $345, $100K is $540, and $200K is $1,080. If you pass, the fee is refunded with your first profit split.' },
  { question: 'What is the FTMO profit split?', answer: 'FTMO offers up to 90% profit split. New funded traders start at 80% and can scale to 90% based on consistent performance over time.' },
  { question: 'Can I trade futures on FTMO?', answer: 'Yes. FTMO supports forex, indices, commodities, stocks, and crypto. However, most traders use FTMO for forex and indices. For dedicated futures trading, firms like Apex or Top One Futures may be a better fit.' },
  { question: 'Does FTMO allow Expert Advisors (EAs)?', answer: 'Yes. FTMO allows automated trading with Expert Advisors and algorithmic strategies, as long as they comply with the trading rules (no HFT or latency arbitrage).' },
  { question: 'How do FTMO payouts work?', answer: 'Payouts are processed bi-weekly (every 14 days). You can request a payout via bank transfer, Skrill, or crypto. The minimum payout is typically the equivalent of $20.' },
  { question: 'Can I track my FTMO challenge with FreeTradeJournal?', answer: 'Yes. FreeTradeJournal has a dedicated Prop Firm Dashboard that tracks your evaluation progress, daily loss limits, max drawdown, and P&L. Import your trades via CSV from MT4/MT5 and the dashboard updates automatically.' },
];

export default function FTMOReview() {
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
          title1="FTMO Review"
          title2="(2026)"
          subtitle="Is FTMO still the best prop firm? Here's what you need to know about their two-step evaluation, profit splits, payouts, and how to track your challenge."
          compact
          showCTA={false}
        />

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Overview</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                What is<br />
                <span className="text-amber-500">FTMO?</span>
              </h2>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <img src="/images/partners/ftmo.png" alt="FTMO logo" className="h-12 object-contain" />
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>
                FTMO is one of the most established proprietary trading firms in the industry, operating since 2010 out of Prague, Czech Republic. They offer funded accounts up to $200K across forex, indices, commodities, stocks, and crypto through a two-step evaluation process.
              </p>
              <p>
                The FTMO Challenge requires traders to hit a 10% profit target within 30 days while staying within a 5% daily loss limit and 10% maximum loss. After passing, the Verification step requires 5% profit in 60 days with the same risk rules. Pass both and you trade a funded account with up to 90% profit split.
              </p>
              <p>
                FTMO has built its reputation on reliable payouts, transparent rules, and a professional trading environment. They also offer a free trial so you can test the platform before committing to a paid challenge.
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
              <a href="https://trader.ftmo.com/?affiliates=PYpnfPHLxoLexQHIwIhm" target="_blank" rel="noopener noreferrer sponsored">
                <Button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] motion-reduce:animate-none text-black font-semibold px-8 py-2.5 rounded-lg text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-[transform,box-shadow] duration-300">
                  Visit FTMO
                  <ArrowSquareOut className="ml-2 h-4 w-4" />
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
          title="FTMO"
          subtitle="Common questions about FTMO challenges, rules, payouts, and how to track your progress"
          id="faq-structured-data-ftmo"
        />

        <Footer7 {...footerConfig} />
      </div>
    </>
  );
}
