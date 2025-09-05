import { SiteHeader } from '@/components/site-header';
import { Card, CardContent } from '@/components/ui/card';
import { Footer7 } from '@/components/ui/footer-7';
import { useThemePresets } from '@/contexts/theme-presets';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGavel } from '@fortawesome/free-solid-svg-icons';

export default function TermsAndConditions() {
  const { themeColors } = useThemePresets();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div 
                className="p-3 rounded-xl shadow-lg"
                style={{ backgroundColor: themeColors.primary }}
              >
                <FontAwesomeIcon icon={faGavel} className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Terms and Conditions</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Terms Content */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 space-y-8">
              
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Acceptance of Terms</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>By accessing and using FreeTradeJournal, you accept and agree to be bound by the terms and provision of this agreement.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Use License</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>Permission is granted to temporarily use FreeTradeJournal for personal, non-commercial trading analysis and journaling purposes. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Modify or copy the application materials</li>
                    <li>Use the materials for any commercial purpose or for any public display</li>
                    <li>Attempt to reverse engineer any software contained in FreeTradeJournal</li>
                    <li>Remove any copyright or other proprietary notations</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Disclaimer</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong>FreeTradeJournal is a trading journal and analysis tool only.</strong> It does not provide investment advice, trading signals, or financial recommendations.</p>
                  <p>Trading foreign exchange, futures, and other financial instruments carries a high level of risk and may not be suitable for all investors. Past performance is not indicative of future results.</p>
                  <p>You are solely responsible for your trading decisions and any resulting profits or losses.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Data Accuracy</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>While we strive to ensure the accuracy of calculations and analytics provided by FreeTradeJournal, you are responsible for verifying all trading data and calculations.</p>
                  <p>FreeTradeJournal should not be your sole source for trading performance analysis or tax reporting purposes.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Limitations</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>In no event shall FreeTradeJournal or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use FreeTradeJournal, even if FreeTradeJournal or a FreeTradeJournal authorized representative has been notified orally or in writing of the possibility of such damage.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Accuracy of Materials</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>The materials appearing in FreeTradeJournal could include technical, typographical, or photographic errors. FreeTradeJournal does not warrant that any of the materials are accurate, complete, or current.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Modifications</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>FreeTradeJournal may revise these terms of service at any time without notice. By using this application, you are agreeing to be bound by the current version of these terms of service.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Governing Law</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction where FreeTradeJournal operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that jurisdiction.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Contact Information</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>If you have any questions about these Terms and Conditions, please contact us:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Email: legal@freetradejournal.com</li>
                    <li>Through our feedback system in the application</li>
                  </ul>
                </div>
              </section>

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
              { name: "Support", href: "mailto:support@freetradejournal.com" },
              { name: "Community", href: "#" },
              { name: "Blog", href: "/blog" }
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