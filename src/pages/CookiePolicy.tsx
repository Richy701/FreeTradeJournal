import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { Link } from 'react-router-dom';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight">Cookie Policy</h1>
          <p className="mt-2 text-muted-foreground">Last updated: March 5, 2026</p>
        </header>

        <hr className="border-border" />

        <div className="space-y-8 text-foreground/80 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit a website. FreeTradeJournal uses cookies and similar technologies (such as localStorage) to remember your preferences, keep you signed in, and improve your experience.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Cookies We Use</h2>

            <div className="mt-4 rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Purpose</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Essential</td>
                    <td className="px-4 py-3">Firebase authentication tokens, session management</td>
                    <td className="px-4 py-3">Session</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Functional</td>
                    <td className="px-4 py-3">Theme preferences, colour presets, layout settings, onboarding status</td>
                    <td className="px-4 py-3">Persistent</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Local Storage</td>
                    <td className="px-4 py-3">Trading data, journal entries, goals, account settings (stored locally on your device)</td>
                    <td className="px-4 py-3">Persistent</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Analytics</td>
                    <td className="px-4 py-3">Google Analytics — anonymous page views, feature usage, and performance metrics</td>
                    <td className="px-4 py-3">Up to 2 years</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Security</td>
                    <td className="px-4 py-3">Cloudflare — bot management, DDoS protection, and secure content delivery</td>
                    <td className="px-4 py-3">Up to 30 minutes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Payment</td>
                    <td className="px-4 py-3">Stripe — fraud prevention and payment session management (Pro subscribers)</td>
                    <td className="px-4 py-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Essential Cookies</h2>
            <p>These are required for FreeTradeJournal to function. They handle authentication (Firebase), session persistence, and security. <strong>These cannot be disabled</strong> without losing access to core features like signing in and saving your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Functional Cookies & Local Storage</h2>
            <p>FreeTradeJournal is a <strong>local-first</strong> application. Your trading data, journal entries, goals, and settings are stored in your browser's localStorage. This data:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Never leaves your device unless you use cloud sync or AI features</li>
              <li>Remains available even when offline</li>
              <li>Is scoped to your user account (multi-user support)</li>
              <li>Can be exported or deleted at any time via Settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Analytics Cookies</h2>
            <p>We use Google Analytics to understand how the app is used, which features are popular, and where we can improve. Analytics data is:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Anonymised — no personally identifiable information is collected</li>
              <li>Used solely for product improvement</li>
              <li>Never shared with third parties for marketing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Third-Party Cookies</h2>
            <p>The following third-party services may set cookies when you use FreeTradeJournal:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Firebase / Google</strong> — authentication and session management</li>
              <li><strong>Google Analytics</strong> — anonymous usage analytics</li>
              <li><strong>Cloudflare</strong> — bot management, DDoS protection, and secure content delivery</li>
              <li><strong>Stripe</strong> — payment processing and fraud prevention (Pro subscribers only)</li>
            </ul>
            <p className="mt-2">Each service operates under its own privacy and cookie policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Managing Cookies</h2>
            <p>You can control cookies through:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Browser settings</strong> — most browsers allow you to view, manage, and delete cookies</li>
              <li><strong>App settings</strong> — clear your local data via Settings &rarr; Data Management</li>
              <li><strong>Google Analytics opt-out</strong> — install the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">Google Analytics Opt-out Browser Add-on</a></li>
            </ul>
            <p className="mt-2"><strong>Note:</strong> Disabling essential cookies or clearing localStorage will sign you out and may result in loss of locally stored trading data. We recommend exporting your data first.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Updates to This Policy</h2>
            <p>We may update this policy to reflect changes in our practices or applicable laws. Changes will be posted on this page with an updated date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Related Policies</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><Link to="/privacy" className="text-amber-500 hover:underline">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-amber-500 hover:underline">Terms and Conditions</Link></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
            <p>Questions about cookies? Reach us at <strong>support@freetradejournal.com</strong> or through our <a href="https://tally.so/r/meV7rl" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">feedback form</a>.</p>
          </section>

        </div>
      </div>

      <AppFooter />
    </div>
  );
}
