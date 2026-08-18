// Shared helpers for the read-only audit scripts in scripts/audit/.
// Credentials: GOOGLE_APPLICATION_CREDENTIALS must point at a service-account JSON.
// Nothing in this directory writes to Firestore.
'use strict';

let admin;
try {
  admin = require('../../functions/node_modules/firebase-admin');
} catch {
  admin = require('firebase-admin');
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path.');
  process.exit(1);
}
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}
const db = admin.firestore();

// Mirrors functions/src/index.ts resolveSyncDoc: values > 250k chars are split
// across `${key}.c{i}` docs behind a {chunked, chunkCount} manifest.
async function readSyncValue(uid, key) {
  const col = db.collection('users').doc(uid).collection('sync');
  const snap = await col.doc(key).get();
  if (!snap.exists) return null;
  const d = snap.data() || {};
  if (!d.chunked) return typeof d.data === 'string' ? d.data : null;
  const n = Number(d.chunkCount) || 0;
  if (n <= 0 || n > 100) return null;
  const parts = await Promise.all(
    Array.from({ length: n }, (_, i) => col.doc(`${key}.c${i}`).get())
  );
  if (parts.some((p) => !p.exists)) return null;
  return parts.map((p) => String(p.data()?.part ?? '')).join('');
}

// Iterate every users/{uid} doc in pages. `fields` limits the projection.
async function* iterUsers(fields, pageSize = 1000) {
  let last = null;
  for (;;) {
    let q = db.collection('users').orderBy(admin.firestore.FieldPath.documentId()).limit(pageSize);
    if (fields && fields.length) q = q.select(...fields);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) return;
    for (const doc of snap.docs) yield doc;
    last = snap.docs[snap.docs.length - 1];
    if (snap.size < pageSize) return;
  }
}

function toMillis(v) {
  if (!v) return null;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v === 'string') { const t = Date.parse(v); return Number.isNaN(t) ? null : t; }
  if (typeof v === 'number') return v;
  if (v._seconds) return v._seconds * 1000;
  return null;
}

// Trade ids embed their creation time: manual = Date.now().toString()
// (src/pages/TradeLog.tsx), CSV/screenshot = `${prefix}-${Date.now()}-${i}`
// (src/utils/import-trades.ts). This is the only "logged at" signal a trade carries.
function tradeCreatedAtMs(id) {
  if (typeof id !== 'string') return null;
  if (/^\d{12,14}$/.test(id)) return Number(id);
  const m = id.match(/-(\d{12,14})-\d+$/);
  if (m) return Number(m[1]);
  return null;
}

const DAY = 24 * 60 * 60 * 1000;

module.exports = { admin, db, readSyncValue, iterUsers, toMillis, tradeCreatedAtMs, DAY };
