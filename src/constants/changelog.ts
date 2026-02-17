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
    version: '1.7.0',
    date: '2026-02-17',
    summary: 'CSV import deduplication fixes, multi-account data safety, currency sync, and Dashboard import UX improvements.',
    items: [
      {
        type: 'fixed',
        text: 'CSV re-import no longer creates duplicate trades',
        description: 'Importing the same CSV file again now correctly detects and skips trades you\'ve already imported. Previously, duplicates could appear when switching between accounts or importing from different pages.',
      },
      {
        type: 'fixed',
        text: 'Multi-account trade data is no longer lost on save',
        description: 'Adding, editing, or deleting trades on one account no longer silently wipes trades from other accounts. All save operations now preserve data across accounts.',
      },
      {
        type: 'fixed',
        text: 'Currency setting stays in sync across the app',
        description: 'Changing currency in Regional Settings now updates the active account, and editing an account\'s currency updates the global setting. Both stay in sync.',
      },
      {
        type: 'improved',
        text: 'Dashboard CSV import with progress indicator',
        description: 'Importing a CSV from the Dashboard now shows a progress overlay with phase labels and a progress bar. The Add Trade form closes automatically when you pick a file, and the dashboard updates in-place without a page reload.',
      },
      {
        type: 'improved',
        text: 'Duplicate trade notification on import',
        description: 'A message in the import preview dialog lets you know that duplicate trades are automatically detected and skipped, so you can safely re-import updated broker exports.',
      },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-02-16',
    summary: 'Modernized sidebar and navigation with user profile moved to the page header and a cleaner account switcher.',
    items: [
      {
        type: 'improved',
        text: 'User profile moved to the page header',
        description: 'Your avatar and account dropdown are now in the top-right corner of the page header — visible on every page without opening the sidebar.',
      },
      {
        type: 'improved',
        text: 'Cleaner sidebar navigation',
        description: 'Removed section labels and simplified the sidebar layout. Active nav items now show a themed icon background for clearer visual feedback.',
      },
      {
        type: 'improved',
        text: 'Modernized account switcher',
        description: 'The account switcher dropdown has been rebuilt with a cleaner trigger, account type and broker info per item, and a checkmark indicator for the active account.',
      },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-02-16',
    summary: 'Dashboard redesign with better visual hierarchy, clickable stat cards, and improved empty states.',
    items: [
      {
        type: 'new',
        text: 'Account balance shown on the Total P&L card',
        description: 'Your current account balance (starting balance + total P&L) is now displayed directly on the Total P&L stat card so you can see your equity at a glance.',
      },
      {
        type: 'new',
        text: 'Trading Days count in the calendar',
        description: 'The calendar heatmap stats panel now shows how many days you traded in the selected month alongside Monthly P&L, Win Rate, and other stats.',
      },
      {
        type: 'improved',
        text: 'Stat cards are now clickable',
        description: 'All four dashboard metric cards (P&L, Win Rate, Total Trades, Profit Factor) now link to the Trade Log for quick access to details.',
      },
      {
        type: 'improved',
        text: 'Equity curve is now full-width',
        description: 'The equity curve chart takes the full width of the dashboard instead of sharing space with the recent trades table, giving you a bigger view of your performance.',
      },
      {
        type: 'improved',
        text: 'Colored stat card subtitles',
        description: 'Subtitle text on stat cards now uses profit/loss colors — winners green, losers red, averages colored by performance — instead of plain gray text.',
      },
      {
        type: 'improved',
        text: 'Better empty state with action buttons',
        description: 'When you have no trades, the recent trades panel now shows "Add Trade" and "Import CSV" buttons instead of generic placeholder text.',
      },
      {
        type: 'fixed',
        text: 'Theme colors now switch instantly everywhere',
        description: 'Removed CSS transitions that were causing stat cards, chart toggles, and calendar elements to fade slowly when switching themes.',
      },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-02-13',
    summary: 'Mobile UI polish, accurate account metrics, themed dashboard cards, and improved light mode.',
    items: [
      {
        type: 'fixed',
        text: 'P&L percentage now uses your actual account balance',
        description: 'The "% of account" metric on the dashboard and trade log was hardcoded to a $10k balance. It now reads from your active account\'s balance set in Settings, so the percentage reflects your real account size.',
      },
      {
        type: 'improved',
        text: 'Dashboard metric cards are now color-coded',
        description: 'Win Rate, Total Trades, and Profit Factor cards now use themed colors (green/red based on performance) instead of plain white text, matching the Total P&L card style.',
      },
      {
        type: 'improved',
        text: 'Equity curve has a gradient fill and cleaner look',
        description: 'The equity curve chart now uses a smooth gradient fill that fades from top to bottom, and grid lines have been removed from both the equity and P&L views for a cleaner appearance.',
      },
      {
        type: 'improved',
        text: 'Light mode overhaul for landing page',
        description: 'Decorative hero shapes, badges, social icons, and overlays are now properly visible in light mode with stronger opacities and amber-tinted accents instead of faint near-invisible elements.',
      },
      {
        type: 'fixed',
        text: 'Theme switching is now fully instant',
        description: 'Switched the theme provider to useLayoutEffect and changed all buttons from transition-all to scoped transitions, eliminating the delayed color fade on theme toggle.',
      },
      {
        type: 'fixed',
        text: 'Mobile button sizing and layout consistency',
        description: 'Hero CTA buttons no longer stretch full-width on mobile. The signup terms checkbox no longer gets squashed, and the header/footer now use the same logo icon for consistent branding.',
      },
      {
        type: 'fixed',
        text: 'Peerlist badge now matches Product Hunt badge size',
        description: 'The Peerlist badge in the footer was larger than the Product Hunt badge on mobile. Both badges now use matching heights across all breakpoints.',
      },
    ],
  },
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

export const LATEST_CHANGELOG_VERSION = '1.6.0'
