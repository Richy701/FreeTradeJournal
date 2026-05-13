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
    title: 'Free Trading Journal for Forex, Futures & Stocks | FreeTradeJournal',
    description: 'Log trades, track P&L, and spot patterns with a free trading journal built for forex, futures, and stock traders. AI coaching, analytics dashboards, and CSV import included. No credit card required.',
    keywords: 'free trading journal, forex trading journal, futures trading tracker, stock trading log, prop firm dashboard, day trading journal, swing trading tracker, MetaTrader journal, trading diary, trade performance tracker, forex trade log, trading analytics, prop firm journal, trading psychology tracker, AI trading coach, AI trade analysis, AI risk alerts',
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
    title: 'Pricing | Free Forever + Pro Plans | FreeTradeJournal',
    description: 'Free forever with unlimited trades, analytics, and CSV import. Upgrade to Pro for AI coaching, cloud sync, and advanced exports. Plans from $5.99/mo.',
    keywords: 'trading journal pricing, free trading journal, pro trading tools, AI trading coach, trading analytics subscription, trade analysis pricing'
  },
  '/forex-trading-journal': {
    title: 'Free Forex Trading Journal | Track FX Pairs & Pips',
    description: 'Track every forex trade, analyze pip performance by pair, and manage risk with built-in position sizing. Works with MT4/MT5 CSV exports. 100% free, no sign-up wall.',
    keywords: 'forex trading journal, free forex trading journal, FX trading tracker, currency trading log, forex performance tracker, pip counter, forex P&L tracker, MT4 journal, MT5 trading journal, forex risk management, currency pair analysis, forex win rate, FX trading diary, forex trade log, EURUSD tracker, GBPUSD journal, forex position sizing, pip calculator journal, forex drawdown tracker'
  },
  '/futures-trading-tracker': {
    title: 'Free Futures Trading Tracker | ES, NQ, CL & GC Journal',
    description: 'Log ES, NQ, CL, and GC futures trades with tick-level P&L tracking, risk analytics, and performance charts. Import from any broker CSV. 100% free.',
    keywords: 'futures trading tracker, free futures trading journal, futures journal, ES trading journal, NQ trading tracker, crude oil futures log, gold futures tracker, futures P&L tracker, futures risk management, tick counter, futures margin calculator, E-mini journal, micro futures tracker, futures performance analytics, futures trade log, CME futures journal, futures position tracker, commodity trading journal, index futures tracker'
  },
  '/prop-firm-dashboard': {
    title: 'Free Prop Firm Dashboard | FTMO, Apex & TopStep Tracker',
    description: 'Track evaluation progress, drawdown limits, and daily loss caps across FTMO, Apex, TopStep, and more. Built for funded and challenge accounts. 100% free.',
    keywords: 'prop firm dashboard, free prop firm dashboard, prop trading dashboard, FTMO journal, Apex trader journal, TopStep tracker, funded trader journal, prop firm tracker, evaluation account tracker, drawdown management, daily loss limit tracker, prop trading journal, funded account dashboard, FTMO tracker, MFF journal, E8 funding tracker, prop firm analytics, challenge tracker, verification tracker, funded trader dashboard'
  },
  '/prop-tracker': {
    title: 'PropTracker - Free Prop Firm Fee & Payout Tracker | FreeTradeJournal',
    description: 'Track every prop firm fee, reset, payout and net P&L across all your accounts — free. PropTracker shows your true profit after every cost. Works with FTMO, Apex, TopStep, MyFundedFX and 10+ firms. No credit card required.',
    keywords: 'prop firm fee tracker, prop firm payout tracker, prop trading cost calculator, FTMO fee tracker, Apex trader payout tracker, TopStep fee calculator, funded trader expense tracker, prop firm net profit, prop firm account tracker, prop firm P&L tracker, prop trading ROI calculator, funded trader cost tracker, prop firm reset fee tracker, evaluation fee tracker, prop firm profit calculator, prop firm expense tracker',
    image: 'https://www.freetradejournal.com/images/screenshots/prop-tracker-screenshot.png'
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