'use strict';

require('ts-node').register({ transpileOnly: true });

const admin = require('firebase-admin');
const { Resend } = require('resend');
const { render } = require('@react-email/components');
const React = require('react');
const fs = require('fs');
const path = require('path');

const { TrialOfferEmail } = require('../src/emails/TrialOfferEmail');

const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, '../service-account.json'), 'utf8'));
const envRaw = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const env = Object.fromEntries(envRaw.split('\n').filter(l => l.includes('=')).map(l => {
  const idx = l.indexOf('=');
  return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
}));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const resend = new Resend(env.RESEND_API_KEY);

const BATCH_SIZE = 40;
const FROM_EMAIL = 'FreeTradeJournal <hello@freetradejournal.com>';
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE SEND'}\n`);

  // Pull all users from Firebase Auth (source of truth for all accounts)
  const allAuthUsers = [];
  let pageToken;
  do {
    const result = await admin.auth().listUsers(1000, pageToken);
    allAuthUsers.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);

  console.log(`Total auth users: ${allAuthUsers.length}`);

  // Fetch Firestore docs to check pro status and outreach flag
  const firestoreMap = {};
  const snapshot = await db.collection('users').limit(5000).get();
  for (const doc of snapshot.docs) {
    firestoreMap[doc.id] = doc.data();
  }

  const eligible = [];
  for (const authUser of allAuthUsers) {
    if (!authUser.email) continue;
    const d = firestoreMap[authUser.uid] || {};
    if (d.isPro === true) continue;
    if (d.trialOutreachSentAt) continue;
    const firstName = (authUser.displayName || authUser.email).split(' ')[0];
    eligible.push({ uid: authUser.uid, email: authUser.email, firstName });
  }

  // Shuffle for random selection each run
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }

  const batch = eligible.slice(0, BATCH_SIZE);

  console.log(`Eligible pool: ${eligible.length} users`);
  console.log(`Sending to: ${batch.length} users\n`);

  if (DRY_RUN) {
    batch.forEach((u, i) => console.log(`  ${i + 1}. ${u.email} (${u.firstName})`));
    console.log('\nRe-run without --dry-run to send for real.');
    process.exit(0);
  }

  let sent = 0;
  const failed = [];

  for (const user of batch) {
    try {
      const html = await render(React.createElement(TrialOfferEmail, { firstName: user.firstName }));
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: '14 days of Pro - on us',
        html,
      });
      await db.collection('users').doc(user.uid).set({
        trialOutreachSentAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      sent++;
      console.log(`  sent: ${user.email}`);
    } catch (err) {
      console.error(`  failed: ${user.email} — ${err.message}`);
      failed.push(user.email);
    }
  }

  console.log(`\nDone. Sent: ${sent} | Failed: ${failed.length} | Remaining pool: ${eligible.length - sent}`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
