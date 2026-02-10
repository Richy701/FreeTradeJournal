import { SiteHeader } from '@/components/site-header';
import { Footer7 } from '@/components/ui/footer-7';
import { footerConfig } from '@/components/ui/footer-config';

export default function Documentation() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
          <p className="mt-2 text-muted-foreground">Everything you need to get started with FreeTradeJournal.</p>
        </header>

        <hr className="border-border" />

        <div className="space-y-10 text-foreground/80 leading-relaxed">

          {/* Quick Start */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Start</h2>
            <ol className="list-decimal pl-6 space-y-3">
              <li><strong>Set up your profile</strong> — configure trading preferences, account settings, and risk parameters.</li>
              <li><strong>Add your first trade</strong> — log entry/exit prices, lot size, and costs for accurate P&L tracking.</li>
              <li><strong>Import historical data</strong> — upload CSV files from your broker to backfill your trade history.</li>
              <li><strong>Set trading goals</strong> — define profit targets, risk limits, and rules to maintain discipline.</li>
            </ol>
          </section>

          {/* Trade Logging */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Trade Logging</h2>
            <p>Log trades with entry/exit prices, lot sizes, spreads, commissions, and swap costs. Supports forex, futures, and stocks with real-time P&L calculation.</p>
          </section>

          {/* Calendar Heatmap */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Calendar Heatmap</h2>
            <p>Visualize daily performance with a color-coded heatmap. Identify patterns, track streaks, and view monthly or yearly performance at a glance.</p>
          </section>

          {/* Trading Journal */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Trading Journal</h2>
            <p>Document strategies, market observations, and trading psychology. Track your mood, attach screenshots, and build a searchable record of your decision-making.</p>
          </section>

          {/* Goals & Risk */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Goals & Risk Management</h2>
            <p>Set trading goals, enforce risk rules, and monitor violations. Stay disciplined with performance alerts and progress tracking.</p>
          </section>

          {/* CSV Import */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">CSV Import</h2>
            <p>Import trade history from any broker via CSV. Supports MetaTrader, TradingView, and most prop firm formats with automatic field mapping and duplicate detection.</p>
          </section>

          {/* Advanced Analytics */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Advanced Analytics</h2>
            <p>Professional-grade metrics including Sharpe ratio, profit factor, and maximum drawdown. AI-powered pattern detection identifies overtrading, revenge trading, and FOMO behaviors.</p>
          </section>

          {/* Filtering & Search */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Filtering & Search</h2>
            <p>Filter by date, instrument, strategy, or outcome. Save common filter combinations and export results to CSV or Excel.</p>
          </section>

          {/* Export & Reporting */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Export & Reporting</h2>
            <p>Generate reports for tax purposes, performance reviews, or prop firm evaluations. Export in CSV, Excel, or PDF with custom templates.</p>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">FAQ</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-foreground">Is my trading data secure?</h3>
                <p className="mt-1">Yes. Data is stored locally on your device by default. Cloud sync uses industry-standard encryption, and your financial information never leaves your control without consent.</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">What file formats can I import?</h3>
                <p className="mt-1">CSV files from most major brokers — MetaTrader, TradingView, Interactive Brokers, and common prop firm formats.</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Can I use this for tax reporting?</h3>
                <p className="mt-1">FreeTradeJournal provides detailed P&L calculations and exports, but always verify data accuracy and consult a tax professional.</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Does FreeTradeJournal provide trading advice?</h3>
                <p className="mt-1">No. FreeTradeJournal is purely an analysis and journaling tool. All trading decisions remain your responsibility.</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">How do I export my data?</h3>
                <p className="mt-1">Go to Settings &rarr; Data Management to export trades, journal entries, and analytics in CSV, Excel, or JSON.</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Can I use this offline?</h3>
                <p className="mt-1">Yes. All data is stored locally, so you can log trades, journal, and view analytics without an internet connection.</p>
              </div>
            </div>
          </section>

          {/* Support */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Need Help?</h2>
            <p>Have a question not covered here? <a href="https://tally.so/r/meV7rl" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Send us feedback</a>.</p>
          </section>

        </div>
      </div>

      <Footer7 {...footerConfig} />
    </div>
  );
}
