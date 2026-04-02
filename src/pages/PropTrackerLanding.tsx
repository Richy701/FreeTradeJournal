import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { SEOMeta } from '@/components/seo-meta';
import { AppFooter } from '@/components/app-footer';
import { ThemeToggle } from '@/components/theme-toggle';
import { BuyMeCoffee } from '@/components/ui/buy-me-coffee';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { ArrowRight, CheckCircle2, Receipt, Building2, BarChart3, Trophy, TrendingUp } from 'lucide-react';

export default function PropTrackerLanding() {
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <SEOMeta />
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
              <BuyMeCoffee username="richy701" variant="outline" size="sm" className="hidden sm:flex" />
            </div>
          </div>
        </header>

        {/* ── Hero — same component as home page, no CTA (we add our own below) ── */}
        <HeroGeometric
          title1="Track Every Prop Firm Fee,"
          title2="Payout & Account"
          subtitle="After every fee, reset, and failed challenge — most prop traders are guessing their real P&L. PropTracker shows you the exact number, across every firm, free."
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
        <section className="py-16 px-6 bg-background">
          <div className="container mx-auto max-w-5xl">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">What it looks like</p>
            <div className="rounded-2xl overflow-hidden border border-border/40 shadow-2xl shadow-black/40">
              <img
                src="/images/screenshots/prop-tracker-screenshot.png"
                alt="PropTracker dashboard — fees, payouts and net P&L across all prop firms"
                className="w-full h-auto block"
              />
            </div>
          </div>
        </section>

        {/* ── What you get ── */}
        <section className="py-20 px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4 leading-tight">
                  Stop guessing.<br />
                  <span className="text-amber-500">Know your real numbers.</span>
                </h2>
                <p className="text-muted-foreground mb-8">
                  Every eval fee, monthly sub, reset, and payout tracked and totalled automatically.
                  One number tells you whether prop trading is actually working.
                </p>
                <div className="space-y-3">
                  {[
                    'One dashboard for all your prop firm accounts',
                    'Net P&L after every fee, reset, and payout',
                    'Full transaction history per account, grouped by month',
                    'Track account status — active, passed, failed, withdrawn',
                    'Works with FTMO, Apex, TopStep, and 10+ firms',
                    'Free forever — no credit card required',
                  ].map(item => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Receipt className="h-5 w-5 text-amber-500" />,    title: 'Fee Tracking',    desc: 'Eval, monthly, and reset fees logged per account.' },
                  { icon: <Building2 className="h-5 w-5 text-amber-500" />,  title: 'Multi-Firm',      desc: 'All your firms in one view.' },
                  { icon: <BarChart3 className="h-5 w-5 text-amber-500" />,  title: 'True Net P&L',   desc: 'Real profit after all costs.' },
                  { icon: <Trophy className="h-5 w-5 text-amber-500" />,     title: 'Status Tracking', desc: 'Full history of every challenge.' },
                  { icon: <TrendingUp className="h-5 w-5 text-amber-500" />, title: 'Payout History',  desc: 'Every withdrawal, visualised.' },
                  { icon: <ArrowRight className="h-5 w-5 text-amber-500" />, title: 'Free Forever',    desc: 'No credit card. No catch.' },
                ].map(f => (
                  <div key={f.title} className="p-4 rounded-xl border border-border/40 bg-muted/10">
                    <div className="mb-2">{f.icon}</div>
                    <p className="text-sm font-semibold mb-1">{f.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <AppFooter />
      </div>
    </>
  );
}
