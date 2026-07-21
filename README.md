# FreeTradeJournal — Professional Trading Journal & Analytics

A free, modern trading journal and analytics platform for traders who want to track, analyze, and improve their performance. Supports Forex, Futures, Indices, and Stocks across 50+ instruments with built-in prop firm tracking. Built with React 19, TypeScript, and Firebase.

## Key Features

### Interactive Dashboard

- Fully customizable — show or hide any section and drag widgets (or use arrow keys) into your preferred order; layout persists and syncs across devices on Pro
- Time period filter — 7D, 30D, 90D, YTD, and All buttons scope your stats, equity curve, and symbol breakdowns to any range (ranges past 30 days are part of Pro)
- Real-time P&L tracking with a redesigned full-width equity curve — green above your break-even line, red below, with Net, Peak, and max-drawdown figures and a per-trade hover breakdown
- Live market-prices ticker plus a FRED macro snapshot (Fed funds rate, Treasury yields, CPI, unemployment) at the top of the dashboard — each toggleable in Settings for a cleaner view
- Account balance displayed on the Total P&L card — starting balance + total return
- Color-coded performance metrics — win rate, profit factor, total trades, and P&L percentage based on your actual account balance
- Clickable stat cards that link directly to the Trade Log
- Daily P&L calendar heatmap with Trading Days count and weekly P&L totals per week
- Redesigned calendar day view — click a day to see its P&L, win rate, every trade closed that day, and your journal notes, with quick buttons to add a note or log a trade
- Daily P&L bar view with best day, worst day, and average-per-day figures
- AI-powered Trading Coach with psychological pattern detection
- Tilt Meter that learns your usual trading hours from your history and flags entries outside them — counting double when they follow a loss (classic revenge-trading signal)
- Full multi-currency support — every chart, stat, email, and AI feature uses your chosen account currency instead of assuming dollars
- Actionable empty states with "Add Trade" and "Import CSV" buttons
- Quick trade entry directly from the dashboard
- CSV import with progress overlay and in-place data refresh (no page reload)
- Shareable stats card with personalized name, equity curve sparkline, win/loss bar, and period selector
- Remotion-powered animated dashboard intro scene

### Advanced Trade Logging

- Manual trade entry with comprehensive fields (entry/exit prices, stop loss, take profit, commissions, swaps, spreads)
- CSV import with live preview, validation, and smart column mapping
- Support for Tradovate (Orders, Orders History, and Trades exports), Interactive Brokers (IBKR), MetaTrader 5 (including position history from IC Markets, Pepperstone, and similar), NinjaTrader, DAS Trader, TopStep, standard CSV, and Excel (.xlsx/.xls)
- Full timestamp preservation on import — entry and exit times carry over from your broker export instead of defaulting to midnight
- Tradovate: auto-detects format, pairs Buy/Sell fills by product, handles Opening/Closing positions with FIFO matching
- IBKR: supports both Closed Positions and Trades/Executions formats with automatic opening/closing execution matching
- DAS Trader: pairs per-fill rows into complete round trips — short sells, partial exits, and position flips included — picking up the trading date from the file name on time-only daily exports
- TopStep FIFO order pairing with side-aware queues and futures contract multipliers
- Regional format support — European semicolon/comma-decimal files, tab-separated files, 12-hour AM/PM times, day-first (DD/MM) dates, and reports with title rows above the data
- **AI column mapping (Pro)** — unrecognized CSVs get their columns mapped automatically by AI; mapped layouts are remembered and reapplied the next time you import the same broker's export
- Interactive column mapping UI for unknown/custom CSV formats (free)
- Stock trades fully supported — tickers are recognised and P&L uses share-based math (price move × share count)
- Duplicate detection on re-import — same CSV won't create duplicate trades, even across Dashboard and Trade Log imports
- Full CRUD operations with pagination and filtering
- CSV export with date range filter — quick-select This Month, This Quarter, This Year, or pick a custom range
- Bulk trade delete — select multiple trades across the current page and delete in one action
- Risk rule warnings when a new trade breaches your daily or per-trade loss limits
- Stop Loss, Take Profit, and Risk:Reward ratio fields — enter manually or let R:R auto-calculate from SL/TP
- Automatic P&L calculations with market-specific futures multipliers (MNQ, MES, MGC, CL, etc.) — one shared calculation across the trade form, dashboard quick-add, calendar quick-add, and CSV import
- Correct pip values for JPY pairs and other non-USD quotes, real lot sizes for gold and silver, and broker-suffixed symbols (EURUSDm, EURUSD.a) recognised as their standard pairs
- Multi-account support with per-account data isolation
- Prop firm assignment per trade

### Trading Journal

- Journal entries with mood tracking (Bullish, Bearish, Neutral)
- **AI Journal Review** — reads your last 30 days of entries alongside your actual trading results and shows which moods and habits line up with your winning days, which cost you money, and the one change to make this week
- **Ask Coach** in the entry editor — reads your draft and asks the follow-up questions worth answering, or gives you starters based on your trading day if the page is blank
- Pre-trade and post-trade analysis entry types with a date picker, so entries land on the right calendar day
- One-click journal templates — Pre-Trade, Post-Trade, and Daily Review fill in a structured format instantly
- Light formatting support — headings, bold text, and bullet or numbered lists display just as you typed them
- Mood vs P&L correlation — see your average return when you were bullish, neutral, or bearish
- Emotion tracking across 20+ emotional states to identify patterns
- Screenshot and chart attachment support via drag-and-drop — images are compressed and stored efficiently in IndexedDB, and Pro syncs them to the cloud across devices
- Trade linking to connect journal entries to specific trades
- Per-account journals — each trading account keeps its own entries, matching how trades work
- Tag system with search and filtering (date range, market, P&L, mood)
- Free plan includes up to 20 journal entries (existing entries always stay readable and editable); Pro unlocks unlimited journaling

### Goals & Risk Management

- Organised into Goals, Risk Limits, and Achievements tabs — each area easy to find instead of one long stacked page
- Goal types: profit target, win rate, trade count, risk/reward, max loss, max drawdown
- Edit goals in place — change the target, type, or period without deleting and recreating
- Daily, weekly, and monthly goal periods with live progress tracking that follows your active account
- Visual goal cards with circular progress rings that shift color as you approach your target
- Stat cards with colored icon containers, mini arc gauges, completion rate %, and risk health indicator
- Risk health gauge showing overall utilization across all enabled rules with color-coded status (green/amber/red)
- Risk rules: max loss per day/trade, max risk percentage, max open trades
- Live progress bars on risk rules showing how much of your limit you've used today
- Rule violation warnings when logging trades that breach your limits
- Achievement badges with trophy-style cards and earned dates
- Position size and risk/reward calculators

### AI Trading Coach

- All AI features run on OpenAI's GPT-5.4 model family, with answers in plain English — what is actually happening with your money, not finance-textbook terms
- Dedicated AI Coach page with Coach FTJ chat — reads your full account history broken down by instrument, strategy, direction, day of week, session, and tagged emotions
- Honest about small samples — tells you when there are too few trades to draw a conclusion instead of guessing
- Automatic detection of overtrading, revenge trading, and FOMO patterns
- Emotional trading pattern analysis
- Best/worst trading hours and days analysis
- Personalized coaching tips based on your performance data, with 24-hour caching and auto-refresh when trade data changes
- **Import Insight** — import 10+ trades by CSV and the AI immediately gives you a first read of your history: the three things that stand out and where to start
- Free accounts include 20 AI queries per month with a live remaining-quota display; Pro unlocks the full AI suite

### Pro Features (Powered by Stripe)

- **PropTracker Unlimited** — Unlimited prop firm accounts, charts, and AI analysis (free tier: 1 account)
- **AI PropTracker Analysis** — GPT-5.4 breakdown of prop firm P&L: which firms are profitable, warning signs, what to do next (5/day)
- **Full analytics history** — Free accounts see dashboard stats and charts for the last 30 days of trading; Pro keeps the full history (the trade log, exports, and calendar heatmap stay unlimited for everyone)
- **Unlimited journal entries** — Free plan includes 20; existing entries always stay readable
- **Theme Studio** — Build a fully custom theme with separate dark-mode colors, background and sidebar tinting, and corner-radius control
- **AI CSV Column Mapping** — Unfamiliar broker exports mapped automatically, layouts remembered for next time
- **AI Goal Coach** — Personalized coaching on your trading goals with actionable insights
- **AI Trade Review** — In-depth analysis of individual trades with improvement suggestions
- **AI Journal Prompts** — Context-aware journaling prompts based on your recent trades
- **AI Risk Alerts** — Automated detection of risk rule violations and position sizing issues
- **AI Strategy Tagger** — Automatic strategy classification based on trade patterns
- **AI Market Analysis** — Broader market context and how it relates to your trading
- **PDF Trading Wrapped** — Spotify Wrapped-style PDF report with gradient backgrounds, donut charts, equity curve with filled area, day-of-week bar charts, streak visualizations, trader personality archetypes, and fun facts
- **Cloud Sync** — Real-time Firestore sync via Cloud Functions proxy (bypasses content blockers and ad blockers), keeping data safe across devices with automatic restore on new devices
- **PropTracker Screenshot Import** — upload billing or payout screenshots and AI vision extracts transactions automatically (multiple files, drag & drop, duplicate detection)
- Pro status managed via Stripe webhooks → Firebase Cloud Functions → Firestore
- ProGate component with feature-specific copy, amber CTA button, and price anchor for all gated features
- ProBadge indicator in the sidebar for subscribed users
- AI feature sample previews — free users see realistic blurred output on AI Trade Analysis, AI Goal Coach, and AI Risk Alerts to show what they're missing

### PropTracker

- Dedicated prop firm tracker with real firm logos for 15 built-in firms (TopStep, Apex, FTMO, The5ers, FundedNext, Tradeify, Take Profit Trader, and more)
- One card per account (evaluation, funded, instant, express) with firm brand color accents
- Log every fee (evaluation, reset, monthly) and every payout against each account
- Per-account stats: Invested, Earned, Net P&L with tinted stat containers
- **Challenge Rules Engine** — set profit target, max daily/total drawdown, and min trading days per account. Known firms auto-fill rules from presets. Live progress bars with percentage readouts and green/amber/red health indicators
- **Drawdown breach alerts** — if a recorded balance crosses your max or daily drawdown limit, the account is flagged with a clear alert instead of staying quietly green
- **Balance Update** — update your current balance from your prop firm dashboard. High water mark auto-tracks. Daily P&L and trading days tracked per account
- **End of Day Check-In** — update all active challenge balances in one dialog instead of opening each card individually
- **Risk Calculator** — "If I lose $X today..." with quick-amount buttons, a "Max safe" button that fills in the largest loss you can take before any challenge breaches, and before/after drawdown bars per account
- Funded and instant-funding accounts show a Risk Limits view instead of an evaluation profit target that no longer applies
- Partner discount links to top prop firms when setting up a challenge
- **Success Rate Dashboard (Pro)** — pass rate, total attempts vs funded, average cost-to-fund, money wasted on failed accounts, best firm by ROI
- **Cost Recovery Tracker** — per-account indicator showing how much more in payouts until break-even, or profit earned after costs recovered
- Spend by Firm pie chart and cumulative P&L over time area chart (Pro)
- AI Analysis powered by GPT-5.4 — 1-10 score card, challenge progress tracking, cross-firm pattern analysis (pass rate, cost per attempt, reset count), ROI breakdown with break-even analysis, and actionable next steps (Pro, 5/day)
- **Screenshot Import (Pro)** — upload a billing or payout screenshot and AI vision auto-extracts all transactions; supports multiple files, drag & drop, and duplicate detection
- Deadline alerts when a prop firm account expires within 7 days
- Account size quick-select chips and firm logo dropdown in the add/edit form
- Theme-aware logo rendering with neutral background containers
- Freemium: 1 account free, unlimited on Pro
- Full cloud sync included for Pro users

### Multi-Account & Prop Firm Support

- Multiple account types: Live, Demo, Prop Firm, Paper
- Pre-configured prop firm list (FTMO, Apex, TopStep, The5ers, E8 Markets, FundedNext, Tradeify, Take Profit Trader, Funding Pips, Lucid Trading, Alpha Futures, Aqua Funded, and more)
- Custom broker and prop firm entry — choose "Custom…" and type any firm or broker name not in the list
- Per-account trade isolation and filtering — saving on one account never overwrites another account's data
- Account deletion automatically cleans up orphaned trades — no stale data blocking CSV re-imports
- Inline account editing in Settings — edit form replaces the card in-place for better UX
- Account switcher in the sidebar with type and broker info per account
- Theme-colored initial avatars in the header and sidebar (adapts to active color theme)

### Themes & Theme Studio

- 14 accent themes — Default, Ocean Blue, Neon, Sunset, Purple, Deep Yellow, Rose Gold, Mint Frost, Ice, Crimson, Mono Black & White, Sage, Clean, Wine
- 4 full themes — Forest, Graphite, Terminal, and Midnight — that restyle the entire app including backgrounds, cards, and sidebar, in both light and dark mode
- **Theme Studio (Pro)** — build a theme that is completely yours: separate colors for dark mode, background and sidebar tinting, corner-radius control, a live light/dark preview, and readability warnings for low-contrast colors
- Custom color picker with hex input — create your own theme with any primary, profit, and loss colors (free)
- Grouped theme picker — accent colors, full themes, and your custom theme, with mini app previews for full themes
- Dashboard and analytics charts follow your theme colors
- Theme syncs across devices with cloud sync
- Dark/Light/System mode — warm white light mode with amber-tinted backgrounds and hover states, deep warm dark mode
- No color flash on load — your theme applies before first paint
- Dynamic profit/loss and primary color customization
- Theme persistence across sessions

### What's New & Release Notes

- Auto-popup changelog dialog on the dashboard when new updates are available
- Per-user tracking — each account sees the dialog independently on first login after an update
- Megaphone icon in the sidebar to revisit the changelog anytime
- Dedicated `/changelog` release notes page with detailed descriptions for every change
- Linked from the What's New dialog footer and the site footer under Resources

### Feedback & Testimonials

- Native in-app feedback form that adapts to what you're sending — a rating for general feedback and feature requests, bug-specific details for bug reports
- Bug reports can include a screenshot (compressed automatically) and auto-attach diagnostics
- Submissions go to the Firestore `feedback/` collection with PostHog tracking
- After a high rating, users are invited to leave a testimonial for the homepage
- Testimonial form: name (pre-filled from account), trader role picker, free-text quote, consent checkbox
- Approved testimonials appear on the landing page automatically — approve via Firestore console
- Rate limited: 1 feedback per minute, 1 testimonial per hour per user

### Referral Program

- **Invite 5 friends, earn 14 days of Pro free** — referral link with one-click copy and native share
- Prominent referral banner on the Dashboard with progress tracker
- Friends must sign up, verify email, wait 7 days, and log their first trade for the referral to count
- Anti-fraud: email dedup (catches Gmail dot/plus tricks), circular referral prevention, account age gate
- Email notifications when each referral is credited and when the reward is earned
- Referral stats also visible in Settings > Subscription tab

### Conversion & Upgrade Flow

- **14-day free Pro trial for every account** — new signups get the full Pro experience (unlimited AI coaching, cloud sync, PDF reports, full analytics) for 14 days, no card required; it simply switches to the free plan when it ends
- Trial email flow — trial started confirmation, 2-day ending reminder, and conversion confirmation when trial converts to paid
- AI sample previews behind ProGate blur — free users see realistic example output for AI Trade Analysis, Goal Coach, and Risk Alerts
- Pricing page with monthly, yearly, and lifetime plans plus trial messaging and FAQ
- Cloud sync warning on dashboard with prominent "Enable Cloud Sync →" CTA button
- PropTracker screenshot import button visible to free users with lock indicator (was hidden entirely)

### Security & Data Protection

- **AES-256-GCM Encryption at Rest** — All user data in localStorage is encrypted using AES-256-GCM with PBKDF2-derived keys (100,000 iterations). Per-device random salt, unique key per user. Existing unencrypted data migrates automatically on first login
- **XSS Protection** — All AI-generated content sanitized with DOMPurify before rendering
- **Content Security Policy** — Strict CSP headers via Vercel with no `unsafe-eval`, no wildcard origins
- **HSTS** — HTTP Strict Transport Security with preload enabled
- **Firestore Rules** — All collections locked; `allow write: if false` on user docs; only Admin SDK (Cloud Functions) can write user and feedback data
- **Rate Limiting** — AI calls, feedback, and testimonial submissions are rate-limited per user via Firestore transactions
- **Prompt Injection Hardening** — User-supplied trade notes passed to OpenAI are JSON-encoded and labelled as untrusted data
- **No secrets in client bundle** — All API keys (Stripe, OpenAI, Resend) are server-side only via Cloud Functions environment variables
- **Webhook verification** — Stripe webhooks verified with `stripe.webhooks.constructEvent` before processing
- **User-scoped storage** — Per-user localStorage keys for complete data isolation between accounts
- **Number Formatting** — Thousand separators (commas) on all currency displays for better readability

### PWA & Mobile

- Installable as a Progressive Web App on iOS and Android with custom install prompt
- Automatic update notifications when a new version is deployed
- Safe area insets for notched devices (Dynamic Island, iPhone notch)
- Mobile-optimized button sizing, touch targets, and responsive layouts
- iOS-friendly 16px font sizing to prevent unwanted zoom
- Responsive chart footer and sparkline sizing on small screens

### Landing Page

- Polished hero section with animated gradient CTA buttons and consistent branding
- Mobile-optimized button sizing, centered layouts, and responsive badge alignment
- Sign In link visible on all screen sizes — no hidden-on-mobile nav
- Instant demo access and sign-up prompts

### Accessibility & UX

- Keyboard-navigable — focus-visible ring styles on all interactive elements
- `prefers-reduced-motion` respected across hero animations, onboarding transitions, and logo carousel
- Proper `<label>` / `htmlFor` / `id` associations on all form fields (Dashboard trade modal, Journal entries, file uploads)
- Semantic heading hierarchy (`<h1>`) on every page for screen readers and SEO
- Consistent `font-display` (Sora) typography across landing page and app
- SiteHeader with breadcrumbs visible on mobile (condensed current page name)
- FAQ accordion items have `id` attributes for deep linking
- Mobile touch targets scoped to action buttons only — inline links and tabs unaffected
- SPA navigation (`<Link>`) for all internal routes including auth page legal links

### Onboarding

- Getting started checklist guiding new users through their first trades
- First trade celebration animation
- Experience level selection wired into the onboarding flow
- Day-3 nudge email for users who haven't returned

### Affiliate Page

- Dedicated partner deals page with prop firm comparison table and discount codes
- Individual review pages for FTMO, The5%ers, Top One Futures
- PostHog tracking on affiliate link clicks
- Linked from sidebar and site footer

### Email System (Resend)

- Welcome email on signup
- Email verification flow
- Pro upgrade and cancellation confirmation emails
- Day 7 and Day 14 retention campaigns with bad email filtering
- Weekly recap email summarising your trading week, respecting each account's currency
- Trial started, trial ending (2-day reminder), and trial conversion emails
- Referral credited and reward earned notifications
- Hosted PNG banner, List-Unsubscribe headers, and unsubscribe link in all emails

### Demo Mode

- Instant access without signup via "Try Demo"
- Full Pro experience unlocked — AI coach, AI trade review, PDF Wrapped, PropTracker, cloud sync all accessible
- 34 realistic pre-populated trades across Forex, Futures, and Indices with detailed notes, emotions, and lessons
- PropTracker demo with 4 prop firm accounts (FTMO, Apex, MyForexFunds, The5ers) and 8 transactions showing real invested vs earned breakdown
- Journal entries, goals, and risk rules pre-populated
- Demo account: FTMO $100k funded, +4.4% growth, 64.7% win rate, 3.36 profit factor

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Richy701/FreeTradeJournal.git
cd FreeTradeJournal
```

1. Install dependencies:

```bash
npm install
```

1. Set up environment variables:

```bash
cp .env.example .env.local
```

Add the following to `.env.local`:

- Firebase configuration (`VITE_FIREBASE_*`)
- Google Analytics tracking ID (`VITE_GA_TRACKING_ID`) *(optional)*
- Stripe price IDs (`VITE_STRIPE_PRICE_MONTHLY`, `VITE_STRIPE_PRICE_YEARLY`, `VITE_STRIPE_PRICE_LIFETIME`) *(required for Pro subscriptions)*

1. Start the development server:

```bash
npm run dev
```

1. Open `http://localhost:5173`

### Production Build

```bash
npm run build
```

The build step includes TypeScript compilation, Vite bundling, and Puppeteer-based prerendering of all public routes for SEO. Deploy the `dist` directory to your hosting platform (Vercel, Netlify, etc.).

## How to Use

1. **Sign Up / Login** — Create an account with email (with verification), sign in with Google, or use Apple Sign-In. Includes forgot/reset password flow
2. **Setup** — Name your first trading account, pick a type (Live, Demo, Prop Firm), and set your starting balance
3. **Dashboard** — View your trading performance at a glance
4. **Add Trades** — Manual entry or CSV import from your broker
5. **Journal** — Document your analysis, emotions, and attach screenshots
6. **Goals** — Set targets and risk rules to keep yourself accountable
7. **Settings** — Customize themes, currency, timezone, and notifications

### Data Management

- **Local-First Storage** — Trade data stored in browser localStorage, encrypted at rest with AES-256-GCM, scoped per user
- **Cloud Sync (Pro)** — Real-time Firestore sync via Cloud Functions proxy keeps data safe across devices for logged-in Pro users, with automatic restore on new devices
- **localStorage Protection (Free)** — Storage usage monitor, backup reminders after 30 days, incognito mode detection, and data warning banners
- **Self-Serve Account Deletion** — Users can permanently delete their account and all associated data from Settings
- **User-Scoped Isolation** — Complete data separation between accounts
- **Complete Backup & Restore** — Export all data (trades, journal entries, screenshots, goals, risk rules, accounts, prop firm accounts, prop firm transactions, and settings) as JSON and import from backup with item count preview
- **CSV/Excel Import** — Bring in existing trading history from any broker
- **Clear All Data** — Full reset of trades, journal entries, screenshots, goals, and accounts — including the cloud backup for Pro users

## Technology Stack

| Category | Technology |
| --- | --- |
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 7 |
| **Authentication** | Firebase Auth (Google OAuth + Apple Sign-In + Email/Password) |
| **UI Components** | shadcn/ui (Radix UI + Tailwind CSS) |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Forms** | React Hook Form + Zod |
| **State Management** | React Context API + Zustand |
| **Routing** | React Router DOM v7 |
| **Date Handling** | date-fns |
| **Email** | Resend |
| **Icons** | Phosphor Icons + Lucide React |
| **Analytics** | Vercel Analytics + PostHog + Google Analytics |
| **Video** | Remotion |
| **SEO** | Build-time prerendering with Puppeteer |
| **Virtualization** | react-window |
| **Spreadsheets** | SheetJS (xlsx) |
| **PDF Generation** | jsPDF + jspdf-autotable |
| **AI** | OpenAI (via Firebase Cloud Functions) |
| **Payments** | Stripe |
| **Cloud Database** | Firestore |
| **Security** | Web Crypto API (AES-256-GCM) + DOMPurify (XSS prevention) |

## CSV Import

### Supported Formats

The system auto-detects and maps common broker CSV formats:

```csv
# Tradovate (Orders, Orders History, and Trades exports)
Auto-detected. Orders exports pair Buy/Sell fills by product using FIFO
matching with Opening/Closing position disposition; the Trades (performance)
export with realized P&L imports directly.

# Interactive Brokers (IBKR)
Supports both "Closed Positions" format (FifoPnlRealized) and "Trades/Executions"
format (Open/CloseIndicator). Auto-detects and matches opening/closing executions.

# MetaTrader 5
Symbol,Side,Open Price,Close Price,Lots,Open Time,Close Time,PnL
EURUSD,buy,1.1000,1.1050,0.1,28/08/2024 09:30:00,28/08/2024 15:30:00,50.00

# MetaTrader 5 position history (IC Markets, Pepperstone, and similar)
Open and close legs are paired into a single trade with the right direction,
prices, size, and profit.

# NinjaTrader (Trades export)
Auto-detected. Wins, losses, and commissions recorded so imported P&L
matches NinjaTrader exactly.

# DAS Trader (including the simulator)
Per-fill rows are paired into round trips — short sells, partial exits, and
position flips included. Daily exports with time-only rows pick up the
trading date from the file name.

# Standard
symbol,side,entryPrice,exitPrice,quantity,date,pnl
AAPL,long,150.00,155.00,100,2024-01-15,500.00

# TopStep (Orders Export)
Auto-detected by "PositionDisposition" column. Uses FIFO order pairing with
side-aware queues and futures contract multipliers for accurate dollar P&L.

# Excel (.xlsx/.xls)
Auto-converted to CSV via SheetJS. All formats above are supported.

# Regional variants
European semicolon-separated files with comma decimals, tab-separated files,
12-hour AM/PM times, day-first (DD/MM) dates, and title rows above the data.
```

### Column Mapping

The importer recognizes these column name variations:

| Field | Accepted Column Names |
| --- | --- |
| **Symbol** | Symbol, Instrument, Pair |
| **Side** | Side, Type, Direction, Action (long/short, buy/sell) |
| **Entry Price** | Open Price, Entry Price, Open, Entry |
| **Exit Price** | Close Price, Exit Price, Close, Exit |
| **Quantity** | Lots, Volume, Size, Quantity, Units |
| **P&L** | PnL, Profit, P&L, Gain, Net P/L |
| **Date** | Open Time, Entry Time, Date, Time, Open Date |

For unrecognized CSV formats, an interactive column mapping dialog lets you manually assign columns to the required fields. Pro members get columns mapped automatically by AI, and mapped layouts are remembered and reapplied on future imports of the same format.

### Futures Contract Multipliers

Automatically applied when importing futures trades:

| Contract | Multiplier | Contract | Multiplier |
| --- | --- | --- | --- |
| MNQ | $2/pt | NQ | $20/pt |
| MES | $5/pt | ES | $50/pt |
| MYM | $0.50/pt | YM | $5/pt |
| MGC | $10/pt | GC | $100/pt |
| MCL | $10/pt | CL | $1,000/pt |

### Import Preview & Deduplication

When you select a CSV file you get:

- File summary with total rows, successful/failed parse counts, and date range
- Preview table of the first 5 trades
- Detailed error report for any parsing issues
- Confirm or cancel before importing
- Re-importing the same file skips duplicate trades automatically — checked per account, so importing your history into a second account still works

## Project Structure

```text
src/
  components/       # Reusable UI components (shadcn/ui, charts, layout)
  pages/            # Route-level page components
  contexts/         # React context providers (auth, account, settings, theme)
  hooks/            # Custom hooks (demo data, email notifications, mobile)
  services/         # Data, demo, AI assist, PDF report, and sync services
  utils/            # CSV parser, storage, encryption, migration utilities
  lib/              # Firebase, analytics, Resend, utility functions
  types/            # TypeScript type definitions
  constants/        # Trading instruments, changelog data
  data/             # Demo trade data
scripts/
  prerender.mjs     # Build-time SEO prerendering script
functions/
  src/index.ts      # Firebase Cloud Functions (AI assist, Stripe webhooks)
```

## Blog

FreeTradeJournal runs a content blog at [blog.freetradejournal.com](https://blog.freetradejournal.com), built on Ghost and hosted on Railway. Posts are written in Markdown and published via a custom script:

```bash
# Save as draft
npm run publish:post posts/my-post.md

# Publish live
npm run publish:post posts/my-post.md -- --publish
```

Posts live in the `posts/` directory. The Ghost Admin API key is stored in `.env` as `GHOST_ADMIN_API_KEY`.

## SEO

All public routes are pre-rendered at build time using Puppeteer for search engine crawlability:

- Landing page, login, signup
- Documentation
- Release notes / changelog
- Legal pages (privacy policy, terms, cookie policy)
- SEO landing pages for Forex, Futures, Day Trading, and Online Trading journals
- Prop firm affiliate page with comparison table and discount codes
- Individual prop firm review pages (FTMO, The5%ers, Top One Futures)

Each route includes:

- Unique `<title>` and `<meta description>` via a centralized `SEOMeta` component
- Dynamic `<link rel="canonical">` for every route
- Open Graph and Twitter Card tags
- JSON-LD structured data (SoftwareApplication, WebPage, FAQPage, BreadcrumbList)
- FAQ structured data auto-injected on all pages with FAQ sections
- Centralized footer config shared across all marketing pages
- Consistent `www.freetradejournal.com` domain across all URLs

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Support

- **Feedback**: Use the in-app "Send Feedback" button in the sidebar
- **Bug Reports**: [Open an issue on GitHub](https://github.com/Richy701/FreeTradeJournal/issues)
- **Feature Requests**: Use the in-app feedback form or contribute to discussions

---

**FreeTradeJournal** — Track. Analyze. Improve.
