import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { Footer7 } from '@/components/ui/footer-7';
import { footerConfig } from '@/components/ui/footer-config';
import { MarketingHeader } from '@/components/marketing-header';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { ArrowRight, X, ChartBar, Calculator, FileArrowDown, ChartLineUp, Buildings, Infinity } from '@phosphor-icons/react';

const FEATURES = [
  {
    icon: <ChartBar className="h-5 w-5" />,
    title: 'Contract Logging',
    desc: 'Log ES, NQ, CL, GC, and any futures contract — direction, entry and exit price, number of contracts, commission, and timestamps.',
  },
  {
    icon: <Calculator className="h-5 w-5" />,
    title: 'P&L Calculation',
    desc: 'Dollar P&L calculated from your entry, exit, quantity, and commissions. Results feed into your dashboard metrics automatically.',
  },
  {
    icon: <FileArrowDown className="h-5 w-5" />,
    title: 'CSV Import',
    desc: 'Export your order history from Tradovate or MetaTrader 5 as CSV and import it. The parser matches fills and calculates P&L per round trip.',
  },
  {
    icon: <ChartLineUp className="h-5 w-5" />,
    title: 'Full Analytics',
    desc: 'Win rate, profit factor, expectancy, max drawdown, largest and average win/loss, consecutive loss streaks, calendar heatmap, and equity curve. Free covers your last 30 days; Pro keeps the whole history.',
  },
  {
    icon: <Buildings className="h-5 w-5" />,
    title: 'Multi-Account',
    desc: 'Separate accounts for each broker or account type — live, demo, funded. Each has its own trade log, starting balance, and performance metrics. Free covers two accounts; Pro removes the limit.',
  },
  {
    icon: <Infinity className="h-5 w-5" />,
    title: 'Free to Start',
    desc: 'Trade logging, P&L calculations, CSV import, goal tracking, and the calendar heatmap are free with no card and no cap on how many trades you log. Free covers two accounts and the last 30 days of analytics. Pro adds full history, AI analysis, and cloud sync.',
  },
];

const FAQS = [
  { q: 'What do I log for each trade?', a: 'Contract symbol (ES, NQ, CL, GC, etc.), direction, entry and exit price, number of contracts, commission, and timestamps. Add notes, tag a strategy, attach chart screenshots.' },
  { q: 'How does P&L calculation work?', a: 'Enter your entry price, exit price, and quantity. The journal calculates dollar P&L using the contract\'s point multiplier minus your commissions. Results feed into your dashboard automatically.' },
  { q: 'Can I import from Tradovate or MT5?', a: 'Yes. Export your order history as CSV and import it. The parser matches opening and closing fills by contract and calculates P&L per round trip.' },
  { q: 'What analytics do I get?', a: 'Win rate, profit factor, expectancy, max drawdown, largest and average win/loss, consecutive loss streaks, calendar heatmap, and equity curve. The free plan computes these over your last 30 days; Pro opens the full history. The calendar heatmap always covers everything you have logged.' },
  { q: 'Can I track multiple accounts?', a: 'Yes. Create separate accounts for each broker or account type (live, demo, funded). Each has its own trade log, starting balance, and performance metrics. The free plan covers two accounts; Pro removes the limit.' },
  { q: 'Is the futures tracker free?', a: 'Free to start, with no credit card. Trade logging, P&L calculations, CSV import, goal tracking, and the calendar heatmap are uncapped. The free plan covers two accounts and the last 30 days of dashboard analytics. Pro removes those limits and adds AI analysis and cloud sync. Nothing is ever deleted — your trade log and exports stay complete on either plan.' },
];

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

  return (
    <>
      <SEOMeta />
      <StructuredData />
      <div className="min-h-screen bg-background flex flex-col">

        <MarketingHeader />

        <HeroGeometric
          title1="Track Every Contract,"
          title2="Sharpen Every Edge"
          subtitle="Log your futures trades with full P&L calculation, analytics, and Tradovate/MT5 import. One dashboard for ES, NQ, CL, GC, and everything else you trade — free."
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
                alt="FreeTradeJournal futures trade log — ES, NQ, CL and GC contracts with P&L and performance metrics"
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

        {lightboxOpen && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 sm:p-8"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src="/images/screenshots/trading-log-screenshot.png"
              alt="FreeTradeJournal futures trade log — ES, NQ, CL and GC contracts with P&L and performance metrics"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

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
                Log trades, import from Tradovate or MT5, and see exactly where your edge is.
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
