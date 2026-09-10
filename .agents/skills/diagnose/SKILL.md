---
name: diagnose
description: Root-cause a bug with evidence BEFORE changing any code. Use when the user reports a bug, a crash, wrong output, or "why is this happening" — especially anything visual, intermittent, or "the code looks right but behaves wrong."
---

## Diagnose

The goal is one confident, evidence-backed root cause before a single line of production code changes. Do NOT edit code to "try" a fix during this skill.

1. **Reproduce and gather evidence.** Establish the exact failing input/state and the wrong output. Pull real evidence, not assumptions: console errors the user pasted, network requests, actual logs, and the actual code path (read the real functions, don't infer them). For data-vs-code questions, look at the real stored data.

2. **Rule out stale state FIRST.** Before blaming code, eliminate the common false causes that have burned past sessions:
   - Stale PWA service worker / old cached bundle (behavior doesn't match current code).
   - HMR/Vite dev-bundle staleness.
   - Deployed-vs-local mismatch (is the thing you're looking at even the version running?).
   - For "it changed but I don't see it": hard-reload / cache-bust before diagnosing a code bug.

3. **Check for duplicate code paths.** Per this repo's convention: grep the ENTIRE codebase for duplicate or inline copies of the handler/logic before concluding there's one code path. A fix to one copy while another silently stays broken is a recurring trap here.

4. **State the hypothesis with evidence.** Write: the single most-supported root cause, the specific evidence for it, and — when useful — why competing hypotheses are ruled out. If confidence is low, say so and say what evidence would raise it. When possible, capture the failure in a failing test or minimal repro before touching production code.

5. **Wait for confirmation.** Present the diagnosis and stop. Do not implement the fix until the user confirms the direction. If the first fix later doesn't work, return to the hypothesis rather than trying surface-level variations.
