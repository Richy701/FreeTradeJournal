// READ-ONLY: referral program state. Who has referred whom, how many referrals
// were counted, and whether anyone has been granted referral Pro (tiers).
// Run from the repo root:
//   GOOGLE_APPLICATION_CREDENTIALS=<key.json> node scripts/audit/referrals.cjs
'use strict';
const path = require('path');
const { iterUsers, toMillis } = require(path.join(process.cwd(), 'scripts/audit/_lib.cjs'));

const fmt = (v) => { const ms = toMillis(v); return ms ? new Date(ms).toISOString().slice(0, 10) : '-'; };

(async () => {
  const users = new Map();
  for await (const doc of iterUsers(['email', 'displayName', 'createdAt', 'referredBy', 'referralCounted', 'referralCount', 'referralTiersGranted', 'referralProExpiresAt', 'referralCode', 'firstTradeLoggedAt', 'isPro', 'plan'])) {
    users.set(doc.id, { uid: doc.id, ...doc.data() });
  }
  const all = [...users.values()];
  const referred = all.filter((u) => u.referredBy);
  const rewarded = all.filter((u) => (u.referralTiersGranted && u.referralTiersGranted.length) || u.referralProExpiresAt);
  const referrers = all.filter((u) => (u.referralCount || 0) > 0 || referred.some((r) => r.referredBy === u.uid || r.referredBy === u.referralCode));

  console.log(`users scanned ${all.length} | referred signups ${referred.length} | referrers with >=1 counted ${all.filter((u) => (u.referralCount || 0) > 0).length}`);
  console.log(`\nREWARDED (referral Pro granted): ${rewarded.length}`);
  for (const u of rewarded) {
    const exp = u.referralProExpiresAt ? new Date(u.referralProExpiresAt) : null;
    console.log(`  ${u.email} | tiers ${JSON.stringify(u.referralTiersGranted || [])} | count ${u.referralCount || 0} | pro until ${exp ? exp.toISOString().slice(0, 10) : '-'} ${exp && exp > new Date() ? '(ACTIVE)' : '(expired)'} | paid isPro ${!!u.isPro}`);
  }

  console.log('\nREFERRERS (counted / total referees):');
  const byRef = new Map();
  for (const r of referred) {
    const key = r.referredBy;
    if (!byRef.has(key)) byRef.set(key, []);
    byRef.get(key).push(r);
  }
  const rows = [...byRef.entries()].map(([key, refs]) => {
    const ref = users.get(key) || all.find((u) => u.referralCode === key);
    return { name: ref ? ref.email : `unknown(${key})`, count: ref ? ref.referralCount || 0 : 0, refs };
  }).sort((a, b) => b.refs.length - a.refs.length);
  for (const r of rows) {
    console.log(`  ${r.name}: counted ${r.count} / ${r.refs.length} referees`);
    for (const x of r.refs) console.log(`      ${x.email} | signed up ${fmt(x.createdAt)} | first trade ${fmt(x.firstTradeLoggedAt)} | counted ${x.referralCounted === true}`);
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
