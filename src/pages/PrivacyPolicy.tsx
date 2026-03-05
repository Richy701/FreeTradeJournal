import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-muted-foreground">Last updated: March 5, 2026</p>
        </header>

        <hr className="border-border" />

        <div className="space-y-8 text-foreground/80 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Overview</h2>
            <p>FreeTradeJournal ("we", "us", "our") is committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights regarding your data.</p>
            <p className="mt-2">FreeTradeJournal is a <strong>local-first</strong> application. Your trading data is stored on your device by default and is never sent to our servers unless you explicitly enable cloud sync or use features that require server communication (e.g. AI analysis, Pro subscriptions).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Information We Collect</h2>

            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Email address and display name</li>
              <li>Authentication credentials (managed by Firebase Authentication)</li>
              <li>Google account information if you sign in with Google</li>
            </ul>

            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">Trading Data</h3>
            <p>Your trades, journal entries, goals, and settings are stored locally on your device using browser storage. This data is <strong>not</strong> transmitted to our servers unless you use cloud sync or AI-powered features.</p>

            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">Payment Information</h3>
            <p>If you subscribe to Pro, payment processing is handled entirely by <strong>Stripe</strong>. We do not store your credit card number, CVV, or full billing details. Stripe may collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Payment card details (processed securely by Stripe)</li>
              <li>Billing address and name</li>
              <li>Transaction history</li>
            </ul>
            <p className="mt-2">See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">Stripe's Privacy Policy</a> for details.</p>

            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">AI Features (Pro)</h3>
            <p>When you use AI-powered features (Trading Coach, Trade Review, Strategy Tagger, etc.), relevant trading data is sent to our servers and processed via OpenAI's API to generate personalised insights. This data is:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Used solely to generate your AI analysis</li>
              <li>Not stored permanently on our servers</li>
              <li>Not used to train AI models</li>
            </ul>

            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">Analytics & Diagnostics</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Anonymous usage analytics (Google Analytics) to understand how the app is used</li>
              <li>Error reports and crash logs to improve stability</li>
              <li>Device type, browser, and screen size for compatibility</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve the application</li>
              <li>Authenticate your account and manage sessions</li>
              <li>Process Pro subscription payments via Stripe</li>
              <li>Deliver AI-powered analysis and coaching (Pro users)</li>
              <li>Send important service updates and security notices</li>
              <li>Analyse usage patterns to improve user experience</li>
              <li>Provide customer support</li>
            </ul>
            <p className="mt-2">We <strong>never</strong> sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Data Storage & Security</h2>
            <p>Your trading data is stored locally on your device by default. When cloud features are used:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Authentication</strong> is managed by Firebase Authentication with industry-standard encryption</li>
              <li><strong>Pro status and subscription data</strong> is stored in Google Cloud Firestore with security rules ensuring only your authenticated account can access your data</li>
              <li><strong>All data in transit</strong> is encrypted using TLS/SSL</li>
              <li><strong>Payment data</strong> is handled by Stripe, a PCI DSS Level 1 certified provider</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Firebase</strong> (Google) — authentication and cloud storage</li>
              <li><strong>Stripe</strong> — payment processing for Pro subscriptions</li>
              <li><strong>OpenAI</strong> — AI-powered analysis features (Pro only)</li>
              <li><strong>Google Analytics</strong> — anonymous usage analytics</li>
              <li><strong>Vercel</strong> — application hosting</li>
            </ul>
            <p className="mt-2">Each service has its own privacy policy. We encourage you to review them.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Cookies</h2>
            <p>We use essential cookies for authentication and session management. Analytics cookies are used to understand app usage. For full details, see our <Link to="/cookie-policy" className="text-amber-500 hover:underline">Cookie Policy</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Access</strong> — view and export all your trading data at any time via Settings</li>
              <li><strong>Portability</strong> — export your data in CSV, Excel, or JSON formats</li>
              <li><strong>Deletion</strong> — delete your account and all associated data</li>
              <li><strong>Correction</strong> — update your personal information</li>
              <li><strong>Opt out</strong> — disable analytics tracking</li>
              <li><strong>Withdraw consent</strong> — stop using cloud features at any time; your local data remains yours</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, go to <strong>Settings &rarr; Data Management</strong> or contact us directly.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Data Retention</h2>
            <p>Local data remains on your device until you clear it. Cloud data (account info, subscription status) is retained while your account is active. If you delete your account, all associated cloud data is permanently removed within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Children's Privacy</h2>
            <p>FreeTradeJournal is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from minors.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Changes to This Policy</h2>
            <p>We may update this policy from time to time. Material changes will be communicated via the app or email. The "Last updated" date at the top reflects the most recent revision.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
            <p>Questions about this policy? Reach us at <strong>privacy@freetradejournal.com</strong> or through our <a href="https://tally.so/r/meV7rl" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">feedback form</a>.</p>
          </section>

        </div>
      </div>

      <AppFooter />
    </div>
  );
}
