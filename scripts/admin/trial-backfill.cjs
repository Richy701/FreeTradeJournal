#!/usr/bin/env node

// Local admin runner for the 2026-07 monetization launch migrations.
// Mirrors the deployed backfillTrialPro / cleanupReferralIsPro callables
// exactly, using the same service-account credentials as Cloud Functions.
//
// Usage:
//   node scripts/admin/trial-backfill.cjs            # dry run (default, writes nothing)
//   node scripts/admin/trial-backfill.cjs --live     # apply both migrations

const admin = require('../../functions/node_modules/firebase-admin');
const serviceAccount = require('../../functions/service-account.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const dryRun = !process.argv.includes('--live');
const SIGNUP_TRIAL_DAYS = 14;
const ACTIVE_SUB_STATUSES = ['active', 'on_trial', 'past_due'];
const hasActiveSubscription = (d) =>
  !!d.subscription && ACTIVE_SUB_STATUSES.includes(d.subscription.status);

async function backfillTrialPro() {
  const expiresAt = new Date(Date.now() + SIGNUP_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const snapshot = await db.collection('users').select('trialProExpiresAt', 'subscription').get();
  let granted = 0;
  let batch = db.batch();
  let pending = 0;

  for (const doc of snapshot.docs) {
    const d = doc.data();
    if (d.trialProExpiresAt) continue;
    if (hasActiveSubscription(d)) continue;
    granted++;
    if (!dryRun) {
      batch.set(doc.ref, { trialProExpiresAt: expiresAt }, { merge: true });
      pending++;
      if (pending === 400) { await batch.commit(); batch = db.batch(); pending = 0; }
    }
  }
  if (!dryRun && pending > 0) await batch.commit();
  console.log(`backfillTrialPro: ${dryRun ? 'would grant' : 'granted'} trial to ${granted} of ${snapshot.size} users (until ${expiresAt})`);
}

async function cleanupReferralIsPro() {
  const snapshot = await db.collection('users')
    .where('isPro', '==', true)
    .select('subscription', 'referralProExpiresAt')
    .get();
  const stale = [];
  let batch = db.batch();
  let pending = 0;

  for (const doc of snapshot.docs) {
    const d = doc.data();
    if (hasActiveSubscription(d)) continue;
    if (!d.referralProExpiresAt) continue;
    stale.push(doc.id);
    if (!dryRun) {
      batch.set(doc.ref, { isPro: false }, { merge: true });
      pending++;
      if (pending === 400) { await batch.commit(); batch = db.batch(); pending = 0; }
    }
  }
  if (!dryRun && pending > 0) await batch.commit();
  console.log(`cleanupReferralIsPro: ${dryRun ? 'would clear' : 'cleared'} ${stale.length} stale isPro flags (of ${snapshot.size} isPro users)${stale.length ? ': ' + stale.join(', ') : ''}`);

  // Anyone isPro without a live sub AND without a referral trace — flagged for
  // manual review, never auto-cleared
  const unexplained = snapshot.docs.filter((doc) => {
    const d = doc.data();
    return !hasActiveSubscription(d) && !d.referralProExpiresAt;
  }).map((d) => d.id);
  if (unexplained.length) {
    console.log(`  NOTE: ${unexplained.length} isPro user(s) with no active sub and no referral trace (left untouched, review manually): ${unexplained.join(', ')}`);
  }
}

(async () => {
  console.log(dryRun ? '── DRY RUN (no writes) ──' : '── LIVE RUN ──');
  await backfillTrialPro();
  await cleanupReferralIsPro();
  process.exit(0);
})().catch((err) => { console.error(err); process.exit(1); });
