import { SEOMeta } from '@/components/seo-meta';
import { Footer7 } from '@/components/blocks/footer-7';
import { footerConfig } from '@/components/blocks/footer-config';
import { FAQSection } from '@/components/blocks/faq-section';
import { MarketingHeader } from '@/components/marketing-header';
import { HeroGeometric } from '@/components/blocks/shape-landing-hero';
import { ClosingCta } from '@/components/closing-cta';

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

const WHO_FTJ = [
  { title: 'You want to try before committing $197', desc: 'Edgewonk has no free plan and no trial — you pay upfront and have 14 days to ask for a refund. FreeTradeJournal\'s free plan has no expiry. Use it for a week, a month, or indefinitely before deciding whether the Pro upgrade is worth it.' },
  { title: 'You want answers, not raw statistics', desc: 'Edgewonk surfaces data for you to interpret. FreeTradeJournal\'s AI reads your journal entries and trade patterns and tells you directly what is hurting your P&L — overtrading after a loss, sizing inconsistency, specific sessions that drag your average down.' },
  { title: 'You trade prop firm evaluations', desc: 'PropTracker is built specifically for FTMO, Apex, Topstep, and other firms. It tracks your drawdown, daily loss limit, and evaluation progress in real time alongside your journal. Edgewonk has no equivalent dedicated tool.' },
  { title: 'You want flexibility on billing', desc: 'Edgewonk charges the full term upfront with no monthly option. FreeTradeJournal is $12.99/month if you want to pay as you go, or $99.99/year — about half Edgewonk\'s annual cost, with no upfront commitment required.' },
];

const WHO_EDGEWONK = [
  { title: 'You want maximum statistical depth', desc: 'Edgewonk is built for traders who want to cut their data every possible way — R multiples, MAE/MFE, custom stat slots, strategy-level breakdowns. If deep quantitative analysis is the point of your journal, Edgewonk goes further than FreeTradeJournal does today.' },
  { title: 'Tracking your psychology is a priority', desc: 'Edgewonk\'s Tiltmeter is a mature, purpose-built system for measuring discipline and emotional consistency across hundreds of trades. FreeTradeJournal lets you tag emotions on each trade and flags patterns via the AI coach, but Edgewonk\'s approach to this specific problem is more developed.' },
  { title: 'You prefer a desktop-first tool', desc: 'Edgewonk works as a desktop application as well as online. If you want something that runs locally without a browser, that is a consideration FreeTradeJournal does not address — it is fully web-based.' },
];

const SWITCH_STEPS = [
  { step: '01', title: 'Sign up — no card needed', desc: 'Create a free account at FreeTradeJournal. The signup takes about 30 seconds and nothing is gated behind a payment.' },
  { step: '02', title: 'Create a trading account', desc: 'Inside the app, add an account for each broker you trade. Name it after the broker so your analytics stay separated.' },
  { step: '03', title: 'Export from Edgewonk or your broker', desc: 'In Edgewonk, use the export option in your account settings to download your trade history as a CSV. Alternatively, export directly from your broker — this works just as well and skips the Edgewonk step entirely.' },
  { step: '04', title: 'Import the CSV', desc: 'Go to Import Trades and upload the file. The column-mapping step lets you match Edgewonk\'s or your broker\'s column names to FreeTradeJournal\'s fields — entry price, exit price, size, date, symbol, direction. No reformatting required.' },
  { step: '05', title: 'Your dashboard fills immediately', desc: 'As soon as the import finishes, your analytics, stats, and charts are live. Journal entries from Edgewonk cannot be imported automatically but can be re-added manually if you want to bring them across.' },
];

const FAQS = [
  { question: 'Is FreeTradeJournal really free?', answer: 'Yes. The free plan includes unlimited trade logging, dashboard analytics over your last 30 days, up to 20 journal entries, two trading accounts, CSV/Excel import and export, and 20 AI coaching analyses per month. No credit card required. Pro ($12.99/month or $99.99/year) removes the limits and adds cloud sync.' },
  { question: 'How does the price compare to Edgewonk?', answer: 'Edgewonk is $197 paid upfront for a fixed term, with no free version and no monthly option. FreeTradeJournal is free to start, $12.99/month if you want Pro, or $99.99/year — about half Edgewonk\'s price, with a free plan you can use before paying anything.' },
  { question: 'Does Edgewonk have a free trial?', answer: 'No. Edgewonk has no free plan and no time-limited trial — you pay $197 upfront and have a 14-day money-back window. FreeTradeJournal has a free plan with no expiry instead, so you can use it as long as you need before deciding.' },
  { question: 'What is the Edgewonk Tiltmeter?', answer: 'The Tiltmeter is Edgewonk\'s discipline-tracking system. It scores your trades against your own defined rules to measure how emotionally consistent your trading is over time. FreeTradeJournal\'s AI coach flags similar patterns — revenge trading, overtrading after a loss — but Edgewonk\'s Tiltmeter is a more structured dedicated tool for this.' },
  { question: 'How do I switch from Edgewonk to FreeTradeJournal?', answer: 'Sign up at FreeTradeJournal (no card required), then create a trading account for each broker you use. Export your trades from Edgewonk or directly from your broker as a CSV. Upload the file in FreeTradeJournal\'s Import Trades section — the column-mapping step matches your column names to the right fields automatically. Your dashboard populates as soon as the import finishes.' },
  { question: 'Can I keep my trade history when I switch?', answer: 'Yes. Any broker or platform that can export a CSV will work with FreeTradeJournal\'s import. Export from Edgewonk or go directly to your broker — either way, the full trade history comes across and your analytics calculate immediately from the imported data.' },
  { question: 'Does FreeTradeJournal track trading psychology like Edgewonk\'s Tiltmeter?', answer: 'You can tag emotions on every trade and journal entry, and the AI coach flags patterns like revenge trading in plain English. Edgewonk\'s Tiltmeter goes deeper on discipline statistics; FreeTradeJournal focuses on telling you what to change rather than charting it.' },
  { question: 'Does FreeTradeJournal sync with my broker automatically?', answer: 'Not yet. Trades come in via CSV or Excel import from any broker, or manual entry. Automatic sync is in development.' },
  { question: 'Does FreeTradeJournal work for prop firm traders?', answer: 'Yes — this is where it is strongest. PropTracker tracks evaluation progress, drawdown, and daily loss limits across FTMO, Apex, Topstep, and other firms, alongside your journal and analytics.' },
  { question: 'Can I try Pro before paying?', answer: 'The free plan is the try: use the core journal for as long as you like before deciding. When you want the full feature set, upgrade to Pro and cancel anytime.' },
];

export default function EdgewonkAlternative() {
  return (
    <>
      <SEOMeta />
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
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Who should choose what</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                The right tool<br />
                <span className="text-amber-500">depends on how you trade.</span>
              </h2>
            </div>

            <div className="space-y-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-4">FreeTradeJournal is the better fit if</p>
                <div className="divide-y divide-border/40">
                  {WHO_FTJ.map((item, i) => (
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
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Edgewonk is the better fit if</p>
                <div className="divide-y divide-border/40">
                  {WHO_EDGEWONK.map((item, i) => (
                    <div key={i} className="flex items-start gap-6 py-5">
                      <span className="text-[11px] font-mono text-muted-foreground/40 pt-0.5 w-6 shrink-0 select-none">{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">How to switch</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Moving from Edgewonk<br />
                <span className="text-amber-500">takes about five minutes.</span>
              </h2>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed mb-10">
              <p>
                Your trade data comes with you. Export from Edgewonk or directly from your broker — the import handles both. Journal entries cannot be imported automatically but can be re-added manually if you want them.
              </p>
            </div>

            <div className="divide-y divide-border/40">
              {SWITCH_STEPS.map((item) => (
                <div key={item.step} className="flex items-start gap-6 py-5">
                  <span className="text-[11px] font-mono text-amber-500/50 pt-0.5 w-6 shrink-0 select-none">{item.step}</span>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <ClosingCta
              title="Try the free plan first"
              subtitle="No credit card. Import your trades and see your stats in minutes."
              primary={{ label: 'Start free', to: '/signup' }}
              related={[
                { label: 'TradeZella alternative', to: '/tradezella-alternative' },
                { label: 'TraderSync alternative', to: '/tradersync-alternative' },
              ]}
            />
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
