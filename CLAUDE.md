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
