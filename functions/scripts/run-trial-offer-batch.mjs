import admin from 'firebase-admin';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import React from 'react';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { register } from 'ts-node';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

register({ transpileOnly: true });

const { TrialOfferEmail } = await import('../src/emails/TrialOfferEmail.tsx');

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, '../service-account.json'), 'utf8'));
const env = Object.fromEntries(
  readFileSync(path.join(__dirname, '../.env'), 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => l.split('='))
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const resend = new Resend(env.RESEND_API_KEY);

const BATCH_SIZE = 40;
const FROM_EMAIL = 'FreeTradeJournal <hello@freetradejournal.com>';
const DRY_RUN = process.argv.includes('--dry-run');

console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE SEND'}`);

const snapshot = await db.collection('users').limit(2000).get();

const eligible = [];
for (const doc of snapshot.docs) {
  const d = doc.data();
  if (d.isPro === true) continue;
  if (d.trialOutreachSentAt) continue;
  if (!d.email) continue;
  const firstName = (d.displayName || d.email || 'trader').split(' ')[0];
  eligible.push({ uid: doc.id, email: d.email, firstName });
}

// Shuffle
for (let i = eligible.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
}

const batch = eligible.slice(0, BATCH_SIZE);

console.log(`Eligible pool: ${eligible.length} users`);
console.log(`Sending to: ${batch.length} users`);
console.log('');

if (DRY_RUN) {
  batch.forEach((u, i) => console.log(`  ${i + 1}. ${u.email} (${u.firstName})`));
  console.log('\nRe-run without --dry-run to send.');
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
    await db.collection('users').doc(user.uid).update({
      trialOutreachSentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    sent++;
    console.log(`  ✓ ${user.email}`);
  } catch (err) {
    console.error(`  ✗ ${user.email}: ${err.message}`);
    failed.push(user.email);
  }
}

console.log(`\nDone. Sent: ${sent} | Failed: ${failed.length} | Remaining pool: ${eligible.length - sent}`);
process.exit(0);
