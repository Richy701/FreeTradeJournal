#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixAccount(uid) {
  console.log(`\n🔧 Fixing account for user: ${uid}\n`);

  // The correct account that matches the trades
  const correctAccount = [{
    "id": "account-1771956481668",
    "name": "Main Account",
    "type": "demo",
    "broker": "Demo Broker",
    "currency": "USD",
    "initialBalance": 10000,
    "createdAt": "2024-12-25T12:54:41.668Z"
  }];

  const accountsData = JSON.stringify(correctAccount);

  await db.collection('users').doc(uid).collection('sync').doc('accounts').set({
    data: accountsData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✅ Fixed accounts in Firestore');
  console.log('Account ID now matches trades:', correctAccount[0].id);
  console.log('\n👉 Refresh the app to see your 139 trades!\n');

  process.exit(0);
}

const uid = process.argv[2] || '3DEOK9ErieSSyhwzjPPm2RapYKh2';
fixAccount(uid).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
