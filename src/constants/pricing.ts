import type { PricingPlan } from '@/types/subscription';

export const ANALYSIS_UPGRADE_SOURCE = 'analysis_annual_v1';

// Max journal entries a free (non-Pro) account can create. Existing entries are
// never deleted — users already over the cap keep and can edit them; only
// creating NEW entries past the cap is blocked. Pro is unlimited.
export const FREE_JOURNAL_ENTRY_LIMIT = 20;

// Free accounts see dashboard analytics computed over this trailing window
// only; the trade log itself stays complete (data export is always free).
// Pro removes the window.
export const FREE_ANALYTICS_WINDOW_DAYS = 30;

// When the lifetime plan stops being sold. Matches the FOUNDER149 promotion
// code's expiry in Stripe — the founder banner and the pricing-page countdown
// both key off this so they disappear together.
export const LIFETIME_RETIRES_AT = Date.parse('2026-08-07T23:59:59Z');

// Founding lifetime price while FOUNDER149 is live. Checkout auto-applies the
// code server-side; the pricing card shows this with the list price struck
// through. The list price in PRICING_PLANS stays canonical.
export const FOUNDER_LIFETIME_PRICE = 149;

// Black Friday 2026: Mon 23 Nov to Mon 30 Nov 11:59 PM New York (EST, UTC-5).
// Mirror of the window in functions/src/index.ts createCheckoutSession, which
// auto-applies BFLIFETIME ($70 off) and BFYEARLY ($20 off the first year).
// Both Stripe codes expire at BLACK_FRIDAY_ENDS_AT.
export const BLACK_FRIDAY_STARTS_AT = Date.parse('2026-11-23T05:00:00Z');
export const BLACK_FRIDAY_ENDS_AT = Date.parse('2026-12-01T04:59:59Z');
export const BLACK_FRIDAY_LIFETIME_PRICE = 179;
export const BLACK_FRIDAY_YEARLY_PRICE = 79.99;
export const isBlackFriday = (now = Date.now()) =>
  now >= BLACK_FRIDAY_STARTS_AT && now <= BLACK_FRIDAY_ENDS_AT;

// True whenever a new lifetime purchase is allowed. Mirror of the guard in
// functions/src/index.ts createCheckoutSession. The earlier one-week returns
// (birthday week, Sep drop) are over and their code is gone.
export const isLifetimeOnSale = (now = Date.now()) =>
  now < LIFETIME_RETIRES_AT || isBlackFriday(now);

// When the current lifetime sale closes; feeds the pricing-page countdown.
export const lifetimeSaleEndsAt = (now = Date.now()) =>
  isBlackFriday(now) ? BLACK_FRIDAY_ENDS_AT : LIFETIME_RETIRES_AT;

// What the lifetime card charges right now (list price when no offer is on).
export const currentLifetimePrice = (now = Date.now()) =>
  isBlackFriday(now) ? BLACK_FRIDAY_LIFETIME_PRICE : now < LIFETIME_RETIRES_AT ? FOUNDER_LIFETIME_PRICE : 249;

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
      'PDF trade reports',
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
      'PDF trade reports',
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
      'PDF trade reports',
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
  'PDF trade reports',
  'Priority email support',
  'Early access to new features',
];

// Pricing page plan cards: the limit rows show the actual value on each plan.
// Prop account limit mirrors FREE_ACCOUNT_LIMIT in pages/PropTracker.tsx and
// the trading account limit mirrors FREE_TRADING_ACCOUNT_LIMIT in
// contexts/account-context.tsx — keep them in step. AI is worded, not
// numbered, because the free allowance is split across two quotas.
// Free card checklist: the free features that are not one of the limit rows.
export const PLAN_CARD_FREE_FEATURES = [
  'Unlimited trades',
  'Goals & risk management',
  'CSV/Excel import & export',
  'Calendar heatmap',
  'Dark mode & themes',
];

export const PLAN_LIMIT_ROWS: { feature: string; free: string; pro: string }[] = [
  { feature: 'Analytics history', free: `Last ${FREE_ANALYTICS_WINDOW_DAYS} days`, pro: 'Full history' },
  { feature: 'Journal entries', free: `Up to ${FREE_JOURNAL_ENTRY_LIMIT}`, pro: 'Unlimited' },
  { feature: 'Trading accounts', free: '2', pro: 'Unlimited' },
  { feature: 'Prop firm accounts', free: '1', pro: 'Unlimited' },
  { feature: 'AI queries', free: 'Monthly allowance', pro: 'Expanded' },
];

export const PLAN_PRO_ONLY_ROWS = [
  'Advanced analytics & charts',
  'Coach FTJ & AI risk alerts',
  'AI trade review & strategy tagger',
  'Cloud sync across devices',
  'PDF trade reports',
  'Priority email support',
  'Early access to new features',
];
