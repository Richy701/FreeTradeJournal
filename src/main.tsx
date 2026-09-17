import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import './utils/emergency-recovery'
import { initPostHog } from './lib/posthog'
import { installThirdPartyErrorFilter } from './lib/suppress-third-party-noise'
import { installStaleChunkReloadListener } from './lib/lazy-with-retry'
import { captureReferral } from './lib/referral'
import { installTranslateDomGuard } from './lib/translate-dom-guard'
import { installLoopCrashContext, noteComponentStack } from './lib/loop-crash-context'

// Before React renders: page translators must not be able to crash the app.
installTranslateDomGuard()

// Register before PostHog init so blocked-TradingView chunk errors are filtered
// out before its global exception handler sees them.
installThirdPartyErrorFilter()

// Reload once when a deploy invalidates this tab's chunk hashes, before the
// failure reaches PostHog as an unhandled rejection.
installStaleChunkReloadListener()

// Start recording app activity before anything can crash (see the module).
installLoopCrashContext()

initPostHog();

// Persist ?ref= partner attribution before any navigation strips it
captureReferral();

createRoot(document.getElementById('root')!, {
  // Same as React's default (report to the window, where PostHog listens),
  // but keep the component stack first so crash reports can include it.
  onUncaughtError(error, errorInfo) {
    noteComponentStack(errorInfo.componentStack)
    if (typeof reportError === 'function') reportError(error)
    else setTimeout(() => { throw error })
  },
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for PWA offline support
const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(
      new CustomEvent('pwa-update-available', {
        detail: { updateSW },
      })
    );
  },
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('pwa-offline-ready'));
  },
})
