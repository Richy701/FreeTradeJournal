export type ChangelogItemType = 'new' | 'improved' | 'fixed'

export type ChangelogItem = {
  type: ChangelogItemType
  text: string
  description?: string
}

export type ChangelogEntry = {
  version: string
  date: string
  summary: string
  items: ChangelogItem[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.3.0',
    date: '2026-02-12',
    summary: 'Major prop firm support update with TopStep integration, smarter CSV imports, and polished theming.',
    items: [
      {
        type: 'new',
        text: 'TopStep CSV import support for prop firm traders',
        description: 'You can now import trade history directly from TopStep. The parser automatically recognizes TopStep\'s CSV format and maps columns to the correct fields — no manual setup needed.',
      },
      {
        type: 'new',
        text: 'Column mapping UI for unknown CSV formats',
        description: 'When importing a CSV we don\'t recognize, a column mapping interface lets you manually assign each column (symbol, entry price, P&L, etc.) so you can import from any broker or platform.',
      },
      {
        type: 'new',
        text: 'Futures contract multipliers for accurate P&L',
        description: 'Futures trades now apply the correct contract multiplier (e.g. ES = $50, NQ = $20, CL = $1,000) when calculating profit and loss, so your numbers match your broker statements.',
      },
      {
        type: 'improved',
        text: 'CSV import now deduplicates trades automatically',
        description: 'Re-importing the same CSV file no longer creates duplicate entries. The importer checks for matching trade data and skips rows that already exist in your log.',
      },
      {
        type: 'improved',
        text: 'Theme switching is now instant with no flash',
        description: 'Switching between light and dark mode (or custom themes) now applies instantly without the brief white flash that previously occurred during the transition.',
      },
      {
        type: 'fixed',
        text: 'Light mode visibility issues across all components',
        description: 'Fixed contrast and readability problems in light mode — charts, badges, table borders, and card backgrounds now look correct in both themes.',
      },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-02-05',
    summary: 'Faster trade entry with a searchable instrument picker and smoother UI interactions.',
    items: [
      {
        type: 'new',
        text: 'Instrument combobox with search for faster trade entry',
        description: 'The symbol field in the trade dialog is now a searchable combobox. Start typing to filter through forex pairs, futures contracts, and indices instead of scrolling through a long dropdown.',
      },
      {
        type: 'improved',
        text: 'Trade dialog scroll and overflow handling',
        description: 'The trade entry dialog now scrolls properly on smaller screens and no longer clips content at the bottom when many fields are visible.',
      },
      {
        type: 'fixed',
        text: 'Framer Motion animation type errors on Vercel',
        description: 'Resolved TypeScript type mismatches with Framer Motion\'s ease property that were causing build failures on Vercel deployments.',
      },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-01-28',
    summary: 'AI-powered coaching, visual trading activity tracking, and performance breakdowns by instrument.',
    items: [
      {
        type: 'new',
        text: 'Trading Coach AI for personalized insights',
        description: 'The new Trading Coach analyzes your trade history and provides actionable feedback — identifying patterns in your wins and losses, suggesting risk adjustments, and highlighting your best setups.',
      },
      {
        type: 'new',
        text: 'Calendar heatmap to visualize trading activity',
        description: 'A GitHub-style heatmap on the dashboard shows your daily trading activity at a glance. Green days are profitable, red days are losses, and intensity shows magnitude.',
      },
      {
        type: 'new',
        text: 'Radar chart for pairs/instrument performance',
        description: 'See how you perform across different instruments with a radar chart. Quickly spot which pairs or contracts you trade best and where you might want to focus or improve.',
      },
      {
        type: 'improved',
        text: 'Dashboard layout optimized for mobile devices',
        description: 'Cards, charts, and tables now stack and resize properly on phones and tablets. Touch targets are larger and the layout uses available screen space more efficiently.',
      },
    ],
  },
]

export const LATEST_CHANGELOG_VERSION = changelog[0].version
