import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import './utils/emergency-recovery'
import { initPostHog } from './lib/posthog'
import { installThirdPartyErrorFilter } from './lib/suppress-third-party-noise'
import { captureReferral } from './lib/referral'

// Register before PostHog init so blocked-TradingView chunk errors are filtered
// out before its global exception handler sees them.
installThirdPartyErrorFilter()

initPostHog();

// Persist ?ref= partner attribution before any navigation strips it
captureReferral();

createRoot(document.getElementById('root')!).render(
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
