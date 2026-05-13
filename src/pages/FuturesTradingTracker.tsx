import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { Footer7 } from '@/components/ui/footer-7';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { ArrowRight, X, BarChart3, Calculator, FileDown, LineChart, Building2, Infinity } from 'lucide-react';

const FEATURES = [
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Contract Logging',
    desc: 'Log ES, NQ, CL, GC, and any futures contract — direction, entry and exit price, number of contracts, commission, and timestamps.',
  },
  {
    icon: <Calculator className="h-5 w-5" />,
    title: 'P&L Calculation',
    desc: 'Dollar P&L calculated from your entry, exit, quantity, and commissions. Results feed into your dashboard metrics automatically.',
  },
  {
    icon: <FileDown className="h-5 w-5" />,
    title: 'CSV Import',
    desc: 'Export your order history from Tradovate or MetaTrader 5 as CSV and import it. The parser matches fills and calculates P&L per round trip.',
  },
  {
    icon: <LineChart className="h-5 w-5" />,
    title: 'Full Analytics',
    desc: 'Win rate, profit factor, expectancy, max drawdown, largest and average win/loss, consecutive loss streaks, calendar heatmap, and equity curve.',
  },
  {
    icon: <Building2 className="h-5 w-5" />,
    title: 'Multi-Account',
    desc: 'Separate accounts for each broker or account type — live, demo, funded. Each has its own trade log, starting balance, and performance metrics.',
  },
  {
    icon: <Infinity className="h-5 w-5" />,
    title: 'Free Forever',
    desc: 'Trade logging, P&L calculations, analytics, CSV import, goal tracking, and the calendar heatmap — free, no credit card. Pro adds AI analysis, cloud sync, and exports.',
  },
];

const FAQS = [
  { q: 'What do I log for each trade?', a: 'Contract symbol (ES, NQ, CL, GC, etc.), direction, entry and exit price, number of contracts, commission, and timestamps. Add notes, tag a strategy, attach chart screenshots.' },
  { q: 'How does P&L calculation work?', a: 'Enter your entry price, exit price, and quantity. The journal calculates dollar P&L using the contract\'s point multiplier minus your commissions. Results feed into your dashboard automatically.' },
  { q: 'Can I import from Tradovate or MT5?', a: 'Yes. Export your order history as CSV and import it. The parser matches opening and closing fills by contract and calculates P&L per round trip.' },
  { q: 'What analytics do I get?', a: 'Win rate, profit factor, expectancy, max drawdown, largest and average win/loss, consecutive loss streaks, calendar heatmap, and equity curve.' },
  { q: 'Can I track multiple accounts?', a: 'Yes. Create separate accounts for each broker or account type (live, demo, funded). Each has its own trade log, starting balance, and performance metrics.' },
  { q: 'Is the futures tracker free?', a: 'Yes. Trade logging, P&L calculations, analytics, CSV import, goal tracking, and the calendar heatmap are free forever. No credit card. Pro adds AI analysis, cloud sync, and exports.' },
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

        <Footer7
          logo={{ url: "/", src: "", alt: "FreeTradeJournal Logo", title: "FreeTradeJournal" }}
          description="Track every trade, spot what's working, and build consistency — with professional analytics, journaling, and performance tools. Free forever, no credit card required."
          sections={[
            {
              title: "Product",
              links: [
                { name: "Features", href: "/#features" },
                { name: "Pricing", href: "/pricing" },
                { name: "Documentation", href: "/documentation" },
                { name: "Changelog", href: "/changelog" },
                { name: "Blog", href: "https://blog.freetradejournal.com" },
              ],
            },
            {
              title: "Trading Tools",
              links: [
                { name: "Forex Trading Journal", href: "/forex-trading-journal" },
                { name: "Futures Trading Tracker", href: "/futures-trading-tracker" },
                { name: "Prop Firm Dashboard", href: "/prop-firm-dashboard" },
                { name: "Prop Firm ROI Tracker", href: "/prop-tracker" },
              ],
            },
            {
              title: "Legal",
              links: [
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms & Conditions", href: "/terms" },
                { name: "Cookie Policy", href: "/cookie-policy" },
              ],
            },
          ]}
          socialLinks={[
            {
              icon: <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
              href: "https://x.com/richytiup",
              label: "Follow on X",
            },
          ]}
          copyright="&copy; 2026 FreeTradeJournal. All rights reserved."
          legalLinks={[]}
        />
      </div>
    </>
  );
}
