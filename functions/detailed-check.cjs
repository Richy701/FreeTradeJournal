#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function detailedCheck(uid) {
  console.log(`\n🔍 Detailed check for user: ${uid}\n`);

  const tradesDoc = await db.collection('users').doc(uid).collection('sync').doc('trades').get();
  const accountsDoc = await db.collection('users').doc(uid).collection('sync').doc('accounts').get();

  const tradesData = tradesDoc.data()?.data;
  const accountsData = accountsDoc.data()?.data;

  const trades = JSON.parse(tradesData);
  const accounts = JSON.parse(accountsData);

  console.log(`📊 TRADES (${trades.length} total):`);
  const tradesByAccount = {};
  trades.forEach(trade => {
    const accId = trade.accountId || 'NO_ACCOUNT';
    tradesByAccount[accId] = (tradesByAccount[accId] || 0) + 1;
  });

  Object.entries(tradesByAccount).forEach(([accId, count]) => {
    console.log(`   ${accId}: ${count} trades`);
  });

  console.log(`\n📊 ACCOUNTS (${accounts.length} total):`);
  accounts.forEach(acc => {
    console.log(`   ${acc.id}: ${acc.name} (${acc.type})`);
  });

  console.log('\n🔍 CHECKING FOR MISMATCHES:');
  Object.keys(tradesByAccount).forEach(accId => {
    const accountExists = accounts.some(a => a.id === accId);
    if (!accountExists && accId !== 'NO_ACCOUNT') {
      console.log(`   ❌ ${accId}: ${tradesByAccount[accId]} trades ORPHANED (account missing)`);
    } else {
      console.log(`   ✅ ${accId}: ${tradesByAccount[accId]} trades OK`);
    }
  });

  // Check if we need to create missing accounts
  const missingAccountIds = Object.keys(tradesByAccount).filter(accId =>
    accId !== 'NO_ACCOUNT' && !accounts.some(a => a.id === accId)
  );

  if (missingAccountIds.length > 0) {
    console.log('\n⚠️  MISSING ACCOUNTS NEED TO BE CREATED:');
    missingAccountIds.forEach(accId => {
      console.log(`   - ${accId} (${tradesByAccount[accId]} trades)`);
    });
  }

  console.log('');
  process.exit(0);
}

const uid = process.argv[2] || '3DEOK9ErieSSyhwzjPPm2RapYKh2';
detailedCheck(uid).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
