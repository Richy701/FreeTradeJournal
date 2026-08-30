## Tech Stack

This is a TypeScript project. All code must be TypeScript. Ensure CSS variables use proper format (e.g., hsl() wrappers where needed). Always verify the build passes (`npm run build`) before considering a task done.

## General Rules

When I ask you to change a specific UI element, change ONLY that element. Do not modify surrounding elements, remove existing features, or 'improve' adjacent code unless explicitly asked. Ask for clarification if the target element is ambiguous.

## UI & Styling

When fixing visual/styling issues, propose the specific CSS or style change BEFORE applying it. Do not iterate through multiple broad approaches (HSL tweaks, static palettes, removing all color). Ask me which direction I want if there are multiple valid interpretations.

For positioning/layout requests: confirm the exact placement (which corner, relative to what, conditional on what) by restating my request back to me BEFORE implementing. Especially for logo placement, overlay positioning, and responsive layout changes.

## Bug Fixing

When fixing a bug, search the ENTIRE codebase for duplicate or inline copies of the handler/logic (e.g., vite.config.ts inline handlers, both Swift widget file copies) before claiming a fix is complete. Use grep/find to verify there's only one code path, not a copy that will silently stay broken.

## Debugging

Before changing anything for visual, animation, or map glitches, investigate the root cause end-to-end first. Do not try offset tweaks or surface-level patches. State the root cause hypothesis with evidence before proposing any fix. If the first fix doesn't work, revisit the hypothesis rather than trying random variations. Write a failing test or minimal reproduction when possible before editing production code.

## Assets & Content

Always use the project's real data and real official assets (actual itinerary destinations, authentic sponsor logos). Never use placeholder content, sample data, or generated SVG wordmarks unless explicitly asked. If an asset is missing, ask rather than substituting a placeholder.

## Visual Verification

After making visual, animation, or UI changes, verify the change actually rendered correctly before reporting done. State how you will verify (dev server check, screenshot, frame capture) and confirm the result. Do not claim a visual fix is complete without evidence it took effect.

## Git Workflow

When I say 'push to git', run the git add/commit/push commands immediately. Commit ALL pending changes — not a partial subset. Show the full file list before pushing so I can confirm nothing was missed. When I say 'update the README', I may mean I've already done it myself — ask before making changes. Do not ask clarifying questions about git operations unless there's a genuine conflict.

## Changelog Conventions

The changelog is for END USERS only. Only add entries for user-facing changes (new features, visible UI changes, behavior users will notice). Never add changelog entries for internal or technical fixes (refactors, build tooling, analytics tracking, server config, deploy plumbing) — these are invisible to users and must not be surfaced. If it's unclear whether a change is user-facing, ASK before adding an entry. When you do add an entry, keep `LATEST_CHANGELOG_VERSION` in sync.

## Communication

Explain findings in plain English first: what happened and what it means for users or revenue. Put technical detail (file paths, stack traces, framework internals) underneath, not up front. Changelog entries and any customer-facing copy are written for a trader who doesn't code: no file names, no framework names, no "refactored".

## Autonomy Boundaries

Never create, draft, schedule, or send an outbound email, Gmail draft, Resend broadcast, or customer message unless explicitly asked in that message. Before any campaign send, show the copy and the recipient count and wait for approval. On long runs, stop and summarise after each step that changes code, so scope can be redirected early. If the same error happens twice in a row, stop and report instead of working around it.

## Audits

An "audit" is READ-ONLY unless the request says otherwise. Deliver a findings list ranked by user/revenue impact with an effort estimate (S/M/L) per item, then wait to be told which ones to build.

## Verifying Claims

Do not assert that a feature, config, or secret is "missing", "unused", or "not in the repo" without checking git history (`git log -S`), the provider dashboard (Vercel, Stripe, PostHog, Resend), and env/config files first. If uncertain, say "I couldn't find X in <places checked>" rather than "X doesn't exist".

## Which Surface?

Before fixing a UI bug, confirm which surface is meant. There are multiple footers/headers/tickers (app, landing page, email templates, prerendered SEO pages, the separate Shopify store). State the assumption explicitly or ask one question before editing.
