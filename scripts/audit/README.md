# Read-only audit scripts

Throwaway analysis scripts for AUDIT.md. None of them write to Firestore.

```
GOOGLE_APPLICATION_CREDENTIALS=functions/service-account.json node scripts/audit/trades-10plus.cjs
GOOGLE_APPLICATION_CREDENTIALS=functions/service-account.json node scripts/audit/ai-users.cjs
GOOGLE_APPLICATION_CREDENTIALS=functions/service-account.json node scripts/audit/quota-exhausted.cjs
GOOGLE_APPLICATION_CREDENTIALS=functions/service-account.json node scripts/audit/trials.cjs
```

They resolve `firebase-admin` from `functions/node_modules` (root has none).

Stripe reconciliation (also read-only; lists Stripe subscriptions + payments and diffs against `users/{uid}.isPro`):

```
GOOGLE_APPLICATION_CREDENTIALS=functions/service-account.json node scripts/audit/stripe-reconcile.cjs --env
```
