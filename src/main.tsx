import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'
import './utils/emergency-recovery'

Sentry.init({
  dsn: "https://34d91e7fbdbb0127f23418669c1d3eac@o4511180938543105.ingest.de.sentry.io/4511180939591760",
})

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
