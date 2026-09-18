/**
 * One-off catch-up for the onboarding emails that never sent (the Resend
 * automations failed every send from June until Sep 17 2026). Approved by
 * Richy on Sep 17 2026 for exactly two groups, using the existing emails
 * unchanged:
 *
 *   A  Day 14 "What's included in Pro"  → logged a trade, not Pro, active in
 *      the last 30 days, past their day-14 slot, joined after Aug 17 2026 (so
 *      they saw none of the August campaigns).
 *   B  "How to add your first trade"    → no trade yet, signed up in the last
 *      14 days but before the repaired sequence could reach them.
 *
 * Skips opted-out, throttled and address-less users. Stamps the same
 * sent-at fields and idempotency keys as the scheduled functions
 * (day14UpgradeSentAt / day3NudgeSentAt), so nobody can get either email
 * twice from here, from the bridge, or from a re-run.
 *
 * Usage (run from functions/ directory):
 *   DRY_RUN=true  npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-onboarding-catchup.ts
 *   DRY_RUN=false npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-onboarding-catchup.ts
 */

import * as admin from 'firebase-admin'
import { Resend } from 'resend'
import * as React from 'react'
import * as crypto from 'crypto'
import { render } from '@react-email/components'
import { Day14UpgradeEmail } from '../src/emails/Day14UpgradeEmail'
import { Day3NudgeEmail } from '../src/emails/Day3NudgeEmail'
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

const DRY_RUN = process.env.DRY_RUN !== 'false'
const FROM = 'FreeTradeJournal <hello@freetradejournal.com>'
const PROJECT_ID = 'tradevault-41c68'
const DAY = 86400000

// Signups after this reach the repaired Activation Sequence on their own.
const SEQUENCE_REPAIRED_AT = Date.parse('2026-09-16T14:24:00Z')
// Group A only: joined after the last general August campaign.
const JOINED_AFTER = Date.parse('2026-08-17T00:00:00Z')

admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(__dirname, '../service-account.json'))) })
const db = admin.firestore()

const millis = (v: any): number => (!v ? 0 : typeof v.toMillis === 'function' ? v.toMillis() : new Date(v).getTime())
const isEntitledPro = (d: FirebaseFirestore.DocumentData): boolean =>
  !!d.isPro || d.role === 'dev' ||
  [d.trialProExpiresAt, d.referralProExpiresAt].some((v) => typeof v === 'string' && new Date(v).getTime() > Date.now())

// Same token + URL the deployed `unsubscribe` function verifies.
function unsubscribeUrl(uid: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET is not configured (functions/.env)')
  const token = crypto.createHmac('sha256', secret).update(uid).digest('hex')
  return `https://us-central1-${PROJECT_ID}.cloudfunctions.net/unsubscribe?uid=${uid}&token=${token}`
}

interface Target { uid: string; email: string; firstName: string; group: 'A' | 'B' }

async function main() {
  console.log(`\n${DRY_RUN ? 'DRY RUN: no emails will be sent' : 'LIVE SEND'}\n`)
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing (functions/.env)')
  unsubscribeUrl('preflight') // fail before sending anything if the secret is missing

  const now = Date.now()
  const snap = await db.collection('users').get()
  const targets: Target[] = []
  for (const doc of snap.docs) {
    const d = doc.data()
    if (d.emailOptOut || d.signupThrottled || !d.email) continue
    const created = millis(d.createdAt)
    if (!created) continue
    const age = (now - created) / DAY
    const firstName = String(d.displayName || '').trim().split(' ')[0]
    if (d.firstTradeLoggedAt && !isEntitledPro(d) && age > 15 && created > JOINED_AFTER &&
        !d.day14UpgradeSentAt && now - millis(d.lastActiveAt) < 30 * DAY) {
      targets.push({ uid: doc.id, email: d.email, firstName, group: 'A' })
    } else if (!d.firstTradeLoggedAt && age <= 14 && created < SEQUENCE_REPAIRED_AT && !d.day3NudgeSentAt) {
      targets.push({ uid: doc.id, email: d.email, firstName, group: 'B' })
    }
  }
  const count = (g: 'A' | 'B') => targets.filter((t) => t.group === g).length
  console.log(`Group A (Day 14 Pro email):   ${count('A')}`)
  console.log(`Group B (first-trade email):  ${count('B')}`)
  console.log(`With a first name: ${targets.filter((t) => t.firstName).length} / ${targets.length}`)

  if (DRY_RUN) {
    console.log('\nDry run complete. Run with DRY_RUN=false to send for real.')
    process.exit(0)
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  const failures: string[] = []
  for (const t of targets) {
    const url = unsubscribeUrl(t.uid)
    const isA = t.group === 'A'
    try {
      const html = await render(isA
        ? React.createElement(Day14UpgradeEmail, { firstName: t.firstName, unsubscribeUrl: url })
        : React.createElement(Day3NudgeEmail, { firstName: t.firstName, unsubscribeUrl: url }))
      const result = await resend.emails.send({
        from: FROM,
        to: t.email,
        subject: isA ? 'What’s included in FreeTradeJournal Pro' : 'How to add your first trade',
        html,
        headers: { 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      }, { idempotencyKey: `${isA ? 'day14' : 'day3'}/${t.uid}` })
      if (result.error) throw new Error(result.error.message)
      await db.collection('users').doc(t.uid).update({
        [isA ? 'day14UpgradeSentAt' : 'day3NudgeSentAt']: admin.firestore.FieldValue.serverTimestamp(),
        onboardingCatchupSentAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      sent++
      if (sent % 25 === 0) console.log(`  sent ${sent}/${targets.length}`)
    } catch (err: any) {
      failures.push(`${t.group} ${t.uid}: ${err.message}`)
    }
    await new Promise((r) => setTimeout(r, 600)) // Resend rate limit is 2 req/s
  }
  console.log(`\nDone. Sent ${sent}/${targets.length}. Failures: ${failures.length}`)
  for (const f of failures.slice(0, 20)) console.log('  ', f)
  process.exit(failures.length ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
