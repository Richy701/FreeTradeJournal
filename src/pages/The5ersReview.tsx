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
  { title: 'Instant funding', desc: 'Skip the evaluation entirely and start trading a live funded account from day one.' },
  { title: 'Scaling to $4M', desc: 'Grow your funded capital up to $4M through consistent performance milestones.' },
  { title: 'Flexible evaluations', desc: 'Choose from instant funding, 1-step, 2-step, 3-step, or Bootcamp programs.' },
  { title: 'Up to 100% profit split', desc: 'Start at 50% and scale through 75% to 100% as you hit milestones.' },
  { title: 'Established reputation', desc: 'Operating since 2016 with transparent rules and a strong trader community.' },
  { title: '100+ instruments', desc: 'Trade forex, metals, indices, commodities, and crypto on MT5 or cTrader.' },
];

const CONS = [
  { title: 'Lower starting split', desc: 'Instant funding starts at 50% profit split, lower than the 80% most competitors offer.' },
  { title: 'Tighter instant drawdown', desc: 'Instant funding accounts have stricter drawdown rules than evaluation-based accounts.' },
  { title: 'Slow scaling timeline', desc: 'Reaching $4M requires consistent monthly profits over many months.' },
  { title: 'No CME futures', desc: 'Despite offering many asset classes, The5%ers does not support CME futures contracts.' },
];

const FAQS = [
  { question: 'What is The5%ers instant funding?', answer: 'The5%ers instant funding lets you skip the evaluation entirely. You pay a one-time fee and get a live funded account immediately. The tradeoff is tighter risk limits and a lower starting balance, but you can scale up to $4M with consistent performance.' },
  { question: 'How much does a The5%ers challenge cost?', answer: 'Pricing depends on the program. Instant funding starts around $39 for a small account. The Hyper Growth program (one-step evaluation) starts around $95 for a $25K account. Two-step evaluations are also available at various price points.' },
  { question: 'What is The5%ers profit split?', answer: 'Profit splits start at 50% for instant funding and scale up to 100% as you hit milestones. The evaluation-based programs start at 80% and can reach 100% at higher scaling levels.' },
  { question: 'What can I trade on The5%ers?', answer: 'The5%ers supports forex pairs, metals (gold, silver), and major indices. They do not currently support futures, individual stocks, or crypto.' },
  { question: 'How do The5%ers payouts work?', answer: 'Payouts are processed on a bi-weekly or monthly basis depending on your program. Payment methods include bank wire, PayPal, and crypto. There is no minimum payout amount for most programs.' },
  { question: 'Is The5%ers discount code ZBY34 legit?', answer: 'Yes. Code ZBY34 gives you 5% off your first challenge through the official FreeTradeJournal affiliate partnership. It works on all The5%ers programs.' },
  { question: 'Can I track my The5%ers account with FreeTradeJournal?', answer: 'Yes. Use the Prop Firm Dashboard to monitor your drawdown limits, daily P&L, and evaluation progress. Import trades via CSV and the dashboard tracks everything automatically.' },
];

export default function The5ersReview() {
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
          title1="The5%ers Review"
          title2="(2026)"
          subtitle="Instant funding, flexible evaluations, and scaling to $4M. Here's what you need to know about The5%ers before signing up."
          compact
          showCTA={false}
        />

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Overview</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                What is<br />
                <span className="text-amber-500">The5%ers?</span>
              </h2>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <img src="/images/partners/the5ers.svg" alt="The5%ers logo" className="h-12 object-contain" />
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>
                The5%ers is a forex-focused prop firm founded in 2016 in Israel. They are known for their instant funding option, which lets traders skip the evaluation entirely and start trading a live funded account from day one. They also offer one-step and two-step evaluation programs.
              </p>
              <p>
                What sets The5%ers apart is their scaling plan -- traders can grow their account up to $4M in funded capital with consistent performance. Profit splits start at 50% for instant funding and scale to 100% at the highest levels. They support forex pairs, metals, and indices.
              </p>
              <p>
                The5%ers has built a strong community and reputation for transparency. Their programs are designed for traders who want flexibility in how they get funded, whether that means proving themselves through an evaluation or jumping straight into live trading.
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

            <div className="mt-8 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-500">5% off your first challenge</p>
                <p className="text-xs text-muted-foreground mt-0.5">Use code <span className="font-mono font-medium text-foreground">ZBY34</span> at checkout</p>
              </div>
              <a href="https://www.the5ers.com/?afmc=1buq" target="_blank" rel="noopener noreferrer sponsored">
                <Button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] motion-reduce:animate-none text-black font-semibold px-8 py-2.5 rounded-lg text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-[transform,box-shadow] duration-300">
                  Visit The5%ers
                  <ArrowSquareOut className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>

            <div className="mt-4">
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
          title="The5%ers"
          subtitle="Common questions about The5%ers programs, pricing, payouts, and how to get started"
          id="faq-structured-data-the5ers"
        />

        <Footer7 {...footerConfig} />
      </div>
    </>
  );
}
