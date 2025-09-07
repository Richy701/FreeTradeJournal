import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer7 } from '@/components/ui/footer-7';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt } from '@fortawesome/free-solid-svg-icons';

export default function PrivacyPolicy() {
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
                <FontAwesomeIcon icon={faShieldAlt} className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Privacy Policy</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Privacy Policy Content */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 space-y-8">
              
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Information We Collect</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>FreeTradeJournal operates as a local-first application. All your trading data is stored locally on your device and is not transmitted to our servers unless you explicitly choose to use cloud sync features.</p>
                  <p>We may collect the following information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Account information (email, name) if you create an account</li>
                    <li>Usage analytics to improve the application (anonymous)</li>
                    <li>Crash reports and error logs to fix bugs</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>Your information is used to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide and maintain the FreeTradeJournal application</li>
                    <li>Improve our services and user experience</li>
                    <li>Send important service updates and notifications</li>
                    <li>Provide customer support when requested</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Data Storage and Security</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>Your trading data remains on your local device by default. We implement industry-standard security measures to protect any data that may be transmitted or stored on our servers.</p>
                  <p>Your trading information is sensitive financial data, and we treat it with the utmost care and confidentiality.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Third-Party Services</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>FreeTradeJournal may integrate with third-party services to enhance functionality:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Analytics services for usage tracking (anonymous)</li>
                    <li>Authentication services for secure login</li>
                    <li>Cloud storage providers for data sync (if enabled)</li>
                  </ul>
                  <p>These services have their own privacy policies, which we encourage you to review.</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Your Rights</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access and export your data at any time</li>
                    <li>Delete your account and associated data</li>
                    <li>Opt out of analytics and tracking</li>
                    <li>Request clarification about data usage</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Contact Us</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>If you have any questions about this Privacy Policy or your data, please contact us:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Email: privacy@freetradejournal.com</li>
                    <li>Through our feedback system in the application</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Changes to This Policy</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>
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
              { name: "Get Help", href: "https://t.me/+UI6uTKgfswUwNzhk" },
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