import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { SEOMeta } from '@/components/seo-meta';
import { Footer7 } from '@/components/blocks/footer-7';
import { footerConfig } from '@/components/blocks/footer-config';
import { MarketingHeader } from '@/components/marketing-header';
import { HeroGeometric } from '@/components/blocks/shape-landing-hero';
import { ArrowRight, ChartBar, Calculator, FileArrowDown, ChartLineUp, Buildings, Infinity } from '@phosphor-icons/react';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { FUTURES_CONTRACTS } from '@/constants/contract-specs';

// Lazy so the post markdown stays out of this page's chunk.
const BlogStrip = lazy(() => import('@/components/blog-strip').then((m) => ({ default: m.BlogStrip })));

const FEATURES = [
  {
    icon: <ChartBar className="h-5 w-5" />,
    title: 'Contract logging',
    desc: 'Log ES, NQ, CL, GC, the micros, and any other contract: direction, entry and exit price, number of contracts, commission, and the open and close times. Add notes, a strategy, tags and a chart screenshot.',
  },
  {
    icon: <Calculator className="h-5 w-5" />,
    title: 'Dollar P&L from the contract',
    desc: 'The journal knows the point value of every CME contract it recognises, so a 10-point NQ move on two contracts is $400 before commission, not "10". Commission is subtracted so the number you review is the number that hit your account.',
  },
  {
    icon: <FileArrowDown className="h-5 w-5" />,
    title: 'Tradovate, NinjaTrader, TopstepX and Rithmic import',
    desc: 'Drop the export in. Fills are paired into completed trades, partial exits and reversals are handled, and the per-fill commission is carried onto each trade. Expiry codes like MNQZ6 or "MNQ 12-26" are read as MNQ.',
  },
  {
    icon: <ChartLineUp className="h-5 w-5" />,
    title: 'Analytics built for intraday',
    desc: 'Win rate, profit factor, average win against average loss, drawdown, streaks, a calendar heatmap, an equity curve, and P&L by hour of the day and by session. Free covers your last 30 days; Pro keeps the whole history.',
  },
  {
    icon: <Buildings className="h-5 w-5" />,
    title: 'Evaluation and funded accounts side by side',
    desc: 'Separate accounts for each firm and stage, each with its own trade log, starting balance and stats. PropTracker holds the daily loss limit and trailing drawdown so you can see how much room is left before the next session.',
  },
  {
    icon: <Infinity className="h-5 w-5" />,
    title: 'Free to start, no card',
    desc: 'Trade logging, P&L, imports, goals and the calendar are free with no cap on trades. The free plan covers two accounts and the last 30 days of dashboard analytics. Pro adds full history, unlimited accounts, AI review and cloud sync.',
  },
];

const IMPORT_STEPS: { platform: string; steps: string[] }[] = [
  {
    platform: 'Tradovate',
    steps: [
      'Open Reports and export the Orders report, or the Performance report if you prefer one row per round trip.',
      'Drop the file onto the Trade Log. Fills are paired into trades and the preview shows what was found.',
      'Leave the account\'s broker time zone on "Same as this device". Tradovate files carry the time you saw on screen.',
    ],
  },
  {
    platform: 'NinjaTrader',
    steps: [
      'Open the Executions tab, right-click and export. The Trade Performance export works too.',
      'Drop the file in. Partial exits and reversals are paired correctly and each fill\'s commission lands on its trade.',
      'Contract names like "MNQ 12-26" are read as MNQ, so the point value is right without renaming anything.',
    ],
  },
  {
    platform: 'TopstepX and Rithmic',
    steps: [
      'Export the trade or fill history as CSV from the platform.',
      'Drop it in. If the layout is new to the importer, a mapping dialog lets you match the columns once.',
      'Check the preview times against your platform before you confirm. If the account\'s time zone would put a trade in the future, the import stops and tells you.',
    ],
  },
];

const FAQS = [
  { q: 'Which futures platforms can I import from?', a: 'Tradovate (Orders or Performance report), NinjaTrader (Executions tab or Trade Performance), TopstepX and Rithmic CSV exports, and any other broker CSV through the column mapping dialog. You can also upload a screenshot of your closed trades if a platform has no export.' },
  { q: 'How is futures P&L calculated?', a: 'From the contract\'s point value. ES is $50 a point, NQ $20, MNQ $2, CL $1,000, GC $100, and so on for every contract in the table above. The journal multiplies the price move by that value and the number of contracts, then subtracts commission. If a file already carries realised P&L, that figure is used instead.' },
  { q: 'Does it handle micro contracts?', a: 'Yes. MES, MNQ, MYM, M2K, MCL, MGC and SIL each have their own point value, so a micro trade is never scaled as if it were the full-size contract.' },
  { q: 'Why do my imported trades show the wrong time?', a: 'Broker files carry a clock but not a time zone. Each account has a broker time zone setting; for Tradovate and NinjaTrader leave it on "Same as this device". Picking US Central because your firm is in Chicago shifts every trade by hours unless your platform actually displays Chicago time.' },
  { q: 'Can I track a Topstep or Apex evaluation?', a: 'Yes. Add the account, set the daily loss limit, trailing drawdown and profit target in PropTracker, and the page shows how much room you have before the next session. Every evaluation fee, reset and payout is logged so you know what each firm has actually cost you.' },
  { q: 'Is the futures journal free?', a: 'Free to start, with no credit card. Trade logging, P&L, imports, goals and the calendar heatmap have no cap on trades. The free plan covers two accounts and the last 30 days of dashboard analytics. Pro removes those limits and adds AI review and cloud sync. Nothing is ever deleted on either plan.' },
];

function perPoint(tickSize: number, tickValue: number) {
  const v = tickValue / tickSize;
  return v >= 1 ? `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : `$${v.toFixed(2)}`;
}

export default function FuturesTradingTracker() {
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const sd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(sd);
    script.id = 'faq-structured-data-futures';
    document.getElementById('faq-structured-data-futures')?.remove();
    document.head.appendChild(script);
    return () => { document.getElementById('faq-structured-data-futures')?.remove(); };
  }, []);

  const groups = Array.from(new Set(FUTURES_CONTRACTS.map((c) => c.group)));

  return (
    <>
      <SEOMeta />
      <div className="min-h-screen bg-background flex flex-col">

        <MarketingHeader />

        <HeroGeometric
          title1="Free Futures Trading Journal"
          title2="for ES, NQ, CL and GC"
          subtitle="Log every contract with real dollar P&L, import from Tradovate, NinjaTrader or TopstepX, and see which hours and sessions actually pay you. Free, no credit card."
          compact
          cta={
            <>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] motion-reduce:animate-none text-black font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-[transform,box-shadow] duration-300 w-auto min-w-[160px] sm:min-w-[200px]">
                  Start Tracking Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base text-foreground shadow-md hover:shadow-lg hover:scale-[1.02] transition-[transform,box-shadow] duration-300 w-auto min-w-[160px] sm:min-w-[200px] border-2 border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/10"
                onClick={() => { enterDemoMode(); navigate('/dashboard'); }}
              >
                Try Live Demo
              </Button>
            </>
          }
        />

        <section className="pb-16 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">What it looks like</p>
            <button
              onClick={() => setLightboxOpen(true)}
              className="w-full block rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl shadow-amber-500/5 ring-1 ring-white/5 cursor-zoom-in group relative"
              aria-label="View full screenshot"
            >
              <img
                src="/images/screenshots/trading-log-screenshot.png"
                alt="FreeTradeJournal trade log with futures and forex trades, entry and exit prices, size and P&L per trade"
                className="w-full h-auto block group-hover:scale-[1.01] transition-transform duration-500"
                width={3388}
                height={2262}
              />
              <div className="absolute inset-0 bg-transparent transition-colors duration-300 flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide">
                  Click to expand
                </span>
              </div>
            </button>
          </div>
        </section>

        <ImageLightbox
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          src="/images/screenshots/trading-log-screenshot.png"
          alt="FreeTradeJournal trade log with futures and forex trades, entry and exit prices, size and P&L per trade"
        />

        <section className="py-24 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">

            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/50 pb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">What you get</p>
                <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                  Every tick counted.<br />
                  <span className="text-amber-500">Every contract covered.</span>
                </h2>
              </div>
              <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                Built for the way futures day traders actually work: many fills, micro and full-size contracts, and a prop firm rule book in the background.
              </p>
            </div>

            <div className="divide-y divide-border/40">
              {FEATURES.map((f, i) => (
                <div key={f.title} className="flex items-start gap-6 py-5 group">
                  <span className="text-[11px] font-mono text-amber-500/50 pt-0.5 w-6 shrink-0 select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-10 flex-1 min-w-0">
                    <div className="flex items-start gap-3 sm:w-44 shrink-0">
                      <span className="text-amber-500 mt-0.5">{f.icon}</span>
                      <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] motion-reduce:animate-none text-black font-semibold px-8 py-2.5 rounded-lg text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-[transform,box-shadow] duration-300">
                  Start Tracking Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground text-sm px-4"
                onClick={() => { enterDemoMode(); navigate('/dashboard'); }}
              >
                Try the live demo first →
              </Button>
            </div>
          </div>
        </section>

        {/* Contract table: the point values the journal actually uses for P&L */}
        <section className="py-24 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/50 pb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Contract values</p>
                <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                  The numbers behind<br />
                  <span className="text-amber-500">your P&L.</span>
                </h2>
              </div>
              <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                Official CME Group tick sizes and tick values, checked against the exchange contract pages. These are the multipliers the journal and the position size calculator use.
              </p>
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-4 font-semibold">Symbol</th>
                    <th className="py-2 pr-4 font-semibold">Contract</th>
                    <th className="py-2 pr-4 font-semibold text-right">Tick size</th>
                    <th className="py-2 pr-4 font-semibold text-right">Per tick</th>
                    <th className="py-2 font-semibold text-right">Per point</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <>
                      <tr key={`g-${group}`}>
                        <td colSpan={5} className="pt-6 pb-2 text-xs font-semibold uppercase tracking-widest text-amber-500">{group}</td>
                      </tr>
                      {FUTURES_CONTRACTS.filter((c) => c.group === group).map((c) => (
                        <tr key={c.symbol} className="border-t border-border/40">
                          <td className="py-2.5 pr-4 font-mono font-semibold text-foreground">{c.symbol}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{c.name}</td>
                          <td className="py-2.5 pr-4 text-right font-mono text-muted-foreground">{c.tickSize.toLocaleString('en-US', { maximumFractionDigits: 8, useGrouping: false })}</td>
                          <td className="py-2.5 pr-4 text-right font-mono text-foreground">${c.tickValue.toLocaleString('en-US', { maximumFractionDigits: 3 })}</td>
                          <td className="py-2.5 text-right font-mono text-foreground">{perPoint(c.tickSize, c.tickValue)}</td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Trading something not listed, or a broker's CFD version of an index? Set a custom multiplier on the trade and the journal uses that instead. Sizing a trade before you take it? The <Link to="/position-size-calculator" className="text-amber-500 underline underline-offset-2 hover:text-amber-600">position size calculator</Link> uses this same table.
            </p>
          </div>
        </section>

        {/* Import walkthrough per platform */}
        <section className="py-24 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/50 pb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Import</p>
                <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                  From your platform<br />
                  <span className="text-amber-500">to your journal.</span>
                </h2>
              </div>
              <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                Fill-level exports are not a list of trades. Five fills on MNQ become one trade with the real average entry, the real exit and the right size.
              </p>
            </div>

            <div className="grid gap-10 md:grid-cols-3">
              {IMPORT_STEPS.map((p) => (
                <div key={p.platform}>
                  <h3 className="font-semibold text-foreground mb-4">{p.platform}</h3>
                  <ol className="space-y-4">
                    {p.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <span className="text-[11px] font-mono text-amber-500/50 pt-0.5 w-6 shrink-0 select-none">{String(i + 1).padStart(2, '0')}</span>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sessions: where the intraday analytics come from */}
        <section className="py-24 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Sessions and hours</p>
                <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1] mb-6">
                  Find the hours<br />
                  <span className="text-amber-500">that pay you.</span>
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    CME index futures trade almost around the clock, from Sunday evening to Friday afternoon New York time with a daily halt at 5 PM Eastern. Most retail futures traders make or lose their month in a narrow window inside that: the New York cash open, the first hour, or the London overlap.
                  </p>
                  <p>
                    The journal draws your P&L by hour of the day and by session, in your own time zone, using only the hours you actually trade. Asia, London, New York and off hours each get a row, with a switch between P&L, win rate and trade count. It is the fastest way to find out that your 3 PM trades are paying for nothing but the 9:30 ones.
                  </p>
                  <p>
                    The calendar heatmap sits next to it, so a run of red Fridays or a habit of giving back Monday's gains on Tuesday is visible in one glance.
                  </p>
                </div>
              </div>
              <img
                src="/images/screenshots/dashboard-analytics-screenshot.png"
                alt="Time of day and trading sessions charts showing P&L by hour and by session"
                className="w-full rounded-2xl border border-amber-500/20 shadow-2xl shadow-amber-500/5"
                loading="lazy"
                width={3388}
                height={2262}
              />
            </div>
          </div>
        </section>

        {/* Prop firm angle */}
        <section className="py-24 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">
            <div className="mb-8 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Prop firms</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Built with the<br />
                <span className="text-amber-500">rule book in view.</span>
              </h2>
            </div>
            <div className="grid gap-10 md:grid-cols-2">
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Most futures traders on Tradovate or NinjaTrader are there because a prop firm put them there. The journal treats that as the normal case. Each evaluation or funded account is its own account with its own trade log, and PropTracker holds the firm's rules for it: daily loss limit, trailing or static drawdown, profit target and consistency rule.
                </p>
                <p>
                  Every evaluation fee, reset and payout is logged against the account, so after three months you know what Topstep or Apex has actually cost you and paid you, not what the dashboard shows today.
                </p>
              </div>
              <ul className="space-y-3 text-sm">
                <li><Link to="/topstep-trading-journal" className="text-amber-500 hover:text-amber-600 underline underline-offset-2">Topstep trading journal</Link> <span className="text-muted-foreground">for the Combine, with TopstepX import</span></li>
                <li><Link to="/apex-trading-journal" className="text-amber-500 hover:text-amber-600 underline underline-offset-2">Apex trading journal</Link> <span className="text-muted-foreground">for the trailing drawdown, with Tradovate and Rithmic import</span></li>
                <li><Link to="/prop-firm-dashboard" className="text-amber-500 hover:text-amber-600 underline underline-offset-2">Prop firm dashboard</Link> <span className="text-muted-foreground">for drawdown and daily loss across every firm</span></li>
                <li><Link to="/prop-tracker" className="text-amber-500 hover:text-amber-600 underline underline-offset-2">PropTracker</Link> <span className="text-muted-foreground">for fees, resets and payouts per firm</span></li>
              </ul>
            </div>
          </div>
        </section>

        <Suspense fallback={<div className="min-h-[32rem]" aria-hidden="true" />}>
          <BlogStrip
            slugs={['tradovate-ninjatrader-import', 'broker-time-zone-imports', 'tag-your-setups']}
            eyebrow="Guides"
            title={<>Reading for <span className="text-amber-600 dark:text-amber-500">futures traders</span></>}
            subtitle="Import walkthroughs and review habits from the blog, written by the person who builds the journal."
          />
        </Suspense>

        <section className="py-24 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">

            <div className="mb-8 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">FAQ</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Common questions.<br />
                <span className="text-amber-500">Straight answers.</span>
              </h2>
            </div>

            <div className="divide-y divide-border/40">
              {FAQS.map((f, i) => (
                <div key={i} className="flex items-start gap-6 py-5">
                  <span className="text-[11px] font-mono text-amber-500/50 pt-0.5 w-6 shrink-0 select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{f.q}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer7 {...footerConfig} />
      </div>
    </>
  );
}
