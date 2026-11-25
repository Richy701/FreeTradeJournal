// Getting new deploys to people without making them refresh.
//
// 1. Open tabs check for a new version when they come back into view and every
//    hour. The browser only checks on full page loads by itself, and an SPA
//    tab can stay open for days without one.
// 2. sw.ts activates a new version straight away. Instead of reloading out
//    from under someone mid-task, we remember that an update is ready and
//    apply it with a full page load on their next in-app navigation, when
//    they are leaving the current page anyway.

const CHECK_INTERVAL_MS = 60 * 60 * 1000
const FOCUS_CHECK_THROTTLE_MS = 5 * 60 * 1000

let updateReady = false

export function isUpdateReady(): boolean {
  return updateReady
}

export function watchForUpdates(registration: ServiceWorkerRegistration | undefined): void {
  if (!registration || !('serviceWorker' in navigator)) return

  // The first install also fires controllerchange (clientsClaim takes over an
  // uncontrolled page); only a change from one worker to another is an update.
  let controlled = !!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (controlled) updateReady = true
    controlled = true
  })

  let lastCheck = Date.now()
  const check = () => {
    lastCheck = Date.now()
    registration.update().catch(() => { /* offline or server hiccup: try next time */ })
  }
  window.setInterval(check, CHECK_INTERVAL_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastCheck > FOCUS_CHECK_THROTTLE_MS) check()
  })
}

/** True when an in-app navigation should become a full load of the new version. */
export function shouldApplyUpdateOnNavigate(): boolean {
  // Demo mode lives in memory only; a reload would drop the visitor out of it
  return updateReady && !document.documentElement.dataset.demo
}
