import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { Footer7 } from '@/components/ui/footer-7';
import { footerConfig } from '@/components/ui/footer-config';
import { FAQSection } from '@/components/blocks/faq-section';
import { MarketingHeader } from '@/components/marketing-header';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { ArrowRight } from '@phosphor-icons/react';
import { PositionSizeCalculator, CalculatorDisclaimer } from '@/components/position-size-calculator';
import { FUTURES_CONTRACTS } from '@/constants/contract-specs';

const FAQS = [
  { question: 'How is forex position size calculated?', answer: 'Three numbers: how much money you are willing to lose on the trade, your stop loss distance in pips, and the value of one pip. Position size in lots = risk amount ÷ (stop loss in pips × pip value per lot). For example, risking $100 with a 20-pip stop on EUR/USD, where one pip on a standard lot is $10: 100 ÷ (20 × 10) = 0.5 lots. The calculator does this for you, including the currency conversion when your account is not held in the pair\'s quote currency.' },
  { question: 'How is futures position size calculated?', answer: 'Contracts = risk amount ÷ (stop loss in ticks × tick value). Each contract has a fixed tick size and dollar value set by the exchange. For example, MNQ moves in 0.25-point ticks worth $0.50 each: a 40-tick stop risks $20 per contract, so a $100 risk budget allows 5 contracts. The result always rounds down so you never risk more than planned.' },
  { question: 'What percentage of my account should I risk per trade?', answer: 'Most traders use 0.5% to 2% per trade. 1% is a common starting point: ten losses in a row costs about 10% of the account, which is recoverable. If you trade a prop firm evaluation, also check your firm\'s daily loss limit, because several 1% losses in one day can breach it even when each trade individually looked fine.' },
  { question: 'How do pips work on gold?', answer: 'This calculator treats one pip on gold (XAUUSD) as a $0.01 price move, worth $1 per standard lot of 100 oz. Some brokers quote gold pips as a $0.10 move instead. If your broker does, multiply your stop distance by ten before entering it, or check the pip value shown in the results against your platform.' },
  { question: 'What is the difference between ticks and points in futures?', answer: 'A point is one whole unit of price. A tick is the smallest move the exchange allows, which is usually a fraction of a point. The E-mini S&P 500 moves in 0.25-point ticks, so one point is four ticks. The calculator accepts your stop in either unit, pick whichever your platform shows.' },
  { question: 'Why does the calculator round down instead of to the nearest size?', answer: 'Rounding up would make the position risk more money than you entered. Rounding down keeps the actual risk at or under your target, and the results panel shows exactly how much the rounded size risks.' },
  { question: 'Is this calculator free?', answer: 'Yes, no account needed. It pairs well with the free trading journal: size the trade here, take it, then log it to see whether your risk numbers hold up over time.' },
];

export default function PositionSizeCalculatorPage() {
  return (
    <>
      <SEOMeta />
      <StructuredData />
      <div className="min-h-screen bg-background flex flex-col">

        <MarketingHeader />

        <HeroGeometric
          title1="Position Size Calculator"
          title2="Forex & Futures"
          subtitle="Work out exactly how many lots or contracts to trade from your account size, risk, and stop loss. Free, no sign-up."
          compact
          showCTA={false}
        />

        <section className="py-10 sm:py-14 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-7xl">
            <PositionSizeCalculator />
            <div className="mt-6">
              <CalculatorDisclaimer />
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">How it works</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                One formula,<br />
                <span className="text-amber-500">no guessing.</span>
              </h2>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Position sizing answers one question: how big can this trade be so that if the stop loss hits, you lose only what you planned to lose. Everything starts from the risk amount, either a percentage of your account or a fixed figure.
              </p>
              <p>
                For forex: lots = risk amount ÷ (stop in pips × pip value per lot). Pip value depends on the pair and on the currency your account is held in. When those differ, the calculator fetches a live exchange rate and shows it, and you can type your own rate over it.
              </p>
              <p>
                For futures: contracts = risk amount ÷ (stop in ticks × tick value). Tick sizes and values are fixed by the exchange and built into the calculator for the contracts prop and futures traders actually use, from ES and NQ down to their micro versions.
              </p>
              <p>
                Results always round down, so the position never risks more than you entered. The panel shows the actual risk at the rounded size next to your target so the difference is visible instead of hidden.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Reference</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Futures tick values<br />
                <span className="text-amber-500">at a glance.</span>
              </h2>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-left">
                    <th className="px-4 py-3 font-semibold">Contract</th>
                    <th className="px-4 py-3 font-semibold">Symbol</th>
                    <th className="px-4 py-3 font-semibold">Tick size</th>
                    <th className="px-4 py-3 font-semibold">Tick value</th>
                    <th className="px-4 py-3 font-semibold">Per point</th>
                  </tr>
                </thead>
                <tbody>
                  {FUTURES_CONTRACTS.map(c => (
                    <tr key={c.symbol} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-2.5">{c.name}</td>
                      <td className="px-4 py-2.5 font-mono">{c.symbol}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">{c.tickSize}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">${c.tickValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">${(c.tickValue / c.tickSize).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Official CME Group contract specifications, checked August 2026.
            </p>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Sized the trade? Now track it.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              A calculator tells you the right size for one trade. A journal tells you whether your sizing, stops, and risk rules actually work across a hundred. FreeTradeJournal is free forever, with no card required.
            </p>
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                Start your free journal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <FAQSection
          faqs={FAQS}
          title="Position sizing questions"
          subtitle="How the numbers are calculated and how to use them"
          id="faq-structured-data-position-size-calculator"
        />

        <Footer7 {...footerConfig} />
      </div>
    </>
  );
}
