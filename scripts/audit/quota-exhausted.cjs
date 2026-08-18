// Q4: how many users exhausted the monthly free AI quota, and in which week of
// their life. Firestore keeps only {month, count} on users/{uid}/meta/freeAiUsage
// (no timestamp of the 20th call, previous months overwritten). So this can say
// "at 20 in the last month they used AI" and compare that month to signup month;
// week-of-life is NOT captured. Read-only.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=... node scripts/audit/quota-exhausted.cjs
'use strict';
const { db, iterUsers, toMillis } = require('./_lib.cjs');
const LIMIT = 20; // FREE_AI_MONTHLY_LIMIT in functions/src/index.ts

(async () => {
  const created = new Map();
  for await (const doc of iterUsers(['createdAt'])) created.set(doc.id, toMillis(doc.data().createdAt));
  const snap = await db.collectionGroup('meta').get();
  let counters = 0, exhausted = 0;
  const byMonth = {}, byLifeMonth = {}, hist = {};
  for (const d of snap.docs) {
    if (d.id !== 'freeAiUsage') continue;
    const { month, count } = d.data() || {};
    if (!month) continue;
    counters++;
    const c = Number(count) || 0;
    const b = c >= LIMIT ? '20 (exhausted)' : c >= 10 ? '10-19' : c >= 5 ? '5-9' : c >= 1 ? '1-4' : '0';
    hist[b] = (hist[b] || 0) + 1;
    if (c < LIMIT) continue;
    exhausted++;
    byMonth[month] = (byMonth[month] || 0) + 1;
    const uid = d.ref.parent.parent.id;
    const cr = created.get(uid);
    if (cr) {
      const signupMonth = new Date(cr).toISOString().slice(0, 7);
      const [y1, m1] = signupMonth.split('-').map(Number), [y2, m2] = month.split('-').map(Number);
      const diff = (y2 - y1) * 12 + (m2 - m1);
      const k = diff <= 0 ? 'signup month' : diff === 1 ? 'month 2' : `month ${diff + 1}`;
      byLifeMonth[k] = (byLifeMonth[k] || 0) + 1;
    }
  }
  console.log(`freeAiUsage counters: ${counters}; usage histogram (last month used): ${JSON.stringify(hist)}`);
  console.log(`exhausted (count >= ${LIMIT}) in their most recent AI month: ${exhausted}`);
  console.log(`  by calendar month: ${JSON.stringify(byMonth)}`);
  console.log(`  by month-of-life (signup month vs exhaustion month): ${JSON.stringify(byLifeMonth)}`);
  console.log('\nNOT CAPTURED: week of life (no timestamp on the counter), and any earlier month that was overwritten.');
})().catch((e) => { console.error(e); process.exit(1); });
