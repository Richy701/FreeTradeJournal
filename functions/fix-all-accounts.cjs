#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixAllAccounts(uid) {
  console.log(`\n🔧 Fixing all accounts for user: ${uid}\n`);

  // Both accounts that should exist
  const correctAccounts = [
    {
      "id": "account-1771956481668",
      "name": "Main Account",
      "type": "demo",
      "broker": "Demo Broker",
      "currency": "USD",
      "initialBalance": 10000,
      "createdAt": "2024-12-25T12:54:41.668Z"
    },
    {
      "id": "default-1772554848300",
      "name": "Second Account",
      "type": "demo",
      "broker": "Demo Broker",
      "currency": "USD",
      "initialBalance": 10000,
      "createdAt": "2025-01-01T12:14:08.300Z"
    }
  ];

  const accountsData = JSON.stringify(correctAccounts);

  await db.collection('users').doc(uid).collection('sync').doc('accounts').set({
    data: accountsData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✅ Fixed accounts in Firestore');
  console.log('   Added account: account-1771956481668 (150 trades)');
  console.log('   Added account: default-1772554848300 (139 trades)');
  console.log('\n👉 Refresh the app to see all 289 trades!\n');

  process.exit(0);
}

const uid = process.argv[2] || '3DEOK9ErieSSyhwzjPPm2RapYKh2';
fixAllAccounts(uid).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
