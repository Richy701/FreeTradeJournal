// Smoke-test the demo analytics events: intercept PostHog's /api/ingest
// requests in the built app, enter demo mode, and assert demo_entered and
// the demo_session super property show up in captured payloads.
import { preview } from 'vite'
import { chromium } from 'playwright'
import zlib from 'node:zlib'

const root = '/Users/richy/FreeTradeJournal'
const PORT = 5303

const server = await preview({ root, preview: { port: PORT, strictPort: true }, logLevel: 'error' })
const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  // posthog-js drops all events from bot user agents, and headless Chromium
  // reports "HeadlessChrome" — masquerade as a normal browser so captures fire.
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
})
page.setDefaultTimeout(15000)

const payloads = []
const decodeBody = (buf) => {
  if (!buf) return ''
  try { return zlib.gunzipSync(buf).toString('utf8') } catch { /* not gzip */ }
  const raw = buf.toString('utf8')
  // Older transport: form-encoded data=<urlencoded base64 JSON>
  const m = raw.match(/^data=(.*)$/s)
  if (m) {
    try { return Buffer.from(decodeURIComponent(m[1]), 'base64').toString('utf8') } catch { /* keep raw */ }
  }
  return raw
}
await page.route('**/api/ingest/**', async (route) => {
  const req = route.request()
  const url = req.url()
  const text = decodeBody(req.postDataBuffer())
  payloads.push(text)
  if (req.method() === 'POST') console.log('[ingest]', url.slice(0, 110), '::', text.slice(0, 160).replace(/\n/g, ' '))
  if (url.includes('.js')) {
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  } else if (url.includes('/flags')) {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"flags":{},"featureFlags":{},"featureFlagPayloads":{},"errorsWhileComputingFlags":false}' })
  } else {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":1}' })
  }
})

// posthog-js debug mode logs every capture to the console — a network-independent
// signal that the events fired. navigator.webdriver also trips its bot filter.
await page.addInitScript(() => {
  try { localStorage.setItem('ph_debug', 'true') } catch {}
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  // Client Hints still advertise HeadlessChrome — the third bot signal.
  Object.defineProperty(navigator, 'userAgentData', {
    get: () => ({
      brands: [
        { brand: 'Chromium', version: '126' },
        { brand: 'Google Chrome', version: '126' },
        { brand: 'Not-A.Brand', version: '99' },
      ],
      mobile: false,
      platform: 'macOS',
    }),
  })
})
const consoleLines = []
page.on('console', (msg) => consoleLines.push(msg.text()))

try {
  await page.goto(`http://localhost:${PORT}/`)
  // Grant analytics consent if the cookie banner is up
  const accept = page.getByRole('button', { name: 'Accept analytics' })
  if (await accept.isVisible().catch(() => false)) await accept.click()

  await page.getByText('View Live Demo').first().click()
  await page.waitForURL('**/dashboard')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(6000) // let posthog flush its batch

  const phLines = consoleLines.filter((l) => /posthog/i.test(l))
  console.log(`console lines: ${consoleLines.length}, posthog lines: ${phLines.length}`)
  for (const l of phLines.slice(0, 15)) console.log('[console]', l.slice(0, 200))
  const state = await page.evaluate(() => ({
    phDebug: localStorage.getItem('ph_debug'),
    hasWindowPosthog: typeof window.posthog,
  }))
  console.log('[state]', JSON.stringify(state))

  const all = payloads.join('\n') + '\n' + consoleLines.join('\n')
  const checks = {
    demo_entered: all.includes('demo_entered'),
    demo_session_superprop: all.includes('demo_session'),
  }
  console.log(JSON.stringify(checks, null, 2))
  console.log(`ingest requests captured: ${payloads.length}`)
  process.exitCode = Object.values(checks).every(Boolean) ? 0 : 1
} finally {
  await browser.close()
  await server.close()
}
