import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
}

const pageMeta: Record<string, SEOMetaProps> = {
  '/': {
    title: 'Best Free Trading Journal (2026) | AI Analytics & CSV Import | FreeTradeJournal',
    description: 'The #1 free trading journal for forex, futures & stocks. Log trades, track P&L, get AI coaching, and import from MT5/Tradovate. Used by 5,000+ traders. No credit card required.',
    keywords: 'free trading journal, best free trading journal, forex trading journal, futures trading tracker, stock trading log, prop firm dashboard, day trading journal, free day trading journal, trading journal online, swing trading tracker, MetaTrader journal, trading diary, trade performance tracker, forex trade log, trading analytics, prop firm journal, trading psychology tracker, AI trading coach, AI trade analysis, AI risk alerts, online trading journal, free trading journal website',
    image: 'https://www.freetradejournal.com/og-image.png'
  },
  '/dashboard': {
    title: 'Trading Dashboard | FreeTradeJournal - Performance Analytics & Metrics',
    description: 'Comprehensive trading dashboard with real-time P&L, win rate analysis, equity curve, and performance metrics. Track your forex, futures, and stock trades.',
    keywords: 'trading dashboard, P&L tracker, equity curve, trading analytics, performance metrics, trading statistics, win rate calculator, profit loss tracker, trading performance analysis, forex dashboard, futures trading analytics'
  },
  '/trades': {
    title: 'Trade Log | FreeTradeJournal - Track All Your Trades',
    description: 'Log and track all your forex, futures, and stock trades. Filter by date, symbol, strategy. Export to CSV. Comprehensive trade management system.',
    keywords: 'trade log, trade tracker, trading history, trade journal, trade management'
  },
  '/goals': {
    title: 'Trading Goals & Risk Management | FreeTradeJournal',
    description: 'Set trading goals, manage risk with position size calculator, track progress. Professional risk management tools for forex and futures traders.',
    keywords: 'trading goals, risk management, position sizing, risk calculator, trading targets'
  },
  '/journal': {
    title: 'Trading Journal & Notes | FreeTradeJournal',
    description: 'Document your trading psychology, market analysis, and trade notes. Track emotions, strategies, and lessons learned from each trade.',
    keywords: 'trading journal, trading diary, trading notes, trading psychology, trade analysis'
  },
  '/login': {
    title: 'Login | FreeTradeJournal - Access Your Trading Journal',
    description: 'Login to your free trading journal account. Track trades, analyze performance, manage risk.',
    keywords: 'login, sign in, trading journal login'
  },
  '/signup': {
    title: 'Sign Up Free | FreeTradeJournal - Start Your Trading Journal',
    description: 'Create your free trading journal account. No credit card required. Start tracking trades and improving your performance today.',
    keywords: 'sign up, register, free account, trading journal signup'
  },
  '/documentation': {
    title: 'How to Use FreeTradeJournal | Setup Guide & Tutorials',
    description: 'Step-by-step guide to logging trades, importing CSV data, reading analytics, and setting goals in FreeTradeJournal. Get started in under 2 minutes.',
    keywords: 'trading journal guide, documentation, help, CSV import, trade tracking tutorial, how to use trading journal, trading journal setup'
  },
  '/privacy': {
    title: 'Privacy Policy | FreeTradeJournal - Your Data Protection',
    description: 'FreeTradeJournal privacy policy. Learn how we protect your trading data and personal information.',
    keywords: 'privacy policy, data protection, trading data security'
  },
  '/terms': {
    title: 'Terms & Conditions | FreeTradeJournal - Service Terms',
    description: 'FreeTradeJournal terms and conditions of service. User agreement and service terms.',
    keywords: 'terms of service, user agreement, terms and conditions'
  },
  '/settings': {
    title: 'Settings | FreeTradeJournal - Account Preferences',
    description: 'Manage your FreeTradeJournal account settings, preferences, and trading configuration.',
    keywords: 'trading journal settings, account preferences, trading configuration'
  },
  '/cookie-policy': {
    title: 'Cookie Policy | FreeTradeJournal - How We Use Cookies',
    description: 'FreeTradeJournal cookie policy. Learn about the cookies we use to improve your trading journal experience.',
    keywords: 'cookie policy, cookies, tracking, privacy'
  },
  '/changelog': {
    title: 'Changelog | FreeTradeJournal - Latest Updates & New Features',
    description: 'See what\'s new in FreeTradeJournal. Latest updates, new features, bug fixes, and improvements to your free trading journal.',
    keywords: 'changelog, updates, release notes, new features, trading journal updates'
  },
  '/pricing': {
    title: 'Pricing | Free Forever + Pro Plans from $12.99/mo | FreeTradeJournal',
    description: 'Free forever with unlimited trades, analytics, and CSV import. Upgrade to Pro for AI coaching, cloud sync, and advanced exports. Plans from $12.99/mo with 14-day free trial.',
    keywords: 'trading journal pricing, free trading journal, pro trading tools, AI trading coach, trading analytics subscription, trade analysis pricing'
  },
  '/forex-trading-journal': {
    title: 'Free Forex Trading Journal (2026) | Track Pips, Pairs & P&L | FreeTradeJournal',
    description: 'The best free forex trading journal. Log every FX trade, auto-calculate pips, analyze performance by pair, and import from MT4/MT5. No credit card, no sign-up wall.',
    keywords: 'forex trading journal, free forex trading journal, free forex journal, FX trading tracker, currency trading log, forex performance tracker, pip counter, forex P&L tracker, MT4 journal, MT5 trading journal, forex risk management, currency pair analysis, forex win rate, FX trading diary, forex trade log, EURUSD tracker, GBPUSD journal, forex position sizing, pip calculator journal, forex drawdown tracker'
  },
  '/futures-trading-tracker': {
    title: 'Free Futures Trading Journal (2026) | ES, NQ, CL & GC Tracker | FreeTradeJournal',
    description: 'The best free futures trading tracker. Log ES, NQ, CL, GC contracts with P&L calculation, analytics, and Tradovate/MT5 import. Used by day traders and scalpers. 100% free.',
    keywords: 'futures trading tracker, free futures trading journal, futures journal, free day trading journal, ES trading journal, NQ trading tracker, crude oil futures log, gold futures tracker, futures P&L tracker, futures risk management, tick counter, futures margin calculator, E-mini journal, micro futures tracker, futures performance analytics, futures trade log, CME futures journal, futures position tracker, commodity trading journal, index futures tracker'
  },
  '/prop-firm-dashboard': {
    title: 'Free Prop Firm Dashboard (2026) | FTMO, Apex & TopStep Tracker | FreeTradeJournal',
    description: 'The best free prop firm dashboard. Track eval progress, drawdown limits, daily loss caps, fees, and payouts across FTMO, Apex, TopStep, and 10+ firms. 100% free.',
    keywords: 'prop firm dashboard, free prop firm dashboard, prop trading dashboard, prop firm trading journal, prop firm tracker, FTMO journal, Apex trader journal, TopStep tracker, funded trader journal, evaluation account tracker, drawdown management, daily loss limit tracker, prop trading journal, funded account dashboard, FTMO tracker, MFF journal, E8 funding tracker, prop firm analytics, challenge tracker, verification tracker, funded trader dashboard'
  },
  '/prop-tracker': {
    title: 'PropTracker - Free Prop Firm Fee & Payout Tracker | FreeTradeJournal',
    description: 'Track every prop firm fee, reset, payout and net P&L across all your accounts — free. PropTracker shows your true profit after every cost. Works with FTMO, Apex, TopStep, MyFundedFX and 10+ firms. No credit card required.',
    keywords: 'prop firm fee tracker, prop firm payout tracker, prop trading cost calculator, FTMO fee tracker, Apex trader payout tracker, TopStep fee calculator, funded trader expense tracker, prop firm net profit, prop firm account tracker, prop firm P&L tracker, prop trading ROI calculator, funded trader cost tracker, prop firm reset fee tracker, evaluation fee tracker, prop firm profit calculator, prop firm expense tracker',
    image: 'https://www.freetradejournal.com/images/screenshots/prop-tracker-screenshot.png'
  },
  '/day-trading-journal': {
    title: 'Free Day Trading Journal (2026) | Log Scalps & Intraday Trades | FreeTradeJournal',
    description: 'The best free day trading journal. Log scalps and intraday trades, track daily P&L, analyze win rate by session, and spot overtrading. CSV import from any broker. No credit card.',
    keywords: 'free day trading journal, day trading journal, best free trading journal, day trading tracker, scalping journal, intraday trading log, day trading analytics, trading journal online, day trading performance, overtrading tracker, daily P&L tracker, day trading diary'
  },
  '/online-trading-journal': {
    title: 'Free Online Trading Journal (2026) | No Download Required | FreeTradeJournal',
    description: 'The best free online trading journal. Works in your browser with no download. Log trades, track P&L, get AI coaching, and import CSV from any broker. Free forever.',
    keywords: 'online trading journal, free online trading journal, trading journal online, trading journal website, best free trading journal, online trade journal, web trading journal, browser trading journal, trading journal online free, free trading journal website, trading journal software free'
  },
  '/affiliate': {
    title: 'Best Prop Firm Deals & Discounts (2026) | Exclusive Codes | FreeTradeJournal',
    description: 'Exclusive prop firm discounts and affiliate deals. Save on FTMO, The5%ers, Apex, TopStep, and FundedNext challenges. Verified discount codes updated for 2026.',
    keywords: 'prop firm discount, prop firm coupon code, FTMO discount, The5ers discount, Apex trader funding deal, TopStep promo code, FundedNext coupon, prop firm affiliate, prop trading deals, best prop firm deals 2026, prop firm challenge discount, funded trader discount, prop firm promo codes'
  },
  '/ftmo-review': {
    title: 'FTMO Review (2026) | Honest Pros, Cons & Challenge Breakdown | FreeTradeJournal',
    description: 'In-depth FTMO review for 2026. Two-step evaluation breakdown, profit splits up to 90%, payout process, pricing, and how to track your FTMO challenge with FreeTradeJournal.',
    keywords: 'FTMO review, FTMO review 2026, is FTMO legit, FTMO challenge review, FTMO pros and cons, FTMO profit split, FTMO payout, FTMO evaluation, FTMO cost, FTMO funded account, FTMO trading journal'
  },
  '/the5ers-review': {
    title: 'The5%ers Review (2026) | Instant Funding & Scaling to $4M | FreeTradeJournal',
    description: 'Honest The5%ers review for 2026. Instant funding, one-step and two-step evaluations, scaling to $4M, profit splits, and exclusive 5% discount code ZBY34.',
    keywords: 'The5ers review, The5ers review 2026, is The5ers legit, The5ers instant funding, The5ers discount code, The5ers pros and cons, The5ers profit split, The5ers payout, The5ers evaluation, The5ers scaling plan'
  },
  '/top-one-futures-review': {
    title: 'Top One Futures Review (2026) | Best Futures Prop Firm? | FreeTradeJournal',
    description: 'Top One Futures review for 2026. One-step evaluation for ES, NQ, CL, GC futures traders. No scaling requirements, up to 90% profit split, and honest pros & cons.',
    keywords: 'Top One Futures review, Top One Futures review 2026, Top One Trader review, futures prop firm review, best futures prop firm, Top One Futures evaluation, Top One Futures payout, futures trading prop firm'
  }
};

export function SEOMeta({ title, description, keywords, image }: SEOMetaProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  
  useEffect(() => {
    const meta = pageMeta[currentPath] || {};
    const finalTitle = title || meta.title || 'FreeTradeJournal - Free Trading Journal';
    const finalDescription = description || meta.description || 'Free professional trading journal for forex, futures and stock traders.';
    const finalKeywords = keywords || meta.keywords || 'trading journal, forex, futures, stocks';
    const finalImage = image || meta.image || 'https://www.freetradejournal.com/og-image.png';
    const canonicalUrl = `https://www.freetradejournal.com${currentPath === '/' ? '/' : currentPath}`;

    const noindexPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];
    const isNoindex = noindexPaths.includes(currentPath);

    // Update document title
    document.title = finalTitle;

    // Update meta tags
    updateMetaTag('robots', isNoindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateMetaTag('googlebot', isNoindex ? 'noindex, follow' : 'index, follow');
    updateMetaTag('description', finalDescription);
    updateMetaTag('keywords', finalKeywords);

    // Update Open Graph tags
    updateMetaTag('og:title', finalTitle, 'property');
    updateMetaTag('og:description', finalDescription, 'property');
    updateMetaTag('og:image', finalImage, 'property');
    updateMetaTag('og:url', canonicalUrl, 'property');

    // Update Open Graph image alt
    const imageAlt = 'FreeTradeJournal dashboard showing trading analytics and performance metrics';
    updateMetaTag('og:image:alt', imageAlt, 'property');

    // Update Twitter tags
    updateMetaTag('twitter:title', finalTitle);
    updateMetaTag('twitter:description', finalDescription);
    updateMetaTag('twitter:image', finalImage);
    updateMetaTag('twitter:image:alt', imageAlt);
    updateMetaTag('twitter:url', canonicalUrl);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

  }, [currentPath, title, description, keywords, image]);
  
  return null;
}

function updateMetaTag(name: string, content: string, attribute: string = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}