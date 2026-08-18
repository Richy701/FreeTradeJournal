# FreeTradeJournal monetisation audit

Date: 2026-08-18. Read-only. Sources: the code as of `e0392c6`, read-only queries against production Firestore and Firebase Auth (scripts in `scripts/audit/`, run with the service account), and 30 days of Cloud Functions execution logs (`gcloud logging read`, project `tradevault-41c68`, 2026-07-19 to 2026-08-18). No writes were made. Nothing in the app was changed.

Ground truth that frames everything below: Firebase Auth holds **2,692 accounts** (not ~5,000; 2,703 `users/` docs, 11 orphaned by deletions). Signups by month: Aug 465 (to date), Jul 843, Jun 836, May 219, earlier 329. `isPro` today = 7 (5 lifetime, 2 card trials in progress, 0 active recurring subscriptions).

Sections are ordered by how much they would change a decision.

---

## 1. Numbers you asked for (Part 3, answered where the data exists)

| Question | Answer | Basis and caveat |
|---|---|---|
| Accounts with >=10 trades logged | **204** (of 2,703 user docs) | `users/{uid}.tradesLoggedCount`, a server counter that only exists since 2026-06-23 (`functions/src/index.ts:1882-1911`). Never decremented, imports count in bulk. Distribution: 1-9 = 375, 10-49 = 108, 50-199 = 64, 200+ = 32. Users who logged everything before Jun 23 are missed. `firstTradeLoggedAt` (any trade ever) = 656. |
| Of those, logged a trade 30+ days after signup | **Not captured for free users.** Proxy: of the 204, 104 accounts are >=30 days old and **40** of them refreshed an auth token 30+ days after signup (still opening the app, not necessarily logging). Where trades are actually on the server (Pro / trial snapshots, 345 users): 125 have >=10 trades and **7** of those logged one 30+ days after signup (section 5). | Free users' trades never leave localStorage (`syncData` rejects non-Pro, `index.ts:4909-4912`). No `lastActiveAt` exists anywhere. Trades carry no `createdAt`; the only logged-at signal is the epoch-ms embedded in the trade id (`TradeLog.tsx:600`, `utils/import-trades.ts:150`), which is only readable where a `sync/trades` doc exists (Pro / trial users). PostHog server event `trade logged` (uid, since Jun 23) is the real answer source and lives outside Firestore. |
| Users who ever invoked a COACHING AI feature | **Not captured.** Upper bound: **603** users have any AI usage evidence at all. Of the 427 users with a Pro/trial daily doc, the last day they used AI shows a *deliberate* coaching feature for **53**, auto-fired-only (dashboard coach tips, journal prompts after saving a trade, risk alert, on-save journal coach) for **281**, utility (+auto) only for 93. | Free-tier counter `meta/freeAiUsage {month,count}` has no feature field. Pro-tier `meta/aiUsage` is overwritten on the first call of each new day, so only the last day's feature mix survives. No per-request log, no timestamps except one `lastUsed`. |
| Users who exhausted the monthly AI quota, and in which week of life | **40** users sit at 20/20 in their most recent AI month (34 in Aug so far, 6 in Jul). Month-of-life: signup month 20, month 2 = 11, month 3 = 7, month 4 = 2. **Week of life not captured** (no timestamp on the counter; previous months overwritten). Free counters overall: 288 users; histogram 1-4 = 138, 5-9 = 63, 10-19 = 47, 20 = 40. | `users/{uid}/meta/freeAiUsage`. Cloud logs add: 1,556 quota-denied (HTTP 403) `aiAssist` calls in 30 days, but 1,550 of them came from one client in one minute (2026-08-17 01:30 UTC) — a retry loop, not 1,550 users. Excluding it, quota denials are ~1 per week. |
| Trials started vs converted, before/after 8 Aug 2026 | Card trials (Stripe, `hadTrial` + `subscription`): **before Aug 8: 4 started, 0 converted** (3 expired, 1 bought lifetime instead); **after Aug 8: 2 started, 0 converted yet** (both `on_trial`, charge dates Aug 23 and Aug 26). Card-less signup trials (`trialProExpiresAt`, minted for every signup until Aug 7): **2,432 started; 3 of them are Pro today**; no conversion marker exists for that trial type. | Conversion is inferred (`hadTrial && status in active/past_due && plan != lifetime`) because the webhook writes no `convertedAt`. `hadTrial` is also set on tombstone re-signups (5 such docs, no subscription) — excluded. |

Scripts: `scripts/audit/trades-10plus.cjs`, `ai-users.cjs`, `quota-exhausted.cjs`, `trials.cjs` (all read-only, `GOOGLE_APPLICATION_CREDENTIALS` required, see `scripts/audit/README.md`).

### Minimum events to start logging (name and fields only)

- `ai_call` — `uid, feature, class(utility|coaching|auto), model, tokensIn, tokensOut, tier(free|pro|trial), denied(bool), at`
- `trade_logged` — `uid, count, source(manual|csv|screenshot|mt), accountId, at` (exists in PostHog only; needs a Firestore or warehouse copy with `at`)
- `journal_entry_saved` — `uid, entryCount, at`
- `gate_hit` — `uid, gate(journal_cap|account_cap|prop_cap|analytics_window|ai_quota|screenshot_quota|pdf|theme_studio|sync), tier, at`
- `trial_started` / `trial_converted` / `trial_ended` — `uid, trialType(card|signup|referral), plan, startedAt, endsAt, outcome`
- `session_seen` — `uid, at` (daily-deduped last-active marker; today the only proxy is Firebase Auth `lastRefreshTime`)

---

## 2. Where the AI budget actually goes (Part 2)

### Call sites

All model calls are in `functions/src/index.ts`. Client wrappers: `src/services/ai-assist.ts` (callable `aiAssist`), `src/services/ai-analysis.ts` (callables `analyzeTradesAI`, `parseScreenshot`, prop analysis via `aiAssist`), `src/hooks/use-streaming-ai.ts` (HTTP `aiStream`), `src/lib/csv-ai-mapping.ts` (`suggestCsvMapping`). Models: `FEATURE_MODELS` at `index.ts:3278-3292`; prices in the code comment at `index.ts:3271-3277` (Luna $0.20 in / $1.20 out per M tokens, Terra $2 / $12).

| Feature | Server entry (file:line) | Trigger on the client | Model | Approx tokens in / out (max) | Class |
|---|---|---|---|---|---|
| Trade screenshot import | `parseScreenshot` `index.ts:4559-4760` | user uploads image, `screenshot-trade-import-dialog.tsx:88` | gpt-5.6-luna (vision) | ~9,000 (8.4k image) / up to 6,000 | UTILITY |
| PropTracker billing/payout screenshot | same, `importType billing|payout` | `PropTracker.tsx:484` (Pro only) | luna | ~9,000 / 1,500 | UTILITY |
| CSV AI column mapping | `suggestCsvMapping` `index.ts:3586-3695` | unrecognised CSV, Pro only, `utils/csv-import-flow.ts:40` | luna | ~500 / 400 | UTILITY |
| Import first read | `aiAssist import_insight`, builder `index.ts:3783` | after CSV import, `import-insight-dialog.tsx:111` (streams) | luna | ~800 / 450 | UTILITY |
| Coaching tips (dashboard Coach FTJ card) | `aiAssist coaching_tips`, builder `index.ts:4096` | **auto**: dashboard widget effect, refetches whenever trade count or total P&L changes, 24h cache (`trading-coach.tsx:895-1010`) | luna | ~1,600 / 600 | COACHING (auto) |
| Journal prompts | `aiAssist journal_prompts`, builder `index.ts:3720` | **auto**: fires after every manual trade save (`TradeLog.tsx:641` -> `ai-journal-prompts.tsx:43-53`) | luna | ~250 / 300 | COACHING (auto) |
| Risk alert advice | `aiAssist risk_alert`, builder `index.ts:3919` | **auto** when a pattern is detected on Trade Log, re-runs on `tradesUpdated`/`storage` events (`ai-risk-alert.tsx:239-251`) | luna | ~450 / 400 | COACHING (auto) |
| Journal on-save coach / Ask Coach | `aiAssist journal_assist`, builder `index.ts:3836` | **auto** on saving an entry >=80 chars (`ai-journal-onsave.tsx:36`); manual "Ask Coach" (`Journal.tsx:337`) | luna | ~700 / 220 | COACHING (auto + manual) |
| Coach FTJ chat | `aiAssist coach_chat` (streams via `aiStream`), builder `index.ts:4221` | user types a message, `trading-coach.tsx:585` | luna | ~2,000 / 600 | COACHING |
| AI Trade Analysis | `analyzeTradesAI` `index.ts:3464` and `aiStream` analysis branch `index.ts:5285`, prompt `buildAnalysisPrompts` `index.ts:3095` | button, `ai-analysis.tsx:275` (streams; the callable had 0 invocations in 30 days) | **gpt-5.6-terra** | ~3,400 (50 trades) / 2,000 | COACHING |
| Trade review | `aiAssist trade_review`, builder `index.ts:3875` | per-trade button, `ai-trade-review.tsx:80` (streams) | **terra** | ~700 / 500 | COACHING |
| Journal review | `aiAssist journal_review`, builder `index.ts:3734` | button (desktop only), `ai-journal-review.tsx:93` (streams) | luna | ~4,000 / 700 | COACHING |
| Goal coach | `aiAssist goal_coach`, builder `index.ts:4026` | button, `ai-goal-coach.tsx:256` (streams) | luna | ~1,500 / 500 | COACHING |
| Position check | `aiAssist position_check`, builder `index.ts:3952` | calculator button, `position-check-ai.tsx:73` | luna | ~600 / 300 | COACHING |
| Strategy tagger | `aiAssist strategy_tagger`, builder `index.ts:3985` | button, batches of 15, `ai-strategy-tagger.tsx:122` | luna | ~700 / 600 per batch | COACHING |
| PropTracker AI analysis | `aiAssist prop_tracker`, builder `index.ts:4305` | button, `PropTracker.tsx:419` | luna | up to ~8,000 / 1,200 | COACHING |

Token figures are estimates from the prompt templates and input caps in the builders (each builder clips its inputs; `max_completion_tokens` is the "out" cap). Nothing records real token usage anywhere.

### What the logs say happened in the last 30 days

| Function | Successful (HTTP 200) | Quota-denied (403) | Notes |
|---|---|---|---|
| `aiAssist` (callable: coaching_tips, journal_prompts, risk_alert, journal_assist, position_check, strategy_tagger, prop_tracker) | **5,879** (~196/day) | 1,556 (1,550 in one minute on Aug 17) | 2-14 s durations, i.e. real completions |
| `aiStream` (analysis, trade_review, journal_review, goal_coach, coach_chat, import_insight) | **524** (~17/day) | 1 | this is the deliberate, user-clicked coaching path |
| `suggestCsvMapping` | 161 | 0 | Pro/trial only |
| `parseScreenshot` | 19 | 0 (1 x 429) | shipped Aug 15 |
| `analyzeTradesAI` | 0 | 0 | superseded by the streaming path |

So roughly **92% of AI completions come from the callable path, which is dominated by features that fire without a click** (the last-day feature mix on 427 Pro/trial usage docs: coaching_tips 331 users, journal_prompts 99, risk_alert 38, journal_assist 19; versus trade_review 25, coach_chat 16, goal_coach 9, journal_review 6, ai_analysis 4). The paid-for coaching path is ~17 calls a day across the whole user base.

### The single counter

For free users every one of the 13 `aiAssist`/`aiStream`/`analyzeTradesAI` feature types is charged to the same document, `users/{uid}/meta/freeAiUsage {month, count}`, by `checkAndIncrementFreeAI` (`index.ts:3396-3415`, called at `:3481`, `:4462`, `:5264`), capped by `FREE_AI_MONTHLY_LIMIT = 20` (`:3360`). There is no feature argument; it does not know what it is charging for. Two utility features already sit outside it: CSV mapping is Pro-only (never charged to the free counter) and free trade-screenshot imports use their own lifetime doc `meta/screenshotImport.freeUsed` (cap 3, `:3311`, `:4600-4634`). Pro users are on per-feature daily counters in `meta/aiUsage` (`RATE_LIMITS`, `:3246-3261`), so the shared-counter problem is a free-tier problem only.

Consequence, in numbers a free user experiences: saving one trade costs one credit (journal prompts fire on save), the next dashboard visit costs another (coach tips refetch because the trade fingerprint changed), and a losing streak costs a third (risk alert). A free user who logs one trade a day and never opens an AI feature exhausts 20 credits in about 10 trading days. Journal prompts and coach tips have no client-side quota gate at all (`ai-journal-onsave.tsx:32`, `import-insight-dialog.tsx:41`, `position-check-ai.tsx`), and the client's `hasAIAccess` (`pro-context.tsx:280`) only knows the quota state it last fetched, which is why a stale tab looped 1,550 denied calls on Aug 17 (`ai-risk-alert.tsx` re-runs `detectPatterns` on every `storage`/`tradesUpdated` event and its error path never caches or updates the quota; unverified which component, but that is the only auto-caller whose failure path re-arms itself).

### What would have to change for separate allowances (design only, not implemented)

1. A server-side classification map `FEATURE_CLASS: Record<FeatureType | 'screenshot_import', 'utility' | 'coaching' | 'auto'>` next to `FEATURE_MODELS`.
2. `checkAndIncrementFreeAI(uid, cls)` charging `freeAiUsage.{cls}` (or `freeAiUsage.counts[cls]`) with per-class limits (`FREE_LIMITS = { utility, coaching, auto }`), and `refundAiUsage` made class-aware; `getFreeAIQuota` returns all classes.
3. The three callers (`analyzeTradesAI`, `aiAssist`, `aiStream`) pass the class; `parseScreenshot`'s existing lifetime counter can either fold into `utility` or stay separate.
4. Client: `freeAiQuota` in `pro-context.tsx` becomes per-class; `hasAIAccess` takes a class; the auto-fired components (`trading-coach.tsx`, `ai-journal-prompts.tsx`, `ai-risk-alert.tsx`, `ai-journal-onsave.tsx`) check the `auto` class and update quota state on 403 so they stop retrying; `pro-gate.tsx` and the coach quota copy show the class that applies.
5. A migration is not needed: old `{month, count}` docs can be read as `coaching` and the new fields start at 0.
6. Decide separately whether auto-fired calls should draw from the free allowance at all; today they are the majority of it.

---

## 3. The paywall as enforced (Part 1)

Server Pro decision is a Firestore read, not a custom claim: `isEntitledPro(users/{uid})` = `isPro` (webhook-owned) or unexpired `trialProExpiresAt` / `referralProExpiresAt` (`index.ts:3388-3394`). Clients cannot write `users/{uid}`, `meta/*` or `sync/*` (`firestore.rules:34-50`, `allow write: if false`). Every limit that is not an AI counter or cloud sync is enforced only in the browser.

| Gate | file:line | Free limit | Pro limit | Enforced | What the user sees |
|---|---|---|---|---|---|
| AI monthly quota (all AI features) | server `index.ts:3360, 3396-3415`; client `pro-context.tsx:45, 280`; UI `pro-gate.tsx:55-105` | 20 calls/month, shared | none (daily caps below) | **server + client** | "You've used all 20 free AI queries this month. Upgrade to Pro for unlimited AI coaching, analysis, and more." Teaser strip "N of 20 free AI queries remaining this month" / lock wall "Get Unlimited AI" |
| AI per-feature daily caps | `index.ts:3246-3261`, enforced `:3486-3510`, `:4467-4509`, `:3600-3620`, `:5287-5299`, `:5363-5375` | n/a | 30 analysis, 30 goal coach, 50 trade review, 30 prop tracker, 75 coach tips, 150 chat, 150 journal prompts, 75 risk alert, 75 position check, 75 tagger, 40 CSV mapping, 10 journal review, 75 journal assist, 20 import insight, 20 screenshots (per UTC day) | **server** | "Daily {feature} limit reached (N/day). Resets at midnight UTC." (toast) |
| Journal entry cap | `constants/pricing.ts:6`; `Journal.tsx:594-599, 1223-1243`; duplicate in `calendar-heatmap.tsx:335-340` | 20 entries total (all accounts) | unlimited | **client only** | Toast "You've reached the free limit of 20 journal entries. Your existing entries are safe — upgrade to Pro for unlimited journaling." + amber banner with Upgrade |
| Trading account cap | `account-context.tsx:14, 219-222`; `Settings.tsx:870-878` | 2 | unlimited | **client only** | Toast "Free plan is limited to 2 trading accounts. Upgrade to Pro for unlimited accounts." |
| PropTracker account cap | `PropTracker.tsx:113, 544-547, 1154-1183` | 1 | unlimited | **client only** | Toast "Free plan is limited to 1 prop firm account…"; header button becomes "Upgrade for More"; card "You've used your free account" |
| Analytics history window | `constants/pricing.ts:11`; `lib/analytics-window.ts:10-25`; `hooks/use-demo-data.ts:60-66`; notices `Dashboard.tsx:820-828`, `TradeIdeas.tsx:80-88` | stats/charts/insights over trailing 30 days; trade log + exports untouched | full history | **client only** | "Stats and charts show your last 30 days (N older trades not included)…" + "Unlock full history with Pro" |
| Dashboard period pills 90D/YTD/All | `dashboard-period.tsx:12, 64-71`; `period-pills.tsx:13-25` | 7D, 30D | all | **client only** | locked pills link to /pricing, title "Longer ranges are a Pro feature" |
| Cloud sync | server `index.ts:4909-4912` (`syncData`), `:5010-5013` (`getSyncData`); client `sync-context.tsx:78-84` | none (local only) | 11 keys, 8 MB/key | **server + client** | "Cloud sync is a Pro feature." / Settings "Want automatic cloud backup?" / dashboard "Your data is stored locally on this device only" |
| CSV export | `TradeLog.tsx:1023, 1396-1437` | **not gated** | same | **nowhere** (marketed as Pro: "Unlimited trade exports", `pricing.ts:37,49,62`; also listed as free at `:79`) | plain Export popover |
| PDF report | `pdf-report-dialog.tsx:137` (ProGate); nudge `TradeLog.tsx:1476-1486` | blocked | unlimited | **client only** (generated in browser) | ProGate wall; the "PDF Report" description string is dead (key mismatch, `pro-gate.tsx:22`), generic AI copy shows instead |
| Theme Studio | `Settings.tsx:673-675` (ProGate); free pickers `theme-studio.tsx:10-14` | 3 basic colours | full theme | **client only** | "Theme Studio — Pro … View Pro Plans" |
| Screenshot trade import | server `index.ts:3311-3312, 4583-4634`; client `screenshot-trade-import-dialog.tsx:26-27, 109-143` | 3 lifetime (trades only; billing/payout blocked) | 20/day | **server + client** | "You've used your 3 free screenshot imports. Upgrade to Pro for 20 a day." / footer "N of 3 free screenshot imports left" |
| CSV AI column mapping | server `index.ts:3593-3620`; client `utils/csv-import-flow.ts:40`, `lib/csv-ai-mapping.ts:15-30` | not offered (manual mapper) | 40/day | **server + client** | toast "Unrecognized format — Map the columns below, or upgrade to Pro to auto-map any broker with AI." (server denial is swallowed) |
| Cloud journal screenshots | `Journal.tsx:617-627`; `storage.rules:3-6` says gating is client-side | IndexedDB, device-bound | Firebase Storage | **client only** | no gate copy; widget nudge only |
| PropTracker Success Rate / Charts / AI Analysis panels | `PropTracker.tsx:1312, 1632, 1783` (ProGate) | blurred | visible | **client only** (AI panel also draws the 20/mo quota) | ProGate walls |
| PropTracker screenshot import button | `PropTracker.tsx:2326-2339`; server `index.ts:4583-4585` | blocked | 20/day | **server + client** | lock button to /pricing; "Screenshot import is a Pro feature." |
| Signup trial (no card) | server `index.ts:554-600`; client `pro-context.tsx:264-275` | 14 days full Pro for accounts created <= 2026-08-07 23:59:59Z; nothing after | — | **server + client** | Settings "Your free Pro trial ends on {date} — no card on file…" |
| Card trial | `index.ts:2490, 2593` (`trial_period_days: 14` unless `hadTrial`) | one 14-day Stripe trial per uid | — | **server (Stripe)** | Stripe Checkout |
| Referral Pro grants | `index.ts:1671-1706` | 3/10/25/50 referrals -> 14/30/90/180 days Pro | — | **server** | referral card/banner |

Client-only and therefore bypassable:

- Reset by clearing localStorage (the counter is `array.length` of a UserStorage key): journal entry cap (`journalEntries`), trading account cap (`accounts`), PropTracker account cap (`propFirmAccounts`).
- Pure render-time `isPro` checks with no server counterpart (bypassable by editing state or forging the `proStatus` cache, `pro-context.tsx:69-90`, TTL 7 days): PDF report, Theme Studio, analytics window, period pills, PropTracker analytics panels, cloud journal screenshots (Storage rules only enforce ownership).
- Not gated at all: CSV export.
- Server-enforced but reset by a fresh account (per-uid, no email identity): free AI quota (20), free screenshot imports (3 lifetime). The signup-trial reset is blocked by an email-hash tombstone (`index.ts:568-578`) that fails open on lookup error and does not cover a different email address.
- Not bypassable: cloud sync, CSV AI mapping, PropTracker screenshot import, all Pro daily caps, referral grants, card trial.

Two copy defects noticed while verifying: `pro-gate.tsx:22` keys the PDF description as `'PDF Report'` while the dialog passes `"PDF Trade Reports"`, so the specific copy never renders; `pro-gate.tsx:26` treats any feature name starting with `"AI "` as quota-gated, so PropTracker's AI panel shows the free-quota teaser while its sibling panels are hard walls.

---

## 4. Cost (Part 4)

Real spend is not retrievable: `/v1/organization/costs` returns 403 for the project key (`api.usage.read` scope missing; needs an Admin API key), the legacy `/v1/usage` returns empty for this key, and nothing in Firestore records tokens or cost. The estimate below is call counts from Cloud Logging x per-call token estimates from the prompt builders x the prices written in `index.ts:3271-3277`.

| Path (30 days) | Calls | Assumed cost per call | Subtotal |
|---|---|---|---|
| `aiAssist` light features on luna (~1,600 in / ~450 out avg) | 5,879 | ~$0.0007 | ~$4.1 |
| `aiStream` — assume 15% AI Trade Analysis on terra (~3,400 in / ~1,500 out) | ~79 | ~$0.021 | ~$1.7 |
| `aiStream` — remaining coaching on luna | ~445 | ~$0.001 | ~$0.5 |
| `suggestCsvMapping` | 161 | ~$0.0006 | ~$0.1 |
| `parseScreenshot` (~9k in incl. image, ~1.5k out) | 19 | ~$0.004 | ~$0.1 |
| **Total** | ~6,580 | | **~$6.5 / month, about £5** |

Assumptions: (a) the luna/terra prices in the code comment are current; (b) the callable-path mix resembles the last-day usage mix (dominated by coach tips and journal prompts); (c) outputs average ~70% of their caps for prose features and ~50% for JSON features; (d) the streaming path is 15% terra-priced analysis, which is generous given only 4 of 427 usage docs show `ai_analysis`. A 3x error in any assumption keeps the figure under $20/month. It agrees with the fact that a ~£12 OpenAI credit has been covering usage since 4 Aug (memory note, `ai-gateway-wiring-dormant`).

Against revenue: lifetime revenue is 5 x $149 = $745 (~£550, matches your figure); recurring revenue is £0 (0 active subscriptions). Monthly AI cost is roughly 1% of lifetime revenue and about a fifth of one $12.99 subscription. AI cost is not what is limiting the free tier; the 20/month cap is a product decision, not a cost necessity. Firestore cost of the quota system itself: every AI call is one transaction on `meta/*` plus one `users/{uid}` read; the Aug 17 loop alone did ~1,550 read+write pairs in a minute (still fractions of a cent).

---

## 5. Firestore: what is answerable and what is not

Schema facts that matter (from `functions/src/index.ts`, `firestore.rules`, `functions/src/sync-chunks.ts`):

- `users/{uid}`: `createdAt` (Timestamp), `firstTradeLoggedAt` (Timestamp, activation), `tradesLoggedCount` (number, since Jun 23), `isPro`, `subscription {status, planType, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd, createdAt ISO, updatedAt}`, `hadTrial`, `trialProExpiresAt` (ISO string), `referralProExpiresAt`, `signupThrottled`, email-drip stamps. No `lastActiveAt`, no trade or journal counts beyond the two above.
- `users/{uid}/meta/`: `freeAiUsage {month, count}`, `aiUsage {date, <feature>: n, lastUsed}` (replaced daily), `screenshotImport {freeUsed, lastUsed}`. No per-request log, no tokens.
- `users/{uid}/sync/{key}`: JSON string blobs (`trades`, `journalEntries`, `accounts`, ...) with a doc-level `updatedAt`, chunked as `{key}.c{i}` above 250k chars. Written only through `syncData`, which is Pro/trial-only. Free users' data is never here.
- Trades have no `createdAt`; ids embed `Date.now()` at creation (manual and import), which is the only logged-at signal.
- Server-side PostHog events (`user signed up`, `first trade logged`, `trade logged`, `subscription started`, `trial converted`, `subscription cancelled`) are the only timestamped behavioural record and live outside Firestore. Client PostHog events (`ai_*_started`, `pro_gate_shown`, etc.) exist but are ad-blocker-lossy.

| Question | Firestore | Where else |
|---|---|---|
| >=10 trades | Answerable since Jun 23 via `tradesLoggedCount` (script `trades-10plus.cjs`) | PostHog `trade logged` sums |
| Trade 30+ days after signup | Not captured for free users; answerable for Pro/trial users from trade-id timestamps in `sync/trades` (same script; see the addendum below) | PostHog `trade logged` event time vs `user signed up` |
| Ever used a coaching feature | Not captured (shared free counter, daily-overwritten Pro doc). Upper bound only (`ai-users.cjs`) | client PostHog `ai_*_used` events, lossy |
| Exhausted quota + week of life | Count of users at 20 in their latest month is answerable; week of life is not (`quota-exhausted.cjs`) | Cloud Logging 403s (30-day retention, no uid) |
| Trials started/converted, before/after Aug 8 | Answerable by inference (`trials.cjs`); no explicit conversion field | Stripe subscriptions list is the authoritative source for the same six records |

Addendum from `sync/trades` (Pro and lapsed-trial snapshots): of 2,440 users who were ever entitled Pro, **345** have a synced trades doc with >=1 trade, **125** with >=10, and **7** of those 125 (21 of the 345) contain a trade whose id timestamp is 30+ days after signup. Read this narrowly: a signup-trial snapshot freezes when the 14-day trial lapses, so 30+ day trades can only show up for paying users and for accounts whose trial was back-filled after signup (`backfillTrialPro`, `index.ts:2057`), not for the ordinary free user.

---

## 6. What could not be determined, and why

- Actual OpenAI spend: the project API key lacks `api.usage.read`; an Admin key or the billing page would answer it in one call.
- Which of the 5,879 callable AI completions were which feature: no feature label is logged on success, and Firestore keeps only the last day's mix per Pro user and no mix at all for free users.
- Whether any free user ever clicked a coaching feature: not recorded anywhere reliable.
- Trades logged 30+ days after signup for free users: their trades never reach the server; only the Auth token-refresh proxy exists (40 of 104 eligible 10+ users).
- Week of life at quota exhaustion: the counter has no timestamp.
- Whether the Aug 17 1,550-call loop was `ai-risk-alert.tsx` or another auto-caller: logs carry no uid or feature; the code path is the only evidence.
- Retention past day 30 for the current free-only cohort (signed up after Aug 8): too young; nothing to measure yet.
