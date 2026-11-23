import { SEOMeta } from '@/components/seo-meta';
import { Footer7 } from '@/components/blocks/footer-7';
import { footerConfig } from '@/components/blocks/footer-config';
import { FAQSection } from '@/components/blocks/faq-section';
import { MarketingHeader } from '@/components/marketing-header';
import { HeroGeometric } from '@/components/blocks/shape-landing-hero';
import { ClosingCta } from '@/components/closing-cta';

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

const WHO_FTJ = [
  { title: 'You trade forex or futures', desc: 'FreeTradeJournal is built first for forex and futures traders. The analytics, PropTracker, and AI coaching are oriented around these instruments. TraderSync has stronger depth for stock and options traders.' },
  { title: 'You want a free plan that actually exists', desc: 'TraderSync discontinued its free Basic plan. The only way in now is a paid subscription after a 7-day trial. FreeTradeJournal\'s free plan is permanent — log trades, run analytics, and get AI coaching with no expiry and no card.' },
  { title: 'You need AI without paying for Premium', desc: 'On TraderSync, AI features start at the $49.95/month Premium tier. On FreeTradeJournal, AI trade reviews and journal coaching are on every plan — including 20 free analyses per month on the free one.' },
  { title: 'You trade prop firm evaluations', desc: 'PropTracker tracks your drawdown, daily loss limit, and evaluation progress per firm in real time. FTMO, Apex, Topstep, and other major firms are supported. TraderSync has no equivalent dedicated tool for funded account traders.' },
];

const WHO_TRADERSYNC = [
  { title: 'You trade stocks or options', desc: 'TraderSync is built for equity and options traders. It has options-specific analytics — spread tracking, greeks, strategy breakdowns — that FreeTradeJournal does not offer. If options are your primary instrument, TraderSync is the stronger fit.' },
  { title: 'Automatic sync across hundreds of brokers is important to you', desc: 'TraderSync connects directly to a large broker list and pulls trades in automatically. FreeTradeJournal uses CSV import — it works with any broker, but it is a manual step after every session. If you trade frequently and find that friction real, TraderSync\'s sync is the better experience.' },
  { title: 'You want market replay for stock trading', desc: 'TraderSync\'s Elite tier includes stock market replay so you can revisit and backtest setups. FreeTradeJournal focuses on journaling, analytics, and coaching — it does not offer replay.' },
];

const SWITCH_STEPS = [
  { step: '01', title: 'Sign up — no card needed', desc: 'Create a free account at FreeTradeJournal. The signup takes about 30 seconds and nothing is gated behind a payment.' },
  { step: '02', title: 'Create a trading account', desc: 'Inside the app, add an account for each broker you trade. Name it after the broker so your analytics stay separated.' },
  { step: '03', title: 'Export from TraderSync or your broker', desc: 'In TraderSync, go to your account settings and export your trade history as a CSV. Alternatively, export directly from your broker — this works just as well and skips the TraderSync step entirely.' },
  { step: '04', title: 'Import the CSV', desc: 'Go to Import Trades and upload the file. The column-mapping step lets you match TraderSync\'s column names to FreeTradeJournal\'s fields — entry price, exit price, size, date, symbol, direction. No reformatting required.' },
  { step: '05', title: 'Your dashboard fills immediately', desc: 'As soon as the import finishes, your analytics, stats, and charts are live. Journal entries from TraderSync cannot be imported automatically but can be re-added manually if you want to bring them across.' },
];

const FAQS = [
  { question: 'Is FreeTradeJournal really free?', answer: 'Yes. The free plan includes unlimited trade logging, dashboard analytics over your last 30 days, up to 20 journal entries, two trading accounts, CSV/Excel import and export, and 20 AI coaching analyses per month. No credit card required. Pro ($12.99/month or $99.99/year) removes the limits and adds cloud sync.' },
  { question: 'How does the price compare to TraderSync?', answer: 'TraderSync is $29.95/month (Pro), $49.95/month (Premium), or $79.95/month (Elite), with no free plan. FreeTradeJournal is free to start, and Pro is $12.99/month or $99.99/year with everything included.' },
  { question: 'Did TraderSync remove its free plan?', answer: 'Yes. TraderSync discontinued its free Basic plan — the only way in now is a paid subscription, with a 7-day trial available. FreeTradeJournal\'s free plan is permanent with no expiry.' },
  { question: 'What tier do I need for AI on TraderSync?', answer: 'TraderSync\'s AI features start on the Premium tier at $49.95/month. On FreeTradeJournal, AI trade reviews and coaching are included on every plan — including 20 free analyses a month on the free plan.' },
  { question: 'How do I switch from TraderSync to FreeTradeJournal?', answer: 'Sign up at FreeTradeJournal (no card required), then create a trading account for each broker you use. Export your trades from TraderSync or directly from your broker as a CSV. Upload the file in FreeTradeJournal\'s Import Trades section — the column-mapping step matches your column names to the right fields automatically. Your dashboard populates as soon as the import finishes.' },
  { question: 'Can I keep my trade history when I switch?', answer: 'Yes. Any broker or platform that can export a CSV will work with FreeTradeJournal\'s import. Export from TraderSync or go directly to your broker — either way, the full trade history comes across and your analytics calculate immediately.' },
  { question: 'Does FreeTradeJournal sync with my broker automatically?', answer: 'Not yet. Trades come in via CSV or Excel import from any broker, or manual entry. Automatic sync is in development.' },
  { question: 'I trade stocks and options — is FreeTradeJournal right for me?', answer: 'You can log any instrument, but the analytics are built first for forex and futures. If you need options-specific analytics like spread tracking, TraderSync is honestly the stronger fit today.' },
  { question: 'Does FreeTradeJournal work for prop firm traders?', answer: 'Yes — this is where it is strongest. PropTracker tracks evaluation progress, drawdown, and daily loss limits across FTMO, Apex, Topstep, and other firms, alongside your journal and analytics.' },
  { question: 'Can I try Pro before paying?', answer: 'The free plan is the try: use the core journal for as long as you like before deciding. When you want the full feature set, upgrade to Pro and cancel anytime.' },
];

export default function TradersyncAlternative() {
  return (
    <>
      <SEOMeta />
      <div className="min-h-screen bg-background flex flex-col">

        <MarketingHeader />

        <HeroGeometric
          title1="TraderSync Alternative"
          title2="(2026)"
          subtitle="TraderSync starts at $29.95/month with no free plan. FreeTradeJournal starts at free. Here's an honest comparison."
          compact
          showCTA={false}
        />

        <section className="py-16 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">The short version</p>
              <h2 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-tight">
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

        <section className="py-16 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Side by side</p>
              <h2 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-tight">
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

        <section className="py-16 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Who should choose what</p>
              <h2 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-tight">
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
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">TraderSync is the better fit if</p>
                <div className="divide-y divide-border/40">
                  {WHO_TRADERSYNC.map((item, i) => (
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

        <section className="py-16 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">The honest breakdown</p>
              <h2 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-tight">
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
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-10 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">How to switch</p>
              <h2 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-tight">
                Moving from TraderSync<br />
                <span className="text-amber-500">takes about five minutes.</span>
              </h2>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed mb-10">
              <p>
                Your trade data comes with you. Export from TraderSync or directly from your broker — the import handles both. Journal entries cannot be imported automatically but can be re-added manually if you want them.
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
                { label: 'Edgewonk alternative', to: '/edgewonk-alternative' },
              ]}
            />
          </div>
        </section>

        <FAQSection compact
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
