/**
 * Inactive-account retention policy (agreed with Richy, Sep 26 2026).
 *
 * Pure functions only: no Firestore, no Auth. The scheduled sweep in index.ts
 * and the read-only report in scripts/retention-report.ts both call these so
 * the report always predicts exactly what the sweep would do.
 *
 * Tiers
 *   protected  ever paid or opened checkout, an unexpired trial or referral
 *              Pro grant, cloud data or screenshots, dev role, velocity-guard
 *              (signupThrottled) signups. Never auto-deleted, never emailed.
 *   trader     free account that has logged at least one trade (or was
 *              created before the server tracked that, see TRADE_TRACKING_SINCE_MS). The journal
 *              lives on their device, encrypted with a key derived from the
 *              uid, so deleting the account locks it for good. 24 months of
 *              no sign-in, warned at 23 months and again 7 days before.
 *   empty      never logged a trade. 12 months, warned at 11 months and 7
 *              days before.
 *
 * "Last seen" is the latest of Firebase Auth's last sign-in, the server-side
 * lastActiveAt (only written since Aug 18 2026) and account creation. Any
 * sign-in after a warning cancels it.
 */

export const DAY_MS = 86_400_000

export const TRADER_DELETE_DAYS = 730
export const EMPTY_DELETE_DAYS = 365
export const FIRST_WARNING_DAYS_BEFORE = 30
export const FINAL_WARNING_DAYS_BEFORE = 7

export type RetentionTier = 'protected' | 'trader' | 'empty'

export interface RetentionInput {
  /** users/{uid} document data; undefined when the Auth account has no doc. */
  userData: Record<string, any> | undefined
  /** Firebase Auth metadata. */
  lastSignInMs: number
  creationMs: number
  /** users/{uid}/sync has at least one doc. */
  hasCloudData: boolean
  /** Storage has at least one object under users/{uid}/. */
  hasStorageFiles: boolean
}

/**
 * Activity from the Firebase Auth record. lastSignInTime only moves on a
 * fresh sign-in; a persistent web session that just refreshes its token
 * shows up in lastRefreshTime instead, so both count.
 */
export function authActivity(meta: { lastSignInTime?: string | null; lastRefreshTime?: string | null; creationTime?: string | null }) {
  const parse = (v?: string | null) => (v ? Date.parse(v) || 0 : 0)
  return {
    lastSignInMs: Math.max(parse(meta.lastSignInTime), parse(meta.lastRefreshTime)),
    creationMs: parse(meta.creationTime),
  }
}

export interface RetentionState {
  tier: RetentionTier
  /** Latest sign-in or activity in epoch ms. */
  lastSeenMs: number
  /** When the account becomes deletable; undefined for protected accounts. */
  deleteAtMs?: number
  /** Why the account is protected, for the report. */
  protectedBy?: string
}

/** Warning bookkeeping stored on users/{uid}.retention. */
export interface RetentionWarning {
  tier: RetentionTier
  /** lastSeenMs at the time the first warning went out. */
  lastSeenMs: number
  deleteAtMs: number
  firstWarnedAtMs: number
  finalWarnedAtMs?: number
}

export type RetentionAction =
  | { kind: 'none' }
  | { kind: 'clear' } // signed in since the warning, drop the warning
  | { kind: 'warn_first'; deleteAtMs: number }
  | { kind: 'warn_final'; deleteAtMs: number }
  | { kind: 'delete'; deleteAtMs: number }

export function toMillis(v: unknown): number {
  if (!v) return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (typeof v === 'string') {
    const t = Date.parse(v)
    return Number.isFinite(t) ? t : 0
  }
  if (typeof (v as any).toMillis === 'function') return (v as any).toMillis()
  if (v instanceof Date) return v.getTime()
  return 0
}

/**
 * The server only started recording first trades (markFirstTrade →
 * users/{uid}.firstTradeLoggedAt) on 2 Apr 2026 (919736b), and back-fills it
 * only when the user opens the dashboard again. An account created before
 * that with no stamp may well have a journal on its device, so it is treated
 * as a trader (the longer window) rather than empty.
 */
export const TRADE_TRACKING_SINCE_MS = Date.parse('2026-04-02T00:00:00Z')

export function hasLoggedTrade(d: Record<string, any> | undefined, creationMs: number): boolean {
  if (d?.firstTradeLoggedAt) return true
  return creationMs > 0 && creationMs < TRADE_TRACKING_SINCE_MS
}

/** Mirrors isEntitledPro in index.ts (not importable from here without a cycle). */
function activeGrant(d: Record<string, any> | undefined): boolean {
  return [d?.trialProExpiresAt, d?.referralProExpiresAt].some(
    (v) => typeof v === 'string' && new Date(v).getTime() > Date.now(),
  )
}

export function classifyAccount(input: RetentionInput): RetentionState {
  const d = input.userData
  const lastSeenMs = Math.max(
    input.lastSignInMs || 0,
    input.creationMs || 0,
    toMillis(d?.lastActiveAt),
    toMillis(d?.createdAt),
  )

  let protectedBy: string | undefined
  if (d?.role === 'dev') protectedBy = 'dev role'
  // Velocity-guard signups are junk addresses: never email them, and leave
  // deletion to a separate decision (nothing is deleted without notice).
  else if (d?.signupThrottled) protectedBy = 'signup throttled'
  else if (d?.isPro) protectedBy = 'pro'
  else if (activeGrant(d)) protectedBy = 'active trial or referral pro'
  else if (d?.subscription) protectedBy = 'subscription record'
  else if (typeof d?.stripeCustomerId === 'string' && d.stripeCustomerId) protectedBy = 'stripe customer'
  else if (input.hasCloudData) protectedBy = 'cloud data'
  else if (input.hasStorageFiles) protectedBy = 'screenshots'

  if (protectedBy) return { tier: 'protected', lastSeenMs, protectedBy }

  if (hasLoggedTrade(d, input.creationMs)) {
    return { tier: 'trader', lastSeenMs, deleteAtMs: lastSeenMs + TRADER_DELETE_DAYS * DAY_MS }
  }
  return { tier: 'empty', lastSeenMs, deleteAtMs: lastSeenMs + EMPTY_DELETE_DAYS * DAY_MS }
}

/**
 * Decide what the sweep should do for one account right now.
 *
 * Deletion needs all of: the deadline has passed, a first warning went out at
 * least FIRST_WARNING_DAYS_BEFORE ago, a final warning went out, and nobody
 * signed in since the first warning. If the account was never warned (for
 * example it crossed the deadline while the sweep was switched off), it gets
 * the first warning now and the deadline moves to 30 days from today, so
 * nobody is ever deleted without notice.
 */
export function decideAction(state: RetentionState, warning: RetentionWarning | undefined, nowMs: number): RetentionAction {
  if (state.tier === 'protected' || state.deleteAtMs === undefined) {
    return warning ? { kind: 'clear' } : { kind: 'none' }
  }

  if (warning) {
    // Any activity since the first warning cancels it.
    if (state.lastSeenMs > warning.lastSeenMs) return { kind: 'clear' }
    // Tier changed (e.g. they logged a trade offline and it synced later): restart.
    if (warning.tier !== state.tier) return { kind: 'clear' }

    const deleteAtMs = warning.deleteAtMs
    if (nowMs >= deleteAtMs) {
      const firstWarningAged = nowMs - warning.firstWarnedAtMs >= FIRST_WARNING_DAYS_BEFORE * DAY_MS
      if (firstWarningAged && warning.finalWarnedAtMs) return { kind: 'delete', deleteAtMs }
      // Deadline reached but the final warning never went out (the sweep
      // missed the 7-day window): send it now with a fresh date 7 days out,
      // which the sweep persists, so the email never names a past date.
      if (!warning.finalWarnedAtMs) return { kind: 'warn_final', deleteAtMs: nowMs + FINAL_WARNING_DAYS_BEFORE * DAY_MS }
      return { kind: 'none' }
    }
    if (!warning.finalWarnedAtMs && nowMs >= deleteAtMs - FINAL_WARNING_DAYS_BEFORE * DAY_MS) {
      return { kind: 'warn_final', deleteAtMs }
    }
    return { kind: 'none' }
  }

  // No warning yet.
  const firstWarningDue = state.deleteAtMs - FIRST_WARNING_DAYS_BEFORE * DAY_MS
  if (nowMs < firstWarningDue) return { kind: 'none' }
  // Never delete sooner than 30 days after the first warning, even if the
  // policy deadline is already in the past.
  const deleteAtMs = Math.max(state.deleteAtMs, nowMs + FIRST_WARNING_DAYS_BEFORE * DAY_MS)
  return { kind: 'warn_first', deleteAtMs }
}

export function parseWarning(raw: unknown): RetentionWarning | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, any>
  const tier = r.tier
  if (tier !== 'trader' && tier !== 'empty') return undefined
  const lastSeenMs = toMillis(r.lastSeenAt)
  const deleteAtMs = toMillis(r.deleteAt)
  const firstWarnedAtMs = toMillis(r.firstWarnedAt)
  if (!lastSeenMs || !deleteAtMs || !firstWarnedAtMs) return undefined
  const finalWarnedAtMs = toMillis(r.finalWarnedAt) || undefined
  return { tier, lastSeenMs, deleteAtMs, firstWarnedAtMs, finalWarnedAtMs }
}

export function formatDeleteDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
