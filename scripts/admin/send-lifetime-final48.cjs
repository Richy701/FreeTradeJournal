#!/usr/bin/env node

// Schedules the last-days lifetime email — ONLY for accounts that never
// received either July retirement wave. The July 21 wave told its 1,358
// recipients "I will not email you about this again", so anyone carrying
// foundingMemberEmailId or lifetimeRetirementEmailId is hard-excluded here.
//
// Timezone-aware: each email is scheduled for 9:00 AM on Wednesday August 6
// in the recipient's own timezone (PostHog $geoip_time_zone), so nobody gets
// a "last chance" email at 3 AM. Unknown timezone falls back to
// America/New_York (the largest market).
//
// Usage:
//   node scripts/admin/send-lifetime-final48.cjs                # dry run (writes nothing)
//   node scripts/admin/send-lifetime-final48.cjs --live         # schedule for real
//   node scripts/admin/send-lifetime-final48.cjs --live --limit 5   # smoke test
//
// Run --live on Tuesday August 5 so signups between now and then are included.
// Idempotent via lifetimeFinal48EmailId — safe to re-run as a top-up.

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
const { LifetimeFinal48Email } = require('../../functions/lib/emails/LifetimeFinal48Email');

const serviceAccount = require('../../functions/service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const dryRun = !process.argv.includes('--live');
const limitFlag = process.argv.indexOf('--limit');
const LIMIT = limitFlag !== -1 ? parseInt(process.argv[limitFlag + 1], 10) : Infinity;
if (Number.isNaN(LIMIT) || LIMIT < 1) {
  throw new Error('--limit requires a positive number');
}

const SUBJECT = 'Lifetime Pro ends Thursday — last chance at $149';
const CAMPAIGN = 'lifetime_final48_2026_08';
const PRICING_URL = `https://www.freetradejournal.com/pricing?utm_source=resend&utm_medium=email&utm_campaign=${CAMPAIGN}`;
const SEND_DAY_9AM_UTC = Date.parse('2026-08-06T09:00:00Z');
const EARLIEST = Date.now() + 2 * 60 * 60 * 1000;
const LATEST = Date.parse('2026-08-07T18:00:00Z'); // still ~6h before the cutoff
const FALLBACK_TZ = 'America/New_York';
const ACTIVE_SUB_STATUSES = ['active', 'on_trial', 'past_due'];
const POSTHOG_HOST = 'https://eu.posthog.com';

if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing from functions/.env');
if (!process.env.UNSUBSCRIBE_SECRET) throw new Error('UNSUBSCRIBE_SECRET missing from functions/.env');
if (!process.env.POSTHOG_PERSONAL_API_KEY) throw new Error('POSTHOG_PERSONAL_API_KEY missing from .env.local');
if (Date.now() > LATEST) throw new Error('The send window has passed — the plan retires August 7.');

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

function hasActiveSubscription(data) {
  return ACTIVE_SUB_STATUSES.includes(data.subscription?.status);
}

// UTC instant at which a clock in `tz` reads 9:00 AM on August 6.
function scheduledAtFor(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(new Date(SEND_DAY_9AM_UTC));
    const get = (t) => parts.find((p) => p.type === t).value;
    const hour = get('hour') === '24' ? '00' : get('hour');
    const wall = Date.parse(`${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}:00Z`);
    const offsetMs = wall - SEND_DAY_9AM_UTC;
    const at = Math.min(Math.max(SEND_DAY_9AM_UTC - offsetMs, EARLIEST), LATEST);
    return new Date(at).toISOString();
  } catch {
    return null; // unknown/invalid tz — caller falls back
  }
}

async function fetchTimezones(uids) {
  const headers = {
    Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
    'Content-Type': 'application/json',
  };
  const projectsRes = await fetch(`${POSTHOG_HOST}/api/projects/`, { headers });
  if (!projectsRes.ok) throw new Error(`PostHog projects lookup failed: ${projectsRes.status}`);
  const projects = await projectsRes.json();
  const projectId = projects.results?.[0]?.id;
  if (!projectId) throw new Error('No PostHog project visible to this key');

  const tzByUid = new Map();
  for (let i = 0; i < uids.length; i += 300) {
    const batch = uids.slice(i, i + 300);
    const inList = batch.map((u) => `'${u.replace(/'/g, '')}'`).join(',');
    const query = `SELECT distinct_id, any(person.properties.$geoip_time_zone) FROM events WHERE timestamp > now() - INTERVAL 60 DAY AND distinct_id IN (${inList}) GROUP BY distinct_id`;
    const res = await fetch(`${POSTHOG_HOST}/api/projects/${projectId}/query/`, {
      method: 'POST', headers,
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
    });
    if (!res.ok) throw new Error(`PostHog HogQL query failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    for (const [distinctId, tz] of data.results || []) {
      if (tz) tzByUid.set(distinctId, tz);
    }
  }
  return tzByUid;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function scheduleOne(uid, email, firstName, scheduledAt) {
  const html = await render(
    React.createElement(LifetimeFinal48Email, {
      firstName,
      pricingUrl: PRICING_URL,
      unsubscribeUrl: unsubscribeUrl(uid),
    })
  );
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await resend.emails.send({
      from: 'FreeTradeJournal <hello@freetradejournal.com>',
      to: email,
      subject: SUBJECT,
      html,
      scheduledAt,
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
  console.log(`Mode: ${dryRun ? 'DRY RUN (nothing sent, nothing written)' : 'LIVE'}\n`);

  const snap = await db.collection('users').get();
  const skipped = { priorWave: 0, optedOut: 0, paying: 0, throttled: 0, alreadyScheduled: 0, noEmail: 0, unverified: 0 };
  const candidates = [];

  snap.forEach((doc) => {
    const d = doc.data();
    if (!d.email) return skipped.noEmail++;
    // Hard promise guard: July recipients were told "never again".
    if (d.foundingMemberEmailId || d.lifetimeRetirementEmailId) return skipped.priorWave++;
    if (d.lifetimeFinal48EmailId) return skipped.alreadyScheduled++;
    if (d.emailOptOut === true) return skipped.optedOut++;
    if (d.signupThrottled === true) return skipped.throttled++;
    if (d.isPro === true || hasActiveSubscription(d)) return skipped.paying++;
    candidates.push({ uid: doc.id, email: d.email, firstName: firstNameOf(d) });
  });

  // Only verified addresses — this cohort is new and unvetted; unverified
  // signups are the bounce/abuse tail.
  const verified = [];
  for (let i = 0; i < candidates.length; i += 100) {
    const batch = candidates.slice(i, i + 100);
    const { users: found } = await admin.auth().getUsers(batch.map((c) => ({ uid: c.uid })));
    const ok = new Map(found.map((u) => [u.uid, u.emailVerified]));
    for (const c of batch) {
      if (ok.get(c.uid)) verified.push(c);
      else skipped.unverified++;
    }
  }

  console.log(`Total user docs: ${snap.size}`);
  console.log(`Skipped — got a July wave (promise kept): ${skipped.priorWave}, opted out: ${skipped.optedOut}, paying: ${skipped.paying}, throttled: ${skipped.throttled}, already scheduled: ${skipped.alreadyScheduled}, no email: ${skipped.noEmail}, unverified: ${skipped.unverified}`);
  console.log(`Eligible (never emailed about retirement): ${verified.length}\n`);

  console.log('Looking up timezones in PostHog…');
  const tzByUid = await fetchTimezones(verified.map((v) => v.uid));

  const slotCounts = new Map();
  const targets = verified.slice(0, LIMIT).map((v) => {
    const tz = tzByUid.get(v.uid) || FALLBACK_TZ;
    const scheduledAt = scheduledAtFor(tz) || scheduledAtFor(FALLBACK_TZ);
    const label = `${scheduledAt} (${tzByUid.has(v.uid) ? tz : 'no geo → ' + FALLBACK_TZ})`;
    slotCounts.set(label, (slotCounts.get(label) || 0) + 1);
    return { ...v, scheduledAt, tz };
  });

  console.log(`Timezone coverage: ${tzByUid.size}/${verified.length} resolved, rest default to 9 AM New York\n`);
  console.log('Send slots (all 9:00 AM local, Wednesday August 6):');
  [...slotCounts.entries()].sort().forEach(([slot, n]) => console.log(`  ${slot}: ${n}`));

  if (dryRun) {
    console.log('');
    targets.slice(0, 10).forEach((u) => console.log(`  would schedule → ${u.email}${u.firstName ? ` (${u.firstName})` : ''} at ${u.scheduledAt} [${u.tz}]`));
    if (targets.length > 10) console.log(`  … and ${targets.length - 10} more`);
    console.log('\nDry run complete. Re-run with --live on Tuesday August 5 to schedule.');
    process.exit(0);
  }

  let ok = 0;
  const failures = [];
  for (const u of targets) {
    try {
      const emailId = await scheduleOne(u.uid, u.email, u.firstName, u.scheduledAt);
      try {
        await db.collection('users').doc(u.uid).set(
          { lifetimeFinal48EmailId: emailId, lifetimeFinal48ScheduledAt: u.scheduledAt },
          { merge: true }
        );
      } catch (writeErr) {
        await resend.emails.cancel(emailId).catch(() => {});
        throw new Error(`${u.email}: Firestore flag write failed (${writeErr.message}) — scheduled email cancelled`);
      }
      ok++;
      if (ok % 100 === 0) console.log(`  scheduled ${ok}/${targets.length}…`);
    } catch (e) {
      failures.push(e.message);
    }
    await sleep(600);
  }

  console.log(`\nDone. Scheduled: ${ok}, failed: ${failures.length}`);
  failures.slice(0, 20).forEach((f) => console.log(`  FAILED ${f}`));
  if (failures.length) console.log('Failed users have no lifetimeFinal48EmailId — re-running targets only them.');
  process.exit(failures.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
