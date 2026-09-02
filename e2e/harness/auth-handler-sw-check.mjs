// Proves whether the service worker swallows the Firebase auth handler
// navigation (/__/auth/handler) and serves the SPA shell instead.
// Usage: node e2e/harness/auth-handler-sw-check.mjs [baseUrl]
import { chromium } from 'playwright'

const base = process.argv[2] || 'https://www.freetradejournal.com'
const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()
// --mock-handler: local builds have no proxy, so answer the handler from the
// network layer. If the SW serves the shell from cache this never fires.
if (process.argv.includes('--mock-handler')) {
  await context.route('**/__/auth/handler*', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<html><body><script>fireauth.oauthhelper.widget.initialize()</script></body></html>' }))
}
page.setDefaultTimeout(20000)

// 1. Load the app so the service worker installs and takes control.
await page.goto(`${base}/login`, { waitUntil: 'load' })
await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 20000 })
  .catch(() => {})
const controlled = await page.evaluate(() => !!navigator.serviceWorker?.controller)
console.log('service worker controlling page:', controlled)

// 2. Navigate (same as the popup does) to the auth handler.
await page.goto(`${base}/__/auth/handler?apiKey=x&appName=%5BDEFAULT%5D&authType=signInViaPopup&providerId=google.com`, { waitUntil: 'load' })
await page.waitForTimeout(3000)
const html = await page.content()
const isHandler = html.includes('fireauth.oauthhelper')
const isSpaShell = html.includes('theme-init.js') || html.includes('id="root"')
const isSpa404 = /Page Not Found/i.test(html)
console.log('handler page served:', isHandler)
console.log('SPA shell served:', isSpaShell)
console.log('SPA 404 route rendered:', isSpa404)
console.log('title:', await page.title())
await browser.close()
process.exit(isHandler && !isSpa404 ? 0 : 1)
