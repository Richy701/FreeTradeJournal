import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { SEOMeta } from '@/components/seo-meta';
import { StructuredData } from '@/components/structured-data';
import { AppFooter } from '@/components/app-footer';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { ArrowRight, X, Receipt, Building2, BarChart3, Trophy, TrendingUp, Infinity } from 'lucide-react';

const FEATURES = [
  {
    icon: <Receipt className="h-5 w-5" />,
    title: 'Fee Tracking',
    desc: 'Every eval fee, monthly sub, and reset logged per account — so the total cost is never a mystery.',
  },
  {
    icon: <Building2 className="h-5 w-5" />,
    title: 'Multi-Firm',
    desc: 'FTMO, Apex, TopStep, and 10+ firms in a single view. No more spreadsheets.',
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'True Net P&L',
    desc: 'Real profit after every cost. One number that tells you whether prop trading is working.',
  },
  {
    icon: <Trophy className="h-5 w-5" />,
    title: 'Account Status',
    desc: 'Track every challenge — active, passed, failed, withdrawn. Full history, nothing lost.',
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: 'Payout History',
    desc: 'Every withdrawal visualised by month. See what you\'ve actually taken home.',
  },
  {
    icon: <Infinity className="h-5 w-5" />,
    title: 'Free Forever',
    desc: 'No credit card. No paywall. PropTracker is 100% free — always.',
  },
];

export default function PropTrackerLanding() {
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <SEOMeta image="https://www.freetradejournal.com/images/screenshots/prop-tracker-screenshot.png" />
      <StructuredData />
      <div className="min-h-screen bg-background flex flex-col">

        {/* ── Header ── */}
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

        {/* ── Hero ── */}
        <HeroGeometric
          title1="Track Every Prop Firm Fee,"
          title2="Payout & Account"
          subtitle="After every fee, reset, and failed challenge — most prop traders are guessing their real P&L. PropTracker shows you the exact number, across every firm, free."
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
                onClick={() => { enterDemoMode(); navigate('/prop-tracker'); }}
              >
                Try Live Demo
              </Button>
            </>
          }
        />

        {/* ── Screenshot ── */}
        <section className="pb-16 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">What it looks like</p>
            <button
              onClick={() => setLightboxOpen(true)}
              className="w-full block rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl shadow-amber-500/5 ring-1 ring-white/5 cursor-zoom-in group relative"
              aria-label="View full screenshot"
            >
              <img
                src="/images/screenshots/prop-tracker-screenshot.png"
                alt="PropTracker dashboard — fees, payouts and net P&L across all prop firms"
                className="w-full h-auto block group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 transition-colors duration-300 flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide">
                  Click to expand
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* ── Lightbox ── */}
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
              src="/images/screenshots/prop-tracker-screenshot.png"
              alt="PropTracker dashboard — fees, payouts and net P&L across all prop firms"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* ── Features ── */}
        <section className="py-24 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">

            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/50 pb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">What you get</p>
                <h2 className="text-4xl sm:text-5xl font-bold leading-[1.1]">
                  Stop guessing.<br />
                  <span className="text-amber-500">Know your real numbers.</span>
                </h2>
              </div>
              <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                Every eval fee, monthly sub, reset, and payout tracked and totalled automatically. One clear number.
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
                onClick={() => { enterDemoMode(); navigate('/prop-tracker'); }}
              >
                Try the live demo first →
              </Button>
            </div>
          </div>
        </section>

        <AppFooter />
      </div>
    </>
  );
}
