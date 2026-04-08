import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { Link } from 'react-router-dom';
import { FeedbackLink } from '@/components/feedback-link';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2">Legal</p>
          <h1 className="font-display text-4xl font-bold tracking-tight">Cookie Policy</h1>
          <p className="mt-3 text-muted-foreground">Last updated: April 8, 2026</p>
        </div>

        <div className="divide-y divide-border text-sm leading-relaxed text-muted-foreground">

          <LegalSection title="What Are Cookies">
            <p>Cookies are small text files stored on your device when you visit a website. FreeTradeJournal uses cookies and similar technologies (such as browser storage) to keep you signed in, remember your preferences, and understand how the app is used.</p>
          </LegalSection>

          <LegalSection title="Cookies We Use">
            <div className="mt-2 rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Purpose</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    ['Essential',      'Authentication tokens and session management',                                          'Session'],
                    ['Functional',     'Theme preferences, layout settings, and onboarding status',                            'Persistent'],
                    ['Local Storage',  'Trading data, journal entries, goals, and settings (stored on your device)',            'Persistent'],
                    ['Analytics',      'PostHog and Vercel Analytics — anonymous page views, feature usage, and performance',   'Up to 1 year'],
                    ['Security',       'Cloudflare — bot management and DDoS protection',                                       'Up to 30 min'],
                    ['Payment',        'Stripe — fraud prevention and payment session management (Pro subscribers)',             'Session'],
                  ].map(([type, purpose, duration]) => (
                    <tr key={type}>
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{type}</td>
                      <td className="px-4 py-3">{purpose}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LegalSection>

          <LegalSection title="Essential Cookies">
            <p>These are required for FreeTradeJournal to function. They handle authentication, session persistence, and security. <strong className="text-foreground">These cannot be disabled</strong> without losing access to core features like signing in and saving your data.</p>
          </LegalSection>

          <LegalSection title="Functional Storage">
            <p>FreeTradeJournal is a <strong className="text-foreground">local-first</strong> application. Your trading data, journal entries, goals, and settings are stored in your browser's local storage. This data:</p>
            <ul className="mt-3 space-y-1 pl-4 list-disc">
              <li>Never leaves your device unless you use cloud sync or AI features</li>
              <li>Remains available offline</li>
              <li>Is scoped to your user account</li>
              <li>Can be exported or deleted at any time via Settings</li>
            </ul>
          </LegalSection>

          <LegalSection title="Analytics">
            <p>We use PostHog and Vercel Analytics to understand how the app is used, which features are popular, and where we can improve. Analytics data is:</p>
            <ul className="mt-3 space-y-1 pl-4 list-disc">
              <li>Anonymised — no personally identifiable information is collected</li>
              <li>Used solely for product improvement</li>
              <li>Never shared with third parties for marketing</li>
            </ul>
          </LegalSection>

          <LegalSection title="Third-Party Cookies">
            <p className="mb-3">The following services may set cookies when you use FreeTradeJournal:</p>
            <dl className="space-y-2">
              {[
                ['Firebase / Google', 'Authentication and session management'],
                ['PostHog', 'Anonymous usage analytics'],
                ['Vercel Analytics', 'Anonymous performance analytics'],
                ['Cloudflare', 'Bot management and DDoS protection'],
                ['Stripe', 'Payment processing and fraud prevention (Pro subscribers only)'],
              ].map(([name, desc]) => (
                <div key={name} className="grid grid-cols-[160px_1fr] gap-3">
                  <dt className="font-medium text-foreground">{name}</dt>
                  <dd>{desc}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3">Each service operates under its own privacy and cookie policies.</p>
          </LegalSection>

          <LegalSection title="Managing Cookies">
            <p className="mb-3">You can control cookies through:</p>
            <ul className="space-y-1 pl-4 list-disc">
              <li><strong className="text-foreground">Browser settings</strong> — most browsers let you view, manage, and delete cookies</li>
              <li><strong className="text-foreground">App settings</strong> — clear your local data via Settings → Data Management</li>
            </ul>
            <p className="mt-3"><strong className="text-foreground">Note:</strong> Disabling essential cookies or clearing local storage will sign you out and may result in loss of locally stored trading data. Export your data first.</p>
          </LegalSection>

          <LegalSection title="Updates to This Policy">
            <p>We may update this policy to reflect changes in our practices or applicable laws. Changes will be posted on this page with an updated date.</p>
          </LegalSection>

          <LegalSection title="Related Policies">
            <ul className="space-y-1 pl-4 list-disc">
              <li><Link to="/privacy" className="text-amber-500 hover:underline">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-amber-500 hover:underline">Terms and Conditions</Link></li>
            </ul>
          </LegalSection>

          <LegalSection title="Contact Us">
            <p>Questions about cookies? Reach us at <strong className="text-foreground">support@freetradejournal.com</strong> or through our <FeedbackLink>feedback form</FeedbackLink>.</p>
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
