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
    version: '2.8.1',
    date: '2026-04-14',
    summary: 'Login reliability fix — returning users no longer hit onboarding after signing in.',
    items: [
      {
        type: 'fixed',
        text: 'Returning users incorrectly sent to onboarding after Google sign-in',
        description: 'A timing issue caused the app to check onboarding status before confirming your account and pro status. This sent existing users through onboarding on new devices or after clearing their browser data. Fixed for both free and Pro accounts.',
      },
      {
        type: 'fixed',
        text: 'Data not visible after login until manual refresh',
        description: 'When Pro data was restored from the cloud after signing in, the dashboard did not update automatically. Data is now applied immediately without needing a page refresh.',
      },
    ],
  },
  {
    version: '2.8.0',
    date: '2026-04-07',
    summary: '14-day free trial for Pro — try every Pro feature before you pay.',
    items: [
      {
        type: 'new',
        text: '14-day free trial on Pro monthly and yearly plans',
        description: 'New subscribers get 14 days of full Pro access before their first charge. No trial on the lifetime plan — that remains a one-time payment.',
      },
    ],
  },
  {
    version: '2.7.0',
    date: '2026-04-04',
    summary: 'Major quality-of-life update — smarter trade export, journal templates, mood analytics, live risk rule feedback, and a refreshed Goals page.',
    items: [
      {
        type: 'improved',
        text: 'CSV export with date range filter',
        description: 'The Export button in the Trade Log now opens a quick picker. Choose This Month, This Quarter, This Year, or set a custom date range. No extra steps — pick your range and download.',
      },
      {
        type: 'new',
        text: 'Bulk trade delete',
        description: 'Select multiple trades at once using the checkboxes in the Trade Log and delete them all in one go. A select-all option covers everything on the current page.',
      },
      {
        type: 'new',
        text: 'Journal templates',
        description: 'One-click templates in the Journal for Pre-Trade, Post-Trade, and Daily Review. Clicking a template fills in a structured format so you never start from a blank page.',
      },
      {
        type: 'new',
        text: 'Mood vs P&L correlation',
        description: 'The Journal now shows your average P&L when you logged entries as Bullish, Neutral, or Bearish. See whether your mindset actually matches your results.',
      },
      {
        type: 'new',
        text: 'Risk rule warnings when logging trades',
        description: 'When you log a trade that pushes you past your daily loss limit or per-trade loss limit, you get an instant warning. Your violation count updates automatically.',
      },
      {
        type: 'improved',
        text: 'Goals & Risk Management redesign',
        description: 'Goal cards are larger and more visual — progress rings shift from blue to amber as you close in on your target, and green when achieved. Risk rules now show a live bar of how much of your limit you\'ve used today.',
      },
      {
        type: 'improved',
        text: 'PropTracker free tier bumped to 3 accounts',
        description: 'Free users can now track up to 3 prop firm accounts instead of 2.',
      },
      {
        type: 'new',
        text: 'PropTracker deadline alerts',
        description: 'If a prop firm account is expiring within 7 days, a banner appears at the top of PropTracker. Red for 2 days or less, amber for up to 7 days.',
      },
      {
        type: 'improved',
        text: 'Trade Insights — actionable next steps',
        description: 'Every insight card now includes a concrete next step — a specific action you can take today, not just an observation about your data.',
      },
    ],
  },
  {
    version: '2.6.0',
    date: '2026-04-03',
    summary: 'Official blog launched at blog.freetradejournal.com.',
    items: [
      {
        type: 'new',
        text: 'Blog at blog.freetradejournal.com',
        description: 'FreeTradeJournal now has an official blog covering prop firm trading, combine strategies, and trading journal tips. Linked from the sidebar and landing page.',
      },
    ],
  },
  {
    version: '2.5.0',
    date: '2026-04-02',
    summary: 'Feedback form, testimonials, and onboarding improvements.',
    items: [
      {
        type: 'new',
        text: 'Feedback form',
        description: 'Leave feedback directly in the app. Rate your experience with stars, pick a type (bug, feature, general), and submit.',
      },
      {
        type: 'new',
        text: 'Testimonials — share your story',
        description: 'After leaving a 4 or 5 star rating, you can optionally write a testimonial. Tell us what you love about FreeTradeJournal and choose your trader role. Approved testimonials appear on the homepage.',
      },
      {
        type: 'new',
        text: 'Getting started checklist',
        description: 'New users see a checklist on the dashboard to guide them through setting up their account, logging their first trade, and exploring key features.',
      },
      {
        type: 'new',
        text: 'First trade celebration',
        description: 'When you log your very first trade, confetti fires and you get a congratulations message.',
      },
    ],
  },
  {
    version: '2.3.1',
    date: '2026-04-02',
    summary: 'Bug fixes — resolved a crash when editing exit time and a rare white-screen on load.',
    items: [
      {
        type: 'fixed',
        text: 'Exit time crash',
        description: 'Clearing or partially editing the exit (or entry) time field caused the app to crash. The time picker now safely ignores incomplete input.',
      },
      {
        type: 'fixed',
        text: 'White-screen on app load after a browser crash',
        description: 'If your account data was corrupted after a browser crash, the app would fail to load entirely. It now detects and clears the bad data and recovers gracefully.',
      },
    ],
  },
  {
    version: '2.3.0',
    date: '2026-03-31',
    summary: 'PropTracker Screenshot Import — upload your billing or payout screenshots and let AI extract the transactions automatically.',
    items: [
      {
        type: 'new',
        text: 'Screenshot Import (Pro)',
        description: 'Upload a screenshot of your prop firm billing or payout page and AI will automatically extract every transaction. Supports multiple files at once and drag & drop.',
      },
      {
        type: 'new',
        text: 'Duplicate detection on import',
        description: 'Re-importing the same screenshot won\'t create duplicate transactions. Duplicates are automatically flagged and excluded by default in the preview.',
      },
    ],
  },
  {
    version: '2.2.0',
    date: '2026-03-31',
    summary: 'PropTracker — a dedicated prop firm tracker with a free tier, AI analysis, and cloud sync.',
    items: [
      {
        type: 'new',
        text: 'PropTracker',
        description: 'Track fees, resets, and payouts across all your prop firm accounts. See your true net P&L and ROI across every firm — the number most prop traders never actually work out.',
      },
      {
        type: 'new',
        text: 'PropTracker AI Analysis (Pro)',
        description: 'One-click AI breakdown of your prop trading performance. Get an honest verdict on which firms are working, warning signs, and what to do next. 5 analyses per day.',
      },
      {
        type: 'new',
        text: 'PropTracker Cloud Sync',
        description: 'Prop firm accounts and transactions are included in Pro cloud sync — your data stays safe across devices.',
      },
    ],
  },
  {
    version: '2.1.0',
    date: '2026-03-10',
    summary: 'Major data protection update — sync with content blockers, auto-restore, free tier safeguards, and comma formatting.',
    items: [
      {
        type: 'new',
        text: 'Sync works with all content blockers',
        description: 'Cloud sync now works regardless of ad blockers or content filters. Previously, some blockers would silently prevent data from syncing.',
      },
      {
        type: 'new',
        text: 'Auto-restore on new devices',
        description: 'Opening the app on a new device automatically restores all your trades, journal entries, and settings from the cloud. No manual steps needed.',
      },
      {
        type: 'new',
        text: 'Skip setup if you already have data',
        description: 'Pro users with existing cloud data are never shown onboarding again. Any missing accounts are automatically created to match your synced trades.',
      },
      {
        type: 'new',
        text: 'Data protection for free users',
        description: 'New safeguards for free users: storage usage monitor, backup reminders, incognito mode warning, and complete backup/restore.',
      },
      {
        type: 'new',
        text: 'Comma formatting on currency values',
        description: 'All currency values now display with commas for better readability (e.g., $10,618.19 instead of $10618.19).',
      },
      {
        type: 'fixed',
        text: 'Trades going missing after account changes',
        description: 'Fixed a bug where switching or recreating an account could make existing trades invisible.',
      },
      {
        type: 'improved',
        text: 'Backup export now includes all data',
        description: 'Export now covers everything: trades, accounts, journal entries, goals, risk rules, and settings.',
      },
      {
        type: 'improved',
        text: 'Storage usage visible in Settings',
        description: 'Settings now shows how much storage you\'re using with a progress bar and a warning when you\'re approaching the limit.',
      },
    ],
  },
  {
    version: '2.0.0',
    date: '2026-03-03',
    summary: 'AI-powered Pro features — coaching, trade reviews, risk alerts, strategy tagging, goal coaching, journal prompts, and cloud sync.',
    items: [
      {
        type: 'new',
        text: 'AI Trading Coach',
        description: 'Personalised coaching tips based on your trading patterns, win rate, streaks, and performance metrics. Updates daily with fresh insights.',
      },
      {
        type: 'new',
        text: 'AI Trade Analysis',
        description: 'A full AI review of your overall trading performance — strengths, patterns, areas to improve, and an action plan.',
      },
      {
        type: 'new',
        text: 'AI Trade Review',
        description: 'Per-trade AI assessment with entry/exit analysis, context from surrounding trades, and specific improvement suggestions.',
      },
      {
        type: 'new',
        text: 'AI Journal Prompts',
        description: 'After logging a trade, get AI-generated reflective questions to deepen self-awareness and improve decision-making.',
      },
      {
        type: 'new',
        text: 'AI Strategy Tagger',
        description: 'Auto-classify your trades by strategy — breakout, pullback, reversal, momentum, scalp, and more. Accept or reject each suggestion.',
      },
      {
        type: 'new',
        text: 'AI Risk Alerts',
        description: 'Automatic detection of revenge trading, consecutive loss streaks, and daily loss limit breaches with AI-powered advice.',
      },
      {
        type: 'new',
        text: 'AI Goal Coach',
        description: 'Get personalised coaching on your trading goals — what\'s working, what to adjust, and how to stay on track.',
      },
      {
        type: 'new',
        text: 'Cloud Sync for Pro users',
        description: 'Your trades, journal entries, goals, accounts, and risk rules sync across all your devices in real-time.',
      },
    ],
  },
  {
    version: '1.9.0',
    date: '2026-02-19',
    summary: 'Trade Insights page redesign — new trader profile radar, cleaner stats, colored ideas, and chart fixes.',
    items: [
      {
        type: 'new',
        text: 'Trader Profile radar chart',
        description: 'A multi-dimensional view of your trading style — Win Rate, Risk/Reward, Consistency, Volume, Best Day, and Direction scores all in one chart.',
      },
      {
        type: 'improved',
        text: 'Summary stats — cleaner layout',
        description: 'The stats section is now compact colored badges with a plain-English summary sentence instead of a grid of cards.',
      },
      {
        type: 'improved',
        text: 'Actionable Ideas now color-coded by sentiment',
        description: 'Ideas are tinted green (positive), amber (opportunity), or blue (neutral) so you can quickly scan what matters.',
      },
      {
        type: 'improved',
        text: 'Key stats visible at the top of Trade Insights',
        description: 'Total P&L and win rate now appear in the page header so you don\'t have to scroll to find them.',
      },
      {
        type: 'fixed',
        text: 'Chart cards now align to equal height',
        description: 'Cards in two-column rows now stretch to the same height regardless of content.',
      },
      {
        type: 'fixed',
        text: 'Ticker symbols no longer cut off on charts',
        description: 'Fixed ticker symbols being clipped on the Symbol Performance chart.',
      },
    ],
  },
  {
    version: '1.8.0',
    date: '2026-02-18',
    summary: 'Accessibility fixes, mobile improvements, and reduced motion support.',
    items: [
      {
        type: 'fixed',
        text: 'Keyboard focus indicators restored',
        description: 'A bug was hiding focus indicators across the entire app, making it very difficult to navigate with a keyboard. Focus outlines now work correctly on all interactive elements.',
      },
      {
        type: 'fixed',
        text: 'Mobile long-press and copy/share restored',
        description: 'Text selection, image saving, and share menus on mobile were being blocked. Standard long-press interactions now work as expected.',
      },
      {
        type: 'fixed',
        text: 'Form fields now accessible to screen readers',
        description: 'Form fields in the trade modal, journal entry form, and file upload now have proper labels for screen reader users.',
      },
      {
        type: 'improved',
        text: 'Page header now visible on mobile',
        description: 'The page header was hidden on small screens. It now shows the current page name, theme toggle, and user avatar on all screen sizes.',
      },
      {
        type: 'improved',
        text: 'Reduced motion support',
        description: 'Animated elements throughout the app now respect your OS reduced motion setting, showing instant transitions instead.',
      },
      {
        type: 'fixed',
        text: 'Sign In link visible on mobile',
        description: 'The Sign In link was hidden on mobile. It now appears alongside the theme toggle on all screen sizes.',
      },
    ],
  },
  {
    version: '1.7.0',
    date: '2026-02-17',
    summary: 'CSV import deduplication fixes, multi-account data safety, and currency sync.',
    items: [
      {
        type: 'fixed',
        text: 'CSV re-import no longer creates duplicate trades',
        description: 'Importing the same CSV again now correctly detects and skips trades you\'ve already imported.',
      },
      {
        type: 'fixed',
        text: 'Trades on other accounts no longer lost on save',
        description: 'Adding, editing, or deleting trades on one account no longer wipes trades from your other accounts.',
      },
      {
        type: 'fixed',
        text: 'Currency setting stays in sync across the app',
        description: 'Changing currency in Settings now updates your active account, and editing an account\'s currency updates the global setting. Both stay in sync.',
      },
      {
        type: 'improved',
        text: 'CSV import progress indicator',
        description: 'Importing a CSV now shows a progress overlay so you can see what\'s happening. The form closes automatically when you pick a file and the dashboard refreshes when done.',
      },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-02-16',
    summary: 'Modernized sidebar and navigation with user profile in the page header and a cleaner account switcher.',
    items: [
      {
        type: 'improved',
        text: 'User profile moved to the page header',
        description: 'Your avatar and account dropdown are now in the top-right corner — visible on every page without opening the sidebar.',
      },
      {
        type: 'improved',
        text: 'Cleaner sidebar navigation',
        description: 'Simplified layout with no section labels. Active pages now show a highlighted icon for clearer visual feedback.',
      },
      {
        type: 'improved',
        text: 'Modernized account switcher',
        description: 'The account switcher now shows account type and broker per item, with a checkmark on the active account.',
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
        description: 'Your current account balance (starting balance + total P&L) is now displayed on the Total P&L card so you can see your equity at a glance.',
      },
      {
        type: 'new',
        text: 'Trading Days count in the calendar',
        description: 'The calendar now shows how many days you traded in the selected month alongside Monthly P&L, Win Rate, and other stats.',
      },
      {
        type: 'improved',
        text: 'Stat cards are now clickable',
        description: 'All four dashboard stat cards (P&L, Win Rate, Total Trades, Profit Factor) now link to the Trade Log.',
      },
      {
        type: 'improved',
        text: 'Equity curve is now full-width',
        description: 'The equity curve now takes up the full width of the dashboard for a bigger view of your performance.',
      },
      {
        type: 'improved',
        text: 'Better empty state with action buttons',
        description: 'When you have no trades, the dashboard now shows "Add Trade" and "Import CSV" buttons instead of blank space.',
      },
      {
        type: 'fixed',
        text: 'Theme colors now switch instantly',
        description: 'Stat cards, chart toggles, and calendar elements were fading slowly when switching themes. They now update instantly.',
      },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-02-13',
    summary: 'Mobile UI polish, accurate account metrics, and color-coded dashboard cards.',
    items: [
      {
        type: 'fixed',
        text: 'P&L percentage now uses your actual account balance',
        description: 'The "% of account" metric was hardcoded to a $10k balance. It now reads from your account balance in Settings.',
      },
      {
        type: 'improved',
        text: 'Dashboard metric cards are now color-coded',
        description: 'Win Rate, Total Trades, and Profit Factor cards now use green/red based on performance instead of plain white text.',
      },
      {
        type: 'fixed',
        text: 'Theme switching is now fully instant',
        description: 'Theme and dark mode now switch instantly with no color fade or delay.',
      },
      {
        type: 'fixed',
        text: 'Mobile button sizing and layout consistency',
        description: 'Buttons no longer stretch full-width on mobile. The signup terms checkbox no longer gets squashed.',
      },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-02-12',
    summary: 'TopStep CSV import, column mapping for unknown brokers, futures contract multipliers, and instant theme switching.',
    items: [
      {
        type: 'new',
        text: 'TopStep CSV import',
        description: 'Import trade history directly from TopStep. It automatically recognizes the format and maps everything correctly — no manual setup needed.',
      },
      {
        type: 'new',
        text: 'Column mapping for unknown CSV formats',
        description: 'When importing a file from an unrecognized broker, you can manually map each column (symbol, entry price, P&L, etc.) so you can import from any platform.',
      },
      {
        type: 'new',
        text: 'Futures contract multipliers for accurate P&L',
        description: 'Futures trades now apply the correct multiplier (e.g. ES = $50, NQ = $20, CL = $1,000) so your numbers match your broker statements.',
      },
      {
        type: 'improved',
        text: 'CSV import skips duplicate trades automatically',
        description: 'Re-importing the same file no longer creates duplicate entries. Trades that already exist in your log are automatically skipped.',
      },
      {
        type: 'improved',
        text: 'Theme switching is now instant with no flash',
        description: 'Switching between light and dark mode now applies instantly without the brief white flash.',
      },
      {
        type: 'fixed',
        text: 'Light mode visibility issues',
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
        text: 'Searchable instrument picker',
        description: 'The symbol field in the trade form is now a searchable dropdown. Start typing to filter through forex pairs, futures contracts, and indices instead of scrolling through a long list.',
      },
      {
        type: 'improved',
        text: 'Trade form scrolls properly on small screens',
        description: 'The trade form now scrolls correctly on smaller screens and no longer cuts off fields at the bottom.',
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
        description: 'The Trading Coach analyzes your trade history and provides actionable feedback — identifying patterns in your wins and losses, suggesting risk adjustments, and highlighting your best setups.',
      },
      {
        type: 'new',
        text: 'Calendar heatmap',
        description: 'See your daily trading activity at a glance. Green days are profitable, red days are losses — the darker the color, the bigger the move.',
      },
      {
        type: 'new',
        text: 'Instrument performance radar chart',
        description: 'See how you perform across different instruments. Quickly spot which pairs or contracts you trade best and where you might want to improve.',
      },
      {
        type: 'improved',
        text: 'Dashboard layout optimized for mobile',
        description: 'Cards, charts, and tables now stack and resize properly on phones and tablets with larger touch targets.',
      },
    ],
  },
]

export const LATEST_CHANGELOG_VERSION = '2.8.0'
