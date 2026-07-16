#!/usr/bin/env node

// Schedules the "Lifetime Pro retires August 7" final-call campaign.
//
// Follow-up to the 2026-07-14 founding-member send: same audience (everyone
// who got wave 1, tracked via foundingMemberEmailId), minus anyone who has
// since paid or unsubscribed. Sends are individual (not batch) because
// Resend's batch endpoint does not support scheduled_at; each user doc gets
// lifetimeRetirementEmailId so the run is idempotent and cancellable
// (resend cancel-email per stored ID) until the scheduled time.
//
// Usage:
//   node scripts/admin/send-lifetime-retirement.cjs                 # dry run (writes nothing)
//   node scripts/admin/send-lifetime-retirement.cjs --live          # schedule for the default slot
//   node scripts/admin/send-lifetime-retirement.cjs --live --at 2026-07-22T13:00:00Z
//   node scripts/admin/send-lifetime-retirement.cjs --live --limit 5   # smoke-test on 5 users

const fs = require('fs');
const path = require('path');
for (const line of fs.readFileSync(path.join(__dirname, '../../functions/.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const crypto = require('crypto');
const admin = require('../../functions/node_modules/firebase-admin');
const { Resend } = require('../../functions/node_modules/resend');
const React = require('../../functions/node_modules/react');
const { render } = require('../../functions/node_modules/@react-email/render');
const { LifetimeRetirementEmail } = require('../../functions/lib/emails/LifetimeRetirementEmail');

const serviceAccount = require('../../functions/service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const dryRun = !process.argv.includes('--live');
const atFlag = process.argv.indexOf('--at');
const SCHEDULED_AT = atFlag !== -1 ? process.argv[atFlag + 1] : '2026-07-21T13:00:00Z';
const limitFlag = process.argv.indexOf('--limit');
const LIMIT = limitFlag !== -1 ? parseInt(process.argv[limitFlag + 1], 10) : Infinity;

const SUBJECT = 'Lifetime Pro retires August 7 — final call at $149';
const CAMPAIGN = 'lifetime_retirement_2026_07';
const PRICING_URL = `https://www.freetradejournal.com/pricing?utm_source=resend&utm_medium=email&utm_campaign=${CAMPAIGN}`;
const ACTIVE_SUB_STATUSES = ['active', 'on_trial', 'past_due'];

if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing from functions/.env');
if (!process.env.UNSUBSCRIBE_SECRET) throw new Error('UNSUBSCRIBE_SECRET missing from functions/.env');
if (isNaN(Date.parse(SCHEDULED_AT))) throw new Error(`Invalid --at value: ${SCHEDULED_AT}`);
if (Date.parse(SCHEDULED_AT) < Date.now()) throw new Error(`--at ${SCHEDULED_AT} is in the past`);

const resend = new Resend(process.env.RESEND_API_KEY);

function unsubscribeUrl(uid) {
  const hmac = crypto.createHmac('sha256', process.env.UNSUBSCRIBE_SECRET);
  hmac.update(uid);
  const token = hmac.digest('hex');
  return `https://us-central1-tradevault-41c68.cloudfunctions.net/unsubscribe?uid=${uid}&token=${token}`;
}

// Only a real name goes in the headline. No "trader" fallback — wave 1's
// lowercase "trader," headline is exactly what this avoids; the template
// drops the name entirely when firstName is empty.
function firstNameOf(data) {
  const name = (data.displayName || '').trim();
  if (!name || name.includes('@')) return '';
  return name.split(' ')[0];
}

function hasActiveSubscription(data) {
  return ACTIVE_SUB_STATUSES.includes(data.subscription?.status);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function scheduleOne(uid, email, firstName) {
  const html = await render(
    React.createElement(LifetimeRetirementEmail, {
      firstName,
      pricingUrl: PRICING_URL,
      unsubscribeUrl: unsubscribeUrl(uid),
    })
  );

  // Resend allows ~2 req/s; retry once on rate limit.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await resend.emails.send({
      from: 'FreeTradeJournal <hello@freetradejournal.com>',
      to: email,
      subject: SUBJECT,
      html,
      scheduledAt: SCHEDULED_AT,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl(uid)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    if (!error) return data.id;
    if (error.name === 'rate_limit_exceeded') {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    throw new Error(`${email}: ${error.name} — ${error.message}`);
  }
  throw new Error(`${email}: rate limited after 3 attempts`);
}

(async () => {
  console.log(`Mode: ${dryRun ? 'DRY RUN (nothing sent, nothing written)' : 'LIVE'}`);
  console.log(`Scheduled for: ${SCHEDULED_AT}\n`);

  const snap = await db.collection('users').where('foundingMemberEmailId', '>', '').get();
  console.log(`Wave-1 audience (foundingMemberEmailId set): ${snap.size}`);

  const skipped = { optedOut: 0, paying: 0, alreadyScheduled: 0, noEmail: 0 };
  const eligible = [];

  snap.forEach((doc) => {
    const d = doc.data();
    if (!d.email) return skipped.noEmail++;
    if (d.emailOptOut === true) return skipped.optedOut++;
    if (d.isPro === true || hasActiveSubscription(d)) return skipped.paying++;
    if (d.lifetimeRetirementEmailId) return skipped.alreadyScheduled++;
    eligible.push({ uid: doc.id, email: d.email, firstName: firstNameOf(d) });
  });

  console.log(`Skipped — opted out: ${skipped.optedOut}, paying: ${skipped.paying}, already scheduled: ${skipped.alreadyScheduled}, no email: ${skipped.noEmail}`);
  const targets = eligible.slice(0, LIMIT);
  console.log(`Eligible: ${eligible.length}${targets.length < eligible.length ? ` (limited to ${targets.length})` : ''}\n`);

  if (dryRun) {
    targets.slice(0, 10).forEach((u) => console.log(`  would schedule → ${u.email}${u.firstName ? ` (${u.firstName})` : ''}`));
    if (targets.length > 10) console.log(`  … and ${targets.length - 10} more`);
    console.log('\nDry run complete. Re-run with --live to schedule.');
    process.exit(0);
  }

  let ok = 0;
  const failures = [];
  for (const u of targets) {
    try {
      const emailId = await scheduleOne(u.uid, u.email, u.firstName);
      await db.collection('users').doc(u.uid).set(
        { lifetimeRetirementEmailId: emailId, lifetimeRetirementScheduledAt: SCHEDULED_AT },
        { merge: true }
      );
      ok++;
      if (ok % 100 === 0) console.log(`  scheduled ${ok}/${targets.length}…`);
    } catch (e) {
      failures.push(e.message);
    }
    await sleep(600); // stay under Resend's 2 req/s
  }

  console.log(`\nDone. Scheduled: ${ok}, failed: ${failures.length}`);
  failures.slice(0, 20).forEach((f) => console.log(`  FAILED ${f}`));
  if (failures.length) console.log('Failed users have no lifetimeRetirementEmailId — re-running targets only them.');
  process.exit(failures.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
