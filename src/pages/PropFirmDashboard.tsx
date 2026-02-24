import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { Footer7 } from '@/components/ui/footer-7';
import { ThemeToggle } from '@/components/theme-toggle';
import { BuyMeCoffee } from '@/components/ui/buy-me-coffee';
import { 
  TrendingUp, 
  ArrowRight,
  Shield,
  Target,
  Award,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Users,
  Zap,
  Trophy,
  Calculator
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function PropFirmDashboard() {
  const { user, enterDemoMode } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const propFirmFeatures = [
    {
      icon: <Shield className="h-8 w-8 text-red-500" />,
      title: "Drawdown Management",
      description: "Real-time tracking of daily and maximum drawdown limits. Never breach your prop firm rules again."
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
      title: "Daily Loss Limit Alerts",
      description: "Automatic warnings when approaching daily loss limits. Stay within your funded account rules."
    },
    {
      icon: <Target className="h-8 w-8 text-green-500" />,
      title: "Profit Target Tracking",
      description: "Monitor progress toward evaluation profit targets. Track Phase 1, Phase 2, and funded account goals."
    },
    {
      icon: <Trophy className="h-8 w-8 text-purple-500" />,
      title: "Multi-Account Management",
      description: "Track multiple prop firm accounts simultaneously. Compare performance across different firms."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
      title: "Evaluation Analytics",
      description: "Detailed statistics for challenge and verification phases. Optimize your path to funding."
    },
    {
      icon: <Calculator className="h-8 w-8 text-indigo-500" />,
      title: "Payout Tracking",
      description: "Track profit splits, payout history, and scaling plans. Monitor your funded trading income."
    }
  ];

  const propFirms = [
    "FTMO", "Apex Trader", "TopStep", "MyFundedFX", "E8 Funding", "The5ers",
    "Funded Next", "True Forex Funds", "Surge Trader", "Lux Trading", "FTML", "Blue Guardian"
  ];

  const evaluationMetrics = [
    { phase: "Challenge", target: "$10,000", current: "$7,250", progress: 72.5, days: "8/30" },
    { phase: "Verification", target: "$5,000", current: "$3,800", progress: 76, days: "12/60" }
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
              <Award className="h-4 w-4" />
              Professional Prop Firm Dashboard - 100% Free
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              The Ultimate <span className="text-primary">Prop Firm Dashboard</span>
              <br />for Funded Traders
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Track evaluations, manage drawdown limits, and monitor your funded accounts with the only journal 
              built specifically for prop firm traders. Compatible with FTMO, Apex, TopStep, and all major firms.
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

            {/* Prop Firms */}
            <div className="pt-8">
              <p className="text-sm text-muted-foreground mb-3">Compatible with all major prop firms:</p>
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

      {/* Evaluation Progress Dashboard */}
      <section className="py-20 px-6 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Real-Time Evaluation Tracking</h2>
            <p className="text-lg text-muted-foreground">Monitor your progress through challenge and verification phases</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {evaluationMetrics.map((metric, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">{metric.phase}</h3>
                  <span className="text-sm text-muted-foreground">Day {metric.days}</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Profit Target</span>
                      <span className="font-semibold">{metric.current} / {metric.target}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div 
                        className="bg-primary rounded-full h-3 transition-[width]"
                        style={{ width: `${metric.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{metric.progress}% Complete</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Max Daily Loss</p>
                      <p className="font-semibold text-green-500">$480 / $500</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Drawdown</p>
                      <p className="font-semibold text-green-500">$950 / $1000</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Risk Monitoring Panel */}
          <Card className="mt-6 p-6 border-yellow-500/50 bg-yellow-500/5">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-semibold">Active Risk Monitoring</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Today's P&L</span>
                <span className="font-semibold text-green-500">+$285</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Daily Loss Remaining</span>
                <span className="font-semibold">$215</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Max DD Remaining</span>
                <span className="font-semibold">$715</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Features Built for Prop Firm Success</h2>
            <p className="text-lg text-muted-foreground">Everything you need to pass evaluations and manage funded accounts</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {propFirmFeatures.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Prop Firm Specific Benefits */}
      <section className="py-20 px-6 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Why Prop Traders Choose FreeTradeJournal</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Never Breach Rules Again</h3>
                    <p className="text-muted-foreground">Real-time alerts before hitting drawdown or daily loss limits. Protect your funded account.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Multi-Firm Support</h3>
                    <p className="text-muted-foreground">Track FTMO, Apex, TopStep, and 20+ other prop firms in one dashboard.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Evaluation Optimizer</h3>
                    <p className="text-muted-foreground">AI-powered insights to help you pass challenges faster and more consistently.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Scaling Plan Tracker</h3>
                    <p className="text-muted-foreground">Monitor your progress through scaling plans. Track account growth from $10k to $1M+.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Payout Analytics</h3>
                    <p className="text-muted-foreground">Track profit splits, payout history, and calculate your monthly trading income.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="h-6 w-6 text-green-500" />
                  <h3 className="text-lg font-semibold">Success Rate Tracker</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Challenges Passed</span>
                    <span className="font-semibold">12/15 (80%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Funded Accounts</span>
                    <span className="font-semibold">4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Funding</span>
                    <span className="font-semibold text-green-500">$450,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lifetime Payouts</span>
                    <span className="font-semibold text-green-500">$28,500</span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Prop Firm Compatibility</h3>
                <div className="grid grid-cols-2 gap-3">
                  {["FTMO", "Apex Trader", "TopStep", "MyFundedFX", "E8 Funding", "The5ers"].map((firm) => (
                    <div key={firm} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{firm}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">+ 15 more prop firms supported</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-8 bg-primary/5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Funded Trader Success Story</span>
            </div>
            <blockquote className="text-lg italic mb-4">
              "FreeTradeJournal helped me pass 3 FTMO challenges in a row. The drawdown alerts saved my account multiple times. 
              Now managing $300k in funded capital and the multi-account dashboard is a game-changer."
            </blockquote>
            <p className="font-semibold">- Alex M., Professional Prop Trader</p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Start Your Prop Trading Journey Right</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of funded traders who track their evaluations and manage their accounts with FreeTradeJournal.
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