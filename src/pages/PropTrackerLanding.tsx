import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { SEOMeta } from '@/components/seo-meta';
import { AppFooter } from '@/components/app-footer';
import { ThemeToggle } from '@/components/theme-toggle';
import { BuyMeCoffee } from '@/components/ui/buy-me-coffee';
import { Card } from '@/components/ui/card';
import {
  ArrowRight, CheckCircle2, TrendingUp,
  Building2, Receipt, BarChart3, Trophy,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

export default function PropTrackerLanding() {
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();

  const mockAccounts = [
    { firm: 'Apex Trader Funding', size: '$50K', type: 'Funded',     status: 'Active', statusColor: 'text-emerald-500', net: '+$2,340', positive: true,  color: '#007BFF' },
    { firm: 'FTMO',                size: '$100K', type: 'Evaluation', status: 'Active', statusColor: 'text-emerald-500', net: '-$480',  positive: false, color: '#0781FE' },
    { firm: 'TopStep',             size: '$50K', type: 'Funded',     status: 'Passed', statusColor: 'text-blue-500',    net: '+$5,120', positive: true,  color: '#FFCC06' },
  ];

  const mockTxs = [
    { type: 'Payout',         firm: 'Apex',    amount: '+$3,000', positive: true  },
    { type: 'Evaluation Fee', firm: 'FTMO',    amount: '-$178',   positive: false },
    { type: 'Reset Fee',      firm: 'TopStep', amount: '-$99',    positive: false },
    { type: 'Payout',         firm: 'TopStep', amount: '+$2,192', positive: true  },
  ];

  const propFirms = [
    'TopStep', 'Apex Trader Funding', 'FTMO', 'The5ers',
    'E8 Funding', 'FundedNext', 'Leeloo Trading', 'Earn2Trade',
    'Tradeday', 'Bulenox',
  ];

  return (
    <>
      <SEOMeta />
      <div className="min-h-screen bg-background flex flex-col">

        {/* ── Header ── */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <img src="/favicon.svg" alt="FTJ" className="h-8 w-8 rounded-xl flex-shrink-0" />
              <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">FreeTradeJournal</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2">
              <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hidden sm:block">Pricing</Link>
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md">Sign In</Link>
              <ThemeToggle />
              <BuyMeCoffee username="richy701" variant="outline" size="sm" className="hidden sm:flex" />
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative py-24 md:py-32 px-6 overflow-hidden bg-[#030303]">
          {/* Amber glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-semibold text-amber-500 uppercase tracking-wider mb-6">
              Free Prop Firm Tracker — No Credit Card
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight text-white">
              Do you actually know your<br />
              <span className="text-amber-500">real prop trading P&L?</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10">
              After every fee, reset, and failed challenge — most prop traders are guessing.
              PropTracker shows you the real number, across every firm, all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] motion-reduce:animate-none text-black font-semibold px-8 py-3 rounded-lg text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-[transform,box-shadow] duration-300">
                  Start Tracking Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="px-8 py-3 rounded-lg font-semibold text-base text-foreground shadow-md hover:shadow-lg hover:scale-[1.02] transition-[transform,box-shadow] duration-300 border-2 border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/10"
                onClick={() => { enterDemoMode(); navigate('/prop-tracker'); }}
              >
                Try Live Demo
              </Button>
            </div>

            <p className="text-xs text-white/40 mt-5">
              Supports {propFirms.slice(0, 5).join(', ')} and more
            </p>
          </div>
        </section>

        {/* ── Live Preview ── */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="container mx-auto max-w-3xl">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">What it looks like</p>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total Fees',  value: '-$1,840', positive: false },
                { label: 'Total Payouts', value: '+$9,300', positive: true  },
                { label: 'Net P&L',     value: '+$7,460', positive: true  },
              ].map(stat => (
                <Card key={stat.label} className="p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</p>
                  <p className={`text-xl font-bold tabular-nums ${stat.positive ? 'text-emerald-500' : 'text-red-500'}`}>{stat.value}</p>
                </Card>
              ))}
            </div>

            {/* Account cards */}
            <div className="space-y-2 mb-4">
              {mockAccounts.map(acc => (
                <Card key={acc.firm} className="px-4 py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: acc.color }}>
                    {acc.firm.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{acc.firm}</p>
                    <p className="text-[10px] text-muted-foreground">{acc.size} · {acc.type}</p>
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${acc.statusColor}`}>{acc.status}</span>
                  <span className={`text-sm font-bold tabular-nums ${acc.positive ? 'text-emerald-500' : 'text-red-500'}`}>{acc.net}</span>
                </Card>
              ))}
            </div>

            {/* Recent transactions */}
            <Card className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">Recent Transactions</p>
              <div className="space-y-1">
                {mockTxs.map((tx, i) => (
                  <div key={i} className="flex items-center gap-2 px-1 py-1">
                    <div className={tx.positive ? 'text-emerald-500' : 'text-red-400'}>
                      {tx.positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    </div>
                    <span className="text-xs text-muted-foreground flex-1">{tx.type} · {tx.firm}</span>
                    <span className={`text-xs font-semibold tabular-nums ${tx.positive ? 'text-emerald-500' : 'text-red-400'}`}>{tx.amount}</span>
                  </div>
                ))}
              </div>
            </Card>

            <p className="text-center text-[10px] text-muted-foreground mt-3">Sample data — your real accounts appear after you sign up.</p>
          </div>
        </section>

        {/* ── What you get ── */}
        <section className="py-20 px-6">
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
                  { icon: <Receipt className="h-5 w-5 text-amber-500" />,   title: 'Fee Tracking',       desc: 'Eval, monthly, and reset fees logged per account.' },
                  { icon: <Building2 className="h-5 w-5 text-amber-500" />, title: 'Multi-Firm',          desc: 'All your firms in one view.' },
                  { icon: <BarChart3 className="h-5 w-5 text-amber-500" />, title: 'True Net P&L',        desc: 'Real profit after all costs.' },
                  { icon: <Trophy className="h-5 w-5 text-amber-500" />,    title: 'Status Tracking',    desc: 'Full history of every challenge.' },
                  { icon: <TrendingUp className="h-5 w-5 text-amber-500" />,title: 'Payout History',     desc: 'Every withdrawal, visualised.' },
                  { icon: <ArrowRight className="h-5 w-5 text-amber-500" />,title: 'Free Forever',       desc: 'No credit card. No catch.' },
                ].map(f => (
                  <Card key={f.title} className="p-4">
                    <div className="mb-2">{f.icon}</div>
                    <p className="text-sm font-semibold mb-1">{f.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-6 bg-amber-500/5 border-y border-amber-500/10">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to see your real number?</h2>
            <p className="text-muted-foreground mb-8">
              Free forever. Takes two minutes to set up. Join thousands of prop traders who track their true P&L with FreeTradeJournal.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] motion-reduce:animate-none text-black font-semibold px-8 py-3 rounded-lg text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-[transform,box-shadow] duration-300">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="px-8 py-3 rounded-lg font-semibold text-base text-foreground shadow-md hover:shadow-lg hover:scale-[1.02] transition-[transform,box-shadow] duration-300 border-2 border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/10"
                onClick={() => { enterDemoMode(); navigate('/prop-tracker'); }}
              >
                Try Live Demo
              </Button>
            </div>
          </div>
        </section>

        <AppFooter />
      </div>
    </>
  );
}
