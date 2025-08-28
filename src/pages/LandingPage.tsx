import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card'; // unused
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { TradeVaultFeatures } from '@/components/blocks/features-8';
import SectionWithMockup from '@/components/blocks/section-with-mockup';
import { Footer7 } from '@/components/ui/footer-7';
import { TradeVaultFeatures as Features6 } from '@/components/blocks/features-6';
import { ThemeToggle } from '@/components/theme-toggle';
// import { Features as Features10 } from '@/components/blocks/features-10'; // unused
import {
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
// Removed unused: BarChart3, FileText, Shield, Zap, Target, CheckCircle

export default function LandingPage() {
  return (
    <div className="w-full">
      {/* Navigation overlay */}
      <header className="absolute top-0 left-0 right-0 z-50 border-b border-border/10 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-9 w-9 text-primary" />
            <span className="text-2xl font-bold text-foreground">TradeVault</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-foreground/85 hover:text-foreground transition-opacity duration-200 font-medium px-3 py-2 rounded-md hover:opacity-80 focus:ring-2 focus:ring-gray-500/50">
              Features
            </a>
            <a href="#benefits" className="text-foreground/85 hover:text-foreground transition-opacity duration-200 font-medium px-3 py-2 rounded-md hover:opacity-80 focus:ring-2 focus:ring-gray-500/50">
              Benefits
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/dashboard">
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-4 rounded-md font-bold transition-all duration-200 shadow-md hover:shadow-lg focus:ring-2 focus:ring-primary/50">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroGeometric 
        badge="Professional Trading Analytics Platform"
        title1="Track Forex & Futures"
        title2="With Real-Time Metrics"
      />

      {/* Features Section with Dashboard Preview */}
      <Features6 />
        
      {/* Content sections */}
      <div className="bg-background">
        <section className="py-20 px-6 md:px-12" style={{maxWidth: '1200px', margin: '0 auto'}}>
          <div className="max-w-full">
            <div className="text-center space-y-8 mb-20" style={{marginBottom: '80px'}}>
              <p className="text-lg text-gray-300/85 max-w-4xl mx-auto leading-[1.6] font-normal">
                Professional-grade trading analytics with real-time P&L tracking, win rate analysis,
                profit factor calculations, and interactive equity curves. Track forex pairs, futures,
                and indices with comprehensive trade journaling and performance metrics.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8" style={{marginTop: '32px'}}>
                <Link to="/dashboard">
                  <Button className="bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-4 rounded-md font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 min-w-[200px] focus:ring-2 focus:ring-primary/50">
                    Start Free Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button className="border border-gray-600 hover:border-gray-500 text-foreground/85 px-8 py-4 rounded-md font-semibold text-lg transition-opacity duration-200 min-w-[160px] hover:opacity-80 focus:ring-2 focus:ring-gray-500/50">
                  Watch Demo
                </Button>
              </div>
            </div>

        </div>
      </section>

      {/* TradeVault Features Section */}
      <TradeVaultFeatures />


      
      {/* Trade Journal Section */}
      <SectionWithMockup
        title={
          <span>
            Comprehensive Trade
            <br />
            <span className="text-primary">Journal & Analytics</span>
          </span>
        }
        description="Log every trade with detailed information including entry/exit prices, lot sizes, spreads, commissions, and swap costs. Track trades across forex pairs, futures contracts, and indices with powerful filtering and export capabilities."
        primaryImageSrc="/screenshots/Tradelog%20original%20theme%20.png"
        secondaryImageSrc="/screenshots/add%20a%20new%20trade%20original%20theme%20.png"
        reverseLayout={true}
      />
      
      {/* Calendar Heatmap Section */}
      <SectionWithMockup
        title={
          <span>
            Visual Performance
            <br />
            <span className="text-primary">Calendar Heatmap</span>
          </span>
        }
        description="Get instant insights into your daily trading performance with our intuitive calendar heatmap. Quickly identify profitable and losing days, spot trading patterns, and track your consistency over time."
        primaryImageSrc="/screenshots/Trade%20Calender%20original%20theme.png"
        secondaryImageSrc="/screenshots/P%26L%20STATS%20original%20theme.png"
        reverseLayout={false}
      />




      <Footer7 
        logo={{
          url: "/",
          src: "",
          alt: "TradeVault Logo",
          title: "TradeVault"
        }}
        sections={[
          {
            title: "App",
            links: [
              { name: "Dashboard", href: "/dashboard" },
              { name: "Trade Log", href: "/trades" },
              { name: "Settings", href: "/settings" },
            ],
          },
          {
            title: "Account",
            links: [
              { name: "Sign Up", href: "/signup" },
              { name: "Sign In", href: "/login" },
            ],
          },
        ]}
        description="Track your forex and futures trading performance with professional-grade analytics and journaling tools."
        copyright="© 2024 TradeVault. All rights reserved."
        legalLinks={[]}
      />
      </div>
    </div>
  );
}