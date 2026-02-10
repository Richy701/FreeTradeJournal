import { SiteHeader } from '@/components/site-header';
import { Footer7 } from '@/components/ui/footer-7';
import { footerConfig } from '@/components/ui/footer-config';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-muted-foreground">Last updated: January 1, 2025</p>
        </header>

        <hr className="border-border" />

        <div className="space-y-8 text-foreground/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Information We Collect</h2>
            <p>FreeTradeJournal is local-first — your trading data stays on your device and is never sent to our servers unless you enable cloud sync.</p>
            <p className="mt-2">We may collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Account info (email, name) if you create an account</li>
              <li>Anonymous usage analytics to improve the app</li>
              <li>Crash reports and error logs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and maintain the application</li>
              <li>Improve our services and user experience</li>
              <li>Send important service updates</li>
              <li>Provide customer support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Data Storage & Security</h2>
            <p>Your trading data remains on your device by default. Any data transmitted to our servers is protected with industry-standard security measures. We treat your financial data with the utmost care.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Third-Party Services</h2>
            <p>We may integrate with third-party services for analytics, authentication, and cloud storage. Each has its own privacy policy, which we encourage you to review.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Your Rights</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access and export your data at any time</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of analytics and tracking</li>
              <li>Request clarification about data usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
            <p>Questions about this policy? Reach us at <strong>privacy@freetradejournal.com</strong> or through the in-app feedback system.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Changes to This Policy</h2>
            <p>We may update this policy from time to time. Changes will be posted on this page with an updated date.</p>
          </section>
        </div>
      </div>

      <Footer7 {...footerConfig} />
    </div>
  );
}
