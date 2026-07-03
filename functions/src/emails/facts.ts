// Single source of truth for every claim made in email copy.
// If pricing, limits, or the trial change, update HERE and the client
// mirror in src/constants/pricing.ts — nowhere else.

export const PRICE_MONTHLY = '$12.99/month'
export const PRICE_YEARLY = '$99.99/year'
export const PRICE_LIFETIME = '$249 lifetime'
export const TRIAL_DAYS = 14
export const FREE_AI_QUERIES_PER_MONTH = 20

export const BASE_URL = 'https://www.freetradejournal.com'

export const URLS = {
  dashboard: `${BASE_URL}/dashboard`,
  trades: `${BASE_URL}/trades`,
  coach: `${BASE_URL}/coach`,
  pricing: `${BASE_URL}/pricing`,
  settings: `${BASE_URL}/settings`,
  subscription: `${BASE_URL}/settings?tab=subscription`,
  privacy: `${BASE_URL}/privacy`,
  terms: `${BASE_URL}/terms`,
  logo: `${BASE_URL}/favicon-64x64.png`,
}

// One line, used wherever we state what Pro costs. Keeps every email consistent.
export const PRICING_LINE = `Pro is ${PRICE_MONTHLY}, ${PRICE_YEARLY}, or ${PRICE_LIFETIME} — with a ${TRIAL_DAYS}-day free trial on subscriptions. Cancel anytime.`
