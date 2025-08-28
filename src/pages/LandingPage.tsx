import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
// import { Card } from '@/components/ui/card'; // unused
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { TradeVaultFeatures } from '@/components/blocks/features-8';
import FeatureShowcase from '@/components/blocks/feature-showcase';
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
  const { user, loading } = useAuth();
  
  // If loading, show nothing or a spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary"></div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Loading TradeVault...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // If user is signed in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
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
            <Link to="/login" className="text-foreground/85 hover:text-foreground transition-opacity duration-200 font-medium px-3 py-2 rounded-md hover:opacity-80 focus:ring-2 focus:ring-gray-500/50">
              Sign In
            </Link>
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
        badge="Professional Trading Journal"
        title1="Track. Analyze. Improve."
        title2="Your Trading Performance"
      />

      {/* Features Section with Dashboard Preview */}
      <Features6 />
        
      {/* Content sections */}
      <div className="bg-background">
        <section className="py-20 px-6 md:px-12" style={{maxWidth: '1200px', margin: '0 auto'}}>
          <div className="max-w-full">
            <div className="text-center space-y-8 mb-20" style={{marginBottom: '80px'}}>
              <p className="text-lg text-gray-300/85 max-w-4xl mx-auto leading-[1.6] font-normal">
                A modern, comprehensive trading journal designed for serious traders. Features real-time P&L tracking, 
                interactive equity curves, mood tracking, screenshot attachments, and professional analytics. 
                Cloud storage with multi-device sync keeps your data secure and accessible anywhere.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8" style={{marginTop: '32px'}}>
                <Link to="/dashboard">
                  <Button className="bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-4 rounded-md font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 min-w-[200px] focus:ring-2 focus:ring-primary/50">
                    Start Free Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

        </div>
      </section>

      {/* TradeVault Features Section */}
      <TradeVaultFeatures />


      

      {/* Trade Log Section */}
      <FeatureShowcase
        title={
          <span>
            Comprehensive Trade
            <br />
            <span className="text-primary">Logging & Management</span>
          </span>
        }
        description="Log every trade with detailed information including entry/exit prices, lot sizes, spreads, commissions, and swap costs. Track trades across forex pairs, futures contracts, and indices with powerful filtering and export capabilities."
        images={[
          { src: "/images/landing/trading log new screenshot .png", alt: "Trade Log View" }
        ]}
        imageLayout="stack"
        reverseLayout={true}
      />
      
      {/* Calendar Section */}
      <FeatureShowcase
        title={
          <span>
            Visual Performance
            <br />
            <span className="text-primary">Calendar Heatmap</span>
          </span>
        }
        description="Track your daily performance with an intuitive calendar heatmap. Quickly identify profitable and losing days, spot trading patterns, and track your consistency over time with beautiful visualizations."
        images={[
          { src: "/images/landing/New Calender screenshot .png", alt: "Calendar Heatmap" }
        ]}
        imageLayout="stack"
        reverseLayout={false}
      />

      {/* Trading Journal Section */}
      <FeatureShowcase
        title={
          <span>
            Trading Journal
            <br />
            <span className="text-primary">& Analysis</span>
          </span>
        }
        description="Document your trading thoughts, strategies, and market observations. Maintain a detailed journal with mood tracking, screenshots, and comprehensive analysis to improve your trading psychology and performance."
        images={[
          { src: "/images/landing/Trading journal new screenshot.png", alt: "Trading Journal" }
        ]}
        imageLayout="stack"
        reverseLayout={true}
      />

      {/* Goals & Risk Management Section */}
      <FeatureShowcase
        title={
          <span>
            Smart Goals &
            <br />
            <span className="text-primary">Risk Management</span>
          </span>
        }
        description="Set clear trading goals and implement robust risk management rules. Track your progress, monitor rule violations, and maintain discipline with automated alerts and comprehensive analytics."
        images={[
          { src: "/images/landing/goals and risk management new screenshot.png", alt: "Goals & Risk Management" }
        ]}
        imageLayout="stack"
        reverseLayout={true}
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
        socialLinks={[
          { 
            icon: <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
            href: "https://x.com/richytiup",
            label: "Follow on X"
          }
        ]}
        copyright="© 2025 TradeVault. All rights reserved."
        legalLinks={[]}
      />
      </div>
    </div>
  );
}