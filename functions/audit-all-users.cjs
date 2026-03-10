#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function auditAllUsers() {
  console.log('\n🔍 Auditing all Pro users for account ID mismatches...\n');

  const usersSnapshot = await db.collection('users').get();

  let totalUsers = 0;
  let proUsers = 0;
  let usersWithIssues = [];

  for (const userDoc of usersSnapshot.docs) {
    totalUsers++;
    const uid = userDoc.id;
    const userData = userDoc.data();

    // Check if user is Pro
    if (!userData.isPro) continue;
    proUsers++;

    try {
      // Get trades and accounts from sync collection
      const tradesDoc = await db.collection('users').doc(uid).collection('sync').doc('trades').get();
      const accountsDoc = await db.collection('users').doc(uid).collection('sync').doc('accounts').get();

      if (!tradesDoc.exists || !accountsDoc.exists) continue;

      const tradesData = tradesDoc.data()?.data;
      const accountsData = accountsDoc.data()?.data;

      if (!tradesData || !accountsData) continue;

      // Parse the data
      let trades, accounts;
      try {
        trades = JSON.parse(tradesData);
        accounts = JSON.parse(accountsData);
      } catch (e) {
        console.warn(`⚠️  ${uid}: Failed to parse data`);
        continue;
      }

      // Skip if no trades
      if (!Array.isArray(trades) || trades.length === 0) continue;

      // Get unique account IDs from trades
      const tradeAccountIds = new Set(trades.map(t => t.accountId).filter(Boolean));

      // Get account IDs from accounts
      const accountIds = new Set(accounts.map(a => a.id).filter(Boolean));

      // Check for mismatch
      const orphanedAccountIds = [...tradeAccountIds].filter(id => !accountIds.has(id));

      if (orphanedAccountIds.length > 0) {
        const issue = {
          uid,
          email: userData.email || 'unknown',
          tradesCount: trades.length,
          tradeAccountIds: [...tradeAccountIds],
          existingAccountIds: [...accountIds],
          orphanedAccountIds,
        };
        usersWithIssues.push(issue);

        console.log(`❌ ISSUE FOUND:`);
        console.log(`   User: ${uid}`);
        console.log(`   Email: ${issue.email}`);
        console.log(`   Trades: ${issue.tradesCount}`);
        console.log(`   Trades reference accounts: ${issue.tradeAccountIds.join(', ')}`);
        console.log(`   Existing accounts: ${issue.existingAccountIds.join(', ')}`);
        console.log(`   Orphaned account IDs: ${issue.orphanedAccountIds.join(', ')}`);
        console.log('');
      }
    } catch (err) {
      console.warn(`⚠️  ${uid}: Error checking - ${err.message}`);
    }
  }

  console.log('\n📊 AUDIT SUMMARY:');
  console.log(`   Total users: ${totalUsers}`);
  console.log(`   Pro users: ${proUsers}`);
  console.log(`   Users with account ID mismatches: ${usersWithIssues.length}`);

  if (usersWithIssues.length > 0) {
    console.log('\n⚠️  AFFECTED USERS:');
    usersWithIssues.forEach(issue => {
      console.log(`   - ${issue.email} (${issue.tradesCount} trades orphaned)`);
    });
  } else {
    console.log('\n✅ No account ID mismatches found!');
  }

  console.log('');
  process.exit(0);
}

auditAllUsers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
