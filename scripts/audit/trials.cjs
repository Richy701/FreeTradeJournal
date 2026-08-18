// Q5: trials started vs converted, split before/after 2026-08-08.
// Card trial (Stripe Checkout, trial_period_days=14): webhook writes
// users/{uid}.subscription {status:'on_trial', createdAt ISO, stripeSubscriptionId}
// and hadTrial:true (functions/src/index.ts ~2763). Conversion is not written as
// a field: it is inferred as hadTrial && subscription.status in (active, past_due)
// && planType != lifetime. subscription.createdAt is preserved by merge writes.
// Old card-less signup trial = users/{uid}.trialProExpiresAt (every signup before
// 2026-08-07); it has no conversion marker at all.
// Read-only. Usage: GOOGLE_APPLICATION_CREDENTIALS=... node scripts/audit/trials.cjs
'use strict';
const { iterUsers, toMillis } = require('./_lib.cjs');
const CUTOFF = Date.parse('2026-08-08T00:00:00Z');

(async () => {
  const out = { before: { started: 0, on_trial: 0, converted: 0, cancelled: 0, other: 0 }, after: { started: 0, on_trial: 0, converted: 0, cancelled: 0, other: 0 }, unknownDate: 0 };
  let tombstoneOnly = 0, signupTrials = 0, signupTrialsNowPro = 0, isProNow = 0, lifetime = 0, paidSubs = 0;
  const rows = [];
  for await (const doc of iterUsers(['createdAt', 'hadTrial', 'subscription', 'isPro', 'trialProExpiresAt', 'stripeCustomerId', 'email'])) {
    const u = doc.data();
    if (u.isPro) isProNow++;
    const sub = u.subscription || {};
    if (sub.planType === 'lifetime') lifetime++;
    if (sub.status === 'active' && sub.planType !== 'lifetime') paidSubs++;
    if (u.trialProExpiresAt) { signupTrials++; if (u.isPro) signupTrialsNowPro++; }
    // hadTrial is ALSO set by onUserCreated for tombstoned delete-and-resignup
    // accounts (index.ts ~590) — those never had a Stripe trial, so require a
    // subscription record to count as a started card trial.
    const cardTrial = (u.hadTrial === true && sub.status) || sub.status === 'on_trial';
    if (u.hadTrial === true && !sub.status) { tombstoneOnly++; continue; }
    if (!cardTrial) continue;
    const started = toMillis(sub.createdAt);
    const side = started == null ? null : started < CUTOFF ? 'before' : 'after';
    if (!side) { out.unknownDate++; }
    const bucket = side ? out[side] : { started: 0, on_trial: 0, converted: 0, cancelled: 0, other: 0 };
    bucket.started++;
    let outcome;
    if (sub.status === 'on_trial') outcome = 'on_trial';
    else if (['active', 'past_due'].includes(sub.status) && sub.planType !== 'lifetime') outcome = 'converted';
    else if (['cancelled', 'unpaid', 'expired'].includes(sub.status)) outcome = 'cancelled'; // mapStripeStatus: canceled→cancelled, incomplete_expired/unknown→expired
    else outcome = 'other';
    bucket[outcome]++;
    rows.push({ uid: doc.id, started: started ? new Date(started).toISOString().slice(0, 10) : '?', status: sub.status, plan: sub.planType, outcome, isPro: !!u.isPro });
  }
  console.log('Card trials (hadTrial || status on_trial), split by subscription.createdAt vs 2026-08-08:');
  console.log(JSON.stringify(out, null, 2));
  console.log('\nPer-trial rows (no emails):');
  for (const r of rows) console.log(`  ${r.started}  ${r.outcome.padEnd(10)} status=${r.status} plan=${r.plan} isPro=${r.isPro} uid=${r.uid}`);
  console.log(`\nhadTrial set with no subscription (tombstone re-signups, not real trials): ${tombstoneOnly}`);
  console.log(`\nOld card-less signup trials (trialProExpiresAt set): ${signupTrials}; of those isPro today: ${signupTrialsNowPro} (no conversion marker exists for this trial type)`);
  console.log(`isPro today: ${isProNow}; lifetime plans: ${lifetime}; active recurring subs: ${paidSubs}`);
})().catch((e) => { console.error(e); process.exit(1); });
