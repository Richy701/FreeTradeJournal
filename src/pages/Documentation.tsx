import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer7 } from '@/components/ui/footer-7';
import { useThemePresets } from '@/contexts/theme-presets';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faChartLine, faCalendarAlt, faFileText, faBullseye, faCog, faUpload, faDownload, faFilter, faCalculator } from '@fortawesome/free-solid-svg-icons';

export default function Documentation() {
  const { themeColors } = useThemePresets();

  const featureCards = [
    {
      icon: faChartLine,
      title: "Trade Logging",
      description: "Log trades with entry/exit prices, lot sizes, spreads, commissions, and swap costs. Track forex, futures, and stock trades.",
      features: ["Real-time P&L calculation", "Commission tracking", "Swap cost monitoring", "Multiple asset classes"]
    },
    {
      icon: faCalendarAlt,
      title: "Calendar Heatmap",
      description: "Visual performance tracking with daily P&L heatmap. Identify patterns and consistency in your trading.",
      features: ["Daily performance visualization", "Pattern recognition", "Streak tracking", "Monthly/yearly views"]
    },
    {
      icon: faFileText,
      title: "Trading Journal",
      description: "Document strategies, market observations, and trading psychology. Include screenshots and detailed analysis.",
      features: ["Mood tracking", "Strategy notes", "Market analysis", "Screenshot uploads"]
    },
    {
      icon: faBullseye,
      title: "Goals & Risk Management",
      description: "Set trading goals and implement risk management rules. Track violations and maintain discipline.",
      features: ["Goal setting", "Rule enforcement", "Risk monitoring", "Performance alerts"]
    }
  ];

  const guides = [
    {
      title: "Getting Started",
      description: "Learn the basics of setting up your trading journal",
      steps: [
        "Create your account and set up your profile",
        "Import existing trades via CSV or add manually",
        "Configure your trading goals and risk rules",
        "Start logging new trades and journal entries"
      ]
    },
    {
      title: "Trade Management",
      description: "How to effectively log and manage your trades",
      steps: [
        "Add trades with complete entry/exit information",
        "Use tags and categories to organize trades",
        "Set up alerts for risk rule violations",
        "Review and analyze trade performance regularly"
      ]
    },
    {
      title: "Advanced Analytics",
      description: "Leverage AI insights and advanced metrics",
      steps: [
        "Review AI-generated trading patterns",
        "Monitor psychological trading indicators",
        "Track advanced metrics like Sharpe ratio",
        "Identify and fix trading weaknesses"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div 
                className="p-3 rounded-xl shadow-lg"
                style={{ backgroundColor: themeColors.primary }}
              >
                <FontAwesomeIcon icon={faBook} className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Documentation</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Complete guide to using FreeTradeJournal effectively. Learn how to track your trades, analyze performance, and improve your trading results.
            </p>
          </div>

          {/* Quick Start */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Quick Start Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">1. Set Up Your Profile</h3>
                  <p className="text-muted-foreground">Configure your trading preferences, account settings, and risk parameters to get started.</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">2. Add Your First Trade</h3>
                  <p className="text-muted-foreground">Log your first trade with entry/exit prices, lot size, and all relevant costs for accurate P&L tracking.</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">3. Import Historical Data</h3>
                  <p className="text-muted-foreground">Upload CSV files from your broker to import existing trade history and get comprehensive analytics.</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">4. Set Trading Goals</h3>
                  <p className="text-muted-foreground">Define profit targets, risk limits, and trading rules to maintain discipline and track progress.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Core Features */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Core Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featureCards.map((feature, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${themeColors.primary}20` }}
                      >
                        <FontAwesomeIcon icon={feature.icon} className="h-5 w-5" style={{ color: themeColors.primary }} />
                      </div>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.features.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColors.primary }}></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Step-by-Step Guides */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Step-by-Step Guides</h2>
            <div className="grid lg:grid-cols-3 gap-6">
              {guides.map((guide, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                    <p className="text-muted-foreground text-sm">{guide.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {guide.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-3 text-sm">
                          <span 
                            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white font-medium text-xs"
                            style={{ backgroundColor: themeColors.primary }}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Key Features Details */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Detailed Feature Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faUpload} className="h-5 w-5" style={{ color: themeColors.primary }} />
                  <h3 className="text-xl font-semibold">CSV Import</h3>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <p>Import your trading history from any broker using CSV files. Supports major brokers including MetaTrader, TradingView, and prop firms.</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Automatic field mapping for common CSV formats</li>
                    <li>Duplicate trade detection and prevention</li>
                    <li>Support for partial fills and complex orders</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faCalculator} className="h-5 w-5" style={{ color: themeColors.primary }} />
                  <h3 className="text-xl font-semibold">Advanced Analytics</h3>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <p>Professional-grade trading metrics and AI-powered insights to improve your performance.</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Sharpe ratio, profit factor, and maximum drawdown calculations</li>
                    <li>Psychological pattern detection (overtrading, revenge trading, FOMO)</li>
                    <li>Win rate analysis by time, instrument, and strategy</li>
                    <li>Risk-adjusted returns and consistency metrics</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faFilter} className="h-5 w-5" style={{ color: themeColors.primary }} />
                  <h3 className="text-xl font-semibold">Filtering & Search</h3>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <p>Powerful filtering options to analyze specific trading scenarios and patterns.</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Filter by date range, instrument, strategy, or outcome</li>
                    <li>Search trades by notes, tags, or custom fields</li>
                    <li>Save and reuse common filter combinations</li>
                    <li>Export filtered results to CSV or Excel</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faDownload} className="h-5 w-5" style={{ color: themeColors.primary }} />
                  <h3 className="text-xl font-semibold">Export & Reporting</h3>
                </div>
                <div className="space-y-3 text-muted-foreground">
                  <p>Generate comprehensive reports for tax purposes, performance reviews, or prop firm evaluations.</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Export trades in multiple formats (CSV, Excel, PDF)</li>
                    <li>Generate performance reports with charts and metrics</li>
                    <li>Tax-ready profit/loss statements</li>
                    <li>Custom report templates for different needs</li>
                  </ul>
                </div>
              </section>

            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Is my trading data secure?</h3>
                <p className="text-muted-foreground">Yes, your trading data is stored locally on your device by default. We use industry-standard encryption for any cloud sync features, and your sensitive financial information never leaves your control without your explicit consent.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">What file formats can I import?</h3>
                <p className="text-muted-foreground">We support CSV files from most major brokers and trading platforms. Common formats include MetaTrader, TradingView, Interactive Brokers, and most prop firm reporting formats.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Can I use this for tax reporting?</h3>
                <p className="text-muted-foreground">While FreeTradeJournal provides detailed P&L calculations and export capabilities, you should always verify data accuracy and consult with a tax professional for official tax reporting purposes.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Does FreeTradeJournal provide trading advice?</h3>
                <p className="text-muted-foreground">No, FreeTradeJournal is purely an analysis and journaling tool. We do not provide investment advice, trading signals, or financial recommendations. All trading decisions remain your responsibility.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">How do I export my data?</h3>
                <p className="text-muted-foreground">Go to Settings → Data Management to export your trades, journal entries, and analytics data in various formats including CSV, Excel, and JSON.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Can I use this offline?</h3>
                <p className="text-muted-foreground">Yes, FreeTradeJournal works offline by default since all data is stored locally. You can log trades, update your journal, and view analytics without an internet connection.</p>
              </div>

            </CardContent>
          </Card>

          {/* Support */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">If you need additional support or have questions not covered in this documentation:</p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColors.primary }}></div>
                  <span><strong>Community Support:</strong> <a href="https://t.me/+UI6uTKgfswUwNzhk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Join our Telegram</a></span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColors.primary }}></div>
                  <span><strong>Feedback:</strong> Use the in-app feedback system</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColors.primary }}></div>
                  <span><strong>Community:</strong> Join our trading community discussions</span>
                </li>
              </ul>
            </CardContent>
          </Card>

        </div>
      </div>
      
      <Footer7 
        logo={{
          url: "/",
          src: "",
          alt: "FreeTradeJournal",
          title: "FreeTradeJournal"
        }}
        description="Free, open-source trading journal for forex and futures traders. Track your performance, analyze patterns, and improve your trading with AI-powered insights."
        sections={[
          {
            title: "Product",
            links: [
              { name: "Features", href: "/#features" },
              { name: "Dashboard", href: "/dashboard" },
              { name: "Trade Log", href: "/trades" },
              { name: "Goals", href: "/goals" }
            ]
          },
          {
            title: "Resources",
            links: [
              { name: "Documentation", href: "/documentation" },
              { name: "Get Help", href: "https://t.me/+UI6uTKgfswUwNzhk" },
              { name: "Community", href: "#" },
              { name: "Blog", href: "#" }
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
          // Add social links when available
        ]}
        copyright="© 2025 FreeTradeJournal. All rights reserved."
        legalLinks={[
          { name: "Terms and Conditions", href: "/terms" },
          { name: "Privacy Policy", href: "/privacy" }
        ]}
      />
    </div>
  );
}