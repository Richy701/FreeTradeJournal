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

// Edgewonk pricing verified 2026-08-10 against edgewonk.com/pricing
// ($197 per term, no free plan, 14-day refund). Re-check before editing.
const COMPARISON_ROWS = [
  { label: 'Free plan', ftj: 'Yes — free forever, no card', other: 'No' },
  { label: 'Monthly billing option', ftj: 'Yes — $12.99/month', other: 'No — $197 paid upfront per term' },
  { label: 'Annual price', ftj: '$99.99/year', other: '$197/year term' },
  { label: 'Free trial', ftj: 'Free plan instead — no time limit', other: 'None — 14-day money-back guarantee instead' },
  { label: 'AI coaching', ftj: 'Included — free plan gets 20 analyses/month', other: 'Statistics-based analytics' },
  { label: 'Prop-firm evaluation tracker', ftj: 'Built in (PropTracker)', other: 'Not a dedicated feature' },
  { label: 'Trade import', ftj: 'CSV/Excel from any broker', other: 'Broker import templates' },
];

const FTJ_WINS = [
  { title: 'Free to start, cheap to stay', desc: 'Edgewonk has no free version — you pay $197 upfront before you know if it fits how you trade. FreeTradeJournal\'s free plan has no time limit, and Pro is $12.99/month or $99.99/year, about half Edgewonk\'s term price.' },
  { title: 'Pay monthly if you want', desc: 'Edgewonk bills the full term upfront. FreeTradeJournal has a monthly option, so you can start small and cancel whenever you like.' },
  { title: 'AI coaching, not just statistics', desc: 'Edgewonk gives you statistics to interpret yourself. FreeTradeJournal\'s AI reads your trades and journal entries and tells you in plain English what is working, what is not, and what to do about it.' },
  { title: 'Prop-firm tracking built in', desc: 'PropTracker monitors evaluation progress, drawdown limits, and daily loss across FTMO, Apex, Topstep, and other firms. Edgewonk does not treat funded-account tracking as a dedicated feature.' },
  { title: 'News and economic calendar included', desc: 'Market news and an economic calendar sit next to your journal, so you can flag which trades happened into red-folder events.' },
];

const OTHER_WINS = [
  { title: 'Depth of custom statistics', desc: 'Edgewonk is built for traders who want to slice their data every possible way — dozens of built-in statistics plus custom stat slots. FreeTradeJournal\'s analytics are deliberately simpler.' },
  { title: 'Emotional analytics depth', desc: 'Edgewonk\'s Tiltmeter is a mature system for tracking discipline and emotional patterns over time. FreeTradeJournal tracks trade emotions, but Edgewonk goes deeper on this specific dimension.' },
  { title: 'A decade of refinement', desc: 'Edgewonk has been around since the mid-2010s and its statistics engine reflects years of trader feedback.' },
];

const FAQS = [
  { question: 'Is FreeTradeJournal really free?', answer: 'Yes. The free plan includes unlimited trade logging, dashboard analytics over your last 30 days, up to 20 journal entries, two trading accounts, CSV/Excel import and export, and 5 AI coaching runs per month (automatic tips and prompts are free). No credit card required. Pro ($12.99/month or $99.99/year) removes the limits and adds cloud sync.' },
  { question: 'How does the price compare to Edgewonk?', answer: 'Edgewonk is $197 paid upfront for a fixed term, with no free version and no monthly option. FreeTradeJournal is free to start, $12.99/month if you want Pro, or $99.99/year — about half Edgewonk\'s price, with a free plan you can use before paying anything.' },
  { question: 'How do I switch from Edgewonk to FreeTradeJournal?', answer: 'Export your trades to CSV — from Edgewonk or directly from your broker — then use FreeTradeJournal\'s CSV import. The column-mapping step handles different export formats, so you do not need to reformat anything by hand.' },
  { question: 'Does FreeTradeJournal track trading psychology like Edgewonk\'s Tiltmeter?', answer: 'You can tag emotions on every trade and journal entry, and the AI coach flags patterns like revenge trading in plain English. Edgewonk\'s Tiltmeter goes deeper on discipline statistics; FreeTradeJournal focuses on telling you what to change rather than charting it.' },
  { question: 'Does FreeTradeJournal sync with my broker automatically?', answer: 'Not yet. Trades come in via CSV or Excel import from any broker, or manual entry. Automatic sync is in development.' },
  { question: 'Can I try Pro before paying?', answer: 'The free plan is the try: use the core journal for as long as you like before deciding. When you want the full feature set, upgrade to Pro and cancel anytime.' },
];

export default function EdgewonkAlternative() {
  return (
    <>
      <SEOMeta />
      <StructuredData />
      <div className="min-h-screen bg-background flex flex-col">

        <MarketingHeader />

        <HeroGeometric
          title1="Edgewonk Alternative"
          title2="(2026)"
          subtitle="Edgewonk is $197 upfront with no free version. FreeTradeJournal starts at free. Here's an honest comparison."
          compact
          showCTA={false}
        />

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">The short version</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Answers,<br />
                <span className="text-amber-500">not just statistics.</span>
              </h2>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Edgewonk is the statistician's trading journal. It gives you dozens of statistics, custom metrics, and its Tiltmeter discipline tracker — powerful if you enjoy digging through data yourself. It costs $197 paid upfront for a fixed term, with no free version and no monthly billing.
              </p>
              <p>
                FreeTradeJournal takes the opposite approach: a free plan you can use forever, a $12.99/month Pro tier, and an AI coach that reads your trades and tells you directly what is working and what is not — instead of leaving the interpretation to you. Prop-firm evaluation tracking is built in.
              </p>
              <p>
                Which one fits depends on how you like to work. Here is the honest breakdown.
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
                <span className="text-amber-500">vs Edgewonk.</span>
              </h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3 min-w-[10rem]"></th>
                    <th className="text-left font-semibold text-amber-500 px-4 py-3 min-w-[12rem]">FreeTradeJournal</th>
                    <th className="text-left font-semibold text-foreground px-4 py-3 min-w-[12rem]">Edgewonk</th>
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
            <p className="text-xs text-muted-foreground mt-3">Edgewonk pricing from edgewonk.com, August 2026. Check their site for current rates.</p>
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
                <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-4">Where Edgewonk is still ahead</p>
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
              <Link to="/tradersync-alternative">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm px-4">
                  TraderSync alternative
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <FAQSection
          faqs={FAQS}
          title="Switching from Edgewonk"
          subtitle="Common questions about moving your journal and what FreeTradeJournal does and does not do"
          id="faq-structured-data-edgewonk-alternative"
        />

        <Footer7 {...footerConfig} />
      </div>
    </>
  );
}
