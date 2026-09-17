// Diagnostics for the rare "Maximum update depth exceeded" crash (React #185)
// seen in production on /dashboard and /settings. The error is thrown from
// inside React, so its stack names whoever updated state last, not the
// component that is actually looping, and it never reproduced locally
// (e2e/harness/storage-storm-check.mjs rules out storage-event bursts alone).
// This keeps a few seconds of app-level activity in memory and attaches a
// summary to that one exception, so the next occurrence says what was
// refreshing. Records event and storage KEY names only, never values.

const WINDOW_MS = 5000
const MAX_ENTRIES = 200

interface Entry { at: number; what: string }

const entries: Entry[] = []
let lastComponentStack: string | undefined

function note(what: string) {
  entries.push({ at: performance.now(), what })
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES)
}

export function isUpdateLoopError(message: string | undefined): boolean {
  return /Maximum update depth|Minified React error #185/.test(message ?? '')
}

// React 19 root error callbacks hand us the component stack; keep the latest.
export function noteComponentStack(stack: string | undefined) {
  lastComponentStack = stack
}

export function installLoopCrashContext() {
  if (typeof window === 'undefined') return
  window.addEventListener('storage', (event) => note(`storage:${event.key ?? '(clear)'}`))
  for (const name of ['tradesUpdated', 'popstate', 'online', 'offline', 'pwa-update-available']) {
    window.addEventListener(name, () => note(name))
  }
  document.addEventListener('visibilitychange', () => note(`visibility:${document.visibilityState}`))
}

export function getLoopCrashContext() {
  const now = performance.now()
  const counts: Record<string, number> = {}
  for (const entry of entries) {
    if (now - entry.at <= WINDOW_MS) counts[entry.what] = (counts[entry.what] ?? 0) + 1
  }
  return {
    loop_recent_activity: counts,
    loop_last_activity: entries.slice(-12).map((entry) => `${Math.round(now - entry.at)}ms ago ${entry.what}`),
    loop_ms_since_page_load: Math.round(now),
    loop_path: window.location.pathname,
    loop_visibility: document.visibilityState,
    loop_component_stack: lastComponentStack?.slice(0, 1500),
  }
}
