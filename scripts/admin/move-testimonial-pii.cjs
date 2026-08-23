// One-off: move uid/email off the publicly readable testimonials docs into
// testimonialsPrivate/{sameId}. Handles (uid → email) and ideas (authorUid)
// are readable by any signed-in user, so a public uid on a testimonial would
// let anyone join the two and recover a poster's email.
//
// Usage: node scripts/admin/move-testimonial-pii.cjs        (dry run)
//        node scripts/admin/move-testimonial-pii.cjs --apply
const admin = require('../../functions/node_modules/firebase-admin');
const serviceAccount = require('../../functions/service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const apply = process.argv.includes('--apply');

(async () => {
  const snap = await db.collection('testimonials').get();
  let moved = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    const hasPii = 'uid' in d || 'email' in d;
    console.log(`${doc.id}  approved=${!!d.approved}  uid=${d.uid ? 'yes' : 'no'}  email=${d.email ? 'yes' : 'no'}  name=${JSON.stringify(d.name)}`);
    if (!hasPii) continue;
    moved++;
    if (!apply) continue;
    const batch = db.batch();
    batch.set(db.collection('testimonialsPrivate').doc(doc.id), {
      uid: d.uid ?? null,
      email: d.email ?? null,
      createdAt: d.createdAt ?? admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    batch.update(doc.ref, {
      uid: admin.firestore.FieldValue.delete(),
      email: admin.firestore.FieldValue.delete(),
    });
    await batch.commit();
  }
  console.log(`${snap.size} testimonials, ${moved} ${apply ? 'moved' : 'would move'}.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
