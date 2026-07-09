import type { PricingPlan } from '@/types/subscription';

// Max journal entries a free (non-Pro) account can create. Existing entries are
// never deleted — users already over the cap keep and can edit them; only
// creating NEW entries past the cap is blocked. Pro is unlimited.
export const FREE_JOURNAL_ENTRY_LIMIT = 20;

// Free accounts see dashboard analytics computed over this trailing window
// only; the trade log itself stays complete (data export is always free).
// Pro removes the window.
export const FREE_ANALYTICS_WINDOW_DAYS = 30;

// The values stored in Vercel have been observed with trailing newlines, which
// Stripe rejects as invalid price IDs — always trim.
const envPriceId = (value: string | undefined) => (value || '').trim();

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Monthly',
    interval: 'monthly',
    price: 12.99,
    priceId: envPriceId(import.meta.env.VITE_STRIPE_PRICE_MONTHLY),
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
    price: 99.99,
    priceId: envPriceId(import.meta.env.VITE_STRIPE_PRICE_YEARLY),
    features: [
      'Everything in Free',
      'PropTracker — unlimited accounts',
      'Advanced analytics',
      'AI trade insights',
      'Unlimited trade exports',
      'Priority support',
      'Save 36% vs monthly',
    ],
  },
  {
    name: 'Lifetime',
    interval: 'lifetime',
    price: 249,
    priceId: envPriceId(import.meta.env.VITE_STRIPE_PRICE_LIFETIME),
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
  'Dashboard analytics — last 30 days',
  'Trade journal — up to 20 entries',
  'Goals & risk management',
  'Up to 2 trading accounts',
  'CSV/Excel import & export',
  'Calendar heatmap',
  'Dark mode & themes',
];

export const PRO_FEATURES = [
  'Full analytics history',
  'Unlimited journal entries',
  'Unlimited trading accounts',
  'PropTracker — unlimited prop accounts',
  'Advanced analytics & charts',
  'Coach FTJ & AI risk alerts',
  'AI trade review & strategy tagger',
  'Cloud sync across devices',
  'Unlimited data exports',
  'Priority email support',
  'Early access to new features',
];
