import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { Footer7 } from '@/components/blocks/footer-7';
import { footerConfig } from '@/components/blocks/footer-config';
import { FAQSection } from '@/components/blocks/faq-section';
import { MarketingHeader } from '@/components/marketing-header';
import { HeroGeometric } from '@/components/blocks/shape-landing-hero';
import { ArrowRight } from '@phosphor-icons/react';

// TradeZella pricing verified 2026-08-10 against help.tradezella.com
// (pricing effective 14 Jul 2026). Re-check before editing these numbers.
const COMPARISON_ROWS = [
  { label: 'Free plan', ftj: 'Yes — free forever, no card', other: 'No' },
  { label: 'Cheapest paid plan', ftj: '$12.99/month', other: '$35/month (Essential)' },
  { label: 'Annual price', ftj: '$99.99/year', other: '$315/year (Essential)' },
  { label: 'Top-tier price', ftj: '$99.99/year — one Pro tier, everything included', other: '$891/year (Ultra)' },
  { label: 'Free trial on paid plan', ftj: '14 days', other: 'See tradezella.com' },
  { label: 'Trade import', ftj: 'CSV/Excel from any broker', other: 'Automatic broker sync' },
  { label: 'AI coaching on the free plan', ftj: 'Yes — 20 analyses/month', other: 'No free plan' },
  { label: 'Prop-firm evaluation tracker', ftj: 'Built in (PropTracker)', other: 'Not a dedicated feature' },
];

const FTJ_WINS = [
  { title: 'A real free plan', desc: 'Unlimited trade logging, dashboard analytics, goals, and CSV import without paying anything or entering a card. TradeZella has no free plan — the cheapest way in is $35/month.' },
  { title: 'A third of the price', desc: 'FreeTradeJournal Pro is $12.99/month or $99.99/year. TradeZella starts at $35/month, and its new Ultra tier is $99/month — more per month than FreeTradeJournal Pro costs per year.' },
  { title: 'AI coaching from day one', desc: 'Trade reviews, journal feedback, and goal coaching are built in, with 20 free AI analyses every month before you pay a cent.' },
  { title: 'Prop-firm tracking built in', desc: 'PropTracker monitors evaluation progress, drawdown limits, and daily loss across FTMO, Apex, Topstep, and other firms. If you trade funded accounts, this is a first-class feature, not an afterthought.' },
  { title: 'One plan, everything included', desc: 'There is one Pro tier. You never have to work out which features sit behind Essential, Pro, or Ultra.' },
];

const OTHER_WINS = [
  { title: 'Automatic broker sync', desc: 'TradeZella pulls trades directly from supported brokers. FreeTradeJournal imports via CSV or Excel from any broker — a manual step TradeZella can skip.' },
  { title: 'Backtesting and replay', desc: 'TradeZella includes backtesting and market replay tools. FreeTradeJournal focuses on journaling, analytics, and coaching, and does not offer backtesting.' },
  { title: 'Larger community', desc: 'TradeZella has been the best-known name in paid trading journals since 2022, with a large user base and content library around it.' },
];

const FAQS = [
  { question: 'Is FreeTradeJournal really free?', answer: 'Yes. The free plan includes unlimited trade logging, dashboard analytics over your last 30 days, up to 20 journal entries, two trading accounts, CSV/Excel import and export, and 5 AI coaching runs per month (automatic tips and prompts are free). No credit card required. Pro ($12.99/month or $99.99/year) removes the limits and adds cloud sync.' },
  { question: 'How much cheaper is FreeTradeJournal than TradeZella?', answer: 'TradeZella starts at $35/month (or $315/year) and goes up to $99/month for Ultra. FreeTradeJournal Pro is $12.99/month or $99.99/year — roughly a third of TradeZella\'s cheapest plan, and there is a free plan TradeZella does not offer.' },
  { question: 'How do I switch from TradeZella to FreeTradeJournal?', answer: 'Export your trades to CSV — from TradeZella or directly from your broker — then use FreeTradeJournal\'s CSV import. The column-mapping step handles different export formats, so you do not need to reformat anything by hand.' },
  { question: 'Does FreeTradeJournal sync with my broker automatically?', answer: 'Not yet. Trades come in via CSV or Excel import from any broker, or manual entry. Automatic sync is in development.' },
  { question: 'Does FreeTradeJournal work for prop firm traders?', answer: 'Yes — this is where it is strongest. PropTracker tracks evaluation progress, drawdown, and daily loss limits across FTMO, Apex, Topstep, and other firms, alongside your journal and analytics.' },
  { question: 'Can I try Pro before paying?', answer: 'Yes. Pro subscriptions come with a 14-day free trial. You will not be charged until the trial ends, and you can cancel any time before then.' },
];

export default function TradezellaAlternative() {
  return (
    <>
      <SEOMeta />
      <StructuredData />
      <div className="min-h-screen bg-background flex flex-col">

        <MarketingHeader />

        <HeroGeometric
          title1="TradeZella Alternative"
          title2="(2026)"
          subtitle="TradeZella starts at $35/month. FreeTradeJournal starts at free. Here's an honest comparison so you can decide which fits."
          compact
          showCTA={false}
        />

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">The short version</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Same job.<br />
                <span className="text-amber-500">Very different price.</span>
              </h2>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>
                TradeZella is the best-known paid trading journal. It earned that with automatic broker sync, backtesting tools, and strong marketing. It is a good product — and since July 2026 it costs $35/month for the cheapest plan, $59/month for Pro, or $99/month for the new Ultra tier.
              </p>
              <p>
                FreeTradeJournal does the core job — logging trades, analytics, journaling, and coaching — with a free plan that stays free, and a single Pro tier at $12.99/month or $99.99/year. If you trade prop-firm evaluations, it also tracks your drawdown and eval progress, which TradeZella does not treat as a dedicated feature.
              </p>
              <p>
                Below is the honest breakdown: where you save money, and where TradeZella is still genuinely ahead.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Side by side</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                FreeTradeJournal<br />
                <span className="text-amber-500">vs TradeZella.</span>
              </h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 min-w-[10rem]"></th>
                    <th className="text-left font-semibold text-amber-500 px-4 py-3 min-w-[12rem]">FreeTradeJournal</th>
                    <th className="text-left font-semibold text-foreground px-4 py-3 min-w-[12rem]">TradeZella</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
                      <td className="px-4 py-3 text-muted-foreground bg-amber-500/[0.04]">{row.ftj}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.other}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">TradeZella prices from their published pricing, effective 14 July 2026. Check tradezella.com for current rates.</p>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">The honest breakdown</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Where each one<br />
                <span className="text-amber-500">actually wins.</span>
              </h2>
            </div>

            <div className="space-y-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-4">Where FreeTradeJournal wins</p>
                <div className="divide-y divide-border/40">
                  {FTJ_WINS.map((item, i) => (
                    <div key={i} className="flex items-start gap-6 py-5">
                      <span className="text-[11px] font-mono text-emerald-500/50 pt-0.5 w-6 shrink-0 select-none">{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-4">Where TradeZella is still ahead</p>
                <div className="divide-y divide-border/40">
                  {OTHER_WINS.map((item, i) => (
                    <div key={i} className="flex items-start gap-6 py-5">
                      <span className="text-[11px] font-mono text-red-400/50 pt-0.5 w-6 shrink-0 select-none">{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-500">Try the free plan first</p>
                <p className="text-xs text-muted-foreground mt-0.5">No credit card. Import your trades and see your stats in minutes.</p>
              </div>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] motion-reduce:animate-none text-black font-semibold px-8 py-2.5 rounded-lg text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-[transform,box-shadow] duration-300">
                  Start free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/tradersync-alternative">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm px-4">
                  TraderSync alternative
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/edgewonk-alternative">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm px-4">
                  Edgewonk alternative
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <FAQSection
          faqs={FAQS}
          title="Switching from TradeZella"
          subtitle="Common questions about moving your journal and what FreeTradeJournal does and does not do"
          id="faq-structured-data-tradezella-alternative"
        />

        <Footer7 {...footerConfig} />
      </div>
    </>
  );
}
