// Q3: how many users ever invoked a COACHING AI feature.
//
// What Firestore holds (all under users/{uid}/meta/):
//  - freeAiUsage {month:"YYYY-MM", count}     — free-tier monthly counter, ALL
//    features share it, no feature field, overwritten each new month.
//  - aiUsage {date:"YYYY-MM-DD", <feature>:n, lastUsed} — Pro daily counters,
//    per feature, but the doc is REPLACED on the first call of a new day, so
//    only the most recent day's feature mix survives.
//  - screenshotImport {freeUsed, lastUsed}    — free lifetime screenshot count.
// There is no per-request log. "Ever used coaching" is therefore NOT captured;
// this script reports the upper bound (any AI ever) and the Pro last-day mix.
// Read-only. Usage: GOOGLE_APPLICATION_CREDENTIALS=... node scripts/audit/ai-users.cjs
'use strict';
const { db } = require('./_lib.cjs');

// Deliberate coaching = the user clicked something asking for AI insight.
const COACHING = new Set(['ai_analysis', 'coach_chat', 'trade_review', 'journal_review', 'goal_coach', 'position_check', 'strategy_tagger', 'prop_tracker']);
// Auto-fired without a click: dashboard coach tips (trading-coach.tsx), risk
// alert monitor (ai-risk-alert.tsx), on-save journal coach (ai-journal-onsave.tsx),
// journal prompts (ai-journal-prompts.tsx useEffect on trade.id).
const AUTO = new Set(['coaching_tips', 'risk_alert', 'journal_assist', 'journal_prompts']);
const UTILITY = new Set(['csv_mapping', 'import_insight', 'screenshot_import']);

(async () => {
  const snap = await db.collectionGroup('meta').get();
  const byUid = new Map();
  for (const d of snap.docs) {
    const uid = d.ref.parent.parent.id;
    const rec = byUid.get(uid) || {};
    rec[d.id] = d.data();
    byUid.set(uid, rec);
  }
  let anyAi = 0, freeAny = 0, proAny = 0, shotAny = 0;
  const freeByMonth = {};
  const proLastDayFeatures = {};
  let proCoachingLastDay = 0, proUtilityOnlyLastDay = 0, proAutoOnlyLastDay = 0;
  for (const [, m] of byUid) {
    const f = m.freeAiUsage, a = m.aiUsage, s = m.screenshotImport;
    let any = false;
    if (f && Number(f.count) > 0) { freeAny++; any = true; freeByMonth[f.month] = (freeByMonth[f.month] || 0) + 1; }
    if (a && a.date) {
      proAny++; any = true;
      const feats = Object.keys(a).filter((k) => !['date', 'lastUsed', 'count'].includes(k) && Number(a[k]) > 0);
      for (const k of feats) proLastDayFeatures[k] = (proLastDayFeatures[k] || 0) + 1;
      if (feats.some((k) => COACHING.has(k))) proCoachingLastDay++;
      else if (feats.length && feats.every((k) => AUTO.has(k))) proAutoOnlyLastDay++;
      else if (feats.length && feats.every((k) => UTILITY.has(k) || AUTO.has(k))) proUtilityOnlyLastDay++;
    }
    if (s && Number(s.freeUsed) > 0) { shotAny++; any = true; }
    if (any) anyAi++;
  }
  console.log(`meta docs: ${snap.size} across ${byUid.size} users`);
  console.log(`users with ANY AI usage evidence (upper bound for "ever used coaching"): ${anyAi}`);
  console.log(`  free monthly counter > 0 (last month used):   ${freeAny}  by month: ${JSON.stringify(freeByMonth)}`);
  console.log(`  Pro/trial daily doc present (last day used):  ${proAny}`);
  console.log(`     last-day feature mix (users):               ${JSON.stringify(proLastDayFeatures)}`);
  console.log(`     deliberate coaching feature on last day: ${proCoachingLastDay}; auto-fired only (coach tips/risk alert/on-save): ${proAutoOnlyLastDay}; utility(+auto) only: ${proUtilityOnlyLastDay}`);
  console.log(`  free screenshot import used:                  ${shotAny}`);
  console.log('\nNOT CAPTURED: which feature a free user ran (single shared counter), and any history beyond the last month/day.');
})().catch((e) => { console.error(e); process.exit(1); });
