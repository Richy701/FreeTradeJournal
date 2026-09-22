// Read-only runtime check for the lazy-loaded PostHog SDK (src/lib/posthog.ts).
// Proves, against the production build served by vite preview, that:
//   1. the SDK chunk is not part of the first paint (fetched after FCP, not preloaded)
//   2. no "You must initialize PostHog" console errors (queued calls, not dropped)
//   3. the events made before the SDK arrived ($pageview, app_opened, page_viewed)
//      are actually sent once it loads
// Usage: node e2e/harness/posthog-lazy-check.mjs
import { preview } from 'vite'
import { chromium } from 'playwright'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = process.env.HARNESS_ROOT || path.resolve(__dirname, '../..')
const PORT = 5299
const server = await preview({ root, preview: { port: PORT, strictPort: true }, logLevel: 'error' })
// posthog-js also treats navigator.webdriver === true as a bot and drops every
// event; this flag keeps Chromium from announcing automation.
const browser = await chromium.launch({ args: ['--disable-blink-features=AutomationControlled'] })
const failures = []

function decodeBody(request) {
  const buf = request.postDataBuffer()
  if (!buf) return null
  try {
    // gzip magic bytes: the SDK gzips batches without flagging it in the URL
    if (buf[0] === 0x1f && buf[1] === 0x8b) return JSON.parse(zlib.gunzipSync(buf).toString('utf8'))
    const text = buf.toString('utf8')
    if (text.startsWith('data=')) return JSON.parse(Buffer.from(decodeURIComponent(text.slice(5)), 'base64').toString('utf8'))
    return JSON.parse(text)
  } catch {
    return null
  }
}

try {
  // posthog-js drops every event from a bot user agent, and headless Chromium
  // announces itself as one; use a regular desktop UA so capture is live.
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  })
  page.setDefaultTimeout(15000)
  const consoleErrors = []
  const sentEvents = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))
  const ingestRequests = []
  const otherRequests = []
  page.on('request', (r) => {
    const u = r.url()
    if (!u.startsWith(`http://localhost:${PORT}/assets/`) && !u.includes('/api/ingest/')) otherRequests.push(`${r.method()} ${u.slice(0, 120)}`)
  })
  // Mirror the production rewrites in vercel.json for the SDK's own config,
  // helper scripts and flags calls (real PostHog replies, nothing recorded),
  // but swallow the event endpoint so this run never lands in analytics.
  await page.route('**/api/ingest/**', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    ingestRequests.push(`${req.method()} ${url.pathname}`)
    const isEventPost = req.method() === 'POST' && /\/(e|batch|i\/v0\/e)\/?$/.test(url.pathname)
    if (isEventPost) {
      const body = decodeBody(req)
      const events = Array.isArray(body) ? body : body?.batch ?? (body ? [body] : [])
      for (const ev of events) if (ev?.event) sentEvents.push(ev.event)
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":1}' })
      return
    }
    const rest = url.pathname.replace(/^\/api\/ingest\//, '')
    const upstream = rest.startsWith('static/')
      ? `https://eu-assets.i.posthog.com/${rest}${url.search}`
      : `https://eu.i.posthog.com/${rest}${url.search}`
    // route.continue() cannot switch protocols, so fetch upstream ourselves.
    try {
      const res = await fetch(upstream, {
        method: req.method(),
        headers: { 'content-type': req.headers()['content-type'] ?? 'application/json' },
        body: req.method() === 'POST' ? req.postDataBuffer() : undefined,
      })
      await route.fulfill({
        status: res.status,
        contentType: res.headers.get('content-type') ?? 'application/octet-stream',
        body: Buffer.from(await res.arrayBuffer()),
      })
    } catch (e) {
      await route.fulfill({ status: 502, body: String(e) })
    }
  })

  // ...and it checks navigator.userAgentData.brands too, which headless
  // Chromium still reports as "HeadlessChrome" regardless of the UA string.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgentData', { get: () => undefined, configurable: true })
  })
  await page.goto(`http://localhost:${PORT}/`)
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(6000)

  const timing = await page.evaluate(() => {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null
    const res = performance.getEntriesByType('resource')
    const analytics = res.find((r) => r.name.includes('vendor-analytics'))
    const main = res.find((r) => /\/assets\/index-[^/]+\.js$/.test(r.name))
    const preloaded = !!document.querySelector('link[rel="modulepreload"][href*="vendor-analytics"]')
    const nav = performance.getEntriesByType('navigation')[0]
    return {
      fcp,
      loadEventEnd: nav?.loadEventEnd ?? null,
      analyticsStart: analytics?.startTime ?? null,
      mainStart: main?.startTime ?? null,
      preloaded,
    }
  })

  console.log('timing', timing)
  console.log('ingest requests', ingestRequests)
  console.log('other requests', otherRequests)
  console.log('events sent', sentEvents)

  if (timing.preloaded) failures.push('vendor-analytics chunk is modulepreloaded in index.html')
  if (timing.analyticsStart === null) failures.push('vendor-analytics chunk was never fetched')
  else if (timing.fcp !== null && timing.analyticsStart < timing.fcp) failures.push(`analytics chunk fetched before FCP (${timing.analyticsStart} < ${timing.fcp})`)
  const uninit = consoleErrors.filter((t) => /must initialize PostHog/i.test(t))
  if (uninit.length) failures.push(`${uninit.length} uninitialised-PostHog console errors`)
  const pageErrors = consoleErrors.filter((t) => t.startsWith('pageerror:'))
  if (pageErrors.length) failures.push(`page errors: ${pageErrors.join(' | ')}`)
  for (const name of ['$pageview', 'app_opened', 'page_viewed']) {
    if (!sentEvents.includes(name)) failures.push(`event ${name} was not sent after the SDK loaded`)
  }

  await page.close()
} catch (e) {
  failures.push(`harness error: ${e.message}`)
} finally {
  await browser.close()
  await server.close()
}

if (failures.length) {
  console.error('FAIL')
  for (const f of failures) console.error(' -', f)
  process.exit(1)
}
console.log('PASS: PostHog loads after first paint and replays early events')
process.exit(0)
