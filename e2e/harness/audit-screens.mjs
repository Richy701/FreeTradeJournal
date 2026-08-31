// Read-only UI audit: screenshot every main app page in demo mode.
// Usage: node e2e/harness/audit-screens.mjs <outDir>
import { preview } from 'vite'
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const outDir = process.argv[2]
if (!outDir) { console.error('outDir required'); process.exit(2) }
fs.mkdirSync(outDir, { recursive: true })

const PORT = 5299
const server = await preview({
  root,
  preview: { port: PORT, strictPort: true },
  logLevel: 'error',
})

const ROUTES = [
  ['dashboard', '/dashboard'],
  ['trades', '/trades'],
  ['journal', '/journal'],
  ['goals', '/goals'],
  ['coach', '/coach'],
  ['prop-tracker', '/prop-tracker'],
  ['ideas', '/ideas'],
  ['trade-ideas', '/trade-ideas'],
  ['calculator', '/calculator'],
  ['settings', '/settings'],
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(15000)
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

const navTo = async (route) => {
  await page.evaluate((p) => {
    window.history.pushState({}, '', p)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, route)
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2500)
}

// The app scrolls inside SidebarInset, not the body, so fullPage screenshots
// clip at the viewport. Scroll the inner container stepwise instead.
const captureScrolled = async (name, maxShots = 5) => {
  const step = 820
  for (let i = 0; i < maxShots; i++) {
    await page.screenshot({ path: path.join(outDir, `${name}-${i}.png`) })
    const done = await page.evaluate((s) => {
      const el = [...document.querySelectorAll('*')].find(
        (e) => e.scrollHeight > e.clientHeight + 100 && e.clientHeight > 400 &&
          ['auto', 'scroll'].includes(getComputedStyle(e).overflowY)
      ) || document.scrollingElement
      const before = el.scrollTop
      el.scrollTop = before + s
      return el.scrollTop === before // no movement => bottom reached
    }, step)
    await page.waitForTimeout(600)
    if (done) break
  }
  // reset scroll for the next page
  await page.evaluate(() => {
    for (const e of document.querySelectorAll('*')) if (e.scrollTop) e.scrollTop = 0
  })
  console.log('captured', name)
}

try {
  await page.goto(`http://localhost:${PORT}/`)
  await page.getByText('View Live Demo').first().click()
  await page.waitForURL('**/dashboard')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(4000)
  await page.getByRole('button', { name: 'Decline' }).click().catch(() => {})
  await page.waitForTimeout(500)

  for (const [name, route] of ROUTES) {
    if (route !== '/dashboard') await navTo(route)
    await captureScrolled(name)
  }

  // Mobile pass on the two most-used pages
  await page.setViewportSize({ width: 390, height: 844 })
  for (const [name, route] of [['dashboard-mobile', '/dashboard'], ['trades-mobile', '/trades']]) {
    await navTo(route)
    await captureScrolled(name, 4)
  }

  if (errors.length) console.log('page errors:', errors.slice(0, 5))
  await browser.close()
  await server.close()
  process.exit(0)
} catch (e) {
  console.error('harness error:', e.message)
  if (errors.length) console.log('page errors:', errors.slice(0, 5))
  await browser.close()
  await server.close()
  process.exit(2)
}
