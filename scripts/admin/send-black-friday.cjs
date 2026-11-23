#!/usr/bin/env node

// Black Friday 2026 campaign: three sends, fixed Europe/London times.
//   announce  Tue 24 Nov 10:00 London
//   reminder  Fri 27 Nov 10:00 London
//   final     Mon 30 Nov 18:00 London
// Sale ends Mon 30 Nov 11:59 PM New York = 2026-12-01T04:59:59Z.
//
// Audience = free accounts only, re-read on every run, so anyone who bought
// (Yearly, Lifetime, or Monthly) since the last wave drops out of the next.
// Excluded: paying/Pro (incl. Lifetime), emailOptOut, throttled signups, test
// accounts, unverified or disabled auth users, Resend suppressions (bounce /
// complaint / manual), owner addresses, and anyone already scheduled for
// this variant (idempotent via blackFriday<Variant>EmailId).
//
// Run each wave on its own day, close to the send time, not all at once:
// scheduling Friday's reminder on Tuesday would still mail Wednesday's buyers.
//
// Usage:
//   node scripts/admin/send-black-friday.cjs --variant announce            # dry run
//   node scripts/admin/send-black-friday.cjs --variant announce --live     # schedule
//   node scripts/admin/send-black-friday.cjs --variant announce --live --limit 5
// Needs functions/lib built (cd functions && npm run build).

const fs = require('fs');
const path = require('path');
for (const envFile of ['../../functions/.env', '../../.env.local']) {
  const p = path.join(__dirname, envFile);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const crypto = require('crypto');
const admin = require('../../functions/node_modules/firebase-admin');
const { Resend } = require('../../functions/node_modules/resend');
const React = require('../../functions/node_modules/react');
const { render } = require('../../functions/node_modules/@react-email/render');
const { BlackFridayEmail, BLACK_FRIDAY_SUBJECTS } = require('../../functions/lib/emails/BlackFridayEmail');

const serviceAccount = require('../../functions/service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const arg = (name) => { const i = process.argv.indexOf(name); return i === -1 ? undefined : process.argv[i + 1]; };
const VARIANT = arg('--variant');
const SEND_AT = {
  announce: '2026-11-24T10:00:00Z', // London is on GMT (UTC+0) in November
  reminder: '2026-11-27T10:00:00Z',
  final: '2026-11-30T18:00:00Z',
};
if (!SEND_AT[VARIANT]) throw new Error('--variant must be announce, reminder or final');
const dryRun = !process.argv.includes('--live');
const LIMIT = arg('--limit') ? parseInt(arg('--limit'), 10) : Infinity;
if (Number.isNaN(LIMIT) || LIMIT < 1) throw new Error('--limit requires a positive number');

const SALE_ENDS = Date.parse('2026-12-01T04:59:59Z');
const scheduledAt = SEND_AT[VARIANT];
if (Date.parse(scheduledAt) < Date.now() + 5 * 60 * 1000) throw new Error(`${VARIANT} send time ${scheduledAt} has passed or is under 5 minutes away.`);
if (Date.parse(scheduledAt) >= SALE_ENDS) throw new Error('Send time is after the sale ends.');

const FLAG = `blackFriday${VARIANT[0].toUpperCase()}${VARIANT.slice(1)}EmailId`;
const { subject: SUBJECT } = BLACK_FRIDAY_SUBJECTS[VARIANT];
const OWNER_EMAILS = new Set(['richmondlamptey75@gmail.com', 'richyturnitup@gmail.com', 'richmondolletey@gmail.com']);
const PAYING_STATUSES = ['active', 'on_trial', 'past_due', 'paused'];

if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing from functions/.env');
if (!process.env.UNSUBSCRIBE_SECRET) throw new Error('UNSUBSCRIBE_SECRET missing from functions/.env');
const resend = new Resend(process.env.RESEND_API_KEY);

function unsubscribeUrl(uid) {
  const hmac = crypto.createHmac('sha256', process.env.UNSUBSCRIBE_SECRET);
  hmac.update(uid);
  return `https://us-central1-tradevault-41c68.cloudfunctions.net/unsubscribe?uid=${uid}&token=${hmac.digest('hex')}`;
}

function firstNameOf(data) {
  const name = (data.displayName || '').trim();
  if (!name || name.includes('@')) return '';
  return name.split(' ')[0];
}

async function resendSuppressions() {
  const emails = new Set();
  let after;
  do {
    const url = new URL('https://api.resend.com/suppressions');
    url.searchParams.set('limit', '100');
    if (after) url.searchParams.set('after', after);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
    if (!res.ok) throw new Error(`Resend suppressions lookup failed: ${res.status}`);
    const body = await res.json();
    for (const s of body.data || []) emails.add(String(s.email).trim().toLowerCase());
    after = body.has_more ? body.data[body.data.length - 1]?.id : undefined;
  } while (after);
  return emails;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function scheduleOne(uid, email, firstName) {
  const element = React.createElement(BlackFridayEmail, { firstName, unsubscribeUrl: unsubscribeUrl(uid), variant: VARIANT });
  const html = await render(element);
  const text = await render(element, { plainText: true });
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await resend.emails.send({
      from: 'FreeTradeJournal <hello@freetradejournal.com>',
      to: email,
      subject: SUBJECT,
      html,
      text,
      scheduledAt,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl(uid)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }, { idempotencyKey: `black-friday-2026-${VARIANT}-${uid}` });
    if (!error) return data.id;
    if (error.name === 'rate_limit_exceeded') { await sleep(1500 * (attempt + 1)); continue; }
    throw new Error(`${email}: ${error.name} ${error.message}`);
  }
  throw new Error(`${email}: rate limited after 3 attempts`);
}

(async () => {
  console.log(`Variant: ${VARIANT}  Subject: "${SUBJECT}"  Send at: ${scheduledAt} (${new Date(scheduledAt).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'full', timeStyle: 'short' })} London)`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (nothing sent, nothing written)' : 'LIVE'}\n`);

  const [snap, suppressed] = await Promise.all([db.collection('users').get(), resendSuppressions()]);
  const skipped = { noEmail: 0, owner: 0, optedOut: 0, throttled: 0, test: 0, suppressed: 0, duplicateEmail: 0, alreadyScheduled: 0, unverifiedOrDisabled: 0 };
  const paying = { monthly: 0, yearly: 0, lifetime: 0, otherPro: 0 };
  const seen = new Set();
  const candidates = [];

  snap.forEach((doc) => {
    const d = doc.data();
    const email = String(d.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return skipped.noEmail++;
    const plan = d.subscription?.planType;
    const live = PAYING_STATUSES.includes(d.subscription?.status);
    if (plan === 'lifetime' && d.subscription?.status === 'active') return paying.lifetime++;
    if (live && plan === 'yearly') return paying.yearly++;
    if (live && plan === 'monthly') return paying.monthly++;
    if (d.isPro === true || live) return paying.otherPro++;
    if (OWNER_EMAILS.has(email)) return skipped.owner++;
    if (d.emailOptOut === true) return skipped.optedOut++;
    if (d.signupThrottled === true) return skipped.throttled++;
    if (d.isTestAccount === true) return skipped.test++;
    if (suppressed.has(email)) return skipped.suppressed++;
    if (d[FLAG]) return skipped.alreadyScheduled++;
    if (seen.has(email)) return skipped.duplicateEmail++;
    seen.add(email);
    candidates.push({ uid: doc.id, email, firstName: firstNameOf(d) });
  });

  const eligible = [];
  for (let i = 0; i < candidates.length; i += 100) {
    const batch = candidates.slice(i, i + 100);
    const { users } = await admin.auth().getUsers(batch.map((c) => ({ uid: c.uid })));
    const ok = new Map(users.map((u) => [u.uid, u.emailVerified && !u.disabled]));
    for (const c of batch) (ok.get(c.uid) ? eligible.push(c) : skipped.unverifiedOrDisabled++);
  }

  console.log(`User docs: ${snap.size}   Resend suppressions: ${suppressed.size}`);
  console.log(`Paying, not sent: lifetime ${paying.lifetime}, yearly ${paying.yearly}, monthly ${paying.monthly}, other Pro ${paying.otherPro}`);
  console.log('Skipped:', JSON.stringify(skipped));
  console.log(`\nRECIPIENTS: ${eligible.length}${LIMIT < Infinity ? ` (limited to ${Math.min(LIMIT, eligible.length)})` : ''}`);

  const targets = eligible.slice(0, LIMIT);
  if (dryRun) {
    console.log('\nDry run complete. Re-run with --live to schedule.');
    process.exit(0);
  }

  let ok = 0;
  const failures = [];
  for (const u of targets) {
    try {
      const emailId = await scheduleOne(u.uid, u.email, u.firstName);
      try {
        await db.collection('users').doc(u.uid).set({ [FLAG]: emailId, [`${FLAG}ScheduledAt`]: scheduledAt }, { merge: true });
      } catch (writeErr) {
        await resend.emails.cancel(emailId).catch(() => {});
        throw new Error(`${u.email}: Firestore flag write failed (${writeErr.message}), scheduled email cancelled`);
      }
      ok++;
      if (ok % 100 === 0) console.log(`  scheduled ${ok}/${targets.length}`);
    } catch (e) {
      failures.push(e.message);
    }
    await sleep(600);
  }
  console.log(`\nDone. Scheduled: ${ok}, failed: ${failures.length}`);
  failures.slice(0, 20).forEach((f) => console.log(`  FAILED ${f}`));
  process.exit(failures.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
