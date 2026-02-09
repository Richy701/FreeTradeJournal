import { SiteHeader } from '@/components/site-header';
import { Card, CardContent } from '@/components/ui/card';
import { Footer7 } from '@/components/ui/footer-7';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCookie } from '@fortawesome/free-solid-svg-icons';

export default function CookiePolicy() {
  ;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 rounded-xl shadow-lg bg-primary">
                <FontAwesomeIcon icon={faCookie} className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Cookie Policy</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Cookie Policy Content */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 space-y-8">
              
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">What Are Cookies</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>Cookies are small text files that are stored on your device when you visit FreeTradeJournal. These files contain information that helps us provide you with a better user experience.</p>
                  <p>We use cookies to remember your preferences, keep you logged in, and improve the functionality of our application.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">How We Use Cookies</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>FreeTradeJournal uses cookies for the following purposes:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Essential Cookies:</strong> Required for basic functionality like user authentication and session management</li>
                    <li><strong>Preference Cookies:</strong> Remember your settings like theme selection and display preferences</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the application (anonymous)</li>
                    <li><strong>Local Storage:</strong> Store your trading data locally on your device for offline access</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Types of Cookies We Use</h2>
                <div className="space-y-6 text-muted-foreground">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Strictly Necessary Cookies</h3>
                    <p>These cookies are essential for the application to function properly. They cannot be disabled without severely affecting your user experience.</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Authentication tokens</li>
                      <li>Session management</li>
                      <li>GDPR consent status</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Functional Cookies</h3>
                    <p>These cookies enable enhanced functionality and personalization.</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Theme preferences (dark/light mode)</li>
                      <li>Language settings</li>
                      <li>Trading dashboard layouts</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Analytics Cookies</h3>
                    <p>These cookies help us understand how users interact with our application so we can improve it.</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Usage statistics (anonymous)</li>
                      <li>Feature usage tracking</li>
                      <li>Performance monitoring</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Managing Your Cookie Preferences</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>You have control over the cookies we use:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Browser Settings:</strong> Most browsers allow you to control or delete cookies through their settings</li>
                    <li><strong>Cookie Consent Banner:</strong> Manage your preferences through our cookie consent banner</li>
                    <li><strong>Local Storage:</strong> Your trading data is stored locally and remains under your control</li>
                    <li><strong>Opt-Out:</strong> You can opt out of analytics cookies without affecting core functionality</li>
                  </ul>
                  <p><strong>Note:</strong> Disabling essential cookies may prevent you from using certain features of FreeTradeJournal.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Third-Party Cookies</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>FreeTradeJournal may use third-party services that set their own cookies:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Authentication Services:</strong> For secure login functionality</li>
                    <li><strong>Analytics Providers:</strong> For usage tracking and performance monitoring</li>
                    <li><strong>Error Tracking:</strong> For application stability and bug reporting</li>
                  </ul>
                  <p>These third-party services have their own privacy policies and cookie practices, which we encourage you to review.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Data Protection</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>Your trading data privacy is our priority:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Trading data is stored locally on your device by default</li>
                    <li>We do not access or analyze your personal trading information</li>
                    <li>Cloud sync is optional and encrypted if you choose to enable it</li>
                    <li>You can export or delete your data at any time</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Updates to This Policy</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>We may update this Cookie Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by updating the "Last updated" date at the top of this policy.</p>
                  <p>Your continued use of FreeTradeJournal after any changes indicates your acceptance of the updated policy.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Contact Us</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>If you have any questions about our Cookie Policy or how we handle your data, please contact us:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Email: privacy@freetradejournal.com</li>
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
        description="Track every trade, spot what's working, and build consistency — with professional analytics, journaling, and performance tools. Free forever, no credit card required."
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
              { name: "Documentation", href: "#" },
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