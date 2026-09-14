# Onboarding audit — 14 September 2026

Read-only review of the current working tree. No onboarding changes were made. Findings are ranked by likely user impact, not measured conversion loss. Scope: signup routing, setup, returning-user checks, first-trade entry and the getting-started checklist. This is a code-path audit, not a live new-account walkthrough or a measured funnel analysis.

## Findings

| Priority | Finding and user impact | Proposed change | Effort |
| --- | --- | --- | --- |
| 1 | Setup completion is written directly to `users/{uid}`, but the repository's rules prohibit client writes there. The error is swallowed. The fallback reads that same root field, so it cannot reliably remember completion after browser storage is cleared, particularly for Free users. | Persist completion through an authenticated server endpoint available to Free and Pro accounts; read the same canonical field. Preserve cloud restore before routing. | M |
| 2 | Entering a starting balance of zero saves 10,000: `parseFloat(value) || default` treats zero as absent. This changes the trader's account information without telling them. | Accept finite zero explicitly; validate invalid input before continuing and show the actual saved balance in the confirmation. | S |
| 3 | Protected routes treat the mere presence of an accounts/trades storage key as proof of prior setup. Empty arrays qualify; the account provider also seeds a default account. That makes routing dependent on initialization order rather than a deliberate setup decision. | Distinguish real returning-user data from empty collections and automatically seeded accounts; test fresh signup, returning Free/Pro and failed restore independently. | M |
| 4 | The checklist reads the unscoped `ftj-ai-coaching-tips` key, while the coach writes through a user-scoped cache. Its “Ask Coach FTJ” task can remain incomplete despite usage. It also links back to the dashboard instead of opening the coach. | Track a durable, user-specific successful coaching action and link the checklist action to the coach directly. Avoid relying on an expiring response cache for completion. | S |
| 5 | The normal path spends five screens on welcome, experience, account type, details and confirmation before the first trade. Skip exists, and the completed path correctly opens quick trade entry, but import is only a secondary mention during setup. | Test a shorter path that asks whether the trader wants to import or log a trade, then collects the account details needed for that choice. Keep experience-based help contextual. | M |

## Evidence and limits

- Completion write and swallowed error: `src/pages/OnboardingSimplified.tsx:112–124`; fallback reader: `src/hooks/use-firestore-onboarding-check.ts:33–45`; client-write prohibition: `firestore.rules:77–82`. `firebase.json` selects this rules file. Git history includes `231f8d1`, which introduced returning-user protection. Deployed Firebase rules were not independently inspected in this audit; the contradiction is confirmed in source. Pro sync separately stores `onboardingCompleted` under the sync subcollection; this finding does not claim that all Pro completion persistence fails.
- Balance conversion: `src/pages/OnboardingSimplified.tsx:280`; default: `src/constants/trading.ts:195`; details continue button advances without validating the balance. Git history traces the conversion to `54c7b3a`.
- Routing uses storage-key presence in `src/components/protected-route.tsx`; default account seeding is in `src/contexts/account-context.tsx:154–166`. The code permits the bypass; live incidence and exact signup timing have not been measured.
- Checklist reads the unscoped key in `src/components/getting-started-checklist.tsx:91`; coach uses `getAICache`/`setAICache` in `src/components/trading-coach.tsx:925,1024`; `src/utils/ai-cache.ts` prefixes keys by user. Checklist history includes `6c52128`.
- Setup completion opens the first-trade dialog via router state; Dashboard consumes it at `src/pages/Dashboard.tsx:178–189`. Its empty state offers both manual entry and broker import at `src/pages/Dashboard.tsx:1268–1297`. These are strengths to retain.

## Recommended order

Fix completion persistence and balance handling first, then routing and checklist correctness. Evaluate the shorter setup against first trade/import completed within seven days and time to first useful result; do not judge it only by setup completion. The existing activation report's mature seven-day cohorts can support that comparison, but this audit does not establish causation or quantify lost revenue.

No production fixes, emails or deployments were performed as part of this audit.
