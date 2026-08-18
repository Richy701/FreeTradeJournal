#!/usr/bin/env node

// One-off for free accounts that had used all 20 of the OLD shared AI credits
// this month (2026-08). v2.82.0 (18 Aug 2026) stopped charging automatic AI
// to the user's counter and moved everyone to a fresh 5-coaching-run
// allowance, so these users are un-walled already; this email tells them.
//
// Targets: users/{uid}/meta/freeAiUsage with month == current AND legacy
// count >= 20 AND no coaching/utility usage yet under the new scheme, not
// entitled Pro, not opted out, not already sent (aiCreditsResetEmailSentAt).
//
// Usage:
//   node scripts/admin/send-ai-credits-reset.cjs            # dry run
//   node scripts/admin/send-ai-credits-reset.cjs --live
//   node scripts/admin/send-ai-credits-reset.cjs --live --limit 3

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
const { AiCreditsResetEmail } = require('../../functions/lib/emails/AiCreditsResetEmail');

const serviceAccount = require('../../functions/service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const dryRun = !process.argv.includes('--live');
const limitFlag = process.argv.indexOf('--limit');
const LIMIT = limitFlag !== -1 ? parseInt(process.argv[limitFlag + 1], 10) : Infinity;
if (Number.isNaN(LIMIT) || LIMIT < 1) throw new Error('--limit requires a positive number');

const OLD_LIMIT = 20;
const SUBJECT = 'Your free AI credits are back';
const FROM = 'FreeTradeJournal <hello@freetradejournal.com>';
const MONTH = new Date().toISOString().slice(0, 7);

if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing from functions/.env');
if (!process.env.UNSUBSCRIBE_SECRET) throw new Error('UNSUBSCRIBE_SECRET missing from functions/.env');
const resend = new Resend(process.env.RESEND_API_KEY);

function unsubscribeUrl(uid) {
  const hmac = crypto.createHmac('sha256', process.env.UNSUBSCRIBE_SECRET);
  hmac.update(uid);
  return `https://us-central1-tradevault-41c68.cloudfunctions.net/unsubscribe?uid=${uid}&token=${hmac.digest('hex')}`;
}
function isEntitledPro(d) {
  if (!d) return false;
  if (d.isPro) return true;
  return [d.trialProExpiresAt, d.referralProExpiresAt].some((v) => typeof v === 'string' && new Date(v).getTime() > Date.now());
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendOne(uid, email, firstName) {
  const html = await render(React.createElement(AiCreditsResetEmail, { firstName, unsubscribeUrl: unsubscribeUrl(uid) }));
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await resend.emails.send({
      from: FROM, to: email, subject: SUBJECT, html,
      headers: { 'List-Unsubscribe': `<${unsubscribeUrl(uid)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    });
    if (!error) return data.id;
    if (error.name === 'rate_limit_exceeded') { await sleep(1500 * (attempt + 1)); continue; }
    throw new Error(`${email}: ${error.name} — ${error.message}`);
  }
  throw new Error(`${email}: rate limited after 3 attempts`);
}

(async () => {
  console.log(`Mode: ${dryRun ? 'DRY RUN (nothing sent, nothing written)' : 'LIVE'}  month=${MONTH}\n`);
  const meta = await db.collectionGroup('meta').get();
  const hits = [];
  for (const d of meta.docs) {
    if (d.id !== 'freeAiUsage') continue;
    const u = d.data() || {};
    if (u.month !== MONTH) continue;
    if ((Number(u.count) || 0) < OLD_LIMIT) continue;
    // Already used the new scheme → they have seen the reset in-app; skip.
    if ((Number(u.coaching) || 0) > 0 || (Number(u.utility) || 0) > 0) continue;
    hits.push(d.ref.parent.parent.id);
  }
  console.log(`Free counters at ${OLD_LIMIT}+ this month (legacy scheme): ${hits.length}`);

  const skipped = { alreadySent: 0, optedOut: 0, throttled: 0, pro: 0, noEmail: 0, noDoc: 0 };
  const eligible = [];
  for (const uid of hits) {
    const doc = await db.collection('users').doc(uid).get();
    const d = doc.data();
    if (!d) { skipped.noDoc++; continue; }
    if (d.aiCreditsResetEmailSentAt) { skipped.alreadySent++; continue; }
    if (d.emailOptOut === true) { skipped.optedOut++; continue; }
    if (d.signupThrottled) { skipped.throttled++; continue; }
    if (isEntitledPro(d)) { skipped.pro++; continue; }
    let email = d.email, displayName = d.displayName;
    if (!email) { try { const rec = await admin.auth().getUser(uid); email = rec.email; displayName = displayName || rec.displayName; } catch { /* deleted */ } }
    if (!email) { skipped.noEmail++; continue; }
    eligible.push({ uid, email, firstName: (displayName || '').split(' ')[0] });
  }
  console.log(`Skipped — already sent: ${skipped.alreadySent}, opted out: ${skipped.optedOut}, throttled: ${skipped.throttled}, pro: ${skipped.pro}, no email: ${skipped.noEmail}, no doc: ${skipped.noDoc}`);
  const targets = eligible.slice(0, LIMIT);
  console.log(`Eligible: ${eligible.length}${targets.length < eligible.length ? ` (limited to ${targets.length})` : ''}\n`);

  if (dryRun) {
    targets.slice(0, 10).forEach((u) => console.log(`  would send → ${u.email}`));
    if (targets.length > 10) console.log(`  … and ${targets.length - 10} more`);
    console.log('\nDry run complete. Re-run with --live to send.');
    process.exit(0);
  }

  let ok = 0; const failures = [];
  for (const u of targets) {
    try {
      const id = await sendOne(u.uid, u.email, u.firstName);
      let flagged = false;
      for (let i = 0; i < 3 && !flagged; i++) {
        try {
          await db.collection('users').doc(u.uid).set({ aiCreditsResetEmailSentAt: admin.firestore.FieldValue.serverTimestamp(), aiCreditsResetEmailId: id }, { merge: true });
          flagged = true;
        } catch (e) { if (i === 2) console.error(`FLAG FAILED for ${u.uid} after send (email id ${id}):`, e.message); else await sleep(500); }
      }
      ok++;
      await sleep(600); // Resend: 2 req/s
    } catch (e) {
      failures.push(`${u.email}: ${e.message}`);
    }
  }
  console.log(`\nSent: ${ok}/${targets.length}`);
  if (failures.length) { console.log('Failures:'); failures.forEach((f) => console.log('  ' + f)); }
  process.exit(failures.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
