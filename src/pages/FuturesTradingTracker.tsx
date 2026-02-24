import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { Footer7 } from '@/components/ui/footer-7';
import { ThemeToggle } from '@/components/theme-toggle';
import { BuyMeCoffee } from '@/components/ui/buy-me-coffee';
import { 
  TrendingUp, 
  ArrowRight,
  BarChart3,
  Activity,
  Calculator,
  Target,
  Shield,
  CheckCircle,
  Zap,
  TrendingDown,
  Clock,
  DollarSign
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function FuturesTradingTracker() {
  const { user, enterDemoMode } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const futuresFeatures = [
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
      title: "Track All Futures Contracts",
      description: "Log E-mini S&P 500 (ES), Nasdaq (NQ), Crude Oil (CL), Gold (GC), and all major futures contracts."
    },
    {
      icon: <Calculator className="h-8 w-8 text-green-500" />,
      title: "Tick & Point Value Calculator",
      description: "Automatic tick value calculation for each contract. Track P&L in ticks, points, and dollars."
    },
    {
      icon: <Activity className="h-8 w-8 text-purple-500" />,
      title: "Volume Profile Analysis",
      description: "Analyze your trades against market volume. Identify high-probability entry and exit zones."
    },
    {
      icon: <DollarSign className="h-8 w-8 text-yellow-500" />,
      title: "Margin & Leverage Tracking",
      description: "Monitor initial and maintenance margin requirements. Track buying power and leverage usage."
    },
    {
      icon: <Clock className="h-8 w-8 text-indigo-500" />,
      title: "Time-Based Analytics",
      description: "Track performance by market open, close, and overnight sessions. Optimize your trading times."
    },
    {
      icon: <Shield className="h-8 w-8 text-red-500" />,
      title: "Risk Management Suite",
      description: "Set daily loss limits, position size limits, and maximum contracts per trade. Stay disciplined."
    }
  ];

  const futuresContracts = [
    "ES (E-mini S&P)", "NQ (E-mini Nasdaq)", "YM (E-mini Dow)", "RTY (E-mini Russell)",
    "CL (Crude Oil)", "GC (Gold)", "SI (Silver)", "NG (Natural Gas)",
    "ZB (30-Year Bond)", "ZN (10-Year Note)", "6E (Euro FX)", "6J (Japanese Yen)"
  ];

  const performanceMetrics = [
    { label: "Average Ticks/Trade", value: "+8.5", positive: true },
    { label: "Win Rate", value: "72.3%", positive: true },
    { label: "Profit Factor", value: "2.85", positive: true },
    { label: "Max Contracts", value: "15", positive: false },
    { label: "Avg Hold Time", value: "12 min", positive: false },
    { label: "Daily P&L", value: "+$2,450", positive: true }
  ];

  return (
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

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
              <Zap className="h-4 w-4" />
              Professional Futures Trading Tracker - 100% Free
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Advanced <span className="text-primary">Futures Trading Tracker</span>
              <br />for Professional Traders
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Track every tick, analyze contract performance, and master futures trading with our professional-grade journal. 
              Built for ES, NQ, CL, GC traders who demand precision and speed in their analysis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                size="lg"
                onClick={() => {
                  enterDemoMode();
                  navigate('/dashboard');
                }}
                className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 shadow-lg hover:shadow-xl transition-[transform,box-shadow]"
              >
                Try Live Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6">
                  Start Free Forever
                </Button>
              </Link>
            </div>

            {/* Futures Contracts */}
            <div className="pt-8">
              <p className="text-sm text-muted-foreground mb-3">Track all major futures contracts:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {futuresContracts.map((contract) => (
                  <span key={contract} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm font-medium">
                    {contract}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Performance Dashboard Preview */}
      <section className="py-20 px-6 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Real-Time Futures Performance Tracking</h2>
            <p className="text-lg text-muted-foreground">See your futures trading metrics update in real-time</p>
          </div>
          
          <div className="bg-card rounded-lg shadow-xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
                  <p className={`text-2xl font-bold ${metric.positive ? 'text-green-500' : 'text-foreground'}`}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-8 border-t">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Trades</h3>
                <span className="text-sm text-muted-foreground">Last 5 trades</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded">
                  <span className="font-medium">ES Long</span>
                  <span className="text-green-500 font-semibold">+12 ticks ($150)</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded">
                  <span className="font-medium">NQ Short</span>
                  <span className="text-green-500 font-semibold">+8 ticks ($160)</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded">
                  <span className="font-medium">CL Long</span>
                  <span className="text-red-500 font-semibold">-5 ticks (-$50)</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded">
                  <span className="font-medium">GC Short</span>
                  <span className="text-green-500 font-semibold">+15 ticks ($150)</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded">
                  <span className="font-medium">ES Long</span>
                  <span className="text-green-500 font-semibold">+6 ticks ($75)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Futures Trading Features Built for Speed</h2>
            <p className="text-lg text-muted-foreground">Everything you need to track and analyze your futures trading</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {futuresFeatures.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Futures Specific Benefits */}
      <section className="py-20 px-6 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Why Futures Traders Choose FreeTradeJournal</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Automatic Tick Calculation</h3>
                    <p className="text-muted-foreground">Instant tick and point value calculations for all futures contracts. No manual math needed.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Scalping Analytics</h3>
                    <p className="text-muted-foreground">Track micro-timeframe performance. Perfect for scalpers and day traders.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Contract Roll Tracking</h3>
                    <p className="text-muted-foreground">Seamlessly track trades across contract rollovers. Maintain continuous P&L history.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Multi-Account Support</h3>
                    <p className="text-muted-foreground">Track multiple brokers and accounts. Perfect for prop firm traders.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Commission & Fee Tracking</h3>
                    <p className="text-muted-foreground">Include exchange fees and commissions in your P&L calculations.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Popular Futures Strategies Tracked</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Scalping (1-5 min)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-secondary rounded-full h-2">
                        <div className="w-4/5 bg-primary rounded-full h-2"></div>
                      </div>
                      <span className="text-sm font-medium">80%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Day Trading</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-secondary rounded-full h-2">
                        <div className="w-3/4 bg-primary rounded-full h-2"></div>
                      </div>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Swing Trading</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-secondary rounded-full h-2">
                        <div className="w-3/5 bg-primary rounded-full h-2"></div>
                      </div>
                      <span className="text-sm font-medium">60%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Spread Trading</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-secondary rounded-full h-2">
                        <div className="w-2/5 bg-primary rounded-full h-2"></div>
                      </div>
                      <span className="text-sm font-medium">40%</span>
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 bg-primary/5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Top Performer This Week</h3>
                </div>
                <p className="text-2xl font-bold text-primary mb-1">ES (E-mini S&P 500)</p>
                <p className="text-sm text-muted-foreground">+248 ticks • 85% win rate • $3,100 profit</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Related Tools */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Explore More Trading Tools</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/forex-trading-journal">
              <Card className="p-5 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold mb-1">Forex Trading Journal</h3>
                <p className="text-sm text-muted-foreground">Track every pip across all major, minor, and exotic currency pairs with session analysis.</p>
              </Card>
            </Link>
            <Link to="/prop-firm-dashboard">
              <Card className="p-5 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold mb-1">Prop Firm Dashboard</h3>
                <p className="text-sm text-muted-foreground">Manage FTMO, Apex, TopStep evaluations with drawdown alerts and payout tracking.</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Start Tracking Your Futures Trades Today</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of futures traders improving their performance with professional trade tracking.
            No credit card required. Free forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => {
                enterDemoMode();
                navigate('/dashboard');
              }}
              className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6"
            >
              View Live Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer7 />
    </div>
  );
}