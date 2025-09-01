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
import { BuyMeCoffee } from '@/components/ui/buy-me-coffee';
import { FeedbackButton } from '@/components/ui/feedback-button';
import { FAQSection } from '@/components/blocks/faq-section';
import { LogoCloud } from '@/components/blocks/logo-cloud';
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
      <header className="absolute top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-md bg-background/60">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-9 w-9 text-primary" />
            <span className="text-2xl font-bold text-foreground">TradeVault</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/login" className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium px-3 py-2 rounded-md focus:ring-2 focus:ring-ring/50">
              Sign In
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <FeedbackButton variant="outline" />
            <BuyMeCoffee username="richy701" variant="outline" />
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

      {/* Logo Cloud - Prop Firms */}
      <LogoCloud />

      {/* Features Section with Dashboard Preview */}
      <Features6 />
        
      {/* Content sections */}
      <div className="bg-background">
        <section className="py-20 px-6 md:px-12" style={{maxWidth: '1200px', margin: '0 auto'}}>
          <div className="max-w-full">
            <div className="text-center space-y-8 mb-20" style={{marginBottom: '80px'}}>
              <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-[1.6] font-normal">
                Take control of your trading journey with TradeVault - the comprehensive journaling platform built for serious traders. 
                Track every trade, analyze your performance with professional-grade metrics, and identify patterns that impact your profitability. 
                From detailed P&L tracking to psychological insights, TradeVault gives you the tools to transform your trading.
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

      {/* FAQ Section */}
      <FAQSection />

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
          },
          {
            icon: <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364zm-6.159 3.9c-.862.37-1.84.788-3.109.788a5.884 5.884 0 01-1.569-.217l.877 9.004c.065.78.717 1.38 1.5 1.38 0 0 1.243.065 1.658.065.447 0 1.786-.065 1.786-.065.783 0 1.434-.6 1.499-1.38l.94-9.95a3.996 3.996 0 00-1.322-.238c-.826 0-1.491.284-2.26.613z"/></svg>,
            href: "https://www.buymeacoffee.com/richy701",
            label: "Buy me a coffee"
          }
        ]}
        copyright="© 2025 TradeVault. All rights reserved."
        legalLinks={[
          { name: "Privacy Policy", href: "/privacy" },
          { name: "Terms and Conditions", href: "/terms" },
        ]}
      />
      </div>
    </div>
  );
}