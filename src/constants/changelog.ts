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
    version: '2.35.0',
    date: '2026-06-13',
    summary: 'You can now customize your dashboard — hide widgets you do not use and drag them into the order you prefer.',
    items: [
      {
        type: 'new',
        text: 'Customize your dashboard',
        description: 'A new Customize button on the dashboard lets you tailor it to how you trade. Your layout is remembered and stays the same across visits.',
      },
      {
        type: 'new',
        text: 'Show or hide any section',
        description: 'Hide the sections you do not use — like market news or the economic calendar — and keep only what matters to you. Your key metrics always stay on.',
      },
      {
        type: 'new',
        text: 'Drag sections into any order',
        description: 'Rearrange your dashboard by dragging sections into the order you prefer.',
      },
      {
        type: 'new',
        text: 'Reorder with your keyboard',
        description: 'Pick up a section and use the arrow keys to move it, no mouse required.',
      },
      {
        type: 'improved',
        text: 'Reset to the default layout anytime',
        description: 'Changed your mind? Reset your dashboard back to the default layout in one click.',
      },
      {
        type: 'new',
        text: 'Pro: your layout syncs across devices',
        description: 'Pro members now have their dashboard layout sync automatically across all their devices, alongside trades and journal entries.',
      },
    ],
  },
  {
    version: '2.34.0',
    date: '2026-06-12',
    summary: 'The trading calendar now shows a weekly P&L total for each week.',
    items: [
      {
        type: 'new',
        text: 'Weekly P&L on the calendar',
        description: 'Each week row on the trading calendar now ends with that week’s total profit or loss, so you can see weekly performance at a glance alongside the daily and monthly figures. Weekly totals add up to the monthly P&L shown above the calendar.',
      },
      {
        type: 'improved',
        text: 'Clearer trade log header',
        description: 'The All Trades header now shows a count badge and the date range your trades span, and reflects how many trades match when filters are active.',
      },
    ],
  },
  {
    version: '2.33.0',
    date: '2026-06-12',
    summary: 'You can now sort your trade log, and the filter bar is cleaner and easier to use.',
    items: [
      {
        type: 'new',
        text: 'Sort your trade log',
        description: 'A new Sort control in the trade log filter bar lets you order your trades by date, P&L, or symbol, ascending or descending.',
      },
      {
        type: 'improved',
        text: 'Cleaner trade log filters',
        description: 'The filter bar now sits neatly alongside the All Trades heading, and the date range filter uses a single calendar that is easier to pick a range with.',
      },
      {
        type: 'improved',
        text: 'Clearer trade selection',
        description: 'The select-all checkbox now selects the trades on the current page and shows a partial state when only some are selected. When a page is fully selected, a Select all matching option lets you grab every filtered trade at once for bulk delete.',
      },
      {
        type: 'improved',
        text: 'More useful All Trades heading',
        description: 'The All Trades heading now shows the trade count as a pill and the date range your trades span, and clearly says how many trades match when filters are active.',
      },
    ],
  },
  {
    version: '2.32.0',
    date: '2026-06-12',
    summary: 'Switching the Stop Loss / Take Profit unit now keeps your levels correct.',
    items: [
      {
        type: 'fixed',
        text: 'Stop Loss / Take Profit unit switching',
        description: 'When you switch the Stop Loss / Take Profit input between price level and pips/points, the values you already entered are now re-expressed in the new unit so they keep pointing at the same level — instead of the number staying put and silently changing meaning. If no entry price is set yet, the fields clear with a reminder to add one first.',
      },
    ],
  },
  {
    version: '2.31.0',
    date: '2026-06-12',
    summary: 'You can now paste a screenshot straight into a journal entry.',
    items: [
      {
        type: 'new',
        text: 'Paste screenshots into journal entries',
        description: 'While writing a journal entry, paste a chart screenshot directly from your clipboard with Cmd+V (or Ctrl+V) — no need to save the image first. Dragging and dropping or browsing for files still works too.',
      },
    ],
  },
  {
    version: '2.30.0',
    date: '2026-06-12',
    summary: 'You can now start a journal entry for any trade straight from the Trade Log.',
    items: [
      {
        type: 'new',
        text: 'Journal a trade from the Trade Log',
        description: 'Each trade in the Trade Log now has a journal button in its actions. Tapping it opens the Journal with a new entry already linked to that trade, with the title, mood, and tags pre-filled from the trade.',
      },
    ],
  },
  {
    version: '2.29.0',
    date: '2026-06-12',
    summary: 'You can now filter your trade log by symbol, side, market, outcome, strategy, and date range.',
    items: [
      {
        type: 'new',
        text: 'Trade Log filters',
        description: 'A filter bar above your trade log lets you narrow trades by symbol, side, market, outcome (winners, losers, breakeven), strategy, and date range. Active filters show as removable pills, your stats and totals update to match, and your filter choices are remembered between visits.',
      },
    ],
  },
  {
    version: '2.28.0',
    date: '2026-06-12',
    summary: 'The Pairs Performance and Trade Distribution cards on the dashboard have a cleaner, more readable design.',
    items: [
      {
        type: 'improved',
        text: 'Refined dashboard chart cards',
        description: 'The Pairs Performance and Trade Distribution cards now show their key figures as clearly labelled stats with thousands separators (for example +$10,618.19), with tidied-up titles and spacing.',
      },
    ],
  },
  {
    version: '2.27.0',
    date: '2026-06-12',
    summary: 'You can now drag and drop a CSV file to import your trades.',
    items: [
      {
        type: 'new',
        text: 'Drag and drop CSV import',
        description: 'Drop a CSV or Excel file straight onto the import box on the dashboard, or anywhere on the Trade Log page, to import your trades — no need to click and browse for the file.',
      },
    ],
  },
  {
    version: '2.26.0',
    date: '2026-06-12',
    summary: 'AI Trade Analysis now numbers its points correctly and reads more cleanly.',
    items: [
      {
        type: 'fixed',
        text: 'Correct numbering in AI analysis',
        description: 'Numbered points in AI Trade Analysis now count up 1, 2, 3 instead of every item showing as 1.',
      },
      {
        type: 'improved',
        text: 'Cleaner AI writing',
        description: 'Coach FTJ and AI Trade Analysis no longer use long dashes; the text now reads with normal commas and hyphens.',
      },
    ],
  },
  {
    version: '2.25.0',
    date: '2026-06-12',
    summary: 'The AI Coach page is redesigned to show all your insights at once, with the standard navigation restored, a more detailed Tilt Meter, and smarter coaching advice.',
    items: [
      {
        type: 'improved',
        text: 'Redesigned AI Coach page',
        description: 'The AI Coach page now fills the full width of the screen and shows all of Coach FTJ’s insights at once as a grid, with a tilt and key-numbers overview at the top and a wider AI trade analysis below, instead of rotating through one tip at a time.',
      },
      {
        type: 'fixed',
        text: 'AI Coach navigation restored',
        description: 'The AI Coach page now has the same top header, sidebar toggle, and breadcrumbs as the rest of the app.',
      },
      {
        type: 'improved',
        text: 'More detailed Tilt Meter',
        description: 'The Tilt Meter now shows your numeric score out of 100 and a short, situation-specific recommendation for what to do next.',
      },
      {
        type: 'improved',
        text: 'Smarter coaching advice',
        description: 'Coach FTJ no longer suggests forcing a set number or direction of trades; its tips focus on process, risk management, and discipline.',
      },
      {
        type: 'fixed',
        text: 'Clearer risk-reward on the calendar',
        description: 'Days with no losing trades now show an infinity symbol with a “No losing trades” note, so the risk-reward figure is easy to understand.',
      },
    ],
  },
  {
    version: '2.24.0',
    date: '2026-06-12',
    summary: 'The AI features are easier to find and far more usable on the free plan, with a dedicated AI Coach page and clearer labels.',
    items: [
      {
        type: 'improved',
        text: 'Much more free AI',
        description: 'Free accounts now get 20 AI runs per month instead of 3, so you can actually try the AI tools — trade analysis, trade review, journal prompts, the coach, and more — before deciding on Pro.',
      },
      {
        type: 'new',
        text: 'AI Coach page',
        description: 'A new AI Coach entry in the sidebar brings Coach FTJ and AI trade analysis together on one page, so the AI features are easy to find instead of scattered around the app.',
      },
      {
        type: 'improved',
        text: 'Clearer AI labels',
        description: 'The per-trade review and tagging buttons now clearly say AI, and the Trade Insights description was corrected, so it is obvious which features are powered by AI.',
      },
      {
        type: 'improved',
        text: 'AI Coach feedback sooner',
        description: 'Coach FTJ now starts giving AI feedback after your first logged trade instead of three, and onboarding and empty screens point you to the AI Coach so it is easy to find from day one.',
      },
    ],
  },
  {
    version: '2.23.0',
    date: '2026-06-12',
    summary: 'A new macro snapshot on the dashboard shows where rates and inflation stand at a glance — useful context if you trade index or rate futures — plus settings to hide the market strip for a cleaner dashboard.',
    items: [
      {
        type: 'new',
        text: 'Macro snapshot on the dashboard',
        description: 'A compact strip near the top of the dashboard now shows the latest Fed funds rate, 10-year and 2-year Treasury yields, the yield curve spread, year-over-year CPI inflation, and the unemployment rate, each with a small arrow for its latest move. It gives quick economic context alongside your live market prices.',
      },
      {
        type: 'new',
        text: 'Hide the dashboard market strip',
        description: 'Settings, General, Dashboard now has switches to turn off the live market prices and the macro snapshot independently, so you can keep a cleaner dashboard if you prefer.',
      },
      {
        type: 'improved',
        text: 'Redesigned performance charts',
        description: 'The equity curve now shows green above your break-even line and red below it, with quick Net, Peak, and deepest-dip figures and a clearer hover that breaks down each trade and your running total. The daily P&L view gets the same polish, with best day, worst day, and average-per-day figures and a cleaner tooltip.',
      },
    ],
  },
  {
    version: '2.22.0',
    date: '2026-06-11',
    summary: 'Fixes for date selection when logging trades, and Topstep imports now subtract both commissions and fees so your P&L is net automatically.',
    items: [
      {
        type: 'fixed',
        text: 'Pick dates when logging a trade',
        description: 'Choosing an entry or exit date from the calendar now works inside the add and edit trade dialog, as well as the prop tracker and export date pickers. Previously the calendar would close without saving your selection.',
      },
      {
        type: 'improved',
        text: 'Topstep fees subtracted automatically',
        description: 'Topstep exports list commissions and fees in separate columns. Both are now imported and subtracted from your P&L automatically, so the dashboard shows your true net result with no manual entry. Trades also have a dedicated Fees field alongside Commission.',
      },
    ],
  },
  {
    version: '2.21.0',
    date: '2026-06-10',
    summary: 'A new Navy Gold theme arrives — deep navy with a warm gold accent for a premium look across the whole app.',
    items: [
      {
        type: 'new',
        text: 'Navy Gold color theme',
        description: 'A new theme pairing rich navy backgrounds and a navy sidebar with a warm gold accent, across both light and dark mode. Pick it under Settings, Color Theme.',
      },
    ],
  },
  {
    version: '2.20.0',
    date: '2026-06-10',
    summary: 'Smarter CSV imports and a fix for editing trades: Topstep exports import directly without column edits, commissions and fees come in automatically, and you can now search and change the instrument on a trade.',
    items: [
      {
        type: 'improved',
        text: 'Topstep CSV imports work out of the box',
        description: 'Topstep trade exports now import correctly as-is, with entry and exit prices, times, and direction all mapped automatically. No need to rename or reformat columns first.',
      },
      {
        type: 'new',
        text: 'Commissions and fees pulled from your CSV',
        description: 'When your broker export includes a commission or fees column, those values are now imported and filled in for you instead of having to enter them by hand on each trade.',
      },
      {
        type: 'fixed',
        text: 'Change the instrument when editing a trade',
        description: 'The instrument picker inside the edit and add trade dialog can now be searched and selected properly, so you can switch a trade from one symbol to another (for example NQ to MNQ).',
      },
    ],
  },
  {
    version: '2.19.0',
    date: '2026-06-10',
    summary: 'Fixes and improvements to the trade form: imported P&L stays accurate when you edit, Stop Loss and Take Profit can be entered as pips or points, R:R fills in for you, and trade times are easier to edit.',
    items: [
      {
        type: 'fixed',
        text: 'Imported P&L stays correct when editing',
        description: 'Editing an imported trade no longer recalculates and changes its P&L to a wrong value. Your broker P&L is kept as-is, and any commission or swap you add is simply subtracted from it.',
      },
      {
        type: 'new',
        text: 'Enter Stop Loss and Take Profit in pips or points',
        description: 'A new unit selector lets you type your stop and target as a price level, or as a distance in pips (forex) or points (futures and indices) from your entry.',
      },
      {
        type: 'improved',
        text: 'Risk-to-reward fills in automatically',
        description: 'The R:R ratio now shows its calculated value directly in the field as soon as you enter a stop and target. You can still type your own value to override it.',
      },
      {
        type: 'fixed',
        text: 'Edit entry and exit times directly',
        description: 'Trade times now have an always-visible time field next to the date, so you can adjust the exact hour and minute without digging through a calendar pop-up.',
      },
    ],
  },
  {
    version: '2.18.0',
    date: '2026-06-10',
    summary: 'Live market context comes to your dashboard: a real-time price ticker, an economic calendar, a market news feed, and mini price charts right where you log trades. Plus a friendlier AI Coach for prop accounts.',
    items: [
      {
        type: 'new',
        text: 'Live market price ticker',
        description: 'A real-time ticker at the top of your dashboard shows prices and daily change for the instruments you trade most, adapting to your forex, futures, or index history.',
      },
      {
        type: 'new',
        text: 'Economic calendar',
        description: 'See upcoming medium and high impact economic events with countdowns, currency filters, and a high-impact-only toggle so you know what is moving the markets.',
      },
      {
        type: 'new',
        text: 'Market news feed',
        description: 'Stay on top of the latest general, forex, and crypto headlines from your dashboard, with symbol-specific news shown when you open a trade.',
      },
      {
        type: 'new',
        text: 'Mini price charts when logging trades',
        description: 'A live mini chart now appears as you pick a symbol in the add and edit trade dialogs, giving you instant context on price action.',
      },
      {
        type: 'improved',
        text: 'AI Coach for prop accounts',
        description: 'The prop firm analysis now reads like a coaching session with a sharp mentor instead of a clinical report, with clearer sections and plain-language next steps.',
      },
    ],
  },
  {
    version: '2.17.0',
    date: '2026-06-10',
    summary: 'Redesigned Share Stats card with personalization, equity curve, and a polished sharing dialog. Plus smarter onboarding that stays out of your way.',
    items: [
      {
        type: 'improved',
        text: 'Share Stats card redesign',
        description: 'Your name, initials avatar, win/loss bar, equity curve sparkline, and theme-colored accents. Period selector lets you share This Month, Quarter, Year, or All Time stats.',
      },
      {
        type: 'fixed',
        text: 'Share Stats copy, download, and share buttons now work',
        description: 'The action buttons were broken due to a canvas API issue. All three now function correctly.',
      },
      {
        type: 'improved',
        text: 'Premium sharing dialog',
        description: 'Dark frosted glass design with backdrop blur, period selector pills, and styled action buttons that match the card aesthetic.',
      },
      {
        type: 'improved',
        text: 'Onboarding checklist auto-collapses',
        description: 'Once you have completed 3 or more steps, the Get Started checklist collapses to a slim progress bar. Your preference is remembered across sessions.',
      },
    ],
  },
  {
    version: '2.16.0',
    date: '2026-06-10',
    summary: 'CSV imports now preserve actual trade times, and a new Risk Management section lets you log Stop Loss, Take Profit, and R:R ratio on every trade.',
    items: [
      {
        type: 'fixed',
        text: 'CSV imports now keep the real trade time',
        description: 'Previously, all imported trades showed as 12:00 AM regardless of the actual time in your broker export. Now the correct timestamps are preserved from TopStep, Tradovate, IBKR, MetaTrader, and standard CSV files.',
      },
      {
        type: 'new',
        text: 'Stop Loss and Take Profit fields on the trade form',
        description: 'Log your planned SL and TP levels on every trade. Values are shown in the expanded trade detail view.',
      },
      {
        type: 'new',
        text: 'Risk:Reward ratio input',
        description: 'Enter your R:R manually, or let it auto-calculate from your Stop Loss and Take Profit. The calculated value shows in the placeholder so you always know what the math says.',
      },
      {
        type: 'improved',
        text: 'Trade times shown in the trade table',
        description: 'The date column now displays the time alongside the date when a trade has a non-midnight timestamp.',
      },
    ],
  },
  {
    version: '2.15.0',
    date: '2026-06-09',
    summary: 'Major UI polish across every page. Warm white light mode, amber-tinted hovers, redesigned forms, and a login reliability fix.',
    items: [
      {
        type: 'improved',
        text: 'Journal page',
        description: 'New entry form reorganized into Writing, Mindset, Context, and Screenshots sections with icon headers. Mood and emotions are now grouped together. Journal entries show a colored accent by sentiment for quick visual scanning.',
      },
      {
        type: 'improved',
        text: 'Goals & Risk Management page',
        description: 'Clearer layout with separate sections for Goals, Risk Management, and Achievements. Each section has its own header, description, and improved empty states that explain what to do and why.',
      },
      {
        type: 'improved',
        text: 'Calendar trade and journal forms',
        description: 'The forms you see when clicking a date on the calendar heatmap have been completely redesigned with organized card sections, icons, and cleaner layout.',
      },
      {
        type: 'improved',
        text: 'Share stats card',
        description: 'Refreshed copy, added the FTJ logo, and removed visual clutter from the downloadable performance card.',
      },
      {
        type: 'improved',
        text: 'Dashboard trade form',
        description: 'Redesigned with Manual and Import tabs. CSV import is now front and center with a full upload panel and supported broker list. Manual entry fields are reorganized into logical sections: Setup, Execution, Context, and Mindset.',
      },
      {
        type: 'fixed',
        text: 'Cleaned up UI text across the app',
        description: 'Removed stray symbols from dropdowns, toasts, and labels for a more polished look.',
      },
      {
        type: 'improved',
        text: 'Polished Trade Log page with improved form sections and page header',
      },
      {
        type: 'improved',
        text: 'Updated Settings, Profile, and Trade Ideas pages with consistent styling',
      },
      {
        type: 'improved',
        text: 'Warm white light mode theme and amber-tinted hover states',
      },
      {
        type: 'fixed',
        text: 'Fixed prop firm logo rendering in dark mode',
      },
      {
        type: 'fixed',
        text: 'FTJ logo outline removed',
        description: 'The dark outline around the FTJ logo in the sidebar and mobile header has been fixed.',
      },
      {
        type: 'fixed',
        text: 'Returning users no longer hit onboarding after logging back in',
        description: 'A race condition between login and data decryption could send existing users through onboarding again. Fixed by letting the protected route handle the check after decryption completes.',
      },
    ],
  },
  {
    version: '2.14.0',
    date: '2026-06-08',
    summary: 'Free AI access for all users. Full visual redesign of PropTracker, Trade Ideas, and Settings. Onboarding overhaul. Prop firm review pages.',
    items: [
      {
        type: 'new',
        text: 'Free AI access for all users',
        description: 'Every user now gets 3 free AI queries per month. Use them on any AI feature — Coach FTJ, Trade Review, Strategy Tagger, Risk Alerts, Journal Prompts, or Goal Coach. No credit card required. Resets monthly.',
      },
      {
        type: 'improved',
        text: 'Coach FTJ',
        description: 'Now with tilt detection that scores how tilted you are based on recent losses, trade emotions, and trading speed. Plus a streaming AI chat so you can ask follow-up questions.',
      },
      {
        type: 'improved',
        text: 'PropTracker visual redesign',
        description: 'Cleaner stat cards, bigger charts, and a refreshed Success Rate Dashboard. Everything is easier to read at a glance.',
      },
      {
        type: 'improved',
        text: 'Trade Ideas page redesign',
        description: 'Direction Split and Trader Profile cards are redesigned with centered charts, cleaner stat panels, and better use of space.',
      },
      {
        type: 'improved',
        text: 'Settings page navigation',
        description: 'Replaced the sidebar navigation with a single horizontal sticky tab bar that works the same on mobile and desktop. Wider layout to make better use of screen space.',
      },
      {
        type: 'improved',
        text: 'AI Trade Analysis empty state',
        description: 'Before you have enough trades for a full analysis, the page now previews exactly what AI insights you will get.',
      },
      {
        type: 'improved',
        text: 'Referral program',
        description: 'Lowered the threshold from 5 to 3 friends. After logging a winning trade, you now get a contextual nudge to share your referral link. Dismissing the banner hides it for 7 days instead of permanently.',
      },
      {
        type: 'improved',
        text: 'Onboarding redesign',
        description: 'New users now see the real FreeTradeJournal logo, cleaner copy, and a working experience level selector during setup.',
      },
      {
        type: 'new',
        text: 'Prop firm review pages',
        description: 'In-depth reviews for FTMO, The5ers, and Top One Futures with pricing breakdowns, pros and cons, and comparison tables. Available from the affiliate page.',
      },
      {
        type: 'fixed',
        text: 'Icon rendering bugs',
        description: 'Fixed several places where icon component names appeared as literal text instead of rendering as icons, including the Settings edit button, PropTracker account dialog, feedback button, and Journal page.',
      },
    ],
  },
  {
    version: '2.13.0',
    date: '2026-06-05',
    summary: 'Smarter PropTracker AI with score cards, redesigned Goals page, referral program on the dashboard, and an AI usage fix.',
    items: [
      {
        type: 'new',
        text: 'Referral banner on Dashboard',
        description: 'Invite 3 friends who sign up and log a trade to earn 14 days of Pro free. Your referral link, progress bar, and share buttons are now front and center on the dashboard.',
      },
      {
        type: 'improved',
        text: 'PropTracker AI Analysis',
        description: 'The AI now sees your challenge rules, progress toward profit targets, drawdown risk, and cross-firm patterns (pass rate, cost per attempt, reset count). Responses include a 1-10 score card and a new Challenge Progress section.',
      },
      {
        type: 'improved',
        text: 'Goals & Risk Management page',
        description: 'Redesigned stat cards with colored icons, mini arc gauges, and a completion rate metric. Risk section now shows a health gauge with overall utilization. Achievement cards have a polished trophy-badge look.',
      },
      {
        type: 'fixed',
        text: 'AI daily usage limits not resetting',
        description: 'Using one AI feature on a new day could leave other features stuck at their previous day\'s count, showing "limit reached" even with no usage. Counters now reset correctly across all features.',
      },
    ],
  },
  {
    version: '2.12.0',
    date: '2026-06-04',
    summary: 'Major PropTracker upgrade with challenge rules, success tracking, risk calculator, and a new affiliate page.',
    items: [
      {
        type: 'new',
        text: 'PropTracker Challenge Rules',
        description: 'Set and track drawdown limits, profit targets, daily loss caps, and other challenge rules for each prop firm account. Rules are checked automatically so you always know where you stand.',
      },
      {
        type: 'new',
        text: 'PropTracker Success Rate Dashboard',
        description: 'See your pass/fail rate across challenges with visual breakdowns. Understand which firms and account sizes you perform best on.',
      },
      {
        type: 'new',
        text: 'PropTracker Risk Calculator',
        description: 'Estimate your risk exposure per challenge based on account size, fees, and rules. Know your break-even point before you start.',
      },
      {
        type: 'new',
        text: 'PropTracker Quick Check-In',
        description: 'Fast daily status update for active challenges. Log your current P&L and rule compliance in seconds.',
      },
      {
        type: 'new',
        text: 'PropTracker Cost Recovery tracker',
        description: 'Track how much you have spent on challenges versus earned back. See your true ROI across all prop firm attempts.',
      },
      {
        type: 'new',
        text: 'Affiliate page',
        description: 'Curated partner deals on prop firms, tools, and services. Available from the sidebar.',
      },
      {
        type: 'fixed',
        text: 'Data loss when signing in on a new device',
        description: 'Signing in on a new device could accidentally wipe your existing data. Your cloud data is now restored safely before anything else happens.',
      },
    ],
  },
  {
    version: '2.11.0',
    date: '2026-05-04',
    summary: 'Tradovate CSV import is here.',
    items: [
      {
        type: 'new',
        text: 'Tradovate import support',
        description: 'Import your Tradovate Orders CSV and have trades automatically paired and P&L calculated. All standard futures contracts are supported.',
      },
    ],
  },
  {
    version: '2.10.0',
    date: '2026-04-27',
    summary: 'You can now delete your account and all associated data directly from Settings.',
    items: [
      {
        type: 'new',
        text: 'Self-serve account deletion',
        description: 'You can now permanently delete your account from Settings > Data > Danger Zone. This removes your account, all your data, cloud-synced data, and cancels any active subscription.',
      },
      {
        type: 'fixed',
        text: 'Mobile Chrome bottom cropping',
        description: 'Fixed a layout issue on mobile Chrome where the bottom of the app was cut off or hidden behind the browser navigation bar.',
      },
    ],
  },
  {
    version: '2.9.0',
    date: '2026-04-26',
    summary: 'PropTracker now supports multiple currencies.',
    items: [
      {
        type: 'new',
        text: 'Currency selection for PropTracker accounts',
        description: 'You can now set the currency for each prop firm account (USD, EUR, GBP, CHF, AUD, CAD, JPY, CZK). All amounts — account size, fees, payouts, and P&L — display in the currency you choose. Existing accounts default to USD.',
      },
    ],
  },
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
    summary: 'Major data protection update — sync with content blockers, auto-restore, and free tier safeguards.',
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
        text: 'Coach FTJ',
        description: 'Your personal AI trading coach. Personalised coaching tips based on your trading patterns, win rate, streaks, and performance metrics. Updates daily with fresh insights.',
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
    summary: 'Trade Insights page redesign — new trader profile radar, cleaner stats, and colored ideas.',
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
    ],
  },
  {
    version: '1.4.0',
    date: '2026-02-13',
    summary: 'Accurate account metrics and color-coded dashboard cards.',
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
    ],
  },
  {
    version: '1.3.0',
    date: '2026-02-12',
    summary: 'TopStep CSV import, column mapping for unknown brokers, and futures contract multipliers.',
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
        type: 'fixed',
        text: 'Light mode visibility issues',
        description: 'Fixed contrast and readability problems in light mode — charts, badges, table borders, and card backgrounds now look correct in both themes.',
      },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-02-05',
    summary: 'Faster trade entry with a searchable instrument picker.',
    items: [
      {
        type: 'new',
        text: 'Searchable instrument picker',
        description: 'The symbol field in the trade form is now a searchable dropdown. Start typing to filter through forex pairs, futures contracts, and indices instead of scrolling through a long list.',
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
        text: 'Coach FTJ for personalized insights',
        description: 'Coach FTJ analyzes your trade history and provides actionable feedback — identifying patterns in your wins and losses, suggesting risk adjustments, and highlighting your best setups.',
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

export const LATEST_CHANGELOG_VERSION = '2.35.0'
