// Single source of truth for every claim made in email copy.
// If pricing, limits, or the trial change, update HERE and the client
// mirror in src/constants/pricing.ts — nowhere else.

export const PRICE_MONTHLY = '$12.99/month'
export const PRICE_YEARLY = '$99.99/year'
// Retired 7 Aug 2026 — referenced only by the archived lifetime-campaign
// emails. Do not use in any email that still gets sent.
export const PRICE_LIFETIME = '$249 lifetime'
export const TRIAL_DAYS = 14
// Since 18 Aug 2026 (v2.82.0): coaching runs the user asks for. Automatic
// tips, journal prompts and risk alerts are free and not counted.
export const FREE_AI_COACHING_RUNS_PER_MONTH = 5

export const BASE_URL = 'https://www.freetradejournal.com'

export const URLS = {
  dashboard: `${BASE_URL}/dashboard`,
  trades: `${BASE_URL}/trades`,
  coach: `${BASE_URL}/coach`,
  pricing: `${BASE_URL}/pricing`,
  settings: `${BASE_URL}/settings`,
  subscription: `${BASE_URL}/settings?tab=subscription`,
  feedbackFromDigest: `${BASE_URL}/dashboard?feedback=digest`,
  feedbackFromAugustUpdate: `${BASE_URL}/dashboard?feedback=august-update`,
  privacy: `${BASE_URL}/privacy`,
  terms: `${BASE_URL}/terms`,
  logo: `${BASE_URL}/favicon-64x64.png`,
}

// One line, used wherever we state what Pro costs. Keeps every email consistent.
export const PRICING_LINE = `Pro is ${PRICE_MONTHLY} or ${PRICE_YEARLY} — with a ${TRIAL_DAYS}-day free trial. Cancel anytime.`
