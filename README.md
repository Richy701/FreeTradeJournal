# FreeTradeJournal — Professional Trading Journal & Analytics

A free, modern trading journal and analytics platform for traders who want to track, analyze, and improve their performance. Supports Forex, Futures, and Indices across 50+ instruments with built-in prop firm tracking. Built with React 19, TypeScript, and Firebase.

## Key Features

### Interactive Dashboard
- Real-time P&L tracking with interactive equity curve
- Key performance metrics (win rate, profit factor, expectancy ratio)
- Daily P&L calendar heatmap
- AI-powered Trading Coach with psychological pattern detection
- Recent trades overview with quick insights
- Quick trade entry directly from the dashboard

### Advanced Trade Logging
- Manual trade entry with comprehensive fields (entry/exit prices, stop loss, take profit, commissions, swaps, spreads)
- CSV import with live preview, validation, and smart column mapping
- Support for MetaTrader 5, standard CSV, and other broker formats
- Full CRUD operations with pagination and filtering
- Report generation (monthly, quarterly, yearly, custom)
- Automatic P&L calculations with market-specific multipliers
- Multi-account support with per-account data isolation
- Prop firm assignment per trade

### Trading Journal
- Journal entries with mood tracking (Bullish, Bearish, Neutral)
- Pre-trade and post-trade analysis entry types
- Emotion tracking across 20+ emotional states to identify patterns
- Screenshot and chart attachment support via drag-and-drop
- Trade linking to connect journal entries to specific trades
- Tag system with search and filtering (date range, market, P&L, mood)

### Goals & Risk Management
- Goal types: profit target, win rate, trade count, risk/reward, max loss, max drawdown
- Daily, weekly, and monthly goal periods with progress tracking
- Risk rules: max loss per day/trade, max risk percentage, max open trades
- Rule violation tracking with visual indicators
- Position size and risk/reward calculators

### AI Trading Coach
- Automatic detection of overtrading, revenge trading, and FOMO patterns
- Emotional trading pattern analysis
- Best/worst trading hours and days analysis
- Personalized coaching tips based on your performance data
- Consistency scoring and streak detection

### Multi-Account & Prop Firm Support
- Multiple account types: Live, Demo, Prop Firm, Paper
- Pre-configured prop firm list (FTMO, Apex, TopStep, E8 Markets, Funded FX, FundingPips, Alpha Capital, The5ers)
- Per-account trade isolation and filtering
- Account switching from the sidebar

### 12 Color Themes
- Default, Ocean Blue, Neon, Sunset, Purple, Deep Yellow, Rose Gold, Mint Frost, Ice, Crimson, Mono Black & White, Sage
- Dark/Light/System mode
- Dynamic profit/loss and primary color customization
- Theme persistence across sessions

### Landing Page
- Polished hero section with animated gradient CTA buttons (pill-shaped design)
- Instant demo access and sign-up prompts

### Demo Mode
- Instant access without signup via "Try Demo"
- 50+ realistic pre-populated trades across Forex, Futures, and Indices
- All features fully accessible in demo mode

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Richy701/FreeTradeJournal.git
cd FreeTradeJournal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add the following to `.env.local`:
- Firebase configuration (`VITE_FIREBASE_*`)
- Google Analytics tracking ID (`VITE_GA_TRACKING_ID`) *(optional)*
- Resend API key (`VITE_RESEND_API_KEY`) *(optional, for email notifications)*

4. Start the development server:
```bash
npm run dev
```

5. Open `http://localhost:5173`

### Production Build

```bash
npm run build
```

The build step includes TypeScript compilation, Vite bundling, and Puppeteer-based prerendering of all public routes for SEO. Deploy the `dist` directory to your hosting platform (Vercel, Netlify, etc.).

## How to Use

1. **Sign Up / Login** — Create an account with email or sign in with Google
2. **Setup** — Name your first trading account, pick a type (Live, Demo, Prop Firm), and set your starting balance
3. **Dashboard** — View your trading performance at a glance
4. **Add Trades** — Manual entry or CSV import from your broker
5. **Journal** — Document your analysis, emotions, and attach screenshots
6. **Goals** — Set targets and risk rules to keep yourself accountable
7. **Settings** — Customize themes, currency, timezone, and notifications

### Data Management
- **Local-First Storage** - Trade data stored in browser localStorage, scoped per user
- **User-Scoped Isolation** - Complete data separation between accounts
- **Backup & Restore** - Export all data as JSON and import from backup
- **CSV/Excel Import** - Bring in existing trading history from any broker

## Technology Stack

| Category | Technology |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 7 |
| **Authentication** | Firebase Auth (Google OAuth + Email/Password) |
| **UI Components** | shadcn/ui (Radix UI + Tailwind CSS) |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Forms** | React Hook Form + Zod |
| **State Management** | React Context API + Zustand |
| **Routing** | React Router DOM v7 |
| **Date Handling** | date-fns |
| **Email** | Resend |
| **Icons** | Lucide React + FontAwesome |
| **Analytics** | Vercel Analytics + Google Analytics |
| **SEO** | Build-time prerendering with Puppeteer |
| **Virtualization** | react-window |
| **Spreadsheets** | SheetJS (xlsx) |

## CSV Import

### Supported Formats

The system auto-detects and maps common broker CSV formats:

```csv
# MetaTrader 5
Symbol,Side,Open Price,Close Price,Lots,Open Time,Close Time,PnL
EURUSD,buy,1.1000,1.1050,0.1,28/08/2024 09:30:00,28/08/2024 15:30:00,50.00

# Standard
symbol,side,entryPrice,exitPrice,quantity,date,pnl
AAPL,long,150.00,155.00,100,2024-01-15,500.00
```

### Column Mapping

The importer recognizes these column name variations:

| Field | Accepted Column Names |
|---|---|
| **Symbol** | Symbol, Instrument, Pair |
| **Side** | Side, Type, Direction, Action (long/short, buy/sell) |
| **Entry Price** | Open Price, Entry Price, Open, Entry |
| **Exit Price** | Close Price, Exit Price, Close, Exit |
| **Quantity** | Lots, Volume, Size, Quantity, Units |
| **P&L** | PnL, Profit, P&L, Gain, Net P/L |
| **Date** | Open Time, Entry Time, Date, Time, Open Date |

### Import Preview

When you select a CSV file you get:
- File summary with total rows, successful/failed parse counts, and date range
- Preview table of the first 5 trades
- Detailed error report for any parsing issues
- Confirm or cancel before importing

## Project Structure

```
src/
  components/       # Reusable UI components (shadcn/ui, charts, layout)
  pages/            # Route-level page components
  contexts/         # React context providers (auth, account, settings, theme)
  hooks/            # Custom hooks (demo data, email notifications, mobile)
  services/         # Data and demo services
  utils/            # CSV parser, storage, migration utilities
  lib/              # Firebase, analytics, Resend, utility functions
  types/            # TypeScript type definitions
  constants/        # Trading instrument constants
  data/             # Demo trade data
scripts/
  prerender.mjs     # Build-time SEO prerendering script
```

## SEO

All public routes are pre-rendered at build time using Puppeteer for search engine crawlability:

- Landing page, login, signup
- Documentation
- Legal pages (privacy policy, terms, cookie policy)
- SEO landing pages for Forex, Futures, and Prop Firm traders

Each route includes:
- Unique `<title>` and `<meta description>` via a centralized `SEOMeta` component
- Dynamic `<link rel="canonical">` for every route
- Open Graph and Twitter Card tags
- JSON-LD structured data (SoftwareApplication, WebPage, FAQPage)
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

- **Feedback**: [Send us feedback](https://tally.so/r/meV7rl)
- **Bug Reports**: [Open an issue on GitHub](https://github.com/Richy701/FreeTradeJournal/issues)
- **Feature Requests**: Contribute to discussions

---

**FreeTradeJournal** — Track. Analyze. Improve.
