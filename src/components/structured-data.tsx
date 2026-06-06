import { useLocation } from 'react-router-dom';

interface StructuredDataProps {
  type?: 'SoftwareApplication' | 'WebPage' | 'Article' | 'FAQPage';
  title?: string;
  description?: string;
}

export function StructuredData({ type = 'WebPage', title, description }: StructuredDataProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const baseUrl = 'https://www.freetradejournal.com';
  
  const getStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": type,
      "url": `${baseUrl}${currentPath}`,
      "name": title || "FreeTradeJournal",
      "description": description || "Free professional trading journal for forex, futures and stock traders"
    };

    // Homepage - WebSite + SoftwareApplication + Organization in @graph
    if (currentPath === '/') {
      return {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "url": baseUrl,
            "name": "FreeTradeJournal",
            "description": "Free professional trading journal and analytics platform"
          },
          {
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
            "featureList": [
              "Free trading journal and trade tracker",
              "Performance analytics dashboard with equity curve",
              "Risk management tools and position sizing calculator",
              "Calendar heatmap visualization for daily P&L",
              "CSV/Excel import for MetaTrader and broker data",
              "Multi-account support with user-scoped data",
              "Trading psychology journal with mood tracking",
              "AI Trading Coach with personalised coaching tips",
              "AI Trade Analysis with pattern detection",
              "AI Trade Review with entry/exit assessment",
              "AI Journal Prompts for self-reflection",
              "AI Strategy Tagger for trade classification",
              "AI Risk Alerts for revenge trading and loss streaks",
              "AI Goal Coach with progress recommendations",
              "Cloud sync across devices for Pro users",
              "Export trades to CSV/Excel for tax reporting",
              "Goal setting and progress tracking",
              "Prop firm dashboard support",
              "Real-time P&L calculations",
              "Win rate and performance metrics",
              "Trade filtering and search functionality"
            ],
            "screenshot": `${baseUrl}/images/screenshots/trading-dashboard-screenshot.png`,
            "softwareVersion": "2.0.0",
            "author": {
              "@type": "Organization",
              "name": "FreeTradeJournal",
              "url": baseUrl
            },
            "sameAs": [
              "https://t.me/+UI6uTKgfswUwNzhk"
            ]
          },
          {
            "@type": "Organization",
            "name": "FreeTradeJournal",
            "url": baseUrl,
            "logo": `${baseUrl}/favicon-512x512.png`,
            "sameAs": [
              "https://t.me/+UI6uTKgfswUwNzhk"
            ]
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
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Forex Trading Journal", "item": `${baseUrl}${currentPath}` }
          ]
        },
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
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Futures Trading Tracker", "item": `${baseUrl}${currentPath}` }
          ]
        },
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
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Prop Firm Dashboard", "item": `${baseUrl}${currentPath}` }
          ]
        },
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

    // PropTracker page
    if (currentPath === '/prop-tracker') {
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "PropTracker - Free Prop Firm Fee & Payout Tracker",
        "description": "Track every prop firm fee, reset, payout and net P&L across all your accounts. Know your true profit after every cost — free forever.",
        "url": `${baseUrl}${currentPath}`,
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "PropTracker", "item": `${baseUrl}${currentPath}` }
          ]
        },
        "mainEntity": {
          "@type": "SoftwareApplication",
          "name": "PropTracker by FreeTradeJournal",
          "applicationCategory": "FinanceApplication",
          "applicationSubCategory": "Prop Firm Fee & Payout Tracker",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "featureList": [
            "Track evaluation fees, reset fees, and monthly subscription costs",
            "Log all payouts and withdrawals per prop firm account",
            "Net P&L calculation after every fee and payout",
            "Multi-firm support — FTMO, Apex, TopStep, MyFundedFX, E8 and 10+ firms",
            "Account status tracking — active, passed, failed, withdrawn",
            "Full transaction history grouped by month",
            "Free for all users — no credit card required"
          ],
          "screenshot": `${baseUrl}/images/screenshots/prop-tracker-screenshot.png`
        }
      };
    }

    // FTMO Review page
    if (currentPath === '/ftmo-review') {
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "FTMO Review (2026) - Honest Pros, Cons & Challenge Breakdown",
        "description": "In-depth FTMO review with pros, cons, pricing, profit splits, and payout details.",
        "url": `${baseUrl}${currentPath}`,
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Affiliate", "item": `${baseUrl}/affiliate` },
            { "@type": "ListItem", "position": 3, "name": "FTMO Review", "item": `${baseUrl}${currentPath}` }
          ]
        }
      };
    }

    // The5%ers Review page
    if (currentPath === '/the5ers-review') {
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "The5%ers Review (2026) - Instant Funding & Scaling to $4M",
        "description": "Honest The5%ers review with instant funding details, evaluation options, profit splits, and exclusive discount code.",
        "url": `${baseUrl}${currentPath}`,
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Affiliate", "item": `${baseUrl}/affiliate` },
            { "@type": "ListItem", "position": 3, "name": "The5%ers Review", "item": `${baseUrl}${currentPath}` }
          ]
        }
      };
    }

    // Top One Futures Review page
    if (currentPath === '/top-one-futures-review') {
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Top One Futures Review (2026) - Best Futures Prop Firm?",
        "description": "Top One Futures review with evaluation details, supported contracts, profit splits, and honest pros & cons.",
        "url": `${baseUrl}${currentPath}`,
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Affiliate", "item": `${baseUrl}/affiliate` },
            { "@type": "ListItem", "position": 3, "name": "Top One Futures Review", "item": `${baseUrl}${currentPath}` }
          ]
        }
      };
    }

    // Affiliate page
    if (currentPath === '/affiliate') {
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Best Prop Firm Deals & Discounts (2026)",
        "description": "Exclusive prop firm discounts and affiliate deals. Save on FTMO, The5%ers, Apex, TopStep, and FundedNext challenges.",
        "url": `${baseUrl}${currentPath}`,
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Affiliate Partners", "item": `${baseUrl}${currentPath}` }
          ]
        }
      };
    }

    // Day Trading Journal page
    if (currentPath === '/day-trading-journal') {
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Free Day Trading Journal - Scalp & Intraday Tracker",
        "description": "Free day trading journal for scalpers and intraday traders. Track daily P&L, catch overtrading, and analyze your best sessions.",
        "url": `${baseUrl}${currentPath}`,
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Day Trading Journal", "item": `${baseUrl}${currentPath}` }
          ]
        },
        "mainEntity": {
          "@type": "SoftwareApplication",
          "name": "FreeTradeJournal Day Trading Module",
          "applicationCategory": "FinanceApplication",
          "applicationSubCategory": "Day Trading Journal",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "featureList": [
            "Session-based P&L tracking for morning, midday, and afternoon",
            "Daily trade count limits to catch overtrading",
            "Calendar heatmap with daily P&L color coding",
            "AI trade review with entry/exit analysis",
            "CSV import from Tradovate, MetaTrader 5, NinjaTrader",
            "Win rate, profit factor, expectancy, and drawdown analytics"
          ]
        }
      };
    }

    // Online Trading Journal page
    if (currentPath === '/online-trading-journal') {
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Free Online Trading Journal - No Download Required",
        "description": "Free online trading journal that works in your browser. No download, no spreadsheet. Log trades, track P&L, and get AI coaching.",
        "url": `${baseUrl}${currentPath}`,
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Online Trading Journal", "item": `${baseUrl}${currentPath}` }
          ]
        },
        "mainEntity": {
          "@type": "SoftwareApplication",
          "name": "FreeTradeJournal Online",
          "applicationCategory": "FinanceApplication",
          "applicationSubCategory": "Online Trading Journal",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "featureList": [
            "No download — works entirely in your browser",
            "Responsive design for desktop, tablet, and mobile",
            "Cloud sync across devices for Pro users",
            "CSV import from any broker",
            "AI-powered trade coaching and risk alerts",
            "Full analytics with equity curve and calendar heatmap"
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