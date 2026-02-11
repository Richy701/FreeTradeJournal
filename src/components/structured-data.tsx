import { useLocation } from 'react-router-dom';

interface StructuredDataProps {
  type?: 'SoftwareApplication' | 'WebPage' | 'Article' | 'FAQPage';
  title?: string;
  description?: string;
}

export function StructuredData({ type = 'WebPage', title, description }: StructuredDataProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const baseUrl = 'https://freetradejournal.com';
  
  const getStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": type,
      "url": `${baseUrl}${currentPath}`,
      "name": title || "FreeTradeJournal",
      "description": description || "Free professional trading journal for forex, futures and stock traders"
    };

    // Homepage - SoftwareApplication
    if (currentPath === '/') {
      return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "FreeTradeJournal",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web",
        "description": "Free professional trading journal for forex, futures and stock traders. Track trades, analyze performance metrics, manage risk, and improve your trading with advanced analytics.",
        "url": baseUrl,
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "350"
        },
        "featureList": [
          "Free trading journal and trade tracker",
          "Performance analytics dashboard with equity curve",
          "Risk management tools and position sizing calculator",
          "Calendar heatmap visualization for daily P&L",
          "CSV/Excel import for MetaTrader and broker data",
          "Multi-account support with user-scoped data",
          "Trading psychology journal with mood tracking",
          "AI-powered trading insights and pattern detection",
          "Export trades to CSV/Excel for tax reporting",
          "Goal setting and progress tracking",
          "Prop firm dashboard support",
          "Real-time P&L calculations",
          "Win rate and performance metrics",
          "Trade filtering and search functionality"
        ],
        "screenshot": "https://freetradejournal.com/images/landing/Trading_dashboard_New_screenshot-1200w.webp",
        "softwareVersion": "2.0.0",
        "author": {
          "@type": "Organization",
          "name": "FreeTradeJournal",
          "url": baseUrl
        },
        "sameAs": [
          "https://t.me/+UI6uTKgfswUwNzhk"
        ]
      };
    }

    // Documentation page - FAQPage
    if (currentPath === '/documentation') {
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Is my trading data secure?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, your trading data is stored locally on your device by default. We use industry-standard encryption for any cloud sync features, and your sensitive financial information never leaves your control without your explicit consent."
            }
          },
          {
            "@type": "Question",
            "name": "What file formats can I import?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We support CSV files from most major brokers and trading platforms, as well as Excel files (.xlsx, .xls). Common formats include MetaTrader, TradingView, Interactive Brokers, and most prop firm reporting formats."
            }
          },
          {
            "@type": "Question",
            "name": "Can I use this for tax reporting?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "While FreeTradeJournal provides detailed P&L calculations and export capabilities, you should always verify data accuracy and consult with a tax professional for official tax reporting purposes."
            }
          },
          {
            "@type": "Question",
            "name": "Does FreeTradeJournal provide trading advice?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No, FreeTradeJournal is purely an analysis and journaling tool. We do not provide investment advice, trading signals, or financial recommendations. All trading decisions remain your responsibility."
            }
          }
        ]
      };
    }

    // Forex Trading Journal page
    if (currentPath === '/forex-trading-journal') {
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Forex Trading Journal - Professional FX Tracker",
        "description": "Professional forex trading journal for FX traders. Track currency pairs, analyze pip performance, manage risk with position sizing.",
        "url": `${baseUrl}${currentPath}`,
        "mainEntity": {
          "@type": "SoftwareApplication",
          "name": "FreeTradeJournal Forex Module",
          "applicationCategory": "FinanceApplication",
          "applicationSubCategory": "Forex Trading Journal",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "featureList": [
            "Track all major, minor, and exotic currency pairs",
            "Automatic pip calculation for all pairs including JPY",
            "Session analysis (London, New York, Tokyo, Sydney)",
            "Currency correlation matrix",
            "Risk management with position sizing",
            "MT4/MT5 integration and CSV import",
            "Economic calendar integration"
          ]
        }
      };
    }

    // Futures Trading Tracker page
    if (currentPath === '/futures-trading-tracker') {
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Futures Trading Tracker - Professional Futures Journal",
        "description": "Track futures contracts, analyze tick performance, manage margin requirements for ES, NQ, CL, GC traders.",
        "url": `${baseUrl}${currentPath}`,
        "mainEntity": {
          "@type": "SoftwareApplication",
          "name": "FreeTradeJournal Futures Module",
          "applicationCategory": "FinanceApplication",
          "applicationSubCategory": "Futures Trading Tracker",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "featureList": [
            "Track E-mini S&P 500, Nasdaq, Crude Oil, Gold contracts",
            "Automatic tick and point value calculation",
            "Volume profile analysis",
            "Margin and leverage tracking",
            "Time-based analytics for scalping",
            "Contract roll tracking",
            "Commission and fee tracking"
          ]
        }
      };
    }

    // Prop Firm Dashboard page
    if (currentPath === '/prop-firm-dashboard') {
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Prop Firm Dashboard - Funded Trader Journal",
        "description": "Professional dashboard for FTMO, Apex, TopStep traders. Track evaluations, manage drawdown limits, monitor funded accounts.",
        "url": `${baseUrl}${currentPath}`,
        "mainEntity": {
          "@type": "SoftwareApplication",
          "name": "FreeTradeJournal Prop Firm Module",
          "applicationCategory": "FinanceApplication",
          "applicationSubCategory": "Prop Trading Dashboard",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "featureList": [
            "Real-time drawdown management and alerts",
            "Daily loss limit tracking",
            "Evaluation progress monitoring",
            "Multi-account support for different prop firms",
            "Payout and profit split tracking",
            "Challenge and verification analytics",
            "Support for 20+ prop firms including FTMO, Apex, TopStep"
          ]
        }
      };
    }

    // Default WebPage schema
    return {
      ...baseData,
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": title || "Page",
            "item": `${baseUrl}${currentPath}`
          }
        ]
      }
    };
  };

  const structuredData = getStructuredData();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
}