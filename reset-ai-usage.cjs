const admin = require('./functions/node_modules/firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./functions/service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function resetAIUsage(uid) {
  try {
    const usageRef = db.collection('users').doc(uid).collection('meta').doc('aiUsage');
    const usageDoc = await usageRef.get();

    console.log('Current AI usage data:');
    if (usageDoc.exists) {
      console.log(JSON.stringify(usageDoc.data(), null, 2));
    } else {
      console.log('No usage data found');
    }

    // Delete the old counter to reset
    await usageRef.delete();
    console.log('\n✅ AI usage counter reset successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

// Get UID from command line or use default
const uid = process.argv[2];

if (!uid) {
  console.error('Usage: node reset-ai-usage.cjs <USER_ID>');
  process.exit(1);
}

resetAIUsage(uid);
