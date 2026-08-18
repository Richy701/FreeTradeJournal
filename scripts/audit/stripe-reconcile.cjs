// Stripe <-> Firestore entitlement reconciliation. READ-ONLY.
//
// Firestore users/{uid}.isPro / .subscription are written by the stripeWebhook
// Cloud Function; if a webhook was missed or mis-mapped, a payer loses Pro (or
// a churned user keeps it) and nothing notices. This script rebuilds the
// expected entitlement from Stripe itself and diffs it against Firestore.
//
// Sources: every Stripe subscription (all statuses; metadata.firebase_uid is
// set by createCheckoutSession) and every succeeded PaymentIntent whose
// metadata.firebase_uid is set (lifetime purchases, payment mode).
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=functions/service-account.json \
//   STRIPE_SECRET_KEY=sk_live_... node scripts/audit/stripe-reconcile.cjs
// (STRIPE_SECRET_KEY can also be read from functions/.env with --env.)
'use strict';
const path = require('path');
const fs = require('fs');
const { db, iterUsers } = require('./_lib.cjs');

let stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey && process.argv.includes('--env')) {
  const env = fs.readFileSync(path.join(__dirname, '../../functions/.env'), 'utf8');
  const m = env.match(/^STRIPE_SECRET_KEY=(.*)$/m);
  if (m) stripeKey = m[1].trim().replace(/^["']|["']$/g, '');
}
if (!stripeKey) { console.error('Set STRIPE_SECRET_KEY (or pass --env to read functions/.env).'); process.exit(1); }
let Stripe;
try { Stripe = require('../../functions/node_modules/stripe'); } catch { Stripe = require('stripe'); }
const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' });

const PRO_STRIPE_STATUSES = new Set(['active', 'trialing', 'past_due']);

(async () => {
  // 1. Stripe truth, keyed by firebase uid
  const expected = new Map(); // uid -> { pro: bool, why: string[] }
  const note = (uid, pro, why) => {
    const e = expected.get(uid) || { pro: false, why: [] };
    e.pro = e.pro || pro; e.why.push(why); expected.set(uid, e);
  };
  let subCount = 0;
  for await (const sub of stripe.subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer'] })) {
    subCount++;
    const uid = sub.metadata && sub.metadata.firebase_uid;
    const cust = sub.customer && typeof sub.customer === 'object' ? sub.customer : null;
    const label = `sub ${sub.id} ${sub.status} price=${sub.items.data[0]?.price?.id} cust=${cust ? cust.email : sub.customer}`;
    if (!uid) { console.log(`  [no firebase_uid] ${label}`); continue; }
    note(uid, PRO_STRIPE_STATUSES.has(sub.status), label);
  }
  let piCount = 0;
  let refunded = 0;
  for await (const pi of stripe.paymentIntents.list({ limit: 100, expand: ['data.latest_charge'] })) {
    if (pi.status !== 'succeeded') continue;
    const uid = pi.metadata && pi.metadata.firebase_uid;
    if (!uid) continue;
    const ch = pi.latest_charge && typeof pi.latest_charge === 'object' ? pi.latest_charge : null;
    const fullyRefunded = !!(ch && ch.refunded && ch.amount_refunded >= pi.amount);
    if (fullyRefunded) { refunded++; note(uid, false, `payment ${pi.id} REFUNDED ${pi.amount / 100} ${pi.currency}`); continue; }
    piCount++;
    note(uid, true, `payment ${pi.id} ${pi.amount / 100} ${pi.currency} lifetime`);
  }
  console.log(`Stripe: ${subCount} subscriptions, ${piCount} unrefunded lifetime payments (+${refunded} refunded) with a firebase_uid; ${expected.size} distinct uids\n`);

  // 2. Firestore state
  const actual = new Map();
  for await (const doc of iterUsers(['isPro', 'subscription', 'email', 'trialType', 'trialConvertedAt', 'trialOutcome', 'referralProExpiresAt'])) {
    actual.set(doc.id, doc.data());
  }

  // 3. Diff
  let mismatches = 0;
  for (const [uid, exp] of expected) {
    const act = actual.get(uid);
    const actPro = !!(act && act.isPro);
    if (!act) {
      if (exp.pro) { mismatches++; console.log(`MISSING users/${uid} — Stripe says pro=true\n    ${exp.why.join('\n    ')}`); }
      else console.log(`  (deleted account, nothing owed) ${uid}\n    ${exp.why.join('\n    ')}`);
      continue;
    }
    if (actPro !== exp.pro) {
      mismatches++;
      console.log(`MISMATCH ${uid} firestore isPro=${actPro} status=${act.subscription?.status} plan=${act.subscription?.planType} — Stripe says pro=${exp.pro}\n    ${exp.why.join('\n    ')}`);
    }
  }
  // isPro in Firestore with no Stripe record at all (manual grants, referral grants live elsewhere)
  for (const [uid, act] of actual) {
    if (act.isPro && !expected.has(uid)) {
      if (act.subscription?.source === 'manual') {
        console.log(`  (manual grant, expected) ${uid} plan=${act.subscription?.planType}`);
      } else {
        mismatches++;
        console.log(`UNBACKED ${uid} isPro=true status=${act.subscription?.status} plan=${act.subscription?.planType} — no Stripe subscription/payment carries this uid`);
      }
    }
  }
  const proNow = [...actual.values()].filter((a) => a.isPro).length;
  console.log(`\nFirestore isPro=true: ${proNow}; Stripe-expected pro: ${[...expected.values()].filter((e) => e.pro).length}; mismatches: ${mismatches}`);
})().catch((e) => { console.error(e); process.exit(1); });
