// Q1: accounts with >=10 trades logged.
// Q2: of those, how many logged a trade 30+ days after signup.
//
// What Firestore actually holds:
//  - users/{uid}.tradesLoggedCount  — server counter incremented by the
//    trackTradeLogged callable (functions/src/index.ts ~1882) since 2026-06-23.
//    Never decremented; imports add in bulk; nothing before Jun 23 is counted.
//  - users/{uid}/sync/trades        — the FULL trade array, but only for users
//    who were entitled Pro (paid, card trial, referral grant, or the old 14-day
//    signup trial) at some point: syncData rejects non-Pro (index.ts ~4910).
//    Snapshot freezes when entitlement lapses. Trade ids embed creation time.
//  - Firebase Auth lastRefreshTime   — last token refresh; a "still opens the
//    app" proxy, NOT "logged a trade".
// Read-only. Usage: GOOGLE_APPLICATION_CREDENTIALS=... node scripts/audit/trades-10plus.cjs
'use strict';
const { admin, iterUsers, readSyncValue, toMillis, tradeCreatedAtMs, DAY } = require('./_lib.cjs');

(async () => {
  const users = [];
  for await (const doc of iterUsers(['createdAt', 'tradesLoggedCount', 'firstTradeLoggedAt', 'isPro', 'subscription', 'trialProExpiresAt', 'referralProExpiresAt', 'signupThrottled'])) {
    users.push({ uid: doc.id, ...doc.data() });
  }
  const total = users.length;
  const real = users.filter((u) => !u.signupThrottled);
  const activated = real.filter((u) => u.firstTradeLoggedAt);
  const tenPlus = real.filter((u) => Number(u.tradesLoggedCount) >= 10);
  console.log(`users docs: ${total} (excluding signupThrottled: ${real.length})`);
  console.log(`firstTradeLoggedAt set (activated): ${activated.length}`);
  console.log(`tradesLoggedCount >= 10 (server counter, since 2026-06-23): ${tenPlus.length}`);
  const buckets = { '1-9': 0, '10-49': 0, '50-199': 0, '200+': 0 };
  for (const u of real) {
    const c = Number(u.tradesLoggedCount) || 0;
    if (c >= 200) buckets['200+']++; else if (c >= 50) buckets['50-199']++; else if (c >= 10) buckets['10-49']++; else if (c >= 1) buckets['1-9']++;
  }
  console.log('tradesLoggedCount distribution:', buckets);

  // Q2a — Auth lastRefreshTime as "still active 30+ days after signup" (proxy only)
  const auth = admin.auth();
  const lastRefresh = new Map();
  let token;
  do {
    const page = await auth.listUsers(1000, token);
    for (const u of page.users) lastRefresh.set(u.uid, { created: Date.parse(u.metadata.creationTime), refreshed: u.metadata.lastRefreshTime ? Date.parse(u.metadata.lastRefreshTime) : null });
    token = page.pageToken;
  } while (token);
  let active30 = 0, eligible = 0;
  for (const u of tenPlus) {
    const a = lastRefresh.get(u.uid);
    if (!a) continue;
    if (Date.now() - a.created < 30 * DAY) continue; // not old enough to be judged
    eligible++;
    if (a.refreshed && a.refreshed - a.created >= 30 * DAY) active30++;
  }
  console.log(`\nOf the ${tenPlus.length} 10+ users, ${eligible} are >=30 days old; ${active30} refreshed an auth token 30+ days after signup (PROXY for still using the app, not for logging a trade).`);

  // Q2b — real trade timestamps, only where a synced trades doc exists
  let synced = 0, syncedTen = 0, syncedTen30 = 0, syncedAny30 = 0;
  const syncEver = real.filter((u) => u.isPro || u.subscription || u.trialProExpiresAt || u.referralProExpiresAt);
  console.log(`\nUsers ever entitled Pro (could have synced): ${syncEver.length}. Reading users/{uid}/sync/trades ...`);
  for (const u of syncEver) {
    const raw = await readSyncValue(u.uid, 'trades');
    if (!raw) continue;
    let arr; try { arr = JSON.parse(raw); } catch { continue; }
    if (!Array.isArray(arr) || arr.length === 0) continue;
    synced++;
    const signup = toMillis(u.createdAt) || lastRefresh.get(u.uid)?.created;
    const late = signup ? arr.some((t) => { const c = tradeCreatedAtMs(t && t.id); return c && c - signup >= 30 * DAY; }) : false;
    if (late) syncedAny30++;
    if (arr.length >= 10) { syncedTen++; if (late) syncedTen30++; }
  }
  console.log(`synced trades docs with >=1 trade: ${synced}; with >=10 trades: ${syncedTen}; of those, a trade CREATED 30+ days after signup: ${syncedTen30} (any-size: ${syncedAny30})`);
  console.log('\nNOT ANSWERABLE for never-Pro free users: their trades never leave localStorage. Only the counter and Auth proxy exist for them.');
})().catch((e) => { console.error(e); process.exit(1); });
