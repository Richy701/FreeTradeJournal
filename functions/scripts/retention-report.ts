/**
 * Read-only preview of the inactive-account retention sweep (retentionSweep
 * in src/index.ts). Uses the exact same policy code (src/retention.ts), so
 * the counts here are what the sweep would do if it were switched on today.
 *
 * Writes nothing and sends nothing.
 *
 * Usage (run from functions/ directory, needs service-account.json):
 *   npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true}' scripts/retention-report.ts
 *   npx ts-node ... scripts/retention-report.ts --list     # also writes tmp-retention-candidates.json
 */

import * as admin from 'firebase-admin'
import * as path from 'path'
import * as fs from 'fs'
import {
  classifyAccount, decideAction, parseWarning, authActivity, DAY_MS,
  FIRST_WARNING_DAYS_BEFORE, RetentionTier,
} from '../src/retention'

const serviceAccount = require(path.resolve(__dirname, '../service-account.json')) as { project_id: string }
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as unknown as admin.ServiceAccount),
  // Same default bucket the deployed functions get from admin.initializeApp().
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
})
const db = admin.firestore()
const bucket = admin.storage().bucket()

const LIST = process.argv.includes('--list')

interface Candidate {
  uid: string
  email: string
  tier: RetentionTier
  lastSeen: string
  deleteAt: string
  action: string
  protectedBy?: string
}

async function main() {
  const nowMs = Date.now()
  const tiers: Record<RetentionTier, number> = { protected: 0, trader: 0, empty: 0 }
  const protectedBy: Record<string, number> = {}
  const actions: Record<string, number> = { none: 0, clear: 0, warn_first: 0, warn_final: 0, delete: 0 }
  const upcoming = { d30: 0, d90: 0, d180: 0 }
  const noEmail = { trader: 0, empty: 0 }
  const candidates: Candidate[] = []
  let scanned = 0
  let expensiveChecks = 0
  let pageToken: string | undefined

  do {
    const page = await admin.auth().listUsers(1000, pageToken)
    pageToken = page.pageToken
    const refs = page.users.map((u) => db.collection('users').doc(u.uid))
    const snaps: FirebaseFirestore.DocumentSnapshot[] = []
    for (let i = 0; i < refs.length; i += 300) snaps.push(...(await db.getAll(...refs.slice(i, i + 300))))
    const dataByUid = new Map(snaps.map((s) => [s.id, s.exists ? s.data() : undefined]))

    for (const user of page.users) {
      scanned++
      const data = dataByUid.get(user.uid)
      const warning = parseWarning(data?.retention)
      const base = { userData: data, ...authActivity(user.metadata) }
      let state = classifyAccount({ ...base, hasCloudData: false, hasStorageFiles: false })
      let action = decideAction(state, warning, nowMs)

      // Same shortcut as the sweep: only candidates pay for the subcollection
      // and Storage lookups, and those can only move them to "protected".
      if (state.tier !== 'protected' && action.kind !== 'none') {
        expensiveChecks++
        const [sync, files] = await Promise.all([
          db.collection('users').doc(user.uid).collection('sync').limit(1).get(),
          // No catch: a Storage failure must abort the report rather than
          // silently count screenshot owners as unprotected.
          bucket.getFiles({ prefix: `users/${user.uid}/`, maxResults: 1 }).then(([f]) => f.length > 0),
        ])
        state = classifyAccount({ ...base, hasCloudData: !sync.empty, hasStorageFiles: files })
        action = decideAction(state, warning, nowMs)
      }

      tiers[state.tier]++
      if (state.protectedBy) protectedBy[state.protectedBy] = (protectedBy[state.protectedBy] || 0) + 1
      actions[action.kind]++

      if (state.deleteAtMs !== undefined && action.kind === 'none') {
        const firstWarningIn = state.deleteAtMs - FIRST_WARNING_DAYS_BEFORE * DAY_MS - nowMs
        if (firstWarningIn <= 30 * DAY_MS) upcoming.d30++
        if (firstWarningIn <= 90 * DAY_MS) upcoming.d90++
        if (firstWarningIn <= 180 * DAY_MS) upcoming.d180++
      }

      const email = user.email || data?.email || ''
      if (!email && state.tier !== 'protected') noEmail[state.tier]++

      if (action.kind !== 'none' && action.kind !== 'clear') {
        candidates.push({
          uid: user.uid,
          email,
          tier: state.tier,
          lastSeen: new Date(state.lastSeenMs).toISOString().slice(0, 10),
          deleteAt: new Date(action.deleteAtMs).toISOString().slice(0, 10),
          action: action.kind,
        })
      }
    }
  } while (pageToken)

  console.log('Retention report', new Date().toISOString().slice(0, 10))
  console.log('')
  console.log(`Accounts scanned        ${scanned}`)
  console.log(`  protected             ${tiers.protected}   ${Object.entries(protectedBy).map(([k, v]) => `${k}: ${v}`).join(', ')}`)
  console.log(`  trader (24 months)    ${tiers.trader}`)
  console.log(`  empty (12 months)     ${tiers.empty}`)
  console.log('')
  console.log('If the sweep ran today')
  console.log(`  first warnings        ${actions.warn_first}`)
  console.log(`  final warnings        ${actions.warn_final}`)
  console.log(`  deletions             ${actions.delete}   (only after a first warning has aged 30 days)`)
  console.log(`  warnings cleared      ${actions.clear}`)
  console.log(`  no email, cannot warn ${noEmail.trader + noEmail.empty}   (trader ${noEmail.trader}, empty ${noEmail.empty})`)
  console.log('')
  console.log('First warnings coming up')
  console.log(`  within 30 days        ${upcoming.d30}`)
  console.log(`  within 90 days        ${upcoming.d90}`)
  console.log(`  within 180 days       ${upcoming.d180}`)
  console.log('')
  console.log(`Expensive lookups (sync + storage) performed: ${expensiveChecks}`)

  if (LIST) {
    const out = path.resolve(__dirname, '../tmp-retention-candidates.json')
    fs.writeFileSync(out, JSON.stringify(candidates, null, 2))
    console.log(`\nWrote ${candidates.length} candidates to ${out}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
