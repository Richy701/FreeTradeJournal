import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight">Cookie Policy</h1>
          <p className="mt-2 text-muted-foreground">Last updated: January 1, 2025</p>
        </header>

        <hr className="border-border" />

        <div className="space-y-8 text-foreground/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit FreeTradeJournal. They help us remember your preferences, keep you logged in, and improve functionality.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">How We Use Cookies</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Essential</strong> — authentication and session management</li>
              <li><strong>Preferences</strong> — theme, layout, and display settings</li>
              <li><strong>Analytics</strong> — anonymous usage data to improve the app</li>
              <li><strong>Local Storage</strong> — trading data stored on your device for offline access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Types of Cookies</h2>
            <h3 className="font-medium text-foreground mt-4 mb-1">Strictly Necessary</h3>
            <p>Authentication tokens, session management, and GDPR consent status. These cannot be disabled.</p>

            <h3 className="font-medium text-foreground mt-4 mb-1">Functional</h3>
            <p>Theme preferences, language settings, and dashboard layouts.</p>

            <h3 className="font-medium text-foreground mt-4 mb-1">Analytics</h3>
            <p>Anonymous usage statistics, feature tracking, and performance monitoring.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Managing Cookies</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Control or delete cookies through your browser settings</li>
              <li>Use our cookie consent banner to manage preferences</li>
              <li>Opt out of analytics cookies without affecting core functionality</li>
            </ul>
            <p className="mt-2"><strong>Note:</strong> Disabling essential cookies may prevent certain features from working.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Third-Party Cookies</h2>
            <p>We may use third-party services for authentication, analytics, and error tracking. These services have their own cookie practices, which we encourage you to review.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Data Protection</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Trading data is stored locally on your device by default</li>
              <li>We do not access or analyze your personal trading information</li>
              <li>Cloud sync is optional and encrypted</li>
              <li>You can export or delete your data at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Updates to This Policy</h2>
            <p>We may update this policy to reflect changes in our practices or applicable laws. Changes will be posted here with an updated date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
            <p>Questions? Reach us at <strong>privacy@freetradejournal.com</strong> or through the in-app feedback system.</p>
          </section>
        </div>
      </div>

      <AppFooter />
    </div>
  );
}
