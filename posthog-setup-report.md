<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into FreeTradeJournal's Firebase Cloud Functions backend. The `posthog-node` SDK was installed as a dependency in `functions/`, a lazy singleton `getPostHog()` was added following the same pattern as `getResend()` and `getStripe()`, and 8 business-critical events are now tracked across the full user lifecycle — from signup through first trade, feedback, and subscription churn. Exception capture was also added to the Stripe webhook error handler. Environment variables `POSTHOG_API_KEY` and `POSTHOG_HOST` are written to `functions/.env`.

| Event | Description | File |
|---|---|---|
| `user signed up` | New user account created via Firebase Auth trigger | `functions/src/index.ts` |
| `first trade logged` | User logged their very first trade (markFirstTrade callable) | `functions/src/index.ts` |
| `feedback submitted` | User submitted feedback with type (bug/feature/general) and optional star rating | `functions/src/index.ts` |
| `testimonial submitted` | User submitted a testimonial for review | `functions/src/index.ts` |
| `subscription started` | Stripe checkout completed — properties: `plan_type`, `is_trial`, `status` | `functions/src/index.ts` |
| `trial converted` | Trial subscription converted to paid — property: `plan_type` | `functions/src/index.ts` |
| `subscription cancelled` | Stripe subscription deleted/cancelled | `functions/src/index.ts` |
| `subscription payment failed` | Stripe invoice payment failed | `functions/src/index.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://eu.posthog.com/project/155164/dashboard/608759
- **New signups over time:** https://eu.posthog.com/project/155164/insights/dGdJB0hH
- **Signup to first trade funnel:** https://eu.posthog.com/project/155164/insights/O46CGmSV
- **Signup to subscription funnel:** https://eu.posthog.com/project/155164/insights/DzcMIok9
- **Subscriptions by plan type:** https://eu.posthog.com/project/155164/insights/eVKkQbz1
- **Subscription churn vs new subscriptions:** https://eu.posthog.com/project/155164/insights/YmG8CNMt

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-javascript_node/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
