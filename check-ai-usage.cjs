const admin = require('./functions/node_modules/firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./functions/service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkAIUsage(uid) {
  try {
    const usageRef = db.collection('users').doc(uid).collection('meta').doc('aiUsage');
    const usageDoc = await usageRef.get();

    console.log('=== AI Usage Data ===');
    if (usageDoc.exists) {
      const data = usageDoc.data();
      console.log(JSON.stringify(data, null, 2));

      const today = new Date().toISOString().split('T')[0];
      console.log('\nToday:', today);
      console.log('Stored date:', data.date);
      console.log('Match:', data.date === today ? '✅ YES' : '❌ NO (should reset)');

      if (data.count !== undefined) {
        console.log('\n⚠️  Old counter format detected (count field exists)');
        console.log('This needs to be cleared for the new per-feature system to work.');
      }
    } else {
      console.log('✅ No usage data found - counter is clean');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

// Get UID from command line
const uid = process.argv[2];

if (!uid) {
  console.error('Usage: node check-ai-usage.cjs <USER_ID>');
  process.exit(1);
}

checkAIUsage(uid);
