/**
 * Trial-open announcement — tells every free user the 14-day card trial now
 * works for them (the hadTrial rule that locked out prior-trial accounts was
 * removed on 2026-08-08). One-off campaign; dedup field: cardTrialOpenSentAt.
 *
 * Usage (run from functions/ directory):
 *   DRY_RUN=true npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-trial-open.ts
 *   DRY_RUN=false npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-trial-open.ts
 */

import * as admin from 'firebase-admin'
import { Resend } from 'resend'
import * as React from 'react'
import { render } from '@react-email/components'
import { TrialOpenEmail } from '../src/emails/TrialOpenEmail'
import * as path from 'path'
import * as fs from 'fs'

// ── Config ────────────────────────────────────────────────
const DRY_RUN = process.env.DRY_RUN !== 'false'
const MAX_SENDS = process.env.MAX_SENDS ? parseInt(process.env.MAX_SENDS, 10) : Number.MAX_SAFE_INTEGER
// Wave 1 targets users with a trade record (they're the ones who convert AND
// the personalised copy only works for them). SEGMENT=all opens it up to the
// rest with the plain trial-open variant.
const SEGMENT = process.env.SEGMENT === 'all' ? 'all' : 'activated'
const FROM = 'Richy at FreeTradeJournal <richy@freetradejournal.com>'
const subject = (firstName: string, tradeCount: number) => {
  if (tradeCount >= 5) return `Your ${tradeCount} trades have something to tell you`
  return firstName
    ? `${firstName}, Pro now has a 14-day free trial`
    : 'Pro now has a 14-day free trial'
}

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

// ── Email validation (same lists as send-upgrade-nudge) ───
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

// ── Init Firebase Admin ───────────────────────────────────
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

// ── Init Resend ───────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY
if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY env var is required')
const resend = new Resend(RESEND_API_KEY)

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log(`\n${DRY_RUN ? '🔍 DRY RUN — no emails will be sent' : '🚀 LIVE SEND'}\n`)

  // Firestore-side exclusions: Pro, opted out, velocity-flagged, already sent
  const userDocs = new Map<string, FirebaseFirestore.DocumentData>()
  const usersSnap = await db.collection('users').select('isPro', 'emailOptOut', 'signupThrottled', 'cardTrialOpenSentAt', 'subscription', 'tradesLoggedCount', 'firstTradeLoggedAt').get()
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

  const candidates: { uid: string; email: string; name: string; tradeCount: number }[] = []
  const rejected: { email: string; reason: string }[] = []
  let skippedPro = 0, skippedOptOut = 0, skippedThrottled = 0, skippedSent = 0, skippedNotActivated = 0

  for (const user of allUsers) {
    if (!user.email) continue
    if (SKIP_EMAILS.has(user.email.toLowerCase())) continue

    const d = userDocs.get(user.uid)
    if (d?.isPro || ['active', 'on_trial', 'past_due'].includes(d?.subscription?.status)) { skippedPro++; continue }
    if (d?.emailOptOut) { skippedOptOut++; continue }
    if (d?.signupThrottled) { skippedThrottled++; continue }
    if (d?.cardTrialOpenSentAt) { skippedSent++; continue }

    const tradeCount = typeof d?.tradesLoggedCount === 'number' ? d.tradesLoggedCount : 0
    const activated = tradeCount > 0 || Boolean(d?.firstTradeLoggedAt)
    if (SEGMENT === 'activated' && !activated) { skippedNotActivated++; continue }

    const badReason = isBadEmail(user.email)
    if (badReason) {
      rejected.push({ email: user.email, reason: badReason })
      continue
    }

    const name = (user.displayName || '').split(' ')[0] || ''
    candidates.push({ uid: user.uid, email: user.email, name, tradeCount })

    if (candidates.length >= MAX_SENDS) break
  }

  console.log(`Skipped: ${skippedPro} Pro/trialing, ${skippedOptOut} opted out, ${skippedThrottled} throttled, ${skippedSent} already sent, ${skippedNotActivated} not activated (SEGMENT=${SEGMENT}), ${rejected.length} bad addresses`)
  console.log(`Send cap this run: ${MAX_SENDS === Number.MAX_SAFE_INTEGER ? 'uncapped' : MAX_SENDS}`)
  const personalised = candidates.filter(c => c.tradeCount >= 5).length
  console.log(`\nTargeting ${candidates.length} users (${personalised} get the trade-count copy, ${candidates.length - personalised} the plain variant)`)

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
        React.createElement(TrialOpenEmail, { firstName: user.name, tradeCount: user.tradeCount })
      )

      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: subject(user.name, user.tradeCount),
        html,
        headers: {
          'List-Unsubscribe': '<mailto:richy@freetradejournal.com?subject=Unsubscribe>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      await db.collection('users').doc(user.uid).set(
        { cardTrialOpenSentAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      )

      console.log(`  ✓ ${user.email}`)
      sent++

      await new Promise(r => setTimeout(r, 300))
    } catch (err) {
      console.error(`  ✗ ${user.email}:`, err)
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
