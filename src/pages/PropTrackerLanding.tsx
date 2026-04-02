import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { SEOMeta } from '@/components/seo-meta';
import { Footer7 } from '@/components/ui/footer-7';
import { ThemeToggle } from '@/components/theme-toggle';
import { BuyMeCoffee } from '@/components/ui/buy-me-coffee';
import {
  ArrowRight, CheckCircle2, DollarSign, TrendingUp,
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
      icon: <Building2 className="h-7 w-7 text-amber-500" />,
      title: 'Multi-Firm Management',
      description: 'Manage all your prop firm accounts — FTMO, Apex, TopStep, and 10+ more — from a single dashboard.',
    },
    {
      icon: <BarChart3 className="h-7 w-7 text-amber-500" />,
      title: 'True Net P&L',
      description: 'See your real profit after all fees and payouts. Know if prop trading is actually working for you.',
    },
    {
      icon: <Trophy className="h-7 w-7 text-amber-500" />,
      title: 'Account Status Tracking',
      description: 'Mark accounts as active, passed, failed, or withdrawn. Keep a full history of every challenge.',
    },
    {
      icon: <Shield className="h-7 w-7 text-amber-500" />,
      title: 'Challenge & Funded Views',
      description: 'Separate views for evaluation accounts and funded accounts so you always know where you stand.',
    },
    {
      icon: <Wallet className="h-7 w-7 text-amber-500" />,
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
        <header className="absolute top-0 left-0 right-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <img src="/favicon.svg" alt="FTJ" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex-shrink-0" />
              <span className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 truncate">FreeTradeJournal</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Link to="/pricing" className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium px-3 py-2 rounded-md text-sm sm:text-base">
                Pricing
              </Link>
              <Link to="/login" className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium px-3 py-2 rounded-md text-sm sm:text-base">
                Sign In
              </Link>
              <ThemeToggle />
              <BuyMeCoffee username="richy701" variant="outline" size="sm" className="hidden sm:flex" />
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="pt-36 pb-20 px-6 bg-gradient-to-b from-amber-500/5 to-background">
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
                      <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
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

        <Footer7
          logo={{
            url: "/",
            src: "",
            alt: "FreeTradeJournal Logo",
            title: "FreeTradeJournal"
          }}
          description="Track every trade, spot what's working, and build consistency — with professional analytics, journaling, and performance tools. Free forever, no credit card required."
          sections={[
            {
              title: "Product",
              links: [
                { name: "Features", href: "/#features" },
                { name: "Pricing", href: "/pricing" },
                { name: "Documentation", href: "/documentation" },
                { name: "Changelog", href: "/changelog" }
              ]
            },
            {
              title: "Trading Tools",
              links: [
                { name: "Forex Trading Journal", href: "/forex-trading-journal" },
                { name: "Futures Trading Tracker", href: "/futures-trading-tracker" },
                { name: "Prop Firm Dashboard", href: "/prop-firm-dashboard" },
                { name: "Prop Tracker", href: "/prop-tracker" },
              ]
            },
            {
              title: "Resources",
              links: [
                { name: "Sign Up Free", href: "/signup" },
                { name: "Login", href: "/login" },
              ]
            },
            {
              title: "Legal",
              links: [
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms & Conditions", href: "/terms" },
                { name: "Cookie Policy", href: "/cookie-policy" }
              ]
            }
          ]}
          socialLinks={[
            {
              icon: <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
              href: "https://x.com/richytiup",
              label: "Follow on X"
            },
            {
              icon: <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364zm-6.159 3.9c-.862.37-1.84.788-3.109.788a5.884 5.884 0 01-1.569-.217l.877 9.004c.065.78.717 1.38 1.5 1.38 0 0 1.243.065 1.658.065.447 0 1.786-.065 1.786-.065.783 0 1.434-.6 1.499-1.38l.94-9.95a3.996 3.996 0 00-1.322-.238c-.826 0-1.491.284-2.26.613z"/></svg>,
              href: "https://www.buymeacoffee.com/richy701",
              label: "Buy me a coffee"
            }
          ]}
          copyright="© 2026 FreeTradeJournal. All rights reserved."
          legalLinks={[
            { name: "Privacy Policy", href: "/privacy" },
            { name: "Terms and Conditions", href: "/terms" },
          ]}
        />
      </div>
    </>
  );
}
