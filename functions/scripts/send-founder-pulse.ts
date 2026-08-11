/**
 * Founder pulse — private weekly stats email to Richy ONLY. Never sent to
 * users. Pulls the last 7 full days (vs the 7 before) from PostHog, filtered
 * to in-app routes so landing-page bot blasts don't inflate anything, plus
 * the total account count from Firebase Auth.
 *
 * Usage (run from functions/ directory):
 *   npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-founder-pulse.ts
 */

import * as admin from 'firebase-admin'
import { Resend } from 'resend'
import * as React from 'react'
import { render } from '@react-email/components'
import { FounderPulseEmail, RankedRow } from '../src/emails/FounderPulseEmail'
import * as path from 'path'
import * as fs from 'fs'

// ── Load functions/.env for local runs (only fills unset vars) ─
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}

const TO = 'Richmondlamptey75@gmail.com'
const FROM = 'FreeTradeJournal Pulse <richy@freetradejournal.com>'

const POSTHOG_HOST = 'https://eu.posthog.com'
const POSTHOG_PROJECT = '155164'
const POSTHOG_KEY = process.env.POSTHOG_PERSONAL_KEY || process.env.POSTHOG_PERSONAL_API_KEY
if (!POSTHOG_KEY) throw new Error('POSTHOG_PERSONAL_KEY env var is required')

const RESEND_API_KEY = process.env.RESEND_API_KEY
if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY env var is required')

// In-app routes only — the landing page gets scraper/scanner blasts with
// rotating anonymous IDs that would wreck every number in this email.
const APP_ROUTES = `properties.$pathname IN ('/dashboard','/trades','/journal','/analytics','/goals','/settings','/proptracker','/prop-tracker','/ai-coach','/coach','/notes','/accounts','/import','/calculator','/ideas','/profile')`

// PostHog's query API rate-limits concurrent queries now and then — one
// retry with a pause is enough in practice for this batch of ten.
async function hogql(query: string, attempt = 1): Promise<any[][]> {
  const res = await fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${POSTHOG_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  })
  const json: any = await res.json().catch(() => ({}))
  if (!res.ok || json.error) {
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 15_000 * attempt))
      return hogql(query, attempt + 1)
    }
    throw new Error(`PostHog query failed after ${attempt} attempts: ${json.error || res.status}`)
  }
  return json.results || []
}

// ── Window: last 7 full UTC days, vs the 7 before ─────────
function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}
const todayUtc = new Date()
todayUtc.setUTCHours(0, 0, 0, 0)
const winEnd = isoDay(todayUtc)                                        // exclusive
const winStart = isoDay(new Date(todayUtc.getTime() - 7 * 86400_000))  // inclusive
const prevStart = isoDay(new Date(todayUtc.getTime() - 14 * 86400_000))
const CUR = `timestamp >= toDateTime('${winStart} 00:00:00') AND timestamp < toDateTime('${winEnd} 00:00:00')`
const PREV = `timestamp >= toDateTime('${prevStart} 00:00:00') AND timestamp < toDateTime('${winStart} 00:00:00')`

function weekLabel(): string {
  const fmt = (s: string) => {
    const d = new Date(`${s}T00:00:00Z`)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  }
  const lastDay = isoDay(new Date(todayUtc.getTime() - 86400_000))
  return `${fmt(winStart)} to ${fmt(lastDay)}, ${todayUtc.getUTCFullYear()}`
}

function pctDelta(cur: number, prev: number): number | null {
  if (!prev) return null
  return ((cur - prev) / prev) * 100
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
function countryName(code: string): string {
  if (!code || code === 'None') return 'Unknown'
  try { return regionNames.of(code) || code } catch { return code }
}

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/trades': 'Trade log',
  '/journal': 'Journal',
  '/analytics': 'Analytics',
  '/goals': 'Goals',
  '/settings': 'Settings',
  '/proptracker': 'Prop tracker',
  '/prop-tracker': 'Prop tracker',
  '/ai-coach': 'AI coach',
  '/coach': 'AI coach',
  '/notes': 'Notes',
  '/accounts': 'Accounts',
  '/import': 'CSV import',
  '/calculator': 'Position calculator',
  '/ideas': 'Trade ideas',
  '/profile': 'Profile',
}

// UTC hour → trading-session description (summer offsets; close enough
// year-round for a one-line label).
function sessionLabel(hourUtc: number): string {
  if (hourUtc >= 13 && hourUtc < 16) return 'the London/New York overlap'
  if (hourUtc >= 7 && hourUtc < 13) return 'the London session'
  if (hourUtc >= 16 && hourUtc < 21) return 'the New York session'
  return 'the Asia-Pacific session'
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

async function main() {
  console.log(`Founder pulse for ${winStart} → ${winEnd} (prev: ${prevStart})`)

  // Peak 5-min concurrency on app routes. The country-diversity guard keeps
  // a single-source blast (referral farm, one community stampede) from
  // claiming the headline number: multi-country wins, and a single-country
  // bucket only counts while it is small enough to be believable.
  const [peakRows, activeCur, activePrev, signupsCur, signupsPrev, countryRows, countryPrevRows, dayRows, hourRows, pageRows] = await Promise.all([
    hogql(`SELECT toStartOfInterval(toTimeZone(timestamp,'UTC'), INTERVAL 5 minute) AS t, count(DISTINCT distinct_id) AS users, count(DISTINCT properties.$geoip_country_code) AS countries FROM events WHERE ${CUR} AND ${APP_ROUTES} GROUP BY t HAVING countries >= 2 OR users <= 12 ORDER BY users DESC, t ASC LIMIT 1`),
    hogql(`SELECT count(DISTINCT distinct_id) FROM events WHERE ${CUR} AND ${APP_ROUTES}`),
    hogql(`SELECT count(DISTINCT distinct_id) FROM events WHERE ${PREV} AND ${APP_ROUTES}`),
    hogql(`SELECT count() FROM events WHERE ${CUR} AND event = 'user signed up'`),
    hogql(`SELECT count() FROM events WHERE ${PREV} AND event = 'user signed up'`),
    hogql(`SELECT properties.$geoip_country_code AS c, count(DISTINCT distinct_id) AS u FROM events WHERE ${CUR} AND ${APP_ROUTES} GROUP BY c ORDER BY u DESC`),
    hogql(`SELECT count(DISTINCT properties.$geoip_country_code) FROM events WHERE ${PREV} AND ${APP_ROUTES}`),
    hogql(`SELECT toDayOfWeek(toTimeZone(timestamp,'UTC')) AS d, count(DISTINCT distinct_id) AS u FROM events WHERE ${CUR} AND ${APP_ROUTES} GROUP BY d ORDER BY u DESC LIMIT 1`),
    hogql(`SELECT toHour(toTimeZone(timestamp,'UTC')) AS h, count(DISTINCT distinct_id) AS u FROM events WHERE ${CUR} AND ${APP_ROUTES} GROUP BY h ORDER BY u DESC LIMIT 1`),
    hogql(`SELECT properties.$pathname AS p, count(DISTINCT distinct_id) AS u FROM events WHERE ${CUR} AND ${APP_ROUTES} GROUP BY p ORDER BY u DESC LIMIT 5`),
  ])

  // Total accounts from Firebase Auth
  const serviceAccountPath = path.resolve(__dirname, '../service-account.json')
  admin.initializeApp({ credential: admin.credential.cert(serviceAccountPath as admin.ServiceAccount) })
  let totalAccounts = 0
  let pageToken: string | undefined
  do {
    const page = await admin.auth().listUsers(1000, pageToken)
    totalAccounts += page.users.length
    pageToken = page.pageToken
  } while (pageToken)

  const peak = peakRows[0]
  const peakDate = peak ? new Date(peak[0]) : null
  const peakWhen = peakDate
    ? `on ${peakDate.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' })} at ${peakDate.toISOString().slice(11, 16)} UTC`
    : 'not reached this week'

  const countries = countryRows.filter(r => r[0] && r[0] !== 'None')
  const topCountryUsers = Number(countries[0]?.[1] || 1)
  const topCountries: RankedRow[] = countries.slice(0, 5).map(r => ({
    label: countryName(String(r[0])),
    value: `${r[1]} ${Number(r[1]) === 1 ? 'trader' : 'traders'}`,
    share: Number(r[1]) / topCountryUsers,
  }))

  const topPageUsers = Number(pageRows[0]?.[1] || 1)
  const topPages: RankedRow[] = pageRows.map(r => ({
    label: PAGE_LABELS[String(r[0])] || String(r[0]),
    value: `${r[1]} ${Number(r[1]) === 1 ? 'user' : 'users'}`,
    share: Number(r[1]) / topPageUsers,
  }))

  const busiestHourNum = hourRows[0] ? Number(hourRows[0][0]) : 14
  const props = {
    weekLabel: weekLabel(),
    peakOnline: peak ? Number(peak[1]) : 0,
    peakOnlineWhen: peakWhen,
    peakOnlineCountries: peak ? Number(peak[2]) : 0,
    activeUsers: Number(activeCur[0]?.[0] || 0),
    activeUsersDeltaPct: pctDelta(Number(activeCur[0]?.[0] || 0), Number(activePrev[0]?.[0] || 0)),
    signups: Number(signupsCur[0]?.[0] || 0),
    signupsDeltaPct: pctDelta(Number(signupsCur[0]?.[0] || 0), Number(signupsPrev[0]?.[0] || 0)),
    totalAccounts,
    countriesCount: countries.length,
    countriesPrev: Number(countryPrevRows[0]?.[0] || 0),
    topCountries,
    busiestDay: DAY_NAMES[Number(dayRows[0]?.[0] || 1)],
    busiestHour: `${String(busiestHourNum).padStart(2, '0')}:00 to ${String((busiestHourNum + 1) % 24).padStart(2, '0')}:00 UTC`,
    busiestSession: sessionLabel(busiestHourNum),
    topPages,
  }

  console.log(JSON.stringify(props, null, 2))

  const html = await render(React.createElement(FounderPulseEmail, props))
  const resend = new Resend(RESEND_API_KEY)
  const result = await resend.emails.send({
    from: FROM,
    to: TO,
    subject: `Pulse: peak ${props.peakOnline} online, ${props.countriesCount} countries, ${props.signups} signups`,
    html,
  })
  if (result.error) {
    console.error('Send failed:', result.error)
    process.exit(1)
  }
  console.log(`Sent to ${TO}`)
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
