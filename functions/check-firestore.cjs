#!/usr/bin/env node

// Script to check Firestore data for a user
const admin = require('firebase-admin');

// Initialize with the same credentials as Cloud Functions
const serviceAccount = require('../functions/service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUserData(uid) {
  console.log(`\n🔍 Checking Firestore data for user: ${uid}\n`);

  const syncKeys = ['trades', 'accounts', 'journalEntries', 'goals', 'riskRules', 'onboardingCompleted', 'onboarding'];

  for (const key of syncKeys) {
    const doc = await db.collection('users').doc(uid).collection('sync').doc(key).get();

    if (doc.exists) {
      const data = doc.data();
      console.log(`✅ ${key}:`);
      if (data.data) {
        const preview = data.data.length > 100 ? data.data.substring(0, 100) + '...' : data.data;
        console.log(`   Length: ${data.data.length} chars`);
        console.log(`   Preview: ${preview}`);

        // Check if it's empty array/object
        if (data.data === '[]' || data.data === '{}' || data.data === '') {
          console.log(`   ⚠️  WARNING: Empty data!`);
        }
      } else {
        console.log(`   ⚠️  No data field`);
      }
      if (data.updatedAt) {
        console.log(`   Updated: ${data.updatedAt.toDate().toISOString()}`);
      }
      console.log('');
    } else {
      console.log(`❌ ${key}: Document does not exist\n`);
    }
  }

  process.exit(0);
}

const uid = process.argv[2] || '3DEOK9ErieSSyhwzjPPm2RapYKh2';
checkUserData(uid).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
