/**
 * Upgrade nudge campaign — free users from Firebase Auth, excluding Pro users and already-sent.
 *
 * Usage (run from functions/ directory):
 *   DRY_RUN=true npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-upgrade-nudge.ts
 *   DRY_RUN=false npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}' scripts/send-upgrade-nudge.ts
 */

import * as admin from 'firebase-admin'
import { Resend } from 'resend'
import * as React from 'react'
import { render } from '@react-email/components'
import { UpgradeNudgeEmail } from '../src/emails/UpgradeNudgeEmail'
import * as path from 'path'
import * as fs from 'fs'

// ── Config ────────────────────────────────────────────────
const DRY_RUN = process.env.DRY_RUN !== 'false'
const MAX_SENDS = 46  // 50 total - 4 already sent
const FROM = 'Richy at FreeTradeJournal <richy@freetradejournal.com>'
const subject = (firstName: string) =>
  firstName
    ? `${firstName}, here's what your trades are missing`
    : "Here's what your trades are missing"

// Emails already sent + owner to skip
const SKIP_EMAILS = new Set([
  'richyturnitup@gmail.com',
  'staibclaudia@aol.com',
  'richmondolletey@gmail.com',
  'unoselfmade@gmail.com',
  'ooscartrng@gmail.com',
  // obvious test/fake accounts
  'asdasd@asdasdad.com',
  'johndoe@gmail.com',
  'jidem94714@mogash.com',
  'dhshsja@gmail.con',
])

// ── Email validation ──────────────────────────────────────
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

  // Build set of Pro UIDs from Firestore
  const proSnap = await db.collection('users').where('isPro', '==', true).get()
  const proUids = new Set(proSnap.docs.map(d => d.id))
  console.log(`Pro users to skip: ${proUids.size}`)

  // List all Auth users
  const allUsers = await auth.listUsers(1000)
  console.log(`Total Auth users: ${allUsers.users.length}`)

  const candidates: { uid: string; email: string; name: string }[] = []
  const rejected: { email: string; reason: string }[] = []

  for (const user of allUsers.users) {
    if (!user.email) continue
    if (SKIP_EMAILS.has(user.email)) continue
    if (proUids.has(user.uid)) continue

    const badReason = isBadEmail(user.email)
    if (badReason) {
      rejected.push({ email: user.email, reason: badReason })
      continue
    }

    const name = (user.displayName || '').split(' ')[0] || ''
    candidates.push({ uid: user.uid, email: user.email, name })

    if (candidates.length >= MAX_SENDS) break
  }

  if (rejected.length > 0) {
    console.log(`\nSkipping ${rejected.length} bad addresses:`)
    rejected.forEach(r => console.log(`  ✗ ${r.email} — ${r.reason}`))
  }

  console.log(`\nTargeting ${candidates.length} free users:\n`)
  candidates.forEach((c, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. ${c.email}${c.name ? ` (${c.name})` : ''}`)
  })

  if (DRY_RUN) {
    console.log('\nDry run complete. Run with DRY_RUN=false to send for real.')
    process.exit(0)
  }

  console.log('\nSending...\n')

  let sent = 0
  let failed = 0

  for (const user of candidates) {
    try {
      const html = await render(
        React.createElement(UpgradeNudgeEmail, { firstName: user.name })
      )

      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: subject(user.name),
        html,
        headers: {
          'List-Unsubscribe': '<mailto:richy@freetradejournal.com?subject=Unsubscribe>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

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
