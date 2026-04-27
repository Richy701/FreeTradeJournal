/**
 * One-off script to delete a user by email from Firebase Auth + Firestore.
 *
 * Usage:
 *   npx ts-node scripts/delete-user.ts LaoukiliMohamed@hotmail.com
 *
 * Requires:
 *   - GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account key, OR
 *   - Running on a machine with default Firebase admin credentials
 */

import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

async function deleteUser(email: string) {
  console.log(`Looking up user: ${email}`);

  let userRecord: admin.auth.UserRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      console.log("User not found in Firebase Auth. Checking Firestore...");
      // Check if there's a Firestore doc with this email
      const snapshot = await db.collection("users").where("email", "==", email).get();
      if (snapshot.empty) {
        console.log("No user found in Firestore either. Nothing to delete.");
        return;
      }
      // Delete orphaned Firestore docs
      for (const doc of snapshot.docs) {
        await deleteFirestoreData(doc.id);
      }
      console.log("Done (Firestore only, no Auth account found).");
      return;
    }
    throw err;
  }

  const uid = userRecord.uid;
  console.log(`Found user: ${uid} (${userRecord.displayName || "no name"})`);

  await deleteFirestoreData(uid);

  // Delete Firebase Auth account
  await admin.auth().deleteUser(uid);
  console.log(`Deleted Firebase Auth account`);

  console.log(`\nDone. User ${email} fully deleted.`);
}

async function deleteFirestoreData(uid: string) {
  // Delete subcollections
  for (const subcol of ["sync", "meta"]) {
    const snapshot = await db.collection("users").doc(uid).collection(subcol).get();
    for (const doc of snapshot.docs) {
      await doc.ref.delete();
    }
    if (snapshot.docs.length > 0) {
      console.log(`  Deleted ${snapshot.docs.length} docs from users/${uid}/${subcol}`);
    }
  }

  // Delete feedback
  const feedbackSnap = await db.collection("feedback").where("uid", "==", uid).get();
  for (const doc of feedbackSnap.docs) {
    await doc.ref.delete();
  }
  if (feedbackSnap.docs.length > 0) {
    console.log(`  Deleted ${feedbackSnap.docs.length} feedback docs`);
  }

  // Delete testimonials
  const testimonialsSnap = await db.collection("testimonials").where("uid", "==", uid).get();
  for (const doc of testimonialsSnap.docs) {
    await doc.ref.delete();
  }
  if (testimonialsSnap.docs.length > 0) {
    console.log(`  Deleted ${testimonialsSnap.docs.length} testimonial docs`);
  }

  // Delete main user doc
  const userDoc = await db.collection("users").doc(uid).get();
  if (userDoc.exists) {
    await db.collection("users").doc(uid).delete();
    console.log(`  Deleted users/${uid}`);
  }
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx ts-node scripts/delete-user.ts <email>");
  process.exit(1);
}

deleteUser(email).catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
