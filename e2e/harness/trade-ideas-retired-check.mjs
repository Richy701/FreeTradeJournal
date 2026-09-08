// Verifies the Trade Ideas retirement: no Community group in the sidebar,
// no announcement strip, and /trade-ideas redirects to the dashboard.
// Usage: node e2e/harness/trade-ideas-retired-check.mjs <outDir>
import { preview } from 'vite'
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const outDir = process.argv[2]
if (!outDir) { console.error('outDir required'); process.exit(2) }
fs.mkdirSync(outDir, { recursive: true })

const PORT = 5298
const server = await preview({ root, preview: { port: PORT, strictPort: true }, logLevel: 'error' })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(15000)
let failed = false
try {
  await page.goto(`http://localhost:${PORT}/`)
  await page.getByText('View Live Demo').first().click()
  await page.waitForURL('**/dashboard')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(3000)
  await page.getByRole('button', { name: 'Decline' }).click().catch(() => {})
  // Expand the sidebar so labels are visible
  const trigger = page.locator('[data-sidebar="trigger"]').first()
  const state = await page.locator('[data-sidebar="sidebar"]').first().getAttribute('data-state').catch(() => null)
  const collapsed = await page.locator('[data-state="collapsed"][data-collapsible]').count()
  if (collapsed > 0) await trigger.click().catch(() => {})
  await page.waitForTimeout(800)
  const groupLabels = await page.locator('[data-sidebar="group-label"]').allInnerTexts()
  console.log('sidebar groups:', groupLabels.join(' | '), state ? '' : '')
  await page.screenshot({ path: path.join(outDir, 'dashboard-sidebar.png') })
  const body = await page.locator('body').innerText()
  const hasCommunity = /\bCommunity\b/.test(body)
  const hasTradeIdeas = /Trade Ideas/.test(body)
  console.log('sidebar Community label present:', hasCommunity)
  console.log('"Trade Ideas" text present:', hasTradeIdeas)
  if (hasCommunity || hasTradeIdeas) failed = true

  await page.evaluate(() => { window.history.pushState({}, '', '/trade-ideas'); window.dispatchEvent(new PopStateEvent('popstate')) })
  await page.waitForTimeout(2000)
  const finalPath = new URL(page.url()).pathname
  console.log('/trade-ideas landed on:', finalPath)
  if (finalPath !== '/dashboard') failed = true
  await page.screenshot({ path: path.join(outDir, 'after-redirect.png') })
} finally {
  await browser.close()
  await server.close()
}
console.log(failed ? 'FAIL' : 'PASS')
process.exit(failed ? 1 : 0)
