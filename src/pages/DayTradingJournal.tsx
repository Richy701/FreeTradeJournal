import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { Footer7 } from '@/components/ui/footer-7';
import { footerConfig } from '@/components/ui/footer-config';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { ArrowRight, X, Clock, Brain, BarChart3, AlertTriangle, FileDown, Infinity } from 'lucide-react';

const FEATURES = [
  {
    icon: <Clock className="h-5 w-5" />,
    title: 'Session Tracking',
    desc: 'Log every scalp and intraday trade with timestamps. See your P&L broken down by morning, midday, and afternoon sessions to find your best trading hours.',
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: 'Overtrading Detection',
    desc: 'Track your trade count per day. Set a daily max trade limit as a goal and see at a glance when you are exceeding it. Break the revenge-trading cycle.',
  },
  {
    icon: <Brain className="h-5 w-5" />,
    title: 'AI Trade Review',
    desc: 'Get AI-powered feedback on each trade — entry timing, risk/reward, and whether the setup matched your strategy. Pro feature with 14-day free trial.',
  },
  {
    icon: <FileDown className="h-5 w-5" />,
    title: 'CSV Import',
    desc: 'Export your trade history from any broker — Tradovate, MetaTrader 5, NinjaTrader, or TradingView — and import it. Entries, exits, and commissions mapped automatically.',
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Daily P&L Analytics',
    desc: 'Calendar heatmap shows your daily P&L at a glance. Win rate, profit factor, expectancy, max drawdown, equity curve, and consecutive loss streaks.',
  },
  {
    icon: <Infinity className="h-5 w-5" />,
    title: 'Free Forever',
    desc: 'Trade logging, analytics, CSV import, goal tracking, and the calendar heatmap — free, no credit card. Pro adds AI coaching, cloud sync, and advanced exports.',
  },
];

const FAQS = [
  { q: 'Is this good for scalping and quick trades?', a: 'Yes. Every trade logs entry and exit timestamps. You get P&L per trade and can filter by time of day to see which sessions are most profitable.' },
  { q: 'Can I set a daily trade limit?', a: 'Yes. Use the Goals feature to set a maximum number of trades per day. The dashboard shows your progress against the limit so you catch overtrading early.' },
  { q: 'What brokers can I import from?', a: 'Any broker that exports CSV. The parser handles Tradovate, MetaTrader 5, NinjaTrader, and generic CSV formats. Entry, exit, quantity, and commissions are mapped automatically.' },
  { q: 'How does the AI trade review work?', a: 'Select any trade and the AI analyzes your entry, exit, risk/reward, and whether the setup matched your tagged strategy. It gives specific feedback, not generic advice. This is a Pro feature with a 14-day free trial.' },
  { q: 'Does the calendar heatmap show daily totals?', a: 'Yes. Each day is color-coded by net P&L. Green for profitable days, red for losing days. Click any day to see the individual trades.' },
  { q: 'Is this actually free?', a: 'Yes. Trade logging, analytics, CSV import, goal tracking, and the calendar heatmap are free forever. No credit card. Pro adds AI coaching, cloud sync, and exports.' },
];

export default function DayTradingJournal() {
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const sd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(sd);
    script.id = 'faq-structured-data-day-trading';
    document.getElementById('faq-structured-data-day-trading')?.remove();
    document.head.appendChild(script);
    return () => { document.getElementById('faq-structured-data-day-trading')?.remove(); };
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
          title1="Log Every Scalp,"
          title2="Fix Every Mistake"
          subtitle="The free day trading journal that tracks your intraday P&L, catches overtrading, and shows exactly which sessions make you money. Import from any broker CSV."
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
                alt="FreeTradeJournal day trading dashboard showing daily P&L heatmap, win rate, and trade analytics"
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
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 sm:p-8" onClick={() => setLightboxOpen(false)}>
            <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2" onClick={() => setLightboxOpen(false)} aria-label="Close">
              <X className="h-6 w-6" />
            </button>
            <img src="/images/screenshots/trading-dashboard-screenshot.png" alt="FreeTradeJournal day trading dashboard" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        <section className="py-24 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/50 pb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">What you get</p>
                <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                  Every scalp logged.<br />
                  <span className="text-amber-500">Every pattern visible.</span>
                </h2>
              </div>
              <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                Track your intraday trades, spot overtrading, and find your most profitable sessions.
              </p>
            </div>

            <div className="divide-y divide-border/40">
              {FEATURES.map((f, i) => (
                <div key={f.title} className="flex items-start gap-6 py-5 group">
                  <span className="text-[11px] font-mono text-amber-500/50 pt-0.5 w-6 shrink-0 select-none">{String(i + 1).padStart(2, '0')}</span>
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
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm px-4" onClick={() => { enterDemoMode(); navigate('/dashboard'); }}>
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
                  <span className="text-[11px] font-mono text-amber-500/50 pt-0.5 w-6 shrink-0 select-none">{String(i + 1).padStart(2, '0')}</span>
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
