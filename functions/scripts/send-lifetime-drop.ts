/**
 * Lifetime drop (25 Sep to 2 Oct 2026): operator script for the three sends.
 * The scheduled functions do the real sending; this is for previews, counts,
 * arming and the fallback of sending by hand if a cron is missed.
 *
 * Usage (run from functions/ directory):
 *   TS='npx ts-node --compiler-options {"module":"commonjs","esModuleInterop":true,"jsx":"react-jsx"}'
 *
 *   # One copy of a campaign to your own inbox, touches nothing:
 *   CAMPAIGN=teaser TEST_TO=you@example.com $TS scripts/send-lifetime-drop.ts
 *
 *   # Who would get it right now (count + sample), sends nothing:
 *   CAMPAIGN=drop $TS scripts/send-lifetime-drop.ts
 *
 *   # Arm / disarm the scheduled sends (config/lifetimeDrop.armed):
 *   ARM=true  $TS scripts/send-lifetime-drop.ts
 *   ARM=false $TS scripts/send-lifetime-drop.ts
 *
 *   # Send a campaign by hand (only if its cron was missed):
 *   CAMPAIGN=teaser DRY_RUN=false $TS scripts/send-lifetime-drop.ts
 */

import * as admin from 'firebase-admin'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import * as path from 'path'
import * as fs from 'fs'
import { DROP_CAMPAIGNS, listDropCandidates, runLifetimeDropSend, type DropCampaign } from '../src/lifetime-drop-send'

// ── Load functions/.env for local runs (only fills unset vars) ─
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}

const DRY_RUN = process.env.DRY_RUN !== 'false'
const TEST_TO = process.env.TEST_TO || ''
const ARM = process.env.ARM
const CAMPAIGN = (process.env.CAMPAIGN || '') as DropCampaign
const FROM = 'Richy at FreeTradeJournal <richy@freetradejournal.com>'

function requireCampaign(): DropCampaign {
  if (!DROP_CAMPAIGNS[CAMPAIGN]) {
    console.error(`CAMPAIGN must be one of: ${Object.keys(DROP_CAMPAIGNS).join(', ')}`)
    process.exit(1)
  }
  return CAMPAIGN
}

async function sendTest(campaign: DropCampaign) {
  const cfg = DROP_CAMPAIGNS[campaign]
  const resend = new Resend(process.env.RESEND_API_KEY)
  const html = await render(cfg.render({ firstName: 'Richy', unsubscribeUrl: 'https://example.com/unsubscribe-preview' }))
  const result = await resend.emails.send({ from: FROM, to: TEST_TO, subject: `[TEST] ${cfg.subject}`, html })
  console.log(result.error ? `FAIL: ${JSON.stringify(result.error)}` : `Test ${campaign} sent to ${TEST_TO}`)
  process.exit(result.error ? 1 : 0)
}

function initAdmin() {
  const serviceAccountPath = path.resolve(__dirname, '../service-account.json')
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('service-account.json not found at', serviceAccountPath)
    process.exit(1)
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccountPath as admin.ServiceAccount) })
  return admin.firestore()
}

async function main() {
  if (TEST_TO) return sendTest(requireCampaign())

  const db = initAdmin()

  if (ARM === 'true' || ARM === 'false') {
    await db.doc('config/lifetimeDrop').set({ armed: ARM === 'true', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
    console.log(`config/lifetimeDrop.armed = ${ARM}`)
    return
  }

  const campaign = requireCampaign()
  const armed = (await db.doc('config/lifetimeDrop').get()).data()?.armed === true
  console.log(`Scheduled sends are ${armed ? 'ARMED' : 'NOT armed'}.`)

  if (DRY_RUN) {
    const candidates = await listDropCandidates(db, campaign)
    console.log(`\n${campaign}: ${candidates.length} targets`)
    console.log('Sample:', candidates.slice(0, 8).map((c) => c.email).join(', '))
    console.log('\nDry run. Run with DRY_RUN=false to send for real.')
    return
  }

  const deps = {
    db,
    getResend: () => new Resend(process.env.RESEND_API_KEY),
    getUnsubscribeUrl: (uid: string) => {
      // Mirrors getUnsubscribeUrl in src/index.ts (HMAC over the uid).
      const crypto = require('crypto') as typeof import('crypto')
      const secret = process.env.UNSUBSCRIBE_SECRET
      if (!secret) throw new Error('UNSUBSCRIBE_SECRET is not configured')
      const token = crypto.createHmac('sha256', secret).update(uid).digest('hex')
      return `https://us-central1-tradevault-41c68.cloudfunctions.net/unsubscribe?uid=${uid}&token=${token}`
    },
    reportError: (err: unknown, ctx: Record<string, unknown>) => console.error('send error', ctx, err),
  }
  const result = await runLifetimeDropSend(campaign, deps, { force: true })
  console.log('Result:', result)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
