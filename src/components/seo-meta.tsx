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
    title: 'FreeTradeJournal - Free Trading Journal for Forex, Futures & Stock Traders',
    description: 'Free professional trading journal. Track trades, analyze performance metrics, manage risk. Features include P&L tracking, calendar heatmaps, and AI insights. 100% free forever.',
    keywords: 'free trading journal, forex trading journal, futures trading tracker, stock trading log, prop firm dashboard, day trading journal, swing trading tracker, MetaTrader journal, trading diary, trade performance tracker, forex trade log, trading analytics, prop firm journal, trading psychology tracker',
    image: 'https://freetradejournal.com/og-image.webp'
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
    title: 'Documentation | FreeTradeJournal - Trading Journal Guide & Help',
    description: 'Complete guide to using FreeTradeJournal. Learn how to track trades, import CSV data, analyze performance, and improve trading results.',
    keywords: 'trading journal guide, documentation, help, CSV import, trade tracking tutorial'
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
    const finalImage = image || meta.image || 'https://freetradejournal.com/og-image.webp';
    
    // Update document title
    document.title = finalTitle;
    
    // Update meta tags
    updateMetaTag('description', finalDescription);
    updateMetaTag('keywords', finalKeywords);
    
    // Update Open Graph tags
    updateMetaTag('og:title', finalTitle, 'property');
    updateMetaTag('og:description', finalDescription, 'property');
    updateMetaTag('og:image', finalImage, 'property');
    updateMetaTag('og:url', `https://freetradejournal.com${currentPath}`, 'property');
    
    // Update Twitter tags
    updateMetaTag('twitter:title', finalTitle);
    updateMetaTag('twitter:description', finalDescription);
    updateMetaTag('twitter:image', finalImage);
    
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