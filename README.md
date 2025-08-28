# TradeVault - Trading Journal & Analytics Platform

A comprehensive trading journal and analytics platform for tracking, analyzing, and improving your trading performance.

## Features

### 📊 Dashboard
- Real-time P&L tracking with equity curve visualization
- Key performance metrics (win rate, profit factor, expectancy)
- Daily P&L calendar heatmap
- Top performing symbols and strategies
- Recent trades overview

### 📝 Trade Logging
- Manual trade entry with comprehensive fields
- CSV import/export functionality
- Edit and delete existing trades
- Support for long/short positions
- Strategy and notes tracking
- Automatic P&L calculations

### 📈 Advanced Analytics
- Win/loss distribution analysis
- P&L distribution charts
- Trade duration vs profitability correlation
- Hourly and daily performance analysis
- Monthly performance trends
- Risk metrics (Sharpe ratio, Kelly percentage)

### 📑 Reports
- Generate monthly, quarterly, yearly, or custom date range reports
- Export to CSV or JSON formats
- Print-friendly layouts
- Performance breakdown by symbol and strategy
- Tax-ready export formats

### ⚙️ Settings
- Dark/light theme toggle
- Currency and timezone preferences
- Default commission settings
- Data backup and restore
- Import/export all data

## Getting Started

### Installation

1. Navigate to the project directory:
```bash
cd tradevault
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **First Visit**: Start on the landing page and click "Get Started" to access the dashboard
2. **Add Trades**: Navigate to "Trade Log" and click "Add Trade" to record your trades
3. **Import Data**: Use the CSV import feature to bulk import trades from your broker
4. **View Analytics**: Check the Dashboard for overview metrics and Analytics for detailed analysis
5. **Generate Reports**: Use the Reports section for tax preparation or performance review

## Data Storage

All data is stored locally in your browser's localStorage. To backup your data:
1. Go to Settings > Data Management
2. Click "Export All Data" to save a backup file
3. Use "Import Data" to restore from a backup

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Date Handling**: date-fns
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS

## CSV Import Format

When importing trades via CSV, use the following column headers:
- symbol
- side (long/short)
- entryPrice
- exitPrice
- quantity
- entryTime (YYYY-MM-DD HH:MM:SS)
- exitTime (YYYY-MM-DD HH:MM:SS)
- commission
- strategy (optional)
- notes (optional)

## License

MIT