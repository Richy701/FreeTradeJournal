/**
 * August update roundup — trade form refresh, all-accounts view, Goals & Risk rebuild
 *  (v2.78 – v2.80, shipped 14–17 Aug 2026). Goes to EVERYONE incl. Pro/lifetime — it's
 * product news, not a sales pitch, and the email says "free on every plan".
 * One-off campaign; dedup field: augustUpdateSentAt. Replaces the narrower
 * all-accounts-only send that was armed for the same Monday slot.
 *
 * Usage (run from functions/ directory):
 *   TEST_TO=you@example.com npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-august-update.ts
 *   DRY_RUN=true  npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-august-update.ts
 *   DRY_RUN=false npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-august-update.ts
 */

import * as admin from 'firebase-admin'
import { Resend } from 'resend'
import * as React from 'react'
import * as crypto from 'crypto'
import { render } from '@react-email/components'
import { AugustUpdateEmail } from '../src/emails/AugustUpdateEmail'
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

// ── Config ────────────────────────────────────────────────
const DRY_RUN = process.env.DRY_RUN !== 'false'
const TEST_TO = process.env.TEST_TO || ''
const MAX_SENDS = process.env.MAX_SENDS ? parseInt(process.env.MAX_SENDS, 10) : Number.MAX_SAFE_INTEGER
const FROM = 'Richy at FreeTradeJournal <richy@freetradejournal.com>'
const SUBJECT = 'August update: faster trade logging, one view of all accounts, new Goals & Risk'
const DEDUP_FIELD = 'augustUpdateSentAt'

// Owner + known test/fake accounts
const SKIP_EMAILS = new Set([
  'richyturnitup@gmail.com',
  'richmondlamptey75@gmail.com',
  'richmondolletey@gmail.com',
  'asdasd@asdasdad.com',
  'johndoe@gmail.com',
  'jidem94714@mogash.com',
  'dhshsja@gmail.con',
])

// ── Email validation (same lists as send-trial-open) ──────
const TYPO_DOMAINS = new Set([
  'gamil.com', 'gmal.com', 'gmali.com', 'gmaill.com', 'gmial.com',
  'yahooo.com', 'yaho.com', 'yahho.com', 'yhoo.com',
  'hotmai.com', 'hotmial.com', 'hotmali.com',
  'outlok.com', 'outloo.com',
])

const DISPOSABLE_DOMAINS = new Set([
  'mogash.com', 'passinbox.com', 'mailinator.com', 'guerrillamail.com',
  'tempmail.com', 'throwam.com', 'trashmail.com', 'sharklasers.com',
  'spam4.me', 'yopmail.com', 'maildrop.cc', 'dispostable.com',
  'fakeinbox.com', 'getairmail.com',
])

const BAD_TLDS = new Set(['con', 'cds', 'cpm', 'ocm', 'comd', 'vom', 'cmo'])

function isBadEmail(email: string): string | null {
  if (!email.includes('@')) return 'missing @'
  const parts = email.split('@')
  if (parts.length !== 2) return 'invalid format'
  const [local, domain] = parts
  if (!local || !domain || !domain.includes('.')) return 'invalid format'
  const tld = domain.split('.').pop()!.toLowerCase()
  if (BAD_TLDS.has(tld)) return `bad TLD (.${tld})`
  if (TYPO_DOMAINS.has(domain.toLowerCase())) return `typo domain (${domain})`
  if (DISPOSABLE_DOMAINS.has(domain.toLowerCase())) return `disposable (${domain})`
  return null
}

// ── Unsubscribe URL (same HMAC as the unsubscribe CF) ─────
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET
const UNSUB_PROJECT = 'tradevault-41c68'
function getUnsubscribeUrl(uid: string): string {
  if (!UNSUBSCRIBE_SECRET) throw new Error('UNSUBSCRIBE_SECRET is not configured')
  const token = crypto.createHmac('sha256', UNSUBSCRIBE_SECRET).update(uid).digest('hex')
  return `https://us-central1-${UNSUB_PROJECT}.cloudfunctions.net/unsubscribe?uid=${uid}&token=${token}`
}

// ── Init Resend ───────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY
if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY env var is required')
const resend = new Resend(RESEND_API_KEY)

// ── Test mode: render + send one copy, touch nothing ──────
async function sendTest() {
  const html = await render(
    React.createElement(AugustUpdateEmail, {
      firstName: 'Richy',
      unsubscribeUrl: 'https://example.com/unsubscribe-preview',
    })
  )
  const result = await resend.emails.send({
    from: FROM,
    to: TEST_TO,
    subject: `[TEST] ${SUBJECT}`,
    html,
  })
  console.log(result.error ? `FAIL: ${JSON.stringify(result.error)}` : `Test sent to ${TEST_TO}`)
  process.exit(result.error ? 1 : 0)
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  if (TEST_TO) return sendTest()

  const serviceAccountPath = path.resolve(__dirname, '../service-account.json')
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('service-account.json not found at', serviceAccountPath)
    process.exit(1)
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath as admin.ServiceAccount),
  })
  const db = admin.firestore()
  const auth = admin.auth()

  console.log(`\n${DRY_RUN ? 'DRY RUN — no emails will be sent' : 'LIVE SEND'}\n`)

  // Firestore-side exclusions: opted out, velocity-flagged, already sent.
  // Pro/trialing users are deliberately IN — this is product news for everyone.
  const userDocs = new Map<string, FirebaseFirestore.DocumentData>()
  const usersSnap = await db.collection('users').select('emailOptOut', 'signupThrottled', DEDUP_FIELD).get()
  for (const doc of usersSnap.docs) userDocs.set(doc.id, doc.data())

  // List ALL Auth users (paginated — the list is past 2,500 now)
  const allUsers: admin.auth.UserRecord[] = []
  let pageToken: string | undefined
  do {
    const page = await auth.listUsers(1000, pageToken)
    allUsers.push(...page.users)
    pageToken = page.pageToken
  } while (pageToken)
  console.log(`Total Auth users: ${allUsers.length}`)

  const candidates: { uid: string; email: string; name: string }[] = []
  const rejected: { email: string; reason: string }[] = []
  let skippedOptOut = 0, skippedThrottled = 0, skippedSent = 0

  for (const user of allUsers) {
    if (!user.email) continue
    if (SKIP_EMAILS.has(user.email.toLowerCase())) continue

    const d = userDocs.get(user.uid)
    if (d?.emailOptOut) { skippedOptOut++; continue }
    if (d?.signupThrottled) { skippedThrottled++; continue }
    if (d?.[DEDUP_FIELD]) { skippedSent++; continue }

    const badReason = isBadEmail(user.email)
    if (badReason) {
      rejected.push({ email: user.email, reason: badReason })
      continue
    }

    const name = (user.displayName || '').split(' ')[0] || ''
    candidates.push({ uid: user.uid, email: user.email, name })

    if (candidates.length >= MAX_SENDS) break
  }

  console.log(`Skipped: ${skippedOptOut} opted out, ${skippedThrottled} throttled, ${skippedSent} already sent, ${rejected.length} bad addresses`)
  console.log(`Send cap this run: ${MAX_SENDS === Number.MAX_SAFE_INTEGER ? 'uncapped' : MAX_SENDS}`)
  console.log(`\nTargeting ${candidates.length} users (everyone incl. Pro)`)

  if (DRY_RUN) {
    candidates.slice(0, 20).forEach((c, i) => {
      console.log(`  ${String(i + 1).padStart(2)}. ${c.email}${c.name ? ` (${c.name})` : ''}`)
    })
    if (candidates.length > 20) console.log(`  … and ${candidates.length - 20} more`)
    console.log('\nDry run complete. Run with DRY_RUN=false to send for real.')
    process.exit(0)
  }

  console.log('\nSending...\n')

  let sent = 0
  let failed = 0

  for (const user of candidates) {
    try {
      const html = await render(
        React.createElement(AugustUpdateEmail, {
          firstName: user.name,
          unsubscribeUrl: getUnsubscribeUrl(user.uid),
        })
      )

      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: SUBJECT,
        html,
        headers: {
          'List-Unsubscribe': '<mailto:richy@freetradejournal.com?subject=Unsubscribe>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      await db.collection('users').doc(user.uid).set(
        { [DEDUP_FIELD]: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      )

      console.log(`  sent ${user.email}`)
      sent++

      await new Promise(r => setTimeout(r, 300))
    } catch (err) {
      console.error(`  FAIL ${user.email}:`, err)
      failed++
    }
  }

  console.log(`\nDone. ${sent} sent, ${failed} failed.`)
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
