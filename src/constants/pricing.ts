import type { PricingPlan } from '@/types/subscription';

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

// FreeTradeJournal's first birthday (first commit 28 Aug 2025). Lifetime comes
// back for exactly one week at a birthday price, then goes again. Checkout
// auto-applies FTJBIRTHDAY server-side during the window; the Stripe code
// expires at the same instant so a stale tab cannot buy it late.
// Deliberately NOT tied to LIFETIME_RETIRES_AT, which also gates the no-card
// signup trial and the plan-changes notice — those must not reopen.
export const BIRTHDAY_LIFETIME_STARTS_AT = Date.parse('2026-08-28T00:00:00Z');
export const BIRTHDAY_LIFETIME_ENDS_AT = Date.parse('2026-09-04T23:59:59Z');
export const BIRTHDAY_LIFETIME_PRICE = 199;

export const isBirthdayLifetimeWindow = (now = Date.now()) =>
  now >= BIRTHDAY_LIFETIME_STARTS_AT && now <= BIRTHDAY_LIFETIME_ENDS_AT;

// True whenever a new lifetime purchase is allowed. Mirror of the guard in
// functions/src/index.ts createCheckoutSession.
export const isLifetimeOnSale = (now = Date.now()) =>
  now < LIFETIME_RETIRES_AT || isBirthdayLifetimeWindow(now);

// When the current lifetime sale closes — feeds the pricing-page countdown.
export const lifetimeSaleEndsAt = (now = Date.now()) =>
  now < LIFETIME_RETIRES_AT ? LIFETIME_RETIRES_AT : BIRTHDAY_LIFETIME_ENDS_AT;

// What the lifetime card charges right now (list price when no offer is on).
export const currentLifetimePrice = (now = Date.now()) =>
  now < LIFETIME_RETIRES_AT ? FOUNDER_LIFETIME_PRICE : isBirthdayLifetimeWindow(now) ? BIRTHDAY_LIFETIME_PRICE : 249;

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
