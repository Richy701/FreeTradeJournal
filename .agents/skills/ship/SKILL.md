---
name: ship
description: Build-verify-commit-push the current work with scope and changelog guardrails. Use when the user says "ship", "push to git", or wants pending work committed and deployed.
---

## Ship

Follow every step in order. Do not skip the guardrail steps (2, 4, 7) even when the change looks trivial.

1. **Build.** Run `npm run build` and fix any errors before continuing. Never ship a red build.

2. **Changelog guardrail.** If this session made a user-facing change (new feature, visible UI change, behavior a user would notice), confirm a changelog entry exists and `LATEST_CHANGELOG_VERSION` is in sync. NEVER add a changelog entry for internal/technical work (refactors, build tooling, analytics, server config, deploy plumbing, backend fixes). If it is unclear whether a change is user-facing, ASK before adding an entry — do not add one on assumption.

3. **Full status.** Run `git status --short --untracked-files=all` and show the COMPLETE list of changed/untracked files.

4. **Scope flag.** Compare the changed files against what this session actually worked on. Call out, in plain language, any file that does NOT relate to the task (e.g. unrelated pages, work from a prior session, generated output). Per the user's git convention, still stage everything — but surface the unrelated files explicitly so the user can catch a mistake before it goes out. Pause only if something looks genuinely wrong (a file you don't recognize changing, a deletion you didn't intend).

5. **Stage + confirm.** `git add -A`, then `git diff --cached --stat` to confirm the full staged set.

6. **Commit + push.** Write a concise commit message from the diff (end with the Co-Authored-By trailer). `git commit` then `git push`. Branch first if on the default branch and the change is not a trivial fix the user asked to push directly.

7. **Verification report.** After pushing, report:
   - The full list of files that were pushed, confirming nothing was left behind (`git status -sb` should show no ahead/behind divergence).
   - Deploy status: frontend deploys via Vercel on push (note it will be building); Cloud Function changes need a separate `firebase deploy --only functions` and are NOT live from a git push alone.
   - What was and was NOT verified — especially flag when a UI change could not be confirmed in a real browser (e.g. gated behind login, demo mode can't reach it). Do not claim a visual fix works without evidence it rendered.
