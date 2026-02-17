## Tech Stack

This is a TypeScript project. All code must be TypeScript. Ensure CSS variables use proper format (e.g., hsl() wrappers where needed). Always verify the build passes (`npm run build`) before considering a task done.

## General Rules

When I ask you to change a specific UI element, change ONLY that element. Do not modify surrounding elements, remove existing features, or 'improve' adjacent code unless explicitly asked. Ask for clarification if the target element is ambiguous.

## UI & Styling

When fixing visual/styling issues, propose the specific CSS or style change BEFORE applying it. Do not iterate through multiple broad approaches (HSL tweaks, static palettes, removing all color). Ask me which direction I want if there are multiple valid interpretations.

For positioning/layout requests: confirm the exact placement (which corner, relative to what, conditional on what) by restating my request back to me BEFORE implementing. Especially for logo placement, overlay positioning, and responsive layout changes.

## Git Workflow

When I say 'push to git', run the git add/commit/push commands immediately. When I say 'update the README', I may mean I've already done it myself — ask before making changes. Do not ask clarifying questions about git operations unless there's a genuine conflict.
