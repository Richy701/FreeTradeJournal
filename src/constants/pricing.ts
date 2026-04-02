import type { PricingPlan } from '@/types/subscription';

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Monthly',
    interval: 'monthly',
    price: 5.99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || '',
    features: [
      'Everything in Free',
      'PropTracker — unlimited accounts',
      'Advanced analytics',
      'AI trade insights',
      'Unlimited trade exports',
      'Priority support',
    ],
  },
  {
    name: 'Yearly',
    interval: 'yearly',
    price: 49.99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY || '',
    features: [
      'Everything in Free',
      'PropTracker — unlimited accounts',
      'Advanced analytics',
      'AI trade insights',
      'Unlimited trade exports',
      'Priority support',
      'Save 30% vs monthly',
    ],
  },
  {
    name: 'Lifetime',
    interval: 'lifetime',
    price: 149.99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_LIFETIME || '',
    features: [
      'Everything in Free',
      'PropTracker — unlimited accounts',
      'Advanced analytics',
      'AI trade insights',
      'Unlimited trade exports',
      'Priority support',
      'One-time payment, forever',
    ],
  },
];

export const FREE_FEATURES = [
  'Unlimited trades',
  'Dashboard analytics',
  'Trade journal',
  'Goals & risk management',
  'Multi-account support',
  'CSV/Excel import & export',
  'Calendar heatmap',
  'Dark mode & themes',
];

export const PRO_FEATURES = [
  'PropTracker — unlimited prop accounts',
  'Advanced analytics & charts',
  'AI Trading Coach & risk alerts',
  'AI trade review & strategy tagger',
  'Cloud sync across devices',
  'Unlimited data exports',
  'Priority email support',
  'Early access to new features',
];
