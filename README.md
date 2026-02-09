# FreeTradeJournal - Professional Trading Journal & Analytics

A modern, comprehensive trading journal and analytics platform designed for serious traders who want to track, analyze, and improve their trading performance. Built with React, TypeScript, and Firebase for professional-grade reliability and performance.

## ✨ Key Features

### 📊 Interactive Dashboard
- Real-time P&L tracking with beautiful equity curve visualization
- Key performance metrics (win rate, profit factor, expectancy ratio)
- Daily P&L calendar heatmap showing your trading performance
- Top performing symbols and trading strategies
- Recent trades overview with quick insights
- Advanced analytics with psychological pattern detection

### 📝 Advanced Trade Logging
- Intuitive manual trade entry with comprehensive data fields
- **Enhanced CSV import with live preview and validation**
- Bulk CSV import/export functionality for broker data
- Full edit and delete capabilities for trade management
- Support for both long and short positions across all markets
- Strategy categorization and detailed notes
- Automatic P&L calculations with commission/swap/spread tracking
- Multi-account support with user-scoped data isolation

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
- **Dynamic theme system with customizable color presets**
- Dark/light mode toggle with theme persistence
- Smooth animations and intuitive navigation
- Professional charts and visualizations
- Mobile-first responsive design
- **Theme-aware CSV import preview with enhanced UX**

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
- **Local-First Storage**: Data stored locally with optional cloud sync
- **User-Scoped Data**: Complete data isolation between users
- **Demo Mode**: Try the platform with sample data
- **Export Options**: Download your data anytime in multiple formats
- **Multi-device Sync**: Access your journal from anywhere
- **Enhanced CSV Import**: Live preview, validation, and error handling

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

## 📊 Enhanced CSV Import System

### 🎯 Key Features
- **Live Preview**: See your data before importing with file summary and sample trades
- **Smart Validation**: Automatic error detection and reporting
- **Flexible Mapping**: Supports multiple broker formats and column variations
- **Theme Integration**: Beautiful, theme-aware preview interface
- **Error Handling**: Clear feedback on parsing issues with detailed error messages

### 📁 Supported Formats

The system automatically detects and maps common broker CSV formats:

```csv
# MetaTrader 5 Format
Symbol,Side,Open Price,Close Price,Lots,Open Time,Close Time,PnL
EURUSD,buy,1.1000,1.1050,0.1,28/08/2024 09:30:00,28/08/2024 15:30:00,50.00

# Standard Format  
symbol,side,entryPrice,exitPrice,quantity,date,pnl
AAPL,long,150.00,155.00,100,2024-01-15,500.00
```

### 🔧 Column Mapping

The system automatically recognizes these column variations:

**Instrument/Symbol**: Symbol, Instrument, Pair  
**Position Type**: Side, Type, Direction, Action (accepts: long/short, buy/sell)  
**Entry Price**: Open Price, Entry Price, Open, Entry  
**Exit Price**: Close Price, Exit Price, Close, Exit  
**Quantity**: Lots, Volume, Size, Quantity, Units  
**Profit/Loss**: PnL, Profit, P&L, Gain, Net P/L  
**Date/Time**: Open Time, Entry Time, Date, Time, Open Date  

### ✅ Import Preview Features

When you select a CSV file, you'll see:
- **File Summary**: Total rows, successful/failed parsing counts, date range
- **Trade Preview**: First 5 trades in a formatted table
- **Error Report**: Detailed list of any parsing issues
- **Validation Results**: Clear success/failure indicators
- **Import Controls**: Confirm or cancel with detailed feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆕 Recent Updates

### Version 2.0 Features:
- **Enhanced CSV Import**: Live preview with validation and theme-aware interface
- **Theme System Overhaul**: Dynamic color presets with complete theme consistency
- **User Data Isolation**: Proper multi-user support with scoped localStorage
- **Mobile Optimization**: Improved responsive design and mobile experience
- **Performance Improvements**: Faster loading and better error handling

## 🌟 Support

### Get Help:
- 📝 **Feedback**: [Send us feedback](https://tally.so/r/meV7rl)
- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Contribute to discussions

### Show Support:
- ⭐ Star this repository
- 🚀 Share with fellow traders
- 💡 Contribute to the codebase
- 📢 Follow us for updates

---

**FreeTradeJournal** - Track. Analyze. Improve. 📈

*Built with ❤️ for traders*