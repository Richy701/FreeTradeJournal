import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight">Terms and Conditions</h1>
          <p className="mt-2 text-muted-foreground">Last updated: January 1, 2025</p>
        </header>

        <hr className="border-border" />

        <div className="space-y-8 text-foreground/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Acceptance of Terms</h2>
            <p>By accessing and using FreeTradeJournal, you agree to be bound by these terms. If you do not agree, please do not use the application.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Use License</h2>
            <p>You are granted a personal, non-commercial license to use FreeTradeJournal for trading analysis and journaling. Under this license you may not:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Modify or copy the application materials</li>
              <li>Use the materials for commercial purposes or public display</li>
              <li>Attempt to reverse engineer the software</li>
              <li>Remove any copyright or proprietary notations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Disclaimer</h2>
            <p><strong>FreeTradeJournal is a journal and analysis tool only.</strong> It does not provide investment advice, trading signals, or financial recommendations.</p>
            <p className="mt-2">Trading carries a high level of risk and may not be suitable for all investors. You are solely responsible for your trading decisions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Data Accuracy</h2>
            <p>While we strive for accurate calculations, you are responsible for verifying all trading data. FreeTradeJournal should not be your sole source for performance analysis or tax reporting.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Limitations</h2>
            <p>FreeTradeJournal and its suppliers shall not be liable for any damages arising from the use or inability to use the application, including loss of data or profit.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Accuracy of Materials</h2>
            <p>Materials in FreeTradeJournal may contain technical or typographical errors. We do not warrant that any materials are accurate, complete, or current.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Modifications</h2>
            <p>We may revise these terms at any time without notice. Continued use of the application constitutes acceptance of the current terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Governing Law</h2>
            <p>These terms are governed by the laws of the jurisdiction where FreeTradeJournal operates.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Contact</h2>
            <p>Questions? Reach us at <strong>legal@freetradejournal.com</strong> or through the in-app feedback system.</p>
          </section>
        </div>
      </div>

      <AppFooter />
    </div>
  );
}
