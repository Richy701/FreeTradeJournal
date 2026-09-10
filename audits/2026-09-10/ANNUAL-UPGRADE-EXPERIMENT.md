# Post-analysis annual upgrade pilot

Prepared September 10, 2026. Local implementation; deployment starts the measurement window.

## Baseline

Read-only Firestore count: 751 free users with recorded activity in the previous 30 days; 137 with at least 10 logged trades; 51 with at least 50. Activity tracking was introduced August 18, so the 30-day count has incomplete coverage. One active monthly plan and one annual trial were recorded; these are not reconciled payment totals.

Six annual purchases at the configured $99.99 represent $599.94 gross before discounts, refunds, taxes and fees. This is a target, not a forecast. At an assumed $70/month operating cost, that would leave $389.94 over three months before other costs.

## Audience and experience

- Signed-in free users, after Pro status resolves; excludes Pro entitlements and demo.
- At least 10 currently stored trades in the viewed account scope. This is more conservative than the server's cumulative counter and does not exactly reproduce the baseline cohort.
- Account at least 24 hours old, with an existing browser session hint at app startup. This is a returning-visit proxy, not a count of weekly sessions.
- A completed, non-empty AI Trade Analysis with rendered sections; cached results qualify within the existing 24-hour cache lifetime. No offer during generation or on errors/empty states.
- Inline, below the result. Annual charge and renewal wording are explicit; monthly opens pricing with monthly selected.
- Dismissal lasts 30 days per user/browser. Existing lifetime entitlements and prices are unchanged.

## Measurement

Use distinct signed-in users rather than raw event counts. No financial or trade content is added to tracking. Existing analytics consent/blocker behavior applies.

1. `analysis_upgrade_offer_shown`, `source=analysis_annual_v1`: fired when at least half of the card enters the viewport, once per mounted card.
2. `analysis_upgrade_offer_clicked`, same source, with `plan=yearly|monthly`.
3. `pricing_viewed`, `pricing_cta_clicked`, `checkout_started`, with `offer_source=analysis_annual_v1` while the attributed pricing URL is active.
4. Match the same user's existing server `subscription started` event (`plan_type=yearly`, `is_trial=false`) or subsequent `trial converted` (`plan_type=yearly`). Trial starts and the client `checkout_completed` event alone are not paid revenue.
5. Verify collected revenue, refunds and cancellations against Stripe invoices/payments before reporting money earned.

Use a seven-day click-to-subscription funnel, with trial conversion followed through its actual end date. Attribution follows the user through existing server events; no experiment metadata is added to Stripe. Compare later `session seen` activity for converters at 7 and 30 days.

Review weekly: eligible users exposed, unique clicks by plan, checkout starts, paid annual/monthly customers, refunds and net cash collected. If few qualified users reach a completed review, improve activation before enlarging the offer's audience. If users click but do not purchase, investigate pricing and checkout before changing the offer.

This is a single-cohort pilot, not a randomized A/B test; it measures uptake and attributed revenue, not causal uplift. The 137 baseline users will not all see the offer. No dashboard, automated reporting, email campaign or live deployment is created by this implementation.

## Local verification

- `npm test -- src/components/analysis-upgrade-offer.test.tsx`
- `npm run build`
- With Vite running, `OFFER_PREVIEW_URL=http://127.0.0.1:PORT node --experimental-strip-types e2e/harness/analysis-offer-check.ts`

The browser fixture renders the real analysis, offer and pricing components with existing demo data and mocked authentication, AI and checkout. It blocks external requests and makes no purchase. Live payment and analytics delivery require separate post-deployment verification.
