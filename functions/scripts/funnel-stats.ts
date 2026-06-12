/**
 * Read-only funnel snapshot — where users drop off.
 *   npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true}' scripts/funnel-stats.ts
 */
import * as admin from 'firebase-admin'
import * as path from 'path'

admin.initializeApp({
  credential: admin.credential.cert(
    path.resolve(__dirname, '../service-account.json') as admin.ServiceAccount
  ),
})
const db = admin.firestore()
const auth = admin.auth()

async function main() {
  const authUsers = await auth.listUsers(1000)
  const totalAuth = authUsers.users.length
  let verified = 0
  const cutoff = new Date('2026-06-09T00:00:00Z')
  let pre = 0, post = 0
  for (const u of authUsers.users) {
    if (u.emailVerified) verified++
    if (u.metadata?.creationTime && new Date(u.metadata.creationTime) >= cutoff) post++; else pre++
  }

  const usersSnap = await db.collection('users').get()
  let activated = 0, pro = 0, optOut = 0, nudged = 0, hasSub = 0, day14sent = 0
  for (const d of usersSnap.docs) {
    const x = d.data()
    if (x.firstTradeLoggedAt) activated++
    if (x.isPro) pro++
    if (x.emailOptOut) optOut++
    if (x.upgradeNudgeSentAt) nudged++
    if (x.subscription) hasSub++
    if (x.day14UpgradeSentAt) day14sent++
  }

  console.log('\n=== FUNNEL SNAPSHOT ===')
  console.log({
    totalAuthUsers: totalAuth,
    emailVerified: verified,
    firestoreDocs: usersSnap.size,
    activated_loggedFirstTrade: activated,
    pro,
    everHadSubscription: hasSub,
    emailOptOut: optOut,
    upgradeNudgeSent: nudged,
    day14UpgradePitchSent: day14sent,
    signupsPreJun9: pre,
    signupsPostJun9: post,
  })
  console.log(`\nActivation (logged a trade): ${(activated / totalAuth * 100).toFixed(1)}% of signups`)
  console.log(`Verified email:              ${(verified / totalAuth * 100).toFixed(1)}% of signups`)
  console.log(`Paid conversion:             ${(pro / totalAuth * 100).toFixed(2)}% of signups`)
  if (activated > 0) console.log(`Activated -> Paid:           ${(pro / activated * 100).toFixed(1)}% of activated users`)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
