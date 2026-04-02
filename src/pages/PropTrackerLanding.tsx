import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { SEOMeta } from '@/components/seo-meta';
import { Footer7 } from '@/components/ui/footer-7';
import { ThemeToggle } from '@/components/theme-toggle';
import { BuyMeCoffee } from '@/components/ui/buy-me-coffee';
import {
  ArrowRight, CheckCircle, DollarSign, TrendingUp,
  Building2, Receipt, BarChart3, Trophy, Shield, Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function PropTrackerLanding() {
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Receipt className="h-7 w-7 text-amber-500" />,
      title: 'Track Every Fee & Payout',
      description: 'Log evaluation fees, reset costs, monthly subscriptions, and every payout in one place.',
    },
    {
      icon: <Building2 className="h-7 w-7 text-blue-500" />,
      title: 'Multi-Firm Management',
      description: 'Manage all your prop firm accounts — FTMO, Apex, TopStep, and 10+ more — from a single dashboard.',
    },
    {
      icon: <BarChart3 className="h-7 w-7 text-emerald-500" />,
      title: 'True Net P&L',
      description: 'See your real profit after all fees and payouts. Know if prop trading is actually working for you.',
    },
    {
      icon: <Trophy className="h-7 w-7 text-purple-500" />,
      title: 'Account Status Tracking',
      description: 'Mark accounts as active, passed, failed, or withdrawn. Keep a full history of every challenge.',
    },
    {
      icon: <Shield className="h-7 w-7 text-red-500" />,
      title: 'Challenge & Funded Views',
      description: 'Separate views for evaluation accounts and funded accounts so you always know where you stand.',
    },
    {
      icon: <Wallet className="h-7 w-7 text-indigo-500" />,
      title: 'Payout History',
      description: 'Track every withdrawal from every firm. Visualise your funded trading income over time.',
    },
  ];

  const mockAccounts = [
    { firm: 'Apex Trader Funding', size: '$50,000', type: 'Funded', status: 'Active', net: '+$2,340', color: '#007BFF' },
    { firm: 'FTMO', size: '$100,000', type: 'Evaluation', status: 'Active', net: '-$480', color: '#0781FE' },
    { firm: 'TopStep', size: '$50,000', type: 'Funded', status: 'Passed', net: '+$5,120', color: '#FFCC06' },
  ];

  const propFirms = [
    'TopStep', 'Apex Trader Funding', 'FTMO', 'The5ers', 'E8 Funding',
    'FundedNext', 'Leeloo Trading', 'Earn2Trade', 'Tradeday', 'Bulenox',
  ];

  return (
    <>
      <SEOMeta />
      <div className="min-h-screen bg-background">

        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <img src="/favicon.svg" alt="FTJ" className="h-8 w-8 rounded-lg flex-shrink-0" />
              <span className="text-xl font-bold">FreeTradeJournal</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <BuyMeCoffee username="richy701" variant="outline" size="sm" />
              <Link to="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="py-20 px-6 bg-gradient-to-b from-amber-500/5 to-background">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full text-sm font-medium text-amber-500 mb-4">
                <DollarSign className="h-4 w-4" />
                Free Prop Firm Tracker — No Credit Card Needed
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Track Every Prop Firm Fee,<br />
                <span className="text-amber-500">Payout & Account</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                PropTracker gives you a clear picture of your true prop trading P&amp;L — across all firms,
                all accounts, all fees. Know exactly whether funded trading is paying off.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Link to="/signup">
                  <Button size="lg" className="text-base sm:text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-[transform,box-shadow]">
                    Start Tracking Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base sm:text-lg px-8 py-6"
                  onClick={() => { enterDemoMode(); navigate('/prop-tracker'); }}
                >
                  Try Live Demo
                </Button>
              </div>

              <div className="pt-6">
                <p className="text-sm text-muted-foreground mb-3">Supports all major prop firms:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {propFirms.map((firm) => (
                    <span key={firm} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm font-medium">
                      {firm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mock UI Preview */}
        <section className="py-16 px-6 bg-secondary/20">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2">Your accounts, at a glance</h2>
              <p className="text-muted-foreground">One view for every firm — status, net P&amp;L, and transaction history.</p>
            </div>

            {/* Summary bar */}
            <Card className="p-5 mb-4 flex flex-col sm:flex-row gap-4 sm:gap-0 sm:divide-x divide-border">
              <div className="flex-1 text-center sm:pr-4">
                <p className="text-xs text-muted-foreground mb-1">Total Fees Paid</p>
                <p className="text-2xl font-bold text-red-500">-$1,840</p>
              </div>
              <div className="flex-1 text-center sm:px-4">
                <p className="text-xs text-muted-foreground mb-1">Total Payouts</p>
                <p className="text-2xl font-bold text-emerald-500">+$9,300</p>
              </div>
              <div className="flex-1 text-center sm:pl-4">
                <p className="text-xs text-muted-foreground mb-1">Net P&amp;L</p>
                <p className="text-2xl font-bold text-emerald-500">+$7,460</p>
              </div>
            </Card>

            {/* Mock account cards */}
            <div className="space-y-3">
              {mockAccounts.map((account) => (
                <Card key={account.firm} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: account.color }}
                    >
                      {account.firm.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{account.firm}</p>
                      <p className="text-xs text-muted-foreground">{account.size} · {account.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-sm font-medium hidden sm:block ${
                      account.status === 'Active' ? 'text-emerald-500' :
                      account.status === 'Passed' ? 'text-blue-500' : 'text-muted-foreground'
                    }`}>{account.status}</span>
                    <span className={`font-bold ${account.net.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                      {account.net}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">Sample data — your real accounts appear after you sign up.</p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Everything you need to track prop trading</h2>
              <p className="text-lg text-muted-foreground">Built specifically for traders juggling multiple funded accounts.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why / checklist */}
        <section className="py-20 px-6 bg-secondary/20">
          <div className="container mx-auto max-w-4xl">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Stop guessing — know your real numbers</h2>
                <div className="space-y-4">
                  {[
                    'One dashboard for all your prop firm accounts',
                    'Net P&L after every fee and payout',
                    'Full transaction history per account',
                    'Visual breakdown of costs vs income',
                    'Works with FTMO, Apex, TopStep and more',
                    'Free forever — no credit card required',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini P&L chart mockup */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold">Cumulative Net P&amp;L</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Jan', value: 65, amount: '+$3,200', positive: true },
                    { label: 'Feb', value: 45, amount: '-$890', positive: false },
                    { label: 'Mar', value: 80, amount: '+$4,100', positive: true },
                    { label: 'Apr', value: 90, amount: '+$2,750', positive: true },
                  ].map((bar) => (
                    <div key={bar.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6">{bar.label}</span>
                      <div className="flex-1 bg-secondary rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${bar.positive ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${bar.value}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-16 text-right ${bar.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {bar.amount}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">Net P&amp;L per month across all accounts</p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-amber-500/5">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">Start tracking your prop firm accounts today</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Free forever. No credit card. Join thousands of prop traders who track their true P&amp;L with FreeTradeJournal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="text-base sm:text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-[transform,box-shadow]">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-base sm:text-lg px-8 py-6"
                onClick={() => { enterDemoMode(); navigate('/prop-tracker'); }}
              >
                Try Live Demo
              </Button>
            </div>
          </div>
        </section>

        <Footer7 />
      </div>
    </>
  );
}
