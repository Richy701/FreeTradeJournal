import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import FeatureShowcase from '@/components/blocks/feature-showcase';
import { Footer7 } from '@/components/ui/footer-7';
import { FreeTradeJournalFeatures as Features6 } from '@/components/blocks/features-6';
import { ThemeToggle } from '@/components/theme-toggle';
import { FAQSection } from '@/components/blocks/faq-section';
import { TestimonialsSection } from '@/components/blocks/testimonials-section';
import { LogoCloud } from '@/components/blocks/logo-cloud';
import { SEOMeta } from '@/components/seo-meta';


export default function LandingPage() {
  const { user } = useAuth();

  // If user is signed in, redirect to dashboard
  // Don't block rendering while auth loads — show landing page immediately
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="w-full">
      <SEOMeta />
      {/* Navigation overlay */}
      <header className="absolute top-0 left-0 right-0 z-50" style={{ paddingTop: 'var(--pwa-safe-top, 0px)' }}>
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <img src="/favicon.svg" alt="FTJ" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex-shrink-0" />
            <span className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 truncate">FreeTradeJournal</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Link to="/pricing" className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium px-3 py-2 rounded-md text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-ring/50">
              Pricing
            </Link>
            <Link to="/login" className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium px-3 py-2 rounded-md text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-ring/50">
              Sign In
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section with A/B Testing */}
      <HeroGeometric
        title1="The Free Trading Journal"
        title2="That Improves Your Results"
      />

      {/* Logo Cloud - Prop Firms */}
      <LogoCloud />

      {/* Features Section with Dashboard Preview */}
      <Features6 />
        
      {/* Dashboard Performance Section */}
      <FeatureShowcase
        title={
          <span>
            Real-Time
            <br />
            <span className="text-amber-500">Performance Dashboard</span>
          </span>
        }
        description="See your recent trades, pairs performance radar, and trade distribution at a glance. Live P&L tracking, win rate calculations, and profit factor analytics update instantly as you log trades."
        images={[
          { src: "/images/screenshots/dashboard-trades-performance-screenshot.png", alt: "Dashboard Performance" }
        ]}
        imageLayout="stack"
        reverseLayout={true}
      />

      {/* Trade Log Section */}
      <FeatureShowcase
        title={
          <span>
            Comprehensive Trade
            <br />
            <span className="text-amber-500">Logging & Management</span>
          </span>
        }
        description="Log every trade with detailed information including entry/exit prices, lot sizes, spreads, commissions, and swap costs. Track trades across forex pairs, futures contracts, and indices with powerful filtering and export capabilities."
        images={[
          { src: "/images/screenshots/trading-log-screenshot.png", alt: "Trade Log View" }
        ]}
        imageLayout="stack"
        reverseLayout={false}
      />

      {/* Calendar Section */}
      <FeatureShowcase
        title={
          <span>
            Visual Performance
            <br />
            <span className="text-amber-500">Calendar Heatmap</span>
          </span>
        }
        description="Track your daily performance with an intuitive calendar heatmap. Quickly identify profitable and losing days, spot trading patterns, and track your consistency over time with beautiful visualizations."
        images={[
          { src: "/images/screenshots/calendar-heatmap-screenshot.png", alt: "Calendar Heatmap" }
        ]}
        imageLayout="stack"
        reverseLayout={true}
      />

      {/* Trading Journal Section */}
      <FeatureShowcase
        title={
          <span>
            Trading Journal
            <br />
            <span className="text-amber-500">& Analysis</span>
          </span>
        }
        description="Document your trading thoughts, strategies, and market observations. Maintain a detailed journal with mood tracking, screenshots, and comprehensive analysis to improve your trading psychology and performance."
        images={[
          { src: "/images/screenshots/trading-journal-screenshot.png", alt: "Trading Journal" }
        ]}
        imageLayout="stack"
        reverseLayout={false}
      />

      {/* Goals & Risk Management Section */}
      <FeatureShowcase
        title={
          <span>
            Smart Goals &
            <br />
            <span className="text-amber-500">Risk Management</span>
          </span>
        }
        description="Set clear trading goals and implement robust risk management rules. Track your progress, monitor rule violations, and maintain discipline with automated alerts and comprehensive analytics."
        images={[
          { src: "/images/screenshots/goals-risk-management-screenshot.png", alt: "Goals & Risk Management" }
        ]}
        imageLayout="stack"
        reverseLayout={true}
      />

      {/* AI Trade Analysis Section */}
      <FeatureShowcase
        title={
          <span>
            AI-Powered
            <br />
            <span className="text-amber-500">Trade Analysis</span>
          </span>
        }
        description="Get AI-generated analysis of your trading patterns, strengths, and areas to improve. Identify what's working, spot weaknesses like overtrading or tight stops, and receive an actionable summary — all personalised to your trade history."
        images={[
          { src: "/images/screenshots/ai-trade-analysis-screenshot.png", alt: "AI Trade Analysis" }
        ]}
        imageLayout="stack"
        reverseLayout={false}
      />

      {/* Trade Insights Section */}
      <FeatureShowcase
        title={
          <span>
            Advanced Trade
            <br />
            <span className="text-amber-500">Insights & Analytics</span>
          </span>
        }
        description="Dive deep into your performance with symbol breakdowns, a multi-dimensional trader profile radar, and long vs short direction analysis. See exactly where your edge is and which instruments drive your profits."
        images={[
          { src: "/images/screenshots/trade-insights-screenshot.png", alt: "Trade Insights" }
        ]}
        imageLayout="stack"
        reverseLayout={true}
      />

      {/* PropTracker Section */}
      <FeatureShowcase
        title={
          <span>
            Prop Firm
            <br />
            <span className="text-amber-500">ROI Tracker</span>
          </span>
        }
        description="Finally know if your prop firm journey is actually profitable. Log every evaluation fee, reset cost, and payout across all your accounts. See invested vs earned, net P&L per firm, and get an AI-powered verdict on which firms are worth your money."
        images={[
          { src: "/images/screenshots/prop-tracker-screenshot.png", alt: "PropTracker" }
        ]}
        imageLayout="stack"
        reverseLayout={false}
      />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FAQSection />

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
              { name: "Changelog", href: "/changelog" },
              { name: "Blog", href: "https://blog.freetradejournal.com" },
            ]
          },
          {
            title: "Trading Tools",
            links: [
              { name: "Forex Trading Journal", href: "/forex-trading-journal" },
              { name: "Futures Trading Tracker", href: "/futures-trading-tracker" },
              { name: "Prop Firm Dashboard", href: "/prop-firm-dashboard" },
              { name: "Prop Firm ROI Tracker", href: "/prop-tracker" },
            ]
          },
          {
            title: "Legal",
            links: [
              { name: "Privacy Policy", href: "/privacy" },
              { name: "Terms & Conditions", href: "/terms" },
              { name: "Cookie Policy", href: "/cookie-policy" },
            ]
          }
        ]}
        socialLinks={[
          { 
            icon: <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
            href: "https://x.com/richytiup",
            label: "Follow on X"
          },
        ]}
        copyright="© 2026 FreeTradeJournal. All rights reserved."
        legalLinks={[]}
      />
    </div>
  );
}