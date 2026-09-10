# Weekly focus

Implemented September 10, 2026. The workflow connects Coach FTJ's existing tips to a seven-day habit, daily self-reported check-ins, a written review, and the next focus. An active focus has a dashboard return link. Basic check-ins do not use AI calls or require Pro.

Each trading account keeps separate focus history. Combined-account mode asks the user to select an individual account. Plans, check-ins, corrections and reviews are append-only records under the user-scoped `coachingFocus` storage key. Existing Pro sync handles the collection; free accounts retain it locally. Backup export includes it and restore validates its shape before starting writes. This inherits the existing sync engine's behavior and is not a redesign of cross-device conflict handling.

Days are local calendar dates, with seven-day arithmetic independent of DST duration. Future check-ins are blocked. Only followed/missed check-ins contribute to the recorded-trading-day total; non-trading and unrecorded days are excluded. Earlier days remain editable until review. Users can end early with a reflection; unrecorded-day counts then stop at that end date.

The feature records `weekly_focus_tip_selected`, `weekly_focus_started`, `weekly_focus_checked_in`, `weekly_focus_reviewed`, and `weekly_focus_reminder_opened` through existing client analytics. Habit text, reflections, account names and trade contents are not sent in these events. Use distinct users to measure start → check-in on another day → review → next focus, plus subsequent paid conversion. Existing consent and content-blocker limitations apply; no reporting dashboard or outbound campaign was created.

## Release order

Deploy the updated `syncData` and `getSyncData` Cloud Functions before releasing the frontend. Both need the new sync-key allowlist. A frontend-only release would leave Pro focus history unable to sync against the old backend. No additional API endpoint, database rules or scheduled email is introduced.

## Evidence

- 337 tests passed across 35 files, including 12 new focus-model/persistence checks; backend TypeScript build passed.
- Browser fixture passed tip selection, plan creation, correction, dashboard return, user/account isolation, a non-trading day, the seven-day review and repeating a habit.
- Screens checked at 360, 390, 768 and 1280px; dark and light mode captures inspected.
- Real component screenshots are included in the highlighted v2.92.0 release notes and What's New. The browser confirmed both images load on both surfaces.
- Browser tests use existing demo trade data with mocked authentication and block all external requests. They do not prove live AI, cloud sync, payment or analytics delivery. Production deployment remains separate.

Reproduce with `npm test` and, with Vite running, `FOCUS_PREVIEW_URL=http://127.0.0.1:PORT node --experimental-strip-types e2e/harness/weekly-focus-check.ts`. Capture files are under `/tmp/ftj-weekly-focus`; the two published screenshots are under `public/screenshots/weekly-focus*.png`.

## UI refinement

Recomposed the weekly-focus panel with existing shadcn Button, Badge, Progress, Separator and Accordion components. The habit leads the panel; the seven days stay in one row, with check-ins beside progress and review on desktop and stacked on mobile. Replaced native details controls with the shared Accordion. Refreshed both release screenshots from the rendered components. The browser journey and 12 focus tests passed after this change; screenshots were inspected at mobile and desktop widths in both themes.

## Demo showcase

Demo entry now seeds an active habit with four check-ins and a completed previous-week review into demo-user storage. Dates are generated when entering demo, including across month/year boundaries. The dashboard reminder is visible and check-in mutations remain guarded. Three new tests cover the seeded summaries and account isolation. The real-demo browser check verifies the reminder, active habit, review history, and blocked writes.

## Dashboard reminder refinement

The compact reminder uses the shared Card, Badge, Progress and Button components, showing the active habit, day of the week-long plan, check-in count and a state-specific action. Its position on Dashboard is unchanged. Mobile and desktop dark/light screenshots were inspected.

During real-demo navigation, one external TradingView events embed intermittently threw in its `_replaceScript` function after its container was removed. That separate external-widget issue remains unchanged. The focused demo harness blocks TradingView embeds so the weekly-focus assertions are isolated; it still uses the real demo authentication and seed data.
