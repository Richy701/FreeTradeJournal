import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { Footer7 } from '@/components/ui/footer-7';
import { ThemeToggle } from '@/components/theme-toggle';
import { BuyMeCoffee } from '@/components/ui/buy-me-coffee';
import { 
  TrendingUp, 
  ArrowRight, 
  DollarSign,
  Globe,
  LineChart,
  Calculator,
  Target,
  Shield,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ForexTradingJournal() {
  const { user, enterDemoMode } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const forexFeatures = [
    {
      icon: <DollarSign className="h-8 w-8 text-green-500" />,
      title: "Track Every Currency Pair",
      description: "Log all major, minor, and exotic pairs. EURUSD, GBPUSD, USDJPY, and more with automatic pip calculation."
    },
    {
      icon: <Calculator className="h-8 w-8 text-blue-500" />,
      title: "Pip & Position Size Calculator",
      description: "Built-in pip value calculator and position sizing tool. Manage risk per trade with precision."
    },
    {
      icon: <LineChart className="h-8 w-8 text-purple-500" />,
      title: "Forex Performance Metrics",
      description: "Track win rate, profit factor, average RRR, maximum drawdown, and Sharpe ratio specifically for FX trading."
    },
    {
      icon: <Globe className="h-8 w-8 text-indigo-500" />,
      title: "Multi-Session Support",
      description: "Track London, New York, Tokyo, and Sydney sessions. Analyze performance by trading session."
    },
    {
      icon: <Shield className="h-8 w-8 text-red-500" />,
      title: "Risk Management Dashboard",
      description: "Monitor exposure across currency correlations. Track daily, weekly, and monthly risk limits."
    },
    {
      icon: <Activity className="h-8 w-8 text-orange-500" />,
      title: "MT4/MT5 Compatible",
      description: "Import trades directly from MetaTrader history. Seamless integration with your trading platform."
    }
  ];

  const tradingPairs = [
    "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD",
    "EUR/GBP", "EUR/JPY", "GBP/JPY", "AUD/JPY", "NZD/USD", "EUR/AUD"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-primary" />
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
              <Globe className="h-4 w-4" />
              Professional Forex Trading Journal - 100% Free
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              The Ultimate <span className="text-primary">Forex Trading Journal</span>
              <br />for Serious FX Traders
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Track every pip, analyze currency pair performance, and master forex trading with our professional-grade journal. 
              Built specifically for forex traders who demand precision in their trading analysis.
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

            {/* Trading Pairs */}
            <div className="pt-8">
              <p className="text-sm text-muted-foreground mb-3">Track all major currency pairs:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {tradingPairs.map((pair) => (
                  <span key={pair} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm font-medium">
                    {pair}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Forex Trading Features Built for FX Professionals</h2>
            <p className="text-lg text-muted-foreground">Everything you need to track, analyze, and improve your forex trading performance</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forexFeatures.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Forex Specific Benefits */}
      <section className="py-20 px-6 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Why Forex Traders Choose FreeTradeJournal</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Automatic Pip Calculation</h3>
                    <p className="text-muted-foreground">No manual calculations needed. We automatically calculate pips for all currency pairs including JPY pairs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Session Analysis</h3>
                    <p className="text-muted-foreground">Track performance across London, New York, Tokyo, and Sydney sessions to find your most profitable times.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Currency Correlation Matrix</h3>
                    <p className="text-muted-foreground">Visualize currency correlations to avoid overexposure and manage portfolio risk effectively.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Economic Calendar Integration</h3>
                    <p className="text-muted-foreground">Track trades against major economic events like NFP, FOMC, ECB decisions.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-xl p-8">
              <h3 className="text-xl font-semibold mb-6 text-center">Forex Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">Average Pips/Trade</span>
                  <span className="font-semibold text-green-500">+15.3</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-semibold">68.5%</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">Profit Factor</span>
                  <span className="font-semibold">2.34</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">Risk/Reward Ratio</span>
                  <span className="font-semibold">1:2.5</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">Max Drawdown</span>
                  <span className="font-semibold text-red-500">-8.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Sharpe Ratio</span>
                  <span className="font-semibold">1.87</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Start Your Professional Forex Trading Journal Today</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of forex traders who have improved their performance with proper trade tracking and analysis.
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