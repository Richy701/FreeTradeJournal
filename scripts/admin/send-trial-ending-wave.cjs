#!/usr/bin/env node

// One-off catch-up for the 2026-07-23 trial-expiry wave.
//
// The scheduled sendTrialEndingEmails function crashed daily on a missing
// Firestore index until 2026-07-21, so none of the ~1,648 backfilled trials
// expiring Jul 23 were ever emailed — and its 500-per-run cap couldn't cover
// the wave anyway. This sends the SAME email with the SAME one-shot flag
// (signupTrialEndingSentAt), so the now-fixed scheduled function skips
// everyone this script reaches, and future rolling expiries stay on the
// scheduled path.
//
// Usage:
//   node scripts/admin/send-trial-ending-wave.cjs            # dry run
//   node scripts/admin/send-trial-ending-wave.cjs --live
//   node scripts/admin/send-trial-ending-wave.cjs --live --limit 5

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
const { SignupTrialEndingEmail } = require('../../functions/lib/emails/SignupTrialEndingEmail');

const serviceAccount = require('../../functions/service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const dryRun = !process.argv.includes('--live');
const limitFlag = process.argv.indexOf('--limit');
const LIMIT = limitFlag !== -1 ? parseInt(process.argv[limitFlag + 1], 10) : Infinity;
if (Number.isNaN(LIMIT) || LIMIT < 1) {
  throw new Error('--limit requires a positive number');
}

// Cover expiries from now through Jul 24 00:00 UTC. Later rolling expiries are
// the scheduled function's job (small daily cohorts, well under its cap).
const WINDOW_START = new Date().toISOString();
const WINDOW_END = '2026-07-24T00:00:00.000Z';

const SUBJECT = 'Your free Pro trial ends soon — nothing will be charged';
const FROM = 'FreeTradeJournal <hello@freetradejournal.com>';
const ACTIVE_SUB_STATUSES = ['active', 'on_trial', 'past_due'];

if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing from functions/.env');
if (!process.env.UNSUBSCRIBE_SECRET) throw new Error('UNSUBSCRIBE_SECRET missing from functions/.env');

const resend = new Resend(process.env.RESEND_API_KEY);

function unsubscribeUrl(uid) {
  const hmac = crypto.createHmac('sha256', process.env.UNSUBSCRIBE_SECRET);
  hmac.update(uid);
  return `https://us-central1-tradevault-41c68.cloudfunctions.net/unsubscribe?uid=${uid}&token=${hmac.digest('hex')}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendOne(uid, email, firstName, trialEndDate) {
  const html = await render(
    React.createElement(SignupTrialEndingEmail, {
      firstName,
      trialEndDate,
      unsubscribeUrl: unsubscribeUrl(uid),
    })
  );
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: SUBJECT,
      html,
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
  console.log(`Window: ${WINDOW_START} → ${WINDOW_END}\n`);

  const snap = await db
    .collection('users')
    .where('trialProExpiresAt', '>=', WINDOW_START)
    .where('trialProExpiresAt', '<=', WINDOW_END)
    .get();
  console.log(`Trials expiring in window: ${snap.size}`);

  const skipped = { alreadySent: 0, optedOut: 0, throttled: 0, paying: 0, noEmail: 0 };
  const eligible = [];

  for (const doc of snap.docs) {
    const d = doc.data();
    if (d.signupTrialEndingSentAt) { skipped.alreadySent++; continue; }
    if (d.emailOptOut === true) { skipped.optedOut++; continue; }
    if (d.signupThrottled) { skipped.throttled++; continue; }
    if (ACTIVE_SUB_STATUSES.includes(d.subscription?.status)) { skipped.paying++; continue; }
    // Some user docs lack the email field — fall back to Firebase Auth (the
    // scheduled function's pass 2 misses these; a 238-user gap in this wave).
    let email = d.email;
    let displayName = d.displayName;
    if (!email) {
      try {
        const rec = await admin.auth().getUser(doc.id);
        email = rec.email;
        displayName = displayName || rec.displayName;
      } catch { /* deleted auth user */ }
    }
    if (!email) { skipped.noEmail++; continue; }
    eligible.push({
      uid: doc.id,
      email,
      firstName: ((displayName || email).split(' ')[0]),
      trialEndDate: new Date(d.trialProExpiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    });
  }

  console.log(`Skipped — already sent: ${skipped.alreadySent}, opted out: ${skipped.optedOut}, throttled: ${skipped.throttled}, paying: ${skipped.paying}, no email: ${skipped.noEmail}`);
  const targets = eligible.slice(0, LIMIT);
  console.log(`Eligible: ${eligible.length}${targets.length < eligible.length ? ` (limited to ${targets.length})` : ''}\n`);

  if (dryRun) {
    targets.slice(0, 10).forEach((u) => console.log(`  would send → ${u.email} (trial ends ${u.trialEndDate})`));
    if (targets.length > 10) console.log(`  … and ${targets.length - 10} more`);
    console.log('\nDry run complete. Re-run with --live to send.');
    process.exit(0);
  }

  let ok = 0;
  const failures = [];
  for (const u of targets) {
    try {
      await sendOne(u.uid, u.email, u.firstName, u.trialEndDate);
      // Flag write AFTER the send; retry hard — an unflagged sent user would be
      // double-sent by the scheduled function tomorrow.
      let flagged = false;
      for (let i = 0; i < 3 && !flagged; i++) {
        try {
          await db.collection('users').doc(u.uid).set(
            { signupTrialEndingSentAt: admin.firestore.FieldValue.serverTimestamp() },
            { merge: true }
          );
          flagged = true;
        } catch (e) {
          if (i === 2) failures.push(`${u.email}: SENT but flag write failed (${e.message}) — may double-send tomorrow`);
          else await sleep(1000);
        }
      }
      ok++;
      if (ok % 100 === 0) console.log(`  sent ${ok}/${targets.length}…`);
    } catch (e) {
      failures.push(e.message);
    }
    await sleep(600); // stay under Resend's 2 req/s
  }

  console.log(`\nDone. Sent: ${ok}, failed: ${failures.length}`);
  failures.slice(0, 20).forEach((f) => console.log(`  FAILED ${f}`));
  if (failures.length) console.log('Unsent users have no signupTrialEndingSentAt — a re-run targets only them.');
  process.exit(failures.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
