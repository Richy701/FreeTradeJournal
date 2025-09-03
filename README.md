# Free Trade Journal - Professional Trading Journal

A modern, comprehensive trading journal and analytics platform designed for serious traders who want to track, analyze, and improve their trading performance.

## ✨ Key Features

### 📊 Interactive Dashboard
- Real-time P&L tracking with beautiful equity curve visualization
- Key performance metrics (win rate, profit factor, expectancy ratio)
- Daily P&L calendar heatmap showing your trading performance
- Top performing symbols and trading strategies
- Recent trades overview with quick insights

### 📝 Advanced Trade Logging
- Intuitive manual trade entry with comprehensive data fields
- Bulk CSV import/export functionality for broker data
- Full edit and delete capabilities for trade management
- Support for both long and short positions
- Strategy categorization and detailed notes
- Automatic P&L calculations with commission tracking

### 🧠 Trading Journal
- Personal trading journal with mood tracking
- Pre-trade and post-trade analysis entries
- Screenshot and chart attachment support
- Emotion tracking to identify psychological patterns
- Trade linking for complete context

### 📈 Professional Analytics
- Detailed win/loss distribution analysis
- P&L distribution charts and statistics
- Performance correlation analysis
- Hourly, daily, and monthly performance trends
- Risk metrics and drawdown analysis
- Goal tracking and performance monitoring

### 🎨 Modern User Experience
- Clean, responsive design that works on all devices
- Dark/light theme toggle with multiple theme presets
- Smooth animations and intuitive navigation
- Professional charts and visualizations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/free-trade-journal.git
cd free-trade-journal
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase (Authentication):
```bash
# Copy environment file
cp .env.example .env.local
# Add your Firebase configuration to .env.local
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Production Deployment

```bash
npm run build
```

Deploy the `dist` directory to your hosting platform (Vercel, Netlify, etc.).

## 📱 How to Use

### Getting Started
1. **Sign Up/Login**: Create an account or sign in with Google
2. **Dashboard**: View your trading performance overview
3. **Add Your First Trade**: Go to Trade Log → Add Trade
4. **Import Bulk Data**: Use CSV import for existing trading history
5. **Journal Your Trades**: Add context and analysis in the Journal section
6. **Set Goals**: Define and track your trading objectives

### Data Management
- **Cloud Storage**: All data is securely stored in Firebase
- **Export Options**: Download your data anytime
- **Multi-device Sync**: Access your journal from anywhere

## 🛠 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Authentication**: Firebase Auth with Google OAuth
- **Database**: Firebase Firestore
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui (Radix UI + Tailwind CSS)
- **Charts & Visualizations**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS with custom theme system
- **Icons**: Lucide React + FontAwesome

## 📊 CSV Import Format

For bulk trade imports, use these column headers:

```csv
symbol,side,entryPrice,exitPrice,quantity,entryTime,exitTime,commission,strategy,notes
AAPL,long,150.00,155.00,100,2024-01-15 09:30:00,2024-01-15 15:30:00,2.00,Momentum,Strong breakout
```

### Required Fields:
- `symbol` - Trading instrument (e.g., AAPL, EURUSD)
- `side` - Position type: "long" or "short"
- `entryPrice` - Entry price per unit
- `exitPrice` - Exit price per unit  
- `quantity` - Number of shares/units/lots
- `entryTime` - Entry timestamp (YYYY-MM-DD HH:MM:SS)
- `exitTime` - Exit timestamp (YYYY-MM-DD HH:MM:SS)

### Optional Fields:
- `commission` - Total commission paid
- `strategy` - Trading strategy used
- `notes` - Additional trade notes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Support

If you find Free Trade Journal helpful, please consider:
- ⭐ Starring this repository
- 🐛 Reporting bugs or requesting features
- 💡 Contributing to the codebase

---

**Free Trade Journal** - Track. Analyze. Improve. 📈