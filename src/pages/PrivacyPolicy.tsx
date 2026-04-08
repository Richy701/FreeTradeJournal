import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { Link } from 'react-router-dom';
import { FeedbackLink } from '@/components/feedback-link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2">Legal</p>
          <h1 className="font-display text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-3 text-muted-foreground">Last updated: April 8, 2026</p>
        </div>

        <div className="divide-y divide-border text-sm leading-relaxed text-muted-foreground">

          <LegalSection title="Overview">
            <p>FreeTradeJournal ("we", "us", "our") is committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights.</p>
            <p className="mt-3">FreeTradeJournal is a <strong className="text-foreground">local-first</strong> application. Your trading data is stored on your device by default and is never sent to our servers unless you explicitly enable cloud sync or use features that require server communication (e.g. AI analysis, Pro subscriptions).</p>
          </LegalSection>

          <LegalSection title="Information We Collect">
            <h3 className="font-semibold text-foreground text-[13px] uppercase tracking-wide mb-2">Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li>Email address and display name</li>
              <li>Authentication credentials (managed by Firebase Authentication)</li>
              <li>Google account information if you sign in with Google</li>
              <li>Apple account information if you sign in with Apple</li>
            </ul>

            <h3 className="font-semibold text-foreground text-[13px] uppercase tracking-wide mt-6 mb-2">Trading Data</h3>
            <p>Your trades, journal entries, goals, and settings are stored locally on your device using browser storage. This data is <strong className="text-foreground">not</strong> transmitted to our servers unless you use cloud sync or AI-powered features.</p>

            <h3 className="font-semibold text-foreground text-[13px] uppercase tracking-wide mt-6 mb-2">Payment Information</h3>
            <p>If you subscribe to Pro, payment processing is handled entirely by <strong className="text-foreground">Stripe</strong>. We do not store your card number, CVV, or full billing details. Stripe may collect payment card details, billing address, and transaction history. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">Stripe's Privacy Policy</a> for details.</p>

            <h3 className="font-semibold text-foreground text-[13px] uppercase tracking-wide mt-6 mb-2">AI Features (Pro)</h3>
            <p>When you use AI-powered features, relevant trading data is sent to our servers and processed via OpenAI's API. When you use Screenshot Import, uploaded images are also sent to OpenAI for extraction. This data is:</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li>Used solely to generate your analysis</li>
              <li>Not stored permanently on our servers</li>
              <li>Not used to train AI models</li>
            </ul>

            <h3 className="font-semibold text-foreground text-[13px] uppercase tracking-wide mt-6 mb-2">Analytics & Diagnostics</h3>
            <ul className="space-y-1 pl-4 list-disc">
              <li>Anonymous usage analytics (PostHog, Vercel Analytics) to understand how the app is used</li>
              <li>Error tracking and crash reports via Sentry to improve stability</li>
              <li>Device type, browser, and screen size for compatibility</li>
            </ul>
          </LegalSection>

          <LegalSection title="How We Use Your Information">
            <ul className="space-y-1 pl-4 list-disc">
              <li>Provide, maintain, and improve the application</li>
              <li>Authenticate your account and manage sessions</li>
              <li>Process Pro subscription payments via Stripe</li>
              <li>Deliver AI-powered analysis and coaching (Pro users)</li>
              <li>Send important service updates and security notices</li>
              <li>Analyse usage patterns to improve the experience</li>
              <li>Provide customer support</li>
            </ul>
            <p className="mt-3">We <strong className="text-foreground">never</strong> sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </LegalSection>

          <LegalSection title="Data Storage & Security">
            <p>Your trading data is stored locally on your device by default. When cloud features are used:</p>
            <ul className="mt-3 space-y-1 pl-4 list-disc">
              <li><strong className="text-foreground">Authentication</strong> is managed by Firebase Authentication with industry-standard encryption</li>
              <li><strong className="text-foreground">Pro status and subscription data</strong> is stored in Google Cloud Firestore with security rules ensuring only your authenticated account can access it</li>
              <li><strong className="text-foreground">All data in transit</strong> is encrypted using TLS/SSL</li>
              <li><strong className="text-foreground">Payment data</strong> is handled by Stripe, a PCI DSS Level 1 certified provider</li>
            </ul>
          </LegalSection>

          <LegalSection title="Third-Party Services">
            <p className="mb-3">We use the following third-party services:</p>
            <dl className="space-y-2">
              {[
                ['Firebase (Google)', 'Authentication and cloud storage'],
                ['Stripe', 'Payment processing for Pro subscriptions'],
                ['OpenAI', 'AI-powered analysis features and screenshot import (Pro only)'],
                ['PostHog', 'Anonymous usage analytics'],
                ['Vercel Analytics', 'Anonymous performance and usage analytics'],
                ['Sentry', 'Error tracking and crash reporting'],
                ['Resend', 'Transactional email delivery'],
                ['Cloudflare', 'DNS, CDN, and DDoS protection'],
                ['Vercel', 'Application hosting'],
              ].map(([name, desc]) => (
                <div key={name} className="grid grid-cols-[160px_1fr] gap-3">
                  <dt className="font-medium text-foreground">{name}</dt>
                  <dd>{desc}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3">Each service has its own privacy policy. We encourage you to review them.</p>
          </LegalSection>

          <LegalSection title="Cookies">
            <p>We use essential cookies for authentication and session management. Analytics cookies are used to understand app usage. For full details, see our <Link to="/cookie-policy" className="text-amber-500 hover:underline">Cookie Policy</Link>.</p>
          </LegalSection>

          <LegalSection title="Your Rights">
            <p className="mb-3">You have the right to:</p>
            <dl className="space-y-2">
              {[
                ['Access', 'View and export all your trading data at any time via Settings'],
                ['Portability', 'Export your data in CSV, Excel, or JSON formats'],
                ['Deletion', 'Delete your account and all associated data'],
                ['Correction', 'Update your personal information'],
                ['Opt out', 'Disable analytics tracking'],
                ['Withdraw consent', 'Stop using cloud features at any time — your local data remains yours'],
              ].map(([right, desc]) => (
                <div key={right} className="grid grid-cols-[120px_1fr] gap-3">
                  <dt className="font-medium text-foreground">{right}</dt>
                  <dd>{desc}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3">To exercise any of these rights, go to <strong className="text-foreground">Settings → Data Management</strong> or contact us directly.</p>
          </LegalSection>

          <LegalSection title="Data Retention">
            <p>Local data remains on your device until you clear it. Cloud data is retained while your account is active. If you delete your account, all associated cloud data is permanently removed within 30 days.</p>
          </LegalSection>

          <LegalSection title="Children's Privacy">
            <p>FreeTradeJournal is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from minors.</p>
          </LegalSection>

          <LegalSection title="Changes to This Policy">
            <p>We may update this policy from time to time. Material changes will be communicated via the app or email. The "Last updated" date at the top reflects the most recent revision.</p>
          </LegalSection>

          <LegalSection title="Contact Us">
            <p>Questions about this policy? Reach us at <strong className="text-foreground">support@freetradejournal.com</strong> or through our <FeedbackLink>feedback form</FeedbackLink>.</p>
          </LegalSection>

        </div>
      </div>

      <AppFooter />
    </div>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-8 first:pt-0">
      <h2 className="text-lg font-semibold text-foreground mb-3">{title}</h2>
      {children}
    </section>
  );
}
