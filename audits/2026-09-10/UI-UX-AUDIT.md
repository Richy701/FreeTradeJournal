# Page-by-page UI/UX audit — 10 September 2026

Completed a local route-level review of 50 application URLs plus two missing-page probes: 53 route/mode combinations, each at 1440×1000 and 390×844 (106 checks). The PropTracker URL was reviewed as both a guest and a demo user. The five generated firm pages and all seven published blog articles are included.

For each route, reviewed top/middle/bottom viewport captures and inspected headings, control names, page overflow, redirects, and uncaught JavaScript errors. Additional interactive checks cover selected forms, disclosures, filters and onboarding steps, including 360px onboarding. This is route-level coverage, not a claim that every possible data state, browser, keyboard path or live integration was tested.

## Findings ranked by user impact — fixed in this pass

Effort: S = small, M = moderate, L = large. These are implementation estimates, not revenue projections.

| Priority | Finding and user impact | Fix | Effort |
|---|---|---|---|
| 1 | Onboarding Skip was clipped on narrow phones, hiding an escape from setup. | Responsive header, larger Back/Skip targets, accessible progress and selected options; checked at 360px. | S |
| 2 | Journal statistics displaced search and entries below the first mobile screen. | Expandable mobile statistics bring the journal itself higher up. | S |
| 3 | Calculator numeric fields lacked accessible names, making risk inputs difficult to identify with assistive technology. | Named all fields/selects, including changing risk and stop units. | S |
| 4 | Settings account/risk controls and Goals target/limit fields lacked programmatic labels. | Added names/label associations and selection semantics. | S |
| 5 | Password visibility buttons had small mobile targets. | 44×44px targets and visible keyboard focus across login, signup and reset. | S |
| 6 | Journal search/filter controls did not fully communicate their purpose or open state. | Named search and P&L bounds, Escape clearing, and expanded-state semantics. | S |
| 7 | Pricing intervals and release-note filters conveyed selection visually only. | Selected-state announcements and visible keyboard focus. | S |
| 8 | Reset recovery and public calculator signup used nested interactive link/button markup. | Single semantic links styled as buttons. | S |

Previous changes to Trade Log and shared navigation remain in the working tree. This pass does not resolve the separate security/synchronisation findings in [the earlier audit](../../AUDIT-2026-09-10.md).

## Page checklist

“Reviewed” means desktop and mobile screenshots plus the DOM checks above. Redirect rows describe the destination actually seen; the email-verification UI itself was code-reviewed only.

| Mode | URL | Desktop/mobile | Findings and scope |
|---|---|---|---|
| public | `/` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/login` | Reviewed | Password reveal now has a 44px target and keyboard focus styling; reveal/hide tested. |
| public | `/signup` | Reviewed | Password reveal improved; form layout reviewed. Registration not submitted. |
| public | `/forgot-password` | Reviewed | Form and recovery navigation reviewed; email not sent. |
| public | `/reset-password` | Reviewed | Invalid-link state and recovery link tested; nested button/link removed. Valid token and success states code-reviewed only. |
| public | `/verify-email` | Redirect verified | Guest redirects to login, as intended. Pending/verified email screen reviewed in code only; no unverified live account used. |
| public | `/privacy` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/terms` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/cookie-policy` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/documentation` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/changelog` | Reviewed | Category filters and Load more exercised; selected category now announced with keyboard focus styling. |
| public | `/blog` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/pricing` | Reviewed | Monthly/yearly controls and FAQ exercised; selected billing interval now announced. Checkout not opened. |
| public | `/forex-trading-journal` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/futures-trading-tracker` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/prop-firm-dashboard` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/day-trading-journal` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/online-trading-journal` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/affiliate` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/ftmo-review` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/the5ers-review` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/top-one-futures-review` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/tradezella-alternative` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/tradersync-alternative` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/edgewonk-alternative` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/position-size-calculator` | Reviewed | Shared calculator labels fixed; signup CTA now a single semantic link. Reference table uses contained horizontal scrolling. |
| public | `/prop-tracker` | Reviewed | Guest marketing landing and demo account overview both reviewed; live balances/imports not submitted. |
| public | `/audit-missing-page` | Reviewed | 404 layout and recovery destination reviewed. |
| public | `/blog/audit-missing-post` | Redirect verified | Unknown article redirects to the blog index. |
| public | `/fundednext-trading-journal` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/ftmo-trading-journal` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/apex-trading-journal` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/funding-pips-trading-journal` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/topstep-trading-journal` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/blog/ai-trading-coach` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/blog/best-free-trading-journal-prop-firm` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/blog/best-free-trading-journals-2026` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/blog/das-trader-import` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/blog/how-to-pass-topstep-combine` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/blog/mt4-mt5-trading-journal` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| public | `/blog/prop-firm-tracker` | Reviewed | Layout, heading hierarchy, content wrapping, navigation and footer reviewed; no blocking layout defect found in the sampled states. |
| demo | `/dashboard` | Reviewed | Desktop/mobile demo layout reviewed; earlier navigation improvements retained. External market feeds blocked. |
| demo | `/prop-tracker` | Reviewed | Guest marketing landing and demo account overview both reviewed; live balances/imports not submitted. |
| demo | `/coach` | Reviewed | Sample coach and analysis reviewed; live AI requests blocked. |
| demo | `/trades` | Reviewed | Earlier search, import shortcut, mobile summary and navigation improvements retained; route layout rechecked. |
| demo | `/goals` | Reviewed | Overview and goal/risk dialogs reviewed; target/limit fields associated with labels and selection state announced. |
| demo | `/calculator` | Reviewed | Forex/futures, ticks/points and results reviewed; all numeric fields and selects named for assistive technology. |
| demo | `/journal` | Reviewed | Mobile statistics disclosure, named search and P&L filters, Escape clearing, and filter expanded state fixed; search/no-results exercised. |
| demo | `/ideas` | Reviewed | Sample Trade Insights reviewed; live AI generation blocked. |
| demo | `/trade-ideas` | Redirect verified | Retired route correctly redirects to dashboard. |
| demo | `/settings` | Reviewed | All six sections reviewed; edit-account form exercised. Added accessible names to account/risk/custom-color controls. |
| demo | `/profile` | Reviewed | Demo profile, recent trades and goals reviewed. Live avatar/name saving not submitted. |
| demo | `/onboarding` | Reviewed | Welcome through Ready reviewed. Fixed clipped mobile Skip, larger navigation targets, selection announcements, progress semantics, and headings. Final account creation not submitted. |

## Validation and evidence

- Route checks: 106 completed; no document-level horizontal overflow, unnamed visible buttons, unlabeled visible input elements, or uncaught page errors in the recorded route states after the first set of fixes. This lightweight scan is not a WCAG conformance test; for example, the clipped onboarding Skip required a screenshot and a bounding-box check.
- TypeScript: passed. Existing automated tests: 315 passed across 32 files.
- Full `npm run build`: passed, including TypeScript, the production bundle, 34/34 prerendered public routes and sitemap checks. Puppeteer used the existing Playwright Chromium via `PUPPETEER_EXECUTABLE_PATH`; its default browser cache was unavailable. Source-map upload was disabled. Nothing was deployed.
- Interactive verification: 35 captured states completed, including password reveal, pricing/FAQ, release-note filters, representative light-mode pages, calculator modes, journal search/disclosures, settings sections, goal/risk dialogs, and onboarding. See `ui/state-results.json` and `ui/verification.log` for the final run.
- Reusable local browser scripts: `e2e/harness/page-audit.mjs` and `e2e/harness/page-states.mjs`. Both use a fresh demo session and block external requests. Blog covers use the matching files from `public/images`.
- Full route captures: `/tmp/ftj-page-audit-final`. Interactive captures: `/tmp/ftj-page-states-final`. Selected before/after screenshots are retained in `audits/2026-09-10/ui`.

## Before and after

| Surface | Before | After |
|---|---|---|
| Onboarding at 360px | [Clipped Skip](ui/onboarding-before.png) | [Controls fit](ui/onboarding-after.png) |
| Journal on mobile | [Statistics occupy the first screen](ui/journal-before.png) | [Entries appear sooner](ui/journal-after.png) |

## Remaining verification limits

- Pending email verification, a valid password-reset token, real login/registration, checkout/portal, cloud sync, live AI and live market feeds require separate integration testing. No emails or external account changes were made.
- The app was exercised with populated demo data. True first-account empty states, very large histories, expired subscriptions and offline recovery were not exhaustively browser-tested.
- Light-mode checks are representative public pages, not a complete repeat of every route and theme preset. No physical-device, Safari, Firefox or screen-reader session was run.
- Long marketing pages retain their existing repeated calls to action and extensive footers. No conversion experiment or content-factual/legal review was performed.
- Repository-wide lint already had failures in the earlier audit; this pass is not a lint cleanup.

UI review references: [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md), plus the project’s frontend-design, onboarding and React skills.
