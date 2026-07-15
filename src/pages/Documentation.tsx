import { useEffect, useRef, useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { AppFooter } from '@/components/app-footer';
import { FeedbackLink } from '@/components/feedback-link';
import { ProBadge } from '@/components/pro-badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const sections = [
  { id: 'quick-start',    label: 'Quick Start' },
  { id: 'dashboard',      label: 'Dashboard' },
  { id: 'trade-logging',  label: 'Trade Logging' },
  { id: 'calendar',       label: 'Calendar Heatmap' },
  { id: 'journal',        label: 'Trading Journal' },
  { id: 'goals',          label: 'Goals & Risk' },
  { id: 'csv-import',     label: 'CSV Import' },
  { id: 'analytics',      label: 'Advanced Analytics' },
  { id: 'ai-features',    label: 'AI Features' },
  { id: 'trade-insights', label: 'Trade Insights',    pro: true },
  { id: 'themes',         label: 'Themes' },
  { id: 'filtering',      label: 'Filtering & Search' },
  { id: 'export',         label: 'Export & Reporting' },
  { id: 'faq',            label: 'FAQ' },
];

export default function Documentation() {
  const [activeId, setActiveId] = useState('quick-start');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const headings = sections
      .map(s => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-10% 0px -75% 0px', threshold: 0 }
    );

    headings.forEach(el => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-2">Docs</p>
          <h1 className="font-display text-4xl font-bold tracking-tight">Documentation</h1>
          <p className="mt-3 text-muted-foreground max-w-lg">Everything you need to get the most out of FreeTradeJournal.</p>
        </div>

        <div className="flex gap-16">
          {/* Sidebar */}
          <aside className="hidden lg:block w-44 shrink-0">
            <nav className="sticky top-24">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-2">Contents</p>
              <ul className="space-y-0.5">
                {sections.map(({ id, label, pro }) => (
                  <li key={id}>
                    <button
                      onClick={() => scrollTo(id)}
                      className={`w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                        activeId === id
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {activeId === id && (
                        <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                      )}
                      <span className={activeId === id ? '' : 'pl-3'}>{label}</span>
                      {pro && <ProBadge size="sm" />}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="divide-y divide-border">

              <DocSection id="quick-start" title="Quick Start">
                <p className="mb-6">Get up and running in four steps.</p>
                <ol className="space-y-4">
                  {[
                    ['Set up your profile', 'Configure your trading preferences, account balance, and risk parameters in Settings.'],
                    ['Add your first trade', 'Log entry/exit prices, lot size, and any costs for accurate P&L tracking.'],
                    ['Import historical data', 'Upload a CSV from your broker to backfill your trade history in one go.'],
                    ['Set trading goals', 'Define profit targets, risk limits, and rules to stay disciplined.'],
                  ].map(([title, desc], i) => (
                    <li key={title} className="flex gap-4">
                      <span className="flex-none w-6 h-6 rounded-full border border-amber-500/40 text-amber-500 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <div>
                        <p className="font-medium text-foreground text-sm">{title}</p>
                        <p className="text-muted-foreground text-sm mt-0.5">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </DocSection>

              <DocSection id="dashboard" title="Dashboard">
                <p>Your dashboard is fully customizable — show, hide, and drag-to-reorder widgets to match how you review your trading. Filter everything by time period with the pills in the ticker row, and switch between trading accounts at any time. Pro users get their layout synced across devices.</p>
              </DocSection>

              <DocSection id="trade-logging" title="Trade Logging">
                <p>Log trades with entry/exit prices, lot sizes, spreads, commissions, and swap costs. Supports forex, futures, and stocks with real-time P&L calculation. Tag each trade with the emotions you felt while trading, your strategy, and the prop firm or broker it belongs to — including custom firms and brokers you add yourself.</p>
              </DocSection>

              <DocSection id="calendar" title="Calendar Heatmap">
                <p>Visualize daily performance with a color-coded heatmap. Identify patterns, track streaks, and view monthly or yearly performance at a glance.</p>
              </DocSection>

              <DocSection id="journal" title="Trading Journal">
                <p className="mb-3">Document strategies, market observations, and trading psychology. Track your mood, attach screenshots to entries, start from ready-made templates, and build a searchable record of your decision-making over time.</p>
                <p>Two AI helpers live in the journal: <strong className="text-foreground">Ask Coach</strong> suggests follow-up questions or a starting point while you write, and <strong className="text-foreground">AI Journal Review</strong> reads your recent entries alongside your results and tells you where your words and your trading diverge.</p>
              </DocSection>

              <DocSection id="goals" title="Goals & Risk Management">
                <p>Set trading goals, enforce risk rules, and monitor violations. Stay disciplined with performance alerts and live progress tracking.</p>
              </DocSection>

              <DocSection id="csv-import" title="CSV Import">
                <p className="mb-3">Import trade history from any broker via CSV. Supports MetaTrader, TradingView, TopStep, Tradovate, Interactive Brokers, and most prop firm formats with automatic field mapping and duplicate detection.</p>
                <p>After a larger import, the AI gives you a first read of your history — your strongest patterns, biggest leaks, and where to look next.</p>
              </DocSection>

              <DocSection id="analytics" title="Advanced Analytics">
                <p>Professional-grade metrics including Sharpe ratio, profit factor, and maximum drawdown. Pattern detection identifies overtrading, revenge trading, and FOMO behaviors.</p>
              </DocSection>

              <DocSection id="ai-features" title="AI Features">
                <p className="mb-5">AI-powered tools that analyse your trading data and deliver personalised feedback. Free accounts include 20 AI queries per month; Pro removes the cap:</p>
                <dl className="space-y-3">
                  {[
                    ['Coach FTJ', 'Your personal AI trading coach. Ask questions about your trading and get answers grounded in your actual patterns, streaks, and performance.'],
                    ['AI Trade Analysis', 'A full review of your overall performance — strengths, patterns, and an action plan.'],
                    ['AI Trade Review', 'Per-trade assessment with entry/exit analysis and specific improvement suggestions.'],
                    ['AI Journal Review', 'Reads your recent journal entries next to your results and flags where your words and your trading diverge.'],
                    ['Ask Coach (Journal)', 'In-editor writing help — follow-up questions on what you wrote, or a starting point when the page is blank.'],
                    ['Import Insight', 'A first read of your history after a larger CSV import — strongest patterns, biggest leaks, where to look next.'],
                    ['AI Journal Prompts', 'Reflective questions generated after each trade to sharpen self-awareness.'],
                    ['AI Strategy Tagger', 'Auto-classify trades by pattern — breakout, pullback, reversal, scalp, and more.'],
                    ['AI Risk Alerts', 'Detects revenge trading, loss streaks, and daily limit breaches automatically.'],
                    ['AI Goal Coach', 'Coaching on your goals and progress with tailored recommendations.'],
                  ].map(([term, def]) => (
                    <div key={term} className="grid grid-cols-[180px_1fr] gap-4 text-sm">
                      <dt className="font-medium text-foreground">{term}</dt>
                      <dd className="text-muted-foreground">{def}</dd>
                    </div>
                  ))}
                </dl>
              </DocSection>

              <DocSection id="trade-insights" title="Trade Insights" pro>
                <p className="mb-5">Surfaces patterns in your trade history that are hard to spot manually:</p>
                <dl className="space-y-3">
                  {[
                    ['Symbol Performance', 'P&L breakdown by instrument — see which pairs or contracts you trade best.'],
                    ['Trader Profile', 'Radar chart scoring consistency, discipline, risk management, and profitability.'],
                    ['Direction Bias', 'Win rate and P&L split by long vs short to identify directional tendencies.'],
                    ['Strategy Breakdown', 'Performance comparison across your tagged strategies.'],
                    ['Day-of-Week Analysis', 'Identifies your best and worst trading days so you can adjust your schedule.'],
                    ['Session Heatmap', 'Shows which trading hours produce the most consistent results.'],
                  ].map(([term, def]) => (
                    <div key={term} className="grid grid-cols-[180px_1fr] gap-4 text-sm">
                      <dt className="font-medium text-foreground">{term}</dt>
                      <dd className="text-muted-foreground">{def}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 text-sm text-muted-foreground">All charts update automatically as you log new trades.</p>
              </DocSection>

              <DocSection id="themes" title="Themes">
                <p>Choose light or dark mode plus a colour preset to make the app yours — presets and basic customisation are free. Pro users unlock the <strong className="text-foreground">Theme Studio</strong> for full control over colours, including profit/loss and chart colours, with themes synced across devices.</p>
              </DocSection>

              <DocSection id="filtering" title="Filtering & Search">
                <p>Filter by date, instrument, strategy, or outcome. Save common filter combinations and export results to CSV or Excel.</p>
              </DocSection>

              <DocSection id="export" title="Export & Reporting">
                <p>Generate reports for tax purposes, performance reviews, or prop firm evaluations. Export in CSV, Excel, or PDF.</p>
              </DocSection>

              <DocSection id="faq" title="FAQ">
                <Accordion type="single" collapsible className="w-full">
                  {[
                    ['Is my trading data secure?', 'Data is stored locally on your device by default. Cloud sync uses industry-standard encryption, and your financial information never leaves your control without consent.'],
                    ['What does the Free plan include?', 'Everything you need to journal seriously — trade logging, analytics, journaling, goals, and CSV import/export — plus 20 AI queries per month. Pro removes usage limits and adds cloud sync, screenshot import, and the Theme Studio.'],
                    ['What file formats can I import?', 'CSV files from most major brokers — MetaTrader, TradingView, Interactive Brokers, Tradovate, TopStep, and common prop firm formats.'],
                    ['Can I use this for tax reporting?', 'FreeTradeJournal provides detailed P&L calculations and exports, but always verify data accuracy and consult a tax professional.'],
                    ['Does FreeTradeJournal provide trading advice?', 'No. FreeTradeJournal is purely an analysis and journaling tool. All trading decisions remain your responsibility.'],
                    ['How do I export my data?', 'Go to Settings → Data Management to export trades, journal entries, and analytics in CSV, Excel, or JSON.'],
                    ['Can I use this offline?', 'Yes. All data is stored locally, so you can log trades, journal, and view analytics without an internet connection.'],
                  ].map(([q, a], i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="text-sm font-medium text-left">{q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </DocSection>

            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Still have questions? <FeedbackLink>Send us a message</FeedbackLink> and we'll get back to you.
              </p>
            </div>
          </main>
        </div>
      </div>

      <AppFooter />
    </div>
  );
}

function DocSection({
  id,
  title,
  pro,
  children,
}: {
  id: string;
  title: string;
  pro?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="py-10 scroll-mt-24 first:pt-0">
      <div className="flex items-center gap-2.5 mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {pro && <ProBadge size="sm" />}
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}
