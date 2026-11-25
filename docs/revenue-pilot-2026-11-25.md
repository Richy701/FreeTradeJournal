# Full-history Pro pilot

Prepared 25 November 2026. Implementation is local; the measurement window starts only when deployed. No prices, free limits, payment settings or customer messages were changed.

## Decision

Test one specific reason to pay: reviewing more than 30 days of trading history. Existing dashboard history links now open monthly pricing with `source=history_review_v1`. The pricing introduction explains full-history analytics and provides an explicit return to the free dashboard. Ordinary pricing, the existing analysis annual offer, annual selection and sale pricing remain available.

This tests the relevance of the offer at an existing moment of interest. It is not a new analytics feature, a personalised performance preview, a randomised experiment or proof that a customer will trade more profitably.

## Baseline and limitations

Live read-only Stripe, Firestore and PostHog queries on 25 November 2026:

- Six active monthly subscriptions at $12.99 and one active annual subscription at $99.99: approximately $86.27 gross monthly recurring value. Two other subscriptions are past due; one active monthly subscription is scheduled to cancel.
- Last 30 days: $77.94 in successful Stripe charges, with no refunds recorded against those charges. This excludes affiliate income, fees and any refunds against older charges.
- Firestore: 774 recently active accounts marked non-Pro, including 178 with at least 10 cumulative recorded trades. Temporary referral/trial entitlements are not resolved in that simple non-Pro classification.
- PostHog: 795 distinct IDs recorded as free when visiting; 301 visited on at least two days, 142 on at least four, 61 on at least eight. These are visit frequencies, not cohort retention rates. New users have shorter observation windows.
- Mature first-week activation: 203 of 508 signups from 37–7 days before the query recorded their first trade within seven days (40%). Server counters do not establish every local action.
- The dashboard history notice was recorded for 126 distinct IDs. Its event fires automatically when older trades are excluded, so it is exposure rather than purchase intent.
- 39 IDs clicked locked date ranges. A same-ID query found no subsequent checkout-start or subscription-start event in the 30-day window. Client consent, blockers, identity stitching and asynchronous event timing limit this result; it is not proof of zero purchases caused by those clicks.
- The analysis annual offer reached six tracked IDs with no recorded clicks. Free coach chat reached 18 users; AI analysis reached 19. Automatic coaching tips reached 375 and should not be mistaken for deliberate demand.
- Four monthly payers with at least two paid invoices (including one now past due): all four visited in the last month, three logged trades, one ran AI analysis. This sample is too small to establish a winning paid feature.

## Measurement

Review weekly after deployment, recording the release date and the exact observation window. Use distinct authenticated users where possible; reconcile client identities before combining them with server events.

1. Entry: the existing `gate hit` with `gate=period_pills`, or `pro_gate_cta_clicked` with `source=dashboard_window_notice`.
2. Exposure: `pricing_viewed` with `offer_source=history_review_v1`.
3. Intent: `pricing_cta_clicked` with that offer source and `plan=monthly|yearly|lifetime`. Exclude `plan=free` from paid-intent counts.
4. Checkout: `checkout_started` with the offer source and plan. Client completion alone is not a payment.
5. Purchase: match the user's later server `subscription started` event within seven days of exposure, then confirm a paid invoice/payment in Stripe. Deduplicate customers and invoices. Report recurring and lifetime purchases separately.
6. Durability: follow monthly buyers through their second payment, cancellation and refunds. Annual purchases are cash collected, not twelve monthly purchases or evidence of monthly retention.
7. Free exit: `history_upgrade_returned` records the explicit return link. Browser back and other exits are not measured by that event.

Do not send trade contents, P&L, account names or customer emails in experiment properties. Both entry points are in the authenticated dashboard; the existing signed-out checkout-resume behavior is not changed.

This is an attributed pilot, not a causal uplift estimate. Black Friday, the simultaneous site changes and small samples make before/after comparisons particularly weak.

## Decision rules

- First review after two weeks: verify source events arrive and inspect reach, clicks and verified payments. Low exposure calls for investigating reach, not tightening Free.
- Reassess after six weeks, reporting sample size even if small. If at least 30 distinct tracked visitors reach this offer and none pays within their seven-day window, revisit the proposition and customer feedback before adding more prompts. Thirty is an operational checkpoint, not a statistical significance threshold.
- A handful of purchases is preliminary evidence only. Continue following monthly buyers through renewal before calling the offer successful. Compare free engagement and complaints alongside revenue.
- Restore the two dashboard destinations to `/pricing` to remove the pilot entry points. Existing prices and entitlements require no rollback.

## Payment recovery finding and local fix

The active default Stripe portal configuration supports payment-method updates, invoices and cancellation. One past-due latest invoice had three attempts and a retry scheduled for 26 November 2026. The other latest invoice had zero attempts and no next attempt recorded; this does not establish the account's global retry policy or the cause of its status.

In current source, Settings renders the billing-management button only in the `isPro` branch. Past-due users lose Pro and instead see the free-plan upgrade UI. `createPortalSession` itself requires authentication and an existing Stripe customer, not Pro entitlement. A codebase search found portal entry points in Settings and Pricing; Pricing's plan-switch portal path also requires active Pro. Stripe-hosted links or existing emails may provide other recovery routes, which were not exhausted here.

Implemented locally after the follow-up instruction to continue: Settings now keeps billing management reachable for customers with a Stripe customer relationship after Pro lapses. Past-due, unpaid and paused recurring subscribers receive recovery copy and a billing-management action instead of a new subscription CTA. The recurring pricing card also routes these states to the existing portal; it does not advertise the new-customer annual discount for that path. Cancelled customers can still buy again and retain access to old invoices. Demo and never-paid accounts do not receive a billing button.

The shared control prevents duplicate opens, keeps its loading state through a successful redirect, and permits retry after an error. Grace periods, Stripe retry settings, tax configuration, webhook policy, free limits and prices are unchanged. No real payment or portal session was created during verification.

## Local verification

- `src/pages/Pricing.test.tsx`: offer attribution, normal/annual pricing and recovery routing without checkout.
- `src/components/subscription-billing.test.tsx`: active, trial, past-due, unpaid, paused, cancelled, expired, demo and never-paid states; duplicate-open prevention and retry after failure.
- Existing `analysis-upgrade-offer.test.tsx` regression coverage.
- `e2e/harness/history-pricing-check.ts`: actual pricing page at 1280px and 390px, plan switching, ordinary pricing and the annual offer. The earlier timeout was a test locator error: plan titles are divs containing badges, not standalone headings.
- `e2e/harness/billing-recovery-check.ts`: actual billing component in a local fixture, responsive screenshots and mocked portal failure/retry. This is not a real signed-in customer walkthrough or a live Stripe payment recovery test.
- Build verification uses the installed Chromium via `PUPPETEER_EXECUTABLE_PATH` so the prerender stage runs locally. Sourcemap uploads are disabled for local verification.

No deployment or customer outreach has been performed. Launch measurement and actual revenue outcomes remain pending deployment.

## Customer learning and business inputs

Before broader development, learn from repeat payers, recent cancellations and engaged free traders: their last useful FTJ task, what led to payment or refusal, what would make next month's payment worthwhile, and which alternative they use. Start with actual recent behavior rather than asking whether a hypothetical feature sounds attractive. No outreach or customer-message draft has been created.

Still needed from the owner: monthly affiliate commissions actually paid, operating costs, and desired monthly income. Without those, subscriptions cannot be ranked against affiliate income on profit. Coach/community sales remain an unvalidated hypothesis; validate demand before building team features.
