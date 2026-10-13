# October email rollout

Status at release preparation, 13 October 2026: the updated seven-email test pack was delivered and approved by the owner ("okay all good"). The owner then authorized pushing, deploying the email functions, and updating the hosted templates and sequence ("okay go"). Keep the callout bars. This document records the procedure; provider verification determines whether the release is live. Client appearance approval came from the owner, not an automated Gmail/Apple Mail check.

## Preview and validation

Run from the repository root:

```sh
npx vitest run functions/tests
npm --prefix functions run build
npx tsc -p functions/tsconfig.rollout.json
npm run build
node --env-file=functions/.env functions/node_modules/ts-node/dist/bin.js --project functions/tsconfig.rollout.json functions/scripts/rollout-activation.ts --dry
```

The final command only GETs the live automation and seven templates, renders the proposed content, and writes `/tmp/ftj-activation-rollout/plan.json`. It includes full before/after content, the workflow and a fingerprint. Do not commit that account snapshot. Review the diff before applying. An unpublished provider draft, unexpected identity/status, or drift since the dry run blocks application. `ROLLOUT_DIR` can select another private local backup directory.

## Order after approval

1. Finish Gmail and Apple Mail visual checks, including populated/empty/mixed-currency digests. Browser previews alone do not establish email-client rendering. Get fresh test-send authorization if updated copies are needed.
2. Commit and push only when requested. Review all pending files, including generated `functions/lib/index.js` and its map.
3. Deploy email-rendering functions by name. Do not use an unscoped functions deploy while the known `createMtSyncKey` orphan remains unresolved. The list below includes the shared-shell users and the new follow-up. Existing retired campaign guards remain in place; do not invoke those campaigns.

```sh
firebase deploy --project tradevault-41c68 --only functions:onUserCreated,functions:sendPasswordResetLink,functions:sendEmailVerificationLink,functions:sendDay3NudgeEmails,functions:sendDay7NudgeEmails,functions:sendFirstTradeReviewEmails,functions:sendTrialEndingEmails,functions:sendDay14UpgradeEmails,functions:sendDay21BackupEmails,functions:sendWeeklyDigestEmails,functions:sendActivationReport,functions:sendFeedback,functions:submitTestimonial,functions:markFirstTrade,functions:stripeWebhook,functions:retentionSweep,functions:manageMonthlyRoundup,functions:prepareMonthlyRoundup,functions:sendApprovedRoundups,functions:sendBirthdayLifetimeEmails,functions:sendBirthdayLifetimeClosingEmails
```

4. Verify deployment success and that the deployed `onUserCreated` revision contains `claimSignupEnrollment`/`releaseSignupEnrollment`. Verify the day 2/7/14/21 fallbacks are deployed too. `--guard-deployed` is an operator acknowledgement, not an automatic deployment check. Do not set it based only on local build success.
5. Run a fresh dry run and review its saved plan. Then, only with publishing/deployment approval, run:

```sh
node --env-file=functions/.env functions/node_modules/ts-node/dist/bin.js --project functions/tsconfig.rollout.json functions/scripts/rollout-activation.ts --apply --guard-deployed
```

Do not run `push-resend-templates.ts` independently for this migration. The coordinated command updates template HTML/text and the entry/support subjects, then updates the existing activation workflow. New runs receive day-2 entry help and day-7 support. The first-trade review stays application-owned. Conversion Drip wiring is unchanged.

## Signup coverage and failure handling

The server-only Firestore document `ops/emailActivationRollout` controls a transaction-based enrollment gate. Each signup claims a unique handoff before firing `user.signed_up`, then removes that claim after the enrollment marker is recorded. The rollout pauses new claims and waits up to two minutes for existing ones to drain before touching Resend. This also handles concurrent invocations for the same user without releasing each other's claims.

A signup seeing the paused gate still receives its welcome email and gets a Resend contact, but no signup event is fired and no `resendAutomationEnrolled` flag is set. Its status is `rollout_fallback`; the deployed day 2/7/14/21 functions cover it using the existing opt-out, activation, entitlement and sent-marker checks. Never replay those signup events later: that could duplicate the local reminders or Conversion Drip.

Templates and the graph are backed up before writes. The command verifies published HTML/text/subjects and the enabled graph before reopening enrollment. Existing runs are not stopped, and all seven templates are retained for old runs. Old runs can still carry their original subject/cadence while using updated template bodies; this is a bounded compatibility period, not proof that every existing run has moved to the new sequence.

On failure after writes begin, the script attempts to restore the prior graph and template content, verifies the old graph, then reopens enrollment. If restoration fails, or the process is killed mid-rollout, leave the gate paused and use the saved plan to inspect provider state. Local reminders continue for new signups. Never clear a handoff just because it is old: first establish its function invocation ended and reconcile event acceptance. Never use Resend's stop endpoint; it cancels running sequences.

If recovery needs manual writes, prepare the exact restoration from `plan.json`, verify the live graph and published templates with GETs, then reopen the gate only after verification. Report a failed recovery immediately. The script deliberately does not retry ambiguous provider writes automatically.

After publishing, check the internal activation report and failed Resend runs. Following the next Monday digest, check sent/skipped-invalid-data/failed totals. A data skip preserves currency accuracy and does not mark the recipient sent.

Reference: [Resend automation update API](https://resend.com/docs/api-reference/automations/update-automation) requires disabling an enabled workflow before replacing its steps and connections.
