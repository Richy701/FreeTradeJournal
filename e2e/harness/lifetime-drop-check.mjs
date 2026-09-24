// Visual check for the lifetime drop (25 Sep to 2 Oct 2026): screenshots the
// public drop page in all three phases, the landing eyebrow pill, and the
// in-app strip (demo mode with the dev preview override). Runs against a dev
// server, not vite preview, because the ?drop= phase override is dev-only.
// Usage: node e2e/harness/lifetime-drop-check.mjs <outDir>
import { createServer } from 'vite'
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const outDir = process.argv[2]
if (!outDir) { console.error('outDir required'); process.exit(2) }
fs.mkdirSync(outDir, { recursive: true })

const PORT = 5301
const server = await createServer({ root, server: { port: PORT, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch()
const failures = []

async function shot(name, url, { viewport = { width: 1440, height: 1100 }, theme = 'dark', demo = false, fullPage = true, assertText = [] } = {}) {
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' })
  page.setDefaultTimeout(20000)
  const errors = []
  // TradingView's events embed throws inside its own script on the demo dashboard; not ours.
  page.on('pageerror', (e) => { if (!/tradingview/.test(e.stack || '')) errors.push(e.message) })
  await page.addInitScript((t) => {
    localStorage.setItem('ftj-theme', t)
    localStorage.setItem('cookieConsent', JSON.stringify({ necessary: true, analytics: false, timestamp: new Date().toISOString(), version: 2 }))
  }, theme)
  if (demo) {
    await page.goto(`http://localhost:${PORT}/`)
    await page.evaluate((phase) => sessionStorage.setItem('lifetime-drop-preview', phase), demo)
    await page.getByText('View Live Demo').first().click()
    await page.waitForURL('**/dashboard')
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(2500)
    await page.getByRole('button', { name: 'Decline' }).click().catch(() => {})
  } else {
    await page.goto(`http://localhost:${PORT}${url}`)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(1800)
  }
  const text = (await page.evaluate(() => document.body.innerText)).toLowerCase()
  for (const t of assertText) if (!text.includes(t.toLowerCase())) failures.push(`${name}: missing "${t}"`)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  if (overflow) failures.push(`${name}: horizontal overflow`)
  if (errors.length) failures.push(`${name}: page errors ${errors.join(' | ')}`)
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage })
  console.log('captured', name)
  await page.close()
}

try {
  await shot('drop-before', '/lifetime-drop?drop=before', { assertText: ['Lifetime Pro is back.', '$199', 'Opens in', 'Opens Friday 25 September', 'Closes Friday 2 October'] })
  await shot('drop-open', '/lifetime-drop?drop=open', { assertText: ['Lifetime Pro is back.', 'Get Lifetime Pro for $199', 'Closes in', 'Closes Friday 2 October'] })
  await shot('drop-closed', '/lifetime-drop?drop=closed', { assertText: ['The Lifetime Pro drop has closed.', 'See current pricing'] })
  await shot('drop-before-light', '/lifetime-drop?drop=before', { theme: 'light', assertText: ['Opens in'] })
  await shot('drop-open-light', '/lifetime-drop?drop=open', { theme: 'light', assertText: ['$199'] })
  await shot('drop-before-phone', '/lifetime-drop?drop=before', { viewport: { width: 390, height: 844 }, assertText: ['Opens in'] })
  await shot('drop-open-phone', '/lifetime-drop?drop=open', { viewport: { width: 390, height: 844 }, assertText: ['$199'] })
  await shot('landing-pill-before', '/?drop=before', { fullPage: false, assertText: ['Lifetime Pro is back'] })
  await shot('landing-pill-open', '/?drop=open', { fullPage: false, assertText: ['Lifetime Pro is back'] })
  await shot('strip-before', '', { demo: 'before', fullPage: false, assertText: ['Lifetime Pro is back Friday 9:30 AM New York'] })
  await shot('strip-open', '', { demo: 'open', fullPage: false, assertText: ['Lifetime Pro is back for one week'] })
  await shot('strip-before-phone', '', { demo: 'before', viewport: { width: 390, height: 844 }, fullPage: false, assertText: ['Lifetime Pro is back'] })
  await browser.close(); await server.close()
  if (failures.length) { console.error('FAILURES:\n' + failures.join('\n')); process.exit(1) }
  console.log('all good')
  process.exit(0)
} catch (e) {
  console.error('harness error:', e.message)
  await browser.close(); await server.close(); process.exit(2)
}
