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

// TraderSync pricing verified 2026-08-10 (Pro/Premium/Elite; free Basic plan
// discontinued; 7-day trial). Re-check before editing these numbers.
const COMPARISON_ROWS = [
  { label: 'Free plan', ftj: 'Yes — free forever, no card', other: 'No (discontinued)' },
  { label: 'Cheapest paid plan', ftj: '$12.99/month', other: '$29.95/month (Pro)' },
  { label: 'Annual price', ftj: '$99.99/year', other: '$312.60/year (Pro)' },
  { label: 'AI features', ftj: 'Included — free plan gets 20 analyses/month', other: 'From the $49.95/month Premium tier' },
  { label: 'Free trial', ftj: 'Free plan instead — no time limit', other: '7 days' },
  { label: 'Trade import', ftj: 'CSV/Excel from any broker', other: 'Automatic sync, hundreds of brokers' },
  { label: 'Prop-firm evaluation tracker', ftj: 'Built in (PropTracker)', other: 'Not a dedicated feature' },
];

const FTJ_WINS = [
  { title: 'A real free plan', desc: 'TraderSync discontinued its free Basic plan — the only way in now is a paid tier after a 7-day trial. FreeTradeJournal\'s free plan has no expiry: unlimited trade logging, analytics, goals, and CSV import.' },
  { title: 'AI without the Premium tier', desc: 'TraderSync\'s AI features start on its $49.95/month Premium plan. FreeTradeJournal includes AI trade reviews and coaching on every plan — including 20 free analyses a month on the free one.' },
  { title: 'Less than half the price', desc: 'FreeTradeJournal Pro is $12.99/month or $99.99/year. TraderSync\'s cheapest tier is $29.95/month, and the features most people want it for sit on the $49.95 and $79.95 tiers.' },
  { title: 'Prop-firm tracking built in', desc: 'PropTracker monitors evaluation progress, drawdown limits, and daily loss across FTMO, Apex, Topstep, and other firms — a first-class feature for funded traders.' },
  { title: 'One plan, everything included', desc: 'No Pro/Premium/Elite ladder. One Pro tier with everything, and a free plan under it.' },
];

const OTHER_WINS = [
  { title: 'Automatic broker sync', desc: 'TraderSync syncs trades automatically from hundreds of brokers. FreeTradeJournal imports via CSV or Excel from any broker — it works everywhere, but it is a manual step.' },
  { title: 'Stocks and options depth', desc: 'TraderSync has deep support for stock and options traders, including options-specific analytics. FreeTradeJournal is built first for forex and futures traders.' },
  { title: 'Market replay', desc: 'TraderSync\'s Elite tier includes stock market replay. FreeTradeJournal does not offer replay.' },
];

const FAQS = [
  { question: 'Is FreeTradeJournal really free?', answer: 'Yes. The free plan includes unlimited trade logging, dashboard analytics over your last 30 days, up to 20 journal entries, two trading accounts, CSV/Excel import and export, and 5 AI coaching runs per month (automatic tips and prompts are free). No credit card required. Pro ($12.99/month or $99.99/year) removes the limits and adds cloud sync.' },
  { question: 'How does the price compare to TraderSync?', answer: 'TraderSync is $29.95/month (Pro), $49.95/month (Premium), or $79.95/month (Elite), with no free plan. FreeTradeJournal is free to start, and Pro is $12.99/month or $99.99/year with everything included.' },
  { question: 'How do I switch from TraderSync to FreeTradeJournal?', answer: 'Export your trades to CSV — from TraderSync or directly from your broker — then use FreeTradeJournal\'s CSV import. The column-mapping step handles different export formats, so you do not need to reformat anything by hand.' },
  { question: 'Does FreeTradeJournal sync with my broker automatically?', answer: 'Not yet. Trades come in via CSV or Excel import from any broker, or manual entry. Automatic sync is in development.' },
  { question: 'I trade stocks and options — is FreeTradeJournal right for me?', answer: 'You can log any instrument, but the analytics are built first for forex and futures. If you need options-specific analytics like spread tracking, TraderSync is honestly the stronger fit today.' },
  { question: 'Can I try Pro before paying?', answer: 'The free plan is the try: use the core journal for as long as you like before deciding. When you want the full feature set, upgrade to Pro and cancel anytime.' },
];

export default function TradersyncAlternative() {
  return (
    <>
      <SEOMeta />
      <StructuredData />
      <div className="min-h-screen bg-background flex flex-col">

        <MarketingHeader />

        <HeroGeometric
          title1="TraderSync Alternative"
          title2="(2026)"
          subtitle="TraderSync starts at $29.95/month with no free plan. FreeTradeJournal starts at free. Here's an honest comparison."
          compact
          showCTA={false}
        />

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">The short version</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                The AI you want,<br />
                <span className="text-amber-500">without the Elite tier.</span>
              </h2>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>
                TraderSync is one of the most established trading journals, with automatic sync from hundreds of brokers and strong stock and options support. Its pricing climbs quickly though: $29.95/month for Pro, $49.95 for Premium (where the AI features start), and $79.95 for Elite. The free Basic plan was discontinued.
              </p>
              <p>
                FreeTradeJournal covers the core job — trade logging, analytics, journaling, AI coaching — with a free plan that stays free and one Pro tier at $12.99/month or $99.99/year. AI is included everywhere, not reserved for a higher tier. And if you trade prop-firm evaluations, drawdown and eval tracking is built in.
              </p>
              <p>
                Here is the honest breakdown of where each one wins.
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
                <span className="text-amber-500">vs TraderSync.</span>
              </h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 min-w-[10rem]"></th>
                    <th className="text-left font-semibold text-amber-500 px-4 py-3 min-w-[12rem]">FreeTradeJournal</th>
                    <th className="text-left font-semibold text-foreground px-4 py-3 min-w-[12rem]">TraderSync</th>
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
            <p className="text-xs text-muted-foreground mt-3">TraderSync prices as published August 2026. Check tradersync.com for current rates.</p>
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
                <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-4">Where TraderSync is still ahead</p>
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
              <Link to="/tradezella-alternative">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm px-4">
                  TradeZella alternative
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
          title="Switching from TraderSync"
          subtitle="Common questions about moving your journal and what FreeTradeJournal does and does not do"
          id="faq-structured-data-tradersync-alternative"
        />

        <Footer7 {...footerConfig} />
      </div>
    </>
  );
}
