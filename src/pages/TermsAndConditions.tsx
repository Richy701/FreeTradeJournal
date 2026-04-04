import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { Link } from 'react-router-dom';
import { FeedbackLink } from '@/components/feedback-link';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight">Terms and Conditions</h1>
          <p className="mt-2 text-muted-foreground">Last updated: April 3, 2026</p>
        </header>

        <hr className="border-border" />

        <div className="space-y-8 text-foreground/80 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Acceptance of Terms</h2>
            <p>By accessing and using FreeTradeJournal ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Description of Service</h2>
            <p>FreeTradeJournal is a web-based trading journal and analytics platform that allows users to log trades, track performance, set goals, and analyse trading activity. The Service is available in two tiers:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Free</strong> — core trade logging, analytics, journaling, calendar heatmap, goals and risk management, CSV import/export</li>
              <li><strong>Pro</strong> — all Free features plus AI-powered coaching, trade reviews, strategy tagging, risk alerts, journal prompts, PDF Trading Wrapped reports, PropTracker screenshot import, unlimited prop firm accounts, and cloud sync</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Account Registration</h2>
            <p>To use certain features, you must create an account with accurate and complete information. You can sign in with email/password, Google, or Apple. You are responsible for:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activity that occurs under your account</li>
              <li>Notifying us immediately of any unauthorised access</li>
            </ul>
            <p className="mt-2">You must be at least 18 years old to create an account and use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Pro Subscription & Payments</h2>
            <p>Pro subscriptions are billed through <strong>Stripe</strong>. By subscribing, you agree to the following:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Monthly/Yearly plans</strong> automatically renew at the end of each billing period unless cancelled</li>
              <li><strong>Lifetime plans</strong> are a one-time purchase granting permanent Pro access</li>
              <li>Prices are displayed in USD and may be subject to applicable taxes</li>
              <li>You may cancel your subscription at any time via <strong>Settings &rarr; Subscription</strong> or through the Stripe Customer Portal</li>
              <li>Cancellation takes effect at the end of the current billing period — you retain Pro access until then</li>
            </ul>

            <h3 className="text-base font-semibold text-foreground mt-4 mb-2">Refunds</h3>
            <p>Monthly and yearly subscriptions may be eligible for a refund within 7 days of the initial purchase if you have not extensively used Pro features. Lifetime purchases are non-refundable after 14 days. To request a refund, contact us at <strong>support@freetradejournal.com</strong>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Free Tier</h2>
            <p>The Free tier provides full access to core trading journal features at no cost, with no time limit. We reserve the right to modify Free tier features, but will provide reasonable notice of any material changes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Not Financial Advice</h2>
            <p><strong>FreeTradeJournal is a journal and analysis tool only.</strong> It does not provide investment advice, trading signals, financial recommendations, or portfolio management services.</p>
            <p className="mt-2">AI-powered features (Trading Coach, Trade Review, etc.) provide analysis based on your historical data. These insights are for educational and informational purposes only and should not be construed as financial advice.</p>
            <p className="mt-2">Trading financial instruments carries a high level of risk and may not be suitable for all individuals. You are solely responsible for your trading decisions and any resulting gains or losses.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Data Accuracy</h2>
            <p>While we strive for accurate calculations, you are responsible for verifying all trading data, P&L figures, and analytics. FreeTradeJournal should not be your sole source for performance analysis, tax reporting, or compliance purposes. Always cross-reference with your broker statements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to reverse engineer, decompile, or disassemble the software</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Share your account credentials with others</li>
              <li>Use automated tools to scrape or access the Service</li>
              <li>Resell or redistribute Pro features or access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Intellectual Property</h2>
            <p>FreeTradeJournal and its original content, features, and functionality are owned by FreeTradeJournal and are protected by copyright, trademark, and other intellectual property laws. Your trading data remains your property at all times.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Service Availability</h2>
            <p>We aim for high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable for maintenance, updates, or factors beyond our control. Since FreeTradeJournal is local-first, most features remain available offline.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Account Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time via <strong>Settings &rarr; Data Management</strong>. Upon deletion:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your cloud data will be permanently removed within 30 days</li>
              <li>Active Pro subscriptions will be cancelled</li>
              <li>Local data on your device is not affected and remains under your control</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, FreeTradeJournal and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Loss of profits, data, or trading opportunities</li>
              <li>Trading losses resulting from reliance on the Service</li>
              <li>Inaccuracies in calculations, analytics, or AI-generated insights</li>
              <li>Service interruptions or data loss</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Privacy</h2>
            <p>Your use of the Service is also governed by our <Link to="/privacy" className="text-amber-500 hover:underline">Privacy Policy</Link>, which describes how we collect, use, and protect your information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Modifications</h2>
            <p>We may revise these terms at any time. Material changes will be communicated via the app or email. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Governing Law</h2>
            <p>These terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to conflict of law provisions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Contact</h2>
            <p>Questions about these terms? Reach us at <strong>support@freetradejournal.com</strong> or through our <FeedbackLink>feedback form</FeedbackLink>.</p>
          </section>

        </div>
      </div>

      <AppFooter />
    </div>
  );
}
