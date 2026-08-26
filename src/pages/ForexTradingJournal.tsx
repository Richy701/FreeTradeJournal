import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { Footer7 } from '@/components/blocks/footer-7';
import { footerConfig } from '@/components/blocks/footer-config';
import { MarketingHeader } from '@/components/marketing-header';
import { HeroGeometric } from '@/components/blocks/shape-landing-hero';
import { ArrowRight, CurrencyDollar, Calculator, ChartBar, Buildings, Infinity, FileArrowDown } from '@phosphor-icons/react';
import { ImageLightbox } from '@/components/ui/image-lightbox';

const FEATURES = [
  {
    icon: <CurrencyDollar className="h-5 w-5" />,
    title: 'Pair Logging',
    desc: 'Log every forex trade — symbol, direction, entry and exit price, lot size, commission, and timestamps. Add notes, tag a strategy, attach chart screenshots.',
  },
  {
    icon: <Calculator className="h-5 w-5" />,
    title: 'Pip Calculation',
    desc: 'Standard pairs and yen pairs detected automatically. Pip P&L calculated from your lot size — no manual math.',
  },
  {
    icon: <FileArrowDown className="h-5 w-5" />,
    title: 'CSV Import',
    desc: 'Export your trade history from MetaTrader 5 or Tradovate and import it. Entry/exit prices, lot sizes, commissions, and dates mapped automatically.',
  },
  {
    icon: <ChartBar className="h-5 w-5" />,
    title: 'Full Analytics',
    desc: 'Win rate, profit factor, expectancy, max drawdown, largest and average win/loss, consecutive loss streaks, calendar heatmap, and equity curve. Free covers your last 30 days; Pro keeps the whole history.',
  },
  {
    icon: <Buildings className="h-5 w-5" />,
    title: 'Multi-Account',
    desc: 'Separate accounts for different brokers or account types — live, demo, funded. Each one tracks its own trades, balance, and metrics. Free covers two accounts; Pro removes the limit.',
  },
  {
    icon: <Infinity className="h-5 w-5" />,
    title: 'Free Forever',
    desc: 'Trade logging, CSV import, goal tracking, and the calendar heatmap are free with no card and no cap on how many trades you log. Pro adds full analytics history, AI analysis, and cloud sync.',
  },
];

// Steps a trader actually takes, in order. Deliberately not a restatement of
// FEATURES — the old FAQ duplicated that grid almost verbatim, which gave the
// page two copies of ~200 words instead of real depth.
const LOGGING_STEPS = [
  {
    title: 'Pick the pair and direction',
    desc: 'Choose what you traded and whether you went long or short. Majors, minors, and crosses all behave the same way, and a pair the app has not seen before can be typed in free-hand.',
  },
  {
    title: 'Enter your prices',
    desc: 'Entry and exit go in at full forex precision. EUR/USD keeps all five decimals and USD/JPY keeps its three, so a trade is never quietly rounded to two places and re-scored as something it was not.',
  },
  {
    title: 'Add size and costs',
    desc: 'Lot size, commission, and swap. Costs are held separately from gross profit and subtracted, so the figure that lands in your journal is the money that actually reached your account.',
  },
  {
    title: 'Write down why you took it',
    desc: 'Tag the strategy, note what you saw in the chart, and record how you felt entering. Attach the screenshot while it is still fresh. This is the part that makes the review worth doing later.',
  },
];

// Every item here is behaviour the CSV parser genuinely has — same list the
// MT4/MT5 blog post documents. Do not add to it without checking the parser.
const IMPORT_HANDLES = [
  {
    title: 'The MT5 preamble',
    desc: 'MetaTrader 5 buries the real column header under rows of account information. The importer finds it instead of giving up on the file.',
  },
  {
    title: 'European number formats',
    desc: 'Dates written 2025.08.28 or 28.08.2025, semicolon-separated columns, and comma decimals are all recognised. A loss written as −123,45 imports as a loss, not a gain.',
  },
  {
    title: 'Commission and swap',
    desc: 'Both are read as their own values and subtracted rather than folded into gross profit. Journalling gross numbers overstates your edge by exactly your costs.',
  },
  {
    title: 'Forex precision',
    desc: 'Five decimals are preserved on standard pairs and three on yen pairs, so your entry reads 1.08523 rather than 1.09.',
  },
];

const FAQS = [
  { q: 'Does it work with MT4, or only MT5?', a: 'Both. MT5 exports position history straight from the Toolbox History tab. For MT4, use Account History and save the report. Either way you are importing a file, so there is no plugin or expert advisor to install.' },
  { q: 'Which brokers can I import from?', a: 'Any broker that lets you download your history as CSV, which is effectively all of them. MetaTrader exports work directly, and broker client areas such as IC Markets and Pepperstone give you the same thing. Tradovate is supported for futures.' },
  { q: 'How are yen pairs handled?', a: 'USD/JPY and other yen crosses are detected on their own and priced at three decimals with a pip counted at the second, rather than being forced through the same rule as EUR/USD. You do not have to flag them.' },
  { q: 'Is swap tracked separately from commission?', a: 'Yes. They are stored as distinct values on the trade and both come off your gross result, so you can see how much of a position was eaten by holding it overnight.' },
  { q: 'Does it work on my phone?', a: 'Yes. It runs in the browser on desktop and mobile with nothing to download, so you can log a trade from your phone and review it properly later on a bigger screen.' },
  { q: 'What do I get without paying?', a: 'Unlimited trade logging, CSV import and export, goals, risk rules, the full calendar heatmap, and up to two trading accounts, with no card required. Dashboard analytics cover your last 30 days on the free plan; Pro opens the full history and adds AI analysis and cloud sync.' },
  { q: 'What happens to my trades if I stop paying?', a: 'Nothing is deleted. Your trade log stays complete and exportable, and the calendar heatmap still shows everything. The dashboard analytics window returns to the last 30 days.' },
  { q: 'Do I have to sign up to look around?', a: 'No. The live demo opens the whole interface with sample trades loaded, so you can see the analytics and the import flow before deciding whether to create anything.' },
];

export default function ForexTradingJournal() {
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const sd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(sd);
    script.id = 'faq-structured-data-forex';
    document.getElementById('faq-structured-data-forex')?.remove();
    document.head.appendChild(script);
    return () => { document.getElementById('faq-structured-data-forex')?.remove(); };
  }, []);

  return (
    <>
      <SEOMeta />
      <StructuredData />
      <div className="min-h-screen bg-background flex flex-col">

        <MarketingHeader />

        <HeroGeometric
          title1="Track Every Pip,"
          title2="Improve Every Trade"
          subtitle="Log your forex trades with automatic pip calculation, full analytics, and MT5/Tradovate import. See what's working, cut what isn't — free."
          compact
          cta={
            <>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] motion-reduce:animate-none text-black font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-[transform,box-shadow] duration-300 w-auto min-w-[160px] sm:min-w-[200px]">
                  Start Journaling Free
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
                src="/images/screenshots/trading-dashboard-screenshot.png"
                alt="FreeTradeJournal forex trading dashboard — P&L tracking, win rate, and equity curve for currency pairs"
                className="w-full h-auto block group-hover:scale-[1.01] transition-transform duration-500"
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
          src="/images/screenshots/trading-dashboard-screenshot.png"
          alt="FreeTradeJournal forex trading dashboard — P&L tracking, win rate, and equity curve for currency pairs"
        />

        <section className="py-24 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">

            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/50 pb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">What you get</p>
                <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                  Every pip tracked.<br />
                  <span className="text-amber-500">Every edge visible.</span>
                </h2>
              </div>
              <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                Log trades, import from MT5 or Tradovate, and get the analytics you need to trade better.
              </p>
            </div>

            <div className="divide-y divide-border/40">
              {FEATURES.map((f, i) => (
                <div key={f.title} className="flex items-start gap-6 py-5 group">
                  <span className="text-[11px] font-mono text-amber-500/50 pt-0.5 w-6 shrink-0 select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-10 flex-1 min-w-0">
                    <div className="flex items-center gap-3 sm:w-44 shrink-0">
                      <span className="text-amber-500">{f.icon}</span>
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
                  Start Journaling Free
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

        <section className="py-24 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">

            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/50 pb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Logging a trade</p>
                <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                  Four fields in.<br />
                  <span className="text-amber-500">One honest record out.</span>
                </h2>
              </div>
              <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                A forex trade carries costs and decimal places that most journals flatten. These are the parts that decide whether the number you review later is true.
              </p>
            </div>

            <div className="divide-y divide-border/40">
              {LOGGING_STEPS.map((s, i) => (
                <div key={s.title} className="flex items-start gap-6 py-5">
                  <span className="text-[11px] font-mono text-amber-500/50 pt-0.5 w-6 shrink-0 select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-10 flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:w-44 shrink-0">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">

            <div className="mb-8 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">MetaTrader import</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                Export the file.<br />
                <span className="text-amber-500">Drop it in.</span>
              </h2>
            </div>

            <div className="space-y-4 mb-10 max-w-3xl">
              <p className="text-sm text-muted-foreground leading-relaxed">
                In MT5, open the Toolbox, go to the History tab, right-click and choose Positions, then right-click again to export. You get one row per closed position, which is exactly what a journal wants. In MT4, use the Account History tab and save the report. Most broker client areas — IC Markets and Pepperstone among them — will hand you the same history as a CSV if you would rather go that route.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                There is no plugin, no expert advisor, and nothing to install on either side. MetaTrader exports are famously awkward files, so the importer is built for how they actually arrive rather than how they ought to look:
              </p>
            </div>

            <div className="divide-y divide-border/40">
              {IMPORT_HANDLES.map((h, i) => (
                <div key={h.title} className="flex items-start gap-6 py-5">
                  <span className="text-[11px] font-mono text-amber-500/50 pt-0.5 w-6 shrink-0 select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-10 flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:w-44 shrink-0">{h.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mt-10 max-w-3xl">
              If a column layout is not recognised, you map it once in the import dialog and the mapping is remembered for the next export from that broker.
            </p>
          </div>
        </section>

        <section className="py-24 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">

            <div className="mb-8 border-b border-border/50 pb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Reading your results</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                The pairs you think<br />
                <span className="text-amber-500">make you money.</span>
              </h2>
            </div>

            <div className="space-y-4 max-w-3xl">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Most traders can name their best pair and are wrong about it. Once your history is in, the breakdown by symbol settles the argument: win rate, average winner against average loser, and net result per pair, with costs already taken out. It is common to find that one pair has been quietly funding the losses on another for months.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Session analysis does the same thing to your clock. London, New York, Tokyo, and Sydney are scored separately, so a strategy that works in one session and bleeds in another stops being hidden inside a single blended win rate. The calendar heatmap puts every day on one screen, which is usually where a run of revenge trading becomes obvious in a way it never is trade by trade.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Underneath that sit the numbers you would expect: profit factor, expectancy, max drawdown, largest and average win and loss, consecutive loss streaks, and an equity curve. Free accounts see this for the last 30 days. Pro opens the full history — though your trade log, exports, and calendar heatmap always cover everything you have logged, on either plan.
              </p>
            </div>
          </div>
        </section>

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
