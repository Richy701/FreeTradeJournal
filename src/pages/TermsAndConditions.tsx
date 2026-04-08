import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { Link } from 'react-router-dom';
import { FeedbackLink } from '@/components/feedback-link';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2">Legal</p>
          <h1 className="font-display text-4xl font-bold tracking-tight">Terms and Conditions</h1>
          <p className="mt-3 text-muted-foreground">Last updated: April 8, 2026</p>
        </div>

        <div className="divide-y divide-border text-sm leading-relaxed text-muted-foreground">

          <LegalSection title="Acceptance of Terms">
            <p>By accessing and using FreeTradeJournal ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Service.</p>
          </LegalSection>

          <LegalSection title="Description of Service">
            <p className="mb-3">FreeTradeJournal is a web-based trading journal and analytics platform. It is available in two tiers:</p>
            <dl className="space-y-2">
              <div className="grid grid-cols-[60px_1fr] gap-3">
                <dt className="font-medium text-foreground">Free</dt>
                <dd>Core trade logging, analytics, journaling, calendar heatmap, goals and risk management, and CSV import/export.</dd>
              </div>
              <div className="grid grid-cols-[60px_1fr] gap-3">
                <dt className="font-medium text-foreground">Pro</dt>
                <dd>All Free features plus AI coaching, trade reviews, strategy tagging, risk alerts, journal prompts, PropTracker screenshot import, unlimited prop firm accounts, and cloud sync.</dd>
              </div>
            </dl>
          </LegalSection>

          <LegalSection title="Account Registration">
            <p>To use certain features, you must create an account with accurate and complete information. You can sign in with email/password, Google, or Apple. You are responsible for:</p>
            <ul className="mt-3 space-y-1 pl-4 list-disc">
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activity that occurs under your account</li>
              <li>Notifying us immediately of any unauthorised access</li>
            </ul>
            <p className="mt-3">You must be at least 18 years old to create an account and use the Service.</p>
          </LegalSection>

          <LegalSection title="Pro Subscription & Payments">
            <p className="mb-3">Pro subscriptions are billed through <strong className="text-foreground">Stripe</strong>. By subscribing, you agree to the following:</p>
            <ul className="space-y-1 pl-4 list-disc">
              <li><strong className="text-foreground">Monthly/Yearly plans</strong> include a 14-day free trial for new subscribers. You will not be charged until the trial ends. Cancel any time during the trial and you won't be charged.</li>
              <li>Monthly and yearly plans automatically renew at the end of each billing period unless cancelled.</li>
              <li><strong className="text-foreground">Lifetime plans</strong> are a one-time purchase granting permanent Pro access. No trial applies.</li>
              <li>Prices are displayed in USD and may be subject to applicable taxes.</li>
              <li>You may cancel at any time via <strong className="text-foreground">Settings → Subscription</strong>. Cancellation takes effect at the end of the current billing period.</li>
            </ul>

            <h3 className="font-semibold text-foreground text-[13px] uppercase tracking-wide mt-6 mb-2">Refunds</h3>
            <p>Monthly and yearly subscriptions may be eligible for a refund within 7 days of the initial charge if you have not extensively used Pro features. Lifetime purchases are non-refundable after 14 days. To request a refund, contact us at <strong className="text-foreground">support@freetradejournal.com</strong>.</p>
          </LegalSection>

          <LegalSection title="Free Tier">
            <p>The Free tier provides full access to core trading journal features at no cost, with no time limit. We reserve the right to modify Free tier features, but will provide reasonable notice of any material changes.</p>
          </LegalSection>

          <LegalSection title="Not Financial Advice">
            <p><strong className="text-foreground">FreeTradeJournal is a journal and analysis tool only.</strong> It does not provide investment advice, trading signals, financial recommendations, or portfolio management services.</p>
            <p className="mt-3">AI-powered features provide analysis based on your historical data for educational and informational purposes only. They should not be construed as financial advice.</p>
            <p className="mt-3">Trading financial instruments carries a high level of risk. You are solely responsible for your trading decisions and any resulting gains or losses.</p>
          </LegalSection>

          <LegalSection title="Data Accuracy">
            <p>While we strive for accurate calculations, you are responsible for verifying all trading data, P&L figures, and analytics. FreeTradeJournal should not be your sole source for performance analysis, tax reporting, or compliance purposes. Always cross-reference with your broker statements.</p>
          </LegalSection>

          <LegalSection title="Acceptable Use">
            <p className="mb-3">You agree not to:</p>
            <ul className="space-y-1 pl-4 list-disc">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to reverse engineer, decompile, or disassemble the software</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Share your account credentials with others</li>
              <li>Use automated tools to scrape or access the Service</li>
              <li>Resell or redistribute Pro features or access</li>
            </ul>
          </LegalSection>

          <LegalSection title="Intellectual Property">
            <p>FreeTradeJournal and its original content, features, and functionality are owned by FreeTradeJournal and protected by copyright, trademark, and other intellectual property laws. Your trading data remains your property at all times.</p>
          </LegalSection>

          <LegalSection title="Service Availability">
            <p>We aim for high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable for maintenance or factors beyond our control. Since FreeTradeJournal is local-first, most features remain available offline.</p>
          </LegalSection>

          <LegalSection title="Account Termination">
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time via <strong className="text-foreground">Settings → Data Management</strong>. Upon deletion:</p>
            <ul className="mt-3 space-y-1 pl-4 list-disc">
              <li>Your cloud data will be permanently removed within 30 days</li>
              <li>Active Pro subscriptions will be cancelled</li>
              <li>Local data on your device is not affected and remains under your control</li>
            </ul>
          </LegalSection>

          <LegalSection title="Limitation of Liability">
            <p className="mb-3">To the maximum extent permitted by law, FreeTradeJournal and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including:</p>
            <ul className="space-y-1 pl-4 list-disc">
              <li>Loss of profits, data, or trading opportunities</li>
              <li>Trading losses resulting from reliance on the Service</li>
              <li>Inaccuracies in calculations, analytics, or AI-generated insights</li>
              <li>Service interruptions or data loss</li>
            </ul>
          </LegalSection>

          <LegalSection title="Privacy">
            <p>Your use of the Service is also governed by our <Link to="/privacy" className="text-amber-500 hover:underline">Privacy Policy</Link>, which describes how we collect, use, and protect your information.</p>
          </LegalSection>

          <LegalSection title="Modifications">
            <p>We may revise these terms at any time. Material changes will be communicated via the app or email. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>
          </LegalSection>

          <LegalSection title="Governing Law">
            <p>These terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to conflict of law provisions.</p>
          </LegalSection>

          <LegalSection title="Contact">
            <p>Questions about these terms? Reach us at <strong className="text-foreground">support@freetradejournal.com</strong> or through our <FeedbackLink>feedback form</FeedbackLink>.</p>
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
